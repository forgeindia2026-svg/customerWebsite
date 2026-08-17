import mongoose, { Schema, Document } from 'mongoose';

export interface ITechnicianReport extends Document {
  technicianId: string;
  technicianName: string;
  date: string; // YYYY-MM-DD
  activityType: string;
  workDescription: string;
  hoursWorked: number;
  jobId?: string; // Optional reference to a Job
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
      enum: ['Customer Job', 'Office Work', 'Maintenance', 'Standby', 'Leave'],
      default: 'Customer Job'
    },
    workDescription: { type: String, required: true },
    hoursWorked: { type: Number, required: true },
    jobId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITechnicianReport>('TechnicianReport', TechnicianReportSchema);
