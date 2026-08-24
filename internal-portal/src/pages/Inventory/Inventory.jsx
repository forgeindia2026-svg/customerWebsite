import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiPackage, FiAlertTriangle, FiCheckCircle, FiDownload, FiPlus, 
  FiSearch, FiSliders, FiChevronDown, FiChevronLeft, FiChevronRight, 
  FiShoppingCart, FiArrowUpRight, FiArrowDown
} from 'react-icons/fi';

// Static assets mapper matching the uploaded files
const productMetadata = {
  "HIK-IP-DOM-4MP": {
    image: "/hikvision_dome_camera.png",
    subtext: "High quality 4MP dome camera with IR"
  },
  "DAH-AN-BUL-2MP": {
    image: "/dahua_bullet_camera.png",
    subtext: "2MP bullet camera with night vision"
  },
  "CP-NVR-8CH": {
    image: "/cp_plus_nvr.png",
    subtext: "8 Channel Network Video Recorder"
  },
  "SEA-HDD-2TB": {
    image: "/surveillance_hdd.png",
    subtext: "Surveillance Hard Disk Drive"
  },
  "FIN-CBL-90M": {
    image: "/cctv_cable.png",
    subtext: "High quality copper CCTV cable"
  }
};

export default function Inventory() {
  const inventory = useSelector(state => state.dashboard?.inventory) || [];

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Render status badge configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock': 
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-100/50 dark:border-emerald-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-505" />
            In Stock
          </span>
        );
      case 'Low Stock': 
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-lg border border-amber-100/50 dark:border-amber-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-505" />
            Low Stock
          </span>
        );
      default: 
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        );
    }
  };

  // Get progress bar color
  const getStockBarColor = (totalStock, reorderLevel) => {
    if (totalStock <= reorderLevel) return 'bg-amber-500'; // Low Stock
    if (totalStock > 100) return 'bg-emerald-500'; // High Stock
    return 'bg-blue-500'; // Normal In Stock
  };

  // Filter and Search logic
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = 
      selectedCategory === 'All Categories' || 
      item.category === selectedCategory;

    const currentStatus = item.totalStock > item.reorderLevel ? 'In Stock' : 'Low Stock';
    const matchesStatus = 
      selectedStatus === 'All Status' || 
      currentStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Unique categories list for filters
  const categoriesList = ['All Categories', ...new Set(inventory.map(i => i.category))];

  return (
    <div className="space-y-6">
      
      {/* 1. Metric Cards Grid matching the 2nd Image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Unique SKUs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4.5">
            <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center">
              <FiPackage size={20} />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Unique SKUs</span>
              <h4 className="text-lg font-medium text-slate-850 dark:text-slate-50 mt-1">{inventory.length} Items</h4>
              <p className="text-xs text-slate-455 dark:text-slate-400 font-semibold mt-1">Total products in inventory</p>
            </div>
          </div>
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            {/* Visual tiny indicator block */}
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4.5">
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-955/20 text-amber-500 rounded-xl flex items-center justify-center">
              <FiAlertTriangle size={20} />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
              <h4 className="text-lg font-medium text-slate-850 dark:text-slate-50 mt-1">
                {inventory.filter(i => i.totalStock <= i.reorderLevel).length} items
              </h4>
              <p className="text-xs text-slate-455 dark:text-slate-400 font-semibold mt-1">Items below reorder level</p>
            </div>
          </div>
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
            <FiChevronRight size={16} className="text-amber-500" />
          </div>
        </div>

        {/* Optimal Stock Level */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4.5">
            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl flex items-center justify-center">
              <FiCheckCircle size={20} />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optimal Stock Level</span>
              <h4 className="text-lg font-medium text-slate-850 dark:text-slate-50 mt-1">
                {inventory.filter(i => i.totalStock > i.reorderLevel).length} items
              </h4>
              <p className="text-xs text-slate-455 dark:text-slate-400 font-semibold mt-1">Items with healthy stock</p>
            </div>
          </div>
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
            <FiChevronRight size={16} className="text-emerald-500" />
          </div>
        </div>

      </div>

      {/* 2. Stock Ledger & Reorder Points Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden transition-colors">
        
        {/* Header Block with Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-snug">Stock Ledger & Reorder Points</h3>
            <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold mt-0.5 font-sans">Track inventory availability and manage reorder levels efficiently.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 rounded-xl text-xs font-semibold transition-colors">
              <FiDownload /> Export
            </button>
            <button className="flex items-center gap-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
              <FiPlus /> Add Product
            </button>
          </div>
        </div>

        {/* 3. Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-5 border-t border-slate-50 dark:border-slate-855 pt-4">
          {/* Search box */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <FiSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by SKU code or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-medium font-sans"
            />
          </div>

          {/* Filters Selectors Group */}
          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto no-scrollbar">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs pl-4 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-primary appearance-none cursor-pointer font-semibold"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs pl-4 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:border-primary appearance-none cursor-pointer font-semibold"
              >
                <option value="All Status">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
            </div>

            {/* Filters Button */}
            <button className="flex items-center gap-1.5 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 hover:bg-slate-50 text-slate-655 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all">
              <FiSliders /> Filters
            </button>
          </div>
        </div>

        {/* 4. Table Block */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3 px-3 w-40 flex items-center gap-1 cursor-pointer hover:text-slate-600 transition-colors">
                  SKU Code <FiArrowDown className="w-3 h-3 text-slate-350" />
                </th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 w-48">In Stock</th>
                <th className="py-3 px-3">Reorder Level</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quick Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-medium">
              {filteredInventory.map((inv) => {
                const meta = productMetadata[inv.sku] || { image: "/logo.png", subtext: inv.productName };
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    
                    {/* SKU Code with Image */}
                    <td className="py-4 px-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center p-0.5">
                          <img src={meta.image} alt={inv.sku} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white uppercase">{inv.sku}</span>
                      </div>
                    </td>

                    {/* Product Name & Subtext */}
                    <td className="py-4 px-3 align-middle text-left">
                      <div>
                        <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">{inv.productName}</h4>
                        <span className="text-xs text-slate-455 dark:text-slate-500 font-medium block mt-0.5 font-sans">{meta.subtext}</span>
                      </div>
                    </td>

                    {/* Category with badge styling */}
                    <td className="py-4 px-3 align-middle">
                      <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-655 dark:text-slate-350">
                        {inv.category}
                      </span>
                    </td>

                    {/* In Stock with Progress Bar */}
                    <td className="py-4 px-3 align-middle">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1 text-xs font-sans">
                          <span>{inv.totalStock} units</span>
                        </div>
                        <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getStockBarColor(inv.totalStock, inv.reorderLevel)}`}
                            style={{ width: `${Math.min((inv.totalStock / 150) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Reorder Level */}
                    <td className="py-4 px-3 align-middle text-slate-400 dark:text-slate-500 font-sans">
                      {inv.reorderLevel} units
                    </td>

                    {/* Status with Dot */}
                    <td className="py-4 px-3 align-middle">
                      {getStatusBadge(inv.totalStock > inv.reorderLevel ? 'In Stock' : 'Low Stock')}
                    </td>

                    {/* Quick Purchase actions */}
                    <td className="py-4 px-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-750">
                          <FiShoppingCart className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => alert(`Purchase order requisition issued for SKU ${inv.sku}`)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 text-blue-600 text-xs font-semibold rounded-xl border border-blue-100/50 dark:border-blue-900/30"
                        >
                          Reorder
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-50 dark:border-slate-855 text-xs text-slate-450 dark:text-slate-400 font-semibold font-sans">
          <span>Showing 1 to {filteredInventory.length} of {filteredInventory.length} items</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-755 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-50" disabled>
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                1
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-755 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-50" disabled>
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <select className="appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-lg text-xs font-semibold cursor-pointer">
                <option>10 / page</option>
                <option>20 / page</option>
                <option>50 / page</option>
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-3.5 h-3.5" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
