import Product from './models/Product';
import Job from './models/Job';
import User from './models/User';
import Dashboard from './models/Dashboard';
import Order from './models/Order';

export async function seedDatabase() {
  try {
    // Seed default Admin User if no users exist
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount === 0) {
      console.log('Seeding default Admin User into MongoDB...');
      await User.create({
        name: 'Admin User',
        email: 'admin@sktech.com',
        passwordHash: 'admin123',
        role: 'ADMIN',
        phone: '+91 98765 43210',
      });
      console.log('Admin User seeded successfully.');
    }

    // Seed Technicians if none exist
    const techCount = await User.countDocuments({ role: 'TECHNICIAN' });
    if (techCount === 0) {
      console.log('Seeding Technicians into MongoDB...');
      await User.create([
        {
          name: 'Kathir',
          email: 'kathir@sktechnology.in',
          passwordHash: 'kathir123',
          role: 'TECHNICIAN',
          phone: '+91 98765 43210',
          specialties: ['CCTV Installation', 'IP Cameras', 'NVR Setup'],
          rating: 4.9,
          completedJobsCount: 154,
        },
        {
          name: 'Vijay',
          email: 'vijay@sktechnology.in',
          passwordHash: 'vijay123',
          role: 'TECHNICIAN',
          phone: '+91 98765 43211',
          specialties: ['Analog Cameras', 'DVR Cable Wiring', 'Hard Disk Replacement'],
          rating: 4.8,
          completedJobsCount: 112,
        },
        {
          name: 'Arul',
          email: 'arul@sktechnology.in',
          passwordHash: 'arul123',
          role: 'TECHNICIAN',
          phone: '+91 98765 43212',
          specialties: ['Smart Security', 'Wi-Fi Cameras', 'Door Phone Systems'],
          rating: 4.7,
          completedJobsCount: 88,
        },
      ]);
      console.log('Technicians seeded successfully.');
    }

    // Seed Customers if none exist
    const customerCount = await User.countDocuments({ role: 'CUSTOMER' });
    if (customerCount === 0) {
      console.log('Seeding Customers into MongoDB...');
      await User.create([
        {
          name: 'Aravind Commercial Logistics',
          email: 'aravind@logistics.in',
          passwordHash: 'cust123',
          role: 'CUSTOMER',
          phone: '+91 98765 43210',
        },
        {
          name: 'Saravana Textiles & Retail',
          email: 'support@saravanatex.in',
          passwordHash: 'cust123',
          role: 'CUSTOMER',
          phone: '+91 94440 98765',
        },
        {
          name: 'Rajesh Kumar',
          email: 'rajesh.k@gmail.com',
          passwordHash: 'cust123',
          role: 'CUSTOMER',
          phone: '+91 91234 56789',
        },
      ]);
      console.log('Customers seeded successfully.');
    }

    // Seed Orders if none exist
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('Seeding initial CCTV Orders into MongoDB...');
      await Order.create([
        {
          orderNumber: 'ORD-8492',
          customerName: 'Aravind Commercial Logistics',
          customerEmail: 'aravind@logistics.in',
          customerPhone: '+91 98765 43210',
          shippingAddress: '42 Usman Road, T. Nagar, Chennai, TN - 600017',
          items: [
            {
              productId: 'prod-1',
              title: 'Hikvision 4-Camera Outdoor HD CCTV System Kit',
              price: 18499,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
            },
          ],
          totalAmount: 18499,
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
        },
        {
          orderNumber: 'ORD-8493',
          customerName: 'Saravana Textiles & Retail',
          customerEmail: 'support@saravanatex.in',
          customerPhone: '+91 94440 98765',
          shippingAddress: '15 GST Road, Guindy, Chennai, TN - 600032',
          items: [
            {
              productId: 'prod-2',
              title: 'CP Plus 2MP Dome Camera & 2TB Seagate SkyHawk Hard Disk',
              price: 6998,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80',
            },
          ],
          totalAmount: 6998,
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
        },
        {
          orderNumber: 'ORD-8488',
          customerName: 'Rajesh Kumar',
          customerEmail: 'rajesh.k@gmail.com',
          customerPhone: '+91 91234 56789',
          shippingAddress: '88 Lakeview Avenue, Shoolagiri, TN - 635117',
          items: [
            {
              productId: 'prod-3',
              title: 'TP-Link Tapo C200 360° Smart Wi-Fi Camera',
              price: 2499,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80',
            },
          ],
          totalAmount: 2499,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
        },
      ]);
      console.log('Orders seeded successfully.');
    }

    // Seed Jobs if none exist
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      console.log('Seeding initial CCTV Jobs into MongoDB...');
      await Job.create([
        {
          jobCode: 'ORD-8492',
          title: 'Hikvision 4-Camera Outdoor HD CCTV System Installation',
          category: 'CCTV Installation',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          scheduledDate: '2026-08-13',
          startDate: '2026-08-13',
          targetCompletionDate: '2026-08-14',
          estimatedDays: 1,
          scheduledTimeSlot: '09:30 AM - 12:30 PM',
          estimatedDuration: '3.0 hrs',
          assignedTechnicians: [
            {
              id: 'tech-01',
              name: 'Kathir',
              phone: '+91 98765 43210',
            },
          ],
          customer: {
            name: 'Aravind Commercial Logistics',
            phone: '+91 98765 43210',
            email: 'aravind@logistics.in',
            address: '42 Usman Road, T. Nagar',
            city: 'Chennai',
            postalCode: '600017',
          },
          scopeOfWork: ['Cable wiring', '4 Bullet Camera Mounts', '4CH DVR Configuration'],
        },
        {
          jobCode: 'ORD-8493',
          title: 'CP Plus Dome Camera Maintenance & 2TB Hard Disk Upgrade',
          category: 'CCTV Maintenance',
          status: 'PENDING',
          priority: 'HIGH',
          scheduledDate: '2026-08-13',
          scheduledTimeSlot: '02:00 PM - 04:00 PM',
          estimatedDuration: '2.0 hrs',
          assignedTechnicians: [
            {
              id: 'tech-01',
              name: 'Kathir',
              phone: '+91 98765 43210',
            },
          ],
          customer: {
            name: 'Saravana Textiles & Retail',
            phone: '+91 94440 98765',
            email: 'support@saravanatex.in',
            address: '15 GST Road, Guindy',
            city: 'Chennai',
            postalCode: '600032',
          },
          scopeOfWork: ['Hard disk installation', 'Continuous recording setup'],
        },
        {
          jobCode: 'ORD-8488',
          title: 'TP-Link Smart Wi-Fi PTZ Camera Setup & Mobile App Sync',
          category: 'Smart Security',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          scheduledDate: '2026-08-12',
          scheduledTimeSlot: '11:00 AM - 01:00 PM',
          estimatedDuration: '2.0 hrs',
          assignedTechnicians: [
            {
              id: 'tech-02',
              name: 'Vijay',
              phone: '+91 98765 43211',
            },
          ],
          customer: {
            name: 'Rajesh Kumar',
            phone: '+91 91234 56789',
            email: 'rajesh.k@gmail.com',
            address: '88 Lakeview Avenue',
            city: 'Shoolagiri',
            postalCode: '635117',
          },
          scopeOfWork: ['Wi-Fi sync', 'Mobile App setup'],
        },
      ]);
      console.log('Jobs seeded successfully.');
    }

    // Seed default clean Dashboard state if none exists
    const dashboardCount = await Dashboard.countDocuments();
    if (dashboardCount === 0) {
      console.log('Seeding clean baseline dashboard document...');
      await Dashboard.create({
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
      });
      console.log('Dashboard clean baseline document seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
