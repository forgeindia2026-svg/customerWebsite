import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Job from '../models/Job';
import User from '../models/User';
import Dashboard from '../models/Dashboard';
import { emitToUser, emitToRole, broadcastEvent } from '../socket';

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

// POST create order (for Customer Website)
router.post('/', async (req: Request, res: Response) => {
  try {
    const orderNumber = `SK-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = new Order({ ...req.body, orderNumber });
    
    // If it's a Delivery & Installation order, automate the assignment
    if (req.body.serviceType === 'DELIVERY_INSTALLATION') {
      newOrder.orderStatus = 'PROCESSING';
      
      // 1. Fetch available technicians and balance workload
      const availableTechnicians = await User.find({ role: 'TECHNICIAN' });
      let assignedTech = null;

      if (availableTechnicians.length > 0) {
        // Calculate current active workload for each technician
        const techWorkloads = await Promise.all(
          availableTechnicians.map(async (tech) => {
            const activeJobsCount = await Job.countDocuments({
              'assignedTechnicians.id': tech._id.toString(),
              status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
            });
            return { tech, activeJobsCount };
          })
        );

        // Sort technicians by least active jobs first
        techWorkloads.sort((a, b) => a.activeJobsCount - b.activeJobsCount);
        assignedTech = techWorkloads[0].tech;
      }

      if (assignedTech) {
        // 2. Create the Job mapped to this order, assigned to the tech
        const newJob = await Job.create({
          jobCode: orderNumber,
          title: req.body.items?.map((item: any) => item.title).join(', ') || 'CCTV Installation',
          category: req.body.items?.map((item: any) => item.title).join(', ') || 'CCTV Installation',
          status: 'PENDING', // PENDING means it's awaiting technician acceptance
          priority: 'MEDIUM',
          scheduledDate: new Date().toISOString().split('T')[0],
          startDate: new Date().toISOString().split('T')[0],
          estimatedDays: 1,
          requiredTechniciansCount: 1,
          orderCategory: 'Delivery & Installation',
          customer: {
            name: req.body.customerName,
            phone: req.body.customerPhone || '0000000000',
            email: req.body.customerEmail || `${req.body.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
            address: req.body.shippingAddress || 'Chennai Area',
            city: 'Chennai',
            postalCode: '600032'
          },
          assignedTechnicians: [{
            id: assignedTech._id.toString(),
            name: assignedTech.name,
            phone: assignedTech.phone || ''
          }]
        });

        // 3. Notify Admin via Dashboard model
        let dashboardData = await Dashboard.findOne();
        if (!dashboardData) {
          dashboardData = new Dashboard();
        }
        dashboardData.notifications.push({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'Automated Job Assignment',
          message: `Order ${orderNumber} has been automatically assigned to ${assignedTech.name}.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'ASSIGNMENT',
          jobId: orderNumber
        });
        await dashboardData.save();
      }
    }

    const savedOrder = await newOrder.save();

    // Emit Socket.io notifications
    emitToRole('admin', 'order:created', {
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      totalAmount: savedOrder.totalAmount,
      customerName: savedOrder.customerName,
    });
    if (savedOrder.customerEmail) {
      emitToUser(savedOrder.customerEmail.toLowerCase(), 'order:status_updated', {
        orderId: savedOrder._id,
        orderCode: savedOrder.orderNumber,
        status: savedOrder.orderStatus,
        paymentStatus: savedOrder.paymentStatus,
      });
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update order status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (updatedOrder.customerEmail) {
      emitToUser(updatedOrder.customerEmail.toLowerCase(), 'order:status_updated', {
        orderId: updatedOrder._id,
        orderCode: updatedOrder.orderNumber,
        status: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
      });
    }
    emitToRole('admin', 'order:status_updated', {
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.orderStatus,
    });

    res.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
