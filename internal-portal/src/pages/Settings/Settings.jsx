import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateSettings } from '../../redux/dashboardSlice';
import { FiSave, FiSettings, FiBriefcase, FiMail, FiMapPin, FiPercent, FiCamera, FiUpload, FiTrash2, FiUser } from 'react-icons/fi';
import { compressImage } from '../../utils/imageUtils';

export default function Settings() {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.dashboard?.settings) || {};

  const [form, setForm] = useState({ 
    companyName: '',
    contactPerson: 'SARAN KUMAR',
    email: 'admin@sktechnology.in',
    phone: '+91 96009 75483',
    address: '',
    taxRate: 18,
    profilePhoto: '',
    allowNotifications: true,
    maintenanceMode: false,
    ...(settings || {}) 
  });

  useEffect(() => {
    const savedPhoto = localStorage.getItem('admin_avatar') || settings.profilePhoto || '';
    setForm(prev => ({
      ...prev,
      ...(settings || {}),
      profilePhoto: savedPhoto || prev.profilePhoto
    }));
  }, [settings]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    try {
      const base64Image = await compressImage(file, 400, 400, 0.85);
      setForm(prev => ({ ...prev, profilePhoto: base64Image }));
      localStorage.setItem('admin_avatar', base64Image);
      dispatch(updateSettings({ profilePhoto: base64Image }));
    } catch (err) {
      setUploadError('Failed to process image. Please choose a valid image file.');
    }
  };

  const handleRemovePhoto = () => {
    setForm(prev => ({ ...prev, profilePhoto: '' }));
    localStorage.removeItem('admin_avatar');
    dispatch(updateSettings({ profilePhoto: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateSettings(form));

    // Try syncing with backend API if logged in
    try {
      if (form.email) {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.contactPerson,
            phone: form.phone,
            address: form.address,
            avatar: form.profilePhoto
          })
        });
      }
    } catch (err) {
      // Ignore network errors if backend offline
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const adminName = form.contactPerson || 'SARAN KUMAR';

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <FiSettings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">CCTV System Configurations</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage administrator profile photo, contact info, tax rates and system parameters.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors">
        
        {/* Admin Profile Photo Upload Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <FiUser size={13} /> Admin Profile Photo
          </label>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group flex-shrink-0">
              {form.profilePhoto ? (
                <img
                  src={form.profilePhoto}
                  alt="Admin Profile"
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md transition-transform group-hover:scale-102"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center ring-4 ring-primary/20 shadow-md">
                  {adminName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="settings-photo-file-input"
                className="absolute inset-0 rounded-2xl bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Click to select profile photo"
              >
                <FiCamera size={22} />
                <span className="text-[10px] font-bold mt-1">Change</span>
              </label>
              <input
                type="file"
                id="settings-photo-file-input"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{adminName}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{form.email || 'admin@sktechnology.in'}</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                Upload your admin avatar image (JPG, PNG, or WEBP). It will be automatically optimized and displayed across the admin dashboard header.
              </p>
              {uploadError && (
                <p className="text-xs text-red-500 font-medium">{uploadError}</p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                <label
                  htmlFor="settings-photo-file-input"
                  className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <FiUpload size={13} /> Upload New Photo
                </label>
                {form.profilePhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                  >
                    <FiTrash2 size={13} /> Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FiBriefcase /> Company / Shop name
          </label>
          <input 
            required
            type="text" 
            value={form.companyName || ''}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Contact Person & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Administrator Name
            </label>
            <input 
              required
              type="text" 
              value={form.contactPerson || ''}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FiMail /> Admin Email
            </label>
            <input 
              required
              type="email" 
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Phone & Tax Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Contact Phone
            </label>
            <input 
              required
              type="text" 
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <FiPercent /> GST Tax Rate (%)
            </label>
            <input 
              required
              type="number" 
              value={form.taxRate ?? 18}
              onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FiMapPin /> Physical Shop Address
          </label>
          <textarea 
            required
            rows={3}
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Checkbox settings */}
        <div className="pt-2 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.allowNotifications ?? true}
              onChange={(e) => setForm({ ...form, allowNotifications: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary bg-slate-50 border-slate-300"
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Allow desktop notification alerts</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.maintenanceMode ?? false}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary bg-slate-50 border-slate-300"
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Enable maintenance mode (clients warning)</span>
          </label>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                ✓ Configuration settings updated!
              </span>
            )}
          </div>
          <button 
            type="submit" 
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <FiSave size={14} /> Save Settings
          </button>
        </div>

      </form>

    </div>
  );
}
