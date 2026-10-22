import mongoose, { Schema, Document } from 'mongoose';

export interface IPettyCashTopup {
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  paymentMode?: string; // UPI, Net Banking, Cash, etc.
  addedBy?: string;
  createdAt?: Date;
}

export interface IPettyCashAccount extends Document {
  branchId: string; // 'branch-1' | 'branch-2'
  branchName: string; // 'Branch 1' | 'Branch 2'
  openingBalance: number;
  topups: IPettyCashTopup[];
  createdAt: Date;
  updatedAt: Date;
}

const PettyCashAccountSchema: Schema = new Schema(
  {
    branchId: { type: String, required: true, unique: true },
    branchName: { type: String, required: true },
    openingBalance: { type: Number, default: 0 },
    topups: [
      {
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        notes: { type: String, default: '' },
        paymentMode: { type: String, default: 'Cash' },
        addedBy: { type: String, default: 'Admin' },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<IPettyCashAccount>('PettyCashAccount', PettyCashAccountSchema);
