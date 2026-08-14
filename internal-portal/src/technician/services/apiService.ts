import type {
  Job,
  JobFilterOptions,
  PaginatedJobsResponse,
  JobStatus,
  DailyReport,
  InspectionSummary,
  NotificationItem,
  TechnicianProfile
} from '../types/job';

// Live MongoDB Database Mode (Zero Mock Data)
const MOCK_JOBS_DATABASE: Job[] = [];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `http://${host}:5000`;
  }
  return import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
};

export const JobsApiService = {
  async getDashboardSummary(): Promise<any> {
    try {
      const baseUrl = getApiUrl();
      const techId = localStorage.getItem('user_id') || 'tech-kathir';
      const res = await fetch(`${baseUrl}/api/jobs/dashboard-summary?technicianId=${techId}`);
      const resData = await res.json();
      if (resData && resData.success && resData.data) {
        return resData.data;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching dashboard summary:', err);
      return null;
    }
  },

  async getAssignedJobs(options: JobFilterOptions): Promise<PaginatedJobsResponse> {
    const techId = localStorage.getItem('user_id') || 'tech-kathir';
    const techName = localStorage.getItem('user_name') || 'kathir';

    try {
      const baseUrl = getApiUrl();
      const searchVal = options.searchQuery || '';
      const statusVal = options.status && options.status !== 'ALL' ? options.status : '';
      const url = `${baseUrl}/api/jobs?technicianId=${techId}&technicianName=${encodeURIComponent(techName)}&includeAvailable=true&status=${statusVal}&search=${encodeURIComponent(searchVal)}`;
      const res = await fetch(url);
      const resData = await res.json();
      let rawJobs = resData.data || [];

      const lowerTechName = techName?.toLowerCase().trim();

      const getAssignedTechName = (j: any) => {
        const techList = j.assignedTechnicians || (j.assignedTechnician ? [j.assignedTechnician] : []);
        if (techList && techList.length > 0 && techList[0].name && techList[0].name !== 'Unassigned' && techList[0].name !== 'Unassigned Technician') {
          return techList[0].name;
        }
        if (j.assignedTechnician && typeof j.assignedTechnician === 'string' && j.assignedTechnician !== 'Unassigned') {
          return j.assignedTechnician;
        }
        return null;
      };

      const isJobAssignedToMe = (j: any) => {
        const techList = j.assignedTechnicians || (j.assignedTechnician ? [j.assignedTechnician] : []);
        const assignedName = getAssignedTechName(j);
        if (lowerTechName && assignedName && assignedName.toLowerCase().trim() === lowerTechName) {
          return true;
        }
        return techList.some((t: any) => 
          (techId && t.id === techId) || 
          (lowerTechName && t.name && t.name.toLowerCase().trim() === lowerTechName)
        );
      };

      // Map backend Mongoose jobs schema to what the Technician frontend expects
      const mappedJobs = rawJobs.map((j: any) => {
        const assignedTechName = getAssignedTechName(j) || 'kathir';
        const rawStatus = (j.status || 'IN_PROGRESS').toString().toUpperCase();
        
        let normStatus: JobStatus = 'IN_PROGRESS';
        if (rawStatus === 'COMPLETED' || rawStatus === 'DELIVERED' || rawStatus === 'APPROVED') {
          normStatus = 'COMPLETED';
        } else if (rawStatus === 'PENDING' || rawStatus === 'PENDING APPROVAL') {
          normStatus = 'PENDING';
        } else if (rawStatus === 'ON_HOLD') {
          normStatus = 'ON_HOLD';
        } else {
          normStatus = 'IN_PROGRESS';
        }

        const unassigned = !j.assignedTechnician && (!j.assignedTechnicians || j.assignedTechnicians.length === 0);

        return {
          id: j._id || j.id || `job-${Math.random()}`,
          jobCode: j.jobCode || '#SK-JOB',
          title: j.title || 'CCTV Installation & Maintenance',
          category: j.category || 'CCTV Installation',
          status: normStatus,
          priority: (j.priority || 'MEDIUM').toString().toUpperCase(),
          isAssignedToMe: true,
          isAvailableToAccept: unassigned,
          assignedTechnicianName: assignedTechName,
          scheduledDate: j.scheduledDate || new Date().toISOString().split('T')[0],
          startDate: j.startDate || new Date().toISOString().split('T')[0],
          targetCompletionDate: j.targetCompletionDate,
          estimatedDays: j.estimatedDays || 1,
          scheduledTimeSlot: j.scheduledTimeSlot || '09:00 AM - 12:00 PM',
          estimatedDuration: j.estimatedDuration || '3 hrs',
          assignedTechnician: { name: assignedTechName, id: techId || 'tech-kathir' },
          customer: j.customer && j.customer.name ? j.customer : {
            name: 'Customer Client',
            phone: '+91 98765 43210',
            email: 'customer@example.com',
            address: 'Chennai Main Area',
            city: 'Chennai',
            postalCode: '600032'
          },
          installation: j.installation && typeof j.installation === 'object' ? j.installation : {
            equipmentType: 'CCTV Hardware & DVR',
            modelNumber: 'CP-PLUS-8CH',
            serialNumber: 'SN-2026-99',
            locationDetails: 'Customer Premises',
            specialInstructions: 'Standard setup'
          },
          scopeOfWork: Array.isArray(j.scopeOfWork) ? j.scopeOfWork : ['Mount Cameras', 'Wiring & DVR Connection', 'Testing'],
          equipmentList: Array.isArray(j.equipmentList) ? j.equipmentList : [],
          notes: Array.isArray(j.notes) ? j.notes : [],
          fieldNotes: j.fieldNotes || '',
          beforePhotos: Array.isArray(j.beforePhotos) ? j.beforePhotos : [],
          afterPhotos: Array.isArray(j.afterPhotos) ? j.afterPhotos : [],
          dailyReports: Array.isArray(j.dailyReports) ? j.dailyReports : [],
          activities: Array.isArray(j.activities) ? j.activities : [],
          createdAt: j.createdAt || new Date().toISOString(),
          updatedAt: j.updatedAt || new Date().toISOString()
        };
      });

      // Filter priority manually if needed
      let filtered = mappedJobs;
      if (options.priority && options.priority !== 'ALL') {
        filtered = filtered.filter((j: any) => j.priority === options.priority);
      }

      const myJobs = mappedJobs.filter((j: any) => j.isAssignedToMe);

      const stats = {
        totalAssigned: mappedJobs.length,
        totalAvailable: mappedJobs.filter((j: any) => j.isAvailableToAccept).length,
        pendingCount: mappedJobs.filter((j: any) => j.status === 'PENDING').length,
        inProgressCount: mappedJobs.filter((j: any) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length,
        completedCount: mappedJobs.filter((j: any) => j.status === 'COMPLETED').length,
        onHoldCount: mappedJobs.filter((j: any) => j.status === 'ON_HOLD').length,
      };

      const startIndex = (options.page - 1) * options.limit;
      const paginatedData = filtered.slice(startIndex, startIndex + options.limit);
      const totalPages = Math.ceil(filtered.length / options.limit) || 1;

      return {
        data: paginatedData,
        total: filtered.length,
        page: options.page,
        limit: options.limit,
        totalPages,
        stats,
      };
    } catch (err) {
      console.warn('Backend jobs fetch notice (Live DB mode active):', err);
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: 1,
        stats: {
          totalAssigned: 0,
          totalAvailable: 0,
          pendingCount: 0,
          inProgressCount: 0,
          completedCount: 0,
          onHoldCount: 0,
        },
      };
    }
  },

  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard`);
      const resData = await res.json();
      if (resData.success && resData.data && resData.data.notifications) {
        return resData.data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })).reverse();
      }
      return [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<NotificationItem[]> {
    // Ideally this would hit a backend endpoint to mark it read, but for now we'll just return the updated list locally in the frontend state.
    return [];
  },

  async acceptJob(jobId: string, technicianProfile: TechnicianProfile): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician: technicianProfile })
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message);
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error accepting job:', err);
      throw err;
    }
  },

  async rejectJob(jobId: string, technicianProfile: TechnicianProfile, reason?: string): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          technicianId: technicianProfile.id,
          technicianName: technicianProfile.name,
          reason: reason || 'Not available for job assignment'
        })
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message);
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error rejecting job:', err);
      throw err;
    }
  },

  async getTechnicianProfile(): Promise<TechnicianProfile> {
    const id = localStorage.getItem('user_id') || 'tech-01';
    const name = localStorage.getItem('user_name') || 'Technician';
    const email = localStorage.getItem('user_email') || 'tech@sktechnology.in';
    const phone = localStorage.getItem('user_phone') || '+91 99999 99999';

    return {
      id,
      name,
      email,
      phone,
      role: 'Field Service Technician',
      badgeNumber: `SK-TECH-${id.substring(0, 4).toUpperCase()}`,
      certifications: ['Certified Field Tech Level 4', 'LOTO Safety Certified'],
      vehicleNumber: 'Ford Transit #SK-408',
      status: 'ON_DUTY',
      rating: 5.0,
      completedJobsCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    };
  },

  async updateTechnicianStatus(status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_JOB'): Promise<TechnicianProfile> {
    const profile = await this.getTechnicianProfile();
    profile.status = status;
    return profile;
  },

  mapJob(j: any): Job {
    if (!j) {
      throw new Error('Server returned an empty or invalid job response.');
    }
    return {
      id: j._id || j.id,
      jobCode: j.jobCode || j._id || 'SK-JOB-0000',
      title: j.title || 'CCTV Service Request',
      category: j.category || 'General Service',
      status: j.status || 'PENDING',
      priority: j.priority || 'MEDIUM',
      scheduledDate: j.scheduledDate || new Date().toISOString().split('T')[0],
      startDate: j.startDate,
      targetCompletionDate: j.targetCompletionDate,
      estimatedDays: j.estimatedDays || 1,
      scheduledTimeSlot: j.scheduledTimeSlot || '09:00 AM - 12:00 PM',
      estimatedDuration: j.estimatedDuration || '3 hrs',
      assignedTechnician: (j.assignedTechnicians && j.assignedTechnicians.length > 0) ? j.assignedTechnicians[0] : j.assignedTechnician,
      customer: j.customer || {
        name: 'N/A',
        phone: 'N/A',
        email: 'N/A',
        address: 'N/A',
        city: 'N/A',
        postalCode: 'N/A'
      },
      installation: j.installation || {
        equipmentType: 'General Hardware',
        modelNumber: 'N/A',
        serialNumber: 'N/A',
        locationDetails: 'N/A',
        specialInstructions: ''
      },
      scopeOfWork: j.scopeOfWork || [],
      equipmentList: j.equipmentList || [],
      notes: j.notes || [],
      fieldNotes: j.fieldNotes || '',
      beforePhotos: j.beforePhotos || [],
      afterPhotos: j.afterPhotos || [],
      dailyReports: j.dailyReports || [],
      activities: j.activities || [],
      createdAt: j.createdAt || new Date().toISOString(),
      updatedAt: j.updatedAt || new Date().toISOString()
    };
  },

  async updateJobStatus(jobId: string, status: JobStatus, note?: string): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      const resData = await res.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.message || `Failed to update job ${jobId}`);
      }
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error updating job status:', err);
      throw err;
    }
  },

  async uploadJobPhoto(jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER'): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: type === 'BEFORE' ? 'BEFORE_PHOTOS_DONE' : 'AFTER_PHOTOS_DONE',
          photo: {
            url: photoUrl,
            caption: caption,
            type: type,
            uploadedAt: new Date().toLocaleTimeString()
          }
        })
      });
      const resData = await res.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.message || `Failed to upload photo for job ${jobId}`);
      }
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error uploading photo:', err);
      throw err;
    }
  },

  async completeJob(jobId: string, completionNotes: string, signatureData?: string): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'COMPLETED',
          fieldNotes: completionNotes
        })
      });
      const resData = await res.json();
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error completing job:', err);
      throw err;
    }
  },

  async saveInspectionSummary(jobId: string, summary: InspectionSummary): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'INSPECTED',
          inspection: summary 
        })
      });
      const resData = await res.json();
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error saving inspection summary:', err);
      throw err;
    }
  },

  async addDailyReport(jobId: string, report: Omit<DailyReport, 'id' | 'createdAt'>): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'DAILY_REPORTED',
          dailyReport: report 
        })
      });
      const resData = await res.json();
      return this.mapJob(resData.data);
    } catch (err) {
      console.error('Error adding daily report:', err);
      throw err;
    }
  },

  async autoAssignNextJob(technicianId: string): Promise<{ success: boolean; assignedJob?: Job; message: string }> {
    return { success: false, message: 'Auto-assignment is disabled. Jobs must be assigned by Admin.' };
  }
};
