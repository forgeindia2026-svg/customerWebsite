import { useEffect, useState, useCallback } from 'react';
import type { Job, JobFilterOptions, PaginatedJobsResponse, JobStatus } from '../../types/job';
import { JobsApiService } from '../../services/apiService';
import { JobFilters } from './JobFilters';
import { AssignedJobsTable } from './AssignedJobsTable';
import { Pagination } from './Pagination';
import { JobDetailDrawer } from '../JobDetailDrawer';
import { Briefcase, AlertTriangle, RefreshCw, CheckCircle2, Clock, Play, ArrowUpRight } from 'lucide-react';

interface AssignedJobsModuleProps {
  jobs?: Job[];
  summaryStats?: any;
  isLoading?: boolean;
  onOpenWorkflow: (job: Job) => void;
  initialStatusFilter?: JobStatus | 'ALL';
}

export const AssignedJobsModule: React.FC<AssignedJobsModuleProps> = ({ 
  jobs, 
  summaryStats, 
  isLoading = false, 
  onOpenWorkflow,
  initialStatusFilter = 'ALL'
}) => {
  const [filters, setFilters] = useState<JobFilterOptions>({
    searchQuery: '',
    status: initialStatusFilter || 'ALL',
    priority: 'ALL',
    sortBy: 'scheduledDate',
    sortOrder: 'asc',
    page: 1,
    limit: 50,
  });

  // Sync with initialStatusFilter if changed from parent
  useEffect(() => {
    if (initialStatusFilter) {
      setFilters(prev => ({ ...prev, status: initialStatusFilter }));
    }
  }, [initialStatusFilter]);

  const [response, setResponse] = useState<PaginatedJobsResponse | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected job state for detail view drawer
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchJobs = useCallback(async () => {
    setError(null);
    setIsFetching(true);
    try {
      const res = await JobsApiService.getAssignedJobs(filters);
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned jobs.');
    } finally {
      setIsFetching(false);
    }
  }, [filters]);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      const stats = {
        totalAssigned: jobs.length,
        totalAvailable: jobs.filter((j) => j.isAvailableToAccept).length,
        pendingCount: jobs.filter((j) => j.status === 'PENDING').length,
        inProgressCount: jobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length,
        completedCount: jobs.filter((j) => j.status === 'COMPLETED' || (j.status as string) === 'APPROVED').length,
        onHoldCount: jobs.filter((j) => j.status === 'ON_HOLD').length,
      };

      let filtered = [...jobs];
      if (filters.status && filters.status !== 'ALL') {
        if (filters.status === 'IN_PROGRESS') {
          filtered = filtered.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED');
        } else {
          filtered = filtered.filter((j) => j.status === filters.status);
        }
      }
      if (filters.priority && filters.priority !== 'ALL') {
        filtered = filtered.filter((j) => j.priority === filters.priority);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (j) =>
            j.title?.toLowerCase().includes(q) ||
            j.jobCode?.toLowerCase().includes(q) ||
            j.customer?.name?.toLowerCase().includes(q) ||
            j.customer?.address?.toLowerCase().includes(q)
        );
      }

      setResponse({
        data: filtered,
        total: filtered.length,
        page: 1,
        limit: 50,
        totalPages: 1,
        stats,
      });
    } else {
      fetchJobs();
    }
  }, [jobs, filters, fetchJobs]);

  const handleFilterChange = (updated: Partial<JobFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'ALL',
      priority: 'ALL',
      sortBy: 'scheduledDate',
      sortOrder: 'asc',
      page: 1,
      limit: 10,
    });
  };

  const handleUpdateStatus = async (jobId: string, newStatus: JobStatus, note?: string) => {
    try {
      let updatedJob;

      if (newStatus === 'ACCEPTED') {
        const profile = await JobsApiService.getTechnicianProfile();
        updatedJob = await JobsApiService.acceptJob(jobId, profile);
      } else if (newStatus === 'ON_HOLD') {
        const profile = await JobsApiService.getTechnicianProfile();
        updatedJob = await JobsApiService.rejectJob(jobId, profile, note);
      } else {
        updatedJob = await JobsApiService.updateJobStatus(jobId, newStatus, note);
      }

      fetchJobs();
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
    } catch (err: any) {
      alert(`Error updating job: ${err.message}`);
    }
  };

  const handleUploadPhoto = async (
    jobId: string,
    photoUrl: string,
    caption: string,
    type: 'BEFORE' | 'AFTER'
  ) => {
    try {
      const updatedJob = await JobsApiService.uploadJobPhoto(jobId, photoUrl, caption, type);
      fetchJobs();
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
    } catch (err: any) {
      alert(`Error uploading photo: ${err.message}`);
    }
  };

  const totalAssignedVal = response?.stats?.totalAssigned ?? summaryStats?.totalAssigned ?? (jobs && jobs.length > 0 ? jobs.length : (isLoading ? null : 0));
  const inProgressCountVal = response?.stats?.inProgressCount ?? summaryStats?.inProgress ?? (jobs && jobs.length > 0 ? jobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length : (isLoading ? null : 0));
  const pendingCountVal = response?.stats?.pendingCount ?? summaryStats?.pending ?? (jobs && jobs.length > 0 ? jobs.filter((j) => j.status === 'PENDING').length : (isLoading ? null : 0));
  const completedCountVal = response?.stats?.completedCount ?? summaryStats?.completedToday ?? (jobs && jobs.length > 0 ? jobs.filter((j) => j.status === 'COMPLETED').length : (isLoading ? null : 0));

  // Combine passed jobs or response data with active filter options
  const rawJobList = (response && response.data && response.data.length > 0) ? response.data : (jobs || []);

  const filteredJobs = rawJobList.filter((job) => {
    if (filters.status && filters.status !== 'ALL' && job.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'ALL' && job.priority !== filters.priority) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchCode = job.jobCode?.toLowerCase().includes(q);
      const matchTitle = job.title?.toLowerCase().includes(q);
      const matchCust = job.customer?.name?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchCust) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Assigned Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1">Field service daily activity logs and customer work reports.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Assigned */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white rounded-2xl p-4 shadow-md shadow-indigo-500/20 flex items-center justify-between min-w-0 transition-transform active:scale-[0.98]">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] sm:text-[11px] font-black text-white/80 uppercase tracking-widest block mb-1 truncate">TOTAL ASSIGNED</span>
            {totalAssignedVal === null ? (
              <div className="w-10 h-6 bg-white/20 animate-pulse rounded-md" />
            ) : (
              <p className="text-2xl font-black text-white leading-none font-mono">{totalAssignedVal}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* 2. In Progress */}
        <div className="bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 text-white rounded-2xl p-4 shadow-md shadow-blue-500/20 flex items-center justify-between min-w-0 transition-transform active:scale-[0.98]">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] sm:text-[11px] font-black text-white/80 uppercase tracking-widest block mb-1 truncate">IN PROGRESS</span>
            {inProgressCountVal === null ? (
              <div className="w-10 h-6 bg-white/20 animate-pulse rounded-md" />
            ) : (
              <p className="text-2xl font-black text-white leading-none font-mono">{inProgressCountVal}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* 3. Pending Start */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 shadow-md shadow-amber-500/20 flex items-center justify-between min-w-0 transition-transform active:scale-[0.98]">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] sm:text-[11px] font-black text-white/80 uppercase tracking-widest block mb-1 truncate">PENDING START</span>
            {pendingCountVal === null ? (
              <div className="w-10 h-6 bg-white/20 animate-pulse rounded-md" />
            ) : (
              <p className="text-2xl font-black text-white leading-none font-mono">{pendingCountVal}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Completed */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-600 text-white rounded-2xl p-4 shadow-md shadow-emerald-500/20 flex items-center justify-between min-w-0 transition-transform active:scale-[0.98]">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] sm:text-[11px] font-black text-white/80 uppercase tracking-widest block mb-1 truncate">COMPLETED</span>
            {completedCountVal === null ? (
              <div className="w-10 h-6 bg-white/20 animate-pulse rounded-md" />
            ) : (
              <p className="text-2xl font-black text-white leading-none font-mono">{completedCountVal}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <JobFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Table / Grid Content */}
      <div className="space-y-4">
        {/* Live Result Count Bar */}
        <div className="flex items-center justify-between px-1 text-xs font-medium text-zinc-500">
          <span>
            Showing <strong className="text-zinc-900 font-mono font-bold">{filteredJobs.length}</strong> of{' '}
            <strong className="text-zinc-900 font-mono font-bold">{rawJobList.length}</strong> jobs
          </span>
          {(filters.searchQuery || filters.status !== 'ALL' || filters.priority !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        <AssignedJobsTable
          jobs={filteredJobs}
          isLoading={isFetching && rawJobList.length === 0}
          onSelectJob={(job) => {
            setSelectedJob(job);
            setIsDrawerOpen(true);
          }}
          onOpenWorkflow={onOpenWorkflow}
          onUpdateStatus={handleUpdateStatus}
        />

        {filteredJobs.length > 0 && (
          <Pagination
            currentPage={response?.page || 1}
            totalPages={response?.totalPages || 1}
            totalItems={filteredJobs.length}
            itemsPerPage={response?.limit || 50}
            onPageChange={(page) => handleFilterChange({ page })}
          />
        )}
      </div>

      {/* Job Detail Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUploadPhoto={handleUploadPhoto}
      />
    </div>
  );
};
