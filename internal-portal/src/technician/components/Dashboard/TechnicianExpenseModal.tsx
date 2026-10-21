import React, { useState, useEffect } from 'react';
import { X, Plus, Receipt, Calendar, DollarSign, Trash2, CheckCircle2 } from 'lucide-react';
import { fetchExpensesApi, createExpenseApi, deleteExpenseApi } from '../../../utils/expenseStorage';
import toast from 'react-hot-toast';

interface TechnicianExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated?: () => void;
  initialView?: 'MY' | 'ALL';
}

export const TechnicianExpenseModal: React.FC<TechnicianExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseUpdated,
  initialView = 'MY'
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'ADD'>('LIST');
  const [viewScope, setViewScope] = useState<'MY' | 'ALL'>(initialView);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [myExpenses, setMyExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
  const techName = (authUser.name || localStorage.getItem('user_name') || 'Technician').trim();

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    date: todayStr,
    category: 'Petrol / Fuel',
    amount: '',
    notes: '',
    jobCode: ''
  });

  const categories = [
    'Petrol / Fuel',
    'Food / Refreshment',
    'Travel & Toll',
    'Materials / Hardware',
    'Site Tools',
    'Miscellaneous'
  ];

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const records = await fetchExpensesApi(currentYearMonth);
      if (Array.isArray(records)) {
        setAllExpenses(records);
        const myItems = records.filter((e: any) => {
          const n = (e.technicianName || '').toLowerCase().trim();
          const target = techName.toLowerCase();
          return n.includes(target) || target.includes(n);
        });
        setMyExpenses(myItems);
      }
    } catch (err) {
      console.warn('Failed to load technician expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setViewScope(initialView || 'MY');
      loadExpenses();
    }
  }, [isOpen, initialView, techName]);

  if (!isOpen) return null;

  const displayedExpenses = viewScope === 'MY' ? myExpenses : allExpenses;
  const myTotal = myExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const allTotal = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentTotal = viewScope === 'MY' ? myTotal : allTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpenseApi({
        technicianName: techName,
        date: formData.date || todayStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: formData.category,
        amount: parseFloat(formData.amount),
        notes: formData.notes || '',
        jobCode: formData.jobCode || '',
        createdBy: techName
      });

      toast.success('Expense claim submitted successfully!');
      setFormData({
        date: todayStr,
        category: 'Petrol / Fuel',
        amount: '',
        notes: '',
        jobCode: ''
      });
      setActiveTab('LIST');
      await loadExpenses();
      onExpenseUpdated?.();
    } catch (err) {
      toast.error('Failed to submit expense claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense claim?')) return;
    try {
      await deleteExpenseApi(id);
      toast.success('Claim deleted');
      await loadExpenses();
      onExpenseUpdated?.();
    } catch (err) {
      toast.error('Failed to delete claim');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-left">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${viewScope === 'MY' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'} flex items-center justify-center font-bold`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                {viewScope === 'MY' ? 'My Field Expenses' : 'All Technicians Expenses'}
              </h3>
              <p className="text-[11px] text-zinc-500">{techName} • {currentYearMonth}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Toggle Tabs (My Expenses vs All Technicians) */}
        <div className="px-4 pt-3 pb-2 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex rounded-xl bg-zinc-200/70 p-1 text-xs font-bold">
            <button
              onClick={() => { setViewScope('MY'); setActiveTab('LIST'); }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewScope === 'MY' ? 'bg-white text-rose-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              My Claims ({myExpenses.length})
            </button>
            <button
              onClick={() => { setViewScope('ALL'); setActiveTab('LIST'); }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewScope === 'ALL' ? 'bg-white text-amber-800 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All Technicians ({allExpenses.length})
            </button>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === 'LIST' ? 'ADD' : 'LIST')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            {activeTab === 'LIST' ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>+ Claim</span>
              </>
            ) : (
              <span>Back to List</span>
            )}
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className={`p-4 border-b flex items-center justify-between ${viewScope === 'MY' ? 'bg-rose-50/70 border-rose-100' : 'bg-amber-50/70 border-amber-100'}`}>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${viewScope === 'MY' ? 'text-rose-700' : 'text-amber-800'}`}>
              {viewScope === 'MY' ? "My Total Expenses (This Month)" : "Total All Technicians Expenses"}
            </span>
            <span className={`text-2xl font-black font-mono ${viewScope === 'MY' ? 'text-rose-600' : 'text-amber-700'}`}>
              ₹{currentTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-xs font-semibold text-zinc-500 bg-white/80 px-2.5 py-1 rounded-full border border-zinc-200">
            {displayedExpenses.length} claims
          </span>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 no-scrollbar space-y-3">
          {activeTab === 'ADD' ? (
            /* Add Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-rose-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 250"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Order / Job Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SK-ORD-29158"
                  value={formData.jobCode}
                  onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Purpose / Details (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Petrol for site visit / Anchor screws purchased"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          ) : (
            /* Claims List */
            <div>
              {isLoading ? (
                <div className="text-center py-8 text-xs text-zinc-400">Loading claims...</div>
              ) : displayedExpenses.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Receipt className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-zinc-600">
                    {viewScope === 'MY' ? 'No Expenses Logged By You This Month' : 'No Expenses Logged Across Team This Month'}
                  </p>
                  <p className="text-[11px] text-zinc-400">Submit your daily petrol, food, or material receipts here.</p>
                  <button
                    onClick={() => setActiveTab('ADD')}
                    className="mt-3 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Claim Expense
                  </button>
                </div>
              ) : (
                displayedExpenses.map((item) => {
                  const isMine = (item.technicianName || '').toLowerCase().includes(techName.toLowerCase());
                  return (
                    <div
                      key={item._id}
                      className="p-3 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between gap-2 shadow-2xs mb-2 hover:border-zinc-300 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-zinc-900">{item.category}</span>
                          {viewScope === 'ALL' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {item.technicianName}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono">{item.date}</span>
                        </div>
                        {item.notes && <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.notes}</p>}
                        {item.jobCode && (
                          <span className="text-[10px] font-mono text-blue-600 font-semibold block mt-0.5">
                            Ref: {item.jobCode}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-sm text-zinc-900 font-mono block">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </span>
                        {isMine && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-[10px] text-rose-500 hover:underline mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
