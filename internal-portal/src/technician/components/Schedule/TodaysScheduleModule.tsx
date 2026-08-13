import React, { useState } from 'react';
import type { Job } from '../../types/job';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Play, 
  Phone, 
  Briefcase
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';

interface TodaysScheduleModuleProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onOpenWorkflow: (job: Job) => void;
}

export const TodaysScheduleModule: React.FC<TodaysScheduleModuleProps> = ({
  jobs,
  onSelectJob,
  onOpenWorkflow,
}) => {
  // Normalize Date Comparison across timezone boundaries (UTC & Local)
  const now = new Date();
  const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const utcTodayStr = now.toISOString().split('T')[0];

  const todaysJobs = jobs && jobs.length > 0 ? jobs.filter(j => {
    if (j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED' || j.status === 'PENDING' || j.status === 'ASSIGNED') {
      return true;
    }
    if (!j.scheduledDate) return false;
    const rawStr = typeof j.scheduledDate === 'string' ? j.scheduledDate : new Date(j.scheduledDate).toISOString();
    const parsedDateStr = rawStr.split('T')[0];
    return parsedDateStr === localTodayStr || parsedDateStr === utcTodayStr;
  }) : [];

  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ALL');

  const displayedJobs = todaysJobs.filter(j => {
    if (filterMode === 'ACTIVE') return j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED';
    if (filterMode === 'UPCOMING') return j.status === 'PENDING';
    return true;
  });

  const techName = localStorage.getItem('user_name') || 'Technician';

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* 🚀 Today's Timeline Summary Header Card */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                LIVE SHIFT SCHEDULE
              </span>
              <span className="text-xs text-zinc-400 font-mono">{formatDate(new Date())}</span>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mt-1">
              Today's Field Execution Timeline
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {todaysJobs.length} dispatched site visits scheduled for technician {techName}.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-zinc-100 p-1.5 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              ALL TODAY ({todaysJobs.length})
            </button>
            <button
              onClick={() => setFilterMode('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'ACTIVE' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              ACTIVE SITE ({todaysJobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length})
            </button>
            <button
              onClick={() => setFilterMode('UPCOMING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterMode === 'UPCOMING' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              UPCOMING ({todaysJobs.filter(j => j.status === 'PENDING').length})
            </button>
          </div>
        </div>

        {/* Timeline Quick Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {todaysJobs.slice(0, 3).map((job, idx) => (
            <div key={job.id} className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Slot {idx + 1} ({job.scheduledTimeSlot ? job.scheduledTimeSlot.split(' - ')[0] : 'TBD'})</span>
                <span className={`text-xs font-bold ${job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED' ? 'text-[#00C885]' : 'text-zinc-700'}`}>
                  {job.customer?.name} — {job.status}
                </span>
              </div>
              {job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED' ? (
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C885] animate-ping" />
              ) : (
                <Clock className="w-4 h-4 text-zinc-400" />
              )}
            </div>
          ))}
          {todaysJobs.length === 0 && (
            <div className="sm:col-span-3 py-4 text-center text-zinc-400 text-xs">
              No scheduled jobs for today.
            </div>
          )}
        </div>
      </div>

      {/* 📅 Sequential Timeline Schedule List */}
      <div className="space-y-4">
        {displayedJobs.map((job, index) => {
          const isActive = job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED';
          return (
            <div 
              key={job.id}
              className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all duration-200 hover:shadow-md ${
                isActive ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200/90'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Time & Job Info */}
                <div className="flex items-start space-x-4">
                  {/* Time Badge */}
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-mono text-center border ${
                    isActive 
                      ? 'bg-zinc-900 text-white border-zinc-900' 
                      : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                  }`}>
                    <span className="text-[10px] font-bold uppercase opacity-80">SLOT {index + 1}</span>
                    <span className="text-xs font-black mt-0.5">{job.scheduledTimeSlot.split(' - ')[0]}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-500">{job.jobCode}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                        job.priority === 'URGENT' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {job.priority}
                      </span>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>IN EXECUTION</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-zinc-900">{job.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
                      <span className="flex items-center space-x-1 font-semibold text-zinc-800">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{job.customer.name}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-zinc-500">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{job.customer.address}, {job.customer.city}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end sm:justify-start lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-zinc-100">
                  <a
                    href={`tel:${job.customer.phone}`}
                    className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
                    title="Call Customer"
                  >
                    <Phone className="w-4 h-4 text-zinc-700" />
                  </a>

                  <button
                    onClick={() => onSelectJob(job)}
                    className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => onOpenWorkflow(job)}
                    className={`px-5 py-3 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs flex-1 sm:flex-none ${
                      isActive 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isActive ? 'CONTINUE WORKFLOW' : 'START JOB'}</span>
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
