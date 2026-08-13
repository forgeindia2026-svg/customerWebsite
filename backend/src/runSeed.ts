import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from './seed';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cctvwebsite';

console.log('Connecting to MongoDB at:', mongoUri);

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB successfully.');
  await seedDatabase();
  console.log('SEED COMPLETE SUCCESS');
  process.exit(0);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
