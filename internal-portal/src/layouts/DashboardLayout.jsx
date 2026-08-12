import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { setDashboardData } from '../redux/dashboardSlice';

export default function DashboardLayout() {
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const darkMode = useSelector(state => state.dashboard.darkMode);

  // Auth check guard
  useEffect(() => {
    const token = localStorage.getItem('internal_token');
    const role = localStorage.getItem('internal_role');
    if (!token || role !== 'ADMIN') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const fetchData = () => {
      fetch(`${import.meta.env.VITE_API_URL || 'https://cctvwebsite.onrender.com'}/api/dashboard`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data) {
            dispatch(setDashboardData(resData.data));
          }
        })
        .catch(err => console.error('Failed to load dashboard data:', err));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Sync Tailwind class with Redux darkMode state
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Adjust sidebar default state depending on window width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  return (
    <div className="min-h-screen flex bg-[#f5f7fa] dark:bg-slate-950 transition-colors">
      {/* Desktop Sidebar */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            onClick={toggleMobileSidebar} 
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />
          {/* Sidebar */}
          <div className="relative w-60 h-full animate-in slide-in-from-left duration-200">
            <Sidebar isOpen={true} toggleSidebar={toggleMobileSidebar} />
          </div>
        </div>
      )}

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header toggleMobileSidebar={toggleMobileSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8">
          {/* Outlet wraps actual page contents */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
