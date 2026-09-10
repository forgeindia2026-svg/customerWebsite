import mongoose, { Schema, Document } from 'mongoose';

export interface IPunchSession {
  _id?: any;
  punchInTime: string; // e.g. "09:15 AM"
  punchInTimestamp: Date;
  punchInPhoto?: string; // Selfie / Verification photo URL
  punchInLocation?: string;
  punchInLatitude?: number;
  punchInLongitude?: number;
  punchOutTime?: string; // e.g. "01:30 PM"
  punchOutTimestamp?: Date;
  punchOutPhoto?: string;
  punchOutLocation?: string;
  punchOutLatitude?: number;
  punchOutLongitude?: number;
  durationHours?: number; // e.g. 4.25
  notes?: string;
}

export interface ITechnicianAttendance extends Document {
  technicianId: string;
  technicianName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // e.g. "09:15 AM" (initial or current session)
  checkInTimestamp?: Date;
  punchInPhoto?: string; // Latest / first punch in photo URL
  checkOutTime?: string; // e.g. "06:30 PM"
  checkOutTimestamp?: Date;
  totalHours: number; // Cumulative decimal hours e.g. 8.5
  status: 'PRESENT' | 'HALF_DAY' | 'OVERTIME' | 'OFF_DUTY';
  location?: string; // Check-in location
  latitude?: number;
  longitude?: number;
  checkOutLocation?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  notes?: string;
  punches: IPunchSession[]; // Array of all punch-in and punch-out sessions for the day
  createdAt: Date;
  updatedAt: Date;
}

const PunchSessionSchema = new Schema({
  punchInTime: { type: String, default: '' },
  punchInTimestamp: { type: Date },
  punchInPhoto: { type: String, default: '' },
  punchInLocation: { type: String, default: '' },
  punchInLatitude: { type: Number },
  punchInLongitude: { type: Number },
  punchOutTime: { type: String, default: '' },
  punchOutTimestamp: { type: Date },
  punchOutPhoto: { type: String, default: '' },
  punchOutLocation: { type: String, default: '' },
  punchOutLatitude: { type: Number },
  punchOutLongitude: { type: Number },
  durationHours: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { _id: true });

const TechnicianAttendanceSchema: Schema = new Schema(
  {
    technicianId: { type: String, required: true, index: true },
    technicianName: { type: String, required: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkInTime: { type: String, default: '' },
    checkInTimestamp: { type: Date },
    punchInPhoto: { type: String, default: '' },
    checkOutTime: { type: String, default: '' },
    checkOutTimestamp: { type: Date },
    totalHours: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['PRESENT', 'HALF_DAY', 'OVERTIME', 'OFF_DUTY'], 
      default: 'PRESENT' 
    },
    location: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    checkOutLocation: { type: String, default: '' },
    checkOutLatitude: { type: Number },
    checkOutLongitude: { type: Number },
    notes: { type: String, default: '' },
    punches: { type: [PunchSessionSchema], default: [] }
  },
  { timestamps: true }
);

// Compound index to ensure 1 attendance record per technician per date
TechnicianAttendanceSchema.index({ technicianId: 1, date: 1 }, { unique: true });

export default mongoose.model<ITechnicianAttendance>('TechnicianAttendance', TechnicianAttendanceSchema);
