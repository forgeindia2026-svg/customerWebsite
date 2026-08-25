import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryMessage {
  id?: string;
  sender: string;
  role?: string; // 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER'
  time: string;
  text: string;
  createdAt?: Date;
}

export interface IQuery extends Document {
  ticketId: string;
  type: 'Customer' | 'Technician';
  raisedBy: string;
  raisedById?: string;
  phone?: string;
  email?: string;
  subject: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  description: string;
  messages: IQueryMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const QueryMessageSchema: Schema = new Schema(
  {
    sender: { type: String, required: true },
    role: { type: String, default: 'Customer' },
    time: { type: String, default: '' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const QuerySchema: Schema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['Customer', 'Technician'], required: true, index: true },
    raisedBy: { type: String, required: true, index: true },
    raisedById: { type: String, index: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    subject: { type: String, required: true },
    category: { type: String, default: 'General Support' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open', index: true },
    description: { type: String, default: '' },
    messages: [QueryMessageSchema]
  },
  { timestamps: true }
);

export default mongoose.model<IQuery>('Query', QuerySchema);
