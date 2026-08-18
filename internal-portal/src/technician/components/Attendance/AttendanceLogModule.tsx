import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, ShieldCheck, Filter, ArrowUpRight, Zap, Award } from 'lucide-react';

interface AttendanceRecord {
  _id?: string;
  technicianId: string;
  technicianName: string;
  date: string;
  checkInTime?: string;
  checkInTimestamp?: string;
  checkOutTime?: string;
  checkOutTimestamp?: string;
  totalHours?: number;
  status: 'PRESENT' | 'HALF_DAY' | 'OVERTIME' | 'OFF_DUTY';
  notes?: string;
}

export const AttendanceLogModule: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
  const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || 'TECH-01';

  const fetchAttendanceLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/attendance?technicianId=${techId}&month=${filterMonth}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        // Fallback local records if API fails
        const today = new Date().toISOString().split('T')[0];
        const cached = localStorage.getItem(`sk_tech_attendance_${techId}_${today}`);
        if (cached) {
          setRecords([JSON.parse(cached)]);
        }
      }
    } catch (err) {
      console.warn('Attendance logs fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceLogs();
  }, [filterMonth, techId]);

  // Compute metrics
  const totalDays = records.length;
  const totalHours = records.reduce((acc, r) => acc + (r.totalHours || 0), 0);
  const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Technician Attendance Logs</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Track your daily punch-in, punch-out timestamps, and cumulative work hours.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 6 KPI Stats Summary Grid (2 Rows x 3 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Row 1: Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">DAYS WORKED</span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">{totalDays} <span className="text-[10px] font-bold text-slate-400">days</span></p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Row 1: Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">TOTAL WORK HOURS</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">{totalHours.toFixed(1)} <span className="text-[10px] font-bold text-slate-400">hrs</span></p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Row 1: Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">AVG DAILY HOURS</span>
            <p className="text-xl sm:text-2xl font-black text-indigo-600 leading-none">{avgHours} <span className="text-[10px] font-bold text-slate-400">hrs/day</span></p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Row 2: Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">PUNCH-IN TIMELINESS</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">100% <span className="text-[10px] font-bold text-slate-400">On Time</span></p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Row 2: Card 5 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">OVERTIME LOGGED</span>
            <p className="text-xl sm:text-2xl font-black text-amber-600 leading-none">0.0 <span className="text-[10px] font-bold text-slate-400">hrs</span></p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Row 2: Card 6 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">ATTENDANCE SCORE</span>
            <p className="text-xl sm:text-2xl font-black text-purple-600 leading-none">100% <span className="text-[10px] font-bold text-slate-400">Perfect</span></p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)] space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance History ({records.length})</h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold animate-pulse">
            Loading attendance logs...
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No attendance logs found for this month.</p>
            <p className="text-[11px] text-slate-400">Use the Punch In button at the top to record your daily attendance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Punch In</th>
                  <th className="py-3 px-3">Punch Out</th>
                  <th className="py-3 px-3">Work Hours</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {records.map((rec, idx) => (
                  <tr key={rec._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white font-mono">
                      {rec.date}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                      {rec.checkInTime || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                      {rec.checkOutTime || 'Active On Duty'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                      {rec.totalHours ? `${rec.totalHours.toFixed(1)} hrs` : 'In Progress'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.status === 'OFF_DUTY'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {rec.status === 'PRESENT' ? '🟢 Present' : rec.status === 'OFF_DUTY' ? '🏁 Completed' : rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
