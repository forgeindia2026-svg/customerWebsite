import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addCustomer, editCustomer } from '../../redux/dashboardSlice';
import { FiSearch, FiMail, FiPhone, FiMapPin, FiGrid, FiList, FiPlus, FiLayers, FiInfo, FiUsers, FiShoppingBag, FiCheckCircle, FiDollarSign, FiTool } from 'react-icons/fi';
import Modal from '../../components/Modal';

function formatLocation(locationStr) {
  if (!locationStr) return { address: 'N/A', service: null };
  const match = locationStr.match(/(.*?)\s*\[Service:\s*(.*?)\]/i);
  if (match) {
    return {
      address: match[1].trim(),
      service: match[2].trim()
    };
  }
  return {
    address: locationStr,
    service: null
  };
}

const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60',
  ];
  const s = name || 'Customer';
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash += s.charCodeAt(i);
  return colors[hash % colors.length];
};

export default function Customers() {
  const dispatch = useDispatch();
  const customers = useSelector(state => state.dashboard?.customers) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filteredCustomers = safeCustomers.filter(cust => {
    if (!cust || typeof cust !== 'object') return false;
    const name = typeof cust.name === 'string' ? cust.name : '';
    const phone = typeof cust.phone === 'string' || typeof cust.phone === 'number' ? String(cust.phone) : '';
    const email = typeof cust.email === 'string' ? cust.email : '';
    const search = (searchTerm || '').toLowerCase();
    return name.toLowerCase().includes(search) ||
           phone.includes(search) ||
           email.toLowerCase().includes(search);
  });

  const getThemeClass = (index) => {
    const themes = [
      {
        border: 'border-l-4 border-l-blue-500',
        badge: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        billing: 'text-blue-600 dark:text-blue-400'
      },
      {
        border: 'border-l-4 border-l-emerald-500',
        badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        billing: 'text-emerald-600 dark:text-emerald-400'
      },
      {
        border: 'border-l-4 border-l-amber-500',
        badge: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        billing: 'text-amber-600 dark:text-amber-400'
      },
      {
        border: 'border-l-4 border-l-purple-500',
        badge: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        billing: 'text-purple-600 dark:text-purple-400'
      },
      {
        border: 'border-l-4 border-l-teal-500',
        badge: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        billing: 'text-teal-600 dark:text-teal-400'
      },
      {
        border: 'border-l-4 border-l-red-500',
        badge: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        billing: 'text-red-600 dark:text-red-400'
      }
    ];
    return themes[index % themes.length];
  };

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    dispatch(addCustomer(customerForm));
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      location: ''
    });
    setModalOpen(false);
  };

  const totalCustomersCount = safeCustomers.length;
  const totalOrdersCount = safeCustomers.reduce((sum, c) => sum + (Number(c.installationsCount) || 0), 0);
  const totalSpentAmount = safeCustomers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
  const activeLocationsCount = new Set(safeCustomers.map(c => c.location).filter(Boolean)).size;

  return (
    <div className="space-y-6">

      {/* 📊 Colorful Customers KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#E5EFFF] border border-[#CCE1FC] dark:bg-blue-900/30 dark:border-blue-800 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Customers</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {totalCustomersCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#1D68FE] text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
            <FiUsers size={22} />
          </div>
        </div>

        {/* 2. Active Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#D6F5E3] border border-[#BBECD0] dark:bg-emerald-900/30 dark:border-emerald-800 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Orders Delivered</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {totalOrdersCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#069655] text-white flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
            <FiCheckCircle size={22} />
          </div>
        </div>

        {/* 3. Locations */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F3EAFF] border border-[#EAD9FF] dark:bg-purple-900/30 dark:border-purple-800 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Locations</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {activeLocationsCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#8B2BE2] text-white flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0">
            <FiMapPin size={22} />
          </div>
        </div>

        {/* 4. Total Billing */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FEF5D2] border border-[#FDE68A] dark:bg-amber-900/30 dark:border-amber-800 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Billing</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ₹{totalSpentAmount.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E58A00] text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
            <FiDollarSign size={22} />
          </div>
        </div>
      </div>
      
      {/* Search Bar, Location Tabs & Switcher Row */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Search */}
        <div className="relative w-full xl:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FiSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search customers by name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Right Side Controls (View Switcher & Onboard Customer Button) */}
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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FiPlus /> Add Customer
          </button>
        </div>

      </div>

      {/* Main Customers content */}
      {viewMode === 'grid' ? (
        /* Customers Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-450 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              No customers found matching that query.
            </div>
          ) : (
            filteredCustomers.map((cust, idx) => {
              const theme = getThemeClass(idx);
              return (
                <div 
                  key={cust.id || idx} 
                  className={`bg-white dark:bg-slate-900 rounded-2xl border-y border-r border-t-slate-100 border-b-slate-100 border-r-slate-100 dark:border-t-slate-800 dark:border-b-slate-800 dark:border-r-slate-800 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-all group ${theme.border}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-left min-w-0 flex-1">
                        <h4 className="ty-card-title truncate text-sm font-extrabold" title={cust.name}>{cust.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed flex items-start gap-1">
                          <FiMapPin size={12} className="shrink-0 mt-0.5 text-red-500" />
                          <span>{cust.location || 'N/A'}</span>
                        </p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs ${theme.badge}`}>
                        {(cust.name || 'CU').slice(0, 2)}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 border-t border-b border-slate-100 dark:border-slate-800/80 py-2 text-left">
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 font-semibold">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cust.phone || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">CCTV Orders</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">{cust.installationsCount || 0} Orders</span>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Total Billing</span>
                        <span className={`text-xs sm:text-sm font-black font-mono ${theme.billing}`}>₹{(cust.totalSpent || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingCustomer(cust);
                          setCustomerForm({
                            name: cust.name,
                            email: cust.email,
                            phone: cust.phone,
                            location: cust.location
                          });
                          setEditModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50 shrink-0 cursor-pointer ml-1"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Customers Tabular List View (with Mobile Card Support) */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 md:p-0 overflow-hidden transition-colors">
          
          {/* 📱 Mobile Customer List Cards (block md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No customers match your search parameters.
              </div>
            ) : (
              filteredCustomers.map((cust, idx) => {
                const { address, service } = formatLocation(cust.location);
                return (
                  <div key={`mob-cust-${cust.id || idx}`} className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${getAvatarColor(cust.name)}`}>
                          {(cust.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{cust.name}</h4>
                          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                            #{cust.id || `CUST-0${idx + 1}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCustomer(cust);
                          setCustomerForm({
                            name: cust.name,
                            email: cust.email,
                            phone: cust.phone,
                            location: cust.location
                          });
                          setEditModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 text-[10px] font-bold rounded-lg border border-blue-200 shrink-0"
                      >
                        Edit
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2" title={cust.location}>
                      📍 {address}
                    </p>
                    {service && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60">
                        Service: {service}
                      </span>
                    )}

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">📞 {cust.phone || 'N/A'}</p>
                      <div className="flex items-center justify-between font-mono font-bold pt-0.5">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                          {cust.installationsCount || 0} Orders
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                          ₹{(cust.totalSpent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 💻 Desktop Table View (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto w-full">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-xs font-medium">
                <FiInfo size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No customers match your search parameters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 via-blue-50/50 to-slate-100 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] align-middle">
                    <th className="py-3 px-3 whitespace-nowrap w-28">Customer ID</th>
                    <th className="py-3 px-3 whitespace-nowrap min-w-[150px]">Customer Name</th>
                    <th className="py-3 px-3 whitespace-nowrap w-36">Contact Details</th>
                    <th className="py-3 px-3 min-w-[170px]">Location Area</th>
                    <th className="py-3 px-3 whitespace-nowrap text-center w-28">Orders</th>
                    <th className="py-3 px-3 whitespace-nowrap text-right w-32">Total Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                  {filteredCustomers.map((cust, idx) => {
                    const { address, service } = formatLocation(cust.location);
                    return (
                      <tr 
                        key={cust.id || idx} 
                        onClick={() => {
                          setEditingCustomer(cust);
                          setCustomerForm({
                            name: cust.name,
                            email: cust.email,
                            phone: cust.phone,
                            location: cust.location
                          });
                          setEditModalOpen(true);
                        }}
                        className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        {/* 1. Colorful Customer ID */}
                        <td className="py-3.5 px-3 align-middle whitespace-nowrap w-28">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl font-mono font-black text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs group-hover:scale-105 group-hover:border-indigo-400 transition-all">
                            #{cust.id || `CUST-0${idx + 1}`}
                          </span>
                        </td>

                        {/* 2. Customer Name with Colorful Avatar */}
                        <td className="py-3.5 px-3 align-middle min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${getAvatarColor(cust.name)}`}>
                              {(cust.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm block leading-tight group-hover:text-blue-600 transition-colors truncate max-w-[130px]" title={cust.name}>
                                {cust.name}
                              </span>
                              {cust.email && !cust.email.includes('@example.com') && !cust.email.includes('@domain.com') ? (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block mt-0.5 max-w-[130px]" title={cust.email}>
                                  {cust.email}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block mt-0.5">
                                  Customer
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Colorful Contact Details */}
                        <td className="py-3.5 px-3 align-middle whitespace-nowrap w-36">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 text-xs font-bold">
                            <FiPhone size={11} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{cust.phone || 'N/A'}</span>
                          </div>
                        </td>

                        {/* 4. Location Area with Pin & Service Badge */}
                        <td className="py-3.5 px-3 align-middle min-w-[170px]">
                          <div className="flex flex-col gap-1 min-w-0 max-w-[240px] text-left" title={cust.location}>
                            <div className="flex items-start gap-1 text-slate-800 dark:text-slate-200">
                              <FiMapPin size={12} className="text-amber-500 shrink-0 mt-0.5" />
                              <span className="font-semibold text-xs leading-snug break-words line-clamp-2">
                                {address}
                              </span>
                            </div>
                            {service && (
                              <div className="pl-3.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 shadow-2xs">
                                  <FiTool size={9} className="text-purple-500" />
                                  <span>Service: {service}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. Colorful Orders Badge */}
                        <td className="py-3.5 px-3 align-middle text-center whitespace-nowrap w-28">
                          {Number(cust.installationsCount) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-bold text-xs shadow-2xs">
                              <FiShoppingBag size={11} className="text-amber-600" />
                              <span>{cust.installationsCount} orders</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs border border-slate-200/60 dark:border-slate-700">
                              0 orders
                            </span>
                          )}
                        </td>

                        {/* 6. Colorful Total Billing */}
                        <td className="py-3.5 px-3 align-middle text-right whitespace-nowrap w-32">
                          {Number(cust.totalSpent) > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs sm:text-sm border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                              ₹{(cust.totalSpent || 0).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold text-xs border border-slate-200/60 dark:border-slate-700">
                              ₹0
                            </span>
                          )}
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

      {/* Add New Customer Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Customer">
        <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Ramesh Kumar" 
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
            <input 
              required
              type="tel" 
              maxLength={10}
              placeholder="10-digit mobile number" 
              value={customerForm.phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                setCustomerForm({ ...customerForm, phone: cleaned });
              }}
              className={`w-full text-xs p-2.5 border ${
                customerForm.phone && (customerForm.phone.length !== 10 || !/^[6-9]\d{9}$/.test(customerForm.phone))
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-primary'
              } bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100`}
            />
            {customerForm.phone && customerForm.phone.length < 10 && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">
                Phone number must be exactly 10 digits ({customerForm.phone.length}/10)
              </p>
            )}
            {customerForm.phone && customerForm.phone.length === 10 && !/^[6-9]\d{9}$/.test(customerForm.phone) && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">
                Must start with 6, 7, 8, or 9 for valid Indian mobile number
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location Area / Address</label>
            <input 
              type="text"
              placeholder="Enter customer location or address (e.g. Dharmapuri)" 
              value={customerForm.location}
              onChange={(e) => setCustomerForm({ ...customerForm, location: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Onboard Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Customer Details">
        {editingCustomer && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              dispatch(editCustomer({
                id: editingCustomer.id,
                name: customerForm.name,
                email: customerForm.email,
                phone: customerForm.phone,
                location: customerForm.location
              }));
              setEditModalOpen(false);
              setEditingCustomer(null);
            }} 
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
              <input 
                required
                type="text" 
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
              <input 
                required
                type="tel" 
                maxLength={10}
                placeholder="10-digit mobile number" 
                value={customerForm.phone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setCustomerForm({ ...customerForm, phone: cleaned });
                }}
                className={`w-full text-xs p-2.5 border ${
                  customerForm.phone && (customerForm.phone.length !== 10 || !/^[6-9]\d{9}$/.test(customerForm.phone))
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                } bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100`}
              />
              {customerForm.phone && customerForm.phone.length < 10 && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">
                  Phone number must be exactly 10 digits ({customerForm.phone.length}/10)
                </p>
              )}
              {customerForm.phone && customerForm.phone.length === 10 && !/^[6-9]\d{9}$/.test(customerForm.phone) && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">
                  Must start with 6, 7, 8, or 9 for valid Indian mobile number
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location Area / Address</label>
              <input 
                type="text"
                placeholder="Enter customer location or address (e.g. Dharmapuri)" 
                value={customerForm.location}
                onChange={(e) => setCustomerForm({ ...customerForm, location: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCustomer(null);
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

    </div>
  );
}
