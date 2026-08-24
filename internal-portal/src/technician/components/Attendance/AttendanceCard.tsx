import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, CheckCircle, AlertCircle, ShieldCheck, MapPin } from 'lucide-react';
import { getApiUrl } from '../../../utils/config';

interface AttendanceRecord {
  _id?: string;
  technicianId: string;
  technicianName: string;
  date: string;
  checkInTime?: string;
  checkInTimestamp?: string;
  checkOutTime?: string;
  checkOutTimestamp?: string;
  totalHours?: number;
  status: 'PRESENT' | 'HALF_DAY' | 'OVERTIME' | 'OFF_DUTY';
  location?: string;
  latitude?: number;
  longitude?: number;
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
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);

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

  // Live timer tick when ON DUTY
  useEffect(() => {
    if (!attendance || !attendance.checkInTimestamp || attendance.checkOutTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const diffMs = Date.now() - new Date(attendance.checkInTimestamp!).getTime();
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
  }, [attendance]);

  const handlePunchIn = async () => {
    setLocationStatus('Getting live GPS location...');
    try {
      setIsPunching(true);

      // 1. Enforce live GPS Location
      let coordsData;
      try {
        coordsData = await getLiveLocation();
        setLocationStatus(`Location: ${coordsData.locationName}`);
      } catch (locErr: any) {
        setLocationStatus(null);
        alert(locErr.message || 'Please turn on GPS and allow location permission to Punch In.');
        setIsPunching(false);
        return; // BLOCK punch in if location is not enabled
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const checkInTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      const localRecord: AttendanceRecord = {
        technicianId: techId,
        technicianName: techName,
        date: today,
        checkInTime: checkInTimeStr,
        checkInTimestamp: now.toISOString(),
        status: 'PRESENT',
        location: coordsData.locationName,
        latitude: coordsData.lat,
        longitude: coordsData.lng
      };

      // 2. Instant local UI update
      setAttendance(localRecord);
      localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(localRecord));

      // 3. Sync to Backend API with exact live location
      const res = await fetch(`${getApiUrl()}/api/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          technicianName: techName,
          location: coordsData.locationName,
          latitude: coordsData.lat,
          longitude: coordsData.lng,
          notes: 'Full Day (1.0 Day)'
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

      let hours = 0;
      if (attendance?.checkInTimestamp) {
        const diffMs = now.getTime() - new Date(attendance.checkInTimestamp).getTime();
        hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }

      const updatedRecord: AttendanceRecord = {
        ...(attendance || { technicianId: techId, technicianName: techName, date: today }),
        checkOutTime: checkOutTimeStr,
        checkOutTimestamp: now.toISOString(),
        status: 'OFF_DUTY',
        totalHours: hours
      };

      // 1. Instant local UI update
      setAttendance(updatedRecord);
      localStorage.setItem(`sk_tech_attendance_${techId}_${today}`, JSON.stringify(updatedRecord));
      setShowCheckoutConfirm(false);

      // 2. Sync to Backend API
      const res = await fetch(`${getApiUrl()}/api/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          notes: notes || 'Full Day (1.0 Day)'
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

  const isOnDuty = Boolean(attendance && attendance.checkInTimestamp && !attendance.checkOutTimestamp);
  const isShiftEnded = Boolean(attendance && attendance.checkOutTimestamp);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-3.5 sm:px-4 py-3 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mb-5">
      <div className="flex items-center justify-between gap-2.5">
        
        {/* Left Side: Small Icon + Title + Status Badge */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
            isOnDuty 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20 animate-pulse' 
              : isShiftEnded 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
              : 'bg-blue-50 dark:bg-blue-900/30 text-[#2563eb] dark:text-blue-400'
          }`}>
            {isOnDuty ? <Clock className="w-4 h-4" /> : isShiftEnded ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <ShieldCheck className="w-4 h-4" />}
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
              Daily Attendance
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ${
              isOnDuty 
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200' 
                : isShiftEnded 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200' 
                : 'bg-[#fffbeb] dark:bg-amber-950/50 text-[#b45309] dark:text-amber-300 border border-[#fde68a]'
            }`}>
              {isOnDuty ? '🟢 ON DUTY' : isShiftEnded ? '🏁 ENDED' : '🟡 NOT PUNCHED'}
            </span>
          </div>
        </div>

        {/* Right Side: Action Button & Active Time Inline */}
        <div className="flex items-center space-x-2 shrink-0">
          {isOnDuty && (
            <div className="hidden sm:block font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
              {elapsedTime}
            </div>
          )}

          {!attendance || (!isOnDuty && !isShiftEnded) ? (
            <button
              onClick={handlePunchIn}
              disabled={isPunching}
              className="flex items-center space-x-1.5 bg-[#059669] hover:bg-emerald-700 active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isPunching ? 'Punching...' : 'Punch In'}</span>
            </button>
          ) : isOnDuty ? (
            <button
              onClick={() => setShowCheckoutConfirm(true)}
              disabled={isPunching}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Punch Out</span>
            </button>
          ) : (
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/60">
              ✓ Day Completed
            </div>
          )}
        </div>
      </div>

      {/* Punch Out Confirmation Modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Confirm Punch Out (End Work Day)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Work started at <strong>{attendance?.checkInTime}</strong>. Total recorded duration will be logged for admin attendance and records.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Completed 3 installations, 1 pending follow-up..."
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
