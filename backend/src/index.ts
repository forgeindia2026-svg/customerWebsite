import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import path from 'path';

import productRoutes from './routes/productRoutes';
import jobRoutes from './routes/jobRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import categoryRoutes from './routes/categoryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import reportRoutes from './routes/reportRoutes';
import { seedDatabase } from './seed';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io Real-time Gateway
initSocket(server);

app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CCTV eCommerce Backend API & Socket Server is running', timestamp: new Date() });
});

import attendanceRoutes from './routes/attendanceRoutes';

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);

import Job from './models/Job';

// Database connection & Server start
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cctv-ecommerce';

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully.');
    try {
      await Job.syncIndexes();
      console.log('⚡ Job database indexes synchronized.');
    } catch (e: any) {
      console.warn('Index sync note:', e.message);
    }
    // await seedDatabase();
  })
  .catch((err) => {
    console.error('⚠️ MongoDB Connection Note:', err.message || err);
    console.log('ℹ️ Operating in fallback mode or waiting for MongoDB service startup...');
  });

server.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 Shared Backend API & Socket Server is running at http://0.0.0.0:${port}`);
});
