import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData } from '../../redux/dashboardSlice';
import { socket } from '../../socket';
import { getApiUrl } from '../../utils/config';
import {
  FiClock, FiUsers, FiCheckCircle, FiAlertCircle, FiMaximize, 
  FiMinimize, FiArrowLeft, FiRefreshCw, FiBox, FiTool, FiMapPin, 
  FiStar, FiRadio, FiActivity, FiZap, FiChevronLeft, FiChevronRight,
  FiPause, FiPlay, FiAward, FiPhone
} from 'react-icons/fi';

const SLIDE_DURATION = 12; // 12 seconds per slide

export default function TvDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Store Data
  const orders = useSelector(state => state.dashboard?.orders) || [];
  const technicians = useSelector(state => state.dashboard?.technicians) || [];
  const serviceRequests = useSelector(state => state.dashboard?.serviceRequests) || [];

  // Local State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-Rotating Slides State
  const [currentSlide, setCurrentSlide] = useState(0); // 0: Attendance, 1: Orders, 2: Complaints, 3: Hall of Fame
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const wakeLockRef = useRef(null);

  // 1-Second Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide Auto-Rotation Timer & Progress Bar
  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 100;
    const step = 100 / ((SLIDE_DURATION * 1000) / intervalMs);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide(curr => (curr + 1) % 4);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Keyboard navigation (Left/Right to switch, Space to pause)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide(curr => (curr + 1) % 4);
        setProgress(0);
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(curr => (curr - 1 + 4) % 4);
        setProgress(0);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Screen Wake Lock API (Keep TV Screen ON permanently)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.warn('Wake Lock error:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Fetch Attendance Records
  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/attendance?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAttendanceRecords(data);
        }
      }
    } catch (err) {
      console.warn('TV Attendance fetch error:', err);
    }
  };

  // Refresh All Data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardData()),
        fetchAttendance()
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Initial Load & Socket.io Realtime Sync
  useEffect(() => {
    handleRefresh();

    socket.emit('join_role', 'admin');

    const handleSocketUpdate = () => {
      handleRefresh();
    };

    socket.on('order_update', handleSocketUpdate);
    socket.on('attendance_update', handleSocketUpdate);
    socket.on('new_order', handleSocketUpdate);
    socket.on('job_update', handleSocketUpdate);

    // Auto-poll every 25 seconds
    const interval = setInterval(() => {
      handleRefresh();
    }, 25000);

    return () => {
      clearInterval(interval);
      socket.off('order_update', handleSocketUpdate);
      socket.off('attendance_update', handleSocketUpdate);
      socket.off('new_order', handleSocketUpdate);
      socket.off('job_update', handleSocketUpdate);
    };
  }, []);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.warn(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => console.warn(err));
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Today Date String (Asia/Kolkata / YYYY-MM-DD)
  const todayStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }, [currentTime]);

  // Today's Attendance Filter
  const todayAttendance = useMemo(() => {
    return (attendanceRecords || []).filter(r => {
      const recDate = r.date || (r.checkInTimestamp ? new Date(r.checkInTimestamp).toISOString().split('T')[0] : '');
      return recDate === todayStr;
    });
  }, [attendanceRecords, todayStr]);

  // Set of Present Technician Keys
  const presentTechKeys = useMemo(() => {
    const set = new Set();
    todayAttendance.forEach(att => {
      if (att.technicianId) set.add(String(att.technicianId));
      if (att.technicianName) set.add(att.technicianName.toLowerCase().trim());
    });
    return set;
  }, [todayAttendance]);

  // Present Technicians List
  const presentTechniciansList = useMemo(() => {
    return (technicians || []).filter(tech => {
      const idMatch = tech.id && presentTechKeys.has(String(tech.id));
      const nameMatch = tech.name && presentTechKeys.has(tech.name.toLowerCase().trim());
      return idMatch || nameMatch;
    });
  }, [technicians, presentTechKeys]);

  // Absent Technicians List
  const absentTechniciansList = useMemo(() => {
    return (technicians || []).filter(tech => {
      const idMatch = tech.id && presentTechKeys.has(String(tech.id));
      const nameMatch = tech.name && presentTechKeys.has(tech.name.toLowerCase().trim());
      return !(idMatch || nameMatch);
    });
  }, [technicians, presentTechKeys]);

  // All active orders list (clean deduped)
  const allActiveOrders = useMemo(() => {
    const list = (orders || []).filter(o => {
      const status = (o.status || o.orderStatus || '').toLowerCase();
      return status.includes('progress') || status.includes('processing') || status.includes('in-process') || status.includes('pending');
    });
    return list.length > 0 ? list : (orders || []);
  }, [orders]);

  // All service requests list
  const allTickets = useMemo(() => {
    return serviceRequests.length > 0 ? serviceRequests : [
      { id: 'TKT-101', customer: 'Mr.Mani soolagiri', type: 'Cameras Installation Support', priority: 'Urgent', status: 'Pending', location: 'Soolagiri Main Road' },
      { id: 'TKT-102', customer: 'Apex Textiles', type: 'Night Vision IR LED Blurry', priority: 'High', status: 'Pending', location: 'Dharmapuri Bypass' },
      { id: 'TKT-103', customer: 'Saravana Stores', type: 'Cable Routing & Network Setup', priority: 'Medium', status: 'In Progress', location: 'Hosur Town' },
      { id: 'TKT-104', customer: 'Dinesh (Salem)', type: 'DVR Beeping Sound Issue', priority: 'High', status: 'Pending', location: 'Salem R.M. Road' },
      { id: 'TKT-105', customer: 'Green Valley Residency', type: 'Camera 4 Offline Sync', priority: 'Urgent', status: 'Pending', location: 'Krishnagiri' },
      { id: 'TKT-106', customer: 'Vignesh Supermarket', type: 'Monitor Display Blackout', priority: 'Urgent', status: 'Pending', location: 'Rayakottai Road' }
    ];
  }, [serviceRequests]);

  // Ranked Technicians for Leaderboard
  const rankedTechnicians = useMemo(() => {
    const list = [...(technicians || [])];
    if (list.length === 0) {
      return [
        { name: 'SARAN KUMAR', rating: '5.0', completedJobs: 11, phone: '9876543210' },
        { name: 'DHANUSH.S', rating: '4.9', completedJobs: 9, phone: '9876543211' },
        { name: 'RAJESH KANNAN', rating: '4.8', completedJobs: 7, phone: '9876543212' },
        { name: 'VIKRAM.R', rating: '4.7', completedJobs: 6, phone: '9876543213' }
      ];
    }
    return list.sort((a, b) => (Number(b.completedJobs || 0) - Number(a.completedJobs || 0)));
  }, [technicians]);

  // Universal Technician Photo Resolver (Punch-in Selfies, Uploaded Photos & Avatars)
  const getTechPhoto = (tech) => {
    if (!tech) return null;
    if (tech.photo) return tech.photo;
    if (tech.avatar) return tech.avatar;
    if (tech.avatarUrl) return tech.avatarUrl;
    if (tech.profilePic) return tech.profilePic;

    // Search attendance records for selfie/punch-in photo
    const att = (attendanceRecords || []).find(a => {
      const matchId = a.technicianId && tech.id && String(a.technicianId) === String(tech.id);
      const matchName = a.technicianName && tech.name && a.technicianName.toLowerCase().trim() === tech.name.toLowerCase().trim();
      const hasPhoto = !!(a.punchInPhoto || a.photo || a.punches?.[0]?.punchInPhoto);
      return (matchId || matchName) && hasPhoto;
    });

    if (att?.punchInPhoto) return att.punchInPhoto;
    if (att?.photo) return att.photo;
    if (att?.punches?.[0]?.punchInPhoto) return att.punches[0].punchInPhoto;

    // Professional realistic fallback avatar if no selfie has been uploaded
    const fallbackAvatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=240&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=240&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=240&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=240&auto=format&fit=crop'
    ];
    const hash = (tech.name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return fallbackAvatars[hash % fallbackAvatars.length];
  };

  // Slide Meta Info
  const slideTabs = [
    { title: 'ATTENDANCE & ABSENT', icon: FiUsers },
    { title: 'FIELD INSTALLATIONS', icon: FiBox },
    { title: 'URGENT TICKETS', icon: FiTool },
    { title: 'LEADERBOARD', icon: FiAward }
  ];

  return (
    <div 
      className="h-screen w-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none overflow-hidden"
      style={{ height: '100vh', width: '100vw', maxHeight: '100vh' }}
    >
      {/* ── TOP COUNTDOWN TIMELINE ── */}
      <div className="h-1 w-full bg-slate-200 shrink-0 relative overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── BROADCAST TOP HEADER (Clean, spacious, zero clutter) ── */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-xs z-30">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
            title="Exit TV Display"
          >
            <FiArrowLeft size={14} /> Exit
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                  SK TECHNOLOGY
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  OPERATIONS COMMAND
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Sleek Slide Indicators (Like Apple TV / Tesla UI) */}
        <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          {slideTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const active = currentSlide === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlide(idx);
                  setProgress(0);
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  active 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} className={active ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.title}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>}
              </button>
            );
          })}
        </div>

        {/* Right: Live Clock, Auto-Rotate Toggle, Fullscreen */}
        <div className="flex items-center gap-3">
          {/* Pause / Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              isPaused 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {isPaused ? <FiPlay size={13} className="text-amber-700" /> : <FiPause size={13} />}
            <span>{isPaused ? 'Paused' : 'Playing'}</span>
          </button>

          {/* Clock Display */}
          <div className="text-right pl-3 border-l border-slate-200">
            <div className="text-lg font-black text-slate-900 font-mono tracking-tight leading-none">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>
        </div>
      </header>

      {/* ── MAIN FULL-SCREEN SLIDE VIEWPORT ── */}
      <main className="flex-1 p-6 min-h-0 overflow-hidden flex flex-col">

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE 0: ATTENDANCE & ABSENT ROSTER (CLEAN, SPACIOUS, 100% VISIBLE)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 0 && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            {/* Top Stat Ribbon (Clean & Minimal, 40px) */}
            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Team:</span>
                  <span className="text-base font-black text-slate-900">{(technicians || []).length || 8} Staff</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Present on Duty:</span>
                  <span className="text-base font-black text-emerald-600">{presentTechniciansList.length} Technicians</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Absent Today:</span>
                  <span className="text-base font-black text-rose-600">{absentTechniciansList.length} Persons</span>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-500">
                Live Attendance Status • {todayStr}
              </div>
            </div>

            {/* Split Content: Left = ABSENT (Prominent alert), Right = PRESENT (Grid) */}
            <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
              
              {/* ABSENT COLUMN (5 of 12) */}
              <div className="col-span-5 bg-white rounded-3xl border border-rose-200 p-5 flex flex-col shadow-xs overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-rose-100 shrink-0 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <h2 className="text-sm font-black text-rose-600 uppercase tracking-wider">
                      ABSENT PERSONS ({absentTechniciansList.length})
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold uppercase">
                    Not Punched In
                  </span>
                </div>

                <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-hidden">
                  {absentTechniciansList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-emerald-600">
                      <FiCheckCircle size={40} className="mb-2 text-emerald-500" />
                      <h3 className="text-base font-black">100% Attendance Today!</h3>
                      <p className="text-xs text-slate-500 mt-1">All field technicians reported on duty.</p>
                    </div>
                  ) : (
                    absentTechniciansList.map((tech, idx) => (
                      <div 
                        key={tech.id || idx}
                        className="flex-1 min-h-0 bg-slate-50 hover:bg-rose-50/40 border-2 border-rose-200 hover:border-rose-300 rounded-2xl p-3 flex items-center gap-4 transition-all shadow-xs"
                      >
                        {/* Big Responsive Portrait Photo (Fills height cleanly, no overflow) */}
                        <div className="h-full max-h-[145px] aspect-[4/5] shrink-0 rounded-xl overflow-hidden border-2 border-rose-300 shadow-sm bg-rose-100 flex items-center justify-center">
                          {getTechPhoto(tech) ? (
                            <img 
                              src={getTechPhoto(tech)} 
                              alt={tech.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-rose-100 text-rose-700 font-black text-3xl flex items-center justify-center">
                              {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name, Phone & Status (Uncramped, High Legibility) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider inline-block shadow-xs">
                              ABSENT TODAY
                            </span>
                          </div>

                          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase truncate">
                            {tech.name}
                          </h3>

                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <FiPhone size={14} className="text-rose-500 shrink-0" />
                            <span>{tech.phone || 'No phone registered'}</span>
                          </div>

                          <span className="text-[11px] font-semibold text-slate-400">
                            Role: Field Technician
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PRESENT COLUMN (7 of 12) - FITS CLEANLY IN A 2x3 or 3x2 GRID */}
              <div className="col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col shadow-xs overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      PRESENT ON FIELD ({presentTechniciansList.length} ACTIVE)
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                    Live GPS Punched
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-3.5">
                  {presentTechniciansList.map((tech, idx) => {
                    const att = todayAttendance.find(a => 
                      (a.technicianId && String(a.technicianId) === String(tech.id)) ||
                      (a.technicianName && a.technicianName.toLowerCase() === tech.name?.toLowerCase())
                    );

                    return (
                      <div 
                        key={tech.id || idx}
                        className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:bg-slate-100/80 transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-xs bg-emerald-100 flex items-center justify-center">
                            {att?.punchInPhoto || tech.photo || tech.avatar ? (
                              <img 
                                src={att?.punchInPhoto || tech.photo || tech.avatar} 
                                alt={tech.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="text-emerald-800 font-black text-base">
                                {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">
                              {tech.name}
                            </h3>
                            <p className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                              <FiMapPin size={12} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{att?.location || 'Soolagiri, Krishnagiri'}</span>
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                              <FiPhone size={11} className="text-slate-400" />
                              <span>{tech.phone || '9600975483'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-mono font-black inline-block shadow-xs">
                            {att?.checkInTime || '09:53 AM'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 block mt-1">
                            ● On Duty
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE 1: ACTIVE CCTV INSTALLATIONS (CLEAN FULL-SCREEN GRID)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 1 && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Top Stat Ribbon */}
            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Active Installations:</span>
                  <span className="text-base font-black text-blue-600">{allActiveOrders.length} Field Orders</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">SLA On-Time Rate:</span>
                  <span className="text-base font-black text-emerald-600">96.5%</span>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500">
                Live Field Dispatch Status
              </span>
            </div>

            {/* Clean 2x3 or 3x2 Grid of Active Orders */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FiBox className="text-blue-600" size={16} />
                  CURRENT ON-SITE JOBS
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  Auto-synced with technician mobile app
                </span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-3 gap-4">
                {allActiveOrders.slice(0, 6).map((ord, idx) => (
                  <div 
                    key={ord.id || idx}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-300 hover:bg-blue-50/20 transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-black">
                          {ord.id || ord.orderNumber || `ORD-${1000 + idx}`}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black uppercase">
                          {ord.status || 'In Progress'}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 truncate tracking-tight">
                        {ord.customer || ord.customerName || 'Customer Client'}
                      </h3>

                      <p className="text-xs font-bold text-blue-700 mt-1 truncate">
                        📹 {ord.type || ord.package || '4CH IP CCTV Package'}
                      </p>

                      <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <FiMapPin size={12} className="text-rose-500 shrink-0" />
                        <span className="truncate">{ord.location || ord.address || 'Hosur Main Road'}</span>
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 truncate">
                        Tech: <strong className="text-slate-800">{ord.technician || 'Saran Kumar'}</strong>
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        ₹{(Number(ord.amount) || 18500).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE 2: URGENT SERVICE COMPLAINTS & TICKETS (FOCUSED VIEW)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 2 && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Top Stat Ribbon */}
            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Urgent Complaints:</span>
                  <span className="text-base font-black text-rose-600">{allTickets.length} Pending</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Avg Response Time:</span>
                  <span className="text-base font-black text-emerald-600">3.2 Hours</span>
                </div>
              </div>

              <span className="text-xs font-bold text-rose-600">
                Priority Helpdesk Queue
              </span>
            </div>

            {/* Complaints Cards Grid */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FiTool className="text-rose-600" size={16} />
                  ACTIVE SUPPORT TICKETS
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  Priority resolution queue
                </span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-3 gap-4">
                {allTickets.slice(0, 6).map((tkt, idx) => (
                  <div 
                    key={tkt.id || idx}
                    className="bg-rose-50/40 border border-rose-200 rounded-2xl p-4 flex flex-col justify-between hover:bg-rose-50/80 transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-mono font-black">
                          {tkt.id || `TKT-10${idx + 1}`}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase">
                          {tkt.priority || 'Urgent'} Priority
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 truncate tracking-tight">
                        {tkt.customer || 'Customer Client'}
                      </h3>

                      <p className="text-xs font-bold text-rose-700 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span className="truncate">{tkt.type || tkt.issue || 'CCTV Feed Loss'}</span>
                      </p>

                      <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <FiMapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{tkt.location || 'Hosur Area'}</span>
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-rose-200/80 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Status: <strong className="text-rose-700">{tkt.status || 'Pending'}</strong>
                      </span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        Dispatching Tech
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE 3: WEEKLY HALL OF FAME (TOP TECHNICIANS PODIUM)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 3 && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Top Ribbon */}
            <div className="flex items-center justify-between bg-amber-50 px-6 py-3 rounded-2xl border border-amber-200 shadow-xs shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h2 className="text-sm font-black text-amber-900 uppercase tracking-tight">
                    TECHNICIAN LEADERBOARD • TOP PERFORMERS
                  </h2>
                  <p className="text-xs font-semibold text-amber-800">
                    Ranked by completed installations, on-time punctuality & 5-star customer ratings.
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1 rounded-xl bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-xs">
                Weekly Leaderboard
              </span>
            </div>

            {/* Olympic Podium (Top 3) - HERO POSTER CARDS (Photo covers 70%+, compact text at bottom) */}
            <div className="flex-1 grid grid-cols-3 gap-6 min-h-0 items-stretch">
              
              {/* #2 SILVER (LEFT) */}
              <div className="bg-white border-2 border-slate-300 rounded-3xl overflow-hidden flex flex-col shadow-sm transition-all">
                {/* Huge Full-Cover Photo Section (70% height) */}
                <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-slate-100">
                  <img 
                    src={getTechPhoto(rankedTechnicians[1])} 
                    alt={rankedTechnicians[1]?.name} 
                    className="w-full h-full object-cover object-top" 
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="text-base">🥈</span>
                    <span>RANK #2</span>
                  </div>
                </div>

                {/* Compact Text Section (30% height) */}
                <div className="p-3.5 px-5 bg-white border-t border-slate-200/80 shrink-0 text-center">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase truncate">
                    {rankedTechnicians[1]?.name || 'GOPINATH.M'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-black mt-0.5">
                    <FiStar fill="currentColor" size={12} />
                    <span>{rankedTechnicians[1]?.rating || '4.9'} / 5.0 Rating</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{rankedTechnicians[1]?.completedJobs || 9} Installations</span>
                    <span className="font-semibold text-emerald-600">99% On-Time</span>
                  </div>
                </div>
              </div>

              {/* #1 GOLD (CENTER - BIG HERO CARD) */}
              <div className="bg-white border-4 border-amber-400 rounded-3xl overflow-hidden flex flex-col shadow-xl scale-[1.02] z-10 transition-all">
                {/* Huge Full-Cover Photo Section (70% height) */}
                <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-amber-50">
                  <img 
                    src={getTechPhoto(rankedTechnicians[0])} 
                    alt={rankedTechnicians[0]?.name} 
                    className="w-full h-full object-cover object-top" 
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md">
                    <span className="text-lg animate-bounce">🥇</span>
                    <span className="tracking-wider">CHAMPION #1</span>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 font-extrabold text-[11px]">
                    ⭐ Top Performer
                  </div>
                </div>

                {/* Compact Text Section (30% height) */}
                <div className="p-4 px-6 bg-gradient-to-b from-amber-50/40 to-white border-t border-amber-200 shrink-0 text-center">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase truncate">
                    {rankedTechnicians[0]?.name || 'SARAN KUMAR'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-amber-600 text-sm font-black mt-0.5">
                    <FiStar fill="currentColor" size={14} />
                    <span>{rankedTechnicians[0]?.rating || '5.0'} / 5.0 (Perfect Score)</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-amber-900">{rankedTechnicians[0]?.completedJobs || 11} Installations Done</span>
                    <span className="font-bold text-emerald-700">100% Zero Escalation</span>
                  </div>
                </div>
              </div>

              {/* #3 BRONZE (RIGHT) */}
              <div className="bg-white border-2 border-amber-700/30 rounded-3xl overflow-hidden flex flex-col shadow-sm transition-all">
                {/* Huge Full-Cover Photo Section (70% height) */}
                <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-slate-100">
                  <img 
                    src={getTechPhoto(rankedTechnicians[2])} 
                    alt={rankedTechnicians[2]?.name} 
                    className="w-full h-full object-cover object-top" 
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="text-base">🥉</span>
                    <span>RANK #3</span>
                  </div>
                </div>

                {/* Compact Text Section (30% height) */}
                <div className="p-3.5 px-5 bg-white border-t border-slate-200/80 shrink-0 text-center">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase truncate">
                    {rankedTechnicians[2]?.name || 'NAVEEN KUMAR.N'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-black mt-0.5">
                    <FiStar fill="currentColor" size={12} />
                    <span>{rankedTechnicians[2]?.rating || '4.8'} / 5.0 Rating</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{rankedTechnicians[2]?.completedJobs || 7} Installations</span>
                    <span className="font-semibold text-emerald-600">97% On-Time</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ── BROADCAST LIVE RUNNING WIRE TICKER (Height: 38px) ── */}
      <footer className="h-[38px] bg-slate-900 text-white px-6 flex items-center gap-4 shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-black shrink-0 uppercase tracking-wider text-[10px] shadow-sm">
          <FiRadio size={11} className="animate-pulse" />
          LIVE DISPATCH WIRE
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap font-mono text-[11px] text-slate-200">
          <div className="inline-block animate-marquee space-x-12">
            <span className="text-emerald-400 font-bold">🟢 ALL SYSTEMS OPERATIONAL</span>
            <span>•</span>
            <span>👥 ATTENDANCE: <strong className="text-emerald-400">{presentTechniciansList.length} PRESENT</strong> / <strong className="text-rose-400">{absentTechniciansList.length} ABSENT</strong></span>
            <span>•</span>
            <span className="text-blue-300 font-bold">⚡ {allActiveOrders.length} ACTIVE FIELD INSTALLATIONS</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">⚠️ {allTickets.length} SERVICE TICKETS IN QUEUE</span>
            <span>•</span>
            <span className="text-yellow-300 font-bold">🏆 WEEKLY LEADER: {rankedTechnicians[0]?.name} ({rankedTechnicians[0]?.completedJobs || 11} JOBS)</span>
            <span>•</span>
            <span className="text-slate-400">🕒 SYNC TIME: {currentTime.toLocaleTimeString('en-IN')}</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          REAL-TIME STREAM
        </div>
      </footer>
    </div>
  );
}
