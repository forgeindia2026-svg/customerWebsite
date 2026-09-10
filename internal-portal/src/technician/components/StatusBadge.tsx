import React from 'react';
import type { JobStatus, Priority } from '../types/job';

interface StatusBadgeProps {
  status?: JobStatus;
  priority?: Priority;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (priority) {
    let priorityConfig = {
      bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      label: priority,
    };

    switch (priority) {
      case 'URGENT':
        priorityConfig = { bg: 'bg-red-50 text-red-700 border-red-200 font-semibold', label: 'URGENT' };
        break;
      case 'HIGH':
        priorityConfig = { bg: 'bg-amber-50 text-amber-800 border-amber-200 font-medium', label: 'HIGH' };
        break;
      case 'MEDIUM':
        priorityConfig = { bg: 'bg-zinc-100 text-zinc-800 border-zinc-200', label: 'MEDIUM' };
        break;
      case 'LOW':
        priorityConfig = { bg: 'bg-zinc-50 text-zinc-600 border-zinc-200', label: 'LOW' };
        break;
    }

    return (
      <span className={`inline-flex items-center rounded-md border font-mono tracking-wide ${sizeClasses} ${priorityConfig.bg}`}>
        {priorityConfig.label}
      </span>
    );
  }

  if (status) {
    let statusConfig = {
      bg: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      dot: 'bg-zinc-500',
      label: status.replace(/_/g, ' '),
    };

    switch (status) {
      case 'ASSIGNED':
        statusConfig = { bg: 'bg-zinc-100 text-zinc-800 border-zinc-200', dot: 'bg-amber-500', label: 'Pool Available' };
        break;
      case 'PENDING':
        statusConfig = { bg: 'bg-amber-50 text-amber-900 border-amber-200', dot: 'bg-amber-500', label: 'Pending Start' };
        break;
      case 'ACCEPTED':
        statusConfig = { bg: 'bg-sky-50 text-sky-800 border-sky-200 font-semibold', dot: 'bg-sky-500', label: 'Accepted' };
        break;
      case 'IN_PROGRESS':
      case 'WORKING':
      case 'BEFORE_PHOTOS_DONE':
        statusConfig = { bg: 'bg-blue-50 text-blue-700 border-blue-200/90 font-bold', dot: 'bg-blue-500', label: 'In Progress' };
        break;
      case 'INSPECTED':
        statusConfig = { bg: 'bg-emerald-50 text-emerald-900 border-emerald-200', dot: 'bg-emerald-600', label: 'Inspected' };
        break;
      case 'DAILY_REPORTED':
        statusConfig = { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500', label: 'Report Logged' };
        break;
      case 'AFTER_PHOTOS_DONE':
        statusConfig = { bg: 'bg-emerald-100 text-emerald-950 border-emerald-300', dot: 'bg-emerald-600', label: 'After Photos Ready' };
        break;
      case 'COMPLETED':
        statusConfig = { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold', dot: 'bg-emerald-500', label: 'Completed' };
        break;
      case 'ON_HOLD':
        statusConfig = { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', label: 'On Hold' };
        break;
      case 'CANCELLED':
        statusConfig = { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Cancelled' };
        break;
    }

    return (
      <span className={`inline-flex items-center space-x-1.5 rounded-md border font-medium ${sizeClasses} ${statusConfig.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
        <span>{statusConfig.label}</span>
      </span>
    );
  }

  return null;
};
