import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  specialties?: string[];
  rating?: number;
  completedJobsCount?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  currentJobId?: string;
  amcPlan?: string;
  amcExpires?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['CUSTOMER', 'TECHNICIAN', 'ADMIN'], default: 'CUSTOMER' },
    avatar: { type: String },
    specialties: [{ type: String }],
    rating: { type: Number, default: 5.0 },
    completedJobsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    currentJobId: { type: String, default: null },
    amcPlan: { type: String, default: 'Gold AMC Plan' },
    amcExpires: { type: String, default: 'May 20, 2026' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
