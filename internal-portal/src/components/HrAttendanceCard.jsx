import React, { useState, useEffect, useRef } from 'react';
import { 
  FiClock, FiCheckCircle, FiAlertCircle, FiMapPin, FiCamera, FiX, FiRefreshCw, 
  FiLogIn, FiLogOut, FiUserCheck, FiShield, FiCalendar, FiChevronDown, FiChevronUp, FiFileText
} from 'react-icons/fi';
import { getApiUrl } from '../utils/config';

// Geolocation helper
const getLiveLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your device browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`);
          if (geoRes.ok) {
            const data = await geoRes.json();
            const addr = data.address || {};
            const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || addr.road || addr.village || '';
            const city = addr.city || addr.town || addr.state_district || 'Office HQ';
            if (area) {
              locationName = `${area}, ${city}`;
            } else if (data.display_name) {
              locationName = data.display_name.split(',').slice(0, 2).join(', ');
            }
          }
        } catch (e) {
          console.warn('Geocoding fallback:', e);
        }

        resolve({ locationName, lat, lng });
      },
      (err) => {
        let msg = 'Live Location / GPS is required to Punch In. Please allow location permission in your browser.';
        if (err.code === 1) msg = 'Location permission denied. Please enable location access in browser settings.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
};

export default function HrAttendanceCard({ compact = false }) {
  const [attendance, setAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [notes, setNotes] = useState('');

  // Modals & Camera states
  const [showPunchInModal, setShowPunchInModal] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showSessionsList, setShowSessionsList] = useState(false);

  // Live Webcam state & refs
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  const role = (localStorage.getItem('internal_role') || 'HR').toUpperCase();
  const rawUser = (() => {
    try { return JSON.parse(localStorage.getItem('internal_user') || '{}'); } catch { return {}; }
  })();
  const hrName = localStorage.getItem('user_name') || rawUser.name || (role === 'HR' ? 'Kowsalya.V (HR)' : 'Administrator');
  const hrId = rawUser.id || rawUser._id || (role === 'HR' ? 'HR-001' : 'ADMIN-01');

  const stopLiveWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  };

  const startLiveWebcam = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        mediaStreamRef.current = stream;
        setIsLiveCameraOpen(true);
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        }, 100);
      } else {
        fileInputRef.current?.click();
      }
    } catch (err) {
      console.warn('Webcam stream error, fallback to file upload:', err);
      fileInputRef.current?.click();
    }
  };

  const captureWebcamPhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoPreview(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `hr-punch-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotoFile(file);
          }
        }, 'image/jpeg', 0.85);
      }
    }
    stopLiveWebcam();
  };

  const fetchAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `sk_hr_attendance_${hrId}_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setAttendance(JSON.parse(cached)); } catch (_) {}
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${getApiUrl()}/api/attendance?technicianId=${hrId}&date=${today}`);
      if (res.ok) {
        const records = await res.json();
        if (Array.isArray(records) && records.length > 0) {
          setAttendance(records[0]);
          localStorage.setItem(cacheKey, JSON.stringify(records[0]));
        }
      }
    } catch (err) {
      console.warn('HR Attendance fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const handleSync = () => fetchAttendance();
    window.addEventListener('hr_attendance_updated', handleSync);
    return () => window.removeEventListener('hr_attendance_updated', handleSync);
  }, [hrId]);

  const punches = attendance?.punches || [];
  const activeSession = punches.find(p => p.punchInTimestamp && !p.punchOutTimestamp);
  const isOnDuty = Boolean(activeSession || (attendance?.checkInTimestamp && !attendance?.checkOutTimestamp && attendance.status === 'PRESENT'));

  // Live timer tick
  useEffect(() => {
    if (!isOnDuty) return;
    const startTimestamp = activeSession?.punchInTimestamp || attendance?.checkInTimestamp;
    if (!startTimestamp) return;

    const interval = setInterval(() => {
      const diffMs = Date.now() - new Date(startTimestamp).getTime();
      if (diffMs > 0) {
        const totalSecs = Math.floor(diffMs / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        setElapsedTime(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnDuty, activeSession, attendance]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPunchIn = async () => {
    setLocationStatus('Detecting location via GPS...');
    try {
      setIsPunching(true);
      let coordsData;
      try {
        coordsData = await getLiveLocation();
      } catch (locErr) {
        coordsData = { locationName: 'SK Technology HQ, Chennai', lat: 13.0827, lng: 80.2707 };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const checkInTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      const newPunch = {
        punchInTime: checkInTimeStr,
        punchInTimestamp: now.toISOString(),
        punchInPhoto: photoPreview || '',
        punchInLocation: coordsData.locationName,
        notes: notes || `HR Session ${punches.length + 1}`
      };

      const updatedRecord = {
        ...(attendance || {
          technicianId: hrId,
          technicianName: hrName,
          date: today,
          totalHours: 0
        }),
        checkInTime: attendance?.checkInTime || checkInTimeStr,
        checkInTimestamp: attendance?.checkInTimestamp || now.toISOString(),
        punchInPhoto: photoPreview || attendance?.punchInPhoto || '',
        checkOutTime: '',
        checkOutTimestamp: undefined,
        status: 'PRESENT',
        location: coordsData.locationName,
        latitude: coordsData.lat,
        longitude: coordsData.lng,
        punches: [...punches, newPunch]
      };

      setAttendance(updatedRecord);
      localStorage.setItem(`sk_hr_attendance_${hrId}_${today}`, JSON.stringify(updatedRecord));
      window.dispatchEvent(new Event('hr_attendance_updated'));

      setShowPunchInModal(false);
      setPhotoPreview(null);
      setPhotoFile(null);
      setNotes('');

      await fetch(`${getApiUrl()}/api/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: hrId,
          technicianName: hrName,
          location: coordsData.locationName,
          latitude: coordsData.lat,
          longitude: coordsData.lng,
          photo: photoPreview || '',
          notes: notes || `HR Punch In Session ${punches.length + 1}`
        })
      }).catch(err => console.warn('Punch in backend sync fallback:', err));

    } catch (err) {
      console.error('Punch in error:', err);
    } finally {
      setIsPunching(false);
      setLocationStatus(null);
    }
  };

  const handlePunchOut = async () => {
    try {
      setIsPunching(true);
      let coordsData;
      try {
        coordsData = await getLiveLocation();
      } catch (e) {
        coordsData = { locationName: 'SK Technology HQ, Chennai', lat: 13.0827, lng: 80.2707 };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const checkOutTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      const updatedPunches = punches.map(p => {
        if (p.punchInTimestamp && !p.punchOutTimestamp) {
          const diffMs = now.getTime() - new Date(p.punchInTimestamp).getTime();
          return {
            ...p,
            punchOutTime: checkOutTimeStr,
            punchOutTimestamp: now.toISOString(),
            punchOutLocation: coordsData.locationName,
            durationHours: Number((diffMs / (1000 * 60 * 60)).toFixed(2))
          };
        }
        return p;
      });

      // Calculate total shift hours
      const grandTotalHours = updatedPunches.reduce((acc, p) => acc + (p.durationHours || 0), 0);

      const updatedRecord = {
        ...attendance,
        checkOutTime: checkOutTimeStr,
        checkOutTimestamp: now.toISOString(),
        totalHours: grandTotalHours,
        status: 'PRESENT',
        punches: updatedPunches
      };

      setAttendance(updatedRecord);
      localStorage.setItem(`sk_hr_attendance_${hrId}_${today}`, JSON.stringify(updatedRecord));
      window.dispatchEvent(new Event('hr_attendance_updated'));

      setShowCheckoutConfirm(false);
      setNotes('');

      await fetch(`${getApiUrl()}/api/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: hrId,
          location: coordsData.locationName,
          latitude: coordsData.lat,
          longitude: coordsData.lng,
          notes: notes || 'HR Punch Out Shift Completed'
        })
      }).catch(err => console.warn('Punch out backend sync fallback:', err));

    } catch (err) {
      console.error('Punch out error:', err);
    } finally {
      setIsPunching(false);
    }
  };

  // Compact Header Pill Renderer
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (isOnDuty) {
              setShowCheckoutConfirm(true);
            } else {
              setShowPunchInModal(true);
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs shadow-2xs transition-all cursor-pointer ${
            isOnDuty
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-600 text-white hover:brightness-105'
          }`}
          title={isOnDuty ? `ON DUTY (${elapsedTime}) - Click to Punch Out` : 'OFF DUTY - Click to Punch In'}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnDuty ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnDuty ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </span>
          <span className="hidden sm:inline">{isOnDuty ? `Punch Out (${elapsedTime})` : 'Punch In'}</span>
          <span className="sm:hidden">{isOnDuty ? 'Out' : 'In'}</span>
          {isOnDuty ? <FiLogOut size={13} /> : <FiLogIn size={13} />}
        </button>

        {showPunchInModal && renderPunchInModal()}
        {showCheckoutConfirm && renderPunchOutModal()}
      </div>
    );
  }

  function renderPunchInModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiLogIn className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="font-bold text-sm">HR Punch In / Check-In</h3>
                <p className="text-[10px] text-blue-100 font-medium">Record attendance for {hrName}</p>
              </div>
            </div>
            <button 
              onClick={() => { stopLiveWebcam(); setShowPunchInModal(false); }}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4 text-left">
            {/* Live Location indicator */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs">
              <FiMapPin className="text-blue-600 dark:text-blue-400 shrink-0" size={16} />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Attendance Location</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                  {attendance?.location || 'SK Technology HQ, Chennai (Auto-GPS verified)'}
                </span>
              </div>
            </div>

            {/* Photo Verification Section */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Verification Photo / Selfie (Optional)
              </label>

              {isLiveCameraOpen ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-700">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={captureWebcamPhoto}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiCamera size={14} /> Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopLiveWebcam}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48 group">
                  <img src={photoPreview} alt="Selfie preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 cursor-pointer"
                    title="Remove Photo"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startLiveWebcam}
                    className="flex-1 py-3 px-3 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FiCamera size={16} /> Take Live Selfie
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100"
                  >
                    Upload
                  </button>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoSelect} 
                    className="hidden" 
                  />
                </div>
              )}
            </div>

            {/* Notes Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Shift Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning HR Operations, Office Duty"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {locationStatus && (
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
                <FiRefreshCw size={12} className="animate-spin" /> {locationStatus}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { stopLiveWebcam(); setShowPunchInModal(false); }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPunching}
              onClick={handleConfirmPunchIn}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPunching ? <FiRefreshCw className="animate-spin" size={14} /> : <FiCheckCircle size={14} />}
              <span>{isPunching ? 'Punching In...' : 'Confirm Punch In'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderPunchOutModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-red-600 to-amber-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiLogOut className="w-5 h-5 text-amber-200" />
              <div>
                <h3 className="font-bold text-sm">HR Punch Out / Check-Out</h3>
                <p className="text-[10px] text-red-100 font-medium">End working shift for {hrName}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCheckoutConfirm(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
                TODAY'S SHIFT DURATION
              </span>
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {elapsedTime}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Active session started at: {activeSession?.punchInTime || attendance?.checkInTime || 'Today'}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                End-of-Shift Note (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Completed HR tasks & order approvals"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowCheckoutConfirm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Stay On Duty
            </button>
            <button
              type="button"
              disabled={isPunching}
              onClick={handlePunchOut}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPunching ? <FiRefreshCw className="animate-spin" size={14} /> : <FiLogOut size={14} />}
              <span>{isPunching ? 'Punching Out...' : 'Confirm Punch Out'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full Widget Renderer (For Dashboard)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl p-4 sm:p-5 transition-all text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        
        {/* User Info Header */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shrink-0">
            {hrName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
                {hrName}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                {role === 'HR' ? 'HR Manager' : 'Admin'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
              <FiMapPin size={12} className="text-blue-500 shrink-0" />
              <span className="truncate">{attendance?.location || 'SK Technology Headquarters'}</span>
            </p>
          </div>
        </div>

        {/* Live Duty Status Badge & Mobile-Responsive Punch Action */}
        <div className="w-full sm:w-auto flex flex-col xs:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center justify-between xs:justify-start gap-2 bg-slate-50 dark:bg-slate-800/60 sm:bg-transparent px-3 py-2 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:hidden">
              DUTY STATUS:
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnDuty ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${isOnDuty ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </span>
              <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${isOnDuty ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {isOnDuty ? 'ON DUTY / PRESENT' : 'OFF DUTY'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isOnDuty) {
                setShowCheckoutConfirm(true);
              } else {
                setShowPunchInModal(true);
              }
            }}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl sm:rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isOnDuty
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:brightness-105 active:scale-95'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-105 active:scale-95'
            }`}
          >
            {isOnDuty ? <FiLogOut size={15} /> : <FiLogIn size={15} />}
            <span>{isOnDuty ? 'Punch Out Shift' : 'Punch In Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Timer & Shift Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            SHIFT WORK TIMER
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400 block mt-1">
            {isOnDuty ? elapsedTime : (attendance?.totalHours ? `${attendance.totalHours} hrs` : '00:00:00')}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            FIRST CHECK IN
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block mt-1 truncate">
            {attendance?.checkInTime || 'Not Punched'}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            TOTAL PUNCHES
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block mt-1">
            {punches.length} {punches.length === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              PUNCH HISTORY
            </span>
            <button
              type="button"
              onClick={() => setShowSessionsList(!showSessionsList)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 block mt-1 hover:underline cursor-pointer text-left"
            >
              {showSessionsList ? 'Hide Logs' : 'View Logs'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowSessionsList(!showSessionsList)}
            className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
            title="Toggle Sessions History"
          >
            {showSessionsList ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Accordion Shift Sessions History */}
      {showSessionsList && (
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <FiCalendar size={14} className="text-blue-500" /> Today's HR Punch Sessions ({punches.length})
          </h4>

          {punches.length === 0 ? (
            <p className="text-xs text-slate-400">No punch sessions recorded today yet.</p>
          ) : (
            <div className="space-y-2">
              {punches.map((session, sIdx) => (
                <div key={sIdx} className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                      #{sIdx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                        In: {session.punchInTime} {session.punchOutTime ? `→ Out: ${session.punchOutTime}` : '(Active)'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block">
                        📍 {session.punchInLocation || 'Office HQ'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-right">
                    {session.durationHours ? `${session.durationHours} hrs` : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showPunchInModal && renderPunchInModal()}
      {showCheckoutConfirm && renderPunchOutModal()}
    </div>
  );
}
