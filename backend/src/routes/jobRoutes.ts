import { Router, Request, Response } from 'express';
import Job from '../models/Job';
import Order from '../models/Order';
import User from '../models/User';
import Dashboard from '../models/Dashboard';
import TechnicianReport from '../models/TechnicianReport';
import TechnicianAttendance from '../models/TechnicianAttendance';
import { emitToUser, emitToRole, emitToJob, broadcastEvent } from '../socket';

const router = Router();

// 📡 Active Broadcast Endpoint (for 20-second Radar popup on incoming jobs)
router.get('/active-broadcast', async (_req: Request, res: Response) => {
  try {
    // Find the most recent job created within the last 5 minutes
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const recentJob = await Job.findOne({
      createdAt: { $gte: cutoff }
    }).sort({ createdAt: -1 });

    if (!recentJob) {
      return res.json({ activeBroadcast: false });
    }

    const order = await Order.findOne({ orderNumber: recentJob.jobCode });

    res.json({
      activeBroadcast: true,
      job: {
        jobCode: recentJob.jobCode,
        title: recentJob.title,
        customerName: recentJob.customer?.name || 'Customer',
        location: recentJob.customer?.address || 'Chennai Site',
        itemsCount: recentJob.equipmentList?.length || 1,
        amount: order?.totalAmount || 12500,
        createdAt: recentJob.createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ activeBroadcast: false, message: err.message });
  }
});

// 🎯 Auto-Dispatch Completion (Executes after 20-second countdown)
router.post('/auto-dispatch-complete', async (req: Request, res: Response) => {
  try {
    const { jobCode } = req.body;
    if (!jobCode) {
      return res.status(400).json({ success: false, message: 'jobCode is required' });
    }

    const job = await Job.findOne({ jobCode });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    // 1. Fetch technicians who have PUNCHED IN today and are ONLINE (not OFF_DUTY)
    const todayAttendance = await TechnicianAttendance.find({
      date: today,
      status: { $in: ['PRESENT', 'HALF_DAY', 'OVERTIME'] }
    });

    const onlineTechIds = new Set<string>();
    const onlineTechNames = new Set<string>();
    todayAttendance.forEach(att => {
      if (att.technicianId) onlineTechIds.add(att.technicianId.toString());
      if (att.technicianName) onlineTechNames.add(att.technicianName.toLowerCase().trim());
    });

    // 2. Find best available technician who is Punched In & currently has ZERO active jobs
    const allTechs = await User.find({ role: 'TECHNICIAN', isActive: true });
    const activeJobs = await Job.find({
      jobCode: { $ne: jobCode },
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

    const availableOnlineTechs = allTechs.filter((t: any) => {
      const isOnline = onlineTechIds.has(t._id.toString()) || onlineTechNames.has(t.name.toLowerCase().trim());
      const isBusy = busyTechIds.has(t._id.toString()) || busyTechNames.has(t.name.toLowerCase().trim());
      return isOnline && !isBusy;
    });

    let assignedTech = availableOnlineTechs.length > 0 ? availableOnlineTechs[0] : null;

    if (!assignedTech) {
      // No technician is online / free right now -> job waits in queue
      job.status = 'WAITING_FOR_TECH';
      await job.save();
      return res.json({
        success: true,
        jobCode,
        isQueued: true,
        message: 'No online/available technicians on duty. Job placed in waiting queue.'
      });
    }

    const techName = assignedTech.name;
    const techId = assignedTech._id.toString();

    // Assign to technician
    job.status = 'IN_PROGRESS';
    job.assignedTechnicians = [{
      id: techId,
      name: techName,
      phone: assignedTech?.phone || ''
    }];
    await job.save();

    if (assignedTech) {
      assignedTech.isAvailable = false;
      assignedTech.currentJobId = jobCode;
      await assignedTech.save();
    }

    // Update order
    await Order.updateOne({ orderNumber: jobCode }, {
      $set: { assignedTechnicianName: techName }
    });

    // Notify Dashboard
    let dashboardData = await Dashboard.findOne();
    if (!dashboardData) dashboardData = new Dashboard();
    dashboardData.notifications.push({
      id: `notif-${Date.now()}`,
      title: 'Smart Job Auto-Dispatch Confirmed',
      message: `Order for ${job.customer?.name || 'Customer'} has been auto-dispatched to ${techName}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'ASSIGNMENT',
      jobId: jobCode
    });
    await dashboardData.save();

    // Broadcast to Sockets
    broadcastEvent('job:auto_assigned', {
      jobCode,
      assignedTechnicianName: techName,
      assignedTechnicianId: techId
    });

    res.json({
      success: true,
      jobCode,
      assignedTechnicianName: techName,
      assignedTechnicianId: techId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ⚡ High-Speed Aggregated Dashboard Summary (< 20ms) - Filtered per Technician
router.get('/dashboard-summary', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { technicianId, technicianName } = req.query;
    let jobFilter: any = {};

    if (technicianId || technicianName) {
      const techOrMatch: any[] = [];
      if (technicianId) {
        techOrMatch.push({ 'assignedTechnicians.id': technicianId });
      }
      if (technicianName) {
        techOrMatch.push({ 'assignedTechnicians.name': { $regex: `${technicianName}`, $options: 'i' } });
        techOrMatch.push({ 'assignedTechnician': { $regex: `${technicianName}`, $options: 'i' } });
      }
      if (techOrMatch.length > 0) {
        jobFilter.$or = techOrMatch;
      }
    }

    let reportQuery: any = {};
    if (technicianId) {
      reportQuery.technicianId = technicianId;
    } else if (technicianName) {
      reportQuery.technicianName = { $regex: `${technicianName}`, $options: 'i' };
    }

    const [totalAssigned, inProgress, pending, completed, techReports] = await Promise.all([
      Job.countDocuments(jobFilter),
      Job.countDocuments({ ...jobFilter, status: { $in: ['IN_PROGRESS', 'ACCEPTED', 'ASSIGNED'] } } as any),
      Job.countDocuments({ ...jobFilter, status: { $in: ['PENDING', 'PENDING APPROVAL'] } } as any),
      Job.countDocuments({ ...jobFilter, status: { $in: ['COMPLETED', 'DELIVERED', 'APPROVED'] } } as any),
      TechnicianReport.find(reportQuery)
    ]);

    // Compute actual hours logged from real reports submitted by this technician
    const hoursLogged = (techReports || []).reduce((acc: number, r: any) => {
      if (r.activityType === 'Check-In' || (r.workDescription && r.workDescription.includes('Punched in'))) return acc;
      return acc + (Number(r.hoursWorked) || 0);
    }, 0);

    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      executionTimeMs,
      data: {
        totalAssigned,
        availablePool: 0,
        inProgress,
        pending,
        completedToday: completed,
        hoursLogged: parseFloat(hoursLogged.toFixed(1)),
        shiftTarget: 8,
        firstTimeFix: completed > 0 ? 100.0 : 0.0,
        safetyScore: totalAssigned > 0 ? 100 : 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all jobs (for Technician / Admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, search, technicianId, technicianName, includeAvailable } = req.query;
    let filter: any = {};
    const andClauses: any[] = [];

    if (technicianId || technicianName) {
      const techOrMatch: any[] = [];
      if (technicianId) {
        techOrMatch.push({ 'assignedTechnicians.id': technicianId });
      }
      if (technicianName) {
        techOrMatch.push({ 'assignedTechnicians.name': { $regex: `^${technicianName}`, $options: 'i' } });
        techOrMatch.push({ 'assignedTechnician': { $regex: `^${technicianName}`, $options: 'i' } });
      }

      if (includeAvailable === 'true') {
        // Return all jobs in database so Technician can view and work on all orders
      } else {
        andClauses.push({
          $or: techOrMatch
        });
      }
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }
    
    if (search) {
      andClauses.push({
        $or: [
          { title: { $regex: search as string, $options: 'i' } },
          { jobCode: { $regex: search as string, $options: 'i' } },
          { 'customer.name': { $regex: search as string, $options: 'i' } },
        ]
      });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// GET single job by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new job
router.post('/', async (req: Request, res: Response) => {
  try {
    const emailQuery = req.body.customer?.email ? req.body.customer.email.toLowerCase() : '';
    const jobCodeQuery = req.body.jobCode || '';
    
    // Find if a job already exists for the same code or customer email
    let existingJob = null;
    if (jobCodeQuery || emailQuery) {
      existingJob = await Job.findOne({
        $or: [
          ...(jobCodeQuery ? [{ jobCode: jobCodeQuery }] : []),
          ...(emailQuery ? [{ 'customer.email': emailQuery }] : [])
        ]
      });
    }

    if (existingJob) {
      // Update the existing job's details and technician
      Object.assign(existingJob, req.body);
      const savedJob = await existingJob.save();
      return res.status(200).json({ success: true, data: savedJob });
    }

    const jobCode = `SK-JOB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob = new Job({ ...req.body, jobCode });
    const savedJob = await newJob.save();
    res.status(201).json({ success: true, data: savedJob });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update job status / details
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id as string);
    const job = await Job.findOne({
      $or: [
        ...(isMongoId ? [{ _id: req.params.id }] : []),
        { jobCode: req.params.id },
      ],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${req.params.id} not found` });
    }

    // Support pushing daily report
    if (req.body.dailyReport) {
      if (!job.dailyReports) job.dailyReports = [];
      job.dailyReports.push({
        ...req.body.dailyReport,
        id: `REP-${Date.now()}`
      });
      delete req.body.dailyReport;
    }

    // Support pushing photo
    if (req.body.photo) {
      const newPhoto = {
        ...req.body.photo,
        id: `PHO-${Date.now()}`
      };
      if (req.body.photo.type === 'BEFORE') {
        if (!job.beforePhotos) job.beforePhotos = [];
        job.beforePhotos.push(newPhoto);
        (job as any).markModified('beforePhotos');
      } else {
        if (!job.afterPhotos) job.afterPhotos = [];
        job.afterPhotos.push(newPhoto);
        (job as any).markModified('afterPhotos');
      }
      delete req.body.photo;

      broadcastEvent('job:photo_uploaded', {
        jobId: job._id,
        jobCode: job.jobCode,
        photo: newPhoto,
      });
    }

    // Support saving inspection
    if (req.body.inspection) {
      job.inspection = req.body.inspection;
      delete req.body.inspection;
    }

    // Update other fields
    Object.assign(job, req.body);
    const updatedJob = await job.save();

    res.json({ success: true, data: updatedJob });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST accept job
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id as string);
    const job = await Job.findOne({
      $or: [
        ...(isMongoId ? [{ _id: req.params.id }] : []),
        { jobCode: req.params.id },
      ],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${req.params.id} not found` });
    }

    if (!job.assignedTechnicians) {
      job.assignedTechnicians = [];
    }

    const requiredCount = job.requiredTechniciansCount || 1;
    const technician = req.body.technician;

    if (!technician || !technician.id || !technician.name) {
      return res.status(400).json({ success: false, message: 'Technician details missing.' });
    }

    // Check if the technician is already assigned
    const isAlreadyAssigned = job.assignedTechnicians.some(t => t.id === technician.id || t.name === technician.name);
    if (!isAlreadyAssigned) {
      if (job.assignedTechnicians.length >= requiredCount) {
        return res.status(400).json({ success: false, message: 'This job already has the required number of technicians.' });
      }
      job.assignedTechnicians.push({
        id: technician.id,
        name: technician.name,
        avatar: technician.avatarUrl || '',
        phone: technician.phone || ''
      });
    }
    
    job.status = 'IN_PROGRESS';
    job.acceptanceStatus = 'ACCEPTED';
    job.customerConfirmed = true;
    const updatedJob = await job.save();

    // Broadcast to admins, customer, and technician room
    broadcastEvent('job:accepted', {
      jobId: updatedJob._id,
      jobCode: updatedJob.jobCode,
      technicianName: technician.name,
    });
    emitToRole('admin', 'job:status_updated', {
      jobId: updatedJob._id,
      jobCode: updatedJob.jobCode,
      status: updatedJob.status,
      technician: technician.name,
    });
    if (updatedJob.customer?.email) {
      emitToUser(updatedJob.customer.email.toLowerCase(), 'order:status_updated', {
        orderCode: updatedJob.jobCode,
        status: 'ASSIGNED',
        customerConfirmed: true,
        technicianName: technician.name,
        technicianPhone: technician.phone || ''
      });
    }

    const dashboardData = await Dashboard.findOne();
    if (dashboardData) {
      dashboardData.notifications.push({
        id: `notif-taken-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'Job Accepted',
        message: `Job ${job.jobCode} has been accepted by ${technician.name}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'UPDATE',
        jobId: job.jobCode
      });
      await dashboardData.save();
    }

    res.json({ success: true, data: updatedJob });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/jobs/:id/reject - Technician rejects auto-assigned job (Triggers Cascade & Admin Notification)
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id as string);
    const job = await Job.findOne({
      $or: [
        ...(isMongoId ? [{ _id: req.params.id }] : []),
        { jobCode: req.params.id },
      ],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${req.params.id} not found` });
    }

    const { technicianId, technicianName, reason } = req.body;

    // 1. Mark technician in rejectedTechnicianIds
    if (!job.rejectedTechnicianIds) job.rejectedTechnicianIds = [];
    if (technicianId && !job.rejectedTechnicianIds.includes(technicianId)) {
      job.rejectedTechnicianIds.push(technicianId);
    }
    if (technicianName && !job.rejectedTechnicianIds.includes(technicianName)) {
      job.rejectedTechnicianIds.push(technicianName);
    }

    // 2. Clear current assignedTechnicians
    job.assignedTechnicians = [];
    job.acceptanceStatus = 'DECLINED';
    job.customerConfirmed = false;

    // 3. Notify Admin via socket alert & Dashboard model
    emitToRole('admin', 'job:rejected', {
      jobId: job._id,
      jobCode: job.jobCode,
      technicianName: technicianName || 'Technician',
      reason: reason || 'Not available for job assignment'
    });

    let dashboardData = await Dashboard.findOne();
    if (!dashboardData) dashboardData = new Dashboard();
    dashboardData.notifications.push({
      id: `notif-rej-${Date.now()}`,
      title: '🚨 Technician Job Rejection',
      message: `Technician ${technicianName || 'Staff'} rejected job ${job.jobCode}. Initiating auto-cascade to next technician.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'URGENT',
      jobId: job.jobCode
    });
    await dashboardData.save();

    // 4. Free the technician who rejected
    const User = require('../models/User').default;
    const isTechMongoId = /^[0-9a-fA-F]{24}$/.test(technicianId || '');
    const rejectingTech = await User.findOne({
      $or: [
        ...(isTechMongoId ? [{ _id: technicianId }] : []),
        { name: technicianName || technicianId },
        { email: technicianId }
      ]
    });
    if (rejectingTech) {
      rejectingTech.isAvailable = true;
      rejectingTech.currentJobId = null;
      await rejectingTech.save();
    }

    // 5. CASCADING RE-ASSIGNMENT ENGINE: Find Next Available Technician
    const { processWaitingQueue } = require('../services/queueService');
    
    const availableTech = await User.findOne({ 
      role: 'TECHNICIAN', 
      isAvailable: true, 
      isActive: true,
      _id: { $nin: job.rejectedTechnicianIds }
    });

    if (availableTech) {
      availableTech.isAvailable = false;
      availableTech.currentJobId = job.jobCode;
      await availableTech.save();

      job.assignedTechnicians.push({
        id: availableTech._id.toString(),
        name: availableTech.name,
        phone: availableTech.phone || ''
      });
      job.status = 'ASSIGNMENT_PENDING_ACCEPTANCE';
      job.acceptanceStatus = 'PENDING';

      emitToRole('admin', 'job:auto_reassigned', {
        jobCode: job.jobCode,
        fromTech: technicianName,
        toTech: availableTech.name
      });
    } else {
      job.status = 'WAITING_FOR_TECH';
      job.acceptanceStatus = 'PENDING';
    }

    await job.save();

    // Trigger queue processing for the freed technician (they rejected this job, but maybe there is another waiting job they CAN take)
    processWaitingQueue();
    res.json({ success: true, message: 'Job rejection logged and cascading re-assignment executed', data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/jobs/:id/location - Update live GPS coordinates of technician
router.patch('/:id/location', async (req: Request, res: Response) => {
  try {
    const { lat, lng, technicianId } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id as string);
    const job = await Job.findOne({
      $or: [
        ...(isMongoId ? [{ _id: req.params.id }] : []),
        { jobCode: req.params.id },
      ],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${req.params.id} not found` });
    }

    job.currentLocation = {
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date().toISOString(),
    };

    await job.save();

    // Broadcast location update live via Socket.io
    emitToJob(job._id.toString(), 'job:location_updated', {
      jobId: job._id,
      jobCode: job.jobCode,
      technicianId,
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: job.currentLocation.updatedAt,
    });
    emitToRole('admin', 'job:location_updated', {
      jobId: job._id,
      jobCode: job.jobCode,
      technicianId,
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: job.currentLocation.updatedAt,
    });

    res.json({ success: true, currentLocation: job.currentLocation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/jobs/:id/upload-photo - Upload proof photo (before/after/proof)
router.post('/:id/upload-photo', async (req: Request, res: Response) => {
  try {
    const { url, caption, type = 'PROOF' } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Photo URL or base64 is required' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const photoObj = {
      id: `PHO-${Date.now()}`,
      url,
      caption: caption || 'Site Photo',
      uploadedAt: new Date().toISOString(),
    };

    if (type === 'BEFORE') {
      if (!job.beforePhotos) job.beforePhotos = [];
      job.beforePhotos.push(photoObj);
    } else if (type === 'AFTER') {
      if (!job.afterPhotos) job.afterPhotos = [];
      job.afterPhotos.push(photoObj);
    } else {
      if (!job.proofImages) job.proofImages = [];
      job.proofImages.push(photoObj);
    }

    await job.save();

    emitToJob(job._id.toString(), 'job:photo_added', { jobId: job._id, photo: photoObj });
    emitToRole('admin', 'job:photo_added', { jobId: job._id, jobCode: job.jobCode, photo: photoObj });

    res.json({ success: true, photo: photoObj, job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/jobs/:id/complete - Technician marks job as completed, waiting for admin approval
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id as string);
    const job = await Job.findOne({
      $or: [
        ...(isMongoId ? [{ _id: req.params.id }] : []),
        { jobCode: req.params.id },
      ],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${req.params.id} not found` });
    }

    job.status = 'WAITING_ADMIN_APPROVAL';
    await job.save();

    // Notify Admin via Dashboard model
    let dashboardData = await Dashboard.findOne();
    if (!dashboardData) {
      dashboardData = new Dashboard();
    }
    dashboardData.notifications.push({
      id: `notif-comp-${Date.now()}`,
      title: 'Job Completed - Pending Approval',
      message: `Job ${job.jobCode} has been marked as completed by the technician. Please approve.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'URGENT',
      jobId: job.jobCode
    });
    await dashboardData.save();

    emitToRole('admin', 'job:completed_pending_approval', {
      jobId: job._id,
      jobCode: job.jobCode
    });

    res.json({ success: true, message: 'Job marked as completed, waiting for admin approval.', job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/jobs/:id/admin-approve - Admin approves job completion, frees technician and processes queue
router.post('/:id/admin-approve', async (req: Request, res: Response) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id as string);
    const job = await Job.findOne({
      $or: [
        ...(isMongoId ? [{ _id: req.params.id }] : []),
        { jobCode: req.params.id },
      ],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: `Job ${req.params.id} not found` });
    }

    job.status = 'COMPLETED';
    await job.save();

    // Free the assigned technicians
    const User = require('../models/User').default;
    for (const tech of (job.assignedTechnicians || [])) {
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(tech.id || '');
      const technician = await User.findOne({
        $or: [
          ...(isMongoId ? [{ _id: tech.id }] : []),
          { name: tech.name || tech.id }
        ]
      });
      if (technician) {
        technician.isAvailable = true;
        technician.currentJobId = null;
        await technician.save();
      }
    }

    // Process the waiting queue now that technicians are available
    const { processWaitingQueue } = require('../services/queueService');
    processWaitingQueue();

    emitToRole('admin', 'job:approved', {
      jobId: job._id,
      jobCode: job.jobCode
    });

    res.json({ success: true, message: 'Job approved and technicians freed.', job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
