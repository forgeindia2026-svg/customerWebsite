import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  MapPin, 
  Camera, 
  X, 
  RefreshCw, 
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getApiUrl } from '../../../utils/config';
import { JobsApiService } from '../../services/apiService';

interface PunchSession {
  _id?: string;
  punchInTime: string;
  punchInTimestamp: string | Date;
  punchInPhoto?: string;
  punchInLocation?: string;
  punchOutTime?: string;
  punchOutTimestamp?: string | Date;
  durationHours?: number;
  notes?: string;
}

interface AttendanceRecord {
  _id?: string;
  technicianId: string;
  technicianName: string;
  date: string;
  checkInTime?: string;
  checkInTimestamp?: string;
  punchInPhoto?: string;
  checkOutTime?: string;
  checkOutTimestamp?: string;
  totalHours?: number;
  status: 'PRESENT' | 'HALF_DAY' | 'OVERTIME' | 'OFF_DUTY';
  location?: string;
  latitude?: number;
  longitude?: number;
  punches?: PunchSession[];
}

// Helper to get Live GPS Coordinates & Human-readable area
const getLiveLocation = (): Promise<{ locationName: string; lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your device. Please enable Location in your settings.'));
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        try {
          // OpenStreetMap Reverse Geocoding
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`);
          if (geoRes.ok) {
            const data = await geoRes.json();
            const addr = data.address || {};
            const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || addr.road || addr.village || '';
            const city = addr.city || addr.town || addr.state_district || 'Chennai';
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
        let msg = 'Live Location / GPS is required to Punch In. Please turn ON device GPS and allow location permission.';
        if (err.code === 1) msg = 'Location permission denied. Please allow location access in your browser settings to Punch In.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
};

export const AttendanceCard: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPunching, setIsPunching] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [notes, setNotes] = useState<string>('');
  
  // Modals & Photo capture states
  const [showPunchInModal, setShowPunchInModal] = useState<boolean>(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [showSessionsList, setShowSessionsList] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
  const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || 'TECH-01';
  const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';

  const fetchAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(`sk_tech_attendance_${techId}_${today}`);
    if (cached) {
      try {
        setAttendance(JSON.parse(cached));
      } catch (_) {}
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${getApiUrl()}/api/attendance?technicianId=${techId}&date=${today}`);
      if (res.ok) {
        const records = await res.json();
        if (Array.isArray(records) && records.length > 0) {
          setAttendance(records[0]);
          localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(records[0]));
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [techId]);

  // Determine active open session
  const punches = attendance?.punches || [];
  const activeSession = punches.find(p => p.punchInTimestamp && !p.punchOutTimestamp);
  const isOnDuty = Boolean(activeSession || (attendance?.checkInTimestamp && !attendance?.checkOutTimestamp && attendance.status === 'PRESENT'));
  const completedPunches = punches.filter(p => p.punchOutTimestamp);

  // Live timer tick when ON DUTY
  useEffect(() => {
    if (!isOnDuty) return;

    const startTimestamp = activeSession?.punchInTimestamp || attendance?.checkInTimestamp;
    if (!startTimestamp) return;

    const interval = setInterval(() => {
      const diffMs = Date.now() - new Date(startTimestamp).getTime();
      if (diffMs > 0) {
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnDuty, activeSession, attendance]);

  // Photo change handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload photo to backend or use compressed base64 fallback
  const uploadPhoto = async (file: File): Promise<string> => {
    try {
      setIsUploadingPhoto(true);
      const url = await JobsApiService.uploadImageToS3(file);
      if (url) return url;
    } catch (err) {
      console.warn('Attendance photo upload error, using fallback:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
    return photoPreview || '';
  };

  const handleConfirmPunchIn = async () => {
    if (!photoPreview) {
      alert('Please take or upload a selfie / verification photo to Punch In.');
      return;
    }

    setLocationStatus('Getting live GPS location...');
    try {
      setIsPunching(true);

      // 1. Live GPS Location
      let coordsData;
      try {
        coordsData = await getLiveLocation();
        setLocationStatus(`Location: ${coordsData.locationName}`);
      } catch (locErr: any) {
        setLocationStatus(null);
        alert(locErr.message || 'Please turn on GPS and allow location permission to Punch In.');
        setIsPunching(false);
        return;
      }

      // 2. Upload Photo
      let finalPhotoUrl = photoPreview;
      if (photoFile) {
        finalPhotoUrl = await uploadPhoto(photoFile);
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const checkInTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      const newPunch: PunchSession = {
        punchInTime: checkInTimeStr,
        punchInTimestamp: now.toISOString(),
        punchInPhoto: finalPhotoUrl,
        punchInLocation: coordsData.locationName,
        notes: `Session ${punches.length + 1}`
      };

      const updatedRecord: AttendanceRecord = {
        ...(attendance || {
          technicianId: techId,
          technicianName: techName,
          date: today,
          totalHours: 0
        }),
        checkInTime: attendance?.checkInTime || checkInTimeStr,
        checkInTimestamp: attendance?.checkInTimestamp || now.toISOString(),
        punchInPhoto: finalPhotoUrl,
        checkOutTime: '',
        checkOutTimestamp: undefined,
        status: 'PRESENT',
        location: coordsData.locationName,
        latitude: coordsData.lat,
        longitude: coordsData.lng,
        punches: [...punches, newPunch]
      };

      // 3. Instant local UI update
      setAttendance(updatedRecord);
      localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(updatedRecord));
      setShowPunchInModal(false);
      setPhotoPreview(null);
      setPhotoFile(null);

      // 4. Sync to Backend API
      const res = await fetch(`${getApiUrl()}/api/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          technicianName: techName,
          location: coordsData.locationName,
          latitude: coordsData.lat,
          longitude: coordsData.lng,
          photo: finalPhotoUrl,
          notes: `Session ${punches.length + 1}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attendance) {
          setAttendance(data.attendance);
          localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(data.attendance));
        }
      }
    } catch (err) {
      console.warn('Punch-in API fallback engaged:', err);
    } finally {
      setIsPunching(false);
      setLocationStatus(null);
    }
  };

  const handlePunchOut = async () => {
    try {
      setIsPunching(true);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const checkOutTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      // Calculate session duration
      const startMs = activeSession?.punchInTimestamp 
        ? new Date(activeSession.punchInTimestamp).getTime() 
        : attendance?.checkInTimestamp ? new Date(attendance.checkInTimestamp).getTime() : now.getTime();
      
      const sessionHours = Math.max(0, Math.round(((now.getTime() - startMs) / (1000 * 60 * 60)) * 100) / 100);

      // Update punch list
      const updatedPunches = punches.map(p => {
        if (p.punchInTimestamp && !p.punchOutTimestamp) {
          return {
            ...p,
            punchOutTime: checkOutTimeStr,
            punchOutTimestamp: now.toISOString(),
            durationHours: sessionHours,
            notes: notes || p.notes
          };
        }
        return p;
      });

      const totalWorked = updatedPunches.reduce((acc, p) => acc + (p.durationHours || 0), 0);

      const updatedRecord: AttendanceRecord = {
        ...(attendance || { technicianId: techId, technicianName: techName, date: today }),
        checkOutTime: checkOutTimeStr,
        checkOutTimestamp: now.toISOString(),
        status: 'OFF_DUTY',
        totalHours: Math.round(totalWorked * 100) / 100,
        punches: updatedPunches
      };

      // 1. Instant local UI update
      setAttendance(updatedRecord);
      localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(updatedRecord));
      setShowCheckoutConfirm(false);
      setNotes('');

      // 2. Sync to Backend API
      const res = await fetch(`${getApiUrl()}/api/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          notes: notes || 'Session Completed'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attendance) {
          setAttendance(data.attendance);
          localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(data.attendance));
        }
      }
    } catch (err) {
      console.warn('Punch-out API fallback engaged:', err);
    } finally {
      setIsPunching(false);
    }
  };

  const hasPunchedToday = punches.length > 0 || Boolean(attendance?.checkInTimestamp);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-3.5 sm:px-4 py-3 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mb-5">
      <div className="flex items-center justify-between gap-2.5">
        
        {/* Left Side: Icon + Title + Status Badge */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
            isOnDuty 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20 animate-pulse' 
              : hasPunchedToday 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
              : 'bg-blue-50 dark:bg-blue-900/30 text-[#2563eb] dark:text-blue-400'
          }`}>
            {isOnDuty ? <Clock className="w-4 h-4" /> : hasPunchedToday ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <ShieldCheck className="w-4 h-4" />}
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
              Daily Attendance
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ${
              isOnDuty 
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200' 
                : hasPunchedToday 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200' 
                : 'bg-[#fffbeb] dark:bg-amber-950/50 text-[#b45309] dark:text-amber-300 border border-[#fde68a]'
            }`}>
              {isOnDuty 
                ? `🟢 ON DUTY ${punches.length > 1 ? `(S${punches.length})` : ''}` 
                : hasPunchedToday 
                ? `🏁 OFF DUTY (${punches.length} ${punches.length === 1 ? 'session' : 'sessions'})` 
                : '🟡 NOT PUNCHED'}
            </span>
          </div>
        </div>

        {/* Right Side: Action Button & Active Time / Total Today */}
        <div className="flex items-center space-x-2 shrink-0">
          {isOnDuty ? (
            <div className="hidden sm:flex items-center space-x-1 font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
              <span>{elapsedTime}</span>
            </div>
          ) : attendance?.totalHours ? (
            <div className="hidden sm:block text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
              Today: <strong className="text-slate-800 dark:text-slate-200">{attendance.totalHours} hrs</strong>
            </div>
          ) : null}

          {isOnDuty ? (
            <button
              onClick={() => setShowCheckoutConfirm(true)}
              disabled={isPunching}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Punch Out</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPunchInModal(true)}
              disabled={isPunching}
              className="flex items-center space-x-1.5 bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {punches.length === 0 ? 'Punch In' : `Punch In (Session ${punches.length + 1})`}
              </span>
            </button>
          )}

          {/* Toggle Sessions Dropdown if multiple punches */}
          {punches.length > 0 && (
            <button
              onClick={() => setShowSessionsList(!showSessionsList)}
              title="View today's punch sessions"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {showSessionsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Sessions History for Today */}
      {showSessionsList && punches.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Today's Sessions ({punches.length})</span>
            <span>Total: {attendance?.totalHours || 0} hrs</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {punches.map((p, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
              >
                <div className="flex items-center space-x-2">
                  {p.punchInPhoto ? (
                    <img 
                      src={p.punchInPhoto} 
                      alt="Selfie" 
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                      S{idx + 1}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      Session {idx + 1}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.punchInTime} - {p.punchOutTime || 'Active'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 font-mono">
                  {p.durationHours ? `${p.durationHours} hrs` : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PUNCH IN MODAL (WITH PHOTO CAPTURE) ================= */}
      {showPunchInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    Technician Punch In
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Session {punches.length + 1} • Take selfie / site photo
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowPunchInModal(false);
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Capture / Upload Area */}
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                capture="user"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 aspect-4/3 bg-slate-950 flex items-center justify-center group shadow-md">
                  <img
                    src={photoPreview}
                    alt="Punch In Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                  </div>
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Photo Verified</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-2.5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Take Selfie / Upload Photo <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Required for Admin attendance verification
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Open Camera / Browse
                  </button>
                </div>
              )}

              {/* GPS Location Indicator */}
              <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                  {locationStatus || 'GPS coordinates will be recorded on submission'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPunchInModal(false);
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPunchIn}
                disabled={isPunching || isUploadingPhoto || !photoPreview}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isPunching ? 'Verifying & Punching...' : 'Confirm Punch In'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PUNCH OUT CONFIRMATION MODAL ================= */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Confirm Punch Out</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Session started at <strong>{activeSession?.punchInTime || attendance?.checkInTime}</strong>. 
              You can punch in again later today for subsequent sessions or after your break.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Session Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Lunch break, Completed site A, heading to site B..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white outline-none resize-none min-h-[60px]"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePunchOut}
                disabled={isPunching}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                {isPunching ? 'Submitting...' : 'Confirm Punch Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
