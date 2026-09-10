import React, { useState } from 'react';
import type { Job } from '../../types/job';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Wrench,
  CalendarDays,
  FileCheck2,
  MessageSquarePlus,
  Star,
  ShieldCheck,
  Send,
  ThumbsUp,
  ShieldAlert,
  Award,
  Play,
  Navigation,
  ArrowUpRight,
  Zap,
  CheckCheck,
  User,
  MapPin,
  ExternalLink
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';

interface DashboardModuleProps {
  jobs: Job[];
  summaryStats?: {
    totalAssigned: number;
    availablePool: number;
    inProgress: number;
    pending: number;
    completedToday: number;
    totalCompleted?: number;
    hoursLogged: number;
    shiftTarget: number;
    firstTimeFix: number;
    safetyScore: number;
  } | null;
  isLoading?: boolean;
  onSelectJob: (job: Job) => void;
  onOpenWorkflow: (job: Job) => void;
  onNavigateTab?: (tab: string, statusFilter?: any) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  jobs,
  summaryStats = null,
  isLoading = false,
  onSelectJob,
  onOpenWorkflow,
  onNavigateTab,
}) => {
  const myAssignedJobs = jobs && jobs.length > 0 ? jobs : [];
  const availablePoolJobs = myAssignedJobs.filter((j) => j.isAvailableToAccept);

  const activeJob = myAssignedJobs.find((j) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED');
  const pendingJobs = myAssignedJobs.filter((j) => j.status === 'PENDING');
  const completedJobs = myAssignedJobs.filter((j) => j.status === 'COMPLETED');
  const inProgressJobs = myAssignedJobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED');

  const totalHoursLogged = completedJobs.reduce((sum, job) => {
    const reports = Array.isArray(job.dailyReports) ? job.dailyReports : [];
    return sum + reports.reduce((total: number, r: any) => total + (r.hoursWorked || 0), 0);
  }, 0);

  const totalAssignedVal = summaryStats ? summaryStats.totalAssigned : (jobs.length > 0 ? jobs.length : (isLoading ? null : 0));
  const inProgressVal = summaryStats ? summaryStats.inProgress : (inProgressJobs.length > 0 ? inProgressJobs.length : (isLoading ? null : 0));
  const completedVal = summaryStats ? summaryStats.completedToday : (completedJobs.length > 0 ? completedJobs.length : (isLoading ? null : 0));
  const totalCompletedVal = summaryStats?.totalCompleted !== undefined
    ? summaryStats.totalCompleted
    : (completedJobs.length > 0 ? completedJobs.length : (isLoading ? null : 0));
  const hoursVal = summaryStats ? summaryStats.hoursLogged : totalHoursLogged;
  const fixRateVal = summaryStats ? summaryStats.firstTimeFix : (completedJobs.length > 0 ? 100.0 : (isLoading ? null : 0.0));
  const safetyVal = summaryStats ? summaryStats.safetyScore : (myAssignedJobs.length > 0 ? 100 : (isLoading ? null : 0));

  const nextJob = activeJob || jobs[0];

  // Dynamic Time-based Greeting & Date
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayFormatted = formatDate(new Date());

  // Daily Shift Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Safety & Parts');
  const [noteText, setNoteText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNoteText('');
    }, 3000);
  };

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* 🚀 Command Center Hero Header - Fresh Light Mint / Sage Pastel Card */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-slate-50 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,185,129,0.08)] border border-emerald-200/80 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            {/* Top Status & Date Pill */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="flex items-center space-x-1.5 bg-white text-emerald-800 border border-emerald-200/90 px-3 py-1 rounded-full font-mono font-bold text-[11px] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ON DUTY • WORK ACTIVE</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-600 font-mono text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                <span>{todayFormatted}</span>
              </span>
            </div>

            {/* Main Greeting */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center space-x-2">
                <span>👋 {greeting}, {localStorage.getItem('user_name') ? localStorage.getItem('user_name').split(' ')[0] : 'Technician'}</span>
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">Daily assigned schedule & real-time field operations summary.</p>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            {nextJob && (
              <button
                onClick={() => onOpenWorkflow(nextJob)}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START NEXT JOB</span>
              </button>
            )}

            <button
              onClick={() => onSelectJob(nextJob || jobs[0])}
              className="px-5 py-3 border border-emerald-200 bg-white hover:bg-emerald-50/60 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xs"
            >
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>VIEW TODAY'S ROUTE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Clean 4 KPI Metric Cards with Contrast */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 1. Assigned Jobs */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'ALL')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between min-w-0 select-none group"
          title="Click to view all Assigned Jobs"
        >
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 truncate">ASSIGNED JOBS</span>
            <p className="text-2xl sm:text-3xl font-black text-[#2874F0] leading-none">{totalAssignedVal ?? 0}</p>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-1.5 block truncate">
              Scheduled Jobs
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-[#2874F0] border border-blue-100 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* 2. In Progress */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'IN_PROGRESS')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between min-w-0 select-none group"
          title="Click to view Active In Progress Jobs"
        >
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1 truncate">IN PROGRESS</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 leading-none">{inProgressVal ?? 0}</p>
            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 mt-1.5 block truncate flex items-center gap-0.5">
              <Zap className="w-3 h-3 fill-current shrink-0" /> Active On Site
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* 3. Completed Today */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'COMPLETED')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between min-w-0 select-none group"
          title="Click to view Completed Today Jobs"
        >
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1 truncate">COMPLETED TODAY</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 leading-none">{completedVal ?? 0}</p>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-1.5 block truncate">QA Verified</span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* 4. Total Completed */}
        <div 
          onClick={() => onNavigateTab?.('history')}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between min-w-0 select-none group"
          title="Click to view All-Time Work Order History"
        >
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1 truncate">TOTAL COMPLETED</span>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 leading-none">
              {totalCompletedVal ?? 0}
            </p>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-1.5 block truncate flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>All-Time Work Orders</span>
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Active Working Job Vibrant Modern Card */}
      {activeJob ? (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/60 p-5 sm:p-6 shadow-md hover:shadow-lg transition-all space-y-4">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-300/20 via-teal-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/15 to-transparent rounded-full blur-xl pointer-events-none" />

          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/90 pb-3.5 relative z-10">
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 rounded-full text-[11px] font-mono font-black tracking-wider uppercase shadow-xs shadow-emerald-600/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span>ACTIVE JOB IN PROGRESS</span>
              </span>
            </div>

            <span className="text-xs font-mono font-black text-indigo-700 bg-white border border-indigo-200 px-3 py-1 rounded-xl shadow-2xs">
              #{activeJob.jobCode}
            </span>
          </div>

          {/* Main Title & Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/30">
                  <Zap className="w-4.5 h-4.5 fill-current" />
                </span>
                <span>{activeJob.title}</span>
              </h3>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onOpenWorkflow(activeJob)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>CONTINUE WORKFLOW</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectJob(activeJob)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>View Details</span>
              </button>
            </div>
          </div>

          {/* 3 Colorful Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 pt-1">
            {/* Customer & Location */}
            <div className="p-3 rounded-2xl bg-white/95 border border-blue-200/80 shadow-2xs flex items-start space-x-2.5 hover:border-blue-400 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Customer & Site</span>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{activeJob.customer.name}</p>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>{activeJob.customer.address}</span>
                </p>
              </div>
            </div>

            {/* Equipment */}
            <div className="p-3 rounded-2xl bg-white/95 border border-amber-200/80 shadow-2xs flex items-start space-x-2.5 hover:border-amber-400 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Equipment & Setup</span>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{activeJob.installation.equipmentType}</p>
                <p className="text-[11px] text-amber-700/90 font-medium mt-0.5">Installation Hardware</p>
              </div>
            </div>

            {/* Scheduled Time */}
            <div className="p-3 rounded-2xl bg-white/95 border border-emerald-200/80 shadow-2xs flex items-start space-x-2.5 hover:border-emerald-400 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Scheduled Window</span>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{activeJob.scheduledTimeSlot}</p>
                <p className="text-[11px] text-emerald-700/90 font-medium mt-0.5">Active Shift Time</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white rounded-xl p-6 text-center space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900">No Active Job Currently In Progress</h3>
          <p className="text-xs text-zinc-500">Select a pending job from your queue to accept and start work.</p>
        </div>
      )}

      {/* Pending Dispatch Queue */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Pending Dispatch Queue ({pendingJobs.length})</h3>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {pendingJobs.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No pending dispatch jobs in your queue.
                </div>
              ) : (
                pendingJobs.map((job) => (
                  <div key={job.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="font-bold text-zinc-800">{job.jobCode}</span>
                      <span>{job.scheduledTimeSlot || 'TBD'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                      {job.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500">{job.customer.name} — {job.customer.address || (job.customer.city && job.customer.city.toLowerCase() !== 'chennai' ? job.customer.city : 'On-Site')}</p>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        job.priority === 'URGENT' || job.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        ● PRIORITY {job.priority}
                      </span>
                      <span className="text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                        {job.category}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors mt-4 cursor-pointer">
            <span>VIEW FULL SCHEDULE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
    </div>
  );
};
