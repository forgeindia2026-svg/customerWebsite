import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  FiActivity,
  FiLogOut
} from 'react-icons/fi';
import { useSelector } from 'react-redux';

// Brand logo rendering with Gold accent like Image 1
const BrandLogo = () => (
  <div className="w-9 h-9 bg-[#FDBA2F] text-[#07152D] rounded-xl flex items-center justify-center flex-shrink-0 font-black text-base shadow-sm">
    SK
  </div>
);

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const notifications = useSelector(state => state.dashboard?.notifications) || [];
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem('internal_token');
    localStorage.removeItem('internal_role');
    window.location.href = '/login';
  };

  const navSections = [
    {
      title: null,
      items: [
        { name: 'Dashboard', path: '/admin', icon: FiGrid },
        { name: 'Live Workstation', path: '/admin/workstation', icon: FiActivity },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Orders', path: '/admin/orders', icon: FiShoppingCart },
        { name: 'Service Requests', path: '/admin/service-requests', icon: FiTool },
        { name: 'Reports', path: '/admin/reports', icon: FiBarChart2 },
        { name: 'QR Scanner', path: '/admin/scanner', icon: FiImage },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Customers', path: '/admin/customers', icon: FiUsers },
        { name: 'Products', path: '/admin/products', icon: FiBox },
        { name: 'Payments', path: '/admin/payments', icon: FiCreditCard },
        { name: 'Queries', path: '/admin/queries', icon: FiHelpCircle },
        { name: 'Announcements', path: '/admin/announcements', icon: FiVolume2 },
        { name: 'Banners', path: '/admin/banners', icon: FiImage },
        { name: 'Notifications', path: '/admin/notifications', icon: FiBell, badgeCount: unreadCount },
      ]
    }
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#07152D] text-white border-r border-[#0E2246] transition-all duration-300 shadow-xl ${
        isOpen ? 'w-60' : 'w-16'
      }`}
    >
      {/* Brand Header block */}
      <div className="h-18 px-4 flex items-center gap-3 border-b border-[#0F2347] bg-[#07152D]">
        <BrandLogo />
        {isOpen && (
          <div className="transition-opacity duration-300 text-left flex-1 min-w-0">
            <h1 className="font-black text-white text-sm tracking-wide truncate">SK TECHNOLOGY</h1>
            <p className="text-[10px] text-[#FDBA2F] font-bold uppercase tracking-widest truncate">ADMIN PORTAL</p>
          </div>
        )}
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto no-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && isOpen && (
              <div className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider px-3 pt-2 pb-1">
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-sans text-xs transition-all duration-200 group ${
                    isActive 
                      ? 'bg-[#FDBA2F] text-[#07152D] font-bold shadow-md' 
                      : 'text-[#94A3B8] hover:bg-white/5 hover:text-white font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      className={`flex-shrink-0 w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? 'text-[#07152D] stroke-[2.5]' : 'text-[#8EA5C8] group-hover:text-white'
                      }`}
                    />
                    {isOpen && (
                      <span className="flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-300">
                        {item.name}
                      </span>
                    )}
                    {isOpen && item.badgeCount > 0 && (
                      <span className={`flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold rounded-full transition-transform ${
                        isActive ? 'bg-[#07152D] text-[#FDBA2F]' : 'bg-red-500 text-white'
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
          </div>
        ))}
      </nav>
 
      {/* Bottom Profile & Logout Section */}
      <div className="p-3 border-t border-[#0F2347] bg-[#051124] space-y-2.5">
        {isOpen && (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#13284C] border border-[#1E3A6B] flex items-center justify-center text-[#FDBA2F] font-bold text-xs shrink-0">
              AD
            </div>
            <div className="truncate text-left flex-1 min-w-0">
              <h4 className="font-bold text-xs text-white leading-tight truncate">Admin</h4>
              <p className="text-[10px] text-[#8EA5C8] font-medium truncate">Super Administrator</p>
            </div>
          </div>
        )}

        {/* Soft Pastel Red Pill Logout Button (Exactly like Image 1) */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#FEE2E2] hover:bg-[#FCDAD7] text-[#EF4444] font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer ${
            !isOpen ? 'px-2' : ''
          }`}
          title="Logout from Admin Portal"
        >
          <FiLogOut className="w-4 h-4 shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
