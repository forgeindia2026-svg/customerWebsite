import React from 'react';
import type { JobStatus, Priority } from '../types/job';

interface StatusBadgeProps {
  status?: JobStatus;
  priority?: Priority;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  if (priority) {
    let priorityConfig = {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold',
      label: priority,
    };

    switch (priority) {
      case 'URGENT':
        priorityConfig = { bg: 'bg-rose-500 text-white border-rose-600 font-black shadow-sm', label: '🔥 URGENT' };
        break;
      case 'HIGH':
        priorityConfig = { bg: 'bg-amber-500 text-white border-amber-600 font-black shadow-sm', label: '⚡ HIGH' };
        break;
      case 'MEDIUM':
        priorityConfig = { bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', label: 'MEDIUM' };
        break;
      case 'LOW':
        priorityConfig = { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold', label: 'LOW' };
        break;
    }

    return (
      <span className={`inline-flex items-center rounded-lg border font-sans tracking-wide uppercase shadow-xs ${sizeClasses} ${priorityConfig.bg}`}>
        {priorityConfig.label}
      </span>
    );
  }

  if (status) {
    let statusConfig = {
      bg: 'bg-slate-100 text-slate-800 border-slate-200 font-bold',
      dot: 'bg-slate-500',
      label: status.replace(/_/g, ' '),
    };

    switch (status) {
      case 'ASSIGNED':
        statusConfig = { bg: 'bg-purple-50 text-purple-800 border-purple-200 font-extrabold', dot: 'bg-purple-500', label: 'Pool Available' };
        break;
      case 'PENDING':
        statusConfig = { bg: 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold', dot: 'bg-amber-500', label: 'Pending Start' };
        break;
      case 'ACCEPTED':
        statusConfig = { bg: 'bg-sky-100 text-sky-900 border-sky-300 font-extrabold', dot: 'bg-sky-500', label: 'Accepted' };
        break;
      case 'IN_PROGRESS':
      case 'WORKING':
      case 'BEFORE_PHOTOS_DONE':
        statusConfig = { bg: 'bg-blue-600 text-white border-blue-700 font-black shadow-xs', dot: 'bg-emerald-400', label: 'In Progress' };
        break;
      case 'INSPECTED':
        statusConfig = { bg: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold', dot: 'bg-emerald-600', label: 'Inspected' };
        break;
      case 'DAILY_REPORTED':
        statusConfig = { bg: 'bg-indigo-600 text-white border-indigo-700 font-black shadow-xs', dot: 'bg-indigo-200', label: 'Report Logged' };
        break;
      case 'AFTER_PHOTOS_DONE':
        statusConfig = { bg: 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs', dot: 'bg-white', label: 'After Photos Ready' };
        break;
      case 'COMPLETED':
        statusConfig = { bg: 'bg-emerald-500 text-white border-emerald-600 font-black shadow-xs', dot: 'bg-emerald-100', label: 'Completed' };
        break;
      case 'ON_HOLD':
        statusConfig = { bg: 'bg-amber-500 text-white border-amber-600 font-black shadow-xs', dot: 'bg-white', label: 'On Hold' };
        break;
      case 'CANCELLED':
        statusConfig = { bg: 'bg-rose-500 text-white border-rose-600 font-black shadow-xs', dot: 'bg-white', label: 'Cancelled' };
        break;
    }

    return (
      <span className={`inline-flex items-center space-x-1.5 rounded-lg border font-sans tracking-wide uppercase shadow-xs ${sizeClasses} ${statusConfig.bg}`}>
        <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
        <span>{statusConfig.label}</span>
      </span>
    );
  }

  return null;
};
