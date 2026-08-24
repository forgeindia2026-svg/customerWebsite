import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode, markNotificationAsRead, markAllNotificationsAsRead } from '../redux/dashboardSlice';
import { FiSearch, FiBell, FiSun, FiMoon, FiMenu, FiLogOut, FiSettings, FiUser, FiCheck } from 'react-icons/fi';
import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function Header({ toggleMobileSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const darkMode = useSelector(state => state.dashboard?.darkMode);
  const notifications = useSelector(state => state.dashboard?.notifications) || [];
  const settings = useSelector(state => state.dashboard?.settings) || {};

  const unreadNotifications = (notifications || []).filter(n => !n?.read);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const segment = path.split('/')[1];
    return segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleLogout = () => {
    localStorage.removeItem('internal_token');
    localStorage.removeItem('internal_role');
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
      {/* Left section: Mobile Logo & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile View Brand Logo + Company Name */}
        <div className="flex items-center gap-2.5 md:hidden">
          <img src="/logo.png" alt="SK Technology" className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 shadow-2xs" />
          <div>
            <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-tight">SK TECHNOLOGY</h2>
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest leading-tight">CCTV Solutions</p>
          </div>
        </div>

        {/* Desktop View Page Title */}
        <div className="hidden md:block">
          <h2 className="ty-page-title">{getPageTitle()}</h2>
          <p className="ty-muted mt-0.5">Welcome back, {settings.contactPerson || 'Admin'}!</p>
        </div>
      </div>

      {/* Center: Search Bar (Dashboard Only) */}
      {location.pathname === '/' && (
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <FiSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Search transactions, service logs, products..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary dark:focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

      {/* Right section: Quick actions, notifications, dark/light, admin profile */}
      <div className="flex items-center gap-3">

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* Notification center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <FiBell size={18} />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">System Alerts</span>
                {unreadNotifications.length > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No alerts today</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex items-start gap-2.5 ${!notif.read ? 'bg-primary/5 dark:bg-primary/5' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</h4>
                          <span className="text-[9px] text-slate-400">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{notif.message}</p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => dispatch(markNotificationAsRead(notif.id))}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"
                          title="Mark read"
                        >
                          <FiCheck size={10} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link 
                  to="/admin/notifications" 
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  View all alerts
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-colors focus:outline-none"
          >
            {/* Mock profile photo */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop"
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover object-center ring-2 ring-primary/20"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 pr-1">{settings.contactPerson || 'Admin'}</span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{settings.contactPerson || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{settings.email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <FiUser size={14} className="text-slate-400" />
                  <span>Edit Profile</span>
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <FiSettings size={14} className="text-slate-400" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <FiLogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle Button (Moved to Right Side) */}
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-xl md:hidden bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Toggle Navigation Menu"
        >
          <FiMenu size={20} />
        </button>
      </div>
    </header>
  );
}
