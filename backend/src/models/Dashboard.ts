import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboard extends Document {
  orders: any[];
  customers: any[];
  technicians: any[];
  projects: any[];
  serviceRequests: any[];
  products: any[];
  inventory: any[];
  payments: any[];
  notifications: any[];
  settings: any;
  chartData: any[];
  queries: any[];
  announcements: any[];
  banners: any[];
  brands: any[];
  qrCodes: any[];
}

const DashboardSchema = new Schema(
  {
    orders: { type: Array, default: [] },
    customers: { type: Array, default: [] },
    technicians: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    serviceRequests: { type: Array, default: [] },
    products: { type: Array, default: [] },
    inventory: { type: Array, default: [] },
    payments: { type: Array, default: [] },
    notifications: { type: Array, default: [] },
    settings: { type: Object, default: {} },
    chartData: { type: Array, default: [] },
    queries: { type: Array, default: [] },
    announcements: { type: Array, default: [] },
    banners: { type: Array, default: [] },
    brands: { type: Array, default: [] },
    qrCodes: { type: Array, default: [] }
  },
  { timestamps: true }
);

export default mongoose.model<IDashboard>('Dashboard', DashboardSchema);
