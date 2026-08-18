import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiActivity, FiCheckCircle, FiClock, FiUsers, FiPhoneCall, 
  FiMapPin, FiSend, FiZap, FiPlusCircle, FiTrendingUp, FiFilter,
  FiAlertCircle, FiSearch, FiRefreshCw, FiExternalLink
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Workstation() {
  const techniciansFromStore = useSelector(state => state.dashboard.technicians) || [];
  const ordersFromStore = useSelector(state => state.dashboard.orders) || [];

  const [filterCategory, setFilterCategory] = useState('All'); // 'All', 'On Site', 'Available', 'High Performers'
  const [selectedTechForAssign, setSelectedTechForAssign] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignedJobCode, setAssignedJobCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Stock Market style Hourly Performance Wave Data for Technicians
  const sampleTechsData = [
    {
      id: 'TECH-01',
      name: 'Kathir',
      phone: '9876543210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
      status: 'ON_SITE',
      statusText: '🟢 ON SITE - CCTV INSTALLATION',
      activeJobCode: 'SK-ORD-50527',
      customerName: 'Rithvik',
      location: '12, 3rd Cross Street, Anna Nagar, Chennai',
      checkInTime: '08:45 AM',
      elapsedHours: '6h 30m',
      assignedToday: 4,
      completedToday: 3,
      pendingToday: 1,
      efficiencyScore: 98,
      chartData: [
        { time: '09:00', score: 20 },
        { time: '11:00', score: 65 },
        { time: '01:00', score: 80 },
        { time: '03:00', score: 95 },
        { time: '05:00', score: 98 },
      ]
    },
    {
      id: 'TECH-02',
      name: 'Kavin',
      phone: '9876543211',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
      status: 'IN_TRANSIT',
      statusText: '🔵 IN TRANSIT - EN ROUTE TO T. NAGAR',
      activeJobCode: 'SK-ORD-97502',
      customerName: 'erdty',
      location: 'Plot 45, North Street, T. Nagar, Chennai',
      checkInTime: '09:15 AM',
      elapsedHours: '5h 45m',
      assignedToday: 5,
      completedToday: 4,
      pendingToday: 1,
      efficiencyScore: 94,
      chartData: [
        { time: '09:00', score: 15 },
        { time: '11:00', score: 50 },
        { time: '01:00', score: 75 },
        { time: '03:00', score: 88 },
        { time: '05:00', score: 94 },
      ]
    },
    {
      id: 'TECH-03',
      name: 'Mari',
      phone: '9876543212',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
      status: 'COMPLETED_SHIFT',
      statusText: '🔥 4/4 JOBS COMPLETED TODAY',
      activeJobCode: 'GENERAL-MAINTENANCE',
      customerName: 'Internal Office',
      location: 'SK Technology HQ, Guindy, Chennai',
      checkInTime: '08:30 AM',
      elapsedHours: '7h 15m',
      assignedToday: 4,
      completedToday: 4,
      pendingToday: 0,
      efficiencyScore: 100,
      chartData: [
        { time: '09:00', score: 30 },
        { time: '11:00', score: 70 },
        { time: '01:00', score: 90 },
        { time: '03:00', score: 100 },
        { time: '05:00', score: 100 },
      ]
    },
    {
      id: 'TECH-04',
      name: 'Selvam',
      phone: '9876543213',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop',
      status: 'ON_SITE',
      statusText: '🟢 ON SITE - NVR CONFIGURATION',
      activeJobCode: 'SK-ORD-49883',
      customerName: 'Rithvik (Commercial Site)',
      location: 'Sector 5, OMR IT Highway, Chennai',
      checkInTime: '09:00 AM',
      elapsedHours: '6h 00m',
      assignedToday: 3,
      completedToday: 2,
      pendingToday: 1,
      efficiencyScore: 92,
      chartData: [
        { time: '09:00', score: 10 },
        { time: '11:00', score: 45 },
        { time: '01:00', score: 70 },
        { time: '03:00', score: 85 },
        { time: '05:00', score: 92 },
      ]
    },
    {
      id: 'TECH-05',
      name: 'Kavi',
      phone: '9876543214',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      status: 'STANDBY',
      statusText: '🟡 STANDBY - AVAILABLE FOR EMERGENCY ASSIGNMENT',
      activeJobCode: 'STANDBY-DUTY',
      customerName: 'HQ Standby Desk',
      location: 'Velachery Hub, Chennai',
      checkInTime: '09:30 AM',
      elapsedHours: '5h 30m',
      assignedToday: 2,
      completedToday: 2,
      pendingToday: 0,
      efficiencyScore: 89,
      chartData: [
        { time: '09:00', score: 25 },
        { time: '11:00', score: 55 },
        { time: '01:00', score: 75 },
        { time: '03:00', score: 89 },
        { time: '05:00', score: 89 },
      ]
    }
  ];

  // Combine store technicians if available
  const allTechnicians = sampleTechsData.map(st => {
    const match = techniciansFromStore.find(t => t.name?.toLowerCase().includes(st.name.toLowerCase()));
    if (match) {
      return {
        ...st,
        phone: match.phone || st.phone,
        avatar: match.avatarUrl || st.avatar,
      };
    }
    return st;
  });

  const filteredTechs = allTechnicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tech.activeJobCode.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterCategory === 'On Site') return matchesSearch && tech.status === 'ON_SITE';
    if (filterCategory === 'Available') return matchesSearch && (tech.status === 'STANDBY' || tech.status === 'COMPLETED_SHIFT');
    if (filterCategory === 'High Performers') return matchesSearch && tech.efficiencyScore >= 95;
    return matchesSearch;
  });

  const handleOpenAssignModal = (tech) => {
    setSelectedTechForAssign(tech);
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = (e) => {
    e.preventDefault();
    if (!assignedJobCode) {
      alert('Please enter a Job Code or Select an Order.');
      return;
    }
    alert(`✓ Emergency Order ${assignedJobCode} successfully dispatched to ${selectedTechForAssign?.name}! Notification sent via WhatsApp & App.`);
    setAssignModalOpen(false);
    setAssignedJobCode('');
  };

  return (
    <div className="space-y-6">
      
      {/* 📈 Stock Market Style Running Live Ticker Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center animate-pulse">
              <FiActivity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white font-mono uppercase">TECHNICIAN LIVE WORKSTATION COMMAND CENTER</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-extrabold rounded-full animate-pulse">
                  ● REAL-TIME RADAR LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Continuous live monitoring for Kathir, Kavin, Mari, Selvam & Kavi</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">FLEET EFFICIENCY INDEX</span>
              <span className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1 justify-end">
                <FiTrendingUp size={16} /> 96.8% <span className="text-[10px] text-emerald-500 font-medium">+2.4% Today</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">TOTAL COMPLETED TODAY</span>
              <span className="text-xl font-black font-mono text-white">16 / 18 Jobs</span>
            </div>
          </div>
        </div>

        {/* Live Stock Ticker Bar */}
        <div className="mt-3 pt-2 overflow-hidden bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/60 font-mono text-xs flex items-center gap-6">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold shrink-0 border-r border-slate-800 pr-4">
            <span>⚡ LIVE TICKER:</span>
          </div>
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap text-slate-300">
            {allTechnicians.map(t => (
              <span key={`ticker-${t.id}`} className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                <span className="font-bold text-white">{t.name}:</span>
                <span className={t.status === 'ON_SITE' ? 'text-emerald-400 font-semibold' : t.status === 'IN_TRANSIT' ? 'text-blue-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {t.statusText}
                </span>
                <span className="text-[10px] text-slate-500">[{t.efficiencyScore}% Eff.]</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search technician name or job code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 gap-1 overflow-x-auto">
          {['All', 'On Site', 'Available', 'High Performers'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {cat === 'All' ? '👥 All Techs (5)' : cat === 'On Site' ? '🟢 On Site (2)' : cat === 'Available' ? '🟡 Available (2)' : '⭐ High Performers (3)'}
            </button>
          ))}
        </div>
      </div>

      {/* 📺 Stock Market Style Technician Workstation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.map((tech) => (
          <div 
            key={tech.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
          >
            {/* Workstation Card Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-850">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={tech.avatar} 
                      alt={tech.name} 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                      tech.status === 'ON_SITE' ? 'bg-emerald-500' : tech.status === 'IN_TRANSIT' ? 'bg-blue-500' : 'bg-amber-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                      <span>{tech.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-2 py-0.5 rounded-md">
                        {tech.id}
                      </span>
                    </h3>
                    <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{tech.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">EFFICIENCY</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {tech.efficiencyScore}%
                  </span>
                </div>
              </div>

              {/* Status Banner Badge */}
              <div className="mt-3.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl text-xs font-mono font-extrabold flex items-center justify-between">
                <span className="truncate">{tech.statusText}</span>
                <span className="text-[10px] text-emerald-400 shrink-0 font-sans font-bold">ACTIVE</span>
              </div>
            </div>

            {/* 📈 Stock Market Hourly Performance Wave Chart */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <FiActivity size={12} className="text-blue-600" /> REAL-TIME HOURLY PRODUCTIVITY WAVE
                </span>
                <span className="text-[10px] font-mono text-slate-400">09 AM - 05 PM</span>
              </div>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tech.chartData}>
                    <defs>
                      <linearGradient id={`grad-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                      formatter={(val) => [`${val}% Efficiency`, 'Performance']}
                    />
                    <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill={`url(#grad-${tech.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today's Work Summary Matrix */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">ASSIGNED</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">{tech.assignedToday}</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">DONE</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{tech.completedToday}</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">PENDING</span>
                  <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">{tech.pendingToday}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 font-mono">
                  <span>Shift Completion</span>
                  <span>{Math.round((tech.completedToday / tech.assignedToday) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${(tech.completedToday / tech.assignedToday) * 100}%` }}
                  />
                </div>
              </div>

              {/* Active Job Information */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FiMapPin size={13} className="text-red-500" />
                    <span>{tech.activeJobCode}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold flex items-center gap-1">
                    <FiClock size={11} /> {tech.elapsedHours}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{tech.customerName}</p>
                <p className="text-[11px] text-slate-500 truncate">{tech.location}</p>
              </div>
            </div>

            {/* Quick Command Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <a
                href={`https://wa.me/91${tech.phone}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FiSend size={13} />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => handleOpenAssignModal(tech)}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FiPlusCircle size={13} />
                <span>Dispatch Job</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 📋 Live Fleet Monitoring Matrix & Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
              <span>📋 Technician Real-Time Fleet Matrix</span>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                5 Active Units
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">Live tracking matrix comparing daily completions, shift elapsed hours, and rating scores</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3">Live Status</th>
                <th className="py-3 px-3 text-center">Assigned / Done</th>
                <th className="py-3 px-3 text-center">Efficiency Score</th>
                <th className="py-3 px-3">Active Job & Location</th>
                <th className="py-3 px-3 text-center">Shift Elapsed</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {allTechnicians.map((tech) => (
                <tr key={`matrix-${tech.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3 align-middle font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <img src={tech.avatar} alt={tech.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <div>{tech.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 font-normal">{tech.phone}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 align-middle font-mono text-xs font-bold">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider border ${
                      tech.status === 'ON_SITE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      tech.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {tech.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 align-middle text-center font-mono font-black">
                    {tech.completedToday} / {tech.assignedToday} Jobs
                  </td>
                  <td className="py-3.5 px-3 align-middle text-center font-mono text-emerald-600 font-black text-sm">
                    {tech.efficiencyScore}%
                  </td>
                  <td className="py-3.5 px-3 align-middle">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{tech.activeJobCode}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{tech.location}</div>
                  </td>
                  <td className="py-3.5 px-3 align-middle text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {tech.elapsedHours}
                  </td>
                  <td className="py-3.5 px-3 align-middle text-right">
                    <button
                      onClick={() => handleOpenAssignModal(tech)}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs transition-all hover:bg-slate-800 cursor-pointer"
                    >
                      Assign Job
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Job Dispatch Modal */}
      {assignModalOpen && selectedTechForAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FiZap className="text-amber-500" />
                <span>Emergency Order Dispatch</span>
              </h3>
              <button 
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl flex items-center gap-3 border border-slate-200/60 dark:border-slate-700/60">
              <img src={selectedTechForAssign.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{selectedTechForAssign.name}</h4>
                <p className="text-xs text-slate-500 font-mono">Status: {selectedTechForAssign.statusText}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Order or Enter Job Code
                </label>
                <select
                  value={assignedJobCode}
                  onChange={(e) => setAssignedJobCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Active CCTV Order --</option>
                  {ordersFromStore.map(o => (
                    <option key={o.id || o._id} value={o.jobCode || o.id}>
                      {o.jobCode || o.id} - {o.customerName || o.customer} ({o.serviceType || 'CCTV Installation'})
                    </option>
                  ))}
                  <option value="EMERGENCY-SK-8899">EMERGENCY-SK-8899 (High Priority Service Call)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <FiZap size={14} />
                  <span>Dispatch Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
