import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Receipt, Calendar, DollarSign, CheckCircle2,
  User, Home, ArrowDownRight, ArrowUpRight, CreditCard, Layers, Tag
} from 'lucide-react';
import { 
  fetchExpensesApi, 
  fetchExpensesSummaryApi,
  createExpenseApi 
} from '../../../utils/expenseStorage';
import toast from 'react-hot-toast';

const CUSTOM_CATEGORIES_KEY = 'sk_custom_expense_categories';

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
  const [companyExpenseTotal, setCompanyExpenseTotal] = useState(0);
  const [companyExpenseCount, setCompanyExpenseCount] = useState(0);
  const [pettyCashData, setPettyCashData] = useState<any>(null);
  const [techniciansList, setTechniciansList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic custom categories
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.tech || parsed.office) {
          return Array.from(new Set([...(parsed.tech || []), ...(parsed.office || [])]));
        }
      }
      return [];
    } catch (_) {
      return [];
    }
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const authUser = JSON.parse(localStorage.getItem('tech_user') || localStorage.getItem('internal_user') || '{}');
  const techName = (authUser.name || localStorage.getItem('user_name') || '').trim();
  const techPhone = (authUser.phone || localStorage.getItem('user_phone') || '').replace(/\D/g, '');

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const defaultCategories = [
    'Petrol / Fuel',
    'Food / Refreshment',
    'Travel & Toll',
    'Materials / Hardware',
    'Site Tools',
    'Office Supplies',
    'Pooja & Refreshments',
    'Miscellaneous'
  ];

  const activeCategories = useMemo(() => {
    return Array.from(new Set([...defaultCategories, ...customCategories]));
  }, [customCategories]);

  const [formData, setFormData] = useState({
    expenseType: 'TECHNICIAN' as 'TECHNICIAN' | 'OFFICE',
    technicianName: techName,
    employeeName: techName,
    date: todayStr,
    fundSource: 'Branch 1 Petty Cash',
    paymentMode: 'Petty Cash',
    referenceId: '',
    category: 'Petrol / Fuel',
    amount: '',
    notes: '',
    jobCode: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumData, records] = await Promise.all([
        fetchExpensesSummaryApi(currentYearMonth),
        fetchExpensesApi(currentYearMonth)
      ]);

      if (sumData?.summary) {
        setCompanyExpenseTotal(Number(sumData.summary.thisMonthTotal) || 0);
        setCompanyExpenseCount(Number(sumData.summary.thisMonthCount) || 0);
      } else if (Array.isArray(records)) {
        setCompanyExpenseTotal(records.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
        setCompanyExpenseCount(records.length);
      }

      if (Array.isArray(records)) {
        setAllExpenses(records);
        const myItems = records.filter((e: any) => {
          if (!techName && !techPhone) return false;
          // Strictly exclude office expenses from technician personal claims
          if (e.expenseType === 'OFFICE' || (e.technicianName || '').toLowerCase().startsWith('office')) return false;

          const tName = (e.technicianName || '').toLowerCase().trim();
          const rawPhone = (e.phone || e.technicianPhone || '').replace(/\D/g, '');

          const matchesPhone = Boolean(techPhone && rawPhone && (rawPhone.includes(techPhone) || techPhone.includes(rawPhone)));
          const target = techName.toLowerCase();
          const matchesName = Boolean(target && (tName.includes(target) || target.includes(tName)));
          return matchesPhone || matchesName;
        });
        setMyExpenses(myItems);
      }
    } catch (err) {
      console.warn('Failed to load expenses or summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setViewScope(initialView || 'MY');
      loadData();
      setFormData(prev => ({
        ...prev,
        technicianName: techName,
        employeeName: techName,
        date: todayStr
      }));

      // Fetch technicians list for datalist
      fetch('/api/technicians')
        .then(res => res.json())
        .then(data => {
          if (data?.success && Array.isArray(data.data)) {
            const names = data.data.map((t: any) => t.name).filter(Boolean);
            setTechniciansList(names);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialView, techName]);

  const handleFundSourceChange = (newSource: string) => {
    let newPaymentMode = 'Petty Cash';
    if (newSource === 'Admin Account') {
      newPaymentMode = 'UPI - PhonePe';
    }
    setFormData(prev => ({
      ...prev,
      fundSource: newSource,
      paymentMode: newPaymentMode
    }));
  };

  const handleExpenseTypeChange = (newType: 'TECHNICIAN' | 'OFFICE') => {
    setFormData(prev => ({
      ...prev,
      expenseType: newType,
      technicianName: newType === 'OFFICE' ? 'Office Purpose' : techName,
      employeeName: techName
    }));
  };

  const handleSaveCustomCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      toast.error('Enter category name');
      return;
    }
    const updated = Array.from(new Set([...customCategories, trimmed]));
    setCustomCategories(updated);
    try {
      const existingRaw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      let payload = { tech: updated, office: updated };
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (parsed.tech || parsed.office) {
          payload = {
            tech: Array.from(new Set([...(parsed.tech || []), trimmed])),
            office: Array.from(new Set([...(parsed.office || []), trimmed]))
          };
        }
      }
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(payload));
    } catch (_) {}

    setFormData(prev => ({ ...prev, category: trimmed }));
    setNewCategoryInput('');
    setIsAddingCategory(false);
    toast.success(`Category "${trimmed}" saved!`);
  };

  const b1 = pettyCashData?.branch1;
  const b2 = pettyCashData?.branch2;

  // Live balance preview deduction calculation
  const liveBalancePreview = useMemo(() => {
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      return null;
    }
    const entered = parseFloat(formData.amount);
    if (formData.fundSource === 'Branch 1 Petty Cash') {
      const current = Number(b1?.remainingBalance || 0);
      return { current, after: current - entered, isPetty: true };
    }
    if (formData.fundSource === 'Branch 2 Petty Cash') {
      const current = Number(b2?.remainingBalance || 0);
      return { current, after: current - entered, isPetty: true };
    }
    return { current: 0, after: 0, isPetty: false };
  }, [formData.fundSource, formData.amount, b1, b2]);

  if (!isOpen) return null;

  const myTotal = myExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const companyTotal = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    if (formData.expenseType === 'OFFICE' && !formData.employeeName.trim()) {
      toast.error('Please enter the employee name who handled this cash');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTechName = formData.expenseType === 'OFFICE' 
        ? 'Office Purpose' 
        : (formData.technicianName.trim() || techName);

      const finalEmployeeName = formData.expenseType === 'OFFICE'
        ? formData.employeeName.trim()
        : finalTechName;

      await createExpenseApi({
        technicianName: finalTechName,
        employeeName: finalEmployeeName,
        date: formData.date || todayStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: formData.category,
        amount: parseFloat(formData.amount),
        fundSource: formData.fundSource,
        paymentMode: formData.fundSource === 'Admin Account' ? formData.paymentMode : 'Petty Cash',
        referenceId: formData.referenceId || '',
        notes: formData.notes || '',
        jobCode: formData.jobCode || '',
        createdBy: techName
      });

      toast.success('Expense recorded successfully!');
      setFormData({
        expenseType: 'TECHNICIAN',
        technicianName: techName,
        employeeName: '',
        date: todayStr,
        fundSource: 'Branch 1 Petty Cash',
        paymentMode: 'Petty Cash',
        referenceId: '',
        category: 'Petrol / Fuel',
        amount: '',
        notes: '',
        jobCode: ''
      });
      setActiveTab('LIST');
      await loadData();
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
      await loadData();
      onExpenseUpdated?.();
    } catch (err) {
      toast.error('Failed to delete claim');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg sm:max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${activeTab === 'ADD' ? 'bg-blue-100 text-blue-600' : viewScope === 'MY' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'} flex items-center justify-center font-bold shrink-0 shadow-xs`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                {activeTab === 'ADD' 
                  ? 'Record Daily Field Expense' 
                  : viewScope === 'MY' ? 'My Field Expenses' : 'Company Field Expenses'}
              </h3>
              <p className="text-xs text-zinc-500">
                {activeTab === 'ADD' 
                  ? 'Record technician site claims or office daily expenses' 
                  : viewScope === 'MY' ? `${techName || 'My Claims'} • ${currentYearMonth}` : `All Technicians & Office • ${currentYearMonth}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Scope / Switcher Bar */}
        <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
          {activeTab === 'LIST' ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setViewScope('MY')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewScope === 'MY'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>My Claims ({myExpenses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewScope('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewScope === 'ALL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Company Overview ({companyExpenseCount || allExpenses.length})</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-zinc-700">New Claim Form</span>
          )}

          <button
            onClick={() => setActiveTab(activeTab === 'LIST' ? 'ADD' : 'LIST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${
              activeTab === 'LIST'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
            }`}
          >
            {activeTab === 'LIST' ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </>
            ) : (
              <span>Back to List</span>
            )}
          </button>
        </div>

        {/* Total Summary Banner (when on LIST) */}
        {activeTab === 'LIST' && (
          viewScope === 'MY' ? (
            <div className="p-4 border-b flex items-center justify-between bg-rose-50/70 border-rose-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block text-rose-700">
                  My Total Expenses (This Month)
                </span>
                <span className="text-2xl font-black font-mono text-rose-600">
                  ₹{myTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-600 bg-white/90 px-3 py-1 rounded-full border border-zinc-200 shadow-2xs">
                {myExpenses.length} {myExpenses.length === 1 ? 'claim' : 'claims'}
              </span>
            </div>
          ) : (
            <div className="p-4 border-b flex items-center justify-between bg-amber-50/70 border-amber-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block text-amber-800">
                  Total Company Expenses (This Month)
                </span>
                <span className="text-2xl font-black font-mono text-amber-700">
                  ₹{companyExpenseTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-700 bg-white/90 px-3 py-1 rounded-full border border-zinc-200 shadow-2xs">
                {companyExpenseCount || allExpenses.length} expenses recorded
              </span>
            </div>
          )
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 no-scrollbar space-y-4">
          {activeTab === 'ADD' ? (
            /* EXACT FORM MATCHING IMAGE 1 */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 1. FUND ACCOUNT / SOURCE FIRST AT THE TOP */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Fund Account / Source *
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {/* Branch 1 */}
                  <button
                    type="button"
                    onClick={() => handleFundSourceChange('Branch 1 Petty Cash')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.fundSource === 'Branch 1 Petty Cash'
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                        : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-zinc-900 block truncate">Branch 1</span>
                    <span className="text-[10px] text-sky-600 font-bold block mt-0.5 truncate">
                      Petty Cash
                    </span>
                  </button>

                  {/* Branch 2 */}
                  <button
                    type="button"
                    onClick={() => handleFundSourceChange('Branch 2 Petty Cash')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.fundSource === 'Branch 2 Petty Cash'
                        ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20'
                        : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-zinc-900 block truncate">Branch 2</span>
                    <span className="text-[10px] text-purple-600 font-bold block mt-0.5 truncate">
                      Petty Cash
                    </span>
                  </button>

                  {/* Admin Account */}
                  <button
                    type="button"
                    onClick={() => handleFundSourceChange('Admin Account')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.fundSource === 'Admin Account'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-zinc-900 block truncate">Admin Account</span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 truncate">
                      UPI / NetBank
                    </span>
                  </button>
                </div>
              </div>

              {/* ADMIN ACCOUNT EXTRA FIELDS (Payment Method & Reference ID) */}
              {formData.fundSource === 'Admin Account' && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Payment Method</label>
                      <select
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-zinc-800 outline-none"
                      >
                        <option value="UPI - PhonePe">UPI - PhonePe</option>
                        <option value="UPI - GPay">UPI - Google Pay</option>
                        <option value="UPI - Paytm">UPI - Paytm</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cash">Direct Cash (SARAN KUMAR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Txn / UTR / Ref (Opt)</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / UTR"
                        value={formData.referenceId}
                        onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-zinc-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. EXPENSE BENEFICIARY TOGGLE (BELOW FUND ACCOUNT) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Expense Beneficiary *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleExpenseTypeChange('TECHNICIAN')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.expenseType === 'TECHNICIAN'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Technician Claim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpenseTypeChange('OFFICE')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.expenseType === 'OFFICE'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Office Purpose</span>
                  </button>
                </div>
              </div>

              {/* 3. BENEFICIARY DETAILS: TECHNICIAN NAME vs EMPLOYEE NAME (WHO SPENT CASH) */}
              {formData.expenseType === 'TECHNICIAN' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Technician Name *</label>
                  <input
                    type="text"
                    list="techModalNamesList"
                    required
                    placeholder="Select or enter technician name"
                    value={formData.technicianName}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 outline-none focus:border-blue-500"
                  />
                  <datalist id="techModalNamesList">
                    {techniciansList.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-700">
                      Employee / Staff Name (Handled By) *
                    </label>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      Who spent for Office Purpose
                    </span>
                  </div>
                  <input
                    type="text"
                    list="employeeStaffListModal"
                    required
                    placeholder="Select or enter employee / staff name (e.g. Ramesh, Priya)"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-amber-300 rounded-xl text-xs font-medium text-zinc-800 outline-none focus:border-amber-500"
                  />
                  <datalist id="employeeStaffListModal">
                    {techniciansList.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Classified as Office Expense, with full audit of which employee handled this cash.
                  </p>
                </div>
              )}

              {/* 4. DATE & CATEGORY (WITH DYNAMIC CUSTOM CATEGORY ADDITION) */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700">Category *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAddingCategory ? 'Close' : 'Add Category'}</span>
                      </button>
                    </div>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingCategory(true);
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {activeCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__ADD_NEW__">+ Add New Category...</option>
                    </select>
                  </div>
                </div>

                {/* Inline New Category Creation Input */}
                {isAddingCategory && (
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter new category name (e.g. Tools / Hardware)"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCustomCategory();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium text-zinc-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomCategory}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryInput('');
                      }}
                      className="px-2.5 py-1.5 bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* 5. AMOUNT & JOB REFERENCE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Job / Order Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SK-ORD-29158"
                    value={formData.jobCode}
                    onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 6. PURPOSE / DETAILS */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Purpose / Details</label>
                <textarea
                  rows={2}
                  placeholder={
                    formData.expenseType === 'OFFICE'
                      ? 'e.g. Pooja flowers & fruits for Friday office pooja / Tea refreshments for visiting clients'
                      : 'e.g. Petrol for site visit in Denkanikottai / Emergency PVC conduits'
                  }
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          ) : (
            /* Claims List */
            viewScope === 'ALL' ? (
              /* Company Overview (Privacy Protected: Total amount & count only, itemized details hidden as requested) */
              <div className="py-6 px-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                  <Layers className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    Total Company Expenses ({currentYearMonth})
                  </span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-amber-700 block">
                    ₹{companyExpenseTotal.toLocaleString('en-IN')}
                  </span>
                  <p className="text-xs font-medium text-zinc-500">
                    {companyExpenseCount || allExpenses.length} total expense vouchers recorded across company this month
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Company Expense Security & Privacy</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Overall company spending figure is visible for operational awareness. Detailed vendor receipts, office purchase vouchers, and team claims are maintained centrally in Admin accounts.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setViewScope('MY')}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View My Daily Claims ({myExpenses.length}) &rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              /* My Claims List (GOPINATH.M: shows 6 daily claims with full itemized details) */
              <div>
                {isLoading ? (
                  <div className="text-center py-8 text-xs text-zinc-400">Loading claims...</div>
                ) : myExpenses.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Receipt className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-xs font-bold text-zinc-600">
                      No Expenses Logged By You This Month
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Submit your daily petrol, food, or material receipts here.
                    </p>
                    <button
                      onClick={() => setActiveTab('ADD')}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                    >
                      + Record Daily Expense
                    </button>
                  </div>
                ) : (
                  myExpenses.map((item) => (
                    <div
                      key={item._id}
                      className="p-3.5 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between gap-2 shadow-2xs mb-2.5 hover:border-zinc-300 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-zinc-900">{item.category}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            {item.technicianName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{item.date}</span>
                        </div>
                        {item.notes && <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.notes}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.fundSource && (
                            <span className="text-[10px] text-zinc-400 font-medium">
                              Src: {item.fundSource}
                            </span>
                          )}
                          {item.jobCode && (
                            <span className="text-[10px] font-mono text-blue-600 font-semibold">
                              Ref: {item.jobCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-sm text-zinc-900 font-mono block">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-medium">
            SK Technology • Field Expenses System
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
