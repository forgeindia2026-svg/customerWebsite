import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Bell, 
  User 
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AssignedJobsModule } from './components/AssignedJobs/AssignedJobsModule';
import { DashboardModule } from './components/Dashboard/DashboardModule';
import { TodaysScheduleModule } from './components/Schedule/TodaysScheduleModule';
import { DailyReportsModule } from './components/Reports/DailyReportsModule';
import { JobHistoryModule } from './components/History/JobHistoryModule';
import { QueryModule } from './components/Query/QueryModule';
import { PerformanceAnalyticsModule } from './components/Analytics/PerformanceAnalyticsModule';
import { NotificationsModule } from './components/Notifications/NotificationsModule';
import { ProfileModule } from './components/Profile/ProfileModule';
import { SettingsModule } from './components/Settings/SettingsModule';
import { WorkflowModal } from './components/Workflow/WorkflowModal';
import { JobDetailDrawer } from './components/JobDetailDrawer';
import { LoginScreen } from './components/Auth/LoginScreen';
import { IncomingJobRadarModal, IncomingJobData } from './components/AssignedJobs/IncomingJobRadarModal';
import { JobAssignmentResultModal } from './components/AssignedJobs/JobAssignmentResultModal';
import { getApiUrl } from '../utils/config';

import { JobsApiService } from './services/apiService';
import type {
  Job,
  JobStatus,
  InspectionSummary,
  DailyReport,
  NotificationItem,
  TechnicianProfile
} from './types/job';

import { ErrorBanner, type GlobalErrorState } from './components/ErrorBanner';
import { OfflineBanner } from './components/OfflineBanner';

import { AttendanceCard } from './components/Attendance/AttendanceCard';
import { AttendanceLogModule } from './components/Attendance/AttendanceLogModule';

class ReportsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("DailyReportsModule Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl space-y-3 font-sans">
          <h3 className="font-bold text-base">⚠️ Daily Reports Module Diagnostics</h3>
          <p className="text-xs font-mono bg-white p-3 rounded-xl border border-red-100">{String(this.state.error?.message || this.state.error)}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [globalError, setGlobalError] = useState<GlobalErrorState | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [queuedReportsCount, setQueuedReportsCount] = useState<number>(3);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('internal_token') || localStorage.getItem('sk_tech_auth');
    const name = localStorage.getItem('user_name');
    return Boolean(token && name);
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('sk_tech_tab') || 'dashboard';
    return saved === 'todays_jobs' ? 'assigned_jobs' : saved;
  });
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Persist Active Tab to localStorage
  useEffect(() => {
    localStorage.setItem('sk_tech_tab', activeTab);
  }, [activeTab]);

  // State
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const cached = localStorage.getItem('sk_tech_jobs_cache');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // Workflow Modal State
  const [workflowJob, setWorkflowJob] = useState<Job | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState<boolean>(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Rapido-style Radar Broadcast & Auto-Dispatch State
  const [radarJob, setRadarJob] = useState<IncomingJobData | null>(null);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [resultJob, setResultJob] = useState<IncomingJobData | null>(null);
  const [resultAssignedTech, setResultAssignedTech] = useState<string>('');
  const [isResultOpen, setIsResultOpen] = useState<boolean>(false);

  // Poll for incoming new orders/jobs
  useEffect(() => {
    const checkIncomingBroadcast = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/jobs/active-broadcast`);
        if (res.ok) {
          const data = await res.json();
          if (data.activeBroadcast && data.job) {
            const seenKey = `seen_radar_${data.job.jobCode}`;
            if (!sessionStorage.getItem(seenKey)) {
              sessionStorage.setItem(seenKey, 'true');
              setRadarJob(data.job);
              setIsRadarOpen(true);
            }
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    const interval = setInterval(checkIncomingBroadcast, 3000);
    checkIncomingBroadcast();
    return () => clearInterval(interval);
  }, []);

  const handleCountdownComplete = async (job: IncomingJobData) => {
    setIsRadarOpen(false);
    try {
      const res = await fetch(`${getApiUrl()}/api/jobs/auto-dispatch-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobCode: job.jobCode })
      });
      const data = await res.json();
      const assignedTech = data.assignedTechnicianName || 'Dinesh';

      setResultJob(job);
      setResultAssignedTech(assignedTech);
      setIsResultOpen(true);

      // Refresh technician jobs list
      loadInitialData();
    } catch (err) {
      console.warn('Auto-dispatch complete fallback:', err);
      setResultJob(job);
      setResultAssignedTech('Dinesh');
      setIsResultOpen(true);
    }
  };

  // Offline Field Sync State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setGlobalError(null);

      if (autoSyncEnabled && queuedReportsCount > 0) {
        setIsAutoSyncing(true);
        setTimeout(() => {
          setQueuedReportsCount(0);
          setIsAutoSyncing(false);
        }, 2000);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setGlobalError({
        id: `net-${Date.now()}`,
        type: 'NETWORK',
        title: 'Network Connection Dropped',
        message: 'Field network signal lost. Offline mode active; all job data will queue locally.',
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSyncEnabled, queuedReportsCount]);

  // Mobile Responsive Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [profile, setProfile] = useState<TechnicianProfile>(() => {
    const name = localStorage.getItem('user_name') || 'Technician';
    const email = localStorage.getItem('user_email') || 'tech@sktechnology.com';
    const id = localStorage.getItem('user_id') || 'tech-01';
    return {
      id: id,
      name: name,
      email: email,
      phone: localStorage.getItem('user_phone') || '+91 98765 43210',
      badgeNumber: `SK-TECH-${id.slice(-4).toUpperCase()}`,
      status: 'AVAILABLE',
      specialties: ['CCTV & Networking', 'Access Control'],
      certifications: ['LOTO Safety Certified', 'CCTV System Specialist', 'Network Infrastructure Pro'],
      vehicleNumber: 'Ford Transit #SK-408',
      rating: 5.0,
      completedJobsCount: 12
    };
  });
  const [summaryStats, setSummaryStats] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('sk_tech_summary_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(!summaryStats && jobs.length === 0);

  // Data Fetch Helper (Parallel Concurrency Execution)
  const loadInitialData = async () => {
    try {
      const [summaryData, jobsResponse, notifsData, profileData] = await Promise.all([
        JobsApiService.getDashboardSummary(),
        JobsApiService.getAssignedJobs({ searchQuery: '', status: 'ALL', priority: 'ALL', sortBy: 'scheduledDate', sortOrder: 'asc', page: 1, limit: 50 }),
        JobsApiService.getNotifications(),
        JobsApiService.getTechnicianProfile()
      ]);

      if (summaryData) {
        setSummaryStats(summaryData);
        try {
          localStorage.setItem('sk_tech_summary_cache', JSON.stringify(summaryData));
        } catch (_) {}
      }
      if (jobsResponse && jobsResponse.data) {
        setJobs(jobsResponse.data);
        try {
          localStorage.setItem('sk_tech_jobs_cache', JSON.stringify(jobsResponse.data));
        } catch (_) {}
      }
      if (notifsData) setNotifications(notifsData);
      if (profileData) setProfile(profileData);
    } catch (err: any) {
      console.warn('Jobs load warning:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(() => {
      loadInitialData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Authentication login handler
  const handleLoginSuccess = async (technicianData: { name: string; email: string; badge: string; role: string }) => {
    localStorage.setItem('sk_tech_auth', 'true');
    localStorage.setItem('user_name', technicianData.name);
    localStorage.setItem('user_email', technicianData.email);
    localStorage.setItem('user_id', technicianData.badge);
    setIsAuthenticated(true);

    setProfile({
      id: technicianData.badge,
      name: technicianData.name,
      badgeNumber: technicianData.badge,
      role: technicianData.role,
      email: technicianData.email,
      phone: '+91 98765 43210',
      status: 'ON_DUTY',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      certifications: [
        'Certified CCTV Field Specialist',
        'IP Camera Network Certified'
      ],
      vehicleNumber: 'SK Service Van #SK-102',
      rating: 4.9,
      completedJobsCount: 142,
    });
    setActiveTab('dashboard');

    // Reload jobs specifically for this newly logged-in technician
    try {
      const jobsResponse = await JobsApiService.getAssignedJobs({ searchQuery: '', status: 'ALL', priority: 'ALL', sortBy: 'scheduledDate', sortOrder: 'asc', page: 1, limit: 10 });
      setJobs(jobsResponse.data);
    } catch (e) {
      console.error('Error loading jobs on login:', e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  // Handlers
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenWorkflow = (job: Job) => {
    setWorkflowJob(job);
    setIsWorkflowOpen(true);
  };

  const handleUpdateStatus = async (jobId: string, status: JobStatus) => {
    try {
      const jobToUpdate = jobs.find(j => j.id === jobId);
      let updated;
      
      if (status === 'ACCEPTED' && (!jobToUpdate?.assignedTechnician || !jobToUpdate.assignedTechnician.id)) {
        if (profile) {
          updated = await JobsApiService.acceptJob(jobId, profile);
        } else {
          const fetchedProfile = await JobsApiService.getTechnicianProfile();
          updated = await JobsApiService.acceptJob(jobId, fetchedProfile);
        }
      } else {
        updated = await JobsApiService.updateJobStatus(jobId, status);
      }
      
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (selectedJob?.id === jobId) setSelectedJob(updated);
      if (workflowJob?.id === jobId) setWorkflowJob(updated);

      // 🔔 1. Broadcast Notification to All Technicians
      const techName = profile?.name || 'Alex Vance';
      const actionText = status === 'ACCEPTED' || status === 'IN_PROGRESS' ? 'accepted and started' : `updated to ${status}`;
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `📢 Work Order ${updated.jobCode} ${status === 'ACCEPTED' ? 'Accepted' : 'Updated'}`,
        message: `Technician ${techName} has ${actionText} job "${updated.title}" at ${updated.customer.name}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'ASSIGNMENT',
        jobId: updated.id,
      };

      // 👑 2. High-Priority Admin Dispatch Center Alert
      const adminNotif: NotificationItem = {
        id: `admin-notif-${Date.now()}`,
        title: `👑 ADMIN ALERT: ${updated.jobCode} Dispatched`,
        message: `Central Dispatch Notification: ${techName} accepted work order for ${updated.customer.name}. Real-time tracking enabled.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'URGENT',
        jobId: updated.id,
      };

      setNotifications((prev) => [adminNotif, newNotif, ...prev]);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setGlobalError({
        id: `err-${Date.now()}`,
        type: 'JOB_ACTION',
        title: 'Job Action Failed',
        message: err?.message || 'Unable to update job status. Please check connection and try again.',
        onRetry: () => handleUpdateStatus(jobId, status),
      });
    }
  };

  const handleUploadPhoto = async (jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER') => {
    try {
      const updated = await JobsApiService.uploadJobPhoto(jobId, photoUrl, caption, type);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (selectedJob?.id === jobId) setSelectedJob(updated);
      if (workflowJob?.id === jobId) setWorkflowJob(updated);
    } catch (err) {
      console.error('Failed to upload photo:', err);
    }
  };

  const handleSaveInspection = async (jobId: string, summary: InspectionSummary) => {
    try {
      const updated = await JobsApiService.saveInspectionSummary(jobId, summary);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (selectedJob?.id === jobId) setSelectedJob(updated);
      if (workflowJob?.id === jobId) setWorkflowJob(updated);
    } catch (err) {
      console.error('Failed to save inspection:', err);
    }
  };

  const handleAddDailyReport = async (jobId: string, report: Omit<DailyReport, 'id' | 'createdAt'>) => {
    try {
      const updated = await JobsApiService.addDailyReport(jobId, report);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (selectedJob?.id === jobId) setSelectedJob(updated);
      if (workflowJob?.id === jobId) setWorkflowJob(updated);
    } catch (err) {
      console.error('Failed to add daily report:', err);
    }
  };

  const handleCompleteJob = async (jobId: string, closeoutNotes: string, customerSignature?: string) => {
    try {
      const updated = await JobsApiService.completeJob(jobId, closeoutNotes, customerSignature);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (selectedJob?.id === jobId) setSelectedJob(updated);
      if (workflowJob?.id === jobId) setWorkflowJob(updated);

      // Re-fetch summary stats so dashboard immediately shows updated completed jobs and hours
      try {
        const newSummary = await JobsApiService.getDashboardSummary();
        if (newSummary) setSummaryStats(newSummary);
      } catch (e) {
        console.warn('Failed to refresh summary stats:', e);
      }

      // 🔔 1. Broadcast Notification to All Technicians
      const techName = profile?.name || 'Alex Vance';
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `✅ Work Order ${updated.jobCode} Completed & Signed Off`,
        message: `Technician ${techName} successfully completed job "${updated.title}". Quality verified and archived.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'SYSTEM',
        jobId: updated.id,
      };

      // 👑 2. High-Priority Admin Closeout Sign-Off Alert
      const adminNotif: NotificationItem = {
        id: `admin-notif-${Date.now()}`,
        title: `👑 ADMIN ALERT: ${updated.jobCode} Sign-Off Complete`,
        message: `Central Dispatch Control: Work order ${updated.jobCode} fully completed by ${techName}. Digital customer signature archived.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'URGENT',
        jobId: updated.id,
      };

      setNotifications((prev) => [adminNotif, newNotif, ...prev]);
    } catch (err) {
      console.error('Failed to complete job:', err);
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleUpdateProfileStatus = async (status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_JOB') => {
    try {
      const updated = await JobsApiService.updateTechnicianStatus(status);
      setProfile(updated);
    } catch (err) {
      console.error('Failed to update technician status:', err);
    }
  };

  // Render Login Page if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTechnician={profile}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        jobsCount={jobs.length}
        notificationsCount={notifications.filter(n => !n.read).length}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <OfflineBanner
          isOnline={isOnline}
          queuedCount={queuedReportsCount}
          isAutoSyncing={isAutoSyncing}
        />

        <Header
          searchQuery={globalSearchQuery}
          onSearchChange={setGlobalSearchQuery}
          currentTechnician={profile}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onNavigateToNotifications={() => setActiveTab('notifications')}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10 pb-24 lg:pb-10 max-w-7xl w-full mx-auto space-y-6">
          {/* Daily Attendance Shift Check-In / Check-Out Tracker */}
          <AttendanceCard />

          {/* Module Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 capitalize">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'assigned_jobs' && 'Assigned Jobs'}
                {activeTab === 'todays_jobs' && "Today's Schedule"}
                {activeTab === 'reports' && 'Daily Reports'}
                {activeTab === 'history' && 'Job History'}
                {activeTab === 'query' && 'Helpdesk & Support'}
                {activeTab === 'analytics' && 'Performance Analytics'}
                {activeTab === 'notifications' && 'Notifications'}
                {activeTab === 'profile' && 'Profile'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Field service daily activity logs and customer work reports.
              </p>
            </div>

          </div>

          {/* Module Views Routing */}
          {activeTab === 'dashboard' && (
            <DashboardModule
              jobs={jobs}
              summaryStats={summaryStats}
              isLoading={isLoadingData}
              onSelectJob={handleSelectJob}
              onOpenWorkflow={handleOpenWorkflow}
            />
          )}

          {activeTab === 'assigned_jobs' && (
            <AssignedJobsModule
              jobs={jobs}
              summaryStats={summaryStats}
              isLoading={isLoadingData}
              onOpenWorkflow={handleOpenWorkflow}
            />
          )}

          {activeTab === 'todays_jobs' && (
            <TodaysScheduleModule
              jobs={jobs}
              onSelectJob={handleSelectJob}
              onOpenWorkflow={handleOpenWorkflow}
            />
          )}

          {activeTab === 'attendance_log' && (
            <AttendanceLogModule />
          )}

          {activeTab === 'reports' && (
            <ReportsErrorBoundary>
              <DailyReportsModule
                jobs={jobs}
                isLoading={isLoadingData}
                onOpenWorkflow={handleOpenWorkflow}
              />
            </ReportsErrorBoundary>
          )}

          {activeTab === 'history' && (
            <JobHistoryModule
              jobs={jobs}
              onSelectJob={handleSelectJob}
            />
          )}

          {activeTab === 'query' && (
            <QueryModule />
          )}

          {activeTab === 'analytics' && (
            <PerformanceAnalyticsModule
              jobs={jobs}
              profile={profile}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsModule
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
            />
          )}

          {activeTab === 'profile' && profile && (
            <ProfileModule
              profile={profile}
              onUpdateStatus={handleUpdateProfileStatus}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              autoSync={autoSyncEnabled}
              onAutoSyncChange={setAutoSyncEnabled}
              onSyncError={(title, message) => setGlobalError({
                id: `sync-${Date.now()}`,
                type: 'SYNC',
                title,
                message,
              })}
            />
          )}
        </main>
      </div>

      {/* 📱 Mobile Bottom Navigation Bar (Mobile View Only) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 px-2 py-1.5 flex items-center justify-around text-center lg:hidden shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-zinc-900 font-extrabold scale-105' : 'text-zinc-400 font-medium'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-zinc-900' : 'text-zinc-400'}`} />
          <span className="text-[10px] mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('assigned_jobs')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'assigned_jobs' ? 'text-zinc-900 font-extrabold scale-105' : 'text-zinc-400 font-medium'
          }`}
        >
          <Briefcase className={`w-5 h-5 ${activeTab === 'assigned_jobs' ? 'text-zinc-900' : 'text-zinc-400'}`} />
          <span className="text-[10px] mt-0.5">Jobs</span>
          {jobs.length > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'reports' ? 'text-zinc-900 font-extrabold scale-105' : 'text-zinc-400 font-medium'
          }`}
        >
          <FileText className={`w-5 h-5 ${activeTab === 'reports' ? 'text-zinc-900' : 'text-zinc-400'}`} />
          <span className="text-[10px] mt-0.5">Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'notifications' ? 'text-zinc-900 font-extrabold scale-105' : 'text-zinc-400 font-medium'
          }`}
        >
          <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'text-zinc-900' : 'text-zinc-400'}`} />
          <span className="text-[10px] mt-0.5">Alerts</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute top-0.5 right-2.5 min-w-[14px] h-[14px] px-1 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-zinc-900 font-extrabold scale-105' : 'text-zinc-400 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-zinc-900' : 'text-zinc-400'}`} />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </div>

      {/* Unified App-Wide Error Banner */}
      <ErrorBanner
        error={globalError}
        onDismiss={() => setGlobalError(null)}
      />

      {/* Global Modals & Drawers */}
      <JobDetailDrawer
        job={selectedJob}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUploadPhoto={handleUploadPhoto}
      />

      <WorkflowModal
        job={workflowJob}
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onSaveInspection={handleSaveInspection}
        onAddDailyReport={handleAddDailyReport}
        onUploadPhoto={handleUploadPhoto}
        onCompleteJob={handleCompleteJob}
      />

      {/* Rapido-Style 20-Second Radar Broadcast Modal */}
      <IncomingJobRadarModal
        job={radarJob}
        isOpen={isRadarOpen}
        onCountdownComplete={handleCountdownComplete}
      />

      {/* 10-Second Smart Auto-Assignment Confirmation Result Modal */}
      <JobAssignmentResultModal
        job={resultJob}
        assignedTechName={resultAssignedTech}
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        onViewJob={() => {
          setIsResultOpen(false);
          setActiveTab('jobs');
        }}
      />
    </div>
  );
}

export default App;
