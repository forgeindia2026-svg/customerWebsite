import React, { useState } from 'react';
import type { Job, JobStatus } from '../../types/job';
import { StatusBadge } from '../StatusBadge';
import { 
  Play, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Calendar, 
  ClipboardCheck, 
  CheckCheck,
  Briefcase,
  Phone
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';

interface AssignedJobsTableProps {
  jobs: Job[];
  isLoading?: boolean;
  onSelectJob: (job: Job) => void;
  onOpenWorkflow?: (job: Job) => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => Promise<void>;
  viewMode?: 'table' | 'grid';
}

export const AssignedJobsTable: React.FC<AssignedJobsTableProps> = ({
  jobs,
  isLoading = false,
  onSelectJob,
  onOpenWorkflow,
  onUpdateStatus,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleQuickStatus = async (e: React.MouseEvent, jobId: string, newStatus: JobStatus) => {
    e.stopPropagation();
    
    // Check if technician already has an active job in progress
    const activeJob = jobs.find(j => j.isAssignedToMe && j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
    if (newStatus === 'ACCEPTED' && activeJob && activeJob.id !== jobId) {
      alert(`⚠️ Active Job in Progress:\nYou are currently working on active job "${activeJob.jobCode} - ${activeJob.title}". Please complete your current job before accepting new work orders!`);
      return;
    }

    setUpdatingId(jobId);
    try {
      await onUpdateStatus(jobId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Job Code & Title</th>
                <th className="py-3.5 px-4">Customer & Location</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Workflow Actions</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {[...Array(5)].map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4 space-y-2">
                    <div className="h-3 w-20 bg-zinc-200 rounded"></div>
                    <div className="h-4 w-48 bg-zinc-200 rounded"></div>
                    <div className="h-2.5 w-32 bg-zinc-200 rounded"></div>
                  </td>
                  <td className="py-4 px-4 space-y-2">
                    <div className="h-3.5 w-36 bg-zinc-200 rounded"></div>
                    <div className="h-3 w-40 bg-zinc-200 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-16 bg-zinc-200 rounded-full"></div>
                  </td>
                  <td className="py-4 px-4 space-y-2">
                    <div className="h-3.5 w-24 bg-zinc-200 rounded"></div>
                    <div className="h-3 w-28 bg-zinc-200 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-zinc-200 rounded-full"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-7 w-24 bg-zinc-200 rounded-md"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-5 w-5 bg-zinc-200 rounded ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">No results found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No work orders match your search query or filter settings. Try adjusting your parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 📱 1. Mobile Card View List (Flipkart / Amazon App Style - Mobile Only) */}
      <div className="block md:hidden space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 transition-all cursor-pointer space-y-4 relative overflow-hidden active:scale-[0.98]"
          >
            {/* Colorful top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500"></div>

            {/* Top Header Row */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2 py-1 rounded-lg tracking-tight shadow-sm">
                  {job.jobCode}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 shrink-0">
                  {job.category}
                </span>
              </div>
              {job.status === 'COMPLETED' ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1 shrink-0">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Work Completed</span>
                </span>
              ) : (job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Assigned to You</span>
                </span>
              ) : job.assignedTechnicianName ? (
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  <span>Assigned to {job.assignedTechnicianName}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Available to Accept</span>
                </span>
              )}
            </div>

            {/* Title & Equipment */}
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{job.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <p className="text-[11px] text-slate-500 font-semibold">
                  Equipment: <span className="text-slate-800">{job.installation.equipmentType}</span>
                </p>

              </div>
            </div>

            {/* Info Box: Customer & Schedule */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs space-y-1.5 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg"></div>
              <div className="pl-2 flex flex-col gap-0.5">
                <span className="font-extrabold text-slate-800 leading-tight">{job.customer.name}</span>
                <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-medium">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{job.customer.address}, {job.customer.city}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-medium">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{job.customer.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] pt-1.5 border-t border-slate-200/60 pl-2 mt-1">
                <div className="flex items-center space-x-1 text-slate-700 font-bold">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>{formatDate(job.scheduledDate)}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-600 font-mono font-bold">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>{job.scheduledTimeSlot}</span>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
              <div 
                className={job.isAssignedToMe && job.status !== 'COMPLETED' ? "cursor-pointer active:scale-95 transition-transform" : ""} 
                onClick={() => {
                  if (job.isAssignedToMe && job.status !== 'COMPLETED' && onOpenWorkflow) {
                    onOpenWorkflow(job);
                  }
                }}
              >
                <StatusBadge status={job.status} size="sm" />
              </div>

              {job.status === 'COMPLETED' ? (
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Signed Off & Complete</span>
                </span>
              ) : (job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                <button
                  onClick={() => onOpenWorkflow && onOpenWorkflow(job)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Report</span>
                </button>
              ) : job.assignedTechnicianName ? (
                <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-[10px] rounded-xl border border-zinc-200">
                  Taken by {job.assignedTechnicianName}
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={updatingId === job.id}
                    onClick={(e) => handleQuickStatus(e, job.id, 'ACCEPTED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Accept</span>
                  </button>
                  <button
                    disabled={updatingId === job.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to reject Job ${job.jobCode}? It will be auto-reassigned to the next available technician.`)) {
                        setUpdatingId(job.id);
                        try {
                          const { JobsApiService } = await import('../../services/apiService');
                          const techName = localStorage.getItem('user_name') || 'Technician';
                          const techId = localStorage.getItem('user_id') || 'tech-01';
                          await JobsApiService.rejectJob(job.id, { id: techId, name: techName } as any);
                          window.location.reload();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setUpdatingId(null);
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-all cursor-pointer"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🖥️ 2. Desktop Table View (Desktop Only - Preserved 100%) */}
      <div className="hidden md:block bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 border-collapse">
            <thead className="bg-zinc-50/90 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="py-3.5 px-4 min-w-[300px]">Job Code & Title</th>
                <th className="py-3.5 px-4 min-w-[220px]">Customer & Location</th>
                <th className="py-3.5 px-4 min-w-[100px] text-center">Priority</th>
                <th className="py-3.5 px-4 min-w-[150px]">Schedule</th>
                <th className="py-3.5 px-4 min-w-[110px] text-center">Status</th>
                <th className="py-3.5 px-4 min-w-[170px]">Workflow Actions</th>
                <th className="py-3.5 px-4 w-12 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="hover:bg-zinc-50/90 transition-colors cursor-pointer group"
                >
                  {/* Job Code & Title */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-extrabold text-zinc-900 text-xs tracking-tight">
                        {job.jobCode}
                      </span>
                      <span className="text-[10px] font-sans font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-md shrink-0">
                        {job.category}
                      </span>
                      {job.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 shrink-0">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Work Completed</span>
                        </span>
                      ) : (job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Assigned to You</span>
                        </span>
                      ) : job.assignedTechnicianName ? (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          <span>Assigned to {job.assignedTechnicianName}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Available to Accept</span>
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-zinc-900 text-sm leading-snug group-hover:text-sky-700 transition-colors">
                      {job.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                      Equipment: {job.installation.equipmentType}
                    </div>
                  </td>

                  {/* Customer & Location */}
                  <td className="py-4 px-4 align-middle">
                    <div className="font-bold text-zinc-900 text-xs">{job.customer.name}</div>
                    <div className="flex items-center space-x-1 text-zinc-500 mt-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{job.customer.address}, {job.customer.city}</span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-4 align-middle text-center">
                    <StatusBadge priority={job.priority} size="sm" />
                  </td>

                  {/* Scheduled Slot */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center space-x-1.5 text-zinc-900 font-semibold text-xs">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{formatDate(job.scheduledDate)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-zinc-400 text-[11px] mt-1 font-mono">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{job.scheduledTimeSlot}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className={job.isAssignedToMe && job.status !== 'COMPLETED' ? "cursor-pointer active:scale-95 transition-transform inline-block" : "inline-block"} 
                      onClick={() => {
                        if (job.isAssignedToMe && job.status !== 'COMPLETED' && onOpenWorkflow) {
                          onOpenWorkflow(job);
                        }
                      }}
                    >
                      <StatusBadge status={job.status} size="sm" />
                    </div>
                  </td>

                  {/* Guided Workflow Buttons */}
                  <td className="py-4 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      {job.status === 'COMPLETED' ? (
                        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-xl border border-emerald-200 flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Signed Off & Complete</span>
                        </span>
                      ) : (job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                        <button
                          onClick={() => onOpenWorkflow && onOpenWorkflow(job)}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Report</span>
                        </button>
                      ) : job.assignedTechnicianName ? (
                        <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 font-bold text-[11px] rounded-xl border border-zinc-200 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                          <span>Taken by {job.assignedTechnicianName}</span>
                        </span>
                      ) : (
                        <button
                          disabled={updatingId === job.id}
                          onClick={(e) => handleQuickStatus(e, job.id, 'ACCEPTED')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Accept Job</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Details Chevron */}
                  <td className="py-4 px-4 align-middle text-center">
                    <button
                      onClick={() => onSelectJob(job)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
