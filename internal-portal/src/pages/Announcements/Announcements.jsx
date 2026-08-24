import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addAnnouncement, editAnnouncement } from '../../redux/dashboardSlice';
import { FiSearch, FiPlus, FiVolume2, FiCalendar, FiUsers, FiAlertCircle, FiInfo } from 'react-icons/fi';
import Modal from '../../components/Modal';

export default function Announcements() {
  const dispatch = useDispatch();
  const announcements = useSelector(state => state.dashboard?.announcements) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    target: 'All Technicians',
    priority: 'Normal',
    content: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addAnnouncement(form));
    setForm({
      title: '',
      target: 'All Technicians',
      priority: 'Normal',
      content: ''
    });
    setModalOpen(false);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-955/30 dark:text-red-400 dark:border-red-900/30';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900/30';
      default: return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/30 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'High': return 'border-l-4 border-l-red-500';
      case 'Medium': return 'border-l-4 border-l-amber-500';
      default: return 'border-l-4 border-l-blue-500';
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    return ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ann.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ann.target.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Top Search & Actions Row */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FiSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Post Button */}
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <FiPlus /> New Announcement
        </button>

      </div>

      {/* Announcements List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-450 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <FiInfo size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No active technician announcements found.</p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <div 
              key={ann.id} 
              className={`bg-white dark:bg-slate-900 rounded-2xl border-y border-r border-t-slate-100 border-b-slate-100 border-r-slate-100 dark:border-t-slate-800 dark:border-b-slate-800 dark:border-r-slate-800 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all text-left ${getPriorityBorder(ann.priority)}`}
            >
              <div>
                
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${getPriorityBadge(ann.priority)}`}>
                    {ann.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <FiCalendar size={11} /> {ann.date}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm mt-3 leading-snug">
                  {ann.title}
                </h4>

                {/* Content */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed font-medium">
                  {ann.content}
                </p>

              </div>

              {/* Target info at bottom */}
              <div className="mt-5 pt-3 border-t border-slate-55 dark:border-slate-805 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 truncate max-w-[150px]" title={`Target: ${ann.target}`}>
                  <FiUsers size={13} className="text-slate-400" /> Target: {ann.target}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingAnn(ann);
                      setForm({
                        title: ann.title,
                        target: ann.target,
                        priority: ann.priority,
                        content: ann.content
                      });
                      setEditModalOpen(true);
                    }}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-[10px] font-bold rounded-lg transition-colors border border-blue-100 dark:border-blue-900/30"
                  >
                    Edit
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{ann.id}</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Post New Announcement Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Publish Technician Announcement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Announcement Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Critical Safety Alert: High Voltage sites" 
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Audience</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="All Technicians">All Technicians</option>
                <option value="IP CCTV Specialists">IP CCTV Specialists</option>
                <option value="Analog Systems Specialists">Analog Systems Specialists</option>
                <option value="Fiber Optic Engineers">Fiber Optic Engineers</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Announcement Content</label>
            <textarea
              required
              rows={4}
              placeholder="Write the complete announcement details here..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-850 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-205 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Announcement Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Technician Announcement">
        {editingAnn && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              dispatch(editAnnouncement({
                id: editingAnn.id,
                title: form.title,
                target: form.target,
                priority: form.priority,
                content: form.content
              }));
              setEditModalOpen(false);
              setEditingAnn(null);
            }} 
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Announcement Title</label>
              <input 
                required
                type="text" 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Audience</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                >
                  <option value="All Technicians">All Technicians</option>
                  <option value="IP CCTV Specialists">IP CCTV Specialists</option>
                  <option value="Analog Systems Specialists">Analog Systems Specialists</option>
                  <option value="Fiber Optic Engineers">Fiber Optic Engineers</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority Level</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                >
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Announcement Content</label>
              <textarea
                required
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-850 dark:text-slate-100"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingAnn(null);
                }}
                className="px-4 py-2 border border-slate-205 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
