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
  const notifications = useSelector(state => state.dashboard?.notifications) || [];
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: FiGrid },
    { name: 'Live Workstation', path: '/admin/workstation', icon: FiActivity },
    { name: 'Customers', path: '/admin/customers', icon: FiUsers },
    { name: 'QR Scanner', path: '/admin/scanner', icon: FiImage },
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
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white text-slate-800 border-r border-slate-200 transition-all duration-300 shadow-xs ${
        isOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Brand Header block */}
      <div className="h-16 px-3 flex items-center gap-3 border-b border-slate-100 bg-white">
        <BrandLogo />
        {isOpen && (
          <div className="transition-opacity duration-300 text-left flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight truncate">SK Technology</h1>
            <p className="text-[11px] text-blue-600 font-bold tracking-wide truncate">Your Safety Is Our Priority</p>
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
              `flex items-center gap-3 px-2.5 py-2.5 rounded-xl font-sans text-xs transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-200/80' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={`flex-shrink-0 w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {isOpen && (
                  <span className="flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-300">
                    {item.name}
                  </span>
                )}
                {isOpen && item.badgeCount > 0 && (
                  <span className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full group-hover:scale-105 transition-transform ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
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
 
      {/* Bottom Profile Section */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200 text-blue-700 font-bold text-xs">
              AD
            </div>
            {isOpen && (
              <div className="truncate text-left">
                <h4 className="font-bold text-xs text-slate-900 leading-tight">Admin</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">Super Administrator</p>
              </div>
            )}
          </div>
          {isOpen && <FiChevronDown className="text-slate-400 w-4 h-4" />}
        </div>
      </div>
    </aside>
  );
}
