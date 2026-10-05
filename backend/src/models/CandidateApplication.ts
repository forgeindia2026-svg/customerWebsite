import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateApplication extends Document {
  applicantName: string;
  email: string;
  phone?: string;
  city?: string;
  appliedJob: string;
  company: string;
  appliedOn: string;
  hrReference: {
    hrName: string;
    hrCode: string;
    hrId?: string;
  };
  payment: {
    amount: number;
    transactionId: string;
    status: string;
  };
  status: 'Applied' | 'Under Review' | 'Interview Scheduled' | 'Hired' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CandidateApplicationSchema: Schema = new Schema(
  {
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    appliedJob: { type: String, required: true },
    company: { type: String, required: true },
    appliedOn: { type: String, default: () => new Date().toLocaleDateString('en-US') },
    hrReference: {
      hrName: { type: String, default: 'Priyadharshini' },
      hrCode: { type: String, default: 'HR-27394' },
      hrId: { type: String },
    },
    payment: {
      amount: { type: Number, default: 49 },
      transactionId: { type: String, default: 'pay_Tk6vspLO3AI1J1' },
      status: { type: String, default: 'Applied' },
    },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Hired', 'Rejected'],
      default: 'Applied',
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICandidateApplication>('CandidateApplication', CandidateApplicationSchema);
