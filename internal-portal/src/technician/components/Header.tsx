import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ShieldCheck, Menu, AlertTriangle, Briefcase, ChevronRight } from 'lucide-react';
import type { TechnicianProfile, NotificationItem } from '../types/job';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentTechnician: TechnicianProfile | null;
  onToggleSidebar?: () => void;
  notifications?: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onNavigateToNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  onSearchChange,
  currentTechnician,
  onToggleSidebar,
  notifications = [],
  onMarkRead,
  onNavigateToNotifications
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const initials = currentTechnician?.name
    ? currentTechnician.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : (localStorage.getItem('user_name') ? localStorage.getItem('user_name')[0].toUpperCase() : 'T');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="py-3 sm:py-3.5 border-b border-slate-800/90 bg-[#0F172A] text-white px-3.5 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand Logo & Quick Search */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 flex-1 max-w-lg">
        {/* 📱 Mobile Brand Title & Logo (Mobile View Only) */}
        <div className="flex items-center space-x-2.5 lg:hidden shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-rose-900/30">
            SK
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-black text-white tracking-tight">SK TECHNOLOGY</span>
            <span className="text-[9px] font-bold text-rose-400 tracking-wider mt-0.5">FIELD PORTAL</span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search job code, customer name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 pl-2">
        {/* Verification Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-xs font-semibold text-emerald-400 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SK Certified Field Tech</span>
        </div>

        {/* Notifications Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer border border-slate-800 bg-slate-900/50"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-mono text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-[#0F172A] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-white">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Real-Time Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-mono font-black rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {onNavigateToNotifications && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToNotifications();
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No recent notifications
                  </div>
                ) : (
                  recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (onMarkRead && !notif.read) onMarkRead(notif.id);
                      }}
                      className={`p-3.5 hover:bg-slate-800/80 transition-colors cursor-pointer flex items-start space-x-3 ${
                        !notif.read ? 'bg-slate-800/40' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs ${
                        notif.type === 'URGENT' ? 'bg-rose-500' : notif.type === 'ASSIGNMENT' ? 'bg-slate-800 border border-slate-700' : 'bg-emerald-600'
                      }`}>
                        {notif.type === 'URGENT' && <AlertTriangle className="w-4 h-4" />}
                        {notif.type === 'ASSIGNMENT' && <Briefcase className="w-4 h-4" />}
                        {notif.type === 'SYSTEM' && <ShieldCheck className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{notif.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 📱 Right Side Hamburger Menu Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-200 hover:text-white bg-slate-800/90 border border-slate-700/80 hover:bg-slate-700 transition-all cursor-pointer shrink-0 shadow-xs"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};
