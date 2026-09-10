import React, { useState } from 'react';
import type { NotificationItem } from '../../types/job';
import { 
  Bell, 
  AlertTriangle, 
  Briefcase, 
  CheckCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface NotificationsModuleProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
}

export const NotificationsModule: React.FC<NotificationsModuleProps> = ({
  notifications,
  onMarkRead,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT' | 'DISPATCH'>('ALL');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.type === 'URGENT').length;
  const dispatchCount = notifications.filter((n) => n.type === 'ASSIGNMENT').length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'UNREAD') return !item.read;
    if (filter === 'URGENT') return item.type === 'URGENT';
    if (filter === 'DISPATCH') return item.type === 'ASSIGNMENT';
    return true;
  });

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* Rich High-Performance Notification Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Unread Alerts */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">UNREAD ALERTS</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 flex items-center justify-center text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{unreadCount}</p>
            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
              unreadCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {unreadCount > 0 ? 'Action Needed' : 'All Clear ✓'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-zinc-500 mt-1.5">Real-time Field Telemetry</p>
          <div className="w-full bg-zinc-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(unreadCount * 25, 100)}%` }} />
          </div>
        </div>

        {/* 2. Dispatch Assignments */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">DISPATCH ASSIGNMENTS</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{dispatchCount}</p>
            <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
              Work Orders
            </span>
          </div>
          <p className="text-[11px] font-semibold text-blue-600 mt-1.5">Auto-Dispatch Engine</p>
          <div className="w-full bg-blue-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: dispatchCount > 0 ? '100%' : '0%' }} />
          </div>
        </div>

        {/* 3. Urgent Admin Alerts */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">URGENT ADMIN ALERTS</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-200 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{urgentCount}</p>
            <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-mono">
              High Priority
            </span>
          </div>
          <p className="text-[11px] font-semibold text-red-600 mt-1.5">Central Control Direct</p>
          <div className="w-full bg-red-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(urgentCount * 33, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Notification Stream Feed Container */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold">
                REAL-TIME BROADCAST STREAM
              </span>
              <span className="text-xs text-zinc-400 font-mono">Channel #SK-TECH-NOTIF</span>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mt-1 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>System & Dispatch Control Feed</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200/80">
            {(['ALL', 'UNREAD', 'URGENT', 'DISPATCH'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  filter === t
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Stream Cards */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 bg-white border border-zinc-200 rounded-2xl text-center space-y-3 shadow-2xs">
              <Bell className="w-10 h-10 text-zinc-300 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-900">No Notifications</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {filter === 'UNREAD' ? 'You have read all your unread system alerts and dispatch notifications.' : 'No notification items match your selected filter.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkRead(item.id)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 ${
                  item.read
                    ? 'border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/60 opacity-85'
                    : 'border-blue-300 bg-blue-50/20 shadow-xs hover:shadow-md hover:-translate-y-0.5 ring-1 ring-blue-500/10'
                }`}
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                    item.type === 'URGENT'
                      ? 'bg-red-500 text-white'
                      : item.type === 'ASSIGNMENT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {item.type === 'URGENT' && <AlertTriangle className="w-5 h-5" />}
                    {item.type === 'ASSIGNMENT' && <Briefcase className="w-5 h-5" />}
                    {item.type === 'SYSTEM' && <ShieldCheck className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center space-x-2">
                      <h4 className="font-bold text-zinc-900 text-sm">{item.title}</h4>
                      <span className="text-xs text-zinc-400 font-mono">• {item.timestamp}</span>
                      {!item.read && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold rounded-full">
                          NEW UNREAD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-normal">{item.message}</p>
                  </div>
                </div>

                {!item.read && (
                  <div className="flex items-center space-x-1 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0 self-center">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark Read</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
