import mongoose, { Schema, Document } from 'mongoose';

export type JobStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type JobAcceptanceStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface IJob extends Document {
  jobCode: string;
  title: string;
  category: string;
  status: JobStatus;
  priority: JobPriority;
  acceptanceStatus?: JobAcceptanceStatus;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt?: string;
  };
  proofImages?: Array<{
    id: string;
    url: string;
    caption?: string;
    uploadedAt?: string;
  }>;
  scheduledDate: string;
  startDate?: string;
  targetCompletionDate?: string;
  estimatedDays?: number;
  scheduledTimeSlot?: string;
  estimatedDuration?: string;
  assignedTechnicians?: Array<{
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  }>;
  requiredTechniciansCount?: number;
  orderCategory?: 'Delivery Only' | 'Delivery & Installation';
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
  scopeOfWork?: string[];
  equipmentList?: Array<{ name: string; serialNumber?: string; status?: string }>;
  notes?: string[];
  fieldNotes?: string;
  dailyReports?: Array<{
    id: string;
    date: string;
    technicianName: string;
    hoursWorked: number;
    workDone: string;
    materialsUsed?: string[];
    issuesEncountered?: string;
    statusUpdate: string;
    createdAt?: Date;
  }>;
  beforePhotos?: Array<{
    id: string;
    url: string;
    caption: string;
    uploadedAt: string;
  }>;
  afterPhotos?: Array<{
    id: string;
    url: string;
    caption: string;
    uploadedAt: string;
  }>;
  inspection?: {
    inspectedBy: string;
    inspectionDate: string;
    checklistPassed: boolean;
    safetyVerified: boolean;
    notes: string;
  };
  rejectedTechnicianIds?: string[];
  customerConfirmed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    jobCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'BEFORE_PHOTOS_DONE', 'AFTER_PHOTOS_DONE', 'INSPECTED', 'DAILY_REPORTED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    acceptanceStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
    rejectedTechnicianIds: [{ type: String }],
    customerConfirmed: { type: Boolean, default: false },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: String },
    },
    proofImages: [
      {
        id: { type: String },
        url: { type: String },
        caption: { type: String },
        uploadedAt: { type: String },
      },
    ],
    scheduledDate: { type: String, required: true },
    startDate: { type: String },
    targetCompletionDate: { type: String },
    estimatedDays: { type: Number, default: 1 },
    scheduledTimeSlot: { type: String },
    estimatedDuration: { type: String },
    assignedTechnicians: [
      {
        id: { type: String },
        name: { type: String },
        avatar: { type: String },
        phone: { type: String },
      },
    ],
    requiredTechniciansCount: { type: Number, default: 1 },
    orderCategory: { type: String, default: 'Delivery & Installation' },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    scopeOfWork: [{ type: String }],
    equipmentList: [
      {
        name: { type: String },
        serialNumber: { type: String },
        status: { type: String },
      },
    ],
    notes: [{ type: String }],
    fieldNotes: { type: String },
    dailyReports: [
      {
        id: { type: String },
        date: { type: String },
        technicianName: { type: String },
        hoursWorked: { type: Number },
        workDone: { type: String },
        materialsUsed: [{ type: String }],
        issuesEncountered: { type: String },
        statusUpdate: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    beforePhotos: [
      {
        id: { type: String },
        url: { type: String },
        caption: { type: String },
        uploadedAt: { type: String }
      }
    ],
    afterPhotos: [
      {
        id: { type: String },
        url: { type: String },
        caption: { type: String },
        uploadedAt: { type: String }
      }
    ],
    inspection: {
      inspectedBy: { type: String },
      inspectionDate: { type: String },
      checklistPassed: { type: Boolean },
      safetyVerified: { type: Boolean },
      notes: { type: String }
    }
  },
  { timestamps: true }
);

// High-Performance Database Indexes for Technician Portal & Admin Dashboards
JobSchema.index({ 'assignedTechnicians.id': 1, status: 1, createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ priority: 1, createdAt: -1 });
JobSchema.index({ jobCode: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
