import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiDollarSign, FiPlus, FiCalendar, FiUser, FiSearch, 
  FiFilter, FiFileText, FiTrash2, FiEdit2, FiCheckCircle, 
  FiAlertCircle, FiTrendingDown, FiDownload, FiX, FiLayers,
  FiShoppingBag, FiTruck, FiCoffee, FiTool, FiChevronRight,
  FiEye, FiCreditCard, FiHome, FiRefreshCw, FiShield, FiArrowDownRight,
  FiArrowUpRight, FiTag
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  fetchExpensesApi, 
  fetchExpensesSummaryApi, 
  fetchPettyCashSummaryApi,
  topupPettyCashApi,
  createExpenseApi, 
  deleteExpenseApi 
} from '../../utils/expenseStorage';

const CUSTOM_CATEGORIES_KEY = 'sk_custom_expense_categories';

export default function Expenses() {
  const technicians = useSelector(state => state.dashboard?.technicians) || [];
  const location = useLocation();
  
  const [expenses, setExpenses] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [pettyCashData, setPettyCashData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).substring(0, 7);
    } catch (_) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  });

  const [activeTab, setActiveTab] = useState('technicians'); // 'technicians' | 'all_records'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [fundFilter, setFundFilter] = useState('ALL'); // 'ALL' | 'Branch 1' | 'Branch 2' | 'Admin'

  // Custom Categories Persistent State
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : { tech: [], office: [] };
    } catch (_) {
      return { tech: [], office: [] };
    }
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [selectedTechModal, setSelectedTechModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopupSubmitting, setIsTopupSubmitting] = useState(false);

  // Topup Modal State
  const [topupForm, setTopupForm] = useState({
    branchId: 'branch-1',
    isOpeningBalanceReset: false,
    amount: '',
    paymentMode: 'Cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Expense Form State
  const [formData, setFormData] = useState({
    expenseType: 'TECHNICIAN', // 'TECHNICIAN' | 'OFFICE'
    technicianName: '',
    employeeName: '', // Employee who took/spent money for office
    date: new Date().toISOString().split('T')[0],
    fundSource: 'Branch 1 Petty Cash', // 'Branch 1 Petty Cash' | 'Branch 2 Petty Cash' | 'Admin Account'
    paymentMode: 'Petty Cash',
    referenceId: '',
    category: 'Petrol / Fuel',
    amount: '',
    notes: '',
    jobCode: ''
  });

  const defaultTechCategories = [
    'Petrol / Fuel',
    'Food / Refreshment',
    'Travel & Toll',
    'Materials / Hardware',
    'Site Tools',
    'Miscellaneous'
  ];

  const defaultOfficeCategories = [
    'Pooja / Flowers',
    'Office Refreshment / Tea',
    'Office Cleaning & Supplies',
    'Office Maintenance & Repairs',
    'Stationery & Printing',
    'Miscellaneous Office'
  ];

  // Active category list depending on expenseType
  const activeCategoryList = useMemo(() => {
    if (formData.expenseType === 'OFFICE') {
      const customs = customCategories.office || [];
      return Array.from(new Set([...defaultOfficeCategories, ...customs]));
    }
    const customs = customCategories.tech || [];
    return Array.from(new Set([...defaultTechCategories, ...customs]));
  }, [formData.expenseType, customCategories]);

  // Combined list for filtering
  const allCategoriesForFilter = useMemo(() => {
    const fromExpenses = expenses.map(e => e.category).filter(Boolean);
    const combined = [
      ...defaultTechCategories,
      ...defaultOfficeCategories,
      ...(customCategories.tech || []),
      ...(customCategories.office || []),
      ...fromExpenses
    ];
    return Array.from(new Set(combined)).slice(0, 15);
  }, [expenses, customCategories]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const [sumData, records, petty] = await Promise.all([
        fetchExpensesSummaryApi(selectedMonth),
        fetchExpensesApi(selectedMonth),
        fetchPettyCashSummaryApi(selectedMonth)
      ]);

      if (sumData) {
        setSummaryData(sumData);
        if (sumData.pettyCashSummary) {
          setPettyCashData(sumData.pettyCashSummary);
        }
      }
      if (petty) {
        setPettyCashData(petty);
      }
      if (Array.isArray(records)) {
        setExpenses(records);
      }
    } catch (err) {
      console.warn('Error loading expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'record' || params.get('add') === 'true') {
      setIsAddModalOpen(true);
    }
  }, [location.search]);

  // Handle Fund Source Switch in Modal
  const handleFundSourceChange = (newSource) => {
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

  // Handle Expense Type Switch in Modal
  const handleExpenseTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      expenseType: newType,
      technicianName: newType === 'OFFICE' ? 'Office Purpose' : '',
      employeeName: '',
      category: newType === 'OFFICE' ? 'Pooja / Flowers' : 'Petrol / Fuel'
    }));
    setIsAddingCategory(false);
  };

  // Add and Save New Custom Category
  const handleSaveCustomCategory = (e) => {
    e?.preventDefault?.();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }

    const groupKey = formData.expenseType === 'OFFICE' ? 'office' : 'tech';
    const existing = customCategories[groupKey] || [];

    if (!existing.includes(trimmed)) {
      const updated = {
        ...customCategories,
        [groupKey]: [...existing, trimmed]
      };
      setCustomCategories(updated);
      try {
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
      } catch (_) {}
      toast.success(`Category "${trimmed}" saved permanently!`);
    }

    setFormData(prev => ({ ...prev, category: trimmed }));
    setNewCategoryInput('');
    setIsAddingCategory(false);
  };

  // Calculate live remaining balance preview for modal
  const liveBalancePreview = useMemo(() => {
    if (!pettyCashData) return null;
    const amountNum = parseFloat(formData.amount) || 0;
    if (formData.fundSource === 'Branch 1 Petty Cash') {
      const currentAvail = Number(pettyCashData.branch1?.remainingBalance || 0);
      return {
        sourceName: 'Branch 1 Petty Cash',
        current: currentAvail,
        after: currentAvail - amountNum,
        isPetty: true
      };
    }
    if (formData.fundSource === 'Branch 2 Petty Cash') {
      const currentAvail = Number(pettyCashData.branch2?.remainingBalance || 0);
      return {
        sourceName: 'Branch 2 Petty Cash',
        current: currentAvail,
        after: currentAvail - amountNum,
        isPetty: true
      };
    }
    return {
      sourceName: 'Admin Account (SARAN KUMAR)',
      current: null,
      after: null,
      isPetty: false
    };
  }, [formData.fundSource, formData.amount, pettyCashData]);

  // Handle Form Submit
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    let finalTechName = '';
    let finalEmpName = '';

    if (formData.expenseType === 'OFFICE') {
      finalEmpName = (formData.employeeName || '').trim();
      if (!finalEmpName) {
        toast.error('Please enter the Employee / Staff Name who handled the expense');
        return;
      }
      finalTechName = `Office (${finalEmpName})`;
    } else {
      finalTechName = formData.technicianName.trim();
      if (!finalTechName) {
        toast.error('Please enter Technician Name');
        return;
      }
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid Amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpenseApi({
        ...formData,
        technicianName: finalTechName,
        employeeName: finalEmpName,
        amount: parseFloat(formData.amount)
      });
      toast.success('Daily field expense recorded successfully!');
      setIsAddModalOpen(false);
      setFormData({
        expenseType: 'TECHNICIAN',
        technicianName: '',
        employeeName: '',
        date: new Date().toISOString().split('T')[0],
        fundSource: 'Branch 1 Petty Cash',
        paymentMode: 'Petty Cash',
        referenceId: '',
        category: 'Petrol / Fuel',
        amount: '',
        notes: '',
        jobCode: ''
      });
      setIsAddingCategory(false);
      fetchExpenses();
    } catch (err) {
      console.error('Create expense error:', err);
      toast.error('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Top-Up / Reset Balance Submit
  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    if (!topupForm.amount || parseFloat(topupForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsTopupSubmitting(true);
    try {
      await topupPettyCashApi({
        branchId: topupForm.branchId,
        amount: parseFloat(topupForm.amount),
        isOpeningBalanceReset: topupForm.isOpeningBalanceReset,
        notes: topupForm.notes,
        paymentMode: topupForm.paymentMode,
        date: topupForm.date
      });
      toast.success(
        topupForm.isOpeningBalanceReset 
          ? 'Opening balance updated successfully!' 
          : 'Petty cash top-up recorded successfully!'
      );
      setIsTopupModalOpen(false);
      setTopupForm({
        branchId: 'branch-1',
        isOpeningBalanceReset: false,
        amount: '',
        paymentMode: 'Cash',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to update petty cash account');
    } finally {
      setIsTopupSubmitting(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await deleteExpenseApi(id);
      toast.success('Expense record deleted');
      fetchExpenses();
      if (selectedTechModal) {
        setSelectedTechModal(prev => ({
          ...prev,
          recentExpenses: (prev.recentExpenses || []).filter(e => e._id !== id)
        }));
      }
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = 
        exp.technicianName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.jobCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.fundSource?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;

      let matchesFund = true;
      if (fundFilter === 'Branch 1') matchesFund = (exp.fundSource || '').includes('Branch 1');
      else if (fundFilter === 'Branch 2') matchesFund = (exp.fundSource || '').includes('Branch 2');
      else if (fundFilter === 'Admin') matchesFund = (exp.fundSource || '').includes('Admin');

      return matchesSearch && matchesCat && matchesFund;
    });
  }, [expenses, searchQuery, categoryFilter, fundFilter]);

  // Technician summaries
  const technicianCards = useMemo(() => {
    const list = summaryData?.technicianBreakdown || [];
    if (!searchQuery.trim()) return list;
    return list.filter(t => t.technicianName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [summaryData, searchQuery]);

  const b1 = pettyCashData?.branch1;
  const b2 = pettyCashData?.branch2;
  const adminAcc = pettyCashData?.adminAccount;

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Daily Field Expenses & Petty Cash</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track Opening Balance, live deductions, Branch 1 & Branch 2 petty cash, and Admin UPI accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <FiCalendar className="w-4 h-4 text-blue-600" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            />
          </div>

          {/* Manage Opening Balance / Topup Button */}
          <button
            onClick={() => {
              setTopupForm(prev => ({ ...prev, isOpeningBalanceReset: false, branchId: 'branch-1' }));
              setIsTopupModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Petty Cash Top-Up</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <FiPlus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 3 LIVE PETTY CASH & FUND ACCOUNT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Branch 1 Petty Cash Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-900 dark:to-slate-800/80 border border-sky-200/90 dark:border-sky-800/50 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                B1
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Branch 1 Petty Cash</h3>
                <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold">Main Office Hand-Cash</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTopupForm(prev => ({ ...prev, branchId: 'branch-1', isOpeningBalanceReset: false }));
                setIsTopupModalOpen(true);
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-200 transition-colors"
            >
              + Top-Up / Edit
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Available In-Hand Cash</span>
              {b1 ? (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  (b1.remainingBalance || 0) > 1000 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {(b1.remainingBalance || 0) > 0 ? 'Active' : 'Low Balance'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Loading...</span>
              )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {b1 ? `₹${Number(b1.remainingBalance || 0).toLocaleString('en-IN')}` : '₹...'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-sky-100 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Allocated (Open + Topup)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {b1 ? `₹${Number(b1.totalAllocated || 0).toLocaleString('en-IN')}` : '₹...'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Spent This Month</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {b1 ? `-₹${Number(b1.monthSpent || 0).toLocaleString('en-IN')}` : '-₹0'}
              </span>
            </div>
          </div>
        </div>

        {/* Branch 2 Petty Cash Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-purple-50/40 dark:from-slate-900 dark:to-slate-800/80 border border-purple-200/90 dark:border-purple-800/50 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                B2
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Branch 2 Petty Cash</h3>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">Sub-Branch Hand-Cash</span>
              </div>
            </div>
            <button
              onClick={() => {
                setTopupForm(prev => ({ ...prev, branchId: 'branch-2', isOpeningBalanceReset: false }));
                setIsTopupModalOpen(true);
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-200 transition-colors"
            >
              + Top-Up / Edit
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Available In-Hand Cash</span>
              {b2 ? (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  (b2.remainingBalance || 0) > 1000 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {(b2.remainingBalance || 0) > 0 ? 'Active' : 'Low Balance'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Loading...</span>
              )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {b2 ? `₹${Number(b2.remainingBalance || 0).toLocaleString('en-IN')}` : '₹...'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-purple-100 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Allocated (Open + Topup)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {b2 ? `₹${Number(b2.totalAllocated || 0).toLocaleString('en-IN')}` : '₹...'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Spent This Month</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {b2 ? `-₹${Number(b2.monthSpent || 0).toLocaleString('en-IN')}` : '-₹0'}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Account (SARAN KUMAR) Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-slate-800/80 border border-emerald-200/90 dark:border-emerald-800/50 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                <FiCreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Account (SARAN KUMAR)</h3>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">UPI & Net Banking Transfers</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Direct Pay
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total Disbursed This Month</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              ₹{(adminAcc?.monthSpent ?? 0).toLocaleString('en-IN')}
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-emerald-100 dark:border-slate-800 text-[10px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              PhonePe: ₹{adminAcc?.byMode?.['UPI - PhonePe'] || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              GPay: ₹{adminAcc?.byMode?.['UPI - GPay'] || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              NetBank: ₹{adminAcc?.byMode?.['Net Banking'] || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* This Month Total Expenses */}
        <div className="bg-[#EBF3FF] border border-[#CCE1FC] dark:bg-blue-900/20 dark:border-blue-800/60 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">This Month Total</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FiTrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{(summaryData?.summary?.thisMonthTotal || 0).toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {summaryData?.summary?.thisMonthCount || 0} expenses recorded in {selectedMonth}
          </p>
        </div>

        {/* Today Expenses */}
        <div className="bg-[#EDFDF3] border border-[#BCEFD1] dark:bg-emerald-900/20 dark:border-emerald-800/60 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Today Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{(summaryData?.summary?.todayTotal || 0).toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {summaryData?.summary?.todayCount || 0} claims today
          </p>
        </div>

        {/* Active Technicians / Beneficiaries */}
        <div className="bg-[#FEF6E8] border border-[#FDE3BA] dark:bg-amber-900/20 dark:border-amber-800/60 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Active Techs</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <FiUser className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {summaryData?.summary?.activeTechniciansCount || 0}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Technicians with expenses this month
          </p>
        </div>

        {/* All-Time Total */}
        <div className="bg-[#F5EFFF] border border-[#E4D1FC] dark:bg-purple-900/20 dark:border-purple-800/60 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">All-Time Total</span>
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <FiLayers className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{(summaryData?.summary?.allTimeTotal || 0).toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cumulative field operational expenses
          </p>
        </div>
      </div>

      {/* Tab Switcher & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('technicians')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'technicians'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Technicians Breakdown ({technicianCards.length})
            </button>
            <button
              onClick={() => setActiveTab('all_records')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all_records'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Daily Records ({filteredRecords.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search technician, employee, notes, fund source, job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Fund Source Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Fund Source:</span>
            {['ALL', 'Branch 1', 'Branch 2', 'Admin'].map(f => (
              <button
                key={f}
                onClick={() => setFundFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  fundFilter === f
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All Sources' : f === 'Admin' ? 'Admin Account' : `${f} Petty Cash`}
              </button>
            ))}
          </div>

          {/* Category Filter Pills (When on All Records) */}
          {activeTab === 'all_records' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {allCategoriesForFilter.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading daily expenses and petty cash balances...</p>
        </div>
      ) : activeTab === 'technicians' ? (
        /* Technician Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicianCards.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <FiDollarSign className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Expenses Recorded Yet</h3>
              <p className="text-xs text-slate-500 mt-1">Record a daily technician claim or office expense using the button above.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
              >
                + Record Daily Expense
              </button>
            </div>
          ) : (
            technicianCards.map(t => {
              const isOffice = t.technicianName?.toLowerCase().includes('office');
              return (
                <div
                  key={t.technicianName}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top user row */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full font-black text-sm flex items-center justify-center shrink-0 ${
                          isOffice 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        }`}>
                          {isOffice ? <FiHome className="w-5 h-5" /> : t.technicianName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.technicianName}</h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {t.monthCount} daily {t.monthCount === 1 ? 'claim' : 'claims'} in {selectedMonth}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOffice
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}>
                        {isOffice ? 'Office Purpose' : 'Technician'}
                      </span>
                    </div>

                    {/* Expense Amount */}
                    <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">This Month Total</p>
                        <h4 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                          ₹{t.monthTotal.toLocaleString('en-IN')}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">All-Time Total</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                          ₹{t.allTimeTotal.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Categories Breakdown Tags */}
                    {Object.keys(t.categories || {}).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {Object.entries(t.categories).map(([cat, amt]) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                          >
                            <span>{cat.split(' / ')[0]}:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">₹{amt}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action */}
                  <button
                    onClick={() => setSelectedTechModal(t)}
                    className="w-full mt-3 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors group"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    <span>View Itemized Expenses</span>
                    <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Audit Table of all records */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Beneficiary / Staff</th>
                  <th className="py-3.5 px-4">Fund Source</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Purpose / Notes</th>
                  <th className="py-3.5 px-4">Job / Ref</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500 font-medium">
                      No expense records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(exp => {
                    const isOffice = exp.expenseType === 'OFFICE' || exp.technicianName?.toLowerCase().includes('office');
                    const isBranch1 = (exp.fundSource || '').includes('Branch 1');
                    const isBranch2 = (exp.fundSource || '').includes('Branch 2');
                    const isAdmin = (exp.fundSource || '').includes('Admin');

                    return (
                      <tr key={exp._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span className="font-bold">{exp.date}</span>
                          {exp.time && <span className="text-[10px] text-slate-400 block">{exp.time}</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {exp.technicianName}
                            </span>
                            {isOffice && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Office
                              </span>
                            )}
                          </div>
                          {exp.employeeName && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                              Spent by: {exp.employeeName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                              isBranch1 
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                                : isBranch2
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            }`}>
                              {exp.fundSource || 'Branch 1 Petty Cash'}
                            </span>
                            {exp.paymentMode && exp.paymentMode !== 'Petty Cash' && (
                              <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                                {exp.paymentMode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-black text-slate-900 dark:text-white text-sm">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={exp.notes}>
                          {exp.notes || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {exp.jobCode && <span className="block font-semibold text-blue-600">{exp.jobCode}</span>}
                          {exp.referenceId && <span className="block text-[10px] text-slate-400">Txn: {exp.referenceId}</span>}
                          {!exp.jobCode && !exp.referenceId && '-'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete record"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Itemized Technician Breakdown Modal */}
      {selectedTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                  {selectedTechModal.technicianName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedTechModal.technicianName}
                  </h3>
                  <p className="text-xs text-slate-500">Itemized Daily Field Expenses for {selectedMonth}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTechModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Total pill */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">This Month's Total:</span>
                <span className="ml-2 font-black text-xl text-blue-600 dark:text-blue-400">
                  ₹{selectedTechModal.monthTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {selectedTechModal.monthCount} Recorded claims
              </span>
            </div>

            {/* Expenses List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
              {expenses
                .filter(e => e.technicianName?.toLowerCase() === selectedTechModal.technicianName?.toLowerCase())
                .length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No records available.</div>
              ) : (
                expenses
                  .filter(e => e.technicianName?.toLowerCase() === selectedTechModal.technicianName?.toLowerCase())
                  .map(item => (
                    <div
                      key={item._id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 bg-white dark:bg-slate-800/40 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                          <FiDollarSign className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{item.category}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.fundSource || 'Branch 1 Petty Cash'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.date} {item.time}</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">{item.notes}</p>
                          )}
                          {item.jobCode && (
                            <span className="text-[10px] font-mono text-blue-500 font-semibold block mt-0.5">Ref: {item.jobCode}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(item._id)}
                          className="text-[10px] text-rose-500 hover:underline mt-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedTechModal(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Daily Field Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Daily Field Expense</h3>
                <p className="text-xs text-slate-500">Record technician site claims or office daily expenses</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsAddingCategory(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              {/* 1. FUND ACCOUNT / SOURCE FIRST AT THE TOP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fund Account / Source *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Branch 1 */}
                  <button
                    type="button"
                    onClick={() => handleFundSourceChange('Branch 1 Petty Cash')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.fundSource === 'Branch 1 Petty Cash'
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">Branch 1</span>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block mt-0.5">
                      Bal: {b1 ? `₹${Number(b1.remainingBalance || 0).toLocaleString('en-IN')}` : '...'}
                    </span>
                  </button>

                  {/* Branch 2 */}
                  <button
                    type="button"
                    onClick={() => handleFundSourceChange('Branch 2 Petty Cash')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.fundSource === 'Branch 2 Petty Cash'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">Branch 2</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                      Bal: {b2 ? `₹${Number(b2.remainingBalance || 0).toLocaleString('en-IN')}` : '...'}
                    </span>
                  </button>

                  {/* Admin Account */}
                  <button
                    type="button"
                    onClick={() => handleFundSourceChange('Admin Account')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.fundSource === 'Admin Account'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">Admin Account</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                      UPI / NetBank
                    </span>
                  </button>
                </div>
              </div>

              {/* ADMIN ACCOUNT EXTRA FIELDS (Payment Mode & Reference ID) */}
              {formData.fundSource === 'Admin Account' && (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">Payment Method</label>
                      <select
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="UPI - PhonePe">UPI - PhonePe</option>
                        <option value="UPI - GPay">UPI - Google Pay</option>
                        <option value="UPI - Paytm">UPI - Paytm</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cash">Direct Cash (SARAN KUMAR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">Txn / UTR / Ref (Opt)</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / UTR"
                        value={formData.referenceId}
                        onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. EXPENSE BENEFICIARY TOGGLE (BELOW FUND ACCOUNT) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Expense Beneficiary *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleExpenseTypeChange('TECHNICIAN')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.expenseType === 'TECHNICIAN'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FiUser className="w-3.5 h-3.5" />
                    <span>Technician Claim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpenseTypeChange('OFFICE')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.expenseType === 'OFFICE'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FiHome className="w-3.5 h-3.5" />
                    <span>Office Purpose</span>
                  </button>
                </div>
              </div>

              {/* 3. BENEFICIARY DETAILS: TECHNICIAN NAME vs EMPLOYEE NAME (WHO SPENT CASH) */}
              {formData.expenseType === 'TECHNICIAN' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Technician Name *</label>
                  <input
                    type="text"
                    list="techNamesList"
                    required
                    placeholder="Select or enter technician name"
                    value={formData.technicianName}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                  <datalist id="techNamesList">
                    {technicians.map(t => (
                      <option key={t.id || t._id || t.name} value={t.name} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Employee / Staff Name (Handled By) *
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      Who spent for Office Purpose
                    </span>
                  </div>
                  <input
                    type="text"
                    list="employeeStaffList"
                    required
                    placeholder="Select or enter employee / staff name (e.g. Ramesh, Priya)"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                  <datalist id="employeeStaffList">
                    {technicians.map(t => (
                      <option key={t.id || t._id || t.name} value={t.name} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Classified as Office Expense, with full audit of which employee handled this cash.
                  </p>
                </div>
              )}

              {/* 4. DATE & CATEGORY (WITH DYNAMIC CUSTOM CATEGORY ADDITION) */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Category *</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(!isAddingCategory)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <FiPlus className="w-3 h-3" />
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {activeCategoryList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__ADD_NEW__">+ Add New Category...</option>
                    </select>
                  </div>
                </div>

                {/* Inline New Category Creation Input */}
                {isAddingCategory && (
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter new category name (e.g. Broadband / Printer Toner)"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCustomCategory();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomCategory}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryInput('');
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* 5. AMOUNT & JOB REFERENCE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job / Order Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SK-ORD-29158"
                    value={formData.jobCode}
                    onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 6. LIVE PETTY CASH DEDUCTION CALCULATION PREVIEW */}
              {liveBalancePreview && liveBalancePreview.isPetty && formData.amount > 0 && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                  liveBalancePreview.after >= 0
                    ? 'bg-sky-50/70 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
                    : 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <FiArrowDownRight className="w-4 h-4 text-sky-600" />
                    <div>
                      <span className="font-bold block">Live Balance Deduction</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ₹{liveBalancePreview.current.toLocaleString('en-IN')} - ₹{parseFloat(formData.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Cash In-Hand</span>
                    <span className={`font-black text-sm ${liveBalancePreview.after >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                      ₹{liveBalancePreview.after.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* 7. PURPOSE / DETAILS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose / Details</label>
                <textarea
                  rows="2"
                  placeholder={
                    formData.expenseType === 'OFFICE'
                      ? 'e.g. Pooja flowers & fruits for Friday office pooja / Tea refreshments for visiting clients'
                      : 'e.g. Petrol for site visit in Denkanikottai / Emergency PVC conduits'
                  }
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsAddingCategory(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Manage Opening Balance & Top-Up */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {topupForm.isOpeningBalanceReset ? 'Set Monthly Opening Balance' : 'Top-Up Petty Cash Fund'}
                </h3>
                <p className="text-xs text-slate-500">Add physical cash or set starting balance for branch</p>
              </div>
              <button
                onClick={() => setIsTopupModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopupSubmit} className="p-5 space-y-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Branch *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTopupForm({ ...topupForm, branchId: 'branch-1' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      topupForm.branchId === 'branch-1'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Branch 1 (Main Office)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopupForm({ ...topupForm, branchId: 'branch-2' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      topupForm.branchId === 'branch-2'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Branch 2
                  </button>
                </div>
              </div>

              {/* Action Mode Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Action Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTopupForm({ ...topupForm, isOpeningBalanceReset: false })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      !topupForm.isOpeningBalanceReset
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Add Top-Up Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopupForm({ ...topupForm, isOpeningBalanceReset: true })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      topupForm.isOpeningBalanceReset
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Set Opening Balance
                  </button>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={topupForm.amount}
                    onChange={(e) => setTopupForm({ ...topupForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={topupForm.date}
                    onChange={(e) => setTopupForm({ ...topupForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Mode (e.g. Handover Cash or Bank Withdrawal) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Disbursed Via</label>
                <select
                  value={topupForm.paymentMode}
                  onChange={(e) => setTopupForm({ ...topupForm, paymentMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="Cash">Direct Physical Cash Handover</option>
                  <option value="Bank ATM Withdrawal">Bank / ATM Cash Withdrawal</option>
                  <option value="UPI Transfer">Admin UPI Handover</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly initial cash handed to branch manager"
                  value={topupForm.notes}
                  onChange={(e) => setTopupForm({ ...topupForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTopupSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {isTopupSubmitting ? 'Saving...' : topupForm.isOpeningBalanceReset ? 'Set Opening Balance' : 'Add Top-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
