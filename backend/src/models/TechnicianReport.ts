import mongoose, { Schema, Document } from 'mongoose';

export interface ITechnicianReport extends Document {
  technicianId: string;
  technicianName: string;
  date: string; // YYYY-MM-DD
  activityType: string;
  workDescription: string;
  hoursWorked: number;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string; // 'PRESENT' | 'HALF_DAY' | 'ON_LEAVE' | 'FIELD_JOB'
  jobId?: string; // Optional reference to a Job
  jobCode?: string;
  customerName?: string;
  location?: string;
  isMultiDay?: boolean;
  dayNumber?: number;
  beforePhotos?: string[];
  afterPhotos?: string[];
  voiceNoteUrl?: string;
  hasVoiceNote?: boolean;
  approvedByAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianReportSchema: Schema = new Schema(
  {
    technicianId: { type: String, required: true },
    technicianName: { type: String, required: true },
    date: { type: String, required: true },
    activityType: { 
      type: String, 
      required: true,
      default: 'Customer Job'
    },
    workDescription: { type: String, required: true },
    hoursWorked: { type: Number, required: true, default: 8 },
    checkInTime: { type: String, default: '' },
    checkOutTime: { type: String, default: '' },
    status: { type: String, default: 'PRESENT' },
    jobId: { type: String, default: '' },
    jobCode: { type: String, default: '' },
    customerName: { type: String, default: '' },
    location: { type: String, default: '' },
    isMultiDay: { type: Boolean, default: false },
    dayNumber: { type: Number, default: 1 },
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],
    voiceNoteUrl: { type: String, default: '' },
    hasVoiceNote: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ITechnicianReport>('TechnicianReport', TechnicianReportSchema);
