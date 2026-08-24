import React, { useState } from 'react';
import type { Job } from '../../types/job';
import { 
  History, 
  Search, 
  FileText, 
  Briefcase, 
  MapPin, 
  Clock,
  Star
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

export const JobHistoryModule: React.FC<JobHistoryModuleProps> = ({ jobs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const completedJobs = jobs && jobs.length > 0 ? jobs.filter(j => j.status === 'COMPLETED' || j.status === 'DELIVERED' || j.status === 'APPROVED') : [];

  const techName = localStorage.getItem('user_name') || 'Technician';

  // Dynamically map completed jobs from backend
  const completedJobsList = completedJobs.map((job) => ({
    id: job.id,
    jobCode: job.jobCode,
    title: job.title,
    category: job.category,
    completedDate: job.actualCompletionDate || new Date(job.updatedAt).toISOString().split('T')[0],
    customer: job.customer?.name || 'Client',
    address: `${job.customer?.address || ''}, ${job.customer?.city || ''}`,
    hoursLogged: `${job.dailyReports?.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) || 0} hrs`,
    rating: 5,
    supervisorSignOff: job.completionSummary?.notes || 'Admin Approved',
  }));

  const filteredArchivedJobs = completedJobsList.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || job.category.toUpperCase().includes(categoryFilter.toUpperCase());
    return matchesSearch && matchesCategory;
  });

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
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400"
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
            </select>

            <span className="text-xs font-mono font-bold bg-zinc-100 px-3 py-2 rounded-xl text-zinc-800 border border-zinc-200 shrink-0">
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
              There are no completed or archived work orders in your history record.
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
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono rounded">
                    ✓ VERIFIED COMPLETED
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
                  <span className="flex items-center space-x-1 font-mono text-zinc-600">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{job.hoursLogged}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{job.rating}.0</span>
                </div>

                <button
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-600" />
                  <span>View Summary</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
