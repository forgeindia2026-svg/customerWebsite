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
}

export const AssignedJobsModule: React.FC<AssignedJobsModuleProps> = ({ jobs, summaryStats, isLoading = false, onOpenWorkflow }) => {
  const [filters, setFilters] = useState<JobFilterOptions>({
    searchQuery: '',
    status: 'ALL',
    priority: 'ALL',
    sortBy: 'scheduledDate',
    sortOrder: 'asc',
    page: 1,
    limit: 50,
  });

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
        completedCount: jobs.filter((j) => j.status === 'COMPLETED').length,
        onHoldCount: jobs.filter((j) => j.status === 'ON_HOLD').length,
      };

      setResponse({
        data: jobs,
        total: jobs.length,
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
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 sm:bg-none sm:bg-white border border-zinc-200/90 sm:border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90 sm:text-zinc-500 uppercase tracking-wider">Total Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 sm:bg-zinc-100 text-white sm:text-zinc-600 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {totalAssignedVal === null ? (
              <div className="w-14 h-7 bg-white/20 sm:bg-zinc-200 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-white sm:text-zinc-900 tracking-tight font-mono">{totalAssignedVal}</span>
            )}
            <span className="text-[10px] font-bold text-white sm:text-zinc-600 bg-white/20 sm:bg-zinc-100 px-2 py-0.5 rounded-full">
              Orders
            </span>
          </div>
          <p className="text-[11px] text-white/80 sm:text-zinc-400 font-medium mt-1">Assigned work orders</p>
        </div>

        {/* 2. In Progress */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 sm:bg-none sm:bg-white border border-transparent sm:border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90 sm:text-sky-700 uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 sm:bg-sky-50 text-white sm:text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Play className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {inProgressCountVal === null ? (
              <div className="w-14 h-7 bg-white/20 sm:bg-sky-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-white sm:text-sky-700 tracking-tight font-mono">{inProgressCountVal}</span>
            )}
            <span className="text-[10px] font-bold text-white sm:text-sky-700 bg-white/20 sm:bg-sky-50 px-2 py-0.5 rounded-full sm:border sm:border-sky-100">
              Active
            </span>
          </div>
          <p className="text-[11px] text-white/80 sm:text-sky-600 font-medium mt-1">Work in progress on site</p>
        </div>

        {/* 3. Pending Start */}
        <div className="bg-gradient-to-br from-orange-400 to-amber-500 sm:bg-none sm:bg-white border border-transparent sm:border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90 sm:text-amber-700 uppercase tracking-wider">Pending Start</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 sm:bg-amber-50 text-white sm:text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {pendingCountVal === null ? (
              <div className="w-14 h-7 bg-white/20 sm:bg-amber-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-white sm:text-amber-700 tracking-tight font-mono">{pendingCountVal}</span>
            )}
            <span className="text-[10px] font-bold text-white sm:text-amber-700 bg-white/20 sm:bg-amber-50 px-2 py-0.5 rounded-full sm:border sm:border-amber-100">
              Scheduled
            </span>
          </div>
          <p className="text-[11px] text-white/80 sm:text-amber-600 font-medium mt-1">Scheduled & awaiting start</p>
        </div>

        {/* 4. Completed */}
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 sm:bg-none sm:bg-white border border-transparent sm:border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/90 sm:text-emerald-700 uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 sm:bg-emerald-50 text-white sm:text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            {completedCountVal === null ? (
              <div className="w-14 h-7 bg-white/20 sm:bg-emerald-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-white sm:text-emerald-700 tracking-tight font-mono">{completedCountVal}</span>
            )}
            <span className="text-[10px] font-bold text-white sm:text-emerald-700 bg-white/20 sm:bg-emerald-50 px-2 py-0.5 rounded-full sm:border sm:border-emerald-100">
              {(totalAssignedVal || 0) > 0 ? `${Math.round(((completedCountVal || 0) / (totalAssignedVal || 1)) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-white/80 sm:text-emerald-600 font-medium mt-1">Finished & signed off</p>
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
