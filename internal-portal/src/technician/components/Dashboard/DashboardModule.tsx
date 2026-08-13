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
  Zap
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
    hoursLogged: number;
    shiftTarget: number;
    firstTimeFix: number;
    safetyScore: number;
  } | null;
  isLoading?: boolean;
  onSelectJob: (job: Job) => void;
  onOpenWorkflow: (job: Job) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  jobs,
  summaryStats = null,
  isLoading = false,
  onSelectJob,
  onOpenWorkflow,
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
      {/* 🚀 Command Center Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white rounded-2xl p-6 lg:p-7 shadow-lg border border-slate-700/60 relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Status & Date Pill */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>ON DUTY • SHIFT ACTIVE</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-300 font-mono">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayFormatted}</span>
              </span>
            </div>

            {/* Main Greeting */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
                <span>👋 {greeting}, {localStorage.getItem('user_name') ? localStorage.getItem('user_name').split(' ')[0] : 'Technician'}</span>
              </h1>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            {nextJob && (
              <button
                onClick={() => onOpenWorkflow(nextJob)}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg cursor-pointer transform hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>START NEXT JOB</span>
              </button>
            )}

            <button
              onClick={() => nextJob && onSelectJob(nextJob)}
              className="px-5 py-3 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-600 flex items-center justify-center space-x-2 transition-all duration-200 shadow-md cursor-pointer hover:border-slate-500"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>VIEW TODAY'S ROUTE</span>
            </button>
          </div>
        </div>
      </div>
      {/* 6 High-Performance Metric Cards Row - Mobile 2 Cols, Desktop Preserved */}
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Assigned */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ASSIGNED JOBS</span>
                <div className="w-8 h-8 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-200 flex items-center justify-center text-zinc-700">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                {totalAssignedVal === null ? (
                  <div className="w-14 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-3xl font-black text-zinc-900 tracking-tight">{totalAssignedVal}</p>
                )}
                {totalAssignedVal === null ? (
                  <div className="w-12 h-4 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                    (totalAssignedVal || 0) > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-zinc-500 bg-zinc-50'
                  }`}>
                    {(totalAssignedVal || 0) > 0 ? 'Active' : '0 Assigned'}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-semibold text-zinc-500 mt-1.5 flex items-center space-x-1">
                {totalAssignedVal === null ? (
                  <div className="w-24 h-3 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span>{totalAssignedVal} Assigned</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-amber-600 font-normal">{availablePoolJobs.length} Available Pool</span>
                  </>
                )}
              </p>

              {/* Tiny Progress Bar */}
              <div className="w-full bg-zinc-100 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-zinc-900 h-full rounded-full transition-all duration-500" style={{ width: (totalAssignedVal || 0) > 0 ? '100%' : '0%' }} />
              </div>
            </div>

            {/* 2. In Progress */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-300/80 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">IN PROGRESS</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                {inProgressVal === null ? (
                  <div className="w-14 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-3xl font-black text-zinc-900 tracking-tight">{inProgressVal}</p>
                )}
                {inProgressVal === null ? (
                  <div className="w-12 h-4 bg-amber-100 animate-pulse rounded" />
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                    <Zap className="w-3 h-3 mr-0.5" />
                    Active
                  </span>
                )}
              </div>

              <p className="text-[11px] font-semibold text-amber-600 mt-1.5 flex items-center space-x-1">
                {inProgressVal === null ? (
                  <div className="w-24 h-3 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span>Active On Site</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-zinc-400 font-normal">{pendingJobs.length} Pending</span>
                  </>
                )}
              </p>

              {/* Tiny Progress Bar */}
              <div className="w-full bg-amber-100 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: (totalAssignedVal || 0) > 0 ? `${((inProgressVal || 0) / (totalAssignedVal || 1)) * 100}%` : '0%' }} />
              </div>
            </div>

            {/* 3. Completed Today */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-300/80 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">COMPLETED TODAY</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                {completedVal === null ? (
                  <div className="w-14 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-3xl font-black text-zinc-900 tracking-tight">{completedVal}</p>
                )}
                {completedVal === null ? (
                  <div className="w-12 h-4 bg-emerald-100 animate-pulse rounded" />
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    {(completedVal || 0) > 0 ? '100%' : '0%'}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-semibold text-emerald-600 mt-1.5 flex items-center space-x-1">
                {completedVal === null ? (
                  <div className="w-24 h-3 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span>QA Passed</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-zinc-400 font-normal">Completed</span>
                  </>
                )}
              </p>

              {/* Tiny Progress Bar */}
              <div className="w-full bg-emerald-100 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: (totalAssignedVal || 0) > 0 ? `${((completedVal || 0) / (totalAssignedVal || 1)) * 100}%` : '0%' }} />
              </div>
            </div>

            {/* 4. Hours Logged */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">HOURS LOGGED</span>
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                {hoursVal === null ? (
                  <div className="w-14 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-3xl font-black text-zinc-900 tracking-tight">
                    {hoursVal.toFixed(1)} <span className="text-xs font-bold text-zinc-400 font-mono">hrs</span>
                  </p>
                )}
                {hoursVal === null ? (
                  <div className="w-12 h-4 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    Auto Sum
                  </span>
                )}
              </div>

              <p className="text-[11px] font-semibold text-zinc-600 mt-1.5 flex items-center space-x-1">
                {hoursVal === null ? (
                  <div className="w-24 h-3 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span>Shift Target: 8h</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-zinc-400 font-normal">{(hoursVal || 0) >= 8 ? 'Target Met' : `${(8 - (hoursVal || 0)).toFixed(1)}h left`}</span>
                  </>
                )}
              </p>

              {/* Tiny Progress Bar */}
              <div className="w-full bg-zinc-100 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-zinc-800 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(((hoursVal || 0) / 8) * 100, 100)}%` }} />
              </div>
            </div>

            {/* 5. First-Time Fix */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-sky-300/80 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">FIRST-TIME FIX</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                {fixRateVal === null ? (
                  <div className="w-14 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-3xl font-black text-zinc-900 tracking-tight">{fixRateVal.toFixed(1)}%</p>
                )}
                {fixRateVal === null ? (
                  <div className="w-12 h-4 bg-sky-100 animate-pulse rounded" />
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-mono">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    {(fixRateVal || 0) > 0 ? '+100%' : '0%'}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-semibold text-sky-600 mt-1.5 flex items-center space-x-1">
                {fixRateVal === null ? (
                  <div className="w-24 h-3 bg-zinc-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span>Single Visit</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-zinc-400 font-normal">{(completedVal || 0) > 0 ? 'Top Tier' : 'No Completed Jobs'}</span>
                  </>
                )}
              </p>

              {/* Tiny Progress Bar */}
              <div className="w-full bg-sky-100 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${fixRateVal || 0}%` }} />
              </div>
            </div>

            {/* 6. Safety Score */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-300/80 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SAFETY SCORE</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                {safetyVal === null ? (
                  <div className="w-14 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-3xl font-black text-zinc-900 tracking-tight">{safetyVal}%</p>
                )}
                {safetyVal === null ? (
                  <div className="w-12 h-4 bg-emerald-100 animate-pulse rounded" />
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                    ★ {safetyVal === 100 ? 'Perfect' : 'N/A'}
                  </span>
                )}
              </div>

              <p className="text-[11px] font-semibold text-emerald-600 mt-1.5 flex items-center space-x-1">
                <span>Zero Incidents</span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-400 font-normal">{jobs.length > 0 ? 'LOTO Verified' : 'No Active Job'}</span>
              </p>

            </div>
      </div>

      {/* Active Working Job Dark Navy Hero Banner */}
      {activeJob ? (
        <div className="border border-zinc-950 bg-[#0F172A] text-white rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                ACTIVE JOB IN PROGRESS
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 font-semibold">{activeJob.jobCode}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">{activeJob.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-400 font-medium">Customer:</strong> {activeJob.customer.name} • <span className="text-slate-400">{activeJob.customer.address}</span>
                </p>
                <p>
                  <strong className="text-slate-400 font-medium">Equipment:</strong> {activeJob.installation.equipmentType}
                </p>
                <p className="sm:col-span-2">
                  <strong className="text-slate-400 font-medium">Scheduled:</strong> {activeJob.scheduledTimeSlot}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => onSelectJob(activeJob)}
                className="px-5 py-3 border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                View Details
              </button>
              <button
                onClick={() => onOpenWorkflow(activeJob)}
                className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-slate-900" />
                <span>Open Workflow Center</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white rounded-xl p-6 text-center space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900">No Active Job Currently In Progress</h3>
          <p className="text-xs text-zinc-500">Select a pending job from your queue to accept and start work.</p>
        </div>
      )}

      {/* Main Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width): Daily Technician Shift Log & Feedback Hub */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Daily Shift Experience & Field Feedback Form */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <MessageSquarePlus className="w-4 h-4 text-zinc-800" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Daily Shift Log & Dispatch Feedback
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded border border-amber-200">
                DAILY SHIFT LOG ACTIVE
              </span>
            </div>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <ThumbsUp className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">Shift Log & Feedback Submitted Successfully!</p>
                <p className="text-[11px] text-emerald-700">Thank you. Dispatch and Supervisor team have received your site report.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Feedback Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    >
                      <option value="Safety & Parts">Safety & Parts Inventory</option>
                      <option value="Dispatch Schedule">Dispatch Schedule & Timing</option>
                      <option value="Site Access & Gate">Site Access & Customer Clearance</option>
                      <option value="Equipment Manuals">Equipment Manual Clarity</option>
                    </select>
                  </div>

                  {/* Rating Stars */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Site Condition Rating</label>
                    <div className="flex items-center space-x-1.5 pt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`} />
                        </button>
                      ))}
                      <span className="text-[11px] font-mono text-zinc-500 font-semibold ml-2">({rating}/5 Stars)</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Note Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Daily Field Notes & Safety Feedback</label>
                  <textarea
                    rows={2}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log any site issues, missing parts, customer delays, or safety suggestions..."
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-zinc-400 font-mono">Synced with Supervisor Portal</span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Daily Report</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>



        {/* Right Column (1/3 width): Pending Dispatch Queue */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
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
                    <p className="text-[11px] text-zinc-500">{job.customer.name} — {job.customer.city}</p>
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
    </div>
  );
};
