import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  technicianId?: string;
  technicianName: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: 'Petrol / Fuel' | 'Food / Refreshment' | 'Travel & Toll' | 'Materials / Hardware' | 'Site Tools' | 'Miscellaneous';
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
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'Petrol / Fuel',
        'Food / Refreshment',
        'Travel & Toll',
        'Materials / Hardware',
        'Site Tools',
        'Miscellaneous'
      ],
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

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
