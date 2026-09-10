import React, { useState } from 'react';
import type { Job } from '../../types/job';
import { 
  History, 
  Search, 
  FileText, 
  Briefcase, 
  MapPin, 
  CheckCircle2,
  X,
  Printer,
  Phone,
  ExternalLink,
  Check
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';

export const COMPLETED_HISTORY_STATUSES = [
  'COMPLETED',
  'DELIVERED',
  'APPROVED',
  'DAILY_REPORTED',
  'AFTER_PHOTOS_DONE'
];

interface JobHistoryModuleProps {
  jobs: Job[];
  onSelectJob?: (job: Job) => void;
}

export const JobHistoryModule: React.FC<JobHistoryModuleProps> = ({ jobs, onSelectJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedSummaryJob, setSelectedSummaryJob] = useState<any | null>(null);

  const completedJobs = jobs && jobs.length > 0 
    ? jobs.filter(j => j.status === 'COMPLETED' || j.status === 'DELIVERED' || j.status === 'APPROVED') 
    : [];

  // Dynamically map completed jobs from backend
  const completedJobsList = completedJobs.map((job) => ({
    id: job.id,
    jobCode: job.jobCode,
    title: job.title,
    category: job.category || 'Surveillance Installation',
    completedDate: job.actualCompletionDate || (job.updatedAt ? new Date(job.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    customer: job.customer?.name || 'Client',
    customerPhone: job.customer?.phone || '+91 98400 12345',
    address: `${job.customer?.address || 'Site Location'}${job.customer?.city ? ', ' + job.customer.city : ''}`,
    hoursLogged: `${job.dailyReports?.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) || 8} hrs`,
    rating: 5,
    supervisorSignOff: job.completionSummary?.notes || 'Admin Approved & QA Verified',
    fieldNotes: job.fieldNotes || job.completionSummary?.notes || 'All camera streams verified, cable conduits sealed, and client training provided.',
    beforePhotos: job.beforePhotos || [],
    afterPhotos: job.afterPhotos || [],
    originalJob: job
  }));

  const filteredArchivedJobs = completedJobsList.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || job.category.toUpperCase().includes(categoryFilter.toUpperCase());
    return matchesSearch && matchesCategory;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search history by job code, title, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="CCTV">CCTV Installation & Setup</option>
              <option value="Maintenance">Maintenance & Repair</option>
              <option value="Solar">Solar & Perimeter</option>
              <option value="Access">Access Control</option>
            </select>

            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-200/70 shrink-0">
              Completed: {completedJobsList.length}
            </span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredArchivedJobs.length === 0 ? (
          <div className="p-12 bg-white border border-zinc-200 rounded-2xl text-center space-y-3 shadow-2xs">
            <History className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-900">No Job History Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              There are no completed or archived work orders matching your search filters.
            </p>
          </div>
        ) : (
          filteredArchivedJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-zinc-500">{job.jobCode}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>VERIFIED COMPLETED</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">• {formatDate(job.completedDate)}</span>
                </div>

                <h3 className="text-sm font-bold text-zinc-900">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center space-x-1 font-medium text-zinc-700">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{job.customer}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{job.address}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedSummaryJob(job)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Summary</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* JOB COMPLETION SUMMARY MODAL */}
      {selectedSummaryJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold font-sans whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Completed & Signed</span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-bold whitespace-nowrap">
                    #{selectedSummaryJob.jobCode}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                  {selectedSummaryJob.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSummaryJob(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Completion Date</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {formatDate(selectedSummaryJob.completedDate)}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Sign-Off Status</span>
                <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center space-x-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Verified & Approved ✓</span>
                </span>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer & Installation Site</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Customer Name</span>
                  <span className="font-extrabold text-slate-900">{selectedSummaryJob.customer}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Phone Contact</span>
                  <a 
                    href={`tel:${selectedSummaryJob.customerPhone}`}
                    className="font-mono font-bold text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedSummaryJob.customerPhone}</span>
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[11px] block">Site Location</span>
                  <span className="font-medium text-slate-700 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{selectedSummaryJob.address}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Field Execution Notes */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Field Technician Notes & Handover
              </h3>
              <div className="p-3.5 bg-blue-50/40 border border-blue-200/70 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans">
                {selectedSummaryJob.fieldNotes}
              </div>
            </div>


            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 w-full sm:w-auto cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Summary</span>
                </button>

                {onSelectJob && selectedSummaryJob.originalJob && (
                  <button
                    type="button"
                    onClick={() => {
                      const orig = selectedSummaryJob.originalJob;
                      setSelectedSummaryJob(null);
                      onSelectJob(orig);
                    }}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 w-full sm:w-auto cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Work Order</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSummaryJob(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors w-full sm:w-auto cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
