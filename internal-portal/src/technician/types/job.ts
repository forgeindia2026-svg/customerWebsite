export type JobStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'BEFORE_PHOTOS_DONE'
  | 'INSPECTED'
  | 'DAILY_REPORTED'
  | 'AFTER_PHOTOS_DONE'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CustomerInformation {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface InstallationDetails {
  equipmentType: string;
  modelNumber: string;
  serialNumber: string;
  locationDetails: string;
  specialInstructions?: string;
}

export interface InspectionCheckitem {
  id: string;
  label: string;
  passed: boolean;
  notes?: string;
}

export interface InspectionSummary {
  inspectedBy: string;
  inspectionDate: string;
  checklistPassed: boolean;
  checklistItems: InspectionCheckitem[];
  safetyVerified: boolean;
  voltageReading?: string;
  groundingStatus?: string;
  notes: string;
}

export interface DailyReport {
  id: string;
  date: string;
  technicianName: string;
  hoursWorked: number;
  workDone: string;
  materialsUsed: string[];
  issuesEncountered?: string;
  statusUpdate: string;
  createdAt: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
  type: 'BEFORE' | 'AFTER';
}

export interface JobActivity {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface CompletionSummary {
  completedAt: string;
  notes: string;
  qualityPassed: boolean;
  customerSignatureUrl?: string;
  technicianSignatureUrl?: string;
}

export interface Job {
  id: string;
  jobCode: string;
  title: string;
  category: string;
  status: JobStatus;
  priority: Priority;
  scheduledDate: string;
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  estimatedDays?: number;
  scheduledTimeSlot: string;
  estimatedDuration: string;
  assignedTechnicians?: Array<{
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  }>;
  requiredTechniciansCount?: number;
  orderCategory?: string;
  customer: CustomerInformation;
  installation: InstallationDetails;
  inspection?: InspectionSummary;
  workProgress?: {
    taskDescription?: string;
    beforeWorkPhotos?: JobPhoto[];
    inspectionComments?: string;
    startedAt?: string;
    updatedAt?: string;
    updatedBy?: string;
  };
  taskDescription?: string;
  inspectionComments?: string;
  dailyReports: DailyReport[];
  beforePhotos: JobPhoto[];
  afterPhotos: JobPhoto[];
  activities: JobActivity[];
  completionSummary?: CompletionSummary;
  createdAt: string;
  updatedAt: string;
}

export interface JobFilterOptions {
  searchQuery: string;
  status: JobStatus | 'ALL';
  priority: Priority | 'ALL';
  sortBy: 'scheduledDate' | 'priority' | 'jobCode';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface PaginatedJobsResponse {
  data: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalAssigned: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    onHoldCount: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ASSIGNMENT' | 'URGENT' | 'SYSTEM' | 'UPDATE';
  jobId?: string;
}

export interface TechnicianProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  badgeNumber: string;
  certifications: string[];
  vehicleNumber: string;
  status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_JOB';
  rating: number;
  completedJobsCount: number;
  avatarUrl: string;
}
