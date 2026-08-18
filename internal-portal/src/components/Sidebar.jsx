import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, 
  FiShoppingCart, 
  FiUsers, 
  FiTool, 
  FiBriefcase, 
  FiBox, 
  FiPackage, 
  FiCreditCard, 
  FiBarChart2, 
  FiBell, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight,
  FiChevronDown,
  FiHelpCircle,
  FiVolume2,
  FiImage,
  FiAward,
  FiActivity
} from 'react-icons/fi';
import { useSelector } from 'react-redux';

// Brand logo rendering public/logo.png
const BrandLogo = () => (
  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 p-0.5 overflow-hidden shadow-sm">
    <img 
      src="/logo.png" 
      alt="SK Technology Logo" 
      className="w-full h-full object-contain rounded-lg"
    />
  </div>
);

export default function Sidebar({ isOpen, toggleSidebar }) {
  const notifications = useSelector(state => state.dashboard.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: FiGrid },
    { name: 'Live Workstation', path: '/admin/workstation', icon: FiActivity },
    { name: 'Projects', path: '/admin/projects', icon: FiBriefcase },
    { name: 'Reports', path: '/admin/reports', icon: FiBarChart2 },
    { name: 'Announcements', path: '/admin/announcements', icon: FiVolume2 },
    { name: 'Service Requests', path: '/admin/service-requests', icon: FiTool },
    { name: 'Queries', path: '/admin/queries', icon: FiHelpCircle },
    { name: 'Products', path: '/admin/products', icon: FiBox },
    { name: 'Banners', path: '/admin/banners', icon: FiImage },
    { name: 'Payments', path: '/admin/payments', icon: FiCreditCard },
    { name: 'Notifications', path: '/admin/notifications', icon: FiBell, badgeCount: unreadCount },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-black text-white border-r border-slate-900 transition-all duration-300 ${
        isOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Brand Header block matching OneUI style (Now solid black) */}
      <div className="h-16 px-3 flex items-center gap-3 border-b border-slate-900">
        <BrandLogo />
        {isOpen && (
          <div className="transition-opacity duration-300 text-left flex-1 min-w-0">
            <h1 className="font-semibold text-white text-sm leading-tight tracking-tight truncate">SK Technology</h1>
            <p className="text-xs text-blue-400 font-medium tracking-wide truncate">CCTV Solutions</p>
          </div>
        )}
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => 
              `flex items-center gap-3 px-2.5 py-2.5 rounded-xl font-sans font-medium text-xs transition-all duration-200 group ${
                isActive 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-white hover:bg-slate-900/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={`flex-shrink-0 w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-black' : 'text-white'
                  }`}
                />
                {isOpen && (
                  <span className="flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-300">
                    {item.name}
                  </span>
                )}
                {isOpen && item.badgeCount > 0 && (
                  <span className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full group-hover:scale-105 transition-transform ${
                    isActive ? 'bg-black text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.badgeCount}
                  </span>
                )}
                {!isOpen && item.badgeCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
 
      {/* Bottom Profile Section matching OneUI sidebar style (Solid black background) */}
      <div className="p-3 border-t border-slate-900 bg-black/40">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800">
              <svg className="w-5 h-5 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {isOpen && (
              <div className="truncate text-left">
                <h4 className="font-medium text-xs text-slate-200 leading-tight">Admin</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5 truncate">Super Administrator</p>
              </div>
            )}
          </div>
          {isOpen && <FiChevronDown className="text-slate-500 w-4 h-4" />}
        </div>
      </div>
    </aside>
  );
}
