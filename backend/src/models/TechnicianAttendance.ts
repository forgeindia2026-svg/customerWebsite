import mongoose, { Schema, Document } from 'mongoose';

export interface ITechnicianAttendance extends Document {
  technicianId: string;
  technicianName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // e.g. "09:15 AM"
  checkInTimestamp?: Date;
  checkOutTime?: string; // e.g. "06:30 PM"
  checkOutTimestamp?: Date;
  totalHours: number; // Decimal hours e.g. 8.5
  status: 'PRESENT' | 'HALF_DAY' | 'OVERTIME' | 'OFF_DUTY';
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianAttendanceSchema: Schema = new Schema(
  {
    technicianId: { type: String, required: true, index: true },
    technicianName: { type: String, required: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkInTime: { type: String, default: '' },
    checkInTimestamp: { type: Date },
    checkOutTime: { type: String, default: '' },
    checkOutTimestamp: { type: Date },
    totalHours: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['PRESENT', 'HALF_DAY', 'OVERTIME', 'OFF_DUTY'], 
      default: 'PRESENT' 
    },
    location: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Compound index to ensure 1 attendance record per technician per date
TechnicianAttendanceSchema.index({ technicianId: 1, date: 1 }, { unique: true });

export default mongoose.model<ITechnicianAttendance>('TechnicianAttendance', TechnicianAttendanceSchema);
