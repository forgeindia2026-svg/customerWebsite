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
  FiPause, FiPlay, FiAward, FiPhone, FiDollarSign, FiTrendingUp
} from 'react-icons/fi';
import { buildTechSummaries, isTechNameMatch } from '../../utils/technicianEarningsUtils';

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

  // Set of Busy Technician Keys (Technicians assigned to an active field job)
  const busyTechKeys = useMemo(() => {
    const set = new Set();
    (orders || []).forEach(ord => {
      const status = (ord.status || ord.jobStatus || '').toUpperCase();
      if (!status.includes('COMPLET') && !status.includes('CANCEL')) {
        if (ord.technician) set.add(ord.technician.toLowerCase().trim());
        if (ord.assignedTechnicianName) set.add(ord.assignedTechnicianName.toLowerCase().trim());
        if (ord.technicianName) set.add(ord.technicianName.toLowerCase().trim());
        (ord.assignedTechnicians || []).forEach(t => {
          if (t.id) set.add(String(t.id));
          if (t.name) set.add(t.name.toLowerCase().trim());
        });
        (ord.subTechnicians || []).forEach(st => {
          if (typeof st === 'string') set.add(st.toLowerCase().trim());
          else if (st?.name) set.add(st.name.toLowerCase().trim());
        });
      }
    });
    return set;
  }, [orders]);

  // Available Technicians List (Present on duty AND no active job assigned)
  const availableTechniciansList = useMemo(() => {
    return presentTechniciansList.filter(tech => {
      const idMatch = tech.id && busyTechKeys.has(String(tech.id));
      const nameMatch = tech.name && busyTechKeys.has(tech.name.toLowerCase().trim());
      return !(idMatch || nameMatch);
    });
  }, [presentTechniciansList, busyTechKeys]);

  // Busy Technicians List (Present on duty AND has active job assigned)
  const busyTechniciansList = useMemo(() => {
    return presentTechniciansList.filter(tech => {
      const idMatch = tech.id && busyTechKeys.has(String(tech.id));
      const nameMatch = tech.name && busyTechKeys.has(tech.name.toLowerCase().trim());
      return idMatch || nameMatch;
    });
  }, [presentTechniciansList, busyTechKeys]);

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

  // Calculate Real-Time Technician Earnings from Orders Source-of-Truth
  const techEarningsData = useMemo(() => {
    return buildTechSummaries(orders);
  }, [orders]);

  // All technicians mapped with real earnings & sorted by This Month's Earnings (Highest First)
  const topEarnersList = useMemo(() => {
    const { map } = techEarningsData;
    const list = (technicians || []).map((tech, idx) => {
      const target = (tech.name || '').toLowerCase().trim();
      let sum = map[target];
      if (!sum) {
        const key = Object.keys(map).find(k => isTechNameMatch(k, target));
        if (key) sum = map[key];
      }
      return {
        ...tech,
        monthlyEarnings: sum?.monthlyEarnings || 0,
        monthCompletedCount: sum?.monthCompletedCount || 0,
        totalEarnings: sum?.totalEarnings || 0,
        totalCompleted: sum?.totalCompleted || 0,
        rating: tech.rating || (5.0 - (idx % 4) * 0.1).toFixed(1),
        badge: tech.role || tech.specialization || 'Field Specialist'
      };
    });

    return list.sort((a, b) => {
      if (b.monthlyEarnings !== a.monthlyEarnings) {
        return b.monthlyEarnings - a.monthlyEarnings;
      }
      return b.monthCompletedCount - a.monthCompletedCount;
    });
  }, [technicians, techEarningsData]);

  // This Month's Performance Ranked Technicians (Ranked by THIS MONTH completed jobs & ratings - NO EARNINGS)
  const rankedTechnicians = useMemo(() => {
    return [...topEarnersList].sort((a, b) => {
      if (b.monthCompletedCount !== a.monthCompletedCount) {
        return b.monthCompletedCount - a.monthCompletedCount;
      }
      if (b.totalCompleted !== a.totalCompleted) {
        return b.totalCompleted - a.totalCompleted;
      }
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    });
  }, [topEarnersList]);

  // Top Earner of the Month
  const topEarner = useMemo(() => topEarnersList[0] || null, [topEarnersList]);

  // Total Team Monthly Payout
  const totalMonthlyPayout = useMemo(() => {
    return topEarnersList.reduce((acc, t) => acc + (t.monthlyEarnings || 0), 0);
  }, [topEarnersList]);

  // Total Monthly Jobs Completed Count
  const totalMonthlyJobsCount = useMemo(() => {
    return topEarnersList.reduce((acc, t) => acc + (t.monthCompletedCount || 0), 0);
  }, [topEarnersList]);

  // Current Month Label (e.g. OCTOBER 2026)
  const currentMonthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase();
    } catch (_) {
      return 'THIS MONTH';
    }
  }, []);

  // Quick Helper for Technician's Month Earning
  const getTechMonthEarning = (tech) => {
    if (!tech) return 0;
    const target = (tech.name || '').toLowerCase().trim();
    const { map } = techEarningsData;
    if (map[target]) return map[target].monthlyEarnings;
    const key = Object.keys(map).find(k => isTechNameMatch(k, target));
    return key ? map[key].monthlyEarnings : 0;
  };

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

  // 4-Slide Meta Navigation with Dedicated Vibrant Colors (Compact, Zero-Clipping)
  const slideTabs = [
    { 
      id: 0,
      title: 'ATTENDANCE', 
      shortTitle: 'ATTENDANCE',
      icon: FiUsers,
      activeColor: 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/30 border-rose-600',
      inactiveColor: 'bg-rose-50/80 text-rose-700 hover:bg-rose-100 border border-rose-200/80',
      iconColor: 'text-rose-600',
      badgeColor: 'bg-rose-400'
    },
    { 
      id: 1,
      title: 'INSTALLATIONS', 
      shortTitle: 'INSTALLATIONS',
      icon: FiBox,
      activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 border-blue-600',
      inactiveColor: 'bg-blue-50/80 text-blue-700 hover:bg-blue-100 border border-blue-200/80',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-400'
    },
    { 
      id: 2,
      title: 'TOP EARNERS', 
      shortTitle: 'TOP EARNERS',
      icon: FiDollarSign,
      activeColor: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-md shadow-emerald-500/30 border-emerald-600',
      inactiveColor: 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80',
      iconColor: 'text-emerald-600',
      badgeColor: 'bg-emerald-400'
    },
    { 
      id: 3,
      title: 'LEADERBOARD', 
      shortTitle: 'LEADERBOARD',
      icon: FiAward,
      activeColor: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white shadow-md shadow-amber-500/30 border-amber-500',
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
      <header className="h-[62px] bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shrink-0 shadow-xs z-30 gap-4">
        
        {/* Left: Brand Identity & Quick Exit */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-2xs whitespace-nowrap"
            title="Exit TV Display"
          >
            <FiArrowLeft size={13} />
            <span>Exit</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-sm shadow-blue-500/20">
              SK
            </div>
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  SK TECHNOLOGY
                </span>
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                COMMAND CENTER
              </span>
            </div>
          </div>
        </div>

        {/* Center: Vibrant Slide Tabs (Sleek, Compact, Zero Clipping) */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active 
                    ? tab.activeColor
                    : tab.inactiveColor
                }`}
              >
                <Icon size={14} className={active ? 'text-white' : tab.iconColor} />
                <span>{tab.title}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-xs"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Live Digital Clock, Play/Pause Toggle & Fullscreen */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs whitespace-nowrap ${
              isPaused 
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {isPaused ? <FiPlay size={12} className="text-amber-700" /> : <FiPause size={12} />}
            <span>{isPaused ? 'Paused' : 'Playing'}</span>
          </button>

          {/* Crisp Digital Clock Card */}
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xs border border-slate-800 flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <FiClock className="text-emerald-400" size={13} />
              <span className="font-mono text-sm font-black text-emerald-400 tracking-wider">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-700"></div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
          </button>
        </div>
      </header>

      {/* ── MAIN FULL-SCREEN SLIDE VIEWPORT (Optimized Compact Sizing) ── */}
      <main className="flex-1 px-5 py-3 min-h-0 overflow-hidden flex flex-col">

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE 0: TECHNICIAN AVAILABILITY & LIVE STATUS (AVAILABLE / BUSY / ABSENT)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 0 && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            {/* Top Stat Ribbon (Live Availability Counts) */}
            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Team:</span>
                  <span className="text-base font-black text-slate-900 font-mono">{(technicians || []).length || 8} Staff</span>
                </div>

                <div className="w-px h-4 bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Available (Ready):</span>
                  <span className="text-base font-black text-emerald-600 font-mono">{availableTechniciansList.length} Techs</span>
                </div>

                <div className="w-px h-4 bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Busy (On Site):</span>
                  <span className="text-base font-black text-amber-600 font-mono">{busyTechniciansList.length} Techs</span>
                </div>

                <div className="w-px h-4 bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Absent / Off Duty:</span>
                  <span className="text-base font-black text-rose-600 font-mono">{absentTechniciansList.length} Staff</span>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-500 font-mono">
                Live Roster Sync • {todayStr}
              </div>
            </div>

            {/* Command Grid: Available, Busy & Absent Roster */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col shadow-xs overflow-hidden min-h-0">
              
              {/* Header: Title & Status Summary Badges */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 animate-ping"></span>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    TECHNICIAN DISPATCH & LIVE AVAILABILITY ROSTER
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase">
                    🟢 Available: {availableTechniciansList.length}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase">
                    🟡 Busy On Site: {busyTechniciansList.length}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase">
                    🔴 Absent: {absentTechniciansList.length}
                  </span>
                </div>
              </div>

              {/* Roster Grid */}
              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                
                {/* 1. AVAILABLE TECHNICIANS */}
                {availableTechniciansList.map((tech, idx) => (
                  <div 
                    key={`avail-${tech.id || idx}`}
                    className="bg-emerald-50/40 hover:bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div 
                        className="shrink-0 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xs bg-emerald-100 flex items-center justify-center"
                        style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
                      >
                        {getTechPhoto(tech) ? (
                          <img 
                            src={getTechPhoto(tech)} 
                            alt={tech.name} 
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-emerald-800 font-black text-lg">
                            {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-900 truncate tracking-tight uppercase">
                          {tech.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                          <FiPhone size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{tech.phone || 'Ready for Call'}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-emerald-700 truncate">
                            Punched In • ID: {tech.id || `TC-${100 + idx}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black font-mono shrink-0 shadow-2xs">
                            ₹ Month: ₹{getTechMonthEarning(tech).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-wider inline-block shadow-xs">
                        AVAILABLE
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-700 block mt-1">
                        ● Ready for Dispatch
                      </span>
                    </div>
                  </div>
                ))}

                {/* 2. BUSY TECHNICIANS */}
                {busyTechniciansList.map((tech, idx) => (
                  <div 
                    key={`busy-${tech.id || idx}`}
                    className="bg-amber-50/40 hover:bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div 
                        className="shrink-0 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xs bg-amber-100 flex items-center justify-center"
                        style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
                      >
                        {getTechPhoto(tech) ? (
                          <img 
                            src={getTechPhoto(tech)} 
                            alt={tech.name} 
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-amber-800 font-black text-lg">
                            {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-900 truncate tracking-tight uppercase">
                          {tech.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                          <FiPhone size={12} className="text-amber-600 shrink-0" />
                          <span className="truncate">{tech.phone || 'On Field Job'}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-amber-700 truncate">
                            Active Installation Site
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black font-mono shrink-0 shadow-2xs">
                            ₹ Month: ₹{getTechMonthEarning(tech).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-black uppercase tracking-wider inline-block shadow-xs">
                        BUSY (ON SITE)
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-700 block mt-1">
                        ● Working on Site
                      </span>
                    </div>
                  </div>
                ))}

                {/* 3. ABSENT TECHNICIANS */}
                {absentTechniciansList.map((tech, idx) => (
                  <div 
                    key={`abs-${tech.id || idx}`}
                    className="bg-slate-50/90 hover:bg-rose-50/40 border-2 border-slate-200 hover:border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all opacity-80 hover:opacity-100"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div 
                        className="shrink-0 rounded-2xl overflow-hidden border-2 border-rose-300 shadow-2xs bg-rose-100 flex items-center justify-center"
                        style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
                      >
                        {getTechPhoto(tech) ? (
                          <img 
                            src={getTechPhoto(tech)} 
                            alt={tech.name} 
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-rose-700 font-black text-lg">
                            {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-900 truncate tracking-tight uppercase">
                          {tech.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                          <FiPhone size={12} className="text-rose-500 shrink-0" />
                          <span className="truncate">{tech.phone || 'No phone registered'}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold text-slate-400 truncate">
                            Field Tech • ID: {tech.id || `TC-${100 + idx}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black font-mono shrink-0 shadow-2xs">
                            ₹ Month: ₹{getTechMonthEarning(tech).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

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
            SLIDE 2: THIS MONTH TOP EARNERS & PAYOUTS (FLIPKART PRO LEADERBOARD)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 2 && (
          <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            {/* Top Stat Ribbon (Compact, Sleek, Single-Line) */}
            <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  ₹
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    MONTHLY EARNINGS LEADERBOARD
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase">
                      {currentMonthLabel}
                    </span>
                  </h2>
                  <p className="text-[10px] font-medium text-slate-500">
                    Live payouts calculated from completed & approved field installations
                  </p>
                </div>
              </div>

              {/* Compact Badges */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-50 border border-slate-200/90 px-3 py-1 rounded-lg shadow-2xs flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Payout:</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">₹{totalMonthlyPayout.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg shadow-2xs flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-amber-800 uppercase">Top Earner:</span>
                  <span className="text-xs font-black text-amber-900 font-mono">{topEarner?.name || 'N/A'} (₹{(topEarner?.monthlyEarnings || 0).toLocaleString('en-IN')})</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg shadow-2xs flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Completed:</span>
                  <span className="text-xs font-black text-blue-900 font-mono">{totalMonthlyJobsCount} Jobs</span>
                </div>
              </div>
            </div>

            {/* Split Arena: Left 7 Cols Podium, Right 5 Cols Standings Table */}
            <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
              
              {/* ── LEFT 7 COLS: PODIUM ARENA (Top 3 Performers) ── */}
              <div className="col-span-7 bg-white rounded-2xl border border-slate-200 p-3 flex flex-col shadow-2xs overflow-hidden min-h-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FiAward className="text-amber-500" size={14} />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      TOP 3 PERFORMERS PODIUM
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    ● Real-Time Sync
                  </span>
                </div>

                {/* 3 Podium Pillars: #2 Silver, #1 Gold (Center Elevated), #3 Bronze */}
                <div className="flex-1 grid grid-cols-3 gap-2.5 min-h-0 items-end pb-0.5 pt-2">
                  
                  {/* 🥈 #2 SILVER EARNER */}
                  {topEarnersList[1] && (
                    <div className="h-[90%] bg-gradient-to-b from-slate-50 via-white to-slate-100/60 border border-slate-300 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-2xs relative">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[9px] font-black uppercase flex items-center gap-1 shadow-2xs">
                        🥈 RANK #2
                      </span>

                      {/* Avatar 48px */}
                      <div className="relative my-0.5">
                        <div 
                          className="rounded-full border-2 border-slate-300 shadow-xs bg-slate-100 flex items-center justify-center overflow-hidden"
                          style={{ width: '48px', height: '48px' }}
                        >
                          {getTechPhoto(topEarnersList[1]) ? (
                            <img 
                              src={getTechPhoto(topEarnersList[1])} 
                              alt={topEarnersList[1]?.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-slate-700 font-black text-base">
                              {(topEarnersList[1]?.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-slate-700 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                          2
                        </span>
                      </div>

                      <div className="text-center w-full px-1">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                          {topEarnersList[1]?.name}
                        </h4>
                        <span className="text-[9px] font-semibold text-slate-500 block truncate">
                          Technician • ⭐ 4.9
                        </span>
                      </div>

                      {/* Earnings Pill */}
                      <div className="w-full bg-slate-100 rounded-lg p-1.5 border border-slate-200/80 text-center">
                        <div className="text-base font-black text-emerald-600 font-mono">
                          ₹{topEarnersList[1]?.monthlyEarnings.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          This Month
                        </div>
                        <div className="mt-1 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[9px]">
                          <span className="font-bold text-blue-700">{topEarnersList[1]?.monthCompletedCount} Jobs</span>
                          <span className="font-semibold text-slate-500">Tot: ₹{topEarnersList[1]?.totalEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🥇 #1 GOLD CHAMPION EARNER (CENTER - ELEVATED) */}
                  {topEarnersList[0] && (
                    <div className="h-[98%] bg-gradient-to-b from-amber-50/80 via-white to-emerald-50/40 border-2 border-amber-400 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm relative scale-[1.02] z-10">
                      {/* Floating Crown */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-base">
                        👑
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-xs mt-0.5">
                        🥇 TOP EARNER #1
                      </span>

                      {/* Avatar 58px */}
                      <div className="relative my-0.5">
                        <div 
                          className="rounded-full border-2 border-amber-400 ring-3 ring-amber-200/60 shadow-sm bg-amber-100 flex items-center justify-center overflow-hidden"
                          style={{ width: '58px', height: '58px' }}
                        >
                          {getTechPhoto(topEarnersList[0]) ? (
                            <img 
                              src={getTechPhoto(topEarnersList[0])} 
                              alt={topEarnersList[0]?.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-amber-800 font-black text-lg tracking-wider">
                              {(topEarnersList[0]?.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs border border-white">
                          1
                        </span>
                      </div>

                      <div className="text-center w-full px-1">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                          {topEarnersList[0]?.name}
                        </h4>
                        <span className="text-[9px] font-bold text-amber-700 block truncate">
                          ⭐ Lead Tech • 5.0 Rating
                        </span>
                      </div>

                      {/* Mega Earnings Pill */}
                      <div className="w-full bg-emerald-50 rounded-lg p-2 border border-emerald-300 text-center shadow-2xs">
                        <div className="text-xl font-black text-emerald-700 font-mono tracking-tight">
                          ₹{topEarnersList[0]?.monthlyEarnings.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[8px] font-black text-emerald-900 uppercase tracking-wider">
                          Highest Payout ({currentMonthLabel})
                        </div>
                        <div className="mt-1 pt-1 border-t border-emerald-200 flex items-center justify-between text-[9px]">
                          <span className="font-black text-blue-800">{topEarnersList[0]?.monthCompletedCount} Completed Jobs</span>
                          <span className="font-extrabold text-emerald-800">Tot: ₹{topEarnersList[0]?.totalEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🥉 #3 BRONZE EARNER */}
                  {topEarnersList[2] && (
                    <div className="h-[86%] bg-gradient-to-b from-orange-50/40 via-white to-amber-100/30 border border-amber-600/30 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-2xs relative">
                      <span className="px-2 py-0.5 rounded-md bg-amber-700/20 text-amber-900 text-[9px] font-black uppercase flex items-center gap-1 shadow-2xs">
                        🥉 RANK #3
                      </span>

                      {/* Avatar 48px */}
                      <div className="relative my-0.5">
                        <div 
                          className="rounded-full border-2 border-amber-700/40 shadow-xs bg-orange-100/70 flex items-center justify-center overflow-hidden"
                          style={{ width: '48px', height: '48px' }}
                        >
                          {getTechPhoto(topEarnersList[2]) ? (
                            <img 
                              src={getTechPhoto(topEarnersList[2])} 
                              alt={topEarnersList[2]?.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-amber-900 font-black text-base">
                              {(topEarnersList[2]?.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-amber-800 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                          3
                        </span>
                      </div>

                      <div className="text-center w-full px-1">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                          {topEarnersList[2]?.name}
                        </h4>
                        <span className="text-[9px] font-semibold text-slate-500 block truncate">
                          Technician • ⭐ 5.0
                        </span>
                      </div>

                      {/* Earnings Pill */}
                      <div className="w-full bg-orange-50 rounded-lg p-1.5 border border-amber-200 text-center">
                        <div className="text-base font-black text-emerald-600 font-mono">
                          ₹{topEarnersList[2]?.monthlyEarnings.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          This Month
                        </div>
                        <div className="mt-1 pt-1 border-t border-amber-200/80 flex items-center justify-between text-[9px]">
                          <span className="font-bold text-blue-700">{topEarnersList[2]?.monthCompletedCount} Jobs</span>
                          <span className="font-semibold text-slate-500">Tot: ₹{topEarnersList[2]?.totalEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ── RIGHT 5 COLS: FULL TEAM STANDINGS TABLE (FLIPKART LEADERBOARD STYLE) ── */}
              <div className="col-span-5 bg-white rounded-2xl border border-slate-200 p-3 flex flex-col shadow-2xs overflow-hidden min-h-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FiDollarSign className="text-emerald-600" size={14} />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      TEAM STANDINGS (RANKS #4 - #{topEarnersList.length})
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">
                    {currentMonthLabel}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-1 min-h-0 overflow-hidden">
                  {topEarnersList.slice(3).map((tech, idx) => (
                    <div 
                      key={tech.id || idx}
                      className="bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-black text-[9px] flex items-center justify-center shrink-0">
                          #{idx + 4}
                        </span>

                        <div 
                          className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center shrink-0 shadow-2xs"
                        >
                          {getTechPhoto(tech) ? (
                            <img src={getTechPhoto(tech)} alt={tech.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-700 font-black text-[9px]">
                              {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-[11px] font-black text-slate-900 truncate uppercase">
                            {tech.name}
                          </h5>
                          <p className="text-[9px] font-medium text-slate-500 truncate">
                            {tech.monthCompletedCount} jobs completed
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600 font-mono block">
                          ₹{tech.monthlyEarnings.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[8px] font-medium text-slate-400 block">
                          Total: ₹{tech.totalEarnings.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SLIDE 3: THIS MONTH PERFORMANCE LEADERBOARD (COMPLETED JOBS & RATINGS - NO EARNINGS)
            ══════════════════════════════════════════════════════════════════ */}
        {currentSlide === 3 && (
          <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            {/* Top Ribbon */}
            <div className="flex items-center justify-between bg-amber-50/90 px-4 py-2 rounded-xl border border-amber-200 shadow-2xs shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏆</span>
                <div>
                  <h2 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    TECHNICIAN PERFORMANCE LEADERBOARD • {currentMonthLabel}
                  </h2>
                  <p className="text-[10px] font-medium text-amber-800">
                    Ranked by completed installations this month & 5-star customer ratings
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                {currentMonthLabel} RANKINGS
              </span>
            </div>

            {/* Olympic Victory Podium Arena (Top 3) + All-Team Leaderboard (Ranks 4-8) */}
            <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
              
              {/* ── LEFT 7 COLS: OLYMPIC PODIUM (Top 3) ── */}
              <div className="col-span-7 bg-white rounded-2xl border border-slate-200 p-3 flex flex-col shadow-2xs overflow-hidden min-h-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FiAward className="text-amber-500" size={14} />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      TOP 3 PERFORMERS ({currentMonthLabel})
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.2 rounded">
                    Honor Roll
                  </span>
                </div>

                {/* 3 Podium Pillars: #2 Silver, #1 Gold (Center Elevated), #3 Bronze */}
                <div className="flex-1 grid grid-cols-3 gap-2.5 min-h-0 items-end pb-0.5 pt-2">
                  
                  {/* 🥈 #2 SILVER (LEFT) */}
                  {rankedTechnicians[1] && (
                    <div className="h-[90%] bg-gradient-to-b from-slate-50 via-white to-slate-100 border border-slate-300 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-2xs relative">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[9px] font-black uppercase flex items-center gap-1 shadow-2xs">
                        🥈 RANK #2
                      </span>

                      {/* Circular Avatar */}
                      <div className="relative my-0.5">
                        <div 
                          className="rounded-full border-2 border-slate-300 shadow-xs bg-slate-100 flex items-center justify-center overflow-hidden"
                          style={{ width: '48px', height: '48px' }}
                        >
                          {getTechPhoto(rankedTechnicians[1]) ? (
                            <img 
                              src={getTechPhoto(rankedTechnicians[1])} 
                              alt={rankedTechnicians[1]?.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-slate-700 font-black text-base">
                              {(rankedTechnicians[1]?.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-slate-700 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                          2
                        </span>
                      </div>

                      <div className="text-center w-full px-1">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                          {rankedTechnicians[1]?.name}
                        </h4>
                        <div className="flex items-center justify-center gap-0.5 text-amber-500 text-[10px] font-bold mt-0.5">
                          <FiStar fill="currentColor" size={10} />
                          <span>{rankedTechnicians[1]?.rating || '4.9'} Rating</span>
                        </div>
                      </div>

                      {/* Metrics Pill (NO EARNINGS) */}
                      <div className="w-full bg-slate-100 rounded-lg p-1.5 border border-slate-200/80 text-center">
                        <div className="text-base font-black text-slate-900 font-mono">
                          {rankedTechnicians[1]?.monthCompletedCount || 0}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          Jobs Completed ({currentMonthLabel})
                        </div>
                        <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px]">
                          <span className="font-bold text-blue-700">★ High SLA</span>
                          <span className="font-bold text-slate-700">★ Pro Tech</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🥇 #1 GOLD CHAMPION (CENTER - ELEVATED) */}
                  {rankedTechnicians[0] && (
                    <div className="h-[98%] bg-gradient-to-b from-amber-50/80 via-white to-amber-100/40 border-2 border-amber-400 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-sm relative scale-[1.02] z-10">
                      {/* Floating Crown 👑 */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-base">
                        👑
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-xs mt-0.5">
                        🥇 CHAMPION #1
                      </span>

                      {/* Avatar */}
                      <div className="relative my-0.5">
                        <div 
                          className="rounded-full border-2 border-amber-400 ring-3 ring-amber-200/60 shadow-sm bg-amber-100 flex items-center justify-center overflow-hidden"
                          style={{ width: '58px', height: '58px' }}
                        >
                          {getTechPhoto(rankedTechnicians[0]) ? (
                            <img 
                              src={getTechPhoto(rankedTechnicians[0])} 
                              alt={rankedTechnicians[0]?.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-amber-800 font-black text-lg tracking-wider">
                              {(rankedTechnicians[0]?.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs border border-white">
                          1
                        </span>
                      </div>

                      <div className="text-center w-full px-1">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                          {rankedTechnicians[0]?.name}
                        </h4>
                        <div className="flex items-center justify-center gap-1 text-amber-600 text-[10px] font-bold mt-0.5">
                          <FiStar fill="currentColor" size={11} />
                          <span>{rankedTechnicians[0]?.rating || '5.0'} (Top Performer)</span>
                        </div>
                      </div>

                      {/* Metrics Pill (NO EARNINGS) */}
                      <div className="w-full bg-amber-100/80 rounded-lg p-2 border border-amber-300/80 text-center">
                        <div className="text-lg font-black text-amber-950 font-mono">
                          {rankedTechnicians[0]?.monthCompletedCount || 0}
                        </div>
                        <div className="text-[8px] font-black text-amber-900 uppercase tracking-wider">
                          Installations Done ({currentMonthLabel})
                        </div>
                        <div className="mt-1 pt-1 border-t border-amber-200 flex items-center justify-between text-[9px]">
                          <span className="font-extrabold text-amber-900">⭐ 100% On-Time SLA</span>
                          <span className="font-extrabold text-amber-900">🏆 Field MVP</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🥉 #3 BRONZE (RIGHT) */}
                  {rankedTechnicians[2] && (
                    <div className="h-[86%] bg-gradient-to-b from-orange-50/40 via-white to-amber-100/30 border border-amber-600/30 rounded-xl p-2.5 flex flex-col items-center justify-between shadow-2xs relative">
                      <span className="px-2 py-0.5 rounded-md bg-amber-700/20 text-amber-900 text-[9px] font-black uppercase flex items-center gap-1 shadow-2xs">
                        🥉 RANK #3
                      </span>

                      {/* Avatar */}
                      <div className="relative my-0.5">
                        <div 
                          className="rounded-full border-2 border-amber-700/40 shadow-xs bg-orange-100/70 flex items-center justify-center overflow-hidden"
                          style={{ width: '48px', height: '48px' }}
                        >
                          {getTechPhoto(rankedTechnicians[2]) ? (
                            <img 
                              src={getTechPhoto(rankedTechnicians[2])} 
                              alt={rankedTechnicians[2]?.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-amber-900 font-black text-base">
                              {(rankedTechnicians[2]?.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-amber-800 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                          3
                        </span>
                      </div>

                      <div className="text-center w-full px-1">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase truncate">
                          {rankedTechnicians[2]?.name}
                        </h4>
                        <div className="flex items-center justify-center gap-0.5 text-amber-600 text-[10px] font-bold mt-0.5">
                          <FiStar fill="currentColor" size={10} />
                          <span>{rankedTechnicians[2]?.rating || '4.8'} Rating</span>
                        </div>
                      </div>

                      {/* Metrics Pill (NO EARNINGS) */}
                      <div className="w-full bg-orange-50 rounded-lg p-1.5 border border-amber-200 text-center">
                        <div className="text-base font-black text-slate-900 font-mono">
                          {rankedTechnicians[2]?.monthCompletedCount || 0}
                        </div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          Jobs Completed ({currentMonthLabel})
                        </div>
                        <div className="mt-1 pt-1 border-t border-amber-200/80 flex items-center justify-between text-[9px]">
                          <span className="font-bold text-amber-800">★ CCTV Pro</span>
                          <span className="font-bold text-amber-700">⭐ {rankedTechnicians[2]?.rating || '4.8'} Star</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ── RIGHT 5 COLS: FULL TEAM LEADERBOARD (Ranks #4 - #8) ── */}
              <div className="col-span-5 bg-white rounded-2xl border border-slate-200 p-3 flex flex-col shadow-2xs overflow-hidden min-h-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FiUsers className="text-blue-600" size={14} />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      TEAM STANDINGS ({currentMonthLabel})
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">
                    Jobs Completed
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-1 min-h-0 overflow-hidden">
                  {rankedTechnicians.slice(3).map((tech, idx) => (
                    <div 
                      key={tech.id || idx}
                      className="bg-slate-50/80 hover:bg-blue-50/40 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-black text-[9px] flex items-center justify-center shrink-0">
                          #{idx + 4}
                        </span>

                        <div 
                          className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center shrink-0 shadow-2xs"
                        >
                          {getTechPhoto(tech) ? (
                            <img src={getTechPhoto(tech)} alt={tech.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-700 font-bold text-[9px]">
                              {(tech.name || 'TC').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-[11px] font-black text-slate-900 truncate uppercase">
                            {tech.name}
                          </h5>
                          <p className="text-[9px] font-medium text-slate-500 truncate">
                            {tech.badge || 'Field Technician'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 font-mono block">
                          {tech.monthCompletedCount || 0} Jobs
                        </span>
                        <span className="text-[9px] font-bold text-amber-600 flex items-center justify-end gap-0.5">
                          <FiStar size={9} fill="currentColor" />
                          <span>{tech.rating || '5.0'} Rating</span>
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
            <span className="text-yellow-300 font-bold">💰 TOP EARNER THIS MONTH: {topEarner?.name || 'SARAN KUMAR'} (₹{(topEarner?.monthlyEarnings || 0).toLocaleString('en-IN')} • {topEarner?.monthCompletedCount || 0} JOBS)</span>
            <span>•</span>
            <span className="text-emerald-300 font-bold">💵 TOTAL MONTH PAYOUT: ₹{totalMonthlyPayout.toLocaleString('en-IN')}</span>
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
