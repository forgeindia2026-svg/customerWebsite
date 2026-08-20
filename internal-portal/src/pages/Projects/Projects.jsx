import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { adminApproveJob, reworkProject } from '../../redux/dashboardSlice';
import { FiCheck, FiRefreshCw, FiAlertCircle, FiUserCheck, FiCalendar, FiMapPin, FiLayers, FiEye, FiGrid, FiList, FiClock, FiFileText, FiChevronDown } from 'react-icons/fi';
import Modal from '../../components/Modal';

export default function Projects() {
  const dispatch = useDispatch();
  const projects = useSelector(state => state.dashboard.projects);
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All Technicians');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedProject, setSelectedProject] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40';
      case 'Rework':
        return 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-300 border border-red-100 dark:border-red-900/40';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-700';
    }
  };

  const getProjectTheme = (status) => {
    switch (status) {
      case 'Approved':
        return {
          idBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
          icon: () => (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          accentText: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'Pending':
        return {
          idBg: 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400',
          iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          icon: () => (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          accentText: 'text-amber-600 dark:text-amber-400',
        };
      case 'In Progress':
        return {
          idBg: 'bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400',
          iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
          icon: () => (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          accentText: 'text-blue-600 dark:text-blue-400',
        };
      case 'Completed':
        return {
          idBg: 'bg-purple-50 text-purple-600 dark:bg-purple-955/20 dark:text-purple-400',
          iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
          icon: () => (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          accentText: 'text-purple-600 dark:text-purple-400',
        };
      case 'Rework':
      default:
        return {
          idBg: 'bg-red-50 text-red-600 dark:bg-red-955/20 dark:text-red-400',
          iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          icon: () => (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          accentText: 'text-red-600 dark:text-red-400',
        };
    }
  };

  // Get unique technician list from projects for the dropdown filter
  const uniqueTechnicians = ['All Technicians', ...new Set(projects.map(p => p.technician).filter(Boolean))];

  const filteredProjects = projects.filter(proj => {
    const matchesStatus = statusFilter === 'All' || proj.status === statusFilter;
    const matchesTech = techFilter === 'All Technicians' || proj.technician === techFilter;
    return matchesStatus && matchesTech;
  });

  return (
    <div className="space-y-6">
      
      {/* Tabs Filter & Technician Filter Row */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        
        {/* Left Side: Status Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-400 font-semibold flex-shrink-0">Projects:</span>
          {['All', 'Pending', 'In Progress', 'Completed', 'Approved', 'Rework'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                statusFilter === status 
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-100 dark:border-slate-750 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Right Side: Technician Select Dropdown Filter & View Mode Toggle */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold flex-shrink-0">Technician:</span>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer w-full md:w-auto font-medium"
            >
              {uniqueTechnicians.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>

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
        </div>

      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-450 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              No projects match the active filters.
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const theme = getProjectTheme(proj.status);
              const ProjectIcon = theme.icon;

              return (
                <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-between transition-colors">
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${theme.idBg}`}>{proj.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-start gap-2.5">
                      <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${theme.iconBg}`}>
                        <ProjectIcon />
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-xs leading-snug truncate">{proj.name}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">Client: {proj.customer}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300 border-t border-slate-55 dark:border-slate-800 pt-3 font-medium">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FiLayers className="text-slate-500 text-xs" />
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Installed Devices</span>
                        </div>
                        <span className={`font-semibold ${theme.accentText}`}>{proj.devicesCount} Units</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FiUserCheck className="text-slate-500 text-xs" />
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Site Technician</span>
                        </div>
                        <span className="font-semibold text-slate-850 dark:text-slate-200 truncate max-w-[100px]">{proj.technician}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="text-slate-500 text-xs" />
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Submission Date</span>
                        </div>
                        <span className="font-semibold text-slate-850 dark:text-slate-200">{proj.submissionDate}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FiMapPin className="text-slate-500 text-xs" />
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Location Area</span>
                        </div>
                        <span className="font-semibold text-slate-850 dark:text-slate-200 truncate max-w-[100px]">{proj.location || 'Chennai, IN'}</span>
                      </div>

                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-55 dark:border-slate-800 pt-3 space-y-2">
                    <button 
                      onClick={() => setSelectedProject(proj)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-550/10 hover:bg-blue-550/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl transition-colors border border-blue-500/20"
                    >
                      <FiEye className="w-3.5 h-3.5" /> View Daily Logs & Details
                    </button>

                    {proj.status === 'Completed' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => dispatch(adminApproveJob(proj.id))}
                          className="flex-1 flex items-center justify-center gap-0.5 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 text-[11px] font-semibold rounded-xl transition-colors border border-emerald-100 dark:border-emerald-900/30"
                        >
                          <FiCheck size={11} /> Approve
                        </button>
                        <button 
                          onClick={() => dispatch(reworkProject(proj.id))}
                          className="flex-1 flex items-center justify-center gap-0.5 py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-955/20 dark:text-orange-300 text-[11px] font-semibold rounded-xl transition-colors border border-orange-100 dark:border-orange-900/30"
                        >
                          <FiRefreshCw size={9} /> Rework
                        </button>
                      </div>
                    )}

                    {proj.status === 'Rework' && (
                      <div className="p-2 rounded-xl bg-red-50 dark:bg-red-955/10 text-red-700 dark:text-red-400 text-[10px] font-semibold flex items-center gap-1.5 border border-red-100/30 text-left">
                        <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                        <span>Waiting for technician response.</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto min-w-full">
            {filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-xs font-medium">
                No projects match the active filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 whitespace-nowrap w-24">ID</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Project Details</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-28">Devices</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-40">Technician</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-32">Date</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Location</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap w-48">Status & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                  {filteredProjects.map((proj) => {
                    const theme = getProjectTheme(proj.status);
                    const isOpenDropdown = activeStatusDropdown === proj.id;
                    return (
                      <tr 
                        key={proj.id} 
                        onClick={() => setSelectedProject(proj)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4 align-middle font-mono font-bold text-slate-500 whitespace-nowrap">{proj.id}</td>
                        <td className="py-4 px-4 align-middle">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block leading-tight group-hover:text-primary transition-colors">{proj.name}</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">Client: {proj.customer}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-middle font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {proj.devicesCount} Units
                        </td>
                        <td className="py-4 px-4 align-middle font-semibold whitespace-nowrap">{proj.technician}</td>
                        <td className="py-4 px-4 align-middle font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{proj.submissionDate}</td>
                        <td className="py-4 px-4 align-middle font-medium text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{proj.location}</td>
                        <td className="py-4 px-4 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStatusDropdown(isOpenDropdown ? null : proj.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer ${getStatusBadge(proj.status)} hover:opacity-90`}
                            >
                              <span>{proj.status}</span>
                              <FiChevronDown className="w-3.5 h-3.5 text-current opacity-70" />
                            </button>

                            {isOpenDropdown && (
                              <div 
                                className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1 font-semibold text-xs animate-in fade-in zoom-in-95 duration-100 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                  Quick Actions
                                </div>
                                {proj.status === 'Completed' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        dispatch(adminApproveJob(proj.id));
                                        setActiveStatusDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-bold transition-colors cursor-pointer"
                                    >
                                      <FiCheck className="w-3.5 h-3.5" />
                                      <span>Approve Project</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        dispatch(reworkProject(proj.id));
                                        setActiveStatusDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-bold transition-colors cursor-pointer"
                                    >
                                      <FiRefreshCw className="w-3.5 h-3.5" />
                                      <span>Request Rework</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProject(proj);
                                    setActiveStatusDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                                >
                                  <FiEye className="w-3.5 h-3.5 text-blue-500" />
                                  <span>View Details</span>
                                </button>
                              </div>
                            )}
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

      {/* Project Details Modal */}
      <Modal 
        isOpen={selectedProject !== null} 
        onClose={() => setSelectedProject(null)} 
        title={`Project Details: ${selectedProject?.id || ''}`}
      >
        {selectedProject && (
          <div className="space-y-5 text-xs text-left">
            
            {/* Project Overview Card */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedProject.name}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600 dark:text-slate-400 font-semibold">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Client / Customer</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedProject.customer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Technician Assigned</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedProject.technician}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Installation Site</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedProject.location || 'Chennai, IN'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Project Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(selectedProject.status)}`}>
                    {selectedProject.status}
                  </span>
                </div>
              </div>

              {/* Live GPS Location Badge & Navigation Link */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <span className="font-bold text-xs">Live GPS Tracking Active</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {selectedProject.currentLocation 
                        ? `Lat: ${selectedProject.currentLocation.lat.toFixed(4)}, Lng: ${selectedProject.currentLocation.lng.toFixed(4)}`
                        : `Site: ${selectedProject.location || 'Chennai, IN'}`}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    selectedProject.currentLocation
                      ? `${selectedProject.currentLocation.lat},${selectedProject.currentLocation.lng}`
                      : `${selectedProject.location || 'Chennai, India'}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                >
                  <FiMapPin className="w-3 h-3" />
                  <span>Open Live Map</span>
                </a>
              </div>
            </div>

            {/* Daily Reports & Photos Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <FiFileText className="text-primary text-sm" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Technician Daily Logs & Photo Uploads</span>
                </div>
                {selectedProject.dailyLogs && selectedProject.dailyLogs.length > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-955/20 px-2 py-0.5 rounded-md font-bold">
                    Total: {selectedProject.dailyLogs.length} Days
                  </span>
                )}
              </div>

              {selectedProject.dailyLogs && selectedProject.dailyLogs.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {selectedProject.dailyLogs.map((log, idx) => (
                    <div key={idx} className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-800 last:border-l-0 pb-4">
                      
                      {/* Timeline dot */}
                      <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <FiClock /> Day {idx + 1} - {log.date}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          log.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-blue-50 text-blue-700 dark:bg-blue-955/20'
                        }`}>
                          {log.status}
                        </span>
                      </div>

                      <p className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {log.report}
                      </p>

                      {/* Photo Uploads Grid */}
                      {log.photos && log.photos.length > 0 && (
                        <div className="mt-2.5">
                          <span className="text-[9px] text-slate-400 font-bold block mb-1">UPLOADED PHOTO(S)</span>
                          <div className="flex flex-wrap gap-2">
                            {log.photos.map((photo, pIdx) => (
                              <img 
                                key={pIdx}
                                src={photo}
                                alt={`upload-${pIdx}`}
                                onClick={() => setLightboxPhoto(photo)}
                                className="w-14 h-14 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-slate-200 dark:border-slate-800"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                  No daily reports or photos uploaded yet for this project.
                </div>
              )}
            </div>

            {/* Quick Status Action inside Modal */}
            {selectedProject.status === 'Pending Approval' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3">
                <button 
                  onClick={() => {
                    dispatch(approveProject(selectedProject.id));
                    setSelectedProject(prev => ({ ...prev, status: 'Approved' }));
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  <FiCheck /> Approve Project
                </button>
                <button 
                  onClick={() => {
                    dispatch(reworkProject(selectedProject.id));
                    setSelectedProject(prev => ({ ...prev, status: 'Rework' }));
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  <FiRefreshCw /> Send Rework Order
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors"
              >
                Close details
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Photo Lightbox Modal */}
      <Modal 
        isOpen={lightboxPhoto !== null} 
        onClose={() => setLightboxPhoto(null)} 
        title="Uploaded Site Photo Preview"
      >
        {lightboxPhoto && (
          <div className="space-y-4">
            <img 
              src={lightboxPhoto} 
              alt="Site preview" 
              className="max-w-full max-h-[500px] mx-auto rounded-xl object-contain border border-slate-200 dark:border-slate-850"
            />
            <div className="flex justify-end">
              <button 
                onClick={() => setLightboxPhoto(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Back to details
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
