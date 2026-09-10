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
  QrCode
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assigned_jobs', label: 'Assigned Jobs', icon: Briefcase, badge: jobsCount > 0 ? String(jobsCount) : undefined },
    { id: 'attendance_log', label: 'Attendance Log', icon: Clock },
    { id: 'reports', label: 'Daily Reports', icon: FileText },
    { id: 'history', label: 'Job History', icon: History },
    { id: 'query', label: 'Helpdesk & Queries', icon: HelpCircle },
    { id: 'scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationsCount > 0 ? String(notificationsCount) : undefined },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = currentTechnician?.name
    ? currentTechnician.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : (localStorage.getItem('user_name') ? localStorage.getItem('user_name')[0].toUpperCase() : 'T');

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

      <aside className={`w-64 flex-shrink-0 h-screen lg:sticky lg:top-0 lg:left-0 bg-white text-slate-800 flex flex-col justify-between border-r border-slate-200 select-none overflow-y-auto z-40 ${
        isOpen ? 'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:translate-x-0' : 'max-lg:-translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:left-0'
      }`}>
        <div className="space-y-3">
          {/* Brand Header with Clean White Style */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xs border border-slate-200 transform hover:scale-105 transition-transform duration-200 p-1">
                <SKLogoIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-slate-900 flex items-center space-x-1.5">
                  <span>SK Technology</span>
                </h1>
                <p className="text-[10px] text-blue-600 font-bold tracking-wider uppercase">CCTV SOLUTIONS</p>
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
          <nav className="px-3.5 space-y-4">
            <div className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Workforce Portal
            </div>

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer group relative overflow-hidden ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/80 rounded-xl font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
                    }`}
                  >
                    {/* Left Blue Active Pill Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      <span className="tracking-wide">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
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
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/40">
          <div className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Technician Profile Card Pill */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="text-left leading-tight truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{currentTechnician?.name || localStorage.getItem('user_name') || 'Technician'}</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] text-blue-600 font-mono font-semibold truncate">{currentTechnician?.badgeNumber || 'SK-TECH-9042'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
