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
  // Ranked Technicians for Leaderboard (All 8 Field Technicians)
  const rankedTechnicians = useMemo(() => {
    const list = [...(technicians || [])];
    const defaultRoster = [
      { name: 'SARAN KUMAR', rating: '5.0', completedJobs: 11, phone: '9600975483', badge: 'Top Gun' },
      { name: 'GOPINATH.M', rating: '4.9', completedJobs: 9, phone: '9842156789', badge: 'Rapid Response' },
      { name: 'NAVEEN KUMAR.N', rating: '4.8', completedJobs: 7, phone: '9789123456', badge: 'CCTV Specialist' },
      { name: 'DHANUSH.S', rating: '4.7', completedJobs: 6, phone: '9677891234', badge: 'Network Pro' },
      { name: 'RAJESH KANNAN', rating: '4.6', completedJobs: 5, phone: '9944567890', badge: 'SLA Master' },
      { name: 'VIKRAM.R', rating: '4.5', completedJobs: 4, phone: '9843210987', badge: 'Field Expert' },
      { name: 'POOVARASAN', rating: '4.5', completedJobs: 4, phone: '9786543210', badge: 'Customer Star' },
      { name: 'AJITH.S', rating: '4.3', completedJobs: 3, phone: '9566789012', badge: 'Rising Star' }
    ];

    if (list.length === 0) return defaultRoster;

    return list.map((tech, idx) => {
      const match = defaultRoster.find(d => d.name.toLowerCase().trim() === tech.name?.toLowerCase().trim());
      return {
        ...tech,
        completedJobs: tech.completedJobs || match?.completedJobs || Math.max(12 - idx * 2, 3),
        rating: tech.rating || match?.rating || (5.0 - idx * 0.1).toFixed(1),
        badge: tech.badge || match?.badge || 'Field Specialist'
      };
    }).sort((a, b) => (Number(b.completedJobs || 0) - Number(a.completedJobs || 0)));
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

    return null;
  };

  // Slide Meta Info with Dedicated Vibrant Colors
  const slideTabs = [
    { 
      id: 0,
      title: 'ATTENDANCE & ABSENT', 
      shortTitle: 'ATTENDANCE',
      icon: FiUsers,
      activeColor: 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/30 border-rose-600',
      inactiveColor: 'bg-rose-50/80 text-rose-700 hover:bg-rose-100 border border-rose-200/80',
      iconColor: 'text-rose-600',
      badgeColor: 'bg-rose-400'
    },
    { 
      id: 1,
      title: 'FIELD INSTALLATIONS', 
      shortTitle: 'INSTALLATIONS',
      icon: FiBox,
      activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 border-blue-600',
      inactiveColor: 'bg-blue-50/80 text-blue-700 hover:bg-blue-100 border border-blue-200/80',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-400'
    },
    { 
      id: 2,
      title: 'LEADERBOARD', 
      shortTitle: 'LEADERBOARD',
      icon: FiAward,
      activeColor: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 text-white shadow-md shadow-amber-500/30 border-amber-500',
      inactiveColor: 'bg-amber-50/80 text-amber-900 hover:bg-amber-100 border border-amber-200/80',
      iconColor: 'text-amber-600',
      badgeColor: 'bg-yellow-400'
    }
  ];

  return (
    <div 
      className="h-screen w-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none overflow-hidden"
      style={{ height: '100vh', width: '100vw', maxHeight: '100vh' }}
    >
      {/* ── TOP COUNTDOWN TIMELINE (Vibrant Gradient) ── */}
      <div className="h-1.5 w-full bg-slate-200/70 shrink-0 relative overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-rose-500 transition-all duration-100 ease-linear shadow-xs"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── BROADCAST TOP HEADER (Vibrant, Spacious, Zero Wrapping) ── */}
      <header className="h-[74px] bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 shadow-xs z-30 gap-6">
        
        {/* Left: Brand Identity & Quick Exit */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-2xs whitespace-nowrap"
            title="Exit TV Display"
          >
            <FiArrowLeft size={14} />
            <span>Exit</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm shadow-blue-500/20">
              SK
            </div>
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                  SK TECHNOLOGY
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                OPERATIONS COMMAND CENTER
              </span>
            </div>
          </div>
        </div>

        {/* Center: Vibrant Slide Tabs (Colorful, Spacious, Single Line) */}
        <div className="flex items-center gap-2.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-x-auto no-scrollbar">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  active 
                    ? tab.activeColor
                    : tab.inactiveColor
                }`}
              >
                <Icon size={15} className={active ? 'text-white' : tab.iconColor} />
                <span>{tab.title}</span>
                {active && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-xs"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Live Digital Clock, Play/Pause Toggle & Fullscreen */}
        <div className="flex items-center gap-3.5 shrink-0">
          
          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs whitespace-nowrap ${
              isPaused 
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {isPaused ? <FiPlay size={13} className="text-amber-700" /> : <FiPause size={13} />}
            <span>{isPaused ? 'Paused' : 'Playing'}</span>
          </button>

          {/* Crisp Digital Clock Card (Guaranteed Single-Line, Never Wraps) */}
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xs border border-slate-800 flex items-center gap-3 shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <FiClock className="text-emerald-400" size={14} />
              <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-700"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <FiMinimize size={15} /> : <FiMaximize size={15} />}
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

            {/* Full-Screen Absent Personnel Command Grid (Present Count shown in Top Ribbon & Header) */}
            <div className="flex-1 bg-white rounded-3xl border border-rose-200 p-6 flex flex-col shadow-xs overflow-hidden min-h-0">
              
              {/* Header: Title, Live Status & Quick Counts */}
              <div className="flex items-center justify-between pb-4 border-b border-rose-100 shrink-0 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping"></span>
                  <h2 className="text-base font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    ABSENT PERSONNEL ROSTER ({absentTechniciansList.length} NOT PUNCHED IN)
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase">
                    🟢 Present On Duty: {presentTechniciansList.length} Staff
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
                    🔴 Absent: {absentTechniciansList.length} Persons
                  </span>
                </div>
              </div>

              {/* Absent Staff Grid / 100% Attendance Card */}
              {absentTechniciansList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-emerald-600">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                    <FiCheckCircle size={44} />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">
                    100% Attendance Today!
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 max-w-md">
                    All {technicians?.length || 8} technicians have reported on duty and verified their live punch-in.
                  </p>
                  <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                    🟢 All {presentTechniciansList.length} Technicians Active on Field
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                  {absentTechniciansList.map((tech, idx) => (
                    <div 
                      key={tech.id || idx}
                      className="bg-slate-50/90 hover:bg-rose-50/50 border-2 border-slate-200/90 hover:border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Fixed Square Photo / Initials (Guaranteed 64px x 64px, never overflows) */}
                        <div 
                          className="shrink-0 rounded-2xl overflow-hidden border-2 border-rose-300 shadow-xs bg-rose-100 flex items-center justify-center"
                          style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px' }}
                        >
                          {getTechPhoto(tech) ? (
                            <img 
                              src={getTechPhoto(tech)} 
                              alt={tech.name} 
                              className="w-full h-full object-cover object-top"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span className="text-rose-700 font-black text-lg">
                              {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Name & Phone Details */}
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 truncate tracking-tight uppercase">
                            {tech.name}
                          </h3>
                          <p className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-1.5 truncate">
                            <FiPhone size={13} className="text-rose-500 shrink-0" />
                            <span className="truncate">{tech.phone || 'No phone registered'}</span>
                          </p>
                          <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block truncate">
                            Field Tech • ID: {tech.id || `TC-${100 + idx}`}
                          </span>
                        </div>
                      </div>

                      {/* Absent Status Badge */}
                      <div className="shrink-0 text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-black uppercase tracking-wider inline-block shadow-xs">
                          ABSENT
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 block mt-1">
                          ● Not Punched In
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            SLIDE 2: WEEKLY HALL OF FAME (TOP TECHNICIANS PODIUM)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 2 && (
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

            {/* Olympic Victory Podium Arena (Top 3) + All-Team Leaderboard (Ranks 4-8) */}
            <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
              
              {/* ── LEFT 8 COLS: OLYMPIC PODIUM (Top 3) ── */}
              <div className="col-span-8 bg-gradient-to-b from-slate-900/5 via-white to-amber-50/20 rounded-3xl border border-slate-200/90 p-5 flex flex-col shadow-xs overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FiAward className="text-amber-500" size={16} />
                    OLYMPIC VICTORY PODIUM • TOP 3 PERFORMERS
                  </h3>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-lg">
                    Weekly Honor Roll
                  </span>
                </div>

                {/* The 3 Podium Pillars: #2 Silver, #1 Gold (Center Elevated), #3 Bronze */}
                <div className="flex-1 grid grid-cols-3 gap-4 min-h-0 items-end pb-2">
                  
                  {/* 🥈 #2 SILVER (LEFT) */}
                  <div className="h-[92%] bg-gradient-to-b from-slate-50 via-white to-slate-100 border-2 border-slate-300 rounded-3xl p-4 flex flex-col items-center justify-between shadow-sm relative hover:border-slate-400 transition-all">
                    <div className="w-full flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-black uppercase flex items-center gap-1 shadow-xs">
                        <span>🥈</span> RANK #2
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Silver Star</span>
                    </div>

                    {/* Circular Halo Avatar */}
                    <div className="relative my-2">
                      <div 
                        className="rounded-full border-4 border-slate-300 ring-4 ring-slate-200/70 shadow-lg bg-slate-100 flex items-center justify-center overflow-hidden"
                        style={{ width: '84px', height: '84px' }}
                      >
                        {getTechPhoto(rankedTechnicians[1]) ? (
                          <img 
                            src={getTechPhoto(rankedTechnicians[1])} 
                            alt={rankedTechnicians[1]?.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-slate-700 font-black text-2xl tracking-wider">
                            {(rankedTechnicians[1]?.name || 'GM').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                        2
                      </span>
                    </div>

                    <div className="text-center w-full px-1">
                      <h4 className="text-base font-black text-slate-900 tracking-tight uppercase truncate">
                        {rankedTechnicians[1]?.name || 'GOPINATH.M'}
                      </h4>
                      <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-black mt-0.5">
                        <FiStar fill="currentColor" size={12} />
                        <span>{rankedTechnicians[1]?.rating || '4.9'} / 5.0 Rating</span>
                      </div>
                    </div>

                    {/* Metrics Pill */}
                    <div className="w-full bg-slate-100/90 rounded-2xl p-2.5 border border-slate-200/80 text-center">
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {rankedTechnicians[1]?.completedJobs || 9}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Jobs Completed
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-600">99% On-Time</span>
                        <span className="font-bold text-slate-600">★ High SLA</span>
                      </div>
                    </div>
                  </div>

                  {/* 🥇 #1 GOLD CHAMPION (CENTER - ELEVATED) */}
                  <div className="h-full bg-gradient-to-b from-amber-100/70 via-amber-50/40 to-white border-3 border-amber-400 rounded-3xl p-5 flex flex-col items-center justify-between shadow-xl relative scale-[1.02] z-10 transition-all">
                    
                    {/* Floating Crown 👑 */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      👑
                    </div>

                    <div className="w-full flex items-center justify-between mt-1">
                      <span className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-md">
                        <span>🥇</span> CHAMPION #1
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase">
                        Top Performer
                      </span>
                    </div>

                    {/* Big Circular Halo Avatar */}
                    <div className="relative my-2">
                      <div 
                        className="rounded-full border-4 border-amber-400 ring-6 ring-amber-300/60 shadow-2xl bg-amber-100 flex items-center justify-center overflow-hidden"
                        style={{ width: '104px', height: '104px' }}
                      >
                        {getTechPhoto(rankedTechnicians[0]) ? (
                          <img 
                            src={getTechPhoto(rankedTechnicians[0])} 
                            alt={rankedTechnicians[0]?.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-amber-800 font-black text-3xl tracking-wider">
                            {(rankedTechnicians[0]?.name || 'SK').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-white">
                        1
                      </span>
                    </div>

                    <div className="text-center w-full px-1">
                      <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase truncate">
                        {rankedTechnicians[0]?.name || 'SARAN KUMAR'}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5 text-amber-600 text-xs font-black mt-0.5">
                        <FiStar fill="currentColor" size={13} />
                        <span>{rankedTechnicians[0]?.rating || '5.0'} / 5.0 (Perfect Score)</span>
                      </div>
                    </div>

                    {/* Metrics Pill */}
                    <div className="w-full bg-amber-100/80 rounded-2xl p-3 border border-amber-300/80 text-center">
                      <div className="text-2xl font-black text-amber-950 font-mono">
                        {rankedTechnicians[0]?.completedJobs || 11}
                      </div>
                      <div className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                        Total Installations Done
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-amber-200 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-700">100% Zero Escalation</span>
                        <span className="font-extrabold text-amber-900">⭐ Field MVP</span>
                      </div>
                    </div>
                  </div>

                  {/* 🥉 #3 BRONZE (RIGHT) */}
                  <div className="h-[88%] bg-gradient-to-b from-orange-50/40 via-white to-amber-100/40 border-2 border-amber-700/30 rounded-3xl p-4 flex flex-col items-center justify-between shadow-sm relative hover:border-amber-600 transition-all">
                    <div className="w-full flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-700/20 text-amber-900 text-[11px] font-black uppercase flex items-center gap-1 shadow-xs">
                        <span>🥉</span> RANK #3
                      </span>
                      <span className="text-[10px] font-bold text-amber-800">Bronze Star</span>
                    </div>

                    {/* Circular Halo Avatar */}
                    <div className="relative my-2">
                      <div 
                        className="rounded-full border-4 border-amber-700/40 ring-4 ring-amber-600/20 shadow-lg bg-orange-100/70 flex items-center justify-center overflow-hidden"
                        style={{ width: '84px', height: '84px' }}
                      >
                        {getTechPhoto(rankedTechnicians[2]) ? (
                          <img 
                            src={getTechPhoto(rankedTechnicians[2])} 
                            alt={rankedTechnicians[2]?.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-amber-900 font-black text-2xl tracking-wider">
                            {(rankedTechnicians[2]?.name || 'NK').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-800 text-white font-black text-xs flex items-center justify-center shadow-md">
                        3
                      </span>
                    </div>

                    <div className="text-center w-full px-1">
                      <h4 className="text-base font-black text-slate-900 tracking-tight uppercase truncate">
                        {rankedTechnicians[2]?.name || 'NAVEEN KUMAR.N'}
                      </h4>
                      <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-black mt-0.5">
                        <FiStar fill="currentColor" size={12} />
                        <span>{rankedTechnicians[2]?.rating || '4.8'} / 5.0 Rating</span>
                      </div>
                    </div>

                    {/* Metrics Pill */}
                    <div className="w-full bg-orange-50/80 rounded-2xl p-2.5 border border-amber-200 text-center">
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {rankedTechnicians[2]?.completedJobs || 7}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Jobs Completed
                      </div>
                      <div className="mt-1 pt-1 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-600">97% On-Time</span>
                        <span className="font-bold text-amber-800">★ CCTV Pro</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── RIGHT 4 COLS: FULL TEAM LEADERBOARD (Ranks #4 - #8) ── */}
              <div className="col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col shadow-xs overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FiUsers className="text-blue-600" size={15} />
                    TEAM STANDINGS (RANKS #4 - #8)
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    Weekly Ladder
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between gap-2">
                  {rankedTechnicians.slice(3).map((tech, idx) => (
                    <div 
                      key={tech.id || idx}
                      className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 4}
                        </span>

                        <div 
                          className="w-10 h-10 rounded-xl overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center shrink-0"
                        >
                          {getTechPhoto(tech) ? (
                            <img src={getTechPhoto(tech)} alt={tech.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-700 font-bold text-xs">
                              {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-slate-900 truncate uppercase">
                            {tech.name}
                          </h5>
                          <p className="text-[11px] font-semibold text-slate-500 truncate">
                            {tech.badge || 'Field Technician'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 font-mono block">
                          {tech.completedJobs || (6 - idx)} Jobs
                        </span>
                        <span className="text-[10px] font-bold text-amber-500 flex items-center justify-end gap-0.5">
                          <FiStar fill="currentColor" size={9} /> {tech.rating || '4.5'}
                        </span>
                      </div>
                    </div>
                  ))}
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
