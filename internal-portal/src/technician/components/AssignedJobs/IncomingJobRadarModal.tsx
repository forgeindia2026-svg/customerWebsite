import React, { useState, useEffect } from 'react';
import { Radio, MapPin, Package, Clock, ShieldCheck, Zap } from 'lucide-react';

export interface IncomingJobData {
  jobCode: string;
  title: string;
  customerName?: string;
  location: string;
  itemsCount?: number;
  amount?: number;
  createdAt?: string;
}

interface IncomingJobRadarModalProps {
  job: IncomingJobData | null;
  isOpen: boolean;
  onCountdownComplete: (job: IncomingJobData) => void;
}

export const IncomingJobRadarModal: React.FC<IncomingJobRadarModalProps> = ({
  job,
  isOpen,
  onCountdownComplete
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(20);

  useEffect(() => {
    if (!isOpen || !job) {
      setSecondsLeft(20);
      return;
    }

    setSecondsLeft(20);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCountdownComplete(job);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, job?.jobCode]);

  if (!isOpen || !job) return null;

  const progressPercent = ((20 - secondsLeft) / 20) * 100;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-500/30 overflow-hidden text-center p-6 space-y-5">
        
        {/* Top Radar Pulse Animation */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 animate-ping opacity-75" />
          <div className="absolute w-20 h-20 rounded-full bg-blue-500/30 animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 text-white font-black">
            <Radio className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        {/* Title & Flash Tag */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
            <Zap className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
            <span>Incoming Broadcast (Rapido Radar)</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            New CCTV Order in Queue!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Smart auto-dispatching to available technician in:
          </p>
        </div>

        {/* 20-Second Countdown Circle */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-100 dark:text-slate-800"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-linear"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {secondsLeft}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase -mt-1">SEC</span>
            </div>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/50">
              {job.jobCode}
            </span>
            {job.amount ? (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{job.amount.toLocaleString()}
              </span>
            ) : null}
          </div>

          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
            {job.title}
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="truncate">{job.location || 'Chennai Site'}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3 text-slate-400" />
              <span>{job.itemsCount || 1} Device(s)</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Verified Client</span>
            </div>
          </div>
        </div>

        {/* Notice Info */}
        <div className="text-[11px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/40 py-2 px-3 rounded-xl">
          📡 Auto-assigning to nearest standby technician based on rating & availability...
        </div>

      </div>
    </div>
  );
};
