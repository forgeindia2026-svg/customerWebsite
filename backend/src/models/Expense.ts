import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  technicianId?: string;
  technicianName: string;
  expenseType: 'TECHNICIAN' | 'OFFICE';
  fundSource: 'Admin Account' | 'Branch 1 Petty Cash' | 'Branch 2 Petty Cash' | string;
  paymentMode: 'UPI - PhonePe' | 'UPI - GPay' | 'UPI - Paytm' | 'Net Banking' | 'Cash' | 'Petty Cash' | string;
  referenceId?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: string;
  amount: number;
  notes?: string;
  receiptPhoto?: string;
  jobCode?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    technicianId: { type: String, default: '' },
    technicianName: { type: String, required: true },
    expenseType: {
      type: String,
      enum: ['TECHNICIAN', 'OFFICE'],
      default: 'TECHNICIAN'
    },
    fundSource: {
      type: String,
      default: 'Branch 1 Petty Cash'
    },
    paymentMode: {
      type: String,
      default: 'Petty Cash'
    },
    referenceId: { type: String, default: '' },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, default: '' },
    category: {
      type: String,
      default: 'Petrol / Fuel'
    },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    receiptPhoto: { type: String, default: '' },
    jobCode: { type: String, default: '' },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED'],
      default: 'APPROVED'
    },
    createdBy: { type: String, default: 'Admin' }
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ technicianName: 1, date: -1 });
ExpenseSchema.index({ fundSource: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
