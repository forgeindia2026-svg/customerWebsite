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
  Phone,
  Eye
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';

const formatLocation = (address?: string, city?: string) => {
  const cleanAddr = (address || '').trim();
  const cleanCity = (city || '').trim();

  // If city is default 'Chennai' or not set, only use address
  if (!cleanCity || cleanCity.toLowerCase() === 'chennai') {
    return cleanAddr || 'Site Location';
  }

  if (!cleanAddr) {
    return cleanCity;
  }

  // If address already contains the city name, don't duplicate it
  if (cleanAddr.toLowerCase().includes(cleanCity.toLowerCase())) {
    return cleanAddr;
  }

  return `${cleanAddr}, ${cleanCity}`;
};

const cleanJobTitle = (rawTitle: string): string => {
  if (!rawTitle) return 'CCTV Installation & Service';
  const parts = rawTitle.split('|').map(p => p.trim()).filter(Boolean);
  let main = parts[0] || rawTitle;

  const lastPart = parts.length > 1 ? parts[parts.length - 1] : '';
  const modelMatch = lastPart.match(/\b([A-Z0-9]{2,5}-[A-Z0-9]{2,6})\b/i);

  main = main
    .replace(/\s*for\s+(Home|Outdoor|Indoor|Office|Shop|Commercial)\s*(Outdoor|Indoor|Home)?/gi, '')
    .replace(/\s*\|\s*/g, ' ')
    .trim();

  if (modelMatch && !main.toLowerCase().includes(modelMatch[0].toLowerCase())) {
    main = `${main} (${modelMatch[0]})`;
  }

  return main;
};

const cleanJobCategory = (rawCategory: string, rawTitle?: string): string => {
  if (!rawCategory) return 'CCTV Setup';
  if (rawCategory.length > 25 || rawCategory.includes('|')) {
    const text = (rawCategory + ' ' + (rawTitle || '')).toLowerCase();
    if (text.includes('4g') || text.includes('sim')) return '4G Smart Camera';
    if (text.includes('solar')) return 'Solar Camera';
    if (text.includes('dome')) return 'Dome Camera Setup';
    if (text.includes('bullet')) return 'Bullet Camera Setup';
    if (text.includes('wifi') || text.includes('wireless')) return 'WiFi Smart Cam';
    if (text.includes('nvr') || text.includes('dvr')) return 'NVR / DVR Setup';
    if (text.includes('amc') || text.includes('maintenance')) return 'AMC & Service';
    return 'CCTV Installation';
  }
  return rawCategory;
};

const getCategoryColorBadge = (rawCategory: string, rawTitle?: string): string => {
  const cat = cleanJobCategory(rawCategory, rawTitle);
  const text = cat.toLowerCase();
  if (text.includes('4g') || text.includes('sim') || text.includes('wifi')) {
    return 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold';
  }
  if (text.includes('solar')) {
    return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
  }
  if (text.includes('dome') || text.includes('bullet')) {
    return 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold';
  }
  if (text.includes('nvr') || text.includes('dvr')) {
    return 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold';
  }
  return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold';
};

const getJobCardBg = (status: JobStatus, isAssignedToMe: boolean) => {
  switch (status) {
    case 'IN_PROGRESS':
    case 'WORKING':
    case 'BEFORE_PHOTOS_DONE':
      return 'bg-gradient-to-br from-blue-50/90 via-indigo-50/80 to-[#f0f4ff] border-2 border-blue-400/80 shadow-md shadow-blue-500/10';
    case 'COMPLETED':
      return 'bg-gradient-to-br from-emerald-50/90 via-teal-50/80 to-[#f0fdf4] border-2 border-emerald-400/80 shadow-sm';
    case 'ACCEPTED':
      return 'bg-gradient-to-br from-sky-50/90 via-blue-50/80 to-[#f0f9ff] border-2 border-sky-400/80 shadow-sm';
    case 'PENDING':
      return 'bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-[#fffbeb] border-2 border-amber-400/80 shadow-sm';
    default:
      if (isAssignedToMe) {
        return 'bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-[#f5f3ff] border-2 border-indigo-400/80 shadow-sm';
      }
      return 'bg-gradient-to-br from-slate-50/90 via-blue-50/40 to-[#f8fafc] border-2 border-slate-200/90 shadow-xs';
  }
};

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
        <div className="p-4 space-y-4">
          <div className="h-6 w-48 bg-zinc-200 animate-pulse rounded-md"></div>
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-zinc-100">
              {[1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 w-32 bg-zinc-200 rounded mb-2"></div>
                    <div className="h-3 w-48 bg-zinc-100 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-zinc-200 rounded"></div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-5 w-16 bg-zinc-200 rounded-md mx-auto"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-zinc-200 rounded"></div>
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
            className={`rounded-2xl p-3.5 transition-all duration-200 cursor-pointer space-y-2.5 relative overflow-hidden active:scale-[0.99] ${getJobCardBg(job.status, job.isAssignedToMe)}`}
          >
            {/* Left colorful status stripe */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-600 via-indigo-600 to-sky-500"></div>

            {/* Top Header Row */}
            <div className="flex items-center justify-between gap-2 pl-0.5 flex-nowrap overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 min-w-0 flex-nowrap shrink mr-2">
                <span className="bg-[#0B1527] text-white border border-slate-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md tracking-tight shrink-0 shadow-2xs whitespace-nowrap">
                  {job.jobCode}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wide whitespace-nowrap max-w-[110px] sm:max-w-[140px] truncate ${getCategoryColorBadge(job.category, job.title)}`}>
                  {cleanJobCategory(job.category, job.title)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-auto">
                {(job.isAssignedToMe || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-indigo-300 text-[9px] font-black rounded-md flex items-center gap-1 shrink-0 uppercase tracking-wider whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span>Assigned to You</span>
                  </span>
                ) : job.assignedTechnicianName ? (
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 text-[9px] font-black rounded-md flex items-center gap-1 shrink-0 uppercase tracking-wider whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                    <span>Assigned to {job.assignedTechnicianName}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black rounded-md flex items-center gap-1 shrink-0 uppercase tracking-wider whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                    <span>Available</span>
                  </span>
                )}
              </div>
            </div>

            {/* Title & Equipment */}
            <div className="pl-0.5">
              <h3 className="font-bold text-[#0B1527] text-xs leading-snug line-clamp-1" title={job.title}>
                {cleanJobTitle(job.title)}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Equipment: <span className="text-[#0B1527] font-semibold">{job.installation?.equipmentType || 'CCTV Hardware & DVR'}</span>
              </p>
            </div>

            {/* Info Box: Customer & Schedule */}
            <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-xl p-2.5 text-xs space-y-1.5 shadow-2xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[#0B1527] text-xs leading-tight">{job.customer.name}</span>
                <div className="flex items-center space-x-1.5 text-slate-600 text-[10px]">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{formatLocation(job.customer.address, job.customer.city)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600 text-[10px]">
                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{job.customer.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/80">
                <div className="flex items-center space-x-1 text-slate-800 font-semibold bg-blue-50/90 border border-blue-200 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>{formatDate(job.scheduledDate)}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-800 font-mono font-semibold bg-purple-50/90 border border-purple-200 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-purple-600" />
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectJob(job);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 border border-slate-200/80"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Details</span>
                </button>
              ) : (job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                <button
                  onClick={() => onOpenWorkflow && onOpenWorkflow(job)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shadow-blue-500/25 cursor-pointer active:scale-95"
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
                      <span className={`text-[10px] font-sans px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wide ${getCategoryColorBadge(job.category, job.title)}`}>
                        {cleanJobCategory(job.category, job.title)}
                      </span>
                      {(job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-extrabold rounded-md flex items-center gap-1.5 shrink-0 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
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
                    <div className="font-bold text-zinc-900 text-sm leading-snug group-hover:text-sky-700 transition-colors line-clamp-2" title={job.title}>
                      {cleanJobTitle(job.title)}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                      Equipment: {job.installation?.equipmentType || 'CCTV Hardware & DVR'}
                    </div>
                  </td>

                  {/* Customer & Location */}
                  <td className="py-4 px-4 align-middle">
                    <div className="font-bold text-zinc-900 text-xs">{job.customer.name}</div>
                    <div className="flex items-center space-x-1 text-zinc-500 mt-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{formatLocation(job.customer.address, job.customer.city)}</span>
                    </div>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJob(job);
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 border border-slate-200/80"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Details</span>
                        </button>
                      ) : (job.isAssignedToMe || job.status === 'IN_PROGRESS' || (job.beforePhotos && job.beforePhotos.length > 0)) ? (
                        <button
                          onClick={() => onOpenWorkflow && onOpenWorkflow(job)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shadow-blue-500/25 cursor-pointer active:scale-95"
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
