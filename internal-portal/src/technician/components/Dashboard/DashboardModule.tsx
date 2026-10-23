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
  ExternalLink,
  Receipt,
  Layers
} from 'lucide-react';

import { formatDate } from '../../services/dateUtils';
import { AttendanceCard } from '../Attendance/AttendanceCard';
import { TechnicianExpenseModal } from './TechnicianExpenseModal';
import { fetchExpensesApi, fetchExpensesSummaryApi } from '../../../utils/expenseStorage';

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
    totalEarnings?: number;
    monthlyEarnings?: number;
    todayEarnings?: number;
  } | null;
  isLoading?: boolean;
  onSelectJob: (job: Job) => void;
  onOpenWorkflow: (job: Job) => void;
  onNavigateTab?: (tab: string, statusFilter?: any) => void;
}

import { EarningsHistoryModal } from './EarningsHistoryModal';

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
  const pendingVal = summaryStats ? (summaryStats.pending ?? pendingJobs.length) : (pendingJobs.length > 0 ? pendingJobs.length : 0);
  const completedVal = summaryStats ? summaryStats.completedToday : (completedJobs.length > 0 ? completedJobs.length : (isLoading ? null : 0));
  const totalCompletedVal = summaryStats?.totalCompleted !== undefined
    ? summaryStats.totalCompleted
    : (completedJobs.length > 0 ? completedJobs.length : (isLoading ? null : 0));
  const completionRate = (totalAssignedVal && Number(totalAssignedVal) > 0) ? Math.round(((Number(completedVal) || 0) / Number(totalAssignedVal)) * 100) : 0;
  const hoursVal = summaryStats ? summaryStats.hoursLogged : totalHoursLogged;
  const fixRateVal = summaryStats ? summaryStats.firstTimeFix : (completedJobs.length > 0 ? 100.0 : (isLoading ? null : 0.0));
  const safetyVal = summaryStats ? summaryStats.safetyScore : (myAssignedJobs.length > 0 ? 100 : (isLoading ? null : 0));
  
  // Current month & today date markers for strictly scoped earnings
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const authUser = JSON.parse(localStorage.getItem('tech_user') || localStorage.getItem('internal_user') || '{}');
  const currentTechName = (authUser.name || localStorage.getItem('user_name') || '').toLowerCase().trim();
  const currentTechPhone = (authUser.phone || localStorage.getItem('user_phone') || '').replace(/\D/g, '');

  // Compute strictly from completed jobs for this month if summaryStats is missing
  const computedStatsFromJobs = React.useMemo(() => {
    let mEarnings = 0;
    let tEarnings = 0;
    completedJobs.forEach((j: any) => {
      let earning = 0;
      const assignedName = (
        j.assignedTechnicianName ||
        (typeof j.assignedTechnician === 'string' ? j.assignedTechnician : j.assignedTechnician?.name) ||
        ''
      ).toLowerCase();
      const isMain =
        assignedName.includes(currentTechName) ||
        (Array.isArray(j.assignedTechnicians) && j.assignedTechnicians.some((t: any) => {
          const tName = typeof t === 'string' ? t : (t?.name || '');
          return tName.toLowerCase().includes(currentTechName);
        }));

      if (isMain) {
        earning = Number(j.financials?.mainTechnicianEarning ?? j.mainTechnicianEarning ?? j.financials?.technicianEarning ?? j.technicianEarning ?? 0);
      } else {
        const subs = j.financials?.subTechnicianEarnings || j.subTechnicianEarnings || {};
        let subAmount = 0;
        if (Array.isArray(subs)) {
          const match = subs.find((st: any) => st.technicianName?.toLowerCase().includes(currentTechName));
          if (match) subAmount = Number(match.amount || 0);
        } else {
          const key = Object.keys(subs).find(k => k.toLowerCase().includes(currentTechName));
          if (key) subAmount = Number(subs[key]);
        }
        earning = subAmount > 0 ? subAmount : Number(j.financials?.technicianEarning ?? j.technicianEarning ?? 0);
      }

      const rawDate = j.scheduledDate || j.date || (j.dailyReports && j.dailyReports[0]?.date) || (j.createdAt ? String(j.createdAt).split('T')[0] : '');
      const dateStr = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
      if (dateStr.startsWith(currentYearMonth)) {
        mEarnings += earning;
      }
      if (dateStr === todayStr) {
        tEarnings += earning;
      }
    });
    return { monthlyEarnings: mEarnings, todayEarnings: tEarnings };
  }, [completedJobs, currentTechName, currentYearMonth, todayStr]);

  const totalEarningsVal = summaryStats?.totalEarnings ?? 0;
  const monthlyEarningsVal = summaryStats?.monthlyEarnings !== undefined 
    ? summaryStats.monthlyEarnings 
    : computedStatsFromJobs.monthlyEarnings;
  const todayEarningsVal = summaryStats?.todayEarnings !== undefined 
    ? summaryStats.todayEarnings 
    : computedStatsFromJobs.todayEarnings;

  const nextJob = activeJob || jobs[0];

  // Dynamic Time-based Greeting & Date
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayFormatted = formatDate(new Date());

  // Daily Shift Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Safety & Parts');
  const [noteText, setNoteText] = useState('');
  const [showEarningsHistory, setShowEarningsHistory] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseModalScope, setExpenseModalScope] = useState<'MY' | 'ALL'>('MY');
  const [myMonthlyExpenses, setMyMonthlyExpenses] = useState(0);
  const [myExpensesCount, setMyExpensesCount] = useState(0);
  const [totalTeamExpenses, setTotalTeamExpenses] = useState(0);
  const [totalTeamExpensesCount, setTotalTeamExpensesCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const loadTechnicianExpenses = async () => {
    try {
      const [sumData, records] = await Promise.all([
        fetchExpensesSummaryApi(currentYearMonth),
        fetchExpensesApi(currentYearMonth)
      ]);

      // 1. Total Company Expenses (strictly matching Admin /admin/expenses: e.g. ₹82,179, 74 expenses)
      const companyTotal = sumData?.summary?.thisMonthTotal ?? (Array.isArray(records) ? records.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) : 0);
      const companyCount = sumData?.summary?.thisMonthCount ?? (Array.isArray(records) ? records.length : 0);
      setTotalTeamExpenses(companyTotal);
      setTotalTeamExpensesCount(companyCount);

      // 2. Technician Own Expenses (strictly matching GOPINATH.M breakdown: ₹1,380, 6 claims)
      // Check official technicianBreakdown from API first
      const techBreakdownEntry = (sumData?.technicianBreakdown || []).find((t: any) => {
        const tName = (t.technicianName || '').toLowerCase().trim();
        return currentTechName && (tName.includes(currentTechName) || currentTechName.includes(tName));
      });

      if (techBreakdownEntry) {
        setMyMonthlyExpenses(Number(techBreakdownEntry.monthTotal) || 0);
        setMyExpensesCount(Number(techBreakdownEntry.monthCount) || 0);
      } else if (Array.isArray(records)) {
        // Fallback filter strictly on records: EXCLUDE ALL OFFICE EXPENSES
        const myRecords = records.filter((e: any) => {
          if (!currentTechName && !currentTechPhone) return false;
          if (e.expenseType === 'OFFICE' || (e.technicianName || '').toLowerCase().startsWith('office')) return false;

          const tName = (e.technicianName || '').toLowerCase().trim();
          const rawPhone = (e.phone || e.technicianPhone || '').replace(/\D/g, '');

          const matchesPhone = Boolean(currentTechPhone && rawPhone && (rawPhone.includes(currentTechPhone) || currentTechPhone.includes(rawPhone)));
          const matchesName = Boolean(currentTechName && (tName.includes(currentTechName) || currentTechName.includes(tName)));
          return matchesPhone || matchesName;
        });
        setMyExpensesCount(myRecords.length);
        const myTotal = myRecords.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
        setMyMonthlyExpenses(myTotal);
      }
    } catch (e) {
      console.warn('Load tech expenses error:', e);
    }
  };

  React.useEffect(() => {
    loadTechnicianExpenses();

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key === 'sk_technician_expenses') {
        loadTechnicianExpenses();
      }
    };
    const handleCustomEvent = () => {
      loadTechnicianExpenses();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('expenses_updated', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expenses_updated', handleCustomEvent);
    };
  }, [currentTechName, currentTechPhone, currentYearMonth]);

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
    <div className="space-y-4 sm:space-y-6 text-zinc-900 font-sans">
      {/* 📍 Live Attendance Punch In / Punch Out Card */}
      <AttendanceCard />

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

      {/* 🚀 Vibrant Hero Metric Grid (8 Cards: Assigned, In Progress, Scheduled, Completed, Month Earnings, Today Earnings, My Expenses, Total Company Expenses) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
        {/* 1. TOTAL ASSIGNED (Purple Card) */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'ALL')}
          className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[145px] select-none group"
          title="Click to view all Assigned Jobs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              TOTAL ASSIGNED
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              {totalAssignedVal ?? 0}
            </span>
            <span className="px-3 py-0.5 rounded-full bg-white/25 text-white text-xs font-bold tracking-wide">
              Orders
            </span>
          </div>

          <p className="text-xs font-medium text-white/85">
            Assigned work orders
          </p>
        </div>

        {/* 2. IN PROGRESS (Blue Card) */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'IN_PROGRESS')}
          className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[145px] select-none group"
          title="Click to view Active In Progress Jobs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              IN PROGRESS
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              {inProgressVal ?? 0}
            </span>
            <span className="px-3 py-0.5 rounded-full bg-white/25 text-white text-xs font-bold tracking-wide">
              Active
            </span>
          </div>

          <p className="text-xs font-medium text-white/85">
            Work in progress on site
          </p>
        </div>

        {/* 3. PENDING START (Orange Card) */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'PENDING')}
          className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[145px] select-none group"
          title="Click to view Pending Scheduled Jobs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              PENDING START
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              {pendingVal ?? 0}
            </span>
            <span className="px-3 py-0.5 rounded-full bg-white/25 text-white text-xs font-bold tracking-wide">
              Scheduled
            </span>
          </div>

          <p className="text-xs font-medium text-white/85">
            Scheduled & awaiting start
          </p>
        </div>

        {/* 4. COMPLETED (Green Card) */}
        <div 
          onClick={() => onNavigateTab?.('assigned_jobs', 'COMPLETED')}
          className="bg-[#10B981] hover:bg-[#059669] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[145px] select-none group"
          title="Click to view Completed Jobs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              COMPLETED
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              {completedVal ?? 0}
            </span>
            <span className="px-3 py-0.5 rounded-full bg-white/25 text-white text-xs font-bold tracking-wide">
              {completionRate}%
            </span>
          </div>

          <p className="text-xs font-medium text-white/85">
            Finished & signed off
          </p>
        </div>

        {/* 5. MONTHLY EARNINGS (Indigo Card) */}
        <div 
          onClick={() => setShowEarningsHistory(true)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between min-h-[145px] select-none group cursor-pointer"
          title="Monthly Earnings"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              THIS MONTH'S EARNINGS
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              ₹{monthlyEarningsVal.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs font-medium text-white/85 flex items-center justify-between">
            <span>Earned this month</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">View history &rarr;</span>
          </p>
        </div>

        {/* 6. TODAY'S EARNINGS (Pink Card) */}
        <div 
          onClick={() => setShowEarningsHistory(true)}
          className="bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between min-h-[145px] select-none group cursor-pointer"
          title="Today's Earnings"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              TODAY'S EARNINGS
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              ₹{todayEarningsVal.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs font-medium text-white/85">
            Earned today
          </p>
        </div>

        {/* 7. THIS MONTH'S EXPENSES (Rose / Crimson Card) */}
        <div 
          onClick={() => {
            setExpenseModalScope('MY');
            setShowExpenseModal(true);
          }}
          className="bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between min-h-[145px] select-none group cursor-pointer"
          title="My Field Expenses this month"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              MY THIS MONTH'S EXPENSES
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              ₹{myMonthlyExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs font-medium text-white/85 flex items-center justify-between">
            <span>{myExpensesCount} daily {myExpensesCount === 1 ? 'claim' : 'claims'}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Claim &rarr;</span>
          </p>
        </div>

        {/* 8. TOTAL COMPANY EXPENSES (Amber / Orange Card) */}
        <div 
          onClick={() => {
            setExpenseModalScope('ALL');
            setShowExpenseModal(true);
          }}
          className="bg-[#D97706] hover:bg-[#B45309] text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between min-h-[145px] select-none group cursor-pointer"
          title="Total Company Expenses this month"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black tracking-wider text-white/90 uppercase">
              TOTAL COMPANY EXPENSES
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none font-mono">
              ₹{totalTeamExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs font-medium text-white/85 flex items-center justify-between">
            <span>{totalTeamExpensesCount} company {totalTeamExpensesCount === 1 ? 'claim' : 'claims'}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
          </p>
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2.5">
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-500/30 mt-0.5">
                  <Zap className="w-4 h-4 fill-current" />
                </span>
                <h3 
                  className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 sm:line-clamp-3 hover:line-clamp-none transition-all" 
                  title={activeJob.title}
                >
                  {activeJob.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenWorkflow(activeJob)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>CONTINUE WORKFLOW</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectJob(activeJob)}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
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

      {/* Earnings History Modal */}
      <EarningsHistoryModal 
        isOpen={showEarningsHistory} 
        onClose={() => setShowEarningsHistory(false)} 
      />

      {/* Technician Daily Field Expenses & Claims Modal */}
      <TechnicianExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseUpdated={loadTechnicianExpenses}
        initialView={expenseModalScope}
      />
    </div>
  );
};
