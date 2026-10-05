import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Job from '../models/Job';
import User from '../models/User';
import Dashboard from '../models/Dashboard';
import { emitToUser, emitToRole, broadcastEvent } from '../socket';
import { clearDashboardCache } from './dashboardRoutes';

const router = Router();

// GET all orders — with optional ?email= filter for customer dashboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const emailFilter = req.query.email as string | undefined;
    const query = emailFilter ? { customerEmail: emailFilter.toLowerCase() } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function extractCleanJobTitle(raw: string): string {
  if (!raw) return 'CCTV Installation & Service';
  const parts = raw.split('|').map(p => p.trim()).filter(Boolean);
  let main = parts[0] || raw;
  const lastPart = parts.length > 1 ? parts[parts.length - 1] : '';
  const modelMatch = lastPart.match(/\b([A-Z0-9]{2,5}-[A-Z0-9]{2,6})\b/i);

  main = main
    .replace(/\s*for\s+(Home|Outdoor|Indoor|Office|Shop|Commercial)\s*(Outdoor|Indoor|Home)?/gi, '')
    .replace(/\s*\|\s*/g, ' ')
    .trim();

  if (modelMatch && !main.toLowerCase().includes(modelMatch[0].toLowerCase())) {
    main = `${main} (${modelMatch[0]})`;
  }
  if (main.length > 65) {
    main = main.slice(0, 62).trim() + '...';
  }
  return main;
}

function extractCleanCategory(rawCategory: string, rawTitle?: string): string {
  const text = ((rawCategory || '') + ' ' + (rawTitle || '')).toLowerCase();
  if (text.includes('4g') || text.includes('sim')) return '4G Smart Camera';
  if (text.includes('solar')) return 'Solar Camera';
  if (text.includes('dome')) return 'Dome Camera Setup';
  if (text.includes('bullet')) return 'Bullet Camera Setup';
  if (text.includes('wifi') || text.includes('wireless')) return 'WiFi Smart Cam';
  if (text.includes('nvr') || text.includes('dvr')) return 'NVR / DVR Setup';
  if (text.includes('amc') || text.includes('maintenance')) return 'AMC & Service';
  return 'CCTV Installation';
}

// POST create order (for Customer Website)
router.post('/', async (req: Request, res: Response) => {
  try {
    let prefix = 'SK-ORD';
    const sType = String(req.body.serviceType || '').toLowerCase();
    const qText = String(req.body.customerQuery || '').toLowerCase();
    if (sType.includes('visit') || qText.includes('client visit')) {
      prefix = 'SK-VST';
    } else if (sType.includes('service') || sType.includes('repair') || qText.includes('service request')) {
      prefix = 'SK-SRV';
    }
    const orderNumber = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerName = (req.body.customerName && req.body.customerName.trim()) ? req.body.customerName.trim() : 'Customer Client';
    const customerPhone = (req.body.customerPhone && req.body.customerPhone.trim()) ? req.body.customerPhone.trim() : '0000000000';
    const shippingAddress = (req.body.shippingAddress && req.body.shippingAddress.trim()) ? req.body.shippingAddress.trim() : 'Site Location';
    const customerEmail = (req.body.customerEmail && req.body.customerEmail.trim())
      ? req.body.customerEmail.trim().toLowerCase()
      : `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@sktech.com`;
    const totalAmount = typeof req.body.totalAmount === 'number' ? req.body.totalAmount : (parseFloat(req.body.totalAmount) || 0);

    const subTechs = Array.isArray(req.body.subTechnicians) ? req.body.subTechnicians : [];

    let finalVoiceUrl = req.body.voiceNoteUrl || req.body.voiceNoteBase64 || '';
    if (req.body.voiceNoteBase64 && typeof req.body.voiceNoteBase64 === 'string' && req.body.voiceNoteBase64.startsWith('data:audio') && req.body.voiceNoteBase64.length > 300) {
      try {
        const parts = req.body.voiceNoteBase64.split(',');
        if (parts.length === 2) {
          const audioBuffer = Buffer.from(parts[1], 'base64');
          if (audioBuffer.length > 300) {
            const mimeMatch = req.body.voiceNoteBase64.match(/data:(audio\/[^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';
            let ext = 'webm';
            if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) ext = 'm4a';
            else if (mimeType.includes('ogg')) ext = 'ogg';
            else if (mimeType.includes('wav')) ext = 'wav';
            else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3';

            const s3Key = `voice-notes/${orderNumber}-${Date.now()}.${ext}`;
            const s3 = new S3Client({
              region: process.env.AWS_REGION || 'ap-south-1',
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
              },
            });
            
            await s3.send(new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME || 'sk-cctv-website',
              Key: s3Key,
              Body: audioBuffer,
              ContentType: mimeType,
              ContentLength: audioBuffer.length
            }));

            finalVoiceUrl = `https://${process.env.AWS_BUCKET_NAME || 'sk-cctv-website'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;
            console.log('✅ Uploaded REAL Customer Voice Note to AWS S3 Bucket: Size:', audioBuffer.length, 'bytes | MIME:', mimeType, '| URL:', finalVoiceUrl);
          }
        }
      } catch (s3Err: any) {
        console.error('❌ AWS S3 Voice Upload Error:', s3Err.message);
        finalVoiceUrl = req.body.voiceNoteBase64 || req.body.voiceNoteUrl || '';
      }
    }

    const newOrder = new Order({
      ...req.body,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      customerQuery: req.body.customerQuery || req.body.problemDescription || '',
      scheduledDate: req.body.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTimeSlot: req.body.scheduledTimeSlot || '02:00 PM',
      hasVoiceNote: Boolean(finalVoiceUrl && finalVoiceUrl.length > 50),
      voiceNoteDuration: req.body.voiceNoteDuration || '00:18',
      voiceNoteUrl: finalVoiceUrl,
      voiceNoteBase64: finalVoiceUrl,
      siteImages: req.body.siteImages || req.body.images || [],
      totalAmount,
      subTechnicians: subTechs,
      orderStatus: 'PROCESSING'
    });

    const savedOrder = await newOrder.save();

    // Always automate the assignment for all orders (Option A requested by user)
    if (true) {
      const allTechs = await User.find({ role: 'TECHNICIAN', isActive: true });
      const activeJobs = await Job.find({
        status: { $in: ['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED', 'ASSIGNMENT_PENDING_ACCEPTANCE', 'WAITING_ADMIN_APPROVAL'] }
      } as any);

      const busyTechIds = new Set<string>();
      const busyTechNames = new Set<string>();
      activeJobs.forEach((j: any) => {
        (j.assignedTechnicians || []).forEach((t: any) => {
          if (t.id) busyTechIds.add(t.id.toString());
          if (t.name) busyTechNames.add(t.name.toLowerCase().trim());
        });
      });

      const freeTechs = allTechs.filter((t: any) => 
        !busyTechIds.has(t._id.toString()) && 
        !busyTechNames.has(t.name.toLowerCase().trim())
      );

      let assignedTech: any = null;
      const requestedTech = (req.body.assignedTechnician || req.body.assignedTechnicianName || '').toString().trim();
      if (requestedTech && requestedTech.toLowerCase() !== 'unassigned') {
        const reqLower = requestedTech.toLowerCase();
        assignedTech = allTechs.find((t: any) => 
          t.name.toLowerCase().trim() === reqLower || 
          t._id.toString() === requestedTech
        ) || null;

        if (!assignedTech) {
          const mongoose = require('mongoose');
          assignedTech = {
            _id: new mongoose.Types.ObjectId(),
            name: requestedTech,
            phone: '',
            isAvailable: true,
            save: async () => {}
          };
        }
      }

      if (!assignedTech && (!requestedTech || requestedTech.toLowerCase() === 'unassigned')) {
        assignedTech = freeTechs.length > 0 ? freeTechs[0] : null;
      }

      if (assignedTech) {
        newOrder.assignedTechnician = assignedTech.name;
        newOrder.assignedTechnicianName = assignedTech.name;
        newOrder.assignedTechnicianId = assignedTech._id.toString();
        await newOrder.save();

        if (typeof assignedTech.save === 'function') {
          assignedTech.isAvailable = false;
          assignedTech.currentJobId = orderNumber;
          await assignedTech.save();
        }

        require('../utils/pushHelper').sendPushToUser(assignedTech._id.toString(), {
          title: 'New Order Assigned!',
          body: `You have been assigned to order: ${orderNumber}`,
          url: '/technician'
        });

        require('../socket').emitToUser(assignedTech._id.toString(), 'job:assigned_to_you', {
          jobId: newOrder._id,
          jobCode: orderNumber
        });
        if (assignedTech.name) {
          require('../socket').emitToUser(assignedTech.name, 'job:assigned_to_you', {
            jobId: newOrder._id,
            jobCode: orderNumber
          });
        }

        const rawItemTitles = req.body.items?.map((item: any) => item.title).join(', ') || 'CCTV Installation';
        const cleanJobTitle = extractCleanJobTitle(rawItemTitles);
        const cleanJobCat = extractCleanCategory(req.body.category || rawItemTitles, rawItemTitles);

        await Job.create({
          jobCode: orderNumber,
          title: cleanJobTitle,
          category: cleanJobCat,
          status: 'ASSIGNMENT_PENDING_ACCEPTANCE',
          priority: 'MEDIUM',
          scheduledDate: req.body.scheduledDate || new Date().toISOString().split('T')[0],
          scheduledTimeSlot: req.body.scheduledTimeSlot || '02:00 PM',
          startDate: new Date().toISOString().split('T')[0],
          estimatedDays: 1,
          requiredTechniciansCount: 1,
          orderCategory: 'Delivery & Installation',
          customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: shippingAddress,
            city: req.body.city || req.body.customerCity || req.body.state || 'Local',
            postalCode: req.body.postalCode || req.body.zipcode || req.body.customerPostalCode || '600001'
          },
          customerQuery: req.body.customerQuery || '',
          siteImages: req.body.siteImages || [],
          hasVoiceNote: Boolean(finalVoiceUrl && finalVoiceUrl.length > 50),
          voiceNoteDuration: req.body.voiceNoteDuration || '00:18',
          voiceNoteUrl: finalVoiceUrl,
          voiceNoteBase64: finalVoiceUrl,
          assignedTechnicians: [
            {
              id: assignedTech._id.toString(),
              name: assignedTech.name,
              phone: assignedTech.phone || ''
            }
          ],
          subTechnicians: subTechs
        });
      }
    }

    clearDashboardCache();
    res.json({ success: true, order: savedOrder, data: savedOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update order details (for admin dashboard edit)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    let query: any = { _id: orderId };
    
    if (orderId.startsWith('SK-') || orderId.startsWith('ORD-')) {
      query = { orderNumber: orderId };
    }

    let updatedOrder = await Order.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true }
    );

    if (!updatedOrder) {
      // Fallback find by orderNumber or MongoId
      updatedOrder = await Order.findOneAndUpdate(
        { orderNumber: orderId },
        { $set: req.body },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const ordNum = updatedOrder.orderNumber || orderId;
    const cleanId = ordNum.replace(/^#/, '').replace(/^SK-/, '').replace(/^ORD-/, '').trim();

    // 1. Sync Job Collection in MongoDB
    try {
      const jobFields: any = {};
      if (req.body.customerName || req.body.customerPhone || req.body.shippingAddress) {
        jobFields.customer = {
          name: req.body.customerName || updatedOrder.customerName,
          phone: req.body.customerPhone || updatedOrder.customerPhone,
          email: updatedOrder.customerEmail || '',
          address: req.body.shippingAddress || updatedOrder.shippingAddress
        };
      }
      if (req.body.assignedTechnician) {
        jobFields.assignedTechnicians = [{ id: 'main-tech', name: req.body.assignedTechnician }];
      }
      if (req.body.subTechnicians) {
        jobFields.subTechnicians = req.body.subTechnicians;
      }
      if (req.body.totalAmount !== undefined) {
        jobFields.financials = { totalValue: Number(req.body.totalAmount) || 0 };
      }
      if (req.body.orderStatus === 'DELIVERED') {
        jobFields.status = 'APPROVED';
      }

      if (Object.keys(jobFields).length > 0) {
        await Job.updateMany(
          {
            $or: [
              { jobCode: ordNum },
              { jobCode: `#${ordNum}` },
              { jobCode: `SK-${ordNum}` },
              { jobCode: `SK-ORD-${cleanId}` },
              { jobCode: `ORD-${cleanId}` },
              { jobCode: cleanId }
            ]
          },
          { $set: jobFields }
        );
      }
    } catch (jobSyncErr) {
      console.warn('Job sync error in order PUT:', jobSyncErr);
    }

    // 2. Sync Dashboard collection document in MongoDB
    try {
      const Dashboard = require('../models/Dashboard').default;
      const dashboardDoc = await Dashboard.findOne();
      if (dashboardDoc) {
        let dashChanged = false;
        
        if (Array.isArray(dashboardDoc.orders)) {
          dashboardDoc.orders.forEach((o: any) => {
            const isMatch = (o.id && (o.id === ordNum || o.id === cleanId || o.id.includes(cleanId))) ||
                            (o.customerName && updatedOrder.customerName && o.customerName.toLowerCase().trim() === updatedOrder.customerName?.toLowerCase().trim());
            if (isMatch) {
              if (req.body.customerName) o.customerName = req.body.customerName;
              if (req.body.customerPhone) o.customerPhone = req.body.customerPhone;
              if (req.body.shippingAddress) o.shippingAddress = req.body.shippingAddress;
              if (req.body.totalAmount !== undefined) o.totalAmount = req.body.totalAmount;
              if (req.body.assignedTechnician) o.assignedTechnician = req.body.assignedTechnician;
              if (req.body.subTechnicians) o.subTechnicians = req.body.subTechnicians;
              if (req.body.serviceType) o.serviceType = req.body.serviceType;
              if (req.body.orderStatus) {
                o.orderStatus = req.body.orderStatus;
                o.status = req.body.orderStatus === 'DELIVERED' ? 'Approved' : (o.status || 'Processing');
              }
              dashChanged = true;
            }
          });
        }

        if (Array.isArray(dashboardDoc.projects)) {
          dashboardDoc.projects.forEach((p: any) => {
            const isMatch = (p.id && (p.id === ordNum || p.id === cleanId || p.id.includes(cleanId)));
            if (isMatch) {
              if (req.body.customerName) p.customer = req.body.customerName;
              if (req.body.shippingAddress) p.location = req.body.shippingAddress;
              if (req.body.assignedTechnician) p.technician = req.body.assignedTechnician;
              if (req.body.serviceType) p.name = req.body.serviceType;
              if (req.body.orderStatus === 'DELIVERED') p.status = 'Approved';
              dashChanged = true;
            }
          });
        }

        if (dashChanged) {
          dashboardDoc.markModified('orders');
          dashboardDoc.markModified('projects');
          await dashboardDoc.save();
        }
      }
    } catch (dashSyncErr) {
      console.warn('Dashboard sync error in order PUT:', dashSyncErr);
    }

    clearDashboardCache();
    broadcastEvent('dashboard:updated', {});
    res.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// DELETE /api/orders/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    let deletedOrder = await Order.findOneAndDelete({ orderNumber: orderId });
    if (!deletedOrder) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        deletedOrder = await Order.findByIdAndDelete(orderId);
      }
    }

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Also delete any associated jobs
    await Job.findOneAndDelete({ jobCode: deletedOrder.orderNumber }).catch(() => {});

    clearDashboardCache();
    broadcastEvent('dashboard:updated', {});
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
