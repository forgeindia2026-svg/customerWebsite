import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiDollarSign, FiPlus, FiCalendar, FiUser, FiSearch, 
  FiFilter, FiFileText, FiTrash2, FiEdit2, FiCheckCircle, 
  FiAlertCircle, FiTrendingDown, FiDownload, FiX, FiLayers,
  FiShoppingBag, FiTruck, FiCoffee, FiTool, FiChevronRight,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  fetchExpensesApi, 
  fetchExpensesSummaryApi, 
  createExpenseApi, 
  deleteExpenseApi 
} from '../../utils/expenseStorage';

export default function Expenses() {
  const technicians = useSelector(state => state.dashboard?.technicians) || [];
  
  const [expenses, setExpenses] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTechModal, setSelectedTechModal] = useState(null); // Technician object for breakdown modal
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    technicianName: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Petrol / Fuel',
    amount: '',
    notes: '',
    jobCode: ''
  });

  const categories = [
    { label: 'Petrol / Fuel', icon: FiTruck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Food / Refreshment', icon: FiCoffee, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { label: 'Travel & Toll', icon: FiTruck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Materials / Hardware', icon: FiShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Site Tools', icon: FiTool, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Miscellaneous', icon: FiLayers, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const [sumData, records] = await Promise.all([
        fetchExpensesSummaryApi(selectedMonth),
        fetchExpensesApi(selectedMonth)
      ]);

      if (sumData) {
        setSummaryData(sumData);
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

  // Handle Form Submit
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.technicianName.trim() || !formData.amount) {
      toast.error('Please enter Technician Name and Amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpenseApi({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success('Daily expense recorded successfully!');
      setIsAddModalOpen(false);
      setFormData({
        technicianName: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Petrol / Fuel',
        amount: '',
        notes: '',
        jobCode: ''
      });
      fetchExpenses();
    } catch (err) {
      console.error('Create expense error:', err);
      toast.error('Failed to save expense');
    } finally {
      setIsSubmitting(false);
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
        exp.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.jobCode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, categoryFilter]);

  // Unique technician summaries combining technicians from DB + any expense entries
  const technicianCards = useMemo(() => {
    const list = summaryData?.technicianBreakdown || [];
    if (!searchQuery.trim()) return list;
    return list.filter(t => t.technicianName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [summaryData, searchQuery]);

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
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Daily Technician Expenses</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track and audit daily field expenses (petrol, food, materials, travel) across technicians.</p>
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

          {/* Add Expense Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Daily Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* This Month Total Expenses */}
        <div className="bg-[#EBF3FF] border border-[#CCE1FC] dark:bg-blue-900/20 dark:border-blue-800/60 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">This Month Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FiTrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            ₹{(summaryData?.summary?.thisMonthTotal || 0).toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {summaryData?.summary?.thisMonthCount || 0} claims logged in {selectedMonth}
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

        {/* Active Technicians */}
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
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">All-Time Recorded</span>
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
              placeholder="Search technician, notes, job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Category Pills (Only when activeTab === 'all_records') */}
        {activeTab === 'all_records' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.label}
                onClick={() => setCategoryFilter(cat.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                  categoryFilter === cat.label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading daily expenses...</p>
        </div>
      ) : activeTab === 'technicians' ? (
        /* Technician Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicianCards.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <FiDollarSign className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Technician Expenses Found</h3>
              <p className="text-xs text-slate-500 mt-1">No daily expenses have been logged for this month yet.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
              >
                + Add Daily Expense
              </button>
            </div>
          ) : (
            technicianCards.map(t => (
              <div
                key={t.technicianName}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0">
                        {t.technicianName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.technicianName}</h3>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {t.monthCount} daily {t.monthCount === 1 ? 'entry' : 'entries'} this month
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      Active
                    </span>
                  </div>

                  {/* Expense Amount */}
                  <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">This Month Expense</p>
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
            ))
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
                  <th className="py-3.5 px-4">Technician</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Purpose / Notes</th>
                  <th className="py-3.5 px-4">Job Code</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">
                      No expense records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(exp => (
                    <tr key={exp._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="font-bold">{exp.date}</span>
                        {exp.time && <span className="text-[10px] text-slate-400 block">{exp.time}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {exp.technicianName}
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
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {exp.jobCode || '-'}
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
                  ))
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
            {/* Modal Header */}
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{item.category}</span>
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

            {/* Modal Footer */}
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

      {/* MODAL 2: Add Daily Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Daily Field Expense</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
              {/* Technician Selection */}
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

              {/* Date & Category in 2 columns */}
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  >
                    {categories.map(c => (
                      <option key={c.label} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Job Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 350"
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

              {/* Purpose / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose / Details</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Petrol for site visit in Denkanikottai / Fasteners purchased"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
    </div>
  );
}
