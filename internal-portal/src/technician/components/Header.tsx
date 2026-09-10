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
    <header className="py-3 sm:py-3.5 border-b border-blue-700 bg-[#2874F0] text-white px-3.5 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand Logo & Quick Search */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 flex-1 max-w-lg">
        {/* 📱 Mobile Brand Title & Logo (Mobile View Only) */}
        <div className="flex items-center space-x-2.5 lg:hidden shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white text-[#2874F0] flex items-center justify-center font-black text-xs shadow-md">
            SK
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-black text-white tracking-tight">SK TECHNOLOGY</span>
            <span className="text-[9px] font-bold text-amber-300 tracking-wider mt-0.5">FIELD PORTAL</span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-blue-200" />
          <input
            type="text"
            placeholder="Search job code, customer name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/15 text-white placeholder-blue-100 border border-white/25 rounded-xl text-xs focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 pl-2">
        {/* Verification Status Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white/15 border border-white/25 rounded-full text-xs font-bold text-white shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>SK Certified Field Tech</span>
        </div>

        {/* Notifications Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 rounded-xl text-white hover:bg-white/15 transition-all cursor-pointer border border-white/20 bg-white/10 shadow-xs"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-400 text-slate-900 font-mono text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-[#2874F0] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-800 animate-fade-in">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Real-Time Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-mono font-black rounded-full">
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
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
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
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs ${
                        notif.type === 'URGENT' ? 'bg-rose-500' : notif.type === 'ASSIGNMENT' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {notif.type === 'URGENT' && <AlertTriangle className="w-4 h-4" />}
                        {notif.type === 'ASSIGNMENT' && <Briefcase className="w-4 h-4" />}
                        {notif.type === 'SYSTEM' && <ShieldCheck className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{notif.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">{notif.message}</p>
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
            className="lg:hidden p-2 rounded-xl text-white hover:bg-white/15 border border-white/20 bg-white/10 transition-all cursor-pointer shrink-0 shadow-xs"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};
