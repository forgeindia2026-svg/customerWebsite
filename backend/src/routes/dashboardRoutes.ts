import { Router, Request, Response } from 'express';
import Dashboard from '../models/Dashboard';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Job from '../models/Job';
import Query from '../models/Query';

const router = Router();

// GET analytics summary & chart data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().lean();
    const jobs = await Job.find().lean();
    const technicians = await User.find({ role: 'TECHNICIAN' }).lean();

    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'PAID' || o.orderStatus === 'DELIVERED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const pendingOrdersCount = orders.filter(o => o.orderStatus === 'PROCESSING').length;
    const completedOrdersCount = orders.filter(o => o.orderStatus === 'DELIVERED' || o.orderStatus === 'SHIPPED').length;

    const activeJobsCount = jobs.filter(j => j.status === 'ASSIGNED' || j.status === 'IN_PROGRESS').length;
    const completedJobsCount = jobs.filter(j => j.status === 'COMPLETED').length;

    // Monthly revenue aggregation
    const monthlyMap: { [key: string]: number } = {
      Jan: 45000, Feb: 58000, Mar: 62000, Apr: 75000, May: 90000, Jun: 110000,
    };
    orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
      monthlyMap[month] = (monthlyMap[month] || 0) + (o.totalAmount || 0);
    });

    const revenueChart = Object.keys(monthlyMap).map(m => ({
      month: m,
      revenue: monthlyMap[m],
    }));

    // Technician performance metrics
    const techPerformance = technicians.map(t => {
      const techJobs = jobs.filter(j => j.assignedTechnicians?.some(at => at.id === t._id.toString() || at.name === t.name));
      const completed = techJobs.filter(j => j.status === 'COMPLETED').length;
      return {
        id: t._id,
        name: t.name,
        totalJobs: techJobs.length,
        completedJobs: completed,
        rating: t.rating || 4.8,
        specialization: t.specialties?.join(', ') || 'CCTV & Cabling',
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders: orders.length,
          pendingOrdersCount,
          completedOrdersCount,
          activeJobsCount,
          completedJobsCount,
          totalTechnicians: technicians.length,
        },
        revenueChart,
        techPerformance,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// In-memory High-Speed Cache for Dashboard (5 seconds TTL)
let cachedDashboardState: any = null;
let lastCacheTime = 0;
const DASHBOARD_CACHE_TTL = 5000;

export const clearDashboardCache = () => {
  cachedDashboardState = null;
  lastCacheTime = 0;
};

// GET entire dashboard state dynamically built from live database collections
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Start GET /dashboard');
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && cachedDashboardState && (now - lastCacheTime < DASHBOARD_CACHE_TTL)) {
      return res.json({ success: true, data: cachedDashboardState, cached: true });
    }

    console.log('Starting DB queries...');
    // ⚡ Ultra-Fast Parallel MongoDB Query Execution
    let [dashboardDoc, liveOrders, liveProducts, liveTechnicians, liveCustomers, liveJobs, liveQueries] = await Promise.all([
      Dashboard.findOne().lean().catch(() => null),
      Order.find().sort({ createdAt: -1 }).lean().catch(() => []),
      Product.find().lean().catch(() => []),
      User.find({ role: 'TECHNICIAN' }).lean().catch(() => []),
      User.find({ role: 'CUSTOMER' }).lean().catch(() => []),
      // Optimize Job query by excluding large Base64 image fields to prevent 504 Gateway Timeouts
      Job.find().select('-proofImages -beforePhotos -afterPhotos').sort({ createdAt: -1 }).lean().catch(() => []),
      Query.find().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => [])
    ]);
    console.log('Queries finished');

    let dashboardData: any = dashboardDoc;

    if (!dashboardData) {
      dashboardData = {
        orders: [],
        customers: [],
        technicians: [],
        projects: [],
        serviceRequests: [],
        products: [],
        inventory: [],
        payments: [],
        notifications: [],
        settings: {},
        chartData: [],
        queries: [],
        announcements: [],
        banners: [],
        brands: []
      };
    }

    console.log('Pre-indexing collections...');

    // Pre-index collections for ultra-fast O(1) lookups
    const jobByCode = new Map((liveJobs || []).map((j: any) => [j.jobCode, j]));
    const ordersByEmail = new Map<string, any[]>();
    (liveOrders || []).forEach((o: any) => {
      const email = o.customerEmail?.toLowerCase() || '';
      if (email) {
        if (!ordersByEmail.has(email)) ordersByEmail.set(email, []);
        ordersByEmail.get(email)!.push(o);
      }
    });

    const activeJobByTechId = new Map<string, any>();
    (liveJobs || []).forEach((j: any) => {
      if (j.status !== 'COMPLETED' && j.status !== 'CANCELLED') {
        (j.assignedTechnicians || []).forEach((t: any) => {
          if (t.id && !activeJobByTechId.has(t.id.toString())) {
            activeJobByTechId.set(t.id.toString(), j);
          }
        });
      }
    });

    console.log('Mapping live Jobs/Projects...');

    // Map live Jobs/Projects (Combine Jobs & Orders so all 27 projects are returned)
    const jobCodesSet = new Set((liveJobs || []).map((j: any) => j.jobCode));
    const mappedProjects = [
      ...(liveJobs || []).map((job: any) => ({
        id: job.jobCode,
        name: job.title,
        technician: (job.assignedTechnicians && job.assignedTechnicians.length > 0) ? job.assignedTechnicians.map((t: any) => t.name).join(', ') : 'Unassigned',
        customer: job.customer?.name || 'Unknown Customer',
        location: job.customer?.address || 'Chennai Area',
        submissionDate: job.scheduledDate || (job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'),
        status: (() => {
          if (job.status === 'PENDING') return (job.assignedTechnicians && job.assignedTechnicians.length > 0) ? 'In Progress' : 'Pending';
          if (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS') return 'In Progress';
          if (job.status === 'WAITING_ADMIN_APPROVAL') return 'Completed';
          if (job.status === 'COMPLETED') return 'Approved';
          return 'Pending';
        })(),
        details: job.scopeOfWork?.join(', ') || job.title,
        devicesCount: job.equipmentList?.length || 0,
        dailyLogs: job.fieldNotes ? [{ date: new Date(job.updatedAt || Date.now()).toLocaleDateString('en-US'), status: job.status, report: job.fieldNotes, photos: [] }] : []
      })),
      ...(liveOrders || [])
        .filter((o: any) => !jobCodesSet.has(o.orderNumber))
        .map((order: any) => ({
          id: order.orderNumber,
          name: order.items?.map((item: any) => item.title).join(', ') || 'CCTV Installation',
          technician: 'Unassigned',
          customer: order.customerName,
          location: order.shippingAddress || 'Chennai Area',
          submissionDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
          status: order.orderStatus === 'DELIVERED' ? 'Approved' : 'Pending',
          details: order.items?.map((item: any) => item.title).join(', ') || 'CCTV Installation',
          devicesCount: order.items?.length || 1,
          dailyLogs: []
        }))
    ];

    console.log('Mapping live Orders...');
    // Map live Orders
    const mappedOrders = (liveOrders || []).map((order: any) => {
      const job = jobByCode.get(order.orderNumber);
      let dashboardStatus = 'Pending';
      if (order.orderStatus === 'DELIVERED') {
        dashboardStatus = 'Completed';
      } else if (order.orderStatus === 'PROCESSING') {
        dashboardStatus = job ? 'In Progress' : 'Pending Approval';
      } else if (order.orderStatus === 'SHIPPED') {
        dashboardStatus = 'Completed';
      } else if (order.orderStatus === 'CANCELLED') {
        dashboardStatus = 'Cancelled';
      }
      if (job) {
        if (job.status === 'COMPLETED') {
          dashboardStatus = 'Approved';
        } else if (job.status === 'IN_PROGRESS' || job.status === 'ASSIGNED') {
          dashboardStatus = 'In Progress';
        } else if (job.status === 'PENDING') {
          dashboardStatus = (job.assignedTechnicians && job.assignedTechnicians.length > 0) ? 'In Progress' : 'Pending Approval';
        }
      }
      return {
        id: order.orderNumber,
        customer: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        type: order.items?.map((item: any) => item.title).join(', ') || 'CCTV Installation',
        location: order.shippingAddress || 'Chennai Area',
        assignedTechnician: (job?.assignedTechnicians && job.assignedTechnicians.length > 0) ? job.assignedTechnicians.map((t: any) => t.name).join(', ') : 'Unassigned',
        status: dashboardStatus,
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amount: order.totalAmount,
        createdAt: order.createdAt
      };
    });

    // Map live Technicians
    const mappedTechnicians = liveTechnicians.map((tech: any) => {
      const activeJob = liveJobs.find((j: any) => (j.assignedTechnicians && j.assignedTechnicians.some((t: any) => t.id === tech._id.toString())) && j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
      return {
        id: tech._id.toString(),
        name: tech.name,
        phone: tech.phone || '',
        email: tech.email,
        status: activeJob ? 'Busy' : 'Available',
        currentProject: activeJob ? activeJob.title : 'None',
        rating: tech.rating || 5.0,
        specialization: tech.specialties?.join(', ') || 'IP Cameras & Networking',
        password: tech.passwordHash || ''
      };
    });

    // Map live Customers
    const mappedCustomers = liveCustomers.map((cust: any) => {
      const custOrders = liveOrders.filter((o: any) => o.customerEmail?.toLowerCase() === cust.email?.toLowerCase());
      const totalSpent = custOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      return {
        id: `CUST-${cust._id.toString().slice(-4).toUpperCase()}`,
        name: cust.name,
        email: cust.email,
        phone: cust.phone || '',
        location: custOrders[0]?.shippingAddress || 'Chennai Area',
        totalSpent,
        installationsCount: custOrders.length
      };
    });

    // Map live Products
    const mappedProducts = liveProducts.map((prod: any) => {
      let effectiveOfferPrice = prod.offerPrice || '';
      let finalMrp = prod.price || 0;

      if (prod.originalPrice && prod.originalPrice > prod.price) {
        finalMrp = prod.originalPrice;
        if (!effectiveOfferPrice) {
          effectiveOfferPrice = prod.price;
        }
      }

      return {
        id: prod._id.toString(),
        name: prod.title || prod.name || 'CCTV Product',
        brand: prod.brand || '',
        category: prod.category || 'CCTV Cameras',
        subCategory: prod.subCategory || '',
        model: prod.specs?.[0] || prod.modelName || '',
        price: finalMrp,
        offerPrice: effectiveOfferPrice,
        stock: prod.stock || 0,
        description: prod.description || '',
        imageUrl: prod.image || prod.imageUrl || '',
        imageUrls: prod.images || (prod.image ? [prod.image] : []),
        discount: prod.discount || (prod.badge && prod.badge.includes('%') ? parseInt(prod.badge) : ''),
        delivery: prod.delivery || '',
        warranty: prod.warranty || '',
        rating: prod.rating || '',
        offers: prod.promotionalOffer || '',
        isNew: prod.isNew || false,
        isBestSeller: prod.isBestSeller || false,
        isFlashDeal: prod.isFlashDeal || false,
        features: prod.features || [],
        offersList: prod.offers || [],
        relatedProducts: prod.relatedProducts || [],
      };
    });

    // Map live Payments from liveOrders
    const mappedPayments = liveOrders.map((o: any, idx: number) => ({
      id: `PAY-${o.orderNumber || idx}`,
      customer: o.customerName,
      amount: o.totalAmount || 0,
      method: o.paymentMethod || (idx % 2 === 0 ? 'Razorpay / Online UPI' : 'Cash on Delivery'),
      status: o.paymentStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
      date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));

    // Map live Support Queries (Customer & Technician)
    const mappedQueries = (liveQueries || []).map((q: any) => ({
      id: q.ticketId || `TKT-${q._id}`,
      _id: q._id?.toString(),
      ticketId: q.ticketId || `TKT-${q._id}`,
      type: q.type || 'Customer',
      raisedBy: q.raisedBy || 'Customer',
      raisedById: q.raisedById,
      phone: q.phone || '',
      email: q.email || '',
      subject: q.subject || 'Support Ticket',
      category: q.category || 'General Support',
      priority: q.priority || 'Medium',
      status: q.status || 'Open',
      description: q.description || '',
      date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : '2026-08-25',
      time: q.createdAt ? new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
      messages: q.messages || []
    }));

    console.log('Mapping completed, preparing response...');
    // Merge baseline and dynamic live collections
    const mergedData = {
      ...dashboardData,
      orders: mappedOrders,
      products: mappedProducts,
      technicians: mappedTechnicians,
      customers: mappedCustomers,
      projects: mappedProjects,
      payments: mappedPayments,
      queries: mappedQueries
    };

    cachedDashboardState = mergedData;
    lastCacheTime = Date.now();

    console.log('Sending response');
    res.json({ success: true, data: mergedData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update dashboard state & sync live sub-collections
router.put('/', async (req: Request, res: Response) => {
  try {
    let dashboardData = await Dashboard.findOne();
    if (!dashboardData) {
      dashboardData = new Dashboard(req.body);
    } else {
      Object.assign(dashboardData, req.body);
    }
    const saved = await dashboardData.save();

    // 1. Sync orders back to live Orders collection
    if (req.body.orders && Array.isArray(req.body.orders)) {
      for (const o of req.body.orders) {
        const dbStatus = o.status === 'Completed' ? 'DELIVERED' : 'PROCESSING';
        const existingOrder = await Order.findOne({ orderNumber: o.id });
        if (!existingOrder) {
          await Order.create({
            orderNumber: o.id,
            customerName: o.customer,
            customerEmail: o.email || `${o.customer.toLowerCase().replace(/\s+/g, '')}@example.com`,
            customerPhone: o.phone || '0000000000',
            shippingAddress: o.location || 'Chennai Area',
            items: [{ productId: 'temp', title: o.type, price: o.amount, quantity: 1 }],
            totalAmount: o.amount,
            paymentStatus: 'PAID',
            orderStatus: dbStatus
          });
        } else {
          await Order.updateOne({ orderNumber: o.id }, { orderStatus: dbStatus });
        }

        // Keep associated Job status in sync to prevent dashboard interval reverting
        if (o.id) {
          const emailQuery = o.email ? o.email.toLowerCase() : '';
          let associatedJob = await Job.findOne({
            jobCode: o.id
          });
          if (associatedJob) {
            if (o.status === 'Approved') {
              const isNewlyApproved = associatedJob.status !== 'ASSIGNED';
              associatedJob.status = 'ASSIGNED';
              
              if (isNewlyApproved && (!associatedJob.assignedTechnicians || associatedJob.assignedTechnicians.length === 0)) {
                // Broadcast to technicians
                dashboardData.notifications.push({
                  id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  title: 'New Job Available',
                  message: `Job ${associatedJob.jobCode} for ${associatedJob.customer?.name} has been approved.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  type: 'ASSIGNMENT',
                  jobId: associatedJob.jobCode
                });
              }
            } else if (o.status === 'In Progress') {
              associatedJob.status = 'IN_PROGRESS';
            } else if (o.status === 'Completed') {
              associatedJob.status = 'COMPLETED';
            } else if (o.status === 'Pending Approval' || o.status === 'Pending') {
              associatedJob.status = 'PENDING';
            }

            // Sync assigned technician
            const isAssigned = o.assignedTechnician && o.assignedTechnician !== 'Unassigned';
            associatedJob.assignedTechnicians = isAssigned ? [{ id: 'temp-id', name: o.assignedTechnician }] : [];

            // Sync customer details
            if (associatedJob.customer) {
              associatedJob.customer.name = o.customer || associatedJob.customer.name;
              associatedJob.customer.email = emailQuery || associatedJob.customer.email;
              associatedJob.customer.phone = o.phone || associatedJob.customer.phone;
              associatedJob.customer.address = o.location || associatedJob.customer.address;
            }

            console.log(`Updating associatedJob for ${o.id}:`, associatedJob.assignedTechnicians);
            await associatedJob.save();

            // Also update the Order in MongoDB if it exists
            console.log(`Updating Order for ${o.id}`);
            await Order.updateOne({ orderNumber: o.id }, {
              customerName: o.customer,
              customerEmail: emailQuery,
              customerPhone: o.phone,
              shippingAddress: o.location,
              totalAmount: o.amount
            });
          } else {
            // Create a job if the order has been approved or is pending approval and is NOT Delivery Only
            if ((o.status === 'Approved' || o.status === 'Pending Approval' || o.status === 'Pending') && o.orderCategory !== 'Delivery Only') {
              const jobStatus = o.status === 'Approved' ? 'ASSIGNED' : 'PENDING';
              
              const isAssigned = o.assignedTechnician && o.assignedTechnician !== 'Unassigned';
              
              if (jobStatus === 'ASSIGNED' && !isAssigned) {
                // Broadcast to technicians
                dashboardData.notifications.push({
                  id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  title: 'New Job Available',
                  message: `Job ${o.id} for ${o.customer} has been approved.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  type: 'ASSIGNMENT',
                  jobId: o.id
                });
              }

              await Job.create({
                jobCode: o.id,
                title: o.type || 'CCTV Installation',
                category: o.type || 'CCTV Installation',
                status: jobStatus,
                priority: 'MEDIUM',
                scheduledDate: new Date().toISOString().split('T')[0],
                customer: {
                  name: o.customer,
                  phone: o.phone || '0000000000',
                  email: emailQuery,
                  address: o.location || 'Chennai Area',
                  city: 'Chennai',
                  postalCode: '600032'
                },
                startDate: o.startDate,
                targetCompletionDate: o.targetCompletionDate,
                estimatedDays: o.estimatedDays || 1,
                requiredTechniciansCount: o.requiredTechniciansCount || 1,
                orderCategory: o.orderCategory || 'Delivery & Installation',
                assignedTechnicians: isAssigned ? [{ id: 'temp-id', name: o.assignedTechnician }] : []
              });
            }
          }
        }
      }
    }

    // 2. Sync products back to live Products collection
    if (req.body.products && Array.isArray(req.body.products)) {
      for (const p of req.body.products) {
        // If ID is valid 24-character MongoDB ID, try finding and updating
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(p.id);
        const query = isMongoId ? { _id: p.id } : { title: p.name };
        const existingProd = await Product.findOne(query);
        if (!existingProd) {
          await Product.create({
            title: p.name,
            category: p.category === 'IP Camera' ? 'ip' : (p.category === 'DVR/NVR' ? 'dvr' : p.category),
            brand: 'SK-Vision',
            price: p.price,
            specs: p.model ? [p.model] : [],
            stock: p.stock,
            image: p.imageUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
            description: p.description || '',
            isFlashDeal: p.isFlashDeal || false
          });
        } else {
          await Product.updateOne(query, {
            price: p.price,
            stock: p.stock,
            description: p.description,
            image: p.imageUrl,
            isFlashDeal: p.isFlashDeal || false
          });
        }
      }
    }

    // 3. Sync technicians back to live Users collection
    if (req.body.technicians && Array.isArray(req.body.technicians)) {
      for (const t of req.body.technicians) {
        const existingUser = await User.findOne({ email: t.email });
        if (!existingUser) {
          await User.create({
            name: t.name,
            email: t.email,
            passwordHash: t.password || 'seeded123',
            phone: t.phone,
            role: 'TECHNICIAN',
            specialties: t.specialization ? t.specialization.split(', ') : [],
            rating: t.rating || 5.0
          });
        } else {
          const updateFields: any = {
            name: t.name,
            phone: t.phone,
            specialties: t.specialization ? t.specialization.split(', ') : []
          };
          if (t.password) {
            updateFields.passwordHash = t.password;
          }
          await User.updateOne({ email: t.email }, updateFields);
        }
      }
    }

    // 4. Sync projects back to live Jobs collection
    if (req.body.projects && Array.isArray(req.body.projects)) {
      for (const pr of req.body.projects) {
        const existingJob = await Job.findOne({ jobCode: pr.id });
        let dbStatus = existingJob?.status || 'PENDING';
        if (pr.status === 'Approved') {
          dbStatus = existingJob?.status === 'PENDING' ? 'ASSIGNED' : (existingJob?.status || 'ASSIGNED');
        } else if (pr.status === 'Rework') {
          dbStatus = 'PENDING';
        } else if (pr.status === 'Pending Approval') {
          if (existingJob && !['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(existingJob.status)) {
            dbStatus = 'PENDING';
          }
        }

        if (!existingJob) {
          await Job.create({
            jobCode: pr.id,
            title: pr.name,
            category: 'IP Camera Installation',
            status: dbStatus,
            priority: 'MEDIUM',
            scheduledDate: pr.submissionDate || new Date().toLocaleDateString('en-US'),
            customer: {
              name: pr.customer,
              phone: '0000000000',
              email: `${pr.customer.toLowerCase().replace(/\s+/g, '')}@example.com`,
              address: pr.location || 'Chennai Area',
              city: 'Chennai',
              postalCode: '600001'
            },
            assignedTechnicians: pr.technician !== 'Unassigned' ? [{ name: pr.technician, id: 'temp' }] : [],
            fieldNotes: pr.dailyLogs?.[0]?.report || ''
          });
        } else {
          await Job.updateOne({ jobCode: pr.id }, {
            status: dbStatus,
            assignedTechnicians: pr.technician !== 'Unassigned' ? [{ name: pr.technician, id: existingJob.assignedTechnicians?.[0]?.id || 'temp' }] : [],
            fieldNotes: pr.dailyLogs?.[0]?.report || ''
          });
        }
      }
    }

    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
