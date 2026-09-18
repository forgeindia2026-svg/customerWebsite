import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode, markNotificationAsRead, markAllNotificationsAsRead, updateSettings } from '../redux/dashboardSlice';
import { FiSearch, FiBell, FiSun, FiMoon, FiMenu, FiLogOut, FiSettings, FiUser, FiCheck, FiChevronDown, FiX, FiArrowRight, FiTv, FiCamera, FiUpload } from 'react-icons/fi';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageUtils';

export default function Header({ toggleMobileSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const darkMode = useSelector(state => state.dashboard?.darkMode);
  const notifications = useSelector(state => state.dashboard?.notifications) || [];
  const settings = useSelector(state => state.dashboard?.settings) || {};
  const orders = useSelector(state => state.dashboard?.orders) || [];
  const technicians = useSelector(state => state.dashboard?.technicians) || [];

  const unreadNotifications = (notifications || []).filter(n => !n?.read);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Date Filter State
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(
    () => localStorage.getItem('admin_date_range') || 'This Month'
  );
  const dateMenuRef = useRef(null);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setShowDateMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSelectDateRange = (range) => {
    setSelectedDateRange(range);
    localStorage.setItem('admin_date_range', range);
    setShowDateMenu(false);
    window.dispatchEvent(new CustomEvent('admin_date_filter_change', { detail: range }));
  };

  const trimmedSearch = searchQuery.trim().toLowerCase();
  const searchResults = trimmedSearch ? {
    orders: orders.filter(o => 
      (o.id && String(o.id).toLowerCase().includes(trimmedSearch)) ||
      (o.customer && o.customer.toLowerCase().includes(trimmedSearch)) ||
      (o.phone && String(o.phone).includes(trimmedSearch))
    ).slice(0, 3),
    technicians: technicians.filter(t => 
      (t.name && t.name.toLowerCase().includes(trimmedSearch)) ||
      (t.phone && String(t.phone).includes(trimmedSearch))
    ).slice(0, 3),
    pages: [
      { name: 'Orders Management', path: '/admin/orders' },
      { name: 'Technicians Management', path: '/admin/technicians' },
      { name: 'Dashboard Overview', path: '/admin/dashboard' },
      { name: 'Workstation Tracking', path: '/admin/workstation' },
      { name: 'Payments & Revenue', path: '/admin/payments' },
      { name: 'System Settings', path: '/admin/settings' },
      { name: 'Inventory & Stock', path: '/admin/inventory' },
    ].filter(p => p.name.toLowerCase().includes(trimmedSearch)).slice(0, 3)
  } : null;

  const totalResultsCount = searchResults 
    ? searchResults.orders.length + searchResults.technicians.length + searchResults.pages.length 
    : 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Determine page title
  const getPageTitle = () => {
    const path = location.pathname;
    const currentRole = (localStorage.getItem('internal_role') || '').toUpperCase();
    if (path === '/' || path === '/admin' || path === '/admin/dashboard') {
      return currentRole === 'HR' ? 'HR Operations Dashboard' : 'Operations Dashboard';
    }
    const parts = path.replace(/^\//, '').split('/');
    const segment = parts[0] === 'admin' ? parts[1] || 'Dashboard' : parts[0];
    return segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('internal_user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = (localStorage.getItem('internal_role') || user?.role || 'ADMIN').toUpperCase();
  const adminName = localStorage.getItem('user_name') || user?.name || (userRole === 'HR' ? 'HR Manager' : (settings?.contactPerson && settings.contactPerson !== 'Ramesh Kumar' ? settings.contactPerson : 'Administrator'));
  const adminAvatar = user?.avatar || (user?.email === settings?.email ? settings?.profilePhoto : '') || localStorage.getItem('admin_avatar') || '';
  const headerFileInputRef = useRef(null);

  const handleHeaderPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await compressImage(file, 400, 400, 0.85);
      dispatch(updateSettings({ profilePhoto: base64Image }));
      localStorage.setItem('admin_avatar', base64Image);
      try {
        const u = JSON.parse(localStorage.getItem('internal_user') || '{}');
        u.avatar = base64Image;
        localStorage.setItem('internal_user', JSON.stringify(u));
      } catch (err) {}

      if (settings?.email || user?.email) {
        fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: settings?.email || user?.email || 'admin@sktechnology.in',
            avatar: base64Image
          })
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to upload profile photo from header', err);
    }
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
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 sm:h-20 px-3 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
      {/* Left section: Mobile Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile View Brand Logo + Company Name */}
        <div className="flex items-center gap-2 md:hidden min-w-0">
          <img src="/logo.png" alt="SK Technology" className="w-7 h-7 object-contain rounded-lg bg-white p-0.5 shadow-2xs shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate">SK TECHNOLOGY</h2>
          </div>
        </div>

      {/* Desktop View Page Title (Matching Image 2 clean style) */}
      <div className="hidden md:flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-white">
          {getPageTitle()}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-400 mt-0.5">
          Welcome back, {adminName}!
        </p>
      </div>
      </div>

      {/* Right section: Quick actions, notifications, dark/light, admin profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Date Filter Dropdown */}
        <div className="relative" ref={dateMenuRef}>
          <button 
            type="button"
            onClick={() => setShowDateMenu(!showDateMenu)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span>📅 {selectedDateRange}</span>
            <FiChevronDown size={12} className={`transition-transform duration-200 ${showDateMenu ? 'rotate-180' : ''}`} />
          </button>

          {showDateMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Filter Date Range
              </div>
              {['Today', 'This Week', 'This Month', 'Last Month', 'This Year', 'All Time'].map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => handleSelectDateRange(range)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                    selectedDateRange === range 
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{range}</span>
                  {selectedDateRange === range && <FiCheck size={13} className="text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Quick Search (Desktop / Tablet Only) */}
        <div className="hidden sm:block relative" ref={searchContainerRef}>
          {isSearchOpen ? (
            <div className="flex items-center animate-in fade-in zoom-in-95 duration-150">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <FiSearch size={14} className="absolute left-3 text-blue-500 pointer-events-none" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, techs, pages..."
                  className="w-48 sm:w-72 pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-xl shadow-lg text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 font-medium"
                />
                <button 
                  type="button"
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Close search"
                >
                  <FiX size={14} />
                </button>
              </form>

              {/* Instant Search Results Dropdown */}
              {trimmedSearch && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Quick Search Results</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600 px-1.5 py-0.5 rounded-full">{totalResultsCount} found</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {totalResultsCount === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No matches found for "{searchQuery}"
                      </div>
                    ) : (
                      <>
                        {/* Pages */}
                        {searchResults.pages.length > 0 && (
                          <div className="p-1.5">
                            <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Pages</div>
                            {searchResults.pages.map(page => (
                              <button
                                key={page.path}
                                type="button"
                                onClick={() => {
                                  navigate(page.path);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                              >
                                <span className="font-semibold">{page.name}</span>
                                <FiArrowRight size={12} className="text-slate-400" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Orders */}
                        {searchResults.orders.length > 0 && (
                          <div className="p-1.5">
                            <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Orders</div>
                            {searchResults.orders.map(order => (
                              <button
                                key={order.id}
                                type="button"
                                onClick={() => {
                                  navigate(`/admin/orders?search=${encodeURIComponent(order.id)}`);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white">#{order.id}</span>
                                  <span className="text-slate-500 text-[11px] ml-1.5">{order.customer}</span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-600 font-mono">₹{order.amount || order.totalAmount || 0}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Technicians */}
                        {searchResults.technicians.length > 0 && (
                          <div className="p-1.5">
                            <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Technicians</div>
                            {searchResults.technicians.map(tech => (
                              <button
                                key={tech.id}
                                type="button"
                                onClick={() => {
                                  navigate(`/admin/technicians`);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors cursor-pointer"
                              >
                                <span className="font-bold text-slate-900 dark:text-white">{tech.name}</span>
                                <span className="text-slate-400 text-[10px]">{tech.phone || 'Technician'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      Press Enter to see all results in Orders →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Search orders, technicians, pages..."
            >
              <FiSearch size={15} />
            </button>
          )}
        </div>

        {/* Dark/Light mode pill toggle (Desktop / Tablet Only) */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="hidden sm:flex p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <FiSun size={15} className="text-amber-500" /> : <FiMoon size={15} className="text-blue-600" />}
          <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
        </button>

        {/* TV Mode Command Center Button (Desktop Only) */}
        <Link
          to="/tv"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs cursor-pointer shrink-0"
          title="Open Live Operations TV Display (Command Center)"
        >
          <FiTv size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>TV Mode</span>
        </Link>

        {/* Notification center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <FiBell size={16} />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-black text-white shadow-xs">
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
          <input
            type="file"
            ref={headerFileInputRef}
            onChange={handleHeaderPhotoUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 sm:pl-1.5 sm:pr-2.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-800 transition-colors focus:outline-none cursor-pointer group shrink-0"
          >
            <div className="relative flex-shrink-0">
              {adminAvatar ? (
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30 group-hover:ring-primary transition-all"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center ring-2 ring-primary/20">
                  {adminName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 pr-1">{adminName}</span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div 
                  onClick={() => headerFileInputRef.current?.click()} 
                  className="relative group cursor-pointer flex-shrink-0"
                  title="Click to upload/change profile photo"
                >
                  {adminAvatar ? (
                    <img
                      src={adminAvatar}
                      alt={adminName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30 group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-primary/20">
                      {adminName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera size={14} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{adminName}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-0.5">
                    {localStorage.getItem('internal_role') === 'HR' ? '🔵 HR Manager' : '⚙️ System Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">{settings.email || user?.email || 'admin@sktechnology.in'}</p>
                  <button
                    type="button"
                    onClick={() => headerFileInputRef.current?.click()}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FiCamera size={10} /> Upload Photo
                  </button>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    headerFileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                >
                  <FiCamera size={14} className="text-slate-400" />
                  <span>Upload Profile Photo</span>
                </button>
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
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
