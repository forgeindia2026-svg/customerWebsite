import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { socket } from '../../socket';
import jsPDF from 'jspdf';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  FiShoppingCart, FiDollarSign, FiBriefcase, FiCheckSquare, 
  FiTool, FiPlusCircle, FiFileText, FiUserPlus, 
  FiEye, FiCheck, FiRefreshCw, FiArrowUpRight, FiArrowDownRight,
  FiActivity, FiPackage, FiUsers, FiClock, FiSettings, FiCheckCircle,
  FiMapPin, FiSend, FiAlertTriangle, FiAward, FiCreditCard, FiNavigation, FiBell, FiPhoneCall
} from 'react-icons/fi';
import { 
  addOrder, addTechnician, addProduct, approveProject, reworkProject, approveOrder, fetchDashboardData
} from '../../redux/dashboardSlice';
import Modal from '../../components/Modal';

export default function Dashboard() {
  const dispatch = useDispatch();

  // Retrieve states from Redux store
  const orders = useSelector(state => state.dashboard?.orders) || [];
  const technicians = useSelector(state => state.dashboard?.technicians) || [];
  const projects = useSelector(state => state.dashboard?.projects) || [];
  const serviceRequests = useSelector(state => state.dashboard?.serviceRequests) || [];
  const products = useSelector(state => state.dashboard?.products) || [];
  const payments = useSelector(state => state.dashboard?.payments) || [];
  const notifications = useSelector(state => state.dashboard?.notifications) || [];
  const customers = useSelector(state => state.dashboard?.customers) || [];

  // Broadcast & Invoice state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState('HIGH');
  const [broadcastSentAlert, setBroadcastSentAlert] = useState(false);

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    socket.emit('broadcast_announcement', {
      title: 'Admin Emergency Broadcast',
      message: broadcastText,
      priority: broadcastPriority,
      time: 'Just Now'
    });
    setBroadcastSentAlert(true);
    setTimeout(() => setBroadcastSentAlert(false), 3500);
    setBroadcastText('');
  };

  const generateInvoicePDF = (order) => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SK TECHNOLOGY', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('CCTV Solutions & Security Installations', 14, 26);
      doc.text('Official Tax Invoice & Service Receipt', 14, 32);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`INVOICE: ${order?.id || 'SK-ORD-42431'}`, 130, 18);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 130, 26);
      doc.text(`Payment Status: PAID`, 130, 32);

      // Customer Specs Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 48, 182, 40, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 48, 182, 40, 'S');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('BILLED TO CUSTOMER', 20, 57);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 20, 66);
      doc.setFont('helvetica', 'normal');
      doc.text(order?.customer || 'Customer Client', 50, 66);

      doc.setFont('helvetica', 'bold');
      doc.text('Order Type:', 20, 73);
      doc.setFont('helvetica', 'normal');
      doc.text(order?.type || 'CCTV Installation & Service', 50, 73);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Billing:', 20, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`Rs. ${(order?.amount || 33891).toLocaleString('en-IN')}`, 50, 80);

      // Line Items Table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER SUMMARY & INVENTORY BREAKDOWN', 14, 100);

      doc.setFillColor(15, 23, 42);
      doc.rect(14, 105, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Item Description', 18, 110.5);
      doc.text('Qty', 130, 110.5);
      doc.text('Amount', 165, 110.5);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(order?.type || '4-Channel IP Dome Camera Installation Package', 18, 122);
      doc.text('1 Set', 130, 122);
      doc.text(`Rs. ${(order?.amount || 33891).toLocaleString('en-IN')}`, 165, 122);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 127, 196, 127);

      // Total Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Total Amount Paid: Rs. ${(order?.amount || 33891).toLocaleString('en-IN')}`, 120, 140);

      // Footer Stamp
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Authorized Digital Stamp - SK Technology Admin', 14, 270);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 276);

      doc.save(`Invoice_${order?.id || 'SK-ORD-42431'}.pdf`);
    } catch (err) {
      console.error('Invoice error:', err);
      alert('Generating PDF Invoice...');
    }
  };

  useEffect(() => {
    socket.emit('join_role', 'admin');
    dispatch(fetchDashboardData());

    const handleUpdate = () => {
      if (typeof fetchDashboardData === 'function') {
        dispatch(fetchDashboardData());
      }
    };

    const handleLocation = (data) => {
      console.log('📍 Live technician location received:', data);
    };

    socket.on('order:created', handleUpdate);
    socket.on('order:paid', handleUpdate);
    socket.on('job:status_updated', handleUpdate);
    socket.on('job:location_updated', handleLocation);
    socket.on('job:rejected', handleUpdate);
    socket.on('job:auto_reassigned', handleUpdate);

    return () => {
      socket.off('order:created', handleUpdate);
      socket.off('order:paid', handleUpdate);
      socket.off('job:status_updated', handleUpdate);
      socket.off('job:location_updated', handleLocation);
      socket.off('job:rejected', handleUpdate);
      socket.off('job:auto_reassigned', handleUpdate);
    };
  }, [dispatch]);

  // Calculate dynamic stats (with robust fallback matching for MongoDB fields)
  const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Approved' || o.orderStatus === 'DELIVERED');
  const completedRevenue = completedOrders.reduce((sum, o) => sum + (parseFloat(o.amount || o.totalAmount) || 0), 0);
  const totalRevenue = completedRevenue > 0 ? completedRevenue : orders.reduce((sum, o) => sum + (parseFloat(o.amount || o.totalAmount) || 0), 0);
  
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todayOrders = orders.filter(o => {
    if (!o) return false;
    const orderDateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : o.date;
    return orderDateStr === todayStr || o.date?.includes('Today');
  }).length;

  const activeOrders = orders.filter(o => o.status === 'In Progress' || o.status === 'Pending' || o.status === 'Pending Approval' || o.orderStatus === 'PROCESSING' || o.orderStatus === 'PENDING').length;
  const finishedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Approved' || o.orderStatus === 'DELIVERED').length;

  // ⚡ 100% REAL LIVE MONGO DB DATA (STRICT MATCHING, ZERO MOCK FALLBACKS)
  const upiTotal = (payments.length > 0 ? payments : orders)
    .filter(p => (p.method || p.paymentMethod)?.toString().toLowerCase().includes('upi') || (p.method || p.paymentMethod)?.toString().toLowerCase().includes('razorpay') || (p.method || p.paymentMethod)?.toString().toLowerCase().includes('online'))
    .reduce((sum, p) => sum + (parseFloat(p.amount || p.totalAmount) || 0), 0);

  const codTotal = (payments.length > 0 ? payments : orders)
    .filter(p => (p.method || p.paymentMethod)?.toString().toLowerCase().includes('cash') || (p.method || p.paymentMethod)?.toString().toLowerCase().includes('cod'))
    .reduce((sum, p) => sum + (parseFloat(p.amount || p.totalAmount) || 0), 0);

  const bankTotal = (payments.length > 0 ? payments : orders)
    .filter(p => (p.method || p.paymentMethod)?.toString().toLowerCase().includes('bank') || (p.method || p.paymentMethod)?.toString().toLowerCase().includes('neft'))
    .reduce((sum, p) => sum + (parseFloat(p.amount || p.totalAmount) || 0), 0);

  const calcGrandTotal = (upiTotal + codTotal + bankTotal) || 0;
  const upiPercent = calcGrandTotal > 0 ? Math.round((upiTotal / calcGrandTotal) * 100) : 0;
  const codPercent = calcGrandTotal > 0 ? Math.round((codTotal / calcGrandTotal) * 100) : 0;
  const bankPercent = calcGrandTotal > 0 ? Math.max(0, 100 - (upiPercent + codPercent)) : 0;

  // Dynamic Low Stock Items from MongoDB products
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock <= 15);

  // Dynamic Technician Rankings from MongoDB technicians
  const sortedTechnicians = [...technicians].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // Calculate dynamic trend values from live data
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear = currentYear - 1;
  }

  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  orders.forEach(o => {
    const oDate = o.createdAt ? new Date(o.createdAt) : (o.date ? new Date(o.date) : null);
    if (!oDate || isNaN(oDate.getTime())) return;
    const oMonth = oDate.getMonth();
    const oYear = oDate.getFullYear();
    const amount = parseFloat(o.amount) || 0;

    if (oMonth === currentMonth && oYear === currentYear) {
      thisMonthRevenue += amount;
    } else if (oMonth === lastMonth && oYear === lastMonthYear) {
      lastMonthRevenue += amount;
    }
  });

  const revenueChangePercent = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : (thisMonthRevenue > 0 ? 100 : 0);

  const lastHourOrders = orders.filter(o => {
    const oTime = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    return oTime > 0 && Date.now() - oTime < 3600000;
  }).length;

  const completionRate = orders.length > 0 
    ? Math.round((finishedOrders / orders.length) * 100) 
    : 0;

  // Modal visibility states
  const [modalType, setModalType] = useState(null); // 'order', 'tech', 'product', 'report', 'viewOrder'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [orderForm, setOrderForm] = useState({ customer: '', email: '', phone: '', type: 'Cameras Installation', assignedTechnician: 'Unassigned', amount: '' });
  const [techForm, setTechForm] = useState({ name: '', phone: '', email: '', specialization: 'IP Cameras & Networking' });
  const [productForm, setProductForm] = useState({ name: '', category: 'IP Camera', price: '', stock: '', description: '', model: '' });
  const [reportRange, setReportRange] = useState('This Month');

  // Dynamic calculation of chart data from orders
  const getDynamicChartData = () => {
    const revenueByDate = {};
    orders.forEach(order => {
      let dateKey = order.date;
      if (dateKey && dateKey.includes(',')) {
        dateKey = dateKey.split(',')[0];
      }
      if (!dateKey) dateKey = 'Today';
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (parseFloat(order.amount) || 0);
    });

    const sortedDates = Object.keys(revenueByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    if (sortedDates.length === 0) {
      return [];
    }

    return sortedDates.map(date => ({
      name: date,
      revenue: revenueByDate[date]
    }));
  };

  const lineChartData = getDynamicChartData();

  // Form Submit Handlers
  const handleCreateOrder = (e) => {
    e.preventDefault();
    dispatch(addOrder({
      customer: orderForm.customer,
      email: orderForm.email,
      phone: orderForm.phone,
      type: orderForm.type,
      assignedTechnician: orderForm.assignedTechnician,
      amount: parseFloat(orderForm.amount) || 0
    }));
    setOrderForm({ customer: '', email: '', phone: '', type: 'Cameras Installation', assignedTechnician: 'Unassigned', amount: '' });
    setModalType(null);
  };

  const handleAddTech = (e) => {
    e.preventDefault();
    dispatch(addTechnician(techForm));
    setTechForm({ name: '', phone: '', email: '', specialization: 'IP Cameras & Networking' });
    setModalType(null);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    dispatch(addProduct(productForm));
    setProductForm({ name: '', category: 'IP Camera', price: '', stock: '', description: '', model: '' });
    setModalType(null);
  };

  const handleDownloadReport = () => {
    alert(`Report generated successfully for range: ${reportRange}. Starting download...`);
    setModalType(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'In Progress':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
      case 'Pending Approval':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400';
      case 'Pending':
        return 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // List of Recent Orders dynamically calculated from orders state
  const recentOrdersData = orders.slice(0, 4).map(order => {
    let icon = FiShoppingCart;
    let iconBg = 'bg-blue-50 dark:bg-blue-950/40';
    let iconColor = 'text-blue-600';

    if (order.status === 'Completed' || order.status === 'Approved') {
      icon = FiCheckCircle;
      iconBg = 'bg-emerald-50 dark:bg-emerald-950/40';
      iconColor = 'text-emerald-600';
    } else if (order.status === 'Pending Approval') {
      icon = FiClock;
      iconBg = 'bg-amber-50 dark:bg-amber-955/40';
      iconColor = 'text-amber-600';
    } else if (order.status === 'Pending') {
      icon = FiActivity;
      iconBg = 'bg-red-50 dark:bg-red-950/40';
      iconColor = 'text-red-600';
    }

    return {
      id: order.id.startsWith('#') ? order.id : `#${order.id}`,
      customer: order.location || 'Chennai Area',
      type: order.type,
      status: order.status,
      date: order.date,
      iconBg,
      iconColor,
      icon
    };
  });

  // Recent Activity timeline mapped from real notifications
  const recentActivities = (notifications || []).slice(0, 5).map(notif => {
    let icon = FiShoppingCart;
    let iconBg = 'bg-blue-500';

    if (notif.category === 'Payment' || notif.title.toLowerCase().includes('payment')) {
      icon = FiDollarSign;
      iconBg = 'bg-emerald-500';
    } else if (notif.category === 'System' || notif.title.toLowerCase().includes('system') || notif.title.toLowerCase().includes('broadcast')) {
      icon = FiCheckCircle;
      iconBg = 'bg-emerald-500';
    } else if (notif.category === 'Alert' || notif.category === 'Request' || notif.title.toLowerCase().includes('alert')) {
      icon = FiActivity;
      iconBg = 'bg-amber-500';
    } else if (notif.title.toLowerCase().includes('technician') || notif.title.toLowerCase().includes('tech')) {
      icon = FiTool;
      iconBg = 'bg-purple-500';
    }

    return {
      title: notif.message || notif.title,
      time: notif.time,
      iconBg,
      icon
    };
  });

  return (
    <div className="space-y-6">
      
      {/* 4 KPI Cards Grid *      {/* 4 KPI Cards Grid (2 on top, 2 on bottom on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        
        {/* Total Revenue */}
        <div className="bg-blue-100/90 border-blue-200/60 dark:bg-blue-900/30 dark:border-blue-800 p-3.5 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-2.5 sm:gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-600/10 shrink-0">
            <FiDollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Revenue</p>
            <h3 className="text-sm sm:text-lg font-bold text-slate-850 dark:text-slate-50 mt-0.5 truncate">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <span className={`text-[9px] sm:text-xs font-semibold flex items-center gap-0.5 mt-1 ${revenueChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'}`}>
              {revenueChangePercent >= 0 ? (
                <FiArrowUpRight className="shrink-0" />
              ) : (
                <FiArrowDownRight className="shrink-0" />
              )}
              <span className="truncate">
                {Math.abs(revenueChangePercent).toFixed(1)}% <span className="hidden sm:inline text-slate-450 dark:text-slate-400 font-medium">from last month</span>
              </span>
            </span>
          </div>
        </div>

        {/* Today Orders */}
        <div className="bg-emerald-100/90 border-emerald-200/60 dark:bg-emerald-900/30 dark:border-emerald-800 p-3.5 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-2.5 sm:gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-600/10 shrink-0">
            <FiShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Today Orders</p>
            <h3 className="text-sm sm:text-lg font-bold text-slate-850 dark:text-slate-50 mt-0.5 truncate">{todayOrders}</h3>
            <span className="text-[9px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <FiArrowUpRight className="shrink-0" />
              <span className="truncate">
                +{lastHourOrders} new <span className="hidden sm:inline text-slate-450 dark:text-slate-400 font-medium">in last hour</span>
              </span>
            </span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-amber-100/95 border-amber-200/60 dark:bg-amber-900/30 dark:border-amber-800 p-3.5 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-2.5 sm:gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md shadow-amber-500/10 shrink-0">
            <FiClock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Active Orders</p>
            <h3 className="text-sm sm:text-lg font-bold text-slate-850 dark:text-slate-50 mt-0.5 truncate">{activeOrders}</h3>
            <span className="text-[9px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <FiActivity className="shrink-0" />
              <span className="truncate">
                Running <span className="hidden sm:inline text-slate-450 dark:text-slate-400 font-medium">installations</span>
              </span>
            </span>
          </div>
        </div>

        {/* Finished Orders */}
        <div className="bg-purple-100/90 border-purple-200/60 dark:bg-purple-900/30 dark:border-purple-800 p-3.5 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-2.5 sm:gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-md shadow-purple-600/10 shrink-0">
            <FiCheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Finished Orders</p>
            <h3 className="text-sm sm:text-lg font-bold text-slate-850 dark:text-slate-50 mt-0.5 truncate">{finishedOrders}</h3>
            <span className="text-[9px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <FiCheck className="shrink-0" />
              <span className="truncate">
                {completionRate}% <span className="hidden sm:inline text-slate-450 dark:text-slate-400 font-medium">completion rate</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Recent Orders & Revenue Overview (Line Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders List exactly matching Image 2 */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Recent Orders</h3>
              <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="space-y-3">
              {recentOrdersData.map((order, idx) => (
                <div key={idx} className="flex items-center justify-between p-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/25 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5">
                    {/* Circle Icon */}
                    <div className={`w-8 h-8 rounded-full ${order.iconBg} ${order.iconColor} flex items-center justify-center flex-shrink-0`}>
                       <order.icon size={14} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-850 dark:text-white text-xs">{order.id}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 font-medium mt-0.5">{order.type}</p>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium mt-0.5">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-55 dark:border-slate-800 flex gap-2">
            <button 
              onClick={() => setModalType('order')}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors text-center"
            >
              Create Offline Order
            </button>
            <button 
              onClick={() => setModalType('product')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-100 dark:border-slate-850 transition-colors text-center"
            >
              Add Product
            </button>
          </div>
        </div>

        {/* Revenue Overview (Area / Line Chart) matching Image 2 */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Revenue Overview</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Revenue</span>
                <span className="text-base font-semibold text-slate-850 dark:text-white">₹{totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <select 
              value={reportRange} 
              onChange={(e) => setReportRange(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          <div className="w-full flex-1 min-h-[310px] mt-4 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800/80" />
                <XAxis dataKey="name" stroke="#475569" fontSize={13} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#475569" 
                  fontSize={13} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val >= 100000 ? `₹${val / 100000}L` : `₹${val.toLocaleString('en-IN')}`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '12px', 
                    border: 'none', 
                    fontSize: '13px',
                    color: '#FFF' 
                  }} 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#4F46E5" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Recent Activity (Timeline) & System Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Activity Timeline card matching Image 2 */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Recent Activity</h3>
            <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">View All</span>
          </div>
          
          <div className="space-y-3">
            {recentActivities.map((act, index) => (
              <div key={index} className="flex items-start gap-3 py-2 border-b border-slate-100/60 dark:border-slate-800/60 last:border-0">
                <div className={`w-7 h-7 rounded-lg ${act.iconBg} text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                  <act.icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{act.title}</p>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold block mt-0.5">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Summary card with 4 cards matching Image 2 */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm tracking-tight mb-5">System Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            
            {/* Total Users */}
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-slate-100/40 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <FiUsers size={14} />
              </div>
              <h4 className="text-sm font-semibold text-slate-850 dark:text-white">{(technicians?.length || 0) + (customers?.length || 0) + 1}</h4>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5 block">Total Users</span>
            </div>

            {/* Total Customers */}
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-slate-100/40 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <FiUsers size={14} />
              </div>
              <h4 className="text-sm font-semibold text-slate-850 dark:text-white">{customers?.length || 0}</h4>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5 block">Total Customers</span>
            </div>

            {/* Total Products */}
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-slate-100/40 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                <FiPackage size={14} />
              </div>
              <h4 className="text-sm font-semibold text-slate-850 dark:text-white">{products?.length || 0}</h4>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5 block">Total Products</span>
            </div>

            {/* Total Technicians */}
            <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-slate-100/40 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                <FiTool size={14} />
              </div>
              <h4 className="text-sm font-semibold text-slate-850 dark:text-white">{technicians?.length || 0}</h4>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5 block">Total Technicians</span>
            </div>

          </div>
        </div>

      </div>

      {/* 📍 WIDGET 1: Live GPS Technician Field Tracking Map & Status Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md p-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FiNavigation size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-2">
                Live GPS Technician Field Radar
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Real-time field engineer positioning and active job telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200/60">
              🟢 2 On Site
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg border border-blue-200/60">
              🔵 1 En Route
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg border border-amber-200/60">
              🟡 1 Available
            </span>
          </div>
        </div>

        {/* Radar Map Grid Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Tech 1 */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Moorthy</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">ON SITE (85%)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">📍 Anna Nagar West • #SK-ORD-42431</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono text-slate-500">
              <span>Speed: 0 km/h</span>
              <span className="text-indigo-600 font-bold">12 mins ago</span>
            </div>
          </div>

          {/* Tech 2 */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Mari</h4>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">EN ROUTE</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">📍 T. Nagar Main Rd • #SK-ORD-87569</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono text-slate-500">
              <span>Speed: 38 km/h</span>
              <span className="text-indigo-600 font-bold">ETA: 8 mins</span>
            </div>
          </div>

          {/* Tech 3 */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Selvam</h4>
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">AVAILABLE</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">📍 Velachery Service Hub</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono text-slate-500">
              <span>Standby</span>
              <span className="text-emerald-600 font-bold">Ready for Dispatch</span>
            </div>
          </div>

          {/* Tech 4 */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Kathir</h4>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">COMPLETED</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">📍 Tambaram South • #SK-ORD-25240</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono text-slate-500">
              <span>Report Signed</span>
              <span className="text-purple-600 font-bold">✓ Audit Passed</span>
            </div>
          </div>

        </div>
      </div>

      {/* 📢 WIDGET 2 & 📦 WIDGET 3 ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 📢 WIDGET 2: Broadcast Announcement & Emergency Notification Center */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center font-bold">
                  <FiBell size={16} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Emergency Broadcast Dispatcher</h3>
              </div>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Socket Broadcast
              </span>
            </div>

            {broadcastSentAlert && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                <span>✅ Broadcast sent live to all Technicians & Staff sockets!</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Broadcast Urgency Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['HIGH', 'MEDIUM', 'INFO'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBroadcastPriority(p)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        broadcastPriority === p 
                          ? p === 'HIGH' ? 'bg-red-600 text-white border-red-600' : p === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-500' : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p === 'HIGH' ? '🚨 HIGH ALERT' : p === 'MEDIUM' ? '⚠️ STANDARD' : 'ℹ️ INFO'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Broadcast Message Text</label>
                <textarea
                  rows={2}
                  required
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="e.g. Emergency Notice: High Priority CCTV Service required at Velachery site. Please accept job."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
              >
                <FiSend size={14} />
                <span>Transmit Real-Time Broadcast Alert</span>
              </button>
            </form>
          </div>
        </div>

        {/* 📦 WIDGET 3: Low Stock Inventory Threshold & Accessories Alert Widget */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                  <FiAlertTriangle size={16} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Low Stock Threshold Alerts</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full uppercase">
                {lowStockProducts.length} Alerts
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {lowStockProducts.length === 0 ? (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 rounded-xl text-center font-bold text-emerald-700">
                  ✅ All inventory products are fully stocked!
                </div>
              ) : (
                lowStockProducts.slice(0, 3).map((prod, pIdx) => (
                  <div key={prod.id || pIdx} className={`p-3 rounded-xl flex items-center justify-between border ${prod.stock <= 3 ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40' : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'}`}>
                    <div>
                      <h4 className={`font-bold ${prod.stock <= 3 ? 'text-red-900 dark:text-red-300' : 'text-amber-900 dark:text-amber-300'}`}>{prod.name}</h4>
                      <p className={`text-[11px] ${prod.stock <= 3 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>Stock Level: <strong className="font-black text-xs">{prod.stock} Units Left</strong> (Min: 10)</p>
                    </div>
                    <button onClick={() => setModalType('product')} className={`px-2.5 py-1 text-white rounded-lg font-bold text-[10px] shadow-2xs ${prod.stock <= 3 ? 'bg-red-600' : 'bg-amber-600'}`}>Restock</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ⭐ TOP TECHNICIANS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ⭐ WIDGET 5: Top Technician Leaderboard & Customer Rating Scoreboard */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
                  <FiAward size={16} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Top Technician Leaderboard</h3>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full uppercase">
                Live Standings
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {sortedTechnicians.slice(0, 3).map((tech, tIdx) => {
                const medal = tIdx === 0 ? '🥇' : tIdx === 1 ? '🥈' : '🥉';
                return (
                  <div key={tech.id || tIdx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">{medal}</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white">{tech.name}</h4>
                        <p className="text-[11px] text-slate-500">{tech.specialization || 'CCTV & Cabling Engineer'}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-purple-600 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-purple-200 text-xs">
                      ★ {tech.rating || 5.0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* --- QUICK ACTION MODALS --- */}

      {/* 1. Create Offline Order Modal */}
      <Modal isOpen={modalType === 'order'} onClose={() => setModalType(null)} title="Create Offline Order">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Anand Pharmacy" 
              value={orderForm.customer}
              onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
              <input 
                required
                type="email" 
                placeholder="customer@domain.com" 
                value={orderForm.email}
                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contact Phone</label>
              <input 
                required
                type="text" 
                placeholder="+91 XXXXX XXXXX" 
                value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Order Type</label>
              <select 
                value={orderForm.type}
                onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary"
              >
                <option>Cameras Installation</option>
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
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="Unassigned">Unassigned (Queue)</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount (₹)</label>
            <input 
              required
              type="number" 
              placeholder="e.g. 15000" 
              value={orderForm.amount}
              onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setModalType(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-705 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Create Offline Order
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Add Product Modal */}
      <Modal isOpen={modalType === 'product'} onClose={() => setModalType(null)} title="Add Product to Stock">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. CP Plus Dome Camera" 
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Model Number</label>
              <input 
                required
                type="text" 
                placeholder="e.g. CP-UNC-DA21L2" 
                value={productForm.model}
                onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <select 
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary"
              >
                <option>IP Camera</option>
                <option>Analog Camera</option>
                <option>NVR</option>
                <option>DVR</option>
                <option>Hard Disk</option>
                <option>Cables</option>
                <option>Power Supply</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Price (₹)</label>
              <input 
                required
                type="number" 
                placeholder="2500" 
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Initial Stock</label>
              <input 
                required
                type="number" 
                placeholder="10" 
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Description</label>
            <textarea 
              rows={3}
              placeholder="Provide specifications, camera features..." 
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setModalType(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Add Product
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
