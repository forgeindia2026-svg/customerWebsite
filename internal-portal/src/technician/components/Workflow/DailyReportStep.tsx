import React, { useState } from 'react';
import type { Job, DailyReport } from '../../types/job';
import {
  FileText,
  Clock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

import { formatDate, calculateJobDaysStats } from '../../services/dateUtils';

interface DailyReportStepProps {
  job: Job;
  onAddDailyReport: (report: Omit<DailyReport, 'id' | 'createdAt'>) => Promise<void>;
  onNextStep: () => void;
}

export const DailyReportStep: React.FC<DailyReportStepProps> = ({
  job,
  onAddDailyReport,
  onNextStep,
}) => {
  const daysStats = calculateJobDaysStats(job);
  
  // States
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get job scope of work or fallback default list
  const jobScope = job.scopeOfWork && job.scopeOfWork.length > 0
    ? job.scopeOfWork
    : [
        'Cable routing & wiring',
        'Camera mounting & placement',
        'NVR/DVR configuration',
        'App remote view testing'
      ];

  const handleTaskToggle = (task: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [task]: !prev[task]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      // Build work completed string from checklist
      const completedTasks = Object.keys(selectedTasks).filter(t => selectedTasks[t]);
      
      let workDoneText = '';
      if (completedTasks.length > 0) {
        workDoneText = `Completed: ${completedTasks.join(', ')}.`;
        if (notes.trim()) {
          workDoneText += ` Note: ${notes.trim()}`;
        }
      } else {
        workDoneText = notes.trim() || 'Completed daily shift work.';
      }

      await onAddDailyReport({
        date: formatDate(new Date()) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        technicianName: 'Alex Vance',
        hoursWorked: 8, // Pre-filled full day
        workDone: workDoneText,
        materialsUsed: [],
        statusUpdate: 'Work progressing as scheduled.',
      });

      // Reset
      setSelectedTasks({});
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Simple Form */}
      <form onSubmit={handleSubmit} className="border border-zinc-200 rounded-xl p-5 bg-white space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-zinc-800" />
              <span>Log Daily Field Progress Report</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Check the work you did today and write any notes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold font-mono bg-sky-100 text-sky-800 px-2.5 py-1 rounded-md">
              {daysStats.statusLabel}
            </span>
            <span className="text-xs font-mono bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md font-semibold">
              {job.jobCode}
            </span>
          </div>
        </div>

        {/* 1. Checklist of completed tasks */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            What did you finish today?
          </label>
          <div className="grid grid-cols-1 gap-2">
            {jobScope.map((task, i) => (
              <div 
                key={i} 
                onClick={() => handleTaskToggle(task)}
                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedTasks[task] 
                    ? 'border-zinc-900 bg-zinc-50 text-zinc-900 shadow-xs font-semibold' 
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selectedTasks[task]}
                  onChange={() => {}} // Handled by div click
                  className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-955 h-4 w-4 pointer-events-none"
                />
                <span className="text-xs">{task}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Simple optional notes */}
        <div className="space-y-1.5 border-t border-zinc-100 pt-4">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Notes / Issues (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            placeholder="e.g. Completed wire layout, no issues encountered"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>Submit Daily Progress Log</span>
        </button>
      </form>

      {/* History of Submitted Daily Reports */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Logged Daily Reports ({job.dailyReports.length})
        </h4>
        {job.dailyReports.length === 0 ? (
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-500">
            No daily progress reports recorded for this job yet. Submit your shift report above.
          </div>
        ) : (
          <div className="space-y-3">
            {job.dailyReports.map((report) => (
              <div key={report.id} className="p-4 border border-zinc-200 rounded-xl bg-white space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                  <div className="flex items-center space-x-2 font-medium text-zinc-900">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{report.date}</span>
                  </div>
                  <span className="font-semibold text-zinc-700 text-[11px] bg-zinc-100 px-2 py-0.5 rounded">
                    By {report.technicianName}
                  </span>
                </div>
                <p className="text-xs text-zinc-800 font-semibold leading-relaxed">{report.workDone}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onNextStep}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
        >
          <span>Continue to After Photos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
