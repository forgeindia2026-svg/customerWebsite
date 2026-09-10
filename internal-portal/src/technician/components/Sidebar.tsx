import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  Clock,
  FileText,
  Bell,
  BarChart3,
  History,
  HelpCircle,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  QrCode,
  Trophy
} from 'lucide-react';
import type { TechnicianProfile } from '../types/job';
import { SKLogoIcon } from './SKLogoIcon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentTechnician: TechnicianProfile | null;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  jobsCount?: number;
  notificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentTechnician,
  onLogout,
  isOpen = false,
  onClose,
  jobsCount = 0,
  notificationsCount = 0
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600', iconBg: 'bg-blue-50 border-blue-200/70' },
    { id: 'assigned_jobs', label: 'Assigned Jobs', icon: Briefcase, badge: jobsCount > 0 ? String(jobsCount) : undefined, color: 'text-indigo-600', iconBg: 'bg-indigo-50 border-indigo-200/70' },
    { id: 'attendance_log', label: 'Attendance Log', icon: Clock, color: 'text-amber-600', iconBg: 'bg-amber-50 border-amber-200/70' },
    { id: 'reports', label: 'Daily Reports', icon: FileText, color: 'text-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200/70' },
    { id: 'history', label: 'Job History', icon: History, color: 'text-purple-600', iconBg: 'bg-purple-50 border-purple-200/70' },
    { id: 'query', label: 'Helpdesk & Queries', icon: HelpCircle, color: 'text-rose-600', iconBg: 'bg-rose-50 border-rose-200/70' },
    { id: 'scanner', label: 'QR Scanner', icon: QrCode, color: 'text-teal-600', iconBg: 'bg-teal-50 border-teal-200/70' },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3, color: 'text-violet-600', iconBg: 'bg-violet-50 border-violet-200/70' },
    { id: 'leaderboard', label: 'Leadership Board', icon: Trophy, color: 'text-amber-500', iconBg: 'bg-amber-50 border-amber-200/70', badge: 'TOP' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationsCount > 0 ? String(notificationsCount) : undefined, color: 'text-amber-500', iconBg: 'bg-amber-50 border-amber-200/70' },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: User, color: 'text-indigo-600', iconBg: 'bg-indigo-50 border-indigo-200/70' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-600', iconBg: 'bg-slate-100 border-slate-200/70' },
  ];

  const initials = currentTechnician?.name
    ? currentTechnician.name.trim().split(/\s+/).map((n) => n[0]).filter(Boolean).join('').toUpperCase() || 'T'
    : (localStorage.getItem('user_name')?.trim()?.[0]?.toUpperCase() || 'T');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`w-64 flex-shrink-0 h-screen lg:sticky lg:top-0 lg:left-0 bg-gradient-to-b from-[#EBF2FC] via-[#F2F6FD] to-[#E5EFFB] text-slate-800 flex flex-col justify-between border-r border-blue-200/80 select-none overflow-y-auto z-40 shadow-[2px_0_12px_rgba(37,99,235,0.05)] ${
        isOpen ? 'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:translate-x-0' : 'max-lg:-translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0'
      }`}>
        <div className="space-y-3">
          {/* Brand Header with Glass Frost Card Style */}
          <div className="p-4 border-b border-blue-200/60 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-200/80 transform hover:scale-105 transition-transform duration-200 p-1">
                <SKLogoIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center space-x-1.5">
                  <span>SK Technology</span>
                </h1>
                <p className="text-[10px] text-blue-600 font-black tracking-wider uppercase">CCTV SOLUTIONS</p>
              </div>
            </div>

            {/* Mobile Close X Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="px-3 space-y-4">
            <div className="px-3 text-[10px] font-black tracking-widest text-blue-900/60 uppercase">
              Workforce Portal
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all cursor-pointer group relative rounded-xl ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 font-bold'
                        : 'text-slate-700 hover:bg-white/80 hover:text-slate-950 font-semibold hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : `bg-white border ${item.iconBg} ${item.color} group-hover:scale-105 shadow-2xs`
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="tracking-tight truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-full ${
                          isActive 
                            ? 'bg-white text-blue-700 shadow-xs' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200/60'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Bottom Section with Account & Operations Menu */}
        <div className="p-3.5 border-t border-blue-200/60 space-y-2.5 bg-white/40 backdrop-blur-xs">
          <div className="px-3 text-[10px] font-black tracking-widest text-blue-900/60 uppercase">
            ACCOUNT & OPERATIONS
          </div>

          <div className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 font-bold'
                      : 'text-slate-700 hover:bg-white/80 hover:text-slate-950 font-semibold'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : `bg-white border ${item.iconBg} ${item.color}`
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Technician Profile Card Pill */}
          <div className="p-2.5 rounded-2xl bg-white/90 border border-blue-200/80 flex items-center justify-between shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="text-left leading-tight truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{currentTechnician?.name || localStorage.getItem('user_name') || 'Technician'}</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-blue-700 font-mono font-bold truncate">{currentTechnician?.badgeNumber || 'SK-TECH-9042'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
