import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiX, FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { markNotificationAsRead } from '../redux/dashboardSlice';

export default function ToastContainer() {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.dashboard.notifications);
  const [activeToasts, setActiveToasts] = useState([]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      const latest = unread[0];
      
      setActiveToasts(prev => {
        if (!prev.find(t => t.id === latest.id)) {
          setTimeout(() => {
            handleDismiss(latest.id);
          }, 4000);
          return [...prev, latest];
        }
        return prev;
      });
    }
  }, [notifications]);

  const handleDismiss = (id) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
    dispatch(markNotificationAsRead(id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {activeToasts.map((toast) => {
        let Icon = FiInfo;
        let colorClasses = 'border-blue-100 bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-200';
        
        if (toast.category === 'Payment' || toast.category === 'Order') {
          Icon = FiCheckCircle;
          colorClasses = 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-200';
        } else if (toast.category === 'Alert') {
          Icon = FiAlertCircle;
          colorClasses = 'border-amber-100 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-200';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-bottom duration-300 ${colorClasses}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-xs">{toast.title}</h5>
              <p className="text-[11px] mt-1 leading-normal opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => handleDismiss(toast.id)}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <FiX size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
