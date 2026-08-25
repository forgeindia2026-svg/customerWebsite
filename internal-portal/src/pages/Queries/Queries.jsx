import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addQuery, updateQueryStatus, addQueryResponse } from '../../redux/dashboardSlice';
import { 
  FiSearch, FiPlus, FiMessageSquare, FiClock, FiCheckCircle, 
  FiAlertCircle, FiSend, FiUser, FiInfo, FiLayers 
} from 'react-icons/fi';
import Modal from '../../components/Modal';
import { getApiUrl } from '../../utils/config';

export default function Queries() {
  const dispatch = useDispatch();
  const queries = useSelector(state => state.dashboard?.queries) || [];
  const customers = useSelector(state => state.dashboard?.customers) || [];
  const technicians = useSelector(state => state.dashboard?.technicians) || [];

  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Customer', 'Technician'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Auto select first query
  useEffect(() => {
    if (queries.length > 0 && !selectedQueryId) {
      setSelectedQueryId(queries[0].id);
    }
  }, [queries, selectedQueryId]);

  // Raise Query Form State
  const [queryForm, setQueryForm] = useState({
    type: 'Customer',
    raisedBy: '',
    subject: '',
    priority: 'Medium',
    description: ''
  });

  // Filter queries
  const filteredQueries = queries.filter(q => {
    const matchesTab = activeTab === 'All' || q.type === activeTab;
    const matchesSearch = 
      (q.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.raisedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedQuery = queries.find(q => q.id === selectedQueryId) || filteredQueries[0];

  // Form helper: get available names depending on selected type
  const getRaisedByOptions = () => {
    if (queryForm.type === 'Customer') {
      return customers.map(c => c.name);
    } else {
      return technicians.map(t => t.name);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    dispatch(updateQueryStatus({ id, status: newStatus }));
    try {
      await fetch(`${getApiUrl()}/api/queries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to sync query status:', err);
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedQuery) return;
    const currentId = selectedQuery.id;
    const textToSend = replyText.trim();
    setReplyText('');

    dispatch(addQueryResponse({
      id: currentId,
      sender: 'Admin',
      text: textToSend
    }));

    try {
      await fetch(`${getApiUrl()}/api/queries/${currentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'Admin',
          role: 'ADMIN',
          text: textToSend
        })
      });
    } catch (err) {
      console.error('Failed to post reply to server:', err);
    }
  };

  const handleRaiseQuerySubmit = async (e) => {
    if (e) e.preventDefault();
    const raisedBy = queryForm.raisedBy || getRaisedByOptions()[0] || 'Unknown';
    const payload = {
      ...queryForm,
      raisedBy
    };

    dispatch(addQuery(payload));
    setQueryForm({
      type: 'Customer',
      raisedBy: '',
      subject: '',
      priority: 'Medium',
      description: ''
    });
    setModalOpen(false);

    try {
      const res = await fetch(`${getApiUrl()}/api/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedQueryId(data.data.id);
      }
    } catch (err) {
      console.error('Failed to create query on server:', err);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400';
      case 'Medium': return 'bg-amber-50 text-amber-600 dark:bg-amber-955/30 dark:text-amber-400';
      case 'Low': return 'bg-blue-50 text-blue-600 dark:bg-blue-955/30 dark:text-blue-400';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <FiCheckCircle className="text-emerald-500 w-3.5 h-3.5" />;
      case 'In Progress': return <FiClock className="text-blue-500 w-3.5 h-3.5" />;
      default: return <FiAlertCircle className="text-red-500 w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-55 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-400';
      case 'In Progress': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-400';
      default: return 'bg-rose-50 text-rose-700 dark:bg-rose-955/35 dark:text-rose-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Row */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Left Side: Type Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'All', label: 'All Queries', count: queries.length },
            { id: 'Customer', label: 'Customer Queries', count: queries.filter(q => q.type === 'Customer').length },
            { id: 'Technician', label: 'Technician Queries', count: queries.filter(q => q.type === 'Technician').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                const matching = queries.filter(q => tab.id === 'All' || q.type === tab.id);
                if (matching.length > 0) setSelectedQueryId(matching[0].id);
              }}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Side: Search and Raise Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <FiSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>

          <button 
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FiPlus /> Raise Query
          </button>
        </div>

      </div>

      {/* Main split dashboard panel layout */}
      <div className="flex flex-col lg:flex-row w-full gap-6 min-h-[500px]">
        
        {/* Left Side List panel */}
        <div className="w-full lg:w-[40%] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider text-left">Tickets List</h3>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto max-h-[550px] flex-1">
            {filteredQueries.length === 0 ? (
              <div className="py-16 text-center text-slate-450">
                <FiMessageSquare size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No active queries matching filters.</p>
              </div>
            ) : (
              filteredQueries.map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueryId(q.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-2 relative ${
                    selectedQueryId === q.id 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-l-4 border-l-primary' 
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{q.id}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{q.date}</span>
                  </div>
                  
                  <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-xs truncate max-w-[280px]">
                    {q.subject}
                  </h4>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-655 dark:text-slate-350 font-medium flex items-center gap-1.5">
                      <FiUser size={12} className="text-slate-400" /> {q.raisedBy}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">{q.type}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityClass(q.priority)}`}>
                        {q.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${getStatusBadge(q.status)}`}>
                        {getStatusIcon(q.status)} {q.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side Support Live chat thread */}
        <div className="w-full lg:w-[60%] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-shrink-0">
          {selectedQuery ? (
            <div className="flex-1 flex flex-col h-full">
              
              {/* Header Info */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{selectedQuery.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(selectedQuery.status)}`}>
                      {selectedQuery.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-1">{selectedQuery.subject}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Raised by: {selectedQuery.raisedBy} ({selectedQuery.type})</p>
                </div>

                {/* Status action control */}
                <div className="flex items-center gap-2 text-left">
                  <span className="text-xs font-semibold text-slate-500">Set Status:</span>
                  <select
                    value={selectedQuery.status}
                    onChange={(e) => handleStatusChange(selectedQuery.id, e.target.value)}
                    className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {selectedQuery.type === 'Customer' ? (
                <>
                  {/* Chat Thread Messages Area */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[350px] min-h-[300px] bg-slate-50/30 dark:bg-slate-900/10">
                    {selectedQuery.messages.map((msg, index) => {
                      const isAdmin = msg.sender === 'Admin';
                      return (
                        <div 
                          key={index} 
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-slate-450">{msg.sender}</span>
                            <span className="text-[9px] text-slate-400">{msg.time}</span>
                          </div>
                          <div 
                            className={`max-w-xs md:max-w-md p-3.5 rounded-2xl text-xs font-medium text-left ${
                              isAdmin 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-150 border border-slate-100 dark:border-slate-750 rounded-tl-none shadow-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input form */}
                  <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type support reply or solution details..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="p-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      <FiSend size={15} />
                    </button>
                  </form>
                </>
              ) : (
                /* Technician ticket details card - NO Chat feature */
                <div className="flex-1 p-6 space-y-6 text-left bg-slate-50/10">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Query Summary</h4>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-250 mt-2">
                      {selectedQuery.messages[0]?.text || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Raised By</span>
                      <strong className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 block">{selectedQuery.raisedBy}</strong>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Service Technician</span>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ticket Priority</span>
                      <strong className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 block">{selectedQuery.priority}</strong>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Response level</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
                    <FiInfo className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Technician Support Policy</h5>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">
                        Technician queries represent internal operational tickets (e.g. inventory material approvals, technical troubleshooting logs). Please contact or assign resources directly to resolve this ticket.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-450">
              <FiInfo size={40} className="mb-2 opacity-40" />
              <p className="text-xs">Select a support ticket from the list to view conversations.</p>
            </div>
          )}
        </div>

      </div>

      {/* Raise support query Ticket modal form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Raise Support Query Ticket">
        <form onSubmit={handleRaiseQuerySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Query Category</label>
              <select
                value={queryForm.type}
                onChange={(e) => setQueryForm({ ...queryForm, type: e.target.value, raisedBy: '' })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Customer">Customer Query</option>
                <option value="Technician">Technician Query</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Raised By (Select Profile)</label>
              <select
                value={queryForm.raisedBy}
                onChange={(e) => setQueryForm({ ...queryForm, raisedBy: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                {getRaisedByOptions().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ticket Priority</label>
              <select
                value={queryForm.priority}
                onChange={(e) => setQueryForm({ ...queryForm, priority: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ticket Subject</label>
              <input
                required
                type="text"
                placeholder="e.g. Broken dome housing"
                value={queryForm.subject}
                onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ticket Description & Message</label>
            <textarea
              required
              rows={3}
              placeholder="Provide a detailed description of the query or support incident..."
              value={queryForm.description}
              onChange={(e) => setQueryForm({ ...queryForm, description: e.target.value })}
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
              Raise Ticket
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
