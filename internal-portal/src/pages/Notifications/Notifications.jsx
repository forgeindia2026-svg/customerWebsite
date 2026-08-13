import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, BellRing } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Notifications() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    url: '/'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }
      
      setStatus({ type: 'success', message: data.message || 'Notifications sent successfully!' });
      setFormData({ title: '', message: '', url: '/' });
    } catch (err) {
      console.error(err);
      setStatus({ 
        type: 'error', 
        message: err.message || 'Failed to send notifications. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BellRing className="h-6 w-6 text-amber-500" />
          Push Notifications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Send real-time alerts, offers, and announcements to subscribed customers.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {status.message && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                status.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Flash Sale Today!"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message Body *
                </label>
                <textarea
                  name="message"
                  required
                  rows="3"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="e.g. Get 20% off on all security cameras. Limited time offer."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target URL (Optional)
                </label>
                <input
                  type="text"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="e.g. /products"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The page customers will be taken to when they click the notification. Default is home (/).
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send Push Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
