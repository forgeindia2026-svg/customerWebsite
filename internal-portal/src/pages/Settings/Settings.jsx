import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateSettings } from '../../redux/dashboardSlice';
import { FiSave, FiSettings, FiBriefcase, FiMail, FiMapPin, FiPercent } from 'react-icons/fi';

export default function Settings() {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.dashboard?.settings) || {};

  const [form, setForm] = useState({ ...(settings || {}) });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateSettings(form));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <FiSettings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">CCTV System Configurations</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage business profile info, tax rates and dashboard params.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5 transition-colors">
        
        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FiBriefcase /> Company / Shop name
          </label>
          <input 
            required
            type="text" 
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-105"
          />
        </div>

        {/* Contact Person */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-555 dark:text-slate-400 mb-1.5">
              Administrator Name
            </label>
            <input 
              required
              type="text" 
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-105"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-555 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FiMail /> Admin Email
            </label>
            <input 
              required
              type="email" 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-105"
            />
          </div>
        </div>

        {/* Phone & Tax Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-555 dark:text-slate-400 mb-1.5">
              Contact Phone
            </label>
            <input 
              required
              type="text" 
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-105"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-555 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <FiPercent /> GST Tax Rate (%)
            </label>
            <input 
              required
              type="number" 
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-105"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-555 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FiMapPin /> Physical Shop Address
          </label>
          <textarea 
            required
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-105"
          />
        </div>

        {/* Checkbox settings */}
        <div className="pt-2 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.allowNotifications}
              onChange={(e) => setForm({ ...form, allowNotifications: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary bg-slate-50 border-slate-300"
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-350">Allow desktop notification alerts</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary bg-slate-50 border-slate-300"
            />
            <span className="text-xs font-medium text-slate-605 dark:text-slate-350">Enable maintenance mode (clients warning)</span>
          </label>
        </div>

        {/* Save */}
        <div className="pt-4 border-t border-slate-50 dark:border-slate-855 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                ✓ Configuration settings updated!
              </span>
            )}
          </div>
          <button 
            type="submit" 
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <FiSave /> Save Settings
          </button>
        </div>

      </form>

    </div>
  );
}
