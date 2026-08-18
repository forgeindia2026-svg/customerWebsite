import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import { 
  FiDownload, FiBarChart2, FiTrendingUp, FiCheckCircle, 
  FiUsers, FiStar, FiClock, FiSettings, FiGrid, FiActivity 
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';

export default function Reports() {
  const orders = useSelector(state => state.dashboard.orders);
  const payments = useSelector(state => state.dashboard.payments);
  const technicians = useSelector(state => state.dashboard.technicians);
  const projects = useSelector(state => state.dashboard.projects);

  const [activeTab, setActiveTab] = useState('Field Reports'); // 'Field Reports', 'Overview', 'Technicians', 'Financials'
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [adminQuickDetailReport, setAdminQuickDetailReport] = useState(null);
  const [adminFullReportModal, setAdminFullReportModal] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [generalReports, setGeneralReports] = useState([]);

  useEffect(() => {
    const fetchGeneralReports = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`);
        if (res.ok) {
          const data = await res.json();
          setGeneralReports(data);
        }
      } catch (err) {
        console.error('Failed to fetch general reports', err);
      }
    };
    fetchGeneralReports();
  }, []);

  // Extract technician reports live from orders store
  const fieldReportsList = orders.map((order) => {
    const beforeCount = order.beforePhotos?.length || 0;
    const afterCount = order.afterPhotos?.length || 0;
    
    // Map status
    let mappedStatus = 'Submitted';
    const rawStatus = order.status?.toUpperCase() || '';
    if (rawStatus === 'IN PROGRESS' || rawStatus === 'IN_PROGRESS' || rawStatus === 'PENDING') mappedStatus = 'Under Review';
    if (rawStatus === 'COMPLETED' || rawStatus === 'APPROVED' || localStorage.getItem(`report_approved_${order.jobCode || order.id}`) === 'true') mappedStatus = 'Verified';
    if (rawStatus === 'REJECTED') mappedStatus = 'Rejected';

    return {
      id: order._id || order.id,
      jobCode: order.jobCode || order.id || 'SK-ORD-1001',
      title: order.title || order.serviceType || 'CCTV Installation & Service',
      customer: order.customerName || order.customer || 'Unknown Customer',
      address: order.location || order.address || 'Unknown Location',
      technician: order.assignedTechnicianName || order.technician || 'Unassigned Technician',
      status: mappedStatus,
      notes: order.fieldNotes || order.workDone || 'Technician site service report submitted.',
      beforePhotos: order.beforePhotos || [],
      afterPhotos: order.afterPhotos || [],
      updatedAt: order.updatedAt || new Date().toISOString(),
    };
  });

  const generalReportsFormatted = generalReports.map((gr) => ({
    id: gr._id,
    jobCode: gr.jobId || 'GENERAL-TASK',
    title: gr.activityType,
    customer: 'N/A (General)',
    address: 'Internal / Office / Other',
    technician: gr.technicianName,
    status: 'Verified',
    notes: gr.workDescription,
    beforePhotos: [],
    afterPhotos: [],
    updatedAt: gr.createdAt,
    hoursWorked: gr.hoursWorked
  }));

  const allReportsList = [...fieldReportsList, ...generalReportsFormatted].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Calculations
  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingCollection = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const completedProjectsCount = projects.filter(p => p.status === 'Completed' || p.status === 'Approved').length;

  // Aggregate technician performance dynamically
  const technicianPerformance = technicians.map((tech, idx) => {
    // Count orders assigned to this technician name
    const techOrders = orders.filter(o => o.technician?.toLowerCase() === tech.name?.toLowerCase());
    const completedOrders = techOrders.filter(o => o.status === 'Approved' || o.status === 'Completed').length;
    const totalBillingHandled = techOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Mock completion rate and response speed based on rating
    const onTimeRate = Math.min(100, Math.round(80 + tech.rating * 4));
    const successRate = Math.min(100, Math.round(85 + tech.rating * 3));

    return {
      ...tech,
      totalJobs: techOrders.length,
      completedJobs: completedOrders || Math.round(techOrders.length * 0.8), // fallback
      onTimeRate: `${onTimeRate}%`,
      successRate: `${successRate}%`,
      billingHandled: totalBillingHandled || (idx + 1) * 32000,
    };
  });

  // Financial Chart Data (Collections by Date / Invoice)
  const collectionsData = payments.map(p => ({
    name: p.customer.slice(0, 10),
    Amount: p.amount,
    Status: p.status
  }));

  // Pie chart data for Project types
  const projectTypes = projects.reduce((acc, proj) => {
    const type = proj.type || 'General CCTV';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const pieData = Object.keys(projectTypes).map(key => ({
    name: key,
    value: projectTypes[key]
  }));

  const handleDownloadReportPDF = (report) => {
    try {
      const doc = new jsPDF();
      const isApproved = localStorage.getItem(`report_approved_${report?.jobCode}`) === 'true' || report?.status === 'Approved' || report?.status === 'COMPLETED';

      // Header Banner - Navy Blue
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('SK TECHNOLOGY', 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('CCTV Solutions & Security Systems', 14, 23);
      doc.text('Official Field Service & Installation Audit Report', 14, 29);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`JOB CODE: ${report?.jobCode || 'SK-ORD-42431'}`, 135, 16);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 135, 23);
      doc.text(`Status: ${isApproved ? 'VERIFIED & APPROVED' : 'SUBMITTED'}`, 135, 29);

      // Section 1: Specifications Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 46, 182, 45, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 46, 182, 45, 'S');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICE & CUSTOMER DETAILS', 20, 55);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Technician:', 20, 64);
      doc.setFont('helvetica', 'normal');
      doc.text(report?.technician || 'Technician Engineer', 60, 64);

      doc.setFont('helvetica', 'bold');
      doc.text('Customer Name:', 20, 71);
      doc.setFont('helvetica', 'normal');
      doc.text(report?.customer || 'Customer Client', 60, 71);

      doc.setFont('helvetica', 'bold');
      doc.text('Service Category:', 20, 78);
      doc.setFont('helvetica', 'normal');
      doc.text(report?.title || 'CCTV Installation & Service', 60, 78);

      doc.setFont('helvetica', 'bold');
      doc.text('Site Location:', 20, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(report?.address || 'Chennai Area, Tamil Nadu', 60, 85);

      // Section 2: Field Narrative
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TECHNICIAN FIELD NARRATIVE & COMMENTS', 14, 103);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 107, 182, 35, 'S');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitNotes = doc.splitTextToSize(report?.notes || 'Technician site service report submitted successfully following standard installation & testing protocols.', 174);
      doc.text(splitNotes, 18, 116);

      // Section 3: Audit Checklist
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('QUALITY & SAFETY AUDIT CHECKLIST', 14, 154);

      const checklist = [
        '[X] Camera Mounting, Viewing Angle & Lens Focus Verified',
        '[X] Cable Routing, Conduit Sealing & Connector Insulation Passed',
        '[X] Power Supply, SMPS Adaptors & Battery Backup Tested',
        '[X] NVR / DVR Network IP Config & Remote Live Feed Configured',
        '[X] Client Orientation & Mobile App Live View Demo Completed'
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let yPos = 162;
      checklist.forEach(item => {
        doc.text(item, 18, yPos);
        yPos += 7;
      });

      // Signatures Box
      doc.setLineWidth(0.5);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 230, 196, 230);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Technician Signature', 20, 245);
      doc.text('Admin Authorization Stamp', 135, 245);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(report?.technician || 'Field Service Engineer', 20, 251);
      doc.text('SK Technology Management', 135, 251);
      doc.text(isApproved ? 'VERIFIED & APPROVED' : 'SUBMITTED - PENDING AUDIT', 135, 256);

      // Footer line
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated electronically by SK Technology Portal on ${new Date().toLocaleString('en-IN')}`, 14, 285);

      // Trigger automatic PDF file download!
      doc.save(`Report_${report?.jobCode || 'SK-ORD-42431'}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
      alert(`Generating PDF Report for ${report?.jobCode}...`);
    }
  };

  const handleDownloadAllPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SK TECHNOLOGY', 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('CCTV Solutions & Security Systems', 14, 23);
      doc.text('ALL FIELD SERVICE REPORTS SUMMARY LOG', 14, 29);

      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 20);
      doc.text(`Total Records: ${allReportsList.length}`, 140, 26);

      let y = 48;
      allReportsList.forEach((rep, idx) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        const isApproved = localStorage.getItem(`report_approved_${rep.jobCode}`) === 'true' || rep.status === 'Approved' || rep.status === 'COMPLETED';

        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 26, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, 26, 'S');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. Job Code: ${rep.jobCode}`, 18, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Technician: ${rep.technician}`, 80, y + 7);
        doc.text(`Status: ${isApproved ? 'VERIFIED' : 'COMPLETED'}`, 145, y + 7);

        doc.text(`Customer: ${rep.customer}`, 18, y + 14);
        doc.text(`Location: ${rep.address || 'Chennai Area'}`, 80, y + 14);

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Notes: ${rep.notes ? rep.notes.slice(0, 70) + '...' : 'Site service completed.'}`, 18, y + 21);

        y += 30;
      });

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`SK Technology Executive Management Report Log`, 14, 285);

      doc.save(`SK_Technology_All_Field_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('All PDF Error:', err);
      alert('Generating All PDF Reports...');
    }
  };

  const getTechAvatar = (tech) => {
    if (tech.avatarUrl) return tech.avatarUrl;
    const initialAvatars = {
      'TECH-01': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
      'TECH-02': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
      'TECH-03': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
      'TECH-04': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop'
    };
    return initialAvatars[tech.id] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop';
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Block */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="text-left">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Management Reports & Performance Analytics</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review live financial metrics, installation efficiency logs, and technician performance tracking.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/50 self-start md:self-auto overflow-x-auto max-w-full">
          {['Field Reports', 'Overview', 'Technicians', 'Financials'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all shrink-0 ${
                activeTab === tab 
                  ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'Field Reports' ? '📸 Technician Field Reports' : tab === 'Overview' ? 'Executive Overview' : tab === 'Technicians' ? 'Technician Performance' : 'Financial Ledger'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents: Technician Field Reports */}
      {activeTab === 'Field Reports' && (
        <div className="space-y-6">
          {/* KPI Stat Cards Grid (2x2 Grid on Mobile) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block truncate">TOTAL REPORTS</span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white block mt-0.5 font-mono">{allReportsList.length} Logs</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                <FiBarChart2 size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block truncate">VERIFIED REPORTS</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                  {allReportsList.filter(r => r.status === 'Verified').length}
                </span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                <FiCheckCircle size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block truncate">EVIDENCE PHOTOS</span>
                <span className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400 block mt-0.5 font-mono">
                  {allReportsList.reduce((sum, r) => sum + r.beforePhotos.length + r.afterPhotos.length, 0)} Files
                </span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                <FiGrid size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider block truncate">ACTIVE TECHNICIANS</span>
                <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 block mt-0.5 font-mono">{technicians.length} Techs</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                <FiUsers size={16} />
              </div>
            </div>
          </div>

          {/* Field Reports Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Daily Reports</h3>
              </div>
              <button
                onClick={handleDownloadAllPDF}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <FiDownload size={14} />
                <span>Export All Field Reports (PDF)</span>
              </button>
            </div>

            {/* 📱 Mobile Card View (Screenshot 1) - Matching Technician Mobile Flow */}
            <div className="block md:hidden space-y-3">
              {allReportsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  No field service reports found.
                </div>
              ) : (
                allReportsList.map((report) => {
                  const isApproved = localStorage.getItem(`report_approved_${report.jobCode}`) === 'true' || report.status === 'Approved';
                  const mainPhoto = report.afterPhotos?.[0] || report.beforePhotos?.[0] || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=200&auto=format&fit=crop';
                  const photoUrl = typeof mainPhoto === 'string' ? mainPhoto : mainPhoto.url;

                  return (
                    /* Compact Task Card Item (Screenshot 1) */
                    <div
                      key={`mob-rep-${report.id}`}
                      onClick={() => setAdminQuickDetailReport(report)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-red-500 rounded-2xl p-4 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className={`text-xs font-bold block ${isApproved ? 'text-emerald-600' : 'text-sky-600'}`}>
                            {isApproved ? 'Completed & Approved' : 'In Progress'}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-200">
                            Technician: <strong className="text-slate-900 dark:text-white font-extrabold">{report.technician}</strong>
                          </p>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Task ID: #{report.jobCode}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300">Customer: <strong className="text-slate-900 dark:text-white">{report.customer}</strong></p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">Location: {report.address || 'Chennai, Tamil Nadu'}</p>
                          <span className="text-[10px] text-slate-400 font-mono block pt-1">{report.updatedAt?.split('T')[0] || '2026-08-06'} 03:45 PM</span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <img src={photoUrl} alt="Task" className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                          <span className="text-slate-400 font-bold text-sm">›</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 💻 Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Job Code / Order</th>
                    <th className="py-3 px-3">Technician</th>
                    <th className="py-3 px-3">Customer & Location</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Evidence Photos</th>
                    <th className="py-3 px-3">Technician Narrative / Notes</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {allReportsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                        No field service reports found. Reports submitted by technicians will automatically appear here.
                      </td>
                    </tr>
                  ) : (
                    allReportsList.map((report) => {
                      const totalPhotos = report.beforePhotos.length + report.afterPhotos.length;
                      return (
                        <tr key={report.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-3 align-middle font-mono font-extrabold text-slate-900 dark:text-white">
                            <div>{report.jobCode}</div>
                            <div className="text-[10px] font-sans font-medium text-slate-400 truncate max-w-[150px]">{report.title}</div>
                          </td>

                          <td className="py-4 px-3 align-middle font-bold text-slate-800 dark:text-slate-200">
                            {report.technician}
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <div className="font-semibold text-slate-900 dark:text-white">{report.customer}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{report.address}</div>
                          </td>

                          <td className="py-4 px-3 align-middle text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                              report.status === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : report.status === 'Rejected'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : report.status === 'Under Review'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              {report.status}
                            </span>
                          </td>

                          <td className="py-4 px-3 align-middle text-center">
                            {totalPhotos > 0 ? (
                              <button
                                onClick={() => setSelectedPhotoModal(report)}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>📸 {totalPhotos} Photos</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">No Photos</span>
                            )}
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">{report.notes}</p>
                          </td>

                          <td className="py-4 px-3 align-middle text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setSelectedPhotoModal(report)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                View
                              </button>
                              {report.status === 'Verified' ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center gap-1 font-mono">
                                  <FiCheckCircle size={12} />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    localStorage.setItem(`report_approved_${report.jobCode}`, 'true');
                                    alert(`✓ Report ${report.jobCode} has been Verified & Approved by Admin!`);
                                    window.location.reload();
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <FiCheckCircle size={12} />
                                  <span>Verify</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDownloadReportPDF(report)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">📸 Site Evidence Gallery</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedPhotoModal.jobCode} • {selectedPhotoModal.technician}</p>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-xs"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedPhotoModal.beforePhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Before Installation Photos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPhotoModal.beforePhotos.map((p, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <img src={p.url || p} alt="Before installation" className="w-full h-40 object-cover" />
                        <p className="p-2 text-[11px] text-slate-600 font-medium">{p.caption || 'Initial site setup condition'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPhotoModal.afterPhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">After Installation Completion Photos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPhotoModal.afterPhotos.map((p, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <img src={p.url || p} alt="After installation" className="w-full h-40 object-cover" />
                        <p className="p-2 text-[11px] text-slate-600 font-medium">{p.caption || 'Completed equipment setup'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Overview */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          
          {/* Key Stat Cards Grid (2x2 Grid on Mobile) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
              <div className="text-left">
                <span className="text-slate-400 text-[9px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Total Collections</span>
                <span className="text-base sm:text-xl font-bold text-slate-800 dark:text-white block mt-0.5">₹{totalCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FiTrendingUp size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
              <div className="text-left">
                <span className="text-slate-400 text-[9px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Pending Receipts</span>
                <span className="text-base sm:text-xl font-bold text-slate-850 dark:text-white block mt-0.5">₹{pendingCollection.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-900/35 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FiClock size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
              <div className="text-left">
                <span className="text-slate-400 text-[9px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Service Audits</span>
                <span className="text-base sm:text-xl font-bold text-slate-800 dark:text-white block mt-0.5">{orders.length} Installations</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FiCheckCircle size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
              <div className="text-left">
                <span className="text-slate-400 text-[9px] sm:text-xs font-semibold uppercase tracking-wider block truncate">Active Engineers</span>
                <span className="text-base sm:text-xl font-bold text-slate-850 dark:text-white block mt-0.5">{technicians.length} Members</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-900/35 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FiUsers size={16} />
              </div>
            </div>
          </div>

          {/* Sub-report Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales ledger overview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors">
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <FiBarChart2 size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">Monthly Collections Ledger</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 leading-normal font-medium">
                  Summarizes invoice payments, sales volume, outstanding collections, and total cash flow registers.
                </p>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Collected Value:</span>
                  <strong className="text-slate-850 dark:text-white font-semibold">₹{totalCollected.toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <button 
                onClick={() => handleDownload('Collections Ledger')}
                className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <FiDownload /> Export Excel (XLSX)
              </button>
            </div>

            {/* Installation efficiency log */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors">
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <FiTrendingUp size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">Technician Installation Logs</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 leading-normal font-medium">
                  Reports individual technician task performance, completed projects, feedback ratings, and active AMC schedules.
                </p>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Logged Audits:</span>
                  <strong className="text-slate-850 dark:text-white font-semibold">{orders.length} Installations</strong>
                </div>
              </div>
              <button 
                onClick={() => handleDownload('Technician Logs')}
                className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <FiDownload /> Export PDF Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Technician Performance */}
      {activeTab === 'Technicians' && (
        <div className="space-y-6">
          
          {/* Performance Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm text-left">Technician Quality & Audit Scoreboard</h3>
              <button 
                onClick={() => handleDownload('Technician Scoreboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-205 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <FiDownload size={13} /> Export Scoreboard
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-xs">
                    <th className="py-3 px-3">Engineer Details</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Tasks Assigned</th>
                    <th className="py-3 px-3">Completed Jobs</th>
                    <th className="py-3 px-3">On-Time completion</th>
                    <th className="py-3 px-3">Success Rate</th>
                    <th className="py-3 px-3">Avg Rating</th>
                    <th className="py-3 px-3 text-right">Estimated Billing Handled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-slate-750 dark:text-slate-300 font-semibold">
                  {technicianPerformance.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                            <img src={getTechAvatar(tech)} alt={tech.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-850 dark:text-slate-100 text-sm block">{tech.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{tech.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 align-middle">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                          {tech.specialization}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 align-middle font-medium">{tech.totalJobs} tasks</td>
                      <td className="py-3.5 px-3 align-middle font-medium text-emerald-600 dark:text-emerald-400">{tech.completedJobs} resolved</td>
                      <td className="py-3.5 px-3 align-middle font-medium text-blue-600 dark:text-blue-400">{tech.onTimeRate}</td>
                      <td className="py-3.5 px-3 align-middle font-medium text-purple-600 dark:text-purple-400">{tech.successRate}</td>
                      <td className="py-3.5 px-3 align-middle">
                        <span className="flex items-center gap-1 font-bold">
                          <FiStar className="text-amber-400 fill-amber-400 w-3.5 h-3.5" /> {tech.rating}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 align-middle text-right font-semibold text-slate-900 dark:text-white">
                        ₹{tech.billingHandled.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Financial Ledger & Charts */}
      {activeTab === 'Financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart visual representation */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors">
            <div className="text-left mb-4">
              <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">Invoice Billing Volume</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribution of collected payments by customers</p>
            </div>
            
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800/80" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Billing']} />
                  <Bar dataKey="Amount" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project categorization breakdown */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-colors">
            <div className="text-left mb-4">
              <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">Services Breakdown</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Percentage distribution of installation types</p>
            </div>

            <div className="w-full h-44 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No project type details available.</div>
              )}
            </div>

            {/* Legend indicators */}
            <div className="space-y-2 mt-4 text-xs font-semibold text-left">
              {pieData.map((data, idx) => (
                <div key={data.name} className="flex items-center justify-between text-slate-655 dark:text-slate-350">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{data.name}</span>
                  </div>
                  <span>{data.value} projects</span>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* 📱 Admin Level 2: Quick Detail Modal Sheet (Screenshots 2 & 3) */}
      {adminQuickDetailReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white">
            
            {/* Header with Back Button */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
              <button
                onClick={() => setAdminQuickDetailReport(null)}
                className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 cursor-pointer"
              >
                <span className="text-sm font-bold">‹</span>
                <span>Back to Reports List</span>
              </button>

              <button
                onClick={() => setAdminQuickDetailReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Detail Content (Screenshots 2 & 3) */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Task ID Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-semibold">TASK ID</span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">#{adminQuickDetailReport.jobCode}</h3>
                </div>
                <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${
                  localStorage.getItem(`report_approved_${adminQuickDetailReport.jobCode}`) === 'true' || adminQuickDetailReport.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  {localStorage.getItem(`report_approved_${adminQuickDetailReport.jobCode}`) === 'true' || adminQuickDetailReport.status === 'Approved' ? 'Approved' : 'In Progress'}
                </span>
              </div>

              {/* Customer Information List */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start space-x-3">
                  <span className="text-slate-400 text-sm">👤</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Customer Name</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{adminQuickDetailReport.customer}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-slate-400 text-sm">📞</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Phone Number</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">+91 98765 43210</span>
                    </div>
                  </div>
                  <a href="tel:+919876543210" className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100">
                    📞
                  </a>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-slate-400 text-sm">📍</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Location</span>
                      <span className="font-bold text-slate-900 dark:text-white leading-snug text-xs">{adminQuickDetailReport.address || 'No. 45, 5th Street, Anna Nagar, Chennai - 600040'}</span>
                    </div>
                  </div>
                  <span className="text-red-600 text-sm p-1">📍</span>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-slate-400 text-sm">👤</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Technician</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{adminQuickDetailReport.technician}</span>
                    </div>
                  </div>
                  <span className="text-red-600 text-xs font-bold">👤</span>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-slate-400 text-sm">📅</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Date & Time</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{adminQuickDetailReport.updatedAt?.split('T')[0] || '2026-08-06'} 03:45 PM</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="text-slate-400 text-sm">📋</span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Task Description</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{adminQuickDetailReport.title}</span>
                  </div>
                </div>
              </div>

              {/* Report Summary Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Report Summary</h4>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl divide-y divide-slate-200/80 dark:divide-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  
                  {/* Before Photos Row */}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Before Work Photos</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {adminQuickDetailReport.beforePhotos?.slice(0, 2).map((p, pI) => (
                          <img key={pI} src={typeof p === 'string' ? p : p.url} alt="B" className="w-6 h-6 object-cover rounded border" />
                        ))}
                      </div>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {adminQuickDetailReport.beforePhotos?.length || 1}
                      </span>
                      <span className="text-slate-400 font-bold">›</span>
                    </div>
                  </div>

                  {/* After Photos Row */}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">After Work Photos</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {adminQuickDetailReport.afterPhotos?.slice(0, 2).map((p, pI) => (
                          <img key={pI} src={typeof p === 'string' ? p : p.url} alt="A" className="w-6 h-6 object-cover rounded border" />
                        ))}
                      </div>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {adminQuickDetailReport.afterPhotos?.length || 1}
                      </span>
                      <span className="text-slate-400 font-bold">›</span>
                    </div>
                  </div>

                  {/* Inspection Comments */}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Inspection Comments</span>
                    <span className="text-slate-900 dark:text-white font-medium text-right max-w-[150px] truncate">
                      {adminQuickDetailReport.notes}
                    </span>
                  </div>

                  {/* Voice Report */}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Voice Report</span>
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-full font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                    >
                      <span>▶</span>
                      <span>00:45</span>
                    </button>
                  </div>

                  {/* Completion Status */}
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Completion Status</span>
                    <span className="font-bold text-emerald-600">Completed</span>
                  </div>
                </div>
              </div>

              {/* View Full Report Red Button (Screenshots 2 & 3) */}
              <button
                onClick={() => {
                  const r = adminQuickDetailReport;
                  setAdminQuickDetailReport(null);
                  setAdminFullReportModal(r);
                }}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-colors"
              >
                <span>👁️</span>
                <span>View Full Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Admin Level 3: Full Report Sheet Modal (Screenshot 4) */}
      {adminFullReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white">
            
            {/* Red Top Bar Header (Screenshot 4) */}
            <div className="bg-red-600 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-xs">
              <button
                onClick={() => setAdminFullReportModal(null)}
                className="flex items-center space-x-1.5 font-bold text-xs hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span>‹</span>
                <span>Report #{adminFullReportModal.jobCode}</span>
              </button>

              <button
                onClick={() => handleDownloadReportPDF(adminFullReportModal)}
                className="p-1.5 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                title="Download PDF"
              >
                📥
              </button>
            </div>

            {/* Full Report Details Body (Screenshot 4) */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Task Description */}
              <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Task Description</span>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {adminFullReportModal.title || 'Remove old camera and add new Playback system'}
                </p>
              </div>

              {/* Before Work Photos */}
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Before Work Photos</span>
                <div className="flex items-center space-x-3 overflow-x-auto">
                  {adminFullReportModal.beforePhotos?.length > 0 ? (
                    adminFullReportModal.beforePhotos.map((p, i) => (
                      <img key={i} src={typeof p === 'string' ? p : p.url} alt="Before" className="w-32 h-28 object-cover rounded-xl border border-slate-200" />
                    ))
                  ) : (
                    <img src="https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop" alt="Before" className="w-32 h-28 object-cover rounded-xl border border-slate-200" />
                  )}
                </div>
              </div>

              {/* Inspection Comments */}
              <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Inspection Comments</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {adminFullReportModal.notes || 'finished [Voice Memo Attached: 8s Audio Summary]'}
                </div>
              </div>

              {/* After Work Photos */}
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">After Work Photos</span>
                <div className="flex items-center space-x-3 overflow-x-auto">
                  {adminFullReportModal.afterPhotos?.length > 0 ? (
                    adminFullReportModal.afterPhotos.map((p, i) => (
                      <img key={i} src={typeof p === 'string' ? p : p.url} alt="After" className="w-32 h-28 object-cover rounded-xl border border-slate-200" />
                    ))
                  ) : (
                    <img src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=400&auto=format&fit=crop" alt="After" className="w-32 h-28 object-cover rounded-xl border border-slate-200" />
                  )}
                </div>
              </div>

              {/* Voice Report Player */}
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Voice Report</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                        isPlayingAudio ? 'bg-red-500 animate-pulse' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isPlayingAudio ? '⏹' : '▶'}
                    </button>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Audio Recording</span>
                  </div>
                  <span className="font-mono text-slate-500 font-bold text-xs">00:45</span>
                </div>
              </div>

              {/* Completion Status & Submitter Details */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Completion Status</span>
                  <span className="font-bold text-emerald-600">Completed</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Submitted By</span>
                  <span className="font-bold text-slate-900 dark:text-white">{adminFullReportModal.technician}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Submitted On</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{adminFullReportModal.updatedAt?.split('T')[0] || '2026-08-06'} 03:45 PM</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons (Screenshot 4: Red Approve Report Button!) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 gap-3 shrink-0">
              {localStorage.getItem(`report_approved_${adminFullReportModal.jobCode}`) === 'true' || adminFullReportModal.status === 'Approved' ? (
                <div className="py-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1">
                  <FiCheckCircle size={14} />
                  <span>✓ Approved</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem(`report_approved_${adminFullReportModal.jobCode}`, 'true');
                    alert(`✓ Report #${adminFullReportModal.jobCode} Approved by Admin!`);
                    setAdminFullReportModal(null);
                    window.location.reload();
                  }}
                  className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <FiCheckCircle size={14} />
                  <span>Approve Report</span>
                </button>
              )}

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `*SK Technology CCTV Service Report*\n\nJob: ${adminFullReportModal.jobCode}\nCustomer: ${adminFullReportModal.customer}\nTechnician: ${adminFullReportModal.technician}\nStatus: Approved`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 border border-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <span>🟢</span>
                <span>Add Note</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
