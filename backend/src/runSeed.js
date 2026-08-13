const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cctvwebsite';

const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  shippingAddress: String,
  items: Array,
  totalAmount: Number,
  paymentStatus: String,
  orderStatus: String
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  phone: String,
  role: String,
  specialties: Array,
  rating: Number,
  completedJobsCount: Number
}, { timestamps: true });

const JobSchema = new mongoose.Schema({
  jobCode: String,
  title: String,
  category: String,
  status: String,
  priority: String,
  scheduledDate: String,
  scheduledTimeSlot: String,
  estimatedDuration: String,
  assignedTechnicians: Array,
  customer: Object,
  scopeOfWork: Array
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);

async function run() {
  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);

  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    console.log('Seeding Orders...');
    await Order.create([
      {
        orderNumber: 'ORD-8492',
        customerName: 'Aravind Commercial Logistics',
        customerEmail: 'aravind@logistics.in',
        customerPhone: '+91 98765 43210',
        shippingAddress: '42 Usman Road, T. Nagar, Chennai, TN - 600017',
        items: [{ productId: 'prod-1', title: 'Hikvision 4-Camera Outdoor HD CCTV System Kit', price: 18499, quantity: 1 }],
        totalAmount: 18499,
        paymentStatus: 'PAID',
        orderStatus: 'PROCESSING'
      },
      {
        orderNumber: 'ORD-8493',
        customerName: 'Saravana Textiles & Retail',
        customerEmail: 'support@saravanatex.in',
        customerPhone: '+91 94440 98765',
        shippingAddress: '15 GST Road, Guindy, Chennai, TN - 600032',
        items: [{ productId: 'prod-2', title: 'CP Plus 2MP Dome Camera & 2TB Seagate SkyHawk Hard Disk', price: 6998, quantity: 1 }],
        totalAmount: 6998,
        paymentStatus: 'PAID',
        orderStatus: 'PROCESSING'
      },
      {
        orderNumber: 'ORD-8488',
        customerName: 'Rajesh Kumar',
        customerEmail: 'rajesh.k@gmail.com',
        customerPhone: '+91 91234 56789',
        shippingAddress: '88 Lakeview Avenue, Shoolagiri, TN - 635117',
        items: [{ productId: 'prod-3', title: 'TP-Link Tapo C200 360° Smart Wi-Fi Camera', price: 2499, quantity: 1 }],
        totalAmount: 2499,
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED'
      }
    ]);
  }

  const techCount = await User.countDocuments({ role: 'TECHNICIAN' });
  if (techCount === 0) {
    console.log('Seeding Technicians...');
    await User.create([
      { name: 'Kathir', email: 'kathir@sktechnology.in', passwordHash: 'kathir123', role: 'TECHNICIAN', phone: '+91 98765 43210', specialties: ['CCTV Installation', 'IP Cameras'], rating: 4.9, completedJobsCount: 154 },
      { name: 'Vijay', email: 'vijay@sktechnology.in', passwordHash: 'vijay123', role: 'TECHNICIAN', phone: '+91 98765 43211', specialties: ['DVR Cabling', 'Hard Disk Repair'], rating: 4.8, completedJobsCount: 112 },
      { name: 'Arul', email: 'arul@sktechnology.in', passwordHash: 'arul123', role: 'TECHNICIAN', phone: '+91 98765 43212', specialties: ['Wi-Fi Cameras', 'Door Phones'], rating: 4.7, completedJobsCount: 88 }
    ]);
  }

  const custCount = await User.countDocuments({ role: 'CUSTOMER' });
  if (custCount === 0) {
    console.log('Seeding Customers...');
    await User.create([
      { name: 'Aravind Commercial Logistics', email: 'aravind@logistics.in', passwordHash: 'cust123', role: 'CUSTOMER', phone: '+91 98765 43210' },
      { name: 'Saravana Textiles & Retail', email: 'support@saravanatex.in', passwordHash: 'cust123', role: 'CUSTOMER', phone: '+91 94440 98765' },
      { name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', passwordHash: 'cust123', role: 'CUSTOMER', phone: '+91 91234 56789' }
    ]);
  }

  const jobCount = await Job.countDocuments();
  if (jobCount === 0) {
    console.log('Seeding Jobs...');
    await Job.create([
      {
        jobCode: 'ORD-8492',
        title: 'Hikvision 4-Camera Outdoor HD CCTV System Installation',
        category: 'CCTV Installation',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        scheduledDate: '2026-08-13',
        scheduledTimeSlot: '09:30 AM - 12:30 PM',
        estimatedDuration: '3.0 hrs',
        assignedTechnicians: [{ id: 'tech-01', name: 'Kathir', phone: '+91 98765 43210' }],
        customer: { name: 'Aravind Commercial Logistics', phone: '+91 98765 43210', email: 'aravind@logistics.in', address: '42 Usman Road, T. Nagar', city: 'Chennai', postalCode: '600017' }
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
        assignedTechnicians: [{ id: 'tech-01', name: 'Kathir', phone: '+91 98765 43210' }],
        customer: { name: 'Saravana Textiles & Retail', phone: '+91 94440 98765', email: 'support@saravanatex.in', address: '15 GST Road, Guindy', city: 'Chennai', postalCode: '600032' }
      }
    ]);
  }

  console.log('SEEDING FINISHED SUCCESSFULLY');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
