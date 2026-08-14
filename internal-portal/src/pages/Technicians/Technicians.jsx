import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateTechnicianStatus, addTechnician, editTechnician } from '../../redux/dashboardSlice';
import { 
  FiSliders, FiPhone, FiMail, FiStar, FiUserCheck, FiPlus, 
  FiChevronDown, FiGrid, FiList, FiSearch, FiEdit, FiInfo,
  FiEye, FiEyeOff
} from 'react-icons/fi';
import Modal from '../../components/Modal';

export default function Technicians() {
  const dispatch = useDispatch();
  const technicians = useSelector(state => state.dashboard.technicians);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  
  const [techForm, setTechForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    password: '',
    specialization: 'IP Cameras & Networking',
    avatarUrl: ''
  });

  const [editingTech, setEditingTech] = useState(null);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditingTech({ ...editingTech, avatarUrl: reader.result });
        } else {
          setTechForm({ ...techForm, avatarUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getTechAvatar = (tech) => {
    if (tech.avatarUrl) return tech.avatarUrl;
    const initialAvatars = {
      'TECH-01': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
      'TECH-02': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
      'TECH-03': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
      'TECH-04': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop'
    };
    return initialAvatars[tech.id] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500';
      case 'Busy': return 'bg-amber-500';
      case 'Offline': return 'bg-red-500';
      case 'Leave': return 'bg-slate-400';
      default: return 'bg-slate-350';
    }
  };

  const handleStatusChange = (techId, newStatus) => {
    dispatch(updateTechnicianStatus({ id: techId, status: newStatus }));
  };

  const handleAddTech = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: techForm.name,
          email: techForm.email,
          phone: techForm.phone,
          password: techForm.password || 'password123', // fallback password
          role: 'TECHNICIAN',
          specialties: [techForm.specialization]
        })
      });
      const data = await response.json();
      if (data.success) {
        // Now fetch dashboard data to get the newly added technician from DB
        const { fetchDashboardData } = await import('../../redux/dashboardSlice');
        dispatch(fetchDashboardData());
        
        setTechForm({ 
          name: '', 
          phone: '', 
          email: '', 
          password: '',
          specialization: 'IP Cameras & Networking',
          avatarUrl: ''
        });
        setModalOpen(false);
      } else {
        alert('Error adding technician: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to add technician:', error);
      alert('Error connecting to server');
    }
  };

  const handleEditTechClick = (tech) => {
    setEditingTech({
      id: tech.id,
      name: tech.name,
      phone: tech.phone,
      email: tech.email,
      password: tech.password || '',
      specialization: tech.specialization,
      avatarUrl: tech.avatarUrl || ''
    });
    setEditModalOpen(true);
  };

  const handleEditTechSubmit = (e) => {
    e.preventDefault();
    dispatch(editTechnician(editingTech));
    setEditModalOpen(false);
    setEditingTech(null);
  };

  const filteredTechnicians = technicians.filter(tech => {
    return tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tech.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tech.phone.includes(searchTerm);
  });

  const themes = [
    {
      border: 'border-t-4 border-t-blue-500',
      avatar: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      specialization: 'text-blue-600 dark:text-blue-400',
      jobText: 'text-blue-600 dark:text-blue-400'
    },
    {
      border: 'border-t-4 border-t-emerald-500',
      avatar: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      specialization: 'text-emerald-600 dark:text-emerald-400',
      jobText: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      border: 'border-t-4 border-t-amber-500',
      avatar: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      specialization: 'text-amber-600 dark:text-amber-400',
      jobText: 'text-amber-600 dark:text-amber-400'
    },
    {
      border: 'border-t-4 border-t-purple-500',
      avatar: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      specialization: 'text-purple-600 dark:text-purple-400',
      jobText: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header controls (Search & Toggle layout) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FiSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search technicians by name, skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/50">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-650 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Card Grid View"
            >
              <FiGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-650 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table List View"
            >
              <FiList size={15} />
            </button>
          </div>

          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FiPlus /> Add Technician
          </button>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <>
          {/* 📱 Mobile Card View (block md:hidden) - Modern Team List Cards */}
          <div className="block md:hidden space-y-3">
            {filteredTechnicians.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                No technicians match the active filters.
              </div>
            ) : (
              filteredTechnicians.map((tech, idx) => {
                const theme = themes[idx % themes.length];
                return (
                  <div key={`mob-tech-${tech.id}`} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                    {/* Header Row: ID, Rating & Avatar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200">
                          <img src={getTechAvatar(tech)} alt={tech.name} className="w-full h-full object-cover" />
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${getStatusColor(tech.status)}`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{tech.name}</h4>
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60">
                              <FiStar className="text-amber-500 fill-amber-500 w-3 h-3" /> {tech.rating}
                            </span>
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.specialization}`}>{tech.specialization}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleEditTechClick(tech)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        <FiEdit size={14} />
                      </button>
                    </div>

                    {/* Contact Info & Job Status */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="truncate">📞 {tech.phone} • ✉️ {tech.email}</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        Assigned Job: <strong className={tech.currentProject !== 'None' ? theme.jobText : 'text-slate-700 dark:text-slate-200'}>{tech.currentProject}</strong>
                      </p>
                    </div>

                    {/* Status Dropdown selector */}
                    <div className="relative flex items-center pt-1">
                      <span className={`absolute left-3 w-2 h-2 rounded-full ${getStatusColor(tech.status)}`} />
                      <select
                        value={tech.status}
                        onChange={(e) => handleStatusChange(tech.id, e.target.value)}
                        className="w-full text-xs pl-7 pr-8 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-primary appearance-none cursor-pointer font-bold"
                      >
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                        <option value="Offline">Offline</option>
                        <option value="Leave">Leave</option>
                      </select>
                      <FiChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 💻 Desktop Grid View (hidden md:grid) */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredTechnicians.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-450 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                No technicians match the active filters.
              </div>
            ) : (
              filteredTechnicians.map((tech, idx) => {
                const theme = themes[idx % themes.length];
                return (
                  <div key={tech.id} className={`bg-white dark:bg-slate-900 rounded-xl border-x border-b border-x-slate-100 border-b-slate-100 dark:border-x-slate-800 dark:border-b-slate-800 shadow-xs p-3 flex flex-col justify-between transition-colors ${theme.border}`}>
                    <div>
                      {/* Profile header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{tech.id}</span>
                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          <FiStar className="text-amber-400 fill-amber-400 w-3 h-3" /> {tech.rating}
                        </span>
                      </div>

                      {/* Name & Specialization */}
                      <div className="mt-1 text-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto relative overflow-hidden">
                          <img 
                            src={getTechAvatar(tech)} 
                            alt={tech.name} 
                            className="w-full h-full object-cover rounded-full"
                          />
                          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${getStatusColor(tech.status)}`} />
                        </div>
                        <h4 className="font-bold text-slate-850 dark:text-slate-100 text-xs mt-1 leading-tight">{tech.name}</h4>
                        <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wide truncate ${theme.specialization}`}>{tech.specialization}</p>
                      </div>

                      {/* Info Details */}
                      <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium text-left">
                        <div className="flex items-center gap-1.5">
                          <FiMail className="text-slate-400 w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{tech.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FiPhone className="text-slate-400 w-3 h-3 flex-shrink-0" />
                          <span>{tech.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">JOB:</span>
                          <span className={`font-semibold truncate text-[11px] ${tech.currentProject !== 'None' ? theme.jobText : 'text-slate-700 dark:text-slate-300'}`}>{tech.currentProject}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions / Status selector */}
                    <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-1.5">
                      <div className="text-left">
                        <div className="relative flex items-center">
                          <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${getStatusColor(tech.status)}`} />
                          <select
                            value={tech.status}
                            onChange={(e) => handleStatusChange(tech.id, e.target.value)}
                            className="w-full text-[11px] pl-6 pr-6 py-1 border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-lg focus:outline-none focus:border-primary appearance-none cursor-pointer font-semibold"
                          >
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="Offline">Offline</option>
                            <option value="Leave">Leave</option>
                          </select>
                          <FiChevronDown className="absolute right-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <button 
                        onClick={() => handleEditTechClick(tech)}
                        className="w-full flex items-center justify-center gap-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <FiEdit size={11} /> Edit Profile
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* List Mode - Tabular View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto min-w-full">
            {filteredTechnicians.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-xs font-medium">
                No technicians match the active filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 whitespace-nowrap w-28">Technician ID</th>
                    <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">Technician</th>
                    <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">Specialization</th>
                    <th className="py-3.5 px-4 min-w-[240px] whitespace-nowrap">Contact Info</th>
                    <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">Current Job</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-24">Rating</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap w-44">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                  {filteredTechnicians.map((tech, idx) => {
                    const theme = themes[idx % themes.length];
                    return (
                      <tr 
                        key={tech.id} 
                        onClick={() => handleEditTechClick(tech)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4 align-middle font-mono font-bold text-slate-500 whitespace-nowrap">{tech.id}</td>
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden shrink-0">
                              <img 
                                src={getTechAvatar(tech)} 
                                alt={tech.name} 
                                className="w-full h-full object-cover rounded-full"
                              />
                              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${getStatusColor(tech.status)}`} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-primary transition-colors whitespace-nowrap">{tech.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-block whitespace-nowrap">
                            {tech.specialization}
                          </span>
                        </td>
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{tech.email}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5 font-sans whitespace-nowrap">{tech.phone}</div>
                        </td>
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <span className={`font-semibold text-xs whitespace-nowrap ${tech.currentProject !== 'None' ? theme.jobText : 'text-slate-700 dark:text-slate-300'}`}>
                            {tech.currentProject}
                          </span>
                        </td>
                        <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <FiStar className="text-amber-400 fill-amber-400 w-3.5 h-3.5" /> {tech.rating}
                          </span>
                        </td>
                        <td className="py-4 px-4 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-flex items-center justify-end min-w-[130px]">
                            <span className={`absolute left-3 w-2 h-2 rounded-full z-10 pointer-events-none ${getStatusColor(tech.status)}`} />
                            <select
                              value={tech.status}
                              onChange={(e) => handleStatusChange(tech.id, e.target.value)}
                              className="text-[11px] pl-7 pr-7 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:border-primary appearance-none cursor-pointer font-bold transition-all shadow-xs"
                            >
                              <option value="Available">Available</option>
                              <option value="Busy">Busy</option>
                              <option value="Offline">Offline</option>
                              <option value="Leave">Leave</option>
                            </select>
                            <FiChevronDown className="absolute right-2.5 text-slate-400 pointer-events-none w-3.5 h-3.5" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal Add Technician */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Onboard New Technician">
        <form onSubmit={handleAddTech} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Manoj Dev" 
              value={techForm.name}
              onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
              <input 
                required
                type="text" 
                placeholder="+91 9XXXX XXXXX" 
                value={techForm.phone}
                onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email ID</label>
              <input 
                required
                type="email" 
                placeholder="tech@sktechnology.in" 
                value={techForm.email}
                onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Specialization Field</label>
              <select 
                value={techForm.specialization}
                onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option>IP Cameras & Networking</option>
                <option>Analog Systems & Cabling</option>
                <option>DVR/NVR Troubleshooting</option>
                <option>PTZ Cameras & Fiber Optics</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Login Password</label>
              <div className="relative">
                <input 
                  required
                  type={showAddPassword ? "text" : "password"} 
                  placeholder="Min 6 characters" 
                  value={techForm.password}
                  onChange={(e) => setTechForm({ ...techForm, password: e.target.value })}
                  className="w-full text-xs p-2.5 pr-10 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showAddPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Upload Profile Photo</label>
            <div className="flex items-center gap-4 border border-dashed border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 transition-colors">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {techForm.avatarUrl ? (
                  <img src={techForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiUserCheck className="text-slate-400 w-6 h-6" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-slate-755 dark:text-slate-200">Add technician picture</p>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Supports PNG, JPG, or GIF formats</p>
                <label className="inline-block mt-2 cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                  Choose Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Onboard Technician
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Technician */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Technician Details">
        {editingTech && (
          <form onSubmit={handleEditTechSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
              <input 
                required
                type="text" 
                value={editingTech.name}
                onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
                <input 
                  required
                  type="text" 
                  value={editingTech.phone}
                  onChange={(e) => setEditingTech({ ...editingTech, phone: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email ID</label>
                <input 
                  required
                  type="email" 
                  value={editingTech.email}
                  onChange={(e) => setEditingTech({ ...editingTech, email: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Specialization Field</label>
                <select 
                  value={editingTech.specialization}
                  onChange={(e) => setEditingTech({ ...editingTech, specialization: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                >
                  <option>IP Cameras & Networking</option>
                  <option>Analog Systems & Cabling</option>
                  <option>DVR/NVR Troubleshooting</option>
                  <option>PTZ Cameras & Fiber Optics</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Login Password</label>
                <div className="relative">
                  <input 
                    required
                    type={showEditPassword ? "text" : "password"} 
                    placeholder="Min 6 characters" 
                    value={editingTech.password}
                    onChange={(e) => setEditingTech({ ...editingTech, password: e.target.value })}
                    className="w-full text-xs p-2.5 pr-10 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showEditPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Upload Profile Photo</label>
              <div className="flex items-center gap-4 border border-dashed border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 transition-colors">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {editingTech.avatarUrl ? (
                    <img src={editingTech.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FiUserCheck className="text-slate-400 w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-slate-755 dark:text-slate-200">Change technician picture</p>
                  <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Supports PNG, JPG, or GIF formats</p>
                  <label className="inline-block mt-2 cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                    Choose Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, true)} 
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Save Details
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
