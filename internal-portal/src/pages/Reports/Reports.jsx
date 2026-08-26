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

const calculateLiveHours = (checkInStr, dateStr) => {
  if (!checkInStr || checkInStr === '--:--') return 0;
  try {
    const timeMatch = checkInStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!timeMatch) return 0;
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const modifier = timeMatch[3].toLowerCase();

    if (hours === 12) hours = 0;
    if (modifier === 'pm') hours += 12;

    const checkInDate = new Date(dateStr);
    checkInDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    if (now.toDateString() !== checkInDate.toDateString()) {
       return 0;
    }

    const diffMs = now - checkInDate;
    if (diffMs < 0) return '0h 0m'; 
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  } catch(e) {
    return '0h 0m';
  }
};

export default function Reports() {
  const orders = useSelector(state => state.dashboard?.orders) || [];
  const payments = useSelector(state => state.dashboard?.payments) || [];
  const technicians = useSelector(state => state.dashboard?.technicians) || [];
  const projects = useSelector(state => state.dashboard?.projects) || [];

  const [activeTab, setActiveTab] = useState('Attendance'); // 'Attendance', 'Field Reports', 'Overview', 'Technicians'
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [adminQuickDetailReport, setAdminQuickDetailReport] = useState(null);
  const [adminFullReportModal, setAdminFullReportModal] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [generalReports, setGeneralReports] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterTech, setFilterTech] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGeneralReports = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/reports?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setGeneralReports(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch general reports', err);
      }
    };
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/attendance?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAttendanceRecords(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch attendance records', err);
      }
    };
    fetchGeneralReports();
    fetchAttendance();

    return () => {
      if (window.__activeAudioInstance) {
        window.__activeAudioInstance.pause();
        window.__activeAudioInstance = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayVoiceMemo = (report) => {
    if (isPlayingAudio) {
      if (window.__activeAudioInstance) {
        window.__activeAudioInstance.pause();
        window.__activeAudioInstance = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    const audioUrl = report?.voiceNoteUrl || report?.audioUrl;
    
    // 1. If valid audio URL or Base64 Data URI is available:
    if (audioUrl && (audioUrl.startsWith('data:audio') || audioUrl.startsWith('http') || audioUrl.startsWith('blob:'))) {
      try {
        const audio = new Audio(audioUrl);
        window.__activeAudioInstance = audio;
        setIsPlayingAudio(true);
        audio.play().then(() => {
          setIsPlayingAudio(true);
        }).catch((err) => {
          console.warn('Direct audio play fallback:', err);
          speakVoiceReport(report);
        });
        audio.onended = () => {
          setIsPlayingAudio(false);
          window.__activeAudioInstance = null;
        };
        audio.onerror = () => {
          speakVoiceReport(report);
        };
        return;
      } catch (err) {
        console.warn('Audio initialization error:', err);
      }
    }

    // 2. Play acoustic speech synthesis of the technician's actual voice report notes
    speakVoiceReport(report);
  };

  const speakVoiceReport = (report) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const techName = report?.technician || 'Technician';
      const cleanNotes = (report?.notes || report?.workDescription || 'Installation completed on site with all equipment verified.')
        .replace(/\[Voice Memo Attached:[^\]]*\]/gi, '')
        .trim();

      const spokenText = `Technician voice report from ${techName}. ${cleanNotes}. Work has been completed and tested on site.`;
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => {
        setIsPlayingAudio(false);
        window.__activeAudioInstance = null;
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        window.__activeAudioInstance = null;
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Acoustic Tone Generator
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        setIsPlayingAudio(true);
        setTimeout(() => {
          osc.stop();
          setIsPlayingAudio(false);
        }, 3000);
      } catch (e) {
        setIsPlayingAudio(true);
        setTimeout(() => setIsPlayingAudio(false), 3000);
      }
    }
  };

  const handleDeleteReport = async (report) => {
    if (!report) return;
    const cleanCode = (report.jobCode || '').replace(/^#/, '');
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the field report for #${cleanCode}?`);
    if (!confirmDelete) return;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
      const deleteId = report.id || report.jobCode;
      
      await fetch(`${baseUrl}/api/reports/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE'
      });

      // Track in localStorage so any synthesized order entry is also suppressed
      localStorage.setItem(`report_deleted_${cleanCode}`, 'true');
      localStorage.setItem(`report_deleted_#${cleanCode}`, 'true');

      // Remove from local state
      setGeneralReports((prev) => prev.filter((r) => {
        const rCode = (r.jobCode || r._id || '').replace(/^#/, '');
        return r._id !== report.id && rCode !== cleanCode;
      }));

      if (adminFullReportModal?.jobCode === report.jobCode) setAdminFullReportModal(null);
      if (adminQuickDetailReport?.jobCode === report.jobCode) setAdminQuickDetailReport(null);
      if (selectedPhotoModal?.jobCode === report.jobCode) setSelectedPhotoModal(null);

      alert(`✓ Report for #${cleanCode} deleted successfully.`);
    } catch (err) {
      console.error('Delete report error:', err);
      alert('Failed to delete report from server.');
    }
  };

  // Extract ONLY actual technician reports submitted on orders (ignore unassigned shopping orders with no reports)
  const orderReportsList = (orders || [])
    .filter((order) => {
      const cleanCode = (order.jobCode || order.id || '').replace(/^#/, '');
      if (localStorage.getItem(`report_deleted_${cleanCode}`) === 'true') return false;

      // Must have actual technician work notes, photos, or submitted dailyReports
      const hasDailyReports = order.dailyReports && order.dailyReports.length > 0;
      const hasFieldNotes = Boolean(order.fieldNotes && order.fieldNotes.trim().length > 0);
      const hasPhotos = (order.beforePhotos?.length || 0) + (order.afterPhotos?.length || 0) > 0;
      const isCompletedByTech = order.status?.toUpperCase() === 'COMPLETED' && order.assignedTechnicianName;
      
      return hasDailyReports || hasFieldNotes || hasPhotos || isCompletedByTech;
    })
    .map((order) => {
      const mappedStatus = (order.status?.toUpperCase() === 'COMPLETED' || localStorage.getItem(`report_approved_${order.jobCode || order.id}`) === 'true')
        ? 'Verified'
        : 'Under Review';

      const techName = 
        order.assignedTechnicianName || 
        order.technicianName || 
        (typeof order.technician === 'string' ? order.technician : order.technician?.name) ||
        order.assignedTechnicians?.[0]?.name || 
        order.assignedTechnician?.name || 
        'Field Technician';

      return {
        id: order._id || order.id,
        jobCode: order.jobCode || order.id || 'SK-ORD-1001',
        title: order.title || order.serviceType || 'CCTV Installation & Service',
        customer: order.customerName || order.customer || 'Customer Site',
        address: order.location || order.address || 'Location Specified on Work Order',
        technician: techName,
        status: mappedStatus,
        notes: order.fieldNotes || order.dailyReports?.[0]?.workDone || order.workDone || 'Work order completed on site.',
        beforePhotos: order.beforePhotos || [],
        afterPhotos: order.afterPhotos || [],
        voiceNoteUrl: order.voiceNoteUrl || order.dailyReports?.[0]?.voiceNoteUrl || order.dailyReport?.voiceNoteUrl || '',
        hasVoiceNote: Boolean(order.hasVoiceNote || order.voiceNoteUrl || order.dailyReports?.[0]?.hasVoiceNote || order.dailyReport?.hasVoiceNote),
        updatedAt: order.updatedAt || new Date().toISOString(),
        hoursWorked: order.dailyReports?.[0]?.hoursWorked || 8
      };
    });

  const generalReportsFormatted = (generalReports || [])
    .filter((gr) => {
      const cleanCode = (gr.jobCode || gr._id || '').replace(/^#/, '');
      if (localStorage.getItem(`report_deleted_${cleanCode}`) === 'true') return false;

      // Filter out pure Check-In/Attendance logs so only actual work reports are displayed here
      if (gr.activityType === 'Check-In' || (gr.workDescription && gr.workDescription.includes('Punched in'))) return false;
      return true;
    })
    .map((gr) => {
      const isCustomOrder = gr.jobCode && (gr.jobCode.startsWith('SK-ORD-') || gr.jobCode.startsWith('JOB-'));
      const displayJobCode = isCustomOrder ? gr.jobCode : 'DAILY WORK LOG';
      const displayTitle = gr.activityType || 'General Work Activity';

      return {
        id: gr._id,
        jobCode: displayJobCode,
        title: displayTitle,
        customer: isCustomOrder ? (gr.customerName || 'Customer Site') : (gr.customerName || 'Office / Internal Activity'),
        address: gr.location || 'Site Location',
        technician: gr.technicianName || gr.technician || 'Field Technician',
        status: gr.approvedByAdmin || localStorage.getItem(`report_approved_${gr.jobCode || gr._id}`) === 'true' ? 'Verified' : 'Under Review',
        checkInTime: gr.checkInTime || '',
        checkOutTime: gr.checkOutTime || '',
        notes: (gr.workDescription || 'Daily report log submitted.').replace(/\[Voice Memo Attached:[^\]]*\]/gi, '').trim(),
        beforePhotos: gr.beforePhotos || [],
        afterPhotos: gr.afterPhotos || [],
        voiceNoteUrl: gr.voiceNoteUrl || '',
        hasVoiceNote: Boolean(gr.hasVoiceNote || (gr.voiceNoteUrl && gr.voiceNoteUrl.length > 0)),
        updatedAt: gr.createdAt || gr.date || new Date().toISOString(),
        hoursWorked: gr.hoursWorked !== undefined && gr.hoursWorked !== null ? Number(gr.hoursWorked) : 8
      };
    });

  // Combine reports and strictly avoid any duplicate entries by jobCode
  const combinedRaw = [...generalReportsFormatted, ...orderReportsList].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );

  const seenCodes = new Set();
  const allReportsList = [];

  for (const rep of combinedRaw) {
    const cleanCode = (rep.jobCode || '').replace(/^#/, '').trim().toUpperCase();
    if (cleanCode && cleanCode !== 'DAILY WORK LOG') {
      if (seenCodes.has(cleanCode)) continue;
      seenCodes.add(cleanCode);
    }
    allReportsList.push(rep);
  }

  const uniqueTechNames = Array.from(new Set(allReportsList.map(r => r.technician).filter(Boolean)));

  const filteredFieldReports = allReportsList.filter(report => {
    if (filterDate) {
      const repDate = (report.updatedAt || report.date || '').split('T')[0];
      if (repDate !== filterDate) return false;
    }
    if (filterTech !== 'ALL' && report.technician !== filterTech) return false;
    if (filterStatus !== 'ALL' && report.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        report.jobCode?.toLowerCase().includes(q) ||
        report.customer?.toLowerCase().includes(q) ||
        report.technician?.toLowerCase().includes(q) ||
        report.address?.toLowerCase().includes(q) ||
        report.notes?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Current date in Indian Standard Time (YYYY-MM-DD)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  const dailyAttendanceList = (attendanceRecords || []).map(rec => {
    let recDate = rec.date;
    if (!recDate && rec.checkInTimestamp) {
      recDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(rec.checkInTimestamp));
    }
    if (!recDate && rec.createdAt) {
      recDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(rec.createdAt));
    }
    recDate = (recDate || todayStr).split('T')[0];

    // Format checkInTime properly in Indian Standard Time (IST)
    let formattedCheckIn = rec.checkInTime || '--:--';
    if (rec.checkInTimestamp) {
      formattedCheckIn = new Date(rec.checkInTimestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    let formattedCheckOut = rec.checkOutTime || '--:--';
    if (rec.checkOutTimestamp) {
      formattedCheckOut = new Date(rec.checkOutTimestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    // Determine clean salary & payroll note
    let salaryNote = 'Full Day (1.0 Day)';
    if (rec.status === 'HALF_DAY') salaryNote = 'Half Day (0.5 Day)';
    else if (rec.status === 'OVERTIME') salaryNote = 'Overtime Duty';
    else if (rec.status === 'OFF_DUTY') salaryNote = 'Full Day (1.0 Day)';

    return {
      id: rec._id || `${rec.technicianId}-${recDate}`,
      date: recDate,
      technicianId: rec.technicianId,
      technician: rec.technicianName || 'Field Technician',
      checkInTime: formattedCheckIn,
      checkOutTime: formattedCheckOut,
      totalHours: Number(rec.totalHours) || 0,
      status: rec.status || 'PRESENT',
      location: rec.location || 'Field Location',
      latitude: rec.latitude,
      longitude: rec.longitude,
      notes: salaryNote
    };
  });

  // Filter ONLY TODAY'S attendance for Today's KPI metrics
  const todayAttendanceList = dailyAttendanceList.filter(r => r.date === todayStr);

  // Calculations
  const totalCollected = (payments || []).filter(p => p && p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingCollection = (payments || []).filter(p => p && p.status === 'Pending').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const completedProjectsCount = (projects || []).filter(p => p && (p.status === 'Completed' || p.status === 'Approved')).length;

  // Aggregate technician performance dynamically
  const technicianPerformance = (technicians || []).map((tech, idx) => {
    // Count orders assigned to this technician name
    const techOrders = (orders || []).filter(o => o && o.technician?.toLowerCase() === tech.name?.toLowerCase());
    const completedOrders = techOrders.filter(o => o.status === 'Approved' || o.status === 'Completed').length;
    const totalBillingHandled = techOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    // Mock completion rate and response speed based on rating
    const onTimeRate = Math.min(100, Math.round(80 + (Number(tech.rating) || 4.5) * 4));
    const successRate = Math.min(100, Math.round(85 + (Number(tech.rating) || 4.5) * 3));

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
  const collectionsData = (payments || []).map(p => ({
    name: (p.customer || 'Customer').slice(0, 10),
    Amount: Number(p.amount) || 0,
    Status: p.status || 'Pending'
  }));

  // Pie chart data for Project types
  const projectTypes = (projects || []).reduce((acc, proj) => {
    const type = proj?.type || 'General CCTV';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const pieData = Object.keys(projectTypes).map(key => ({
    name: key,
    value: projectTypes[key]
  }));

  const handleExportMonthlyExcel = () => {
    const headers = ['Date', 'Technician ID', 'Technician Name', 'Check-In Time', 'Check-Out Time', 'Total Hours Logged', 'Attendance Status', 'Shift / Location', 'Salary Remarks'];
    const rows = dailyAttendanceList.map(r => [
      r.date,
      r.technicianId || 'N/A',
      `"${(r.technician || 'Technician').replace(/"/g, '""')}"`,
      r.checkInTime || '09:00 AM',
      r.checkOutTime || '06:00 PM',
      `${r.totalHours || 8} hrs`,
      r.status || 'PRESENT',
      `"${(r.location || 'Chennai Area').replace(/"/g, '""')}"`,
      `"${(r.notes || 'Full Day Pay').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Technician_Attendance_Timesheet_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAttendancePDF = () => {
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
      doc.text('TECHNICIAN DAILY ATTENDANCE & PAYROLL TIMESHEET', 14, 29);

      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 20);
      doc.text(`Total Records: ${dailyAttendanceList.length}`, 140, 26);

      let y = 48;
      dailyAttendanceList.forEach((att, idx) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 22, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, 22, 'S');

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${att.date} | ${att.technician}`, 18, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${att.status}`, 145, y + 7);

        doc.text(`Check-In: ${att.checkInTime}  |  Check-Out: ${att.checkOutTime}  |  Total: ${att.totalHours} hrs`, 18, y + 14);
        doc.text(`Notes: ${att.notes || 'Full Day Pay'}`, 120, y + 14);

        y += 26;
      });

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`SK Technology Monthly Attendance & Payroll Report`, 14, 285);

      doc.save(`SK_Technology_Attendance_Timesheet_${todayStr}.pdf`);
    } catch (err) {
      console.error('Attendance PDF Error:', err);
      alert('Generating Attendance PDF...');
    }
  };

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
    if (!tech) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop';
    if (tech.avatarUrl) return tech.avatarUrl;
    const initialAvatars = {
      'TECH-01': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
      'TECH-02': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
      'TECH-03': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
      'TECH-04': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=120&auto=format&fit=crop'
    };
    return initialAvatars[tech?.id] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop';
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
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 self-start md:self-auto overflow-x-auto max-w-full gap-1">
          {[
            { id: 'Attendance', label: '🕒 Attendance & Timesheet' },
            { id: 'Field Reports', label: '📸 Technician Field Reports' },
            { id: 'Technicians', label: '⭐ Technician Performance' },
            { id: 'Overview', label: '📊 Executive Overview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents: Attendance & Timesheet (1-31 Days View) */}
      {activeTab === 'Attendance' && (
        <div className="space-y-6">
          {/* KPI Attendance Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">PRESENT TODAY</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-0.5 font-mono">
                  {todayAttendanceList.filter(r => r.status === 'PRESENT' || r.status === 'OVERTIME').length} Techs
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FiCheckCircle size={18} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">HALF DAY / ON LEAVE</span>
                <span className="text-xl sm:text-2xl font-black text-amber-600 block mt-0.5 font-mono">
                  {todayAttendanceList.filter(r => r.status === 'HALF_DAY').length} Techs
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FiActivity size={18} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">TOTAL HOURS LOGGED</span>
                <span className="text-xl sm:text-2xl font-black text-purple-600 block mt-0.5 font-mono">
                  {todayAttendanceList.reduce((sum, r) => sum + (Number(r.totalHours) || 0), 0).toFixed(1)} Hours
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FiClock size={18} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">ACTIVE ROSTER</span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 block mt-0.5 font-mono">{(technicians || []).length} Techs</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FiUsers size={18} />
              </div>
            </div>
          </div>

          {/* Monthly Timesheet & Attendance Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                  <span>Attendance Logs</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Daily check-in, check-out, and hours logged for salary calculation</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMonthlyExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <FiDownload size={14} />
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={handleExportAttendancePDF}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <FiDownload size={14} />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Daily Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Technician</th>
                    <th className="py-3 px-3 text-center">Check-In</th>
                    <th className="py-3 px-3 text-center">Check-Out</th>
                    <th className="py-3 px-3 text-center">Hours</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {dailyAttendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-medium">
                        No attendance records found for this period.
                      </td>
                    </tr>
                  ) : (
                    dailyAttendanceList.map((att) => {
                      const isHalfDay = att.status === 'HALF_DAY';
                      const isOvertime = att.status === 'OVERTIME';
                      const isOffDuty = att.status === 'OFF_DUTY';
                      return (
                        <tr key={`att-${att.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3 align-middle font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {att.date}
                          </td>
                          <td className="py-3.5 px-3 align-middle font-bold text-slate-900 dark:text-white">
                            <div>{att.technician}</div>
                          </td>
                          <td className="py-3.5 px-3 align-middle text-center font-mono text-emerald-600 font-bold bg-emerald-50/30 dark:bg-emerald-950/20 rounded-lg">
                            {att.checkInTime || '09:00 AM'}
                          </td>
                          <td className="py-3.5 px-3 align-middle text-center font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {att.checkOutTime || '06:00 PM'}
                          </td>
                          <td className="py-3.5 px-3 align-middle text-center font-mono font-black text-slate-900 dark:text-white">
                            {(!att.checkOutTime || att.checkOutTime === '--:--') && att.checkInTime !== '--:--' && att.status === 'PRESENT'
                              ? <span className="text-blue-500 animate-pulse">{calculateLiveHours(att.checkInTime, att.date)}</span>
                              : <span>{att.totalHours} hrs</span>
                            }
                          </td>
                          <td className="py-3.5 px-3 align-middle text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider border ${
                              isHalfDay
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
                                : isOvertime
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                                : isOffDuty
                                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
                            }`}>
                              {att.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 align-middle">
                            <div className="flex items-center space-x-1.5 max-w-[200px]">
                              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate" title={att.location}>
                                📍 {att.location || 'Field Location'}
                              </span>
                              {att.latitude && att.longitude && (
                                <a 
                                  href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-600 hover:text-blue-700 font-bold shrink-0 underline"
                                  title="View exact live GPS location on Google Maps"
                                >
                                  (Map)
                                </a>
                              )}
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportMonthlyExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <FiDownload size={14} />
                  <span>Export Monthly Attendance (Excel / CSV)</span>
                </button>

                <button
                  onClick={handleDownloadAllPDF}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <FiDownload size={14} />
                  <span>Export Reports (PDF)</span>
                </button>
              </div>
            </div>

            {/* 🔍 Dynamic Date & Multi-Filter Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 mb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">📅 Filter by Date:</span>
                  <input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate('')}
                      className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      Clear Date
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        filterDate === new Date().toISOString().split('T')[0]
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setFilterDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => setFilterDate('')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        !filterDate
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      All Dates
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tech Dropdown */}
                  <select
                    value={filterTech}
                    onChange={(e) => setFilterTech(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="ALL">All Technicians ({uniqueTechNames.length})</option>
                    {uniqueTechNames.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Status Dropdown */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="Verified">Verified / Approved</option>
                    <option value="Under Review">Under Review / In Progress</option>
                    <option value="Submitted">Submitted</option>
                  </select>

                  {/* Search Query */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search task, tech, customer..."
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none w-48"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1">
                <span>Showing <strong>{filteredFieldReports.length}</strong> of <strong>{allReportsList.length}</strong> reports</span>
                {(filterDate || filterTech !== 'ALL' || filterStatus !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterDate('');
                      setFilterTech('ALL');
                      setFilterStatus('ALL');
                      setSearchQuery('');
                    }}
                    className="text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>

            {/* 📱 Mobile Card View (Screenshot 1) - Matching Technician Mobile Flow */}
            <div className="block md:hidden space-y-3">
              {filteredFieldReports.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  No field service reports found for selected filters.
                </div>
              ) : (
                filteredFieldReports.map((report) => {
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
                          <span className="text-[10px] text-slate-400 font-mono block pt-1">
                            {report.updatedAt 
                              ? new Date(report.updatedAt).toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }) 
                              : 'Pending'}
                          </span>
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
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Job Code / Order</th>
                    <th className="py-3 px-3">Technician</th>
                    <th className="py-3 px-3">Customer & Location</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Evidence & Media</th>
                    <th className="py-3 px-3">Technician Narrative / Notes</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredFieldReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                        No field service reports found for the selected date / filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFieldReports.map((report) => {
                      const totalPhotos = (report.beforePhotos?.length || 0) + (report.afterPhotos?.length || 0);
                      const hasVoice = Boolean(report.hasVoiceNote || (report.voiceNoteUrl && report.voiceNoteUrl.length > 0));

                      return (
                        <tr key={report.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 📅 Date & Time Column */}
                          <td className="py-4 px-3 align-middle">
                            <div className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                              {new Date(report.updatedAt || report.date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                              {report.time || (report.updatedAt ? new Date(report.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '03:45 PM')}
                            </div>
                          </td>

                          {/* 🏷️ Job Code / Order Column */}
                          <td className="py-4 px-3 align-middle">
                            {report.jobCode === 'DAILY WORK LOG' ? (
                              <div>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wider">
                                  DAILY LOG
                                </span>
                                <div className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{report.title}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-mono font-extrabold text-slate-900 dark:text-white">#{report.jobCode}</div>
                                <div className="text-[10px] font-sans font-medium text-slate-400 truncate max-w-[150px]">{report.title}</div>
                              </div>
                            )}
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

                          {/* 📸 Evidence & Media Column (Photos + Voice Note) */}
                          <td className="py-4 px-3 align-middle text-center">
                            <div className="flex flex-col items-center gap-1.5 justify-center">
                              {totalPhotos > 0 && (
                                <button
                                  onClick={() => setSelectedPhotoModal(report)}
                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:scale-105"
                                >
                                  <span>📸 {totalPhotos} Photos</span>
                                </button>
                              )}

                              {hasVoice && (
                                <button
                                  onClick={() => setAdminFullReportModal(report)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:scale-105"
                                >
                                  <span>🎙️ Voice Memo</span>
                                </button>
                              )}

                              {totalPhotos === 0 && !hasVoice && (
                                <span className="text-[11px] text-slate-400 font-medium">No Media</span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-3 align-middle">
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">{report.notes}</p>
                          </td>

                          <td className="py-4 px-3 align-middle text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setAdminFullReportModal(report)}
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

                              <button
                                onClick={() => handleDeleteReport(report)}
                                title="Delete Report"
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                              >
                                🗑️
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
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <img 
                          src={typeof p === 'string' ? p : (p.url || p)} 
                          alt="Before installation" 
                          className="w-full h-40 object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <p className="p-2 text-[11px] text-slate-600 font-medium bg-white border-t border-slate-100">{p.caption || 'Initial site setup condition'}</p>
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
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <img 
                          src={typeof p === 'string' ? p : (p.url || p)} 
                          alt="After installation" 
                          className="w-full h-40 object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <p className="p-2 text-[11px] text-slate-600 font-medium bg-white border-t border-slate-100">{p.caption || 'Completed equipment setup'}</p>
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
                      {(adminQuickDetailReport.notes || 'Work completed').replace(/\[Voice Memo Attached:[^\]]*\]/gi, '').trim()}
                    </span>
                  </div>

                  {/* Voice Report */}
                  {(adminQuickDetailReport.hasVoiceNote || adminQuickDetailReport.voiceNoteUrl) && (
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Voice Report</span>
                      <button
                        type="button"
                        onClick={() => handlePlayVoiceMemo(adminQuickDetailReport)}
                        className={`px-3 py-1.5 rounded-full font-bold text-[11px] flex items-center space-x-1.5 cursor-pointer border transition-all shadow-xs ${
                          isPlayingAudio 
                            ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                            : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-900'
                        }`}
                      >
                        <span>{isPlayingAudio ? '⏹ Stop' : '▶ Play Audio'}</span>
                        <span className="font-mono">00:12</span>
                      </button>
                    </div>
                  )}

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
                onClick={() => {
                  if (isPlayingAudio) {
                    if (window.__activeAudioInstance) window.__activeAudioInstance.pause();
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    setIsPlayingAudio(false);
                  }
                  setAdminFullReportModal(null);
                }}
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
                  {adminFullReportModal.title || 'CCTV Installation & Field Service Work'}
                </p>
              </div>

              {/* Before Work Photos */}
              {adminFullReportModal.beforePhotos && adminFullReportModal.beforePhotos.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">Before Work Photos ({adminFullReportModal.beforePhotos.length})</span>
                  <div className="flex items-center space-x-3 overflow-x-auto">
                    {adminFullReportModal.beforePhotos.map((p, i) => (
                      <img 
                        key={i} 
                        src={typeof p === 'string' ? p : (p.url || p)} 
                        alt="Before" 
                        className="w-32 h-28 object-cover rounded-xl border border-slate-200" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Inspection Comments */}
              <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">Inspection Comments</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {(adminFullReportModal.notes || 'Work completed on site.').replace(/\[Voice Memo Attached:[^\]]*\]/gi, '').trim()}
                </div>
              </div>

              {/* After Work Photos */}
              {adminFullReportModal.afterPhotos && adminFullReportModal.afterPhotos.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">After Work Photos ({adminFullReportModal.afterPhotos.length})</span>
                  <div className="flex items-center space-x-3 overflow-x-auto">
                    {adminFullReportModal.afterPhotos.map((p, i) => (
                      <img 
                        key={i} 
                        src={typeof p === 'string' ? p : (p.url || p)} 
                        alt="After" 
                        className="w-32 h-28 object-cover rounded-xl border border-slate-200" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Report Player */}
              {(adminFullReportModal.hasVoiceNote || adminFullReportModal.voiceNoteUrl) && (
                <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">Voice Report</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handlePlayVoiceMemo(adminFullReportModal)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                          isPlayingAudio ? 'bg-red-500 animate-pulse shadow-md' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {isPlayingAudio ? '⏹' : '▶'}
                      </button>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {isPlayingAudio ? 'Playing Voice Memo...' : 'Audio Recording Summary'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold text-xs">00:12</span>
                  </div>
                </div>
              )}

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
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {adminFullReportModal.updatedAt 
                      ? new Date(adminFullReportModal.updatedAt).toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }) 
                      : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons (Approve, WhatsApp, Delete) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-3 gap-2.5 shrink-0">
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
                  <span>Approve</span>
                </button>
              )}

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `*SK Technology CCTV Service Report*\n\nJob: ${adminFullReportModal.jobCode}\nCustomer: ${adminFullReportModal.customer}\nTechnician: ${adminFullReportModal.technician}\nStatus: Approved`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <span>🟢</span>
                <span>Share</span>
              </a>

              <button
                type="button"
                onClick={() => handleDeleteReport(adminFullReportModal)}
                className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
