import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Wallet, 
  CheckCircle, 
  Search, 
  TrendingUp, 
  Award, 
  User, 
  Briefcase,
  DollarSign,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { getApiUrl } from '../../utils/config';

export default function AdminTechEarningsModal({ isOpen, onClose, technician, summary }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('THIS_MONTH'); // 'THIS_MONTH' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  let currentYearMonth = '';
  try {
    currentYearMonth = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now).substring(0, 7);
  } catch (_) {
    currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  useEffect(() => {
    if (isOpen && technician) {
      fetchTechEarnings();
    }
  }, [isOpen, technician]);

  const fetchTechEarnings = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const techName = technician?.name || '';
      
      const res = await fetch(`${baseUrl}/api/jobs?status=COMPLETED&technicianName=${encodeURIComponent(techName)}`);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Sort descending by scheduledDate / date / createdAt
        const sorted = data.data.sort((a, b) => {
          const dateA = new Date(a.scheduledDate || a.date || a.createdAt || a.updatedAt).getTime();
          const dateB = new Date(b.scheduledDate || b.date || b.createdAt || b.updatedAt).getTime();
          return dateB - dateA;
        });
        setJobs(sorted);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching admin technician earnings history:', err);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getJobDateString = (j) => {
    if (j.scheduledDate && typeof j.scheduledDate === 'string') {
      return j.scheduledDate.split('T')[0];
    }
    if (j.date && typeof j.date === 'string') {
      return j.date.split('T')[0];
    }
    if (j.dailyReports && j.dailyReports.length > 0 && j.dailyReports[0]?.date) {
      return String(j.dailyReports[0].date).split('T')[0];
    }
    if (j.createdAt) {
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(j.createdAt));
      } catch (_) {
        return String(j.createdAt).split('T')[0];
      }
    }
    if (j.updatedAt) {
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(j.updatedAt));
      } catch (_) {
        return String(j.updatedAt).split('T')[0];
      }
    }
    return '';
  };

  const formatJobDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getJobEarningDetails = (job) => {
    const targetName = (technician?.name || '').toLowerCase().trim();
    const assignedName = (
      job.assignedTechnicianName ||
      (typeof job.assignedTechnician === 'string' ? job.assignedTechnician : job.assignedTechnician?.name) ||
      ''
    ).toLowerCase();

    const isMain =
      assignedName.includes(targetName) ||
      (Array.isArray(job.assignedTechnicians) && job.assignedTechnicians.some(t => {
        const tName = typeof t === 'string' ? t : (t?.name || '');
        return typeof tName === 'string' && tName.toLowerCase().includes(targetName);
      }));

    let earning = 0;
    let role = isMain ? 'Lead Technician' : 'Sub-Technician';

    if (isMain) {
      earning = Number(job.financials?.mainTechnicianEarning ?? job.mainTechnicianEarning ?? job.financials?.technicianEarning ?? job.technicianEarning ?? 0);
    } else {
      const subs = job.financials?.subTechnicianEarnings || job.subTechnicianEarnings || {};
      let subAmount = 0;
      if (Array.isArray(subs)) {
        const match = subs.find(st => (st.technicianName || '').toLowerCase().includes(targetName));
        if (match) subAmount = Number(match.amount || 0);
      } else {
        const key = Object.keys(subs).find(k => k.toLowerCase().includes(targetName));
        if (key) subAmount = Number(subs[key]);
      }
      if (subAmount > 0) {
        earning = subAmount;
        role = 'Sub-Technician';
      } else {
        earning = Number(job.financials?.technicianEarning ?? job.technicianEarning ?? 0);
      }
    }

    return { earning, role, isMain };
  };

  const isJobThisMonth = (job) => {
    const dStr = getJobDateString(job);
    return dStr.startsWith(currentYearMonth);
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Period filter
      if (filterPeriod === 'THIS_MONTH' && !isJobThisMonth(job)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (job.jobCode || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        const customer = (job.customer?.name || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !customer.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, filterPeriod, searchQuery, currentYearMonth]);

  // Instant Totals: Use calculated jobs when ready, fallback to preloaded summary
  const thisMonthTotal = useMemo(() => {
    if (jobs.length > 0) {
      const sum = jobs.reduce((acc, j) => isJobThisMonth(j) ? acc + getJobEarningDetails(j).earning : acc, 0);
      return sum || (summary?.monthlyEarnings ?? 0);
    }
    return summary?.monthlyEarnings ?? 0;
  }, [jobs, summary, currentYearMonth]);

  const allTimeTotal = useMemo(() => {
    if (jobs.length > 0) {
      const sum = jobs.reduce((acc, j) => acc + getJobEarningDetails(j).earning, 0);
      return sum || (summary?.totalEarnings ?? technician?.totalEarnings ?? technician?.earnings ?? 0);
    }
    return summary?.totalEarnings ?? technician?.totalEarnings ?? technician?.earnings ?? 0;
  }, [jobs, summary, technician]);

  const completedCount = useMemo(() => {
    if (jobs.length > 0) {
      return jobs.length;
    }
    return summary?.totalCompleted ?? technician?.completedJobsCount ?? 0;
  }, [jobs, summary, technician]);

  if (!isOpen || !technician) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-150 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/20 shrink-0 overflow-hidden">
                {technician.avatarUrl ? (
                  <img src={technician.avatarUrl} alt={technician.name} className="w-full h-full object-cover" />
                ) : (
                  (technician.name || 'T').slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {technician.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    {technician.role || 'Technician'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  📞 {technician.phone} • ✉️ {technician.email}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mt-4">
            {/* 1. This Month */}
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                <span className="text-[10px] font-black uppercase tracking-wider">THIS MONTH</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1.5">
                <span className="text-lg sm:text-xl font-black text-indigo-900 dark:text-indigo-200 font-mono">
                  ₹{thisMonthTotal.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-medium">Earned this month</p>
              </div>
            </div>

            {/* 2. Lifetime Earnings */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] font-black uppercase tracking-wider">LIFETIME</span>
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1.5">
                <span className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
                  ₹{allTimeTotal.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium">Total all-time</p>
              </div>
            </div>

            {/* 3. Completed Jobs Count */}
            <div className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">COMPLETED</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-1.5">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {completedCount}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">Signed off work</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Period Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterPeriod('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'THIS_MONTH'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              This Month (₹{thisMonthTotal.toLocaleString('en-IN')})
            </button>
            <button
              onClick={() => setFilterPeriod('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All History (₹{allTimeTotal.toLocaleString('en-IN')})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by job code, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Jobs List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/30">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 py-1">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading completed work orders...</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 animate-pulse flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
                    </div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-36 mt-1" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No earnings records found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {filterPeriod === 'THIS_MONTH'
                  ? 'This technician has no completed jobs recorded in the current month.'
                  : 'No completed jobs match your search filter.'}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const { earning, role, isMain } = getJobEarningDetails(job);
              const jobDate = getJobDateString(job);
              const orderValue = job.financials?.totalValue || job.totalValue || job.salesValue;
              const companyProfit = job.financials?.companyProfit || job.companyProfit;

              return (
                <div 
                  key={job._id || job.id || job.jobCode}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border border-indigo-100 dark:border-indigo-900/60">
                          {job.jobCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMain 
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40' 
                            : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40'
                        }`}>
                          {role}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {job.title || job.category || 'CCTV Installation & Service'}
                      </h4>
                      {job.customer?.name && (
                        <p className="text-xs text-slate-500 font-medium">
                          👤 {job.customer.name} {job.customer.city ? `• 📍 ${job.customer.city}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        +₹{earning.toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">Payout Earning</p>
                    </div>
                  </div>

                  {/* Financial Audit footer for Admin */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{formatJobDate(jobDate)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      {orderValue > 0 && (
                        <span className="text-slate-500">
                          Order: <strong className="text-slate-700 dark:text-slate-300 font-mono">₹{Number(orderValue).toLocaleString('en-IN')}</strong>
                        </span>
                      )}
                      {companyProfit > 0 && (
                        <span className="text-slate-500">
                          Profit: <strong className="text-emerald-600 font-mono">₹{Number(companyProfit).toLocaleString('en-IN')}</strong>
                        </span>
                      )}
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-md uppercase">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
