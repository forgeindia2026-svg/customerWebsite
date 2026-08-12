require('dotenv').config();
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  items: [
    {
      productId: { type: String, required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String },
    },
  ],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  orderStatus: { type: String, enum: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PROCESSING' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const sampleProducts = [
  { productId: 'p1', title: 'Finolex 3+1 CCTV Cable (90m)', price: 2800, image: 'local:accessories.png' },
  { productId: 'p2', title: 'CP Plus 8 Channel NVR', price: 4500, image: 'local:dvr.png' },
  { productId: 'p3', title: 'Hikvision 4MP IP Dome Camera', price: 1200, image: 'local:ip_camera.png' },
];

const firstNames = ['Arun', 'Karthik', 'Suresh', 'Ramesh', 'Vijay', 'Ajith', 'Surya', 'Vikram'];
const lastNames = ['Kumar', 'Raj', 'Sharma', 'Singh', 'Natarajan', 'Iyer', 'Reddy'];
const locations = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];

const generateOrders = (count) => {
  const orders = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Generate a date within the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    // Pick 1 to 3 items
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      items.push({
        productId: product.productId,
        title: product.title,
        price: product.price,
        quantity: qty,
        image: product.image
      });
      totalAmount += (product.price * qty);
    }
    
    const statusRand = Math.random();
    let orderStatus = 'DELIVERED';
    let paymentStatus = 'PAID';
    
    if (daysAgo < 2) {
      orderStatus = 'PROCESSING';
      paymentStatus = Math.random() > 0.5 ? 'PAID' : 'PENDING';
    } else if (daysAgo < 5) {
      orderStatus = 'SHIPPED';
    }
    
    const customerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const loc = locations[Math.floor(Math.random() * locations.length)];
    
    orders.push({
      orderNumber: `ORD-${10000 + i}`,
      customerName,
      customerEmail: `${customerName.replace(' ', '.').toLowerCase()}@gmail.com`,
      customerPhone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
      shippingAddress: `123 Main St, ${loc}, Tamil Nadu`,
      items,
      totalAmount,
      paymentStatus,
      orderStatus,
      createdAt: orderDate,
      updatedAt: orderDate
    });
  }
  return orders;
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  // Clear existing dummy orders if any
  await Order.deleteMany({});
  
  const dummyOrders = generateOrders(35);
  await Order.insertMany(dummyOrders);
  
  console.log(`Successfully seeded ${dummyOrders.length} dummy orders.`);
  
  // Create a few active Service Requests (Jobs) as well
  const JobSchema = new mongoose.Schema({}, { strict: false });
  const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
  await Job.deleteMany({ status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } });
  
  const dummyJobs = [
    {
      ticketId: 'TKT-1001',
      customerName: 'Ashok Kumar',
      customerPhone: '+91 9876543210',
      address: 'Anna Nagar, Chennai',
      issueDescription: 'CCTV Camera 2 is showing black screen',
      serviceType: 'REPAIR',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      ticketId: 'TKT-1002',
      customerName: 'Meena',
      customerPhone: '+91 9876543211',
      address: 'T Nagar, Chennai',
      issueDescription: 'New 4 Camera Setup Installation',
      serviceType: 'INSTALLATION',
      priority: 'MEDIUM',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
  
  await Job.insertMany(dummyJobs);
  console.log(`Successfully seeded ${dummyJobs.length} dummy jobs.`);
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
