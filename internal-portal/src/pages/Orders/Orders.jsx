import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiSearch, FiSliders, FiCheckCircle, FiInfo, FiTrash2, FiPlusCircle, FiEye, FiGrid, FiList, FiPlus, FiUser, FiCalendar, FiDollarSign, FiChevronDown, FiCheck, FiEdit, FiShoppingBag, FiClock } from 'react-icons/fi';
import { approveOrder, addOrder, assignTechnicianToOrder, editOrder, adminApproveJob } from '../../redux/dashboardSlice';
import Modal from '../../components/Modal';

export default function Orders() {
  const dispatch = useDispatch();
  const orders = useSelector(state => state.dashboard?.orders) || [];
  const technicians = useSelector(state => state.dashboard?.technicians) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);

  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [orderToScope, setOrderToScope] = useState(null);
  const [scopeForm, setScopeForm] = useState({
    orderCategory: 'Delivery & Installation',
    requiredTechniciansCount: 1,
    estimatedDays: 1,
    startDate: new Date().toISOString().split('T')[0],
    targetCompletionDate: ''
  });
  
  // Layout and creation modal states
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ 
    customer: '', 
    email: '', 
    phone: '', 
    type: 'Cameras Installation', 
    assignedTechnician: 'Unassigned', 
    amount: '',
    location: 'Chennai Area'
  });

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40';
      case 'In Progress':
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40';
      case 'Pending Approval':
      case 'Pending':
      case 'WAITING_ADMIN_APPROVAL':
      case 'ASSIGNMENT_PENDING_ACCEPTANCE':
      case 'WAITING_FOR_TECH':
      case 'CANCELLED':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-700';
    }
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    dispatch(addOrder({
      customer: orderForm.customer,
      email: orderForm.email,
      phone: orderForm.phone,
      type: orderForm.type,
      assignedTechnician: orderForm.assignedTechnician,
      amount: parseFloat(orderForm.amount) || 0,
      location: orderForm.location
    }));
    setOrderForm({ 
      customer: '', 
      email: '', 
      phone: '', 
      type: 'Cameras Installation', 
      assignedTechnician: 'Unassigned', 
      amount: '',
      location: 'Chennai Area'
    });
    setAddModalOpen(false);
  };

  const handleScopeOrder = (e) => {
    e.preventDefault();
    if (orderToScope) {
      dispatch(approveOrder({
        id: orderToScope.id,
        orderCategory: scopeForm.orderCategory,
        requiredTechniciansCount: parseInt(scopeForm.requiredTechniciansCount, 10) || 1,
        estimatedDays: parseInt(scopeForm.estimatedDays, 10) || 1,
        startDate: scopeForm.startDate,
        targetCompletionDate: scopeForm.targetCompletionDate
      }));
    }
    setScopeModalOpen(false);
    setOrderToScope(null);
  };

  // KPI Metrics Calculations
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Pending Approval').length;
  const inProgressOrdersCount = orders.filter(o => o.status === 'In Progress' || o.status === 'Assigned').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Completed' || o.status === 'Approved').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* 📊 Orders KPI Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Orders */}
        <div 
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalOrdersCount}</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              All Orders
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">CCTV & Service Orders</p>
        </div>

        {/* 2. Pending Orders */}
        <div 
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'Pending' || statusFilter === 'Pending Approval'
              ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FiClock size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{pendingOrdersCount}</span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              Action Needed
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Needs Approval / Technician</p>
        </div>

        {/* 3. In Progress */}
        <div 
          onClick={() => setStatusFilter('In Progress')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'In Progress'
              ? 'border-purple-500 shadow-md ring-2 ring-purple-500/20'
              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Progress</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FiSliders size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{inProgressOrdersCount}</span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
              On-Site Jobs
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Active Field Installations</p>
        </div>

        {/* 4. Completed Revenue */}
        <div 
          onClick={() => setStatusFilter('Completed')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'Completed' || statusFilter === 'Approved'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed & Billing</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiCheckCircle size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              {completedOrdersCount} Finished
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total Billing Value</p>
        </div>
      </div>

      {/* Search, Add Order & Filters Panel */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FiSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search customer name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filters, View Switcher & Create Button Row */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          {/* Status Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0">
              Status:
            </span>
            {['All', 'Pending', 'Pending Approval', 'In Progress', 'Approved', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                  statusFilter === status 
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-655 dark:text-slate-350 border-slate-100 dark:border-slate-750 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Grid / List toggle & Add order btn */}
          <div className="flex items-center gap-3">
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
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <FiPlus /> Add Order
            </button>
          </div>
        </div>

      </div>

      {/* Main Layout Rendering based on viewMode */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors p-4 md:p-6 min-h-[320px]">
          
          {/* 📱 Mobile Order Cards View (block md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders match your search parameters.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isOpenDropdown = activeStatusDropdown === ord.id;
                return (
                  <div 
                    key={`mob-ord-${ord.id}`}
                    onClick={() => setSelectedOrder(ord)}
                    className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 transition-all cursor-pointer hover:border-primary shadow-2xs"
                  >
                    {/* Header Row: Order ID & Status Badge */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                      <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {ord.id}
                      </span>

                      {/* Interactive Status Badge Dropdown */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveStatusDropdown(isOpenDropdown ? null : ord.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(ord.status)}`}
                        >
                          <span>{ord.status}</span>
                          <FiChevronDown size={12} />
                        </button>

                        {isOpenDropdown && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1 text-left">
                            {(ord.status === 'Pending' || ord.status === 'Pending Approval') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderToScope(ord);
                                  setScopeForm({
                                    orderCategory: 'Delivery & Installation',
                                    requiredTechniciansCount: 1,
                                    estimatedDays: 1,
                                    startDate: new Date().toISOString().split('T')[0],
                                    targetCompletionDate: ''
                                  });
                                  setScopeModalOpen(true);
                                  setActiveStatusDropdown(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              >
                                <FiCheck size={14} />
                                <span>Approve Order</span>
                              </button>
                            )}
                            {ord.status === 'WAITING_ADMIN_APPROVAL' && (
                              <button
                                type="button"
                                onClick={() => {
                                  dispatch(adminApproveJob(ord.id));
                                  setActiveStatusDropdown(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              >
                                <FiCheck size={14} />
                                <span>Approve Completion</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrder(ord);
                                setOrderForm({
                                  customer: ord.customer,
                                  email: ord.email || '',
                                  phone: ord.phone || '',
                                  type: ord.type,
                                  assignedTechnician: ord.assignedTechnician,
                                  amount: ord.amount,
                                  location: ord.location || 'Chennai Area',
                                  status: ord.status
                                });
                                setEditModalOpen(true);
                                setActiveStatusDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            >
                              <FiEdit size={14} />
                              <span>Edit Order Details</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer & Order Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{ord.customer}</span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs">₹{(ord.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                        📞 {ord.phone || '+91 98765 43210'} • ✉️ {ord.email || 'customer@sktech.com'}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">{ord.type}</span>
                        <span className="text-slate-400 font-medium">Staff: <strong className="text-slate-700 dark:text-slate-200">{ord.assignedTechnician}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 💻 Desktop Table View (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto min-w-full pb-24">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-xs font-medium">
                <FiInfo size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No orders match your search parameters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 whitespace-nowrap w-32">Order ID</th>
                    <th className="py-3.5 px-4 min-w-[180px] max-w-[220px]">Customer Details</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Order Type</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-36">Assigned Staff</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-28">Amount</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap w-40">Status & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                  {filteredOrders.map((ord) => {
                    const isOpenDropdown = activeStatusDropdown === ord.id;
                    return (
                      <tr 
                        key={ord.id} 
                        onClick={() => setSelectedOrder(ord)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-4 align-middle font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{ord.id}</td>
                        <td className="py-4 px-4 align-middle max-w-[220px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-primary transition-colors truncate" title={ord.customer}>{ord.customer}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5 font-sans truncate" title={`${ord.phone || ''} | ${ord.email || ''}`}>{ord.phone} | {ord.email}</div>
                        </td>
                        <td className="py-4 px-4 align-middle max-w-[300px]">
                          <div className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={ord.type}>
                            {ord.type}
                          </div>
                        </td>
                        <td className="py-4 px-4 align-middle font-semibold whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
                            ord.assignedTechnician && ord.assignedTechnician !== 'Unassigned'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 font-bold'
                              : 'text-slate-500 dark:text-slate-400 font-normal'
                          }`}>
                            {ord.assignedTechnician || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-4 px-4 align-middle font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">₹{(ord.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-4 px-4 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStatusDropdown(isOpenDropdown ? null : ord.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer ${getStatusBadge(ord.status)} hover:opacity-90`}
                            >
                              <span>{ord.status}</span>
                              <FiChevronDown className="w-3.5 h-3.5 text-current opacity-70" />
                            </button>

                            {isOpenDropdown && (
                              <div 
                                className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1 font-semibold text-xs animate-in fade-in zoom-in-95 duration-100 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                  Order Actions
                                </div>
                                {(ord.status === 'Pending' || ord.status === 'Pending Approval') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOrderToScope(ord);
                                      setScopeForm({
                                        orderCategory: 'Delivery & Installation',
                                        requiredTechniciansCount: 1,
                                        estimatedDays: 1,
                                        startDate: new Date().toISOString().split('T')[0],
                                        targetCompletionDate: ''
                                      });
                                      setScopeModalOpen(true);
                                      setActiveStatusDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-bold transition-colors cursor-pointer"
                                  >
                                    <FiCheck className="w-3.5 h-3.5" />
                                    <span>Approve Order</span>
                                  </button>
                                )}
                                {ord.status === 'WAITING_ADMIN_APPROVAL' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      dispatch(adminApproveJob(ord.id));
                                      setActiveStatusDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-bold transition-colors cursor-pointer"
                                  >
                                    <FiCheck className="w-3.5 h-3.5" />
                                    <span>Approve Completion</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOrder(ord);
                                    setOrderForm({
                                      customer: ord.customer,
                                      email: ord.email || '',
                                      phone: ord.phone || '',
                                      type: ord.type,
                                      assignedTechnician: ord.assignedTechnician,
                                      amount: ord.amount,
                                      location: ord.location || 'Chennai Area',
                                      status: ord.status
                                    });
                                    setEditModalOpen(true);
                                    setActiveStatusDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-bold transition-colors cursor-pointer"
                                >
                                  <FiEdit className="w-3.5 h-3.5" />
                                  <span>Edit Order</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(ord);
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
      ) : (
        /* Grid Mode - Card Layout matching 4-column structure */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-450 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              No orders match the active filters.
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div key={ord.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ord.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </div>

                  <div className="mt-4 text-left">
                    <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm truncate">{ord.customer}</h4>
                    <span className="text-xs text-slate-400 mt-0.5 block truncate">{ord.email} | {ord.phone}</span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-55 dark:border-slate-800 pt-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Order Type</span>
                      <span className="font-semibold text-slate-850 dark:text-slate-200">{ord.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Assigned Tech</span>
                      <span className="font-semibold text-slate-850 dark:text-slate-200">{ord.assignedTechnician}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Location</span>
                      <span className="font-semibold text-slate-850 dark:text-slate-200 truncate max-w-[100px]">{ord.location || 'Chennai Area'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-55 dark:border-slate-800/60 pt-2 mt-2">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Price</span>
                      <span className="font-semibold text-primary dark:text-emerald-400 text-sm">₹{(ord.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-55 dark:border-slate-800 pt-3 flex gap-2">
                  <button 
                    onClick={() => setSelectedOrder(ord)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-300 text-[11px] font-semibold rounded-xl transition-colors border border-slate-100 dark:border-slate-800"
                  >
                    <FiEye /> View
                  </button>
                  <button 
                    onClick={() => {
                      setEditingOrder(ord);
                      setOrderForm({
                        customer: ord.customer,
                        email: ord.email || '',
                        phone: ord.phone || '',
                        type: ord.type,
                        assignedTechnician: ord.assignedTechnician,
                        amount: ord.amount,
                        location: ord.location || 'Chennai Area',
                        status: ord.status
                      });
                      setEditModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 text-[11px] font-semibold rounded-xl transition-colors border border-blue-100 dark:border-blue-900/30"
                  >
                    Edit
                  </button>
                  {ord.status === 'Pending' && (
                    <button 
                      onClick={() => {
                        setOrderToScope(ord);
                        setScopeForm({
                          orderCategory: 'Delivery & Installation',
                          requiredTechniciansCount: 1,
                          estimatedDays: 1,
                          startDate: new Date().toISOString().split('T')[0],
                          targetCompletionDate: ''
                        });
                        setScopeModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 text-[11px] font-semibold rounded-xl transition-colors border border-emerald-100 dark:border-emerald-900/30"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Register New Order Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Order">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Ramesh Kumar" 
              value={orderForm.customer}
              onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
              <input 
                required
                type="tel" 
                maxLength={10}
                placeholder="10-digit mobile number" 
                value={orderForm.phone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setOrderForm({ ...orderForm, phone: cleaned });
                }}
                className={`w-full text-xs p-2.5 border ${
                  orderForm.phone && (orderForm.phone.length !== 10 || !/^[6-9]\d{9}$/.test(orderForm.phone))
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                } bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100`}
              />
              {orderForm.phone && orderForm.phone.length < 10 && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">
                  Phone number must be exactly 10 digits ({orderForm.phone.length}/10)
                </p>
              )}
              {orderForm.phone && orderForm.phone.length === 10 && !/^[6-9]\d{9}$/.test(orderForm.phone) && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">
                  Must start with 6, 7, 8, or 9 for valid Indian mobile number
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
              <input 
                required
                type="email" 
                placeholder="customer@domain.com" 
                value={orderForm.email}
                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Type</label>
              <select 
                value={orderForm.type}
                onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                {!['Cameras Installation', 'CCTV Installation', 'AMC Service', 'Cameras Repair', 'DVR Upgrade', 'System Audit'].includes(orderForm.type) && orderForm.type && (
                  <option value={orderForm.type}>{orderForm.type}</option>
                )}
                <option>Cameras Installation</option>
                <option>CCTV Installation</option>
                <option>AMC Service</option>
                <option>Cameras Repair</option>
                <option>DVR Upgrade</option>
                <option>System Audit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assigned Technician</label>
              <select 
                value={orderForm.assignedTechnician}
                onChange={(e) => setOrderForm({ ...orderForm, assignedTechnician: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Unassigned">Unassigned</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Items / Package Description (Optional)</label>
            <textarea 
              rows="2"
              placeholder="e.g. 4 Hikvision IP Cameras, 1 NVR, 1 TB HDD..." 
              value={orderForm.items || ''}
              onChange={(e) => setOrderForm({ ...orderForm, items: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 resize-none"
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Amount (₹)</label>
              <input 
                required
                type="number" 
                placeholder="Amount in Rupees" 
                value={orderForm.amount}
                onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location Area</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Adyar, Chennai" 
                value={orderForm.location}
                onChange={(e) => setOrderForm({ ...orderForm, location: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Create Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Detail Modal */}
      <Modal isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} title="Order Detail View">
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Order ID</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.id}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Date Created</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.date}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Customer Name</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.customer}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Location</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.location || 'Chennai Area'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Contact Detail</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.phone}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.email}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Service/Installation Type</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.type}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Assigned Technician</span>
                <span className="font-semibold text-slate-850 dark:text-slate-205">{selectedOrder.assignedTechnician}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Order Value</span>
                <span className="font-semibold text-slate-855 dark:text-white text-sm">₹{selectedOrder.amount?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold mb-0.5">Current Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Live GPS Tracking & Map Navigation Section */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between mt-3 text-left">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="font-bold text-xs">Live GPS Tracking & Location</span>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {selectedOrder.assignedTechnician !== 'Unassigned'
                      ? `Technician ${selectedOrder.assignedTechnician} live tracking ready`
                      : `Customer Address: ${selectedOrder.location || 'Nagarabhavi, Bengaluru'}`}
                  </p>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(selectedOrder.location || selectedOrder.customer || 'Bengaluru')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Open Google Map</span>
              </a>
            </div>

            {/* List Technicians Who Accepted the Order */}
            {selectedOrder.status === 'Approved' && selectedOrder.assignedTechnician === 'Unassigned' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-left">
                <span className="block text-slate-400 font-bold mb-2">Technicians Who Accepted This Order</span>
                {selectedOrder.acceptedBy && selectedOrder.acceptedBy.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.acceptedBy.map((techName) => {
                      const techInfo = technicians.find(t => t.name === techName);
                      return (
                        <div key={techName} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{techName}</span>
                            <span className="block text-[10px] text-slate-450 font-semibold">{techInfo?.specialization || 'Service Technician'}</span>
                          </div>
                          <button
                            onClick={() => {
                              dispatch(assignTechnicianToOrder({ orderId: selectedOrder.id, technicianName: techName }));
                              setSelectedOrder(prev => ({
                                ...prev,
                                assignedTechnician: techName,
                                status: 'In Progress'
                              }));
                            }}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-bold rounded-lg transition-colors"
                          >
                            Assign & Approve Project
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No technicians have accepted this order yet.</span>
                )}
              </div>
            )}

            {/* Technician Site Evidence Photos (Before & After) */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-left space-y-3">
              <span className="block text-slate-800 dark:text-slate-200 font-bold text-xs">
                📸 Technician Site Evidence Photos (Before & After)
              </span>

              {((selectedOrder.beforePhotos && selectedOrder.beforePhotos.length > 0) || (selectedOrder.afterPhotos && selectedOrder.afterPhotos.length > 0)) ? (
                <div className="space-y-4">
                  {/* Before Photos */}
                  {selectedOrder.beforePhotos && selectedOrder.beforePhotos.length > 0 && (
                    <div>
                      <span className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-2">
                        Before Installation Evidence ({selectedOrder.beforePhotos.length})
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedOrder.beforePhotos.map((p, i) => (
                          <div key={p.id || i} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-850">
                            <img src={p.url} alt={p.caption} className="w-full h-32 object-cover" />
                            <div className="p-2 text-[11px] space-y-0.5">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.caption}</p>
                              <p className="text-[10px] text-slate-400">{p.uploadedAt || 'Recently uploaded'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* After Photos */}
                  {selectedOrder.afterPhotos && selectedOrder.afterPhotos.length > 0 && (
                    <div>
                      <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                        After Installation Completion Evidence ({selectedOrder.afterPhotos.length})
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedOrder.afterPhotos.map((p, i) => (
                          <div key={p.id || i} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-850">
                            <img src={p.url} alt={p.caption} className="w-full h-32 object-cover" />
                            <div className="p-2 text-[11px] space-y-0.5">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.caption}</p>
                              <p className="text-[10px] text-slate-400">{p.uploadedAt || 'Recently uploaded'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs text-slate-400 text-center">
                  No site evidence photos uploaded by technician yet.
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-805 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Order Details">
        {editingOrder && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              dispatch(editOrder({
                id: editingOrder.id,
                customer: orderForm.customer,
                email: orderForm.email,
                phone: orderForm.phone,
                type: orderForm.type,
                assignedTechnician: orderForm.assignedTechnician,
                amount: parseFloat(orderForm.amount) || 0,
                location: orderForm.location,
                status: orderForm.status
              }));
              setEditModalOpen(false);
              setEditingOrder(null);
            }} 
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer Name</label>
              <input 
                required
                type="text" 
                value={orderForm.customer}
                onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
                <input 
                  required
                  type="text" 
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={orderForm.email}
                  onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Type</label>
                <select 
                  value={orderForm.type}
                  onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                >
                  {!['Cameras Installation', 'CCTV Installation', 'AMC Service', 'Cameras Repair', 'DVR Upgrade', 'System Audit'].includes(orderForm.type) && orderForm.type && (
                    <option value={orderForm.type}>{orderForm.type}</option>
                  )}
                  <option>Cameras Installation</option>
                  <option>CCTV Installation</option>
                  <option>AMC Service</option>
                  <option>Cameras Repair</option>
                  <option>DVR Upgrade</option>
                  <option>System Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assigned Technician</label>
                <select 
                  value={orderForm.assignedTechnician}
                  onChange={(e) => setOrderForm({ ...orderForm, assignedTechnician: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                >
                  <option value="Unassigned">Unassigned</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Amount (₹)</label>
                <input 
                  required
                  type="number" 
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location Area</label>
                <input 
                  required
                  type="text" 
                  value={orderForm.location}
                  onChange={(e) => setOrderForm({ ...orderForm, location: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Status</label>
              <select
                value={orderForm.status}
                onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Pending">Pending</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="In Progress">In Progress</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="pt-2 flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingOrder(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
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

      {/* Scope Order Modal */}
      <Modal isOpen={scopeModalOpen} onClose={() => setScopeModalOpen(false)} title="Define Project Scope & Approve">
        {orderToScope && (
          <form onSubmit={handleScopeOrder} className="space-y-4 text-left">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl mb-4">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                You are approving order <strong className="font-bold">{orderToScope.id}</strong>. Please define the scope.
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Category</label>
              <select 
                value={scopeForm.orderCategory}
                onChange={(e) => setScopeForm({ ...scopeForm, orderCategory: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Delivery & Installation">Delivery & Installation</option>
                <option value="Delivery Only">Delivery Only</option>
              </select>
            </div>

            {scopeForm.orderCategory === 'Delivery & Installation' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Required Technicians</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={scopeForm.requiredTechniciansCount}
                      onChange={(e) => setScopeForm({ ...scopeForm, requiredTechniciansCount: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Estimated Days</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={scopeForm.estimatedDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value, 10) || 1;
                        const start = new Date(scopeForm.startDate);
                        start.setDate(start.getDate() + (days - 1));
                        setScopeForm({ 
                          ...scopeForm, 
                          estimatedDays: e.target.value,
                          targetCompletionDate: start.toISOString().split('T')[0]
                        });
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Start Date</label>
                    <input 
                      required
                      type="date" 
                      value={scopeForm.startDate}
                      onChange={(e) => {
                        const start = new Date(e.target.value);
                        const days = parseInt(scopeForm.estimatedDays, 10) || 1;
                        start.setDate(start.getDate() + (days - 1));
                        setScopeForm({ 
                          ...scopeForm, 
                          startDate: e.target.value,
                          targetCompletionDate: start.toISOString().split('T')[0]
                        });
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Completion Date</label>
                    <input 
                      required
                      type="date" 
                      value={scopeForm.targetCompletionDate}
                      onChange={(e) => setScopeForm({ ...scopeForm, targetCompletionDate: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setScopeModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <FiCheck /> Approve & Save Scope
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
