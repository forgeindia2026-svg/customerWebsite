import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateSettings } from '../../redux/dashboardSlice';
import { FiSave, FiSettings, FiBriefcase, FiMail, FiMapPin, FiPercent, FiCamera, FiUpload, FiTrash2, FiUser, FiShield } from 'react-icons/fi';
import { compressImage } from '../../utils/imageUtils';

export default function Settings() {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.dashboard?.settings) || {};

  const role = (localStorage.getItem('internal_role') || 'ADMIN').toUpperCase();
  const isHR = role === 'HR';

  const [form, setForm] = useState(() => {
    const rawUser = (() => {
      try { return JSON.parse(localStorage.getItem('internal_user') || '{}'); } catch { return {}; }
    })();

    const initialName = localStorage.getItem('user_name') || rawUser.name || (isHR ? 'Kowsalya.V' : (settings?.contactPerson || 'SARAN KUMAR'));
    const initialEmail = localStorage.getItem('user_email') || rawUser.email || (isHR ? 'hr@sktechnology.in' : (settings?.email || 'sales@sktechnology.services'));
    const initialPhone = localStorage.getItem('user_phone') || rawUser.phone || settings?.phone || '+91 96009 75483';
    const initialPhoto = localStorage.getItem('admin_avatar') || rawUser.avatar || settings?.profilePhoto || '';

    return {
      companyName: settings?.companyName || 'SK TECHNOLOGY',
      contactPerson: initialName,
      email: initialEmail,
      phone: initialPhone,
      address: settings?.address || 'Ganapathy Kottai, Salem',
      taxRate: settings?.taxRate ?? 18,
      profilePhoto: initialPhoto,
      allowNotifications: settings?.allowNotifications ?? true,
      maintenanceMode: settings?.maintenanceMode ?? false,
      ...(settings || {}),
      contactPerson: initialName,
      email: initialEmail,
      profilePhoto: initialPhoto
    };
  });

  useEffect(() => {
    const rawUser = (() => {
      try { return JSON.parse(localStorage.getItem('internal_user') || '{}'); } catch { return {}; }
    })();
    const savedName = localStorage.getItem('user_name') || rawUser.name || (isHR ? 'Kowsalya.V' : (settings?.contactPerson || 'SARAN KUMAR'));
    const savedEmail = localStorage.getItem('user_email') || rawUser.email || (isHR ? 'hr@sktechnology.in' : (settings?.email || 'sales@sktechnology.services'));
    const savedPhoto = localStorage.getItem('admin_avatar') || rawUser.avatar || settings?.profilePhoto || '';
    const savedPhone = localStorage.getItem('user_phone') || rawUser.phone || settings?.phone || '+91 96009 75483';

    setForm(prev => ({
      ...prev,
      companyName: settings?.companyName || prev.companyName || 'SK TECHNOLOGY',
      address: settings?.address || prev.address,
      taxRate: settings?.taxRate ?? prev.taxRate ?? 18,
      contactPerson: savedName,
      email: savedEmail,
      phone: savedPhone,
      profilePhoto: savedPhoto
    }));
  }, [settings, isHR]);

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
      try {
        const u = JSON.parse(localStorage.getItem('internal_user') || '{}');
        u.avatar = base64Image;
        localStorage.setItem('internal_user', JSON.stringify(u));
      } catch (err) {}
      dispatch(updateSettings({ profilePhoto: base64Image }));
    } catch (err) {
      setUploadError('Failed to process image. Please choose a valid image file.');
    }
  };

  const handleRemovePhoto = () => {
    setForm(prev => ({ ...prev, profilePhoto: '' }));
    localStorage.removeItem('admin_avatar');
    try {
      const u = JSON.parse(localStorage.getItem('internal_user') || '{}');
      u.avatar = '';
      localStorage.setItem('internal_user', JSON.stringify(u));
    } catch (err) {}
    dispatch(updateSettings({ profilePhoto: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Persist active user details locally
    localStorage.setItem('user_name', form.contactPerson);
    localStorage.setItem('user_email', form.email);
    localStorage.setItem('user_phone', form.phone);
    if (form.profilePhoto) {
      localStorage.setItem('admin_avatar', form.profilePhoto);
    } else {
      localStorage.removeItem('admin_avatar');
    }

    try {
      const u = JSON.parse(localStorage.getItem('internal_user') || '{}');
      u.name = form.contactPerson;
      u.email = form.email;
      u.phone = form.phone;
      u.avatar = form.profilePhoto;
      localStorage.setItem('internal_user', JSON.stringify(u));
    } catch (_) {}

    dispatch(updateSettings(form));

    // Sync with backend profile API
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

  const profileName = form.contactPerson || (isHR ? 'Kowsalya.V' : 'SARAN KUMAR');

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <FiSettings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">
              {isHR ? 'HR Operations Profile & Preferences' : 'CCTV System Configurations & Admin Profile'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {isHR 
                ? 'Manage HR Operations Manager profile photo, contact details, email address and notifications.' 
                : 'Manage administrator profile photo, contact info, tax rates and system parameters.'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors">
        
        {/* Profile Photo Upload Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <FiUser size={13} /> {isHR ? 'HR Profile Photo' : 'Admin Profile Photo'}
          </label>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group flex-shrink-0">
              {form.profilePhoto ? (
                <img
                  src={form.profilePhoto}
                  alt={isHR ? 'HR Profile' : 'Admin Profile'}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md transition-transform group-hover:scale-102"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center ring-4 ring-primary/20 shadow-md">
                  {profileName.slice(0, 2).toUpperCase()}
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
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{profileName}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {isHR ? '🔵 HR Operations Manager' : '⚙️ System Administrator'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{form.email || (isHR ? 'hr@sktechnology.in' : 'sales@sktechnology.services')}</p>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                {isHR 
                  ? 'Upload your HR manager avatar image (JPG, PNG, or WEBP). It will be automatically displayed across the HR portal header.'
                  : 'Upload your admin avatar image (JPG, PNG, or WEBP). It will be automatically optimized and displayed across the admin dashboard header.'}
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
              {isHR ? 'HR Manager Name' : 'Administrator Name'}
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
              <FiMail /> {isHR ? 'HR Email Address' : 'Admin Email'}
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
                ✓ {isHR ? 'HR Profile & Settings updated!' : 'Configuration settings updated!'}
              </span>
            )}
          </div>
          <button 
            type="submit" 
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <FiSave size={14} /> {isHR ? 'Save HR Profile' : 'Save Settings'}
          </button>
        </div>

      </form>

    </div>
  );
}
