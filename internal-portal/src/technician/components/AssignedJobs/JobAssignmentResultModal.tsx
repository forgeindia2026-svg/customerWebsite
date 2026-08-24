import React, { useState, useEffect } from 'react';
import { CheckCircle2, UserCheck, ShieldCheck, MapPin, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { IncomingJobData } from './IncomingJobRadarModal';

interface JobAssignmentResultModalProps {
  job: IncomingJobData | null;
  assignedTechName: string;
  assignedTechId?: string;
  isOpen: boolean;
  onClose: () => void;
  onViewJob?: () => void;
}

export const JobAssignmentResultModal: React.FC<JobAssignmentResultModalProps> = ({
  job,
  assignedTechName,
  assignedTechId,
  isOpen,
  onClose,
  onViewJob
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(10);

  const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
  const currentTechName = authUser.name || localStorage.getItem('user_name') || '';
  const currentTechId = authUser.id || authUser._id || localStorage.getItem('user_id') || '';

  const isAssignedToMe = Boolean(
    (assignedTechName && currentTechName && assignedTechName.toLowerCase().includes(currentTechName.toLowerCase())) ||
    (assignedTechId && currentTechId && assignedTechId === currentTechId)
  );

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(10);
      return;
    }

    setSecondsLeft(10);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border ${
        isAssignedToMe ? 'border-emerald-500/40' : 'border-blue-500/30'
      } overflow-hidden text-center p-6 space-y-4`}>
        
        {/* Top Icon Badge */}
        <div className="flex items-center justify-center pt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl ${
            isAssignedToMe
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 animate-bounce'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
          }`}>
            {isAssignedToMe ? (
              <CheckCircle2 className="w-9 h-9" />
            ) : (
              <UserCheck className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Header Tag & Title */}
        <div className="space-y-1">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
            isAssignedToMe 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}>
            <span>⏱️ Closes in {secondsLeft}s</span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAssignedToMe ? '🎉 Job Allocated to YOU!' : 'Job Dispatch Confirmed'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAssignedToMe
              ? 'Order has been assigned to your active queue.'
              : `Order has been allocated to ${assignedTechName || 'Available Technician'}.`}
          </p>
        </div>

        {/* Assigned Details Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
              {job.jobCode}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              Assigned: {assignedTechName || 'Dinesh'}
            </span>
          </div>

          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
            {job.title}
          </div>

          <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="truncate">{job.location || 'Chennai Site'}</span>
          </div>
        </div>

        {/* Action button */}
        {isAssignedToMe ? (
          <button
            onClick={() => {
              onClose();
              if (onViewJob) onViewJob();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <span>View Job & Start Workflow</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-2.5 px-3 rounded-xl">
            You remain on Standby for upcoming customer bookings.
          </div>
        )}

      </div>
    </div>
  );
};
