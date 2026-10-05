import mongoose, { Schema, Document } from 'mongoose';

export interface IHrReference extends Document {
  hrName: string;
  hrCode: string;
  email?: string;
  phone?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const HrReferenceSchema: Schema = new Schema(
  {
    hrName: { type: String, required: true },
    hrCode: { type: String, required: true, unique: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    department: { type: String, default: 'Human Resources' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.model<IHrReference>('HrReference', HrReferenceSchema);
