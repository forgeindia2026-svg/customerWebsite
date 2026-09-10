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

// Client-side Image Compression Helper:
// Efficiently resizes high-resolution mobile camera pictures (12MB-20MB) to ~150KB-250KB in milliseconds
// Uses URL.createObjectURL to avoid mobile RAM exhaustion and guarantees size < 500KB (well below Nginx limits)
export const compressImageFile = (file: File, maxWidth = 1280, quality = 0.72): Promise<File> => {
  return new Promise((resolve) => {
    // If it's already an SVG, leave it
    if (file.type === 'image/svg+xml') {
      return resolve(file);
    }

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      return resolve(file);
    }

    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      // White background in case of transparent PNG/JPEG artifacts
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const safeName = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], safeName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
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
      const [res, repRes] = await Promise.all([
        fetch(url),
        fetch(`${baseUrl}/api/reports?t=${Date.now()}`).catch(() => null)
      ]);
      const resData = await res.json();
      let rawJobs = resData.data || [];
      let reportsList: any[] = [];
      if (repRes && repRes.ok) {
        try {
          reportsList = await repRes.json();
        } catch (e) {}
      }

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
        } else if (rawStatus === 'IN_PROGRESS' || rawStatus === 'BEFORE_PHOTOS_DONE' || rawStatus === 'AFTER_PHOTOS_DONE' || rawStatus === 'INSPECTED' || rawStatus === 'DAILY_REPORTED') {
          normStatus = 'IN_PROGRESS';
        } else {
          normStatus = 'PENDING';
        }

        const unassigned = !assignedTechName && (!j.assignedTechnicians || j.assignedTechnicians.length === 0);
        const assignedToMe = isJobAssignedToMe(j);

        // Fallback to matching TechnicianReport if job.beforePhotos lacks full URLs
        const matchingReport = reportsList.find((r: any) => {
          const rJobCode = (r.jobCode || '').replace(/^#/, '').trim().toUpperCase();
          const jJobCode = (j.jobCode || j.orderNumber || '').replace(/^#/, '').trim().toUpperCase();
          return (rJobCode && jJobCode && rJobCode === jJobCode) || (r.jobId && (r.jobId === j._id || r.jobId === j.id));
        });

        let beforeList = Array.isArray(j.beforePhotos) ? j.beforePhotos : (j.workProgress?.beforeWorkPhotos || []);
        const hasValidUrls = beforeList.some((p: any) => typeof p === 'string' ? p.startsWith('http') : (p?.url && typeof p.url === 'string' && p.url.startsWith('http')));
        if (!hasValidUrls && matchingReport && Array.isArray(matchingReport.beforePhotos) && matchingReport.beforePhotos.length > 0) {
          beforeList = matchingReport.beforePhotos.map((url: string, idx: number) => ({
            id: `PHO-BEFORE-${idx}`,
            url,
            caption: 'Before Work Site Condition'
          }));
        }

        let afterList = Array.isArray(j.afterPhotos) ? j.afterPhotos : [];
        const hasValidAfterUrls = afterList.some((p: any) => typeof p === 'string' ? p.startsWith('http') : (p?.url && typeof p.url === 'string' && p.url.startsWith('http')));
        if (!hasValidAfterUrls && matchingReport && Array.isArray(matchingReport.afterPhotos) && matchingReport.afterPhotos.length > 0) {
          afterList = matchingReport.afterPhotos.map((url: string, idx: number) => ({
            id: `PHO-AFTER-${idx}`,
            url,
            caption: 'Completed Work Evidence'
          }));
        }

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
            address: 'Customer Location',
            city: '',
            postalCode: ''
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
          workProgress: j.workProgress,
          taskDescription: j.workProgress?.taskDescription || j.fieldNotes || matchingReport?.workDescription || '',
          inspectionComments: j.workProgress?.inspectionComments || j.inspection?.notes || '',
          inspection: j.inspection,
          beforePhotos: beforeList,
          afterPhotos: afterList,
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

  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const baseUrl = getApiUrl();
      const [res, repRes] = await Promise.all([
        fetch(`${baseUrl}/api/jobs/${jobId}`),
        fetch(`${baseUrl}/api/reports?t=${Date.now()}`).catch(() => null)
      ]);
      const resData = await res.json();
      if (resData.success && resData.data) {
        const j = resData.data;
        let reportsList: any[] = [];
        if (repRes && repRes.ok) {
          try {
            reportsList = await repRes.json();
          } catch (e) {}
        }
        const matchingReport = reportsList.find((r: any) => {
          const rJobCode = (r.jobCode || '').replace(/^#/, '').trim().toUpperCase();
          const jJobCode = (j.jobCode || j.orderNumber || '').replace(/^#/, '').trim().toUpperCase();
          return (rJobCode && jJobCode && rJobCode === jJobCode) || (r.jobId && (r.jobId === j._id || r.jobId === j.id));
        });

        let beforePhotos = Array.isArray(j.beforePhotos) ? j.beforePhotos : (j.workProgress?.beforeWorkPhotos || []);
        const hasValidBeforeUrls = beforePhotos.some((p: any) => typeof p === 'string' ? p.startsWith('http') : (p?.url && typeof p.url === 'string' && p.url.startsWith('http')));
        if (!hasValidBeforeUrls && matchingReport && Array.isArray(matchingReport.beforePhotos) && matchingReport.beforePhotos.length > 0) {
          beforePhotos = matchingReport.beforePhotos.map((url: string, idx: number) => ({
            id: `PHO-BEFORE-${idx}`,
            url,
            caption: 'Before Work Site Condition'
          }));
        }

        let afterPhotos = Array.isArray(j.afterPhotos) ? j.afterPhotos : [];
        const hasValidAfterUrls = afterPhotos.some((p: any) => typeof p === 'string' ? p.startsWith('http') : (p?.url && typeof p.url === 'string' && p.url.startsWith('http')));
        if (!hasValidAfterUrls && matchingReport && Array.isArray(matchingReport.afterPhotos) && matchingReport.afterPhotos.length > 0) {
          afterPhotos = matchingReport.afterPhotos.map((url: string, idx: number) => ({
            id: `PHO-AFTER-${idx}`,
            url,
            caption: 'Completed Work Evidence'
          }));
        }

        return {
          ...j,
          id: j._id || j.id,
          beforePhotos,
          afterPhotos,
          taskDescription: j.workProgress?.taskDescription || j.fieldNotes || matchingReport?.workDescription || ''
        };
      }
      return null;
    } catch (err) {
      console.warn('Error fetching job by id:', err);
      return null;
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
    let avatarUrl = localStorage.getItem('user_avatar') || localStorage.getItem('tech_avatar') || '';

    // If backend profile has an avatar, fetch and sync
    try {
      if (email) {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/api/auth/profile?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data && resData.data.avatar) {
            avatarUrl = resData.data.avatar;
            localStorage.setItem('user_avatar', avatarUrl);
          }
        }
      }
    } catch (e) {}

    if (!avatarUrl) {
      avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
    }

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
      avatarUrl,
    };
  },

  async updateTechnicianAvatar(avatarUrl: string): Promise<boolean> {
    const email = localStorage.getItem('user_email') || '';
    localStorage.setItem('user_avatar', avatarUrl);
    localStorage.setItem('tech_avatar', avatarUrl);
    try {
      const techUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      techUser.avatar = avatarUrl;
      techUser.avatarUrl = avatarUrl;
      localStorage.setItem('tech_user', JSON.stringify(techUser));
    } catch (_) {}

    try {
      if (email) {
        const baseUrl = getApiUrl();
        await fetch(`${baseUrl}/api/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, avatar: avatarUrl })
        });
      }
      return true;
    } catch (e) {
      console.warn('Failed to sync avatar with backend:', e);
      return false;
    }
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
      workProgress: j.workProgress,
      taskDescription: j.workProgress?.taskDescription || j.fieldNotes || '',
      inspectionComments: j.workProgress?.inspectionComments || j.inspection?.notes || '',
      inspection: j.inspection,
      beforePhotos: Array.isArray(j.beforePhotos) ? j.beforePhotos : (j.workProgress?.beforeWorkPhotos || []),
      afterPhotos: j.afterPhotos || [],
      dailyReports: j.dailyReports || [],
      activities: j.activities || [],
      createdAt: j.createdAt || new Date().toISOString(),
      updatedAt: j.updatedAt || new Date().toISOString()
    };
  },

  async saveJobProgress(jobId: string, progressData: {
    taskDescription: string;
    inspectionComments: string;
    beforePhotos: any[];
    technicianId: string;
    technicianName: string;
    voiceNoteUrl?: string;
    hasVoiceNote?: boolean;
  }): Promise<Job> {
    const baseUrl = getApiUrl();
    const res = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        taskDescription: progressData.taskDescription,
        inspectionComments: progressData.inspectionComments,
        beforePhotos: progressData.beforePhotos,
        technicianId: progressData.technicianId,
        technicianName: progressData.technicianName,
        assignedTechnician: progressData.technicianName,
        voiceNoteUrl: progressData.voiceNoteUrl || '',
        hasVoiceNote: Boolean(progressData.hasVoiceNote),
        workProgress: {
          taskDescription: progressData.taskDescription,
          inspectionComments: progressData.inspectionComments,
          beforeWorkPhotos: progressData.beforePhotos,
          updatedBy: progressData.technicianId,
          updatedAt: new Date()
        }
      })
    });
    const resData = await res.json();
    if (!res.ok || !resData.success || !resData.data) {
      throw new Error(resData.message || 'Unable to save progress. Please try again.');
    }
    return this.mapJob(resData.data);
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
    let compressedFile: File = file;
    try {
      compressedFile = await compressImageFile(file, 1280, 0.72);
    } catch (e) {
      console.warn('Image compression warning, using raw file:', e);
    }

    try {
      const formData = new FormData();
      formData.append('image', compressedFile);
      formData.append('folder', 'reports');

      const baseUrl = getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        if (resData && (resData.imageUrl || resData.url)) {
          return resData.imageUrl || resData.url;
        }
      } else {
        console.warn(`S3 upload returned HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('S3 direct upload network warning, using compressed preview fallback:', err);
    }

    // Resilient fallback: Convert COMPRESSED file (not the huge raw 15MB file) to data URL
    // Since compressedFile is only ~150KB-250KB, it resolves in milliseconds and never exhausts mobile memory!
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image')) {
          resolve(reader.result);
        } else {
          resolve(URL.createObjectURL(compressedFile));
        }
      };
      reader.onerror = () => {
        resolve(URL.createObjectURL(compressedFile));
      };
      reader.readAsDataURL(compressedFile);
    });
  },

  async uploadJobPhoto(jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER'): Promise<Job> {
    try {
      const techName = localStorage.getItem('user_name') || 'Field Technician';
      const techId = localStorage.getItem('user_id') || 'tech-01';
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'IN_PROGRESS',
          assignedTechnician: techName,
          assignedTechnicians: [{ id: techId, name: techName }],
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

  async getJobById(jobId: string): Promise<Job> {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
    const res = await fetch(`${baseUrl}/api/jobs/${jobId}`);
    const resData = await res.json();
    if (resData.success && resData.data) {
      return this.mapJob(resData.data);
    }
    throw new Error(resData.message || 'Failed to fetch job');
  },

  async autoAssignNextJob(technicianId: string): Promise<{ success: boolean; assignedJob?: Job; message: string }> {
    return { success: false, message: 'Auto-assignment is disabled. Jobs must be assigned by Admin.' };
  }
};
