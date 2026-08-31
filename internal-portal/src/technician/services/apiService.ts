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
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'https://65.0.45.64.sslip.io';
};

export const JobsApiService = {
  async getDashboardSummary(): Promise<any> {
    try {
      const baseUrl = getApiUrl();
      const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || '';
      const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';
      const res = await fetch(`${baseUrl}/api/jobs/dashboard-summary?technicianId=${techId}&technicianName=${encodeURIComponent(techName)}`);
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
    const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
    const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || '';
    const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';

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
        if (j.assignedTechnician && typeof j.assignedTechnician === 'object' && j.assignedTechnician.name) {
          return j.assignedTechnician.name;
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
          (techId && (t.id === techId || t._id === techId)) || 
          (lowerTechName && t.name && t.name.toLowerCase().trim() === lowerTechName)
        );
      };

      // Map backend Mongoose jobs schema to what the Technician frontend expects
      const mappedJobs = rawJobs.map((j: any) => {
        const assignedTechName = getAssignedTechName(j);
        const assignedTechId = j.assignedTechnicians?.[0]?.id || (typeof j.assignedTechnician === 'object' ? j.assignedTechnician?.id : '');
        const rawStatus = (j.status || 'PENDING').toString().toUpperCase();
        
        let normStatus: JobStatus = 'PENDING';
        if (rawStatus === 'COMPLETED' || rawStatus === 'DELIVERED' || rawStatus === 'APPROVED' || rawStatus === 'WAITING_ADMIN_APPROVAL') {
          normStatus = 'COMPLETED';
        } else if (rawStatus === 'PENDING' || rawStatus === 'PENDING APPROVAL' || rawStatus === 'ASSIGNED' || rawStatus === 'WAITING_FOR_TECH' || rawStatus === 'ASSIGNMENT_PENDING_ACCEPTANCE') {
          normStatus = 'PENDING';
        } else if (rawStatus === 'ACCEPTED') {
          normStatus = 'ACCEPTED';
        } else if (rawStatus === 'ON_HOLD') {
          normStatus = 'ON_HOLD';
        } else if (rawStatus === 'IN_PROGRESS') {
          normStatus = 'IN_PROGRESS';
        } else {
          normStatus = 'PENDING';
        }

        const unassigned = !assignedTechName && (!j.assignedTechnicians || j.assignedTechnicians.length === 0);
        const assignedToMe = isJobAssignedToMe(j);

        return {
          id: j._id || j.id || `job-${Math.random()}`,
          jobCode: j.jobCode || '#SK-JOB',
          title: j.title || 'CCTV Installation & Maintenance',
          category: j.category || 'CCTV Installation',
          status: normStatus,
          priority: (j.priority || 'MEDIUM').toString().toUpperCase(),
          isAssignedToMe: assignedToMe,
          isAvailableToAccept: unassigned,
          assignedTechnicianName: assignedTechName || 'Unassigned',
          scheduledDate: j.scheduledDate || (j.createdAt ? j.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          startDate: j.startDate || (j.createdAt ? j.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          targetCompletionDate: j.targetCompletionDate,
          estimatedDays: j.estimatedDays || 1,
          scheduledTimeSlot: j.scheduledTimeSlot || '09:00 AM - 12:00 PM',
          estimatedDuration: j.estimatedDuration || '3 hrs',
          assignedTechnician: assignedTechName ? { name: assignedTechName, id: assignedTechId } : undefined,
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
      let filtered = mappedJobs.filter((j: any) => j.isAssignedToMe);
      
      if (options.priority && options.priority !== 'ALL') {
        filtered = filtered.filter((j: any) => j.priority === options.priority);
      }

      const myJobs = filtered;

      const stats = {
        totalAssigned: myJobs.length,
        totalAvailable: mappedJobs.filter((j: any) => j.isAvailableToAccept).length,
        pendingCount: myJobs.filter((j: any) => j.status === 'PENDING').length,
        inProgressCount: myJobs.filter((j: any) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length,
        completedCount: myJobs.filter((j: any) => j.status === 'COMPLETED').length,
        onHoldCount: myJobs.filter((j: any) => j.status === 'ON_HOLD').length,
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/dashboard`);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}/accept`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}/reject`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}`, {
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

  async uploadImageToS3(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'reports');

      const baseUrl = getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success && resData.imageUrl) {
        return resData.imageUrl;
      }
      throw new Error(resData.message || 'Server image upload failed');
    } catch (err) {
      console.error('Image upload failed:', err);
      throw new Error('Failed to upload image to server. Please check your internet connection and try again.');
    }
  },

  async uploadJobPhoto(jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER'): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}`, {
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

  async completeJob(jobId: string, completionNotes: string, signatureData?: string, voiceNoteUrl?: string): Promise<Job> {
    try {
      const baseUrl = getApiUrl();
      const techName = localStorage.getItem('user_name') || 'Field Technician';
      const techId = localStorage.getItem('user_id') || 'TECH-01';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          status: 'COMPLETED',
          fieldNotes: completionNotes,
          voiceNoteUrl: voiceNoteUrl || '',
          hasVoiceNote: Boolean(voiceNoteUrl),
          dailyReport: {
            technicianId: techId,
            technicianName: techName,
            date: new Date().toISOString().split('T')[0],
            hoursWorked: 8,
            workDone: completionNotes || 'Field work completed on site',
            voiceNoteUrl: voiceNoteUrl || '',
            hasVoiceNote: Boolean(voiceNoteUrl),
            status: 'PRESENT'
          }
        })
      });
      const resData = await res.json();
      clearTimeout(timeoutId);
      
      if (!res.ok || resData.success === false) {
        throw new Error(resData.message || 'Failed to complete job');
      }
      const updatedJob = this.mapJob(resData.data);

      // Auto-post report to /api/reports MongoDB collection so it appears in Daily Reports & Admin Dashboard
      try {
        const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
        const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';
        const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || 'TECH-01';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch(`${baseUrl}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            technicianId: techId,
            technicianName: techName,
            date: new Date().toISOString().split('T')[0],
            activityType: updatedJob.category || 'Customer Job',
            workDescription: completionNotes || 'Field work completed on site',
            hoursWorked: 8,
            status: 'PRESENT',
            jobId: updatedJob.id,
            jobCode: updatedJob.jobCode,
            customerName: updatedJob.customer?.name || '',
            location: updatedJob.customer?.city || updatedJob.customer?.address || '',
            beforePhotos: updatedJob.beforePhotos || [],
            afterPhotos: updatedJob.afterPhotos || [],
            voiceNoteUrl: voiceNoteUrl || '',
            hasVoiceNote: Boolean(voiceNoteUrl)
          })
        });
        clearTimeout(timeoutId);
      } catch (syncErr) {
        console.warn('TechnicianReport sync warning:', syncErr);
      }

      return updatedJob;
    } catch (err) {
      console.error('Error completing job:', err);
      throw err;
    }
  },

  async saveInspectionSummary(jobId: string, summary: InspectionSummary): Promise<Job> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}`, {
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
  },

  async uploadImageToS3(file: File): Promise<string> {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.imageUrl && (data.imageUrl.startsWith('http') || data.imageUrl.startsWith('https'))) {
          return data.imageUrl;
        }
      }
    } catch (e) {
      console.warn('API upload fallback to base64:', e);
    }

    // Convert to persistent base64 Data URI so the image never breaks across browsers
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
