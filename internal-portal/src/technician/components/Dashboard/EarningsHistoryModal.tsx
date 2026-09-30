import React, { useState, useEffect } from 'react';
import { X, Calendar, Wallet, CheckCircle, Clock } from 'lucide-react';
import { getApiUrl } from '../../../utils/config';
import { formatDate } from '../../../services/dateUtils';

interface EarningsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EarningsHistoryModal: React.FC<EarningsHistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEarningsHistory();
    }
  }, [isOpen]);

  const fetchEarningsHistory = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      const techId = authUser.id || authUser._id || localStorage.getItem('user_id') || '';
      const techName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';
      
      const res = await fetch(`${baseUrl}/api/jobs?status=COMPLETED&technicianId=${techId}&technicianName=${encodeURIComponent(techName)}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        // Sort descending by completion date
        const sorted = data.data.sort((a: any, b: any) => {
          const dateA = new Date(a.financials?.approvedAt || a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.financials?.approvedAt || b.updatedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        setHistory(sorted);
      }
    } catch (err) {
      console.error('Error fetching earnings history', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Earnings History</h2>
              <p className="text-xs font-medium text-slate-500">Completed jobs and payouts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-sm">No earnings history found</p>
              <p className="text-xs mt-1">Complete jobs to start earning.</p>
            </div>
          ) : (
            history.map((job: any) => {
              const techName = localStorage.getItem('user_name') || '';
              let earning = 0;
              const isMainTech = 
                (job.assignedTechnician && job.assignedTechnician.toLowerCase().includes(techName.toLowerCase())) ||
                (job.assignedTechnicians && job.assignedTechnicians.some((t: any) => t.name?.toLowerCase().includes(techName.toLowerCase())));
                
              if (isMainTech) {
                earning = Number(job.mainTechnicianEarning || job.financials?.technicianEarning || job.technicianEarning || 0);
              } else {
                const subTechMatch = (job.subTechnicianEarnings || []).find((st: any) => 
                  st.technicianName?.toLowerCase().includes(techName.toLowerCase())
                );
                if (subTechMatch) {
                  earning = Number(subTechMatch.amount || 0);
                } else {
                  earning = Number(job.technicianEarning || 0);
                }
              }

              const jobDate = new Date(job.financials?.approvedAt || job.updatedAt || job.createdAt);
              
              return (
                <div key={job._id || job.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{job.title || job.jobCategory || 'CCTV Installation'}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase">
                          {job.jobCode}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600 font-mono">
                        +₹{earning.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center text-xs text-slate-500 font-medium gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(jobDate)}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md uppercase tracking-wider">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
