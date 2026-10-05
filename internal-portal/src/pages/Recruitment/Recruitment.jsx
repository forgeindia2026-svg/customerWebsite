import React, { useState, useEffect } from 'react';
import { 
  FiUserCheck, FiPlus, FiEdit2, FiSearch, FiCheck, FiX, 
  FiBriefcase, FiUsers, FiCalendar, FiDollarSign, FiFilter, FiUserPlus, FiShield
} from 'react-icons/fi';
import { getApiUrl } from '../../utils/config';

export default function Recruitment() {
  const [candidates, setCandidates] = useState([]);
  const [hrReferences, setHrReferences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applied'); // 'applied', 'hr', 'openings'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editHrModalOpen, setEditHrModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedHrCode, setSelectedHrCode] = useState('');

  const [addHrModalOpen, setAddHrModalOpen] = useState(false);
  const [newHrForm, setNewHrForm] = useState({
    hrName: '',
    hrCode: '',
    email: '',
    phone: '',
    department: 'Human Resources'
  });

  const [isAdmin, setIsAdmin] = useState(true); // Default true for internal portal admin view
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchRecruitmentData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const [appRes, hrRes] = await Promise.all([
        fetch(`${baseUrl}/api/recruitment/applications`),
        fetch(`${baseUrl}/api/recruitment/hr-references`)
      ]);

      const appData = await appRes.json();
      const hrData = await hrRes.json();

      if (appData.success) setCandidates(appData.data || []);
      if (hrData.success) setHrReferences(hrData.data || []);
    } catch (err) {
      console.error('Failed to load recruitment data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitmentData();
  }, []);

  // Handle open Edit HR modal
  const handleOpenEditHr = (candidate) => {
    setSelectedCandidate(candidate);
    setSelectedHrCode(candidate.hrReference?.hrCode || '');
    setEditHrModalOpen(true);
  };

  // Save updated HR Reference for candidate (Admin Only)
  const handleSaveHrReference = async () => {
    if (!selectedCandidate) return;
    const chosenHr = hrReferences.find(hr => hr.hrCode === selectedHrCode);
    if (!chosenHr) {
      alert('Please select a valid HR Reference.');
      return;
    }

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/recruitment/applications/${selectedCandidate._id}/hr-reference`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'role': 'ADMIN' // Explicit Admin role header
        },
        body: JSON.stringify({
          hrName: chosenHr.hrName,
          hrCode: chosenHr.hrCode,
          hrId: chosenHr._id
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`HR Reference updated to ${chosenHr.hrName} (${chosenHr.hrCode}) successfully!`);
        setTimeout(() => setStatusMessage(null), 4000);
        setEditHrModalOpen(false);
        fetchRecruitmentData();
      } else {
        alert(data.message || 'Failed to update HR Reference.');
      }
    } catch (err) {
      alert('Error updating HR Reference: ' + err.message);
    }
  };

  // Handle Add New HR Reference (Admin Only)
  const handleAddHrReference = async (e) => {
    if (e) e.preventDefault();
    if (!newHrForm.hrName.trim()) {
      alert('Please enter the HR Name.');
      return;
    }

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/recruitment/hr-references`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'role': 'ADMIN'
        },
        body: JSON.stringify(newHrForm)
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`New HR Reference "${data.data.hrName}" (${data.data.hrCode}) added!`);
        setTimeout(() => setStatusMessage(null), 4000);
        setAddHrModalOpen(false);
        setNewHrForm({ hrName: '', hrCode: '', email: '', phone: '', department: 'Human Resources' });
        
        // If candidate modal was open, auto select this newly added HR
        if (selectedCandidate) {
          setSelectedHrCode(data.data.hrCode);
        }
        fetchRecruitmentData();
      } else {
        alert(data.message || 'Failed to add HR reference.');
      }
    } catch (err) {
      alert('Error adding HR reference: ' + err.message);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.applicantName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.appliedJob?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.hrReference?.hrName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-6 font-sans">
      {/* Alert Status Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <FiCheck className="text-emerald-600 w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">ADMIN CONTROL PANEL</span>
            <span className="text-xs font-semibold text-slate-400">Recruitment & HR Referral Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Recruitment Control Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review candidate profiles, change HR references (Admin Only), and schedule interview rounds.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddHrModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.98]"
          >
            <FiUserPlus size={16} />
            + Add New HR Reference
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('applied')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'applied' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FiBriefcase size={14} />
          Applied ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('hr')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'hr' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FiUsers size={14} />
          HR Directory ({hrReferences.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by candidate email, job, company, or HR name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Candidates List View */}
      {activeTab === 'applied' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Candidate Profile</th>
                  <th className="py-3.5 px-4">Applied Job</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Applied On</th>
                  <th className="py-3.5 px-4 bg-blue-50/50 text-blue-900 border-x border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <FiShield className="text-blue-600 w-3.5 h-3.5" />
                      <span>HR Reference</span>
                      <span className="text-[9px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase">Admin Edit</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2"></div>
                      <p>Loading candidate application records...</p>
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      No candidate application records found.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate Email & City */}
                      <td className="py-4 px-4 font-medium">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{candidate.applicantName || 'Candidate'}</p>
                          <span className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-mono text-[11px] border border-blue-100">
                            ✉️ {candidate.email}
                          </span>
                          {candidate.city && (
                            <p className="text-[11px] text-purple-600 font-medium">🏙️ City: {candidate.city}</p>
                          )}
                        </div>
                      </td>

                      {/* Applied Job */}
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {candidate.appliedJob}
                      </td>

                      {/* Company */}
                      <td className="py-4 px-4 font-semibold text-slate-600">
                        {candidate.company}
                      </td>

                      {/* Applied On */}
                      <td className="py-4 px-4 text-slate-500 font-mono">
                        {candidate.appliedOn}
                      </td>

                      {/* HR Reference (HIGHLIGHTED & EDITABLE) */}
                      <td className="py-4 px-4 bg-blue-50/30 border-x border-blue-100">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-blue-600 text-xs">
                              {candidate.hrReference?.hrName || 'Unassigned'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {candidate.hrReference?.hrCode || 'HR-00000'}
                            </span>
                          </div>

                          {/* Admin Edit Button */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEditHr(candidate)}
                              title="Change HR Reference (Admin Only)"
                              className="p-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-700">
                        ₹{candidate.payment?.amount || 49}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {candidate.payment?.transactionId || 'pay_Tk6vspLO3'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200">
                          • {candidate.status || 'Applied'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right space-y-1.5">
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] block w-full text-center transition-colors cursor-pointer shadow-2xs">
                          Update Status
                        </button>
                        <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-[11px] block w-full text-center transition-colors cursor-pointer">
                          🗓️ Schedule Interview
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HR Directory View */}
      {activeTab === 'hr' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hrReferences.map((hr) => (
            <div key={hr._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{hr.hrName}</h3>
                  <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 font-bold">
                    {hr.hrCode}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-full uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                <p>📧 {hr.email || 'hr@sktechnology.com'}</p>
                <p>📞 {hr.phone || '+91 98765 43210'}</p>
                <p>🏢 Department: {hr.department || 'Human Resources'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Edit Candidate HR Reference (Admin Only) */}
      {editHrModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FiShield className="text-blue-600 w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900">Change HR Reference</h3>
              </div>
              <button onClick={() => setEditHrModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FiX size={20} />
              </button>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-blue-900">Candidate: {selectedCandidate.applicantName}</p>
              <p className="text-slate-500 font-mono">{selectedCandidate.email}</p>
              <p className="text-slate-600">Job: {selectedCandidate.appliedJob} ({selectedCandidate.company})</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select HR Reference (Admin Only):</label>
              <select
                value={selectedHrCode}
                onChange={(e) => setSelectedHrCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">-- Choose HR Reference --</option>
                {hrReferences.map((hr) => (
                  <option key={hr.hrCode} value={hr.hrCode}>
                    {hr.hrName} ({hr.hrCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-3">
              <button
                onClick={() => {
                  setEditHrModalOpen(false);
                  setAddHrModalOpen(true);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                + Add New HR Reference
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditHrModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHrReference}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Save HR Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New HR Reference (Admin Only) */}
      {addHrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FiUserPlus className="text-blue-600 w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900">Add New HR Reference</h3>
              </div>
              <button onClick={() => setAddHrModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddHrReference} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">HR Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyadharshini or Mohammed"
                  value={newHrForm.hrName}
                  onChange={(e) => setNewHrForm({ ...newHrForm, hrName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">HR Code (Optional - Auto generated if empty)</label>
                <input
                  type="text"
                  placeholder="e.g. HR-27394"
                  value={newHrForm.hrCode}
                  onChange={(e) => setNewHrForm({ ...newHrForm, hrCode: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="hr@sktechnology.com"
                  value={newHrForm.email}
                  onChange={(e) => setNewHrForm({ ...newHrForm, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={newHrForm.phone}
                  onChange={(e) => setNewHrForm({ ...newHrForm, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setAddHrModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Save New HR Reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
