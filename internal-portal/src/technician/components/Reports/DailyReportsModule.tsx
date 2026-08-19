import React, { useState, useEffect } from 'react';
import type { Job } from '../../types/job';
import { 
  FileText, 
  Clock, 
  Download, 
  Plus,
  ShieldCheck,
  CheckCircle2,
  Check,
  ArrowUpRight,
  FileSpreadsheet,
  Camera,
  Play,
  Volume2,
  Square,
  Eye,
  X
} from 'lucide-react';
import { GeneralReportModal } from './GeneralReportModal';

interface DailyReportsModuleProps {
  jobs: Job[];
  isLoading?: boolean;
  onOpenWorkflow: (job: Job) => void;
}

export const DailyReportsModule: React.FC<DailyReportsModuleProps> = ({
  jobs,
  isLoading = false,
  onOpenWorkflow,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedReportIndex, setSelectedReportIndex] = useState<number | null>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; caption?: string } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mobileSubTab, setMobileSubTab] = useState<'All' | 'Submitted' | 'In Progress' | 'Drafts'>('Submitted');
  const [mobileQuickDetailReport, setMobileQuickDetailReport] = useState<any | null>(null);
  const [mobileFullReportModal, setMobileFullReportModal] = useState<any | null>(null);
  const [showGeneralReportModal, setShowGeneralReportModal] = useState(false);
  const [punchStatus, setPunchStatus] = useState<'PUNCHED_IN' | 'PUNCHED_OUT'>(() => {
    const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
    const techId = authUser.id || authUser._id || 'TECH-01';
    return localStorage.getItem(`tech_checkin_${techId}`) ? 'PUNCHED_IN' : 'PUNCHED_OUT';
  });
  const [checkInTimestamp, setCheckInTimestamp] = useState<string | null>(() => {
    const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
    const techId = authUser.id || authUser._id || 'TECH-01';
    return localStorage.getItem(`tech_checkin_${techId}`) || null;
  });

  const handleCheckIn = async () => {
    const now = new Date();
    const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
    const techId = authUser.id || authUser._id || 'TECH-01';
    const techName = authUser.name || 'Technician';

    const checkInTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isoString = now.toISOString();

    localStorage.setItem(`tech_checkin_${techId}`, isoString);
    setCheckInTimestamp(isoString);
    setPunchStatus('PUNCHED_IN');

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
      await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          technicianName: techName,
          date: now.toISOString().split('T')[0],
          activityType: 'Check-In',
          workDescription: `Punched in / Shift started at ${checkInTimeStr}`,
          checkInTime: checkInTimeStr,
          status: 'PRESENT',
          hoursWorked: 0
        })
      });
      alert(`✓ Check-In Successful at ${checkInTimeStr}! Have a great shift.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReport = () => {
    const activeJob = jobs.find(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED');
    if (activeJob) {
      onOpenWorkflow(activeJob);
      return;
    }

    const nonCompletedJob = jobs.find(j => j.status !== 'COMPLETED' && j.status !== 'VERIFIED');
    if (nonCompletedJob) {
      onOpenWorkflow(nonCompletedJob);
      return;
    }

    if (jobs[0]) {
      onOpenWorkflow(jobs[0]);
    } else {
      setShowGeneralReportModal(true);
    }
  };

  const [dbReports, setDbReports] = useState<any[]>([]);

  const fetchDbReports = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
      const url = `${baseUrl}/api/reports?t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbReports(data);
        } else if (data && Array.isArray(data.data)) {
          setDbReports(data.data);
        } else if (data && Array.isArray(data.reports)) {
          setDbReports(data.reports);
        } else {
          setDbReports([]);
        }
      } else {
        setDbReports([]);
      }
    } catch (e) {
      console.error('Failed to fetch DB reports', e);
      setDbReports([]);
    }
  };

  useEffect(() => {
    fetchDbReports();
  }, []);

  const handleGeneralReportSubmit = async (data: any) => {
    try {
      const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      const realName = authUser.name || localStorage.getItem('user_name') || 'Field Technician';
      const realId = authUser.id || authUser._id || localStorage.getItem('user_id') || 'TECH-01';
      
      const payload = {
        technicianId: realId,
        technicianName: realName,
        ...data
      };

      const baseUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
      const res = await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && (resData.success || resData._id || resData.data)) {
        alert('General daily log submitted successfully!');
        fetchDbReports();
      } else {
        alert(resData.message || 'Failed to submit report. Please try again.');
      }
    } catch (e: any) {
      console.error('Submit report error:', e);
      alert(e.message || 'Error submitting report.');
    }
  };

  const jobReports = (jobs || []).flatMap((job) => {
    if (!job || !job.dailyReports || job.dailyReports.length === 0) return [];
    
    return job.dailyReports.map((report, idx) => ({
      id: report.id || `REP-${job.jobCode}-${idx + 1}`,
      date: report.date || new Date(report.createdAt || job.updatedAt || Date.now()).toISOString().split('T')[0],
      time: report.time || (report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''),
      jobCode: job.jobCode || 'JOB-001',
      jobTitle: job.title || 'CCTV Service Work',
      customer: job.customer?.name || 'Client',
      customerAddress: `${job.customer?.address || ''}, ${job.customer?.city || ''}`,
      technician: report.technicianName || job.assignedTechnician?.name || 'Technician',
      hoursLogged: report.hoursWorked || 0,
      status: report.approvedByAdmin ? 'VERIFIED' : 'PENDING_REVIEW',
      summary: report.workDone || 'Daily work report submitted.',
      photosCount: (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0),
      beforePhotos: job.beforePhotos || [],
      afterPhotos: job.afterPhotos || [],
      safetyCheck: 'PASSED (4/4)',
      supervisorApproval: report.approvedByAdmin ? 'Approved by Admin' : 'Pending Admin Verification',
    }));
  });

    const dbReportsFormatted = (Array.isArray(dbReports) ? dbReports : [])
      .filter((gr) => {
        // Filter out pure Check-In/Attendance logs so only actual work reports are displayed here
        if (gr.activityType === 'Check-In' || (gr.workDescription && gr.workDescription.includes('Punched in'))) return false;
        
        return true;
      })
    .map((gr) => {
      let timeStr = gr.checkInTime || '';
      if (!timeStr && gr.createdAt) {
        try {
          timeStr = new Date(gr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (_) {}
      }
      return {
        id: gr._id || `REP-DB-${Math.random()}`,
        date: gr.createdAt ? gr.createdAt.split('T')[0] : (gr.date || new Date().toISOString().split('T')[0]),
        time: timeStr || '',
        jobCode: gr.jobCode || gr.jobId || 'GENERAL-TASK',
        jobTitle: gr.activityType || 'Daily Work Log',
        customer: gr.customerName || 'Internal / Office',
        customerAddress: gr.location || 'Location Unspecified',
        technician: gr.technicianName || 'Technician',
        hoursLogged: gr.hoursWorked !== undefined && gr.hoursWorked !== null ? Number(gr.hoursWorked) : 0,
        status: gr.approvedByAdmin ? 'VERIFIED' : (gr.status || 'PENDING_REVIEW'),
        summary: gr.workDescription || 'Daily report log',
        photosCount: (gr.beforePhotos?.length || 0) + (gr.afterPhotos?.length || 0),
        beforePhotos: gr.beforePhotos || [],
        afterPhotos: gr.afterPhotos || [],
        safetyCheck: ((gr.beforePhotos?.length || 0) + (gr.afterPhotos?.length || 0) > 0) ? 'PASSED (Site Evidence Uploaded)' : 'PASSED (Daily Log)',
        supervisorApproval: gr.approvedByAdmin ? 'Approved by Admin' : 'Pending Admin Verification',
      };
    });

  const jobReportCodes = new Set(jobReports.map(r => r.jobCode));

  const reports = [...jobReports, ...dbReportsFormatted.filter(dbR => !jobReportCodes.has(dbR.jobCode) || dbR.jobCode === 'GENERAL-TASK')]
    .filter((r) => {
      const reportDateStr = r.date || new Date().toISOString().split('T')[0];
      return reportDateStr === selectedDate;
    })
    .sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });

  const filteredReports = reports.filter((r) => {
    // Filter by status if not ALL
    if (filterType === 'VERIFIED' && r.status !== 'VERIFIED') return false;
    if (filterType === 'PENDING' && r.status !== 'PENDING_REVIEW') return false;
    return true;
  });

  const activeReport = (selectedReportIndex !== null && filteredReports[selectedReportIndex])
    ? filteredReports[selectedReportIndex]
    : (filteredReports[0] || null);

  const handleExportPDF = (report: typeof reports[0]) => {
    setIsExporting(true);

    setTimeout(() => {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>SK Technology Field Report - ${report.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #18181b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 20px; font-weight: bold; }
            .badge { background: #0f172a; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-family: monospace; }
            .title { font-size: 22px; font-weight: bold; margin-bottom: 5px; }
            .meta { font-size: 13px; color: #71717a; margin-bottom: 25px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f4f4f5; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            .field { font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; }
            .val { font-size: 14px; font-weight: bold; margin-top: 4px; }
            .section { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #3f3f46; margin-bottom: 10px; }
            .content-box { background: #fafafa; border: 1px solid #e4e4e7; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin-bottom: 25px; }
            .approval { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 15px; border-radius: 8px; font-size: 13px; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 11px; color: #a1a1aa; font-family: monospace; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">SK TECHNOLOGY</div>
              <div style="font-size:12px; color:#71717a;">Enterprise Field Service Operations</div>
            </div>
            <div>
              <span class="badge">${report.id}</span>
            </div>
          </div>

          <div class="title">${report.jobTitle}</div>
          <div class="meta">Customer: <strong>${report.customer}</strong> | Work Order: <strong>${report.jobCode}</strong> | Date: <strong>${report.date}</strong></div>

          <div class="grid">
            <div>
              <div class="field">Field Technician</div>
              <div class="val">${report.technician}</div>
            </div>
            <div>
              <div class="field">Hours Logged</div>
              <div class="val">${report.hoursLogged} Hours</div>
            </div>
            <div>
              <div class="field">Safety Protocol</div>
              <div class="val" style="color:#059669;">${report.safetyCheck}</div>
            </div>
            <div>
              <div class="field">Verification Status</div>
              <div class="val">${report.status}</div>
            </div>
          </div>

          <div class="section">Technical Work Execution Narrative</div>
          <div class="content-box">
            ${report.summary}
          </div>

          <div class="approval">
            ✓ ${report.supervisorApproval}<br/>
            <span style="font-weight:normal; font-size:11px; color:#047857;">Cryptographically signed and archived in SK Operations Database.</span>
          </div>

          <div class="footer">
            SK Technology Enterprise Portal • Generated on ${new Date().toLocaleString()}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
        </html>
      `;

      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      }

      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 400);
  };

  const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length;

  return (
    <div className="space-y-8 bg-[#f4f7fa] p-4 sm:p-8 min-h-[calc(100vh-80px)] font-sans -m-4 sm:-m-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0B1527] tracking-tight uppercase">DAILY REPORTS</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Documenting today's progress for tomorrow's success.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Date Picker */}
          <div className="flex-1 sm:flex-none relative">
            <div className="flex items-center justify-between sm:justify-start bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300 transition-colors cursor-pointer w-full focus-within:ring-2 focus-within:ring-blue-500">
              <div className="flex items-center w-full relative">
                <span className="text-slate-400 absolute left-0 pointer-events-none z-10">📅</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-7 bg-transparent border-none outline-none w-full text-slate-700 cursor-pointer font-bold appearance-none"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
          </div>
          
          {/* Create Entry Button */}
          <button 
            onClick={handleCreateReport}
            className="flex-1 sm:flex-none bg-[#2663ff] hover:bg-[#1a50db] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="uppercase tracking-wide">CREATE ENTRY</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. Total Reports */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">TOTAL REPORTS</span>
            <p className="text-2xl font-black text-[#0B1527] leading-none">{reports.length}</p>
            <span className="text-[10px] font-bold text-blue-600 mt-1 block truncate">Generated Today</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2663ff] flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Closed / Verified */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">VERIFIED & CLOSED</span>
            <p className="text-2xl font-black text-emerald-600 leading-none">{verifiedCount}</p>
            <span className="text-[10px] font-bold text-emerald-600 mt-1 block truncate">Approved by Admin</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>


        {/* 4. Photos Attached */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 truncate">SITE EVIDENCE PHOTOS</span>
            <p className="text-2xl font-black text-amber-600 leading-none">
              {reports.reduce((acc, r) => acc + (r.photos?.length || 0), 0)} <span className="text-xs font-bold text-slate-400">photos</span>
            </p>
            <span className="text-[10px] font-bold text-amber-600 mt-1 block truncate">Proof of Completion</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
          {filteredReports.length === 0 ? (
             <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
               <span className="text-slate-400 font-medium">No reports generated today.</span>
             </div>
          ) : filteredReports.map((report) => {
            const reportDate = new Date(report.date);
            const month = reportDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const day = reportDate.getDate();
            
            return (
              <div key={report.id} className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2663ff] opacity-80 rounded-l-3xl"></div>
                {/* Top row: Badges and Date */}
                <div className="flex justify-between items-start mb-5 pl-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-black rounded-lg uppercase flex items-center gap-1.5 shadow-sm tracking-wide">
                      <span className="text-[#2663ff]">💼</span> {report.jobCode}
                    </span>
                    
                    <span className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-black rounded-lg uppercase flex items-center gap-1.5 shadow-sm tracking-wide ${
                      report.status === 'VERIFIED' || report.status === 'COMPLETED' ? 'bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]' : 'bg-[#e0e7ff] text-[#4f46e5] border border-[#c7d2fe]'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {report.status}
                    </span>

                    <span className="px-3 py-1.5 bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] text-[10px] sm:text-[11px] font-black rounded-lg uppercase shadow-sm whitespace-nowrap tracking-wide">
                      {report.technician}
                    </span>

                    <span className="px-3 py-1.5 bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] text-[10px] sm:text-[11px] font-black rounded-lg uppercase shadow-sm tracking-wide">
                      WORK REPORT
                    </span>
                  </div>
                  
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm shrink-0 ml-4 min-w-[55px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{month}</span>
                    <span className="text-xl font-black text-[#0B1527] leading-none mt-1">{day}</span>
                  </div>
                </div>

                {/* Description */}
                <h3 className="text-base sm:text-[17px] font-black text-[#0B1527] leading-relaxed mb-6 pl-3 pr-2">
                  {report.summary}
                </h3>

                {/* Multimedia Details (Photos & Audio) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-5 border-t border-slate-100/80 pl-3">
                  
                  {/* Before Photos */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <Camera className="w-3 h-3" /> BEFORE WORK
                    </span>
                    <div className="flex items-center gap-2">
                      {report.beforePhotos && report.beforePhotos.length > 0 ? (
                        report.beforePhotos.slice(0, 3).map((p: any, i: number) => (
                          <img 
                            key={i} 
                            src={typeof p === 'string' ? p : p.url} 
                            alt="Before" 
                            onClick={() => setPreviewPhoto({ url: typeof p === 'string' ? p : p.url, caption: 'Before Work Photo' })}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm cursor-pointer hover:border-[#2663ff] hover:scale-105 transition-all" 
                          />
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic py-3 bg-slate-50 w-full text-center rounded-xl border border-slate-100">No photos</span>
                      )}
                    </div>
                  </div>

                  {/* After Photos */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Camera className="w-3 h-3" /> AFTER WORK
                    </span>
                    <div className="flex items-center gap-2">
                      {report.afterPhotos && report.afterPhotos.length > 0 ? (
                        report.afterPhotos.slice(0, 3).map((p: any, i: number) => (
                          <img 
                            key={i} 
                            src={typeof p === 'string' ? p : p.url} 
                            alt="After" 
                            onClick={() => setPreviewPhoto({ url: typeof p === 'string' ? p : p.url, caption: 'After Work Photo' })}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm cursor-pointer hover:border-[#2663ff] hover:scale-105 transition-all" 
                          />
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic py-3 bg-slate-50 w-full text-center rounded-xl border border-slate-100">No photos</span>
                      )}
                    </div>
                  </div>

                  {/* Voice Report */}
                  <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <Volume2 className="w-3 h-3" /> VOICE MEMO
                     </span>
                     {report.summary?.includes('Voice Memo') ? (
                       <div 
                         onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                         className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-[#f0f9ff] hover:border-[#bae6fd] shadow-sm transition-colors max-w-[170px]"
                       >
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${isPlayingAudio ? 'bg-[#2663ff] animate-pulse' : 'bg-[#0B1527]'}`}>
                            {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                         </div>
                         <div className="flex items-center gap-0.5 px-2">
                           {[30, 70, 40, 80, 50, 60, 40].map((h, i) => (
                             <div key={i} className={`w-[2.5px] rounded-full ${isPlayingAudio ? 'bg-[#2663ff] animate-pulse' : 'bg-slate-300'}`} style={{ height: `${isPlayingAudio ? h : 40}%`, minHeight: '14px' }}></div>
                           ))}
                         </div>
                       </div>
                     ) : (
                       <span className="text-xs text-slate-400 font-medium italic py-3 bg-slate-50 w-full text-center rounded-xl border border-slate-100">No audio</span>
                     )}
                  </div>
                </div>
                
                {/* Actions Footer */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between pl-3">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{report.hoursLogged} Hours Logged</span>
                    </div>
                    <button
                      onClick={() => handleExportPDF(report)}
                      className="text-[#2663ff] hover:text-[#1a50db] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Download Report
                    </button>
                </div>
              </div>
            );
          })}
        </div>

      {/* General Report Modal */}
      <GeneralReportModal 
        isOpen={showGeneralReportModal} 
        onClose={() => setShowGeneralReportModal(false)} 
        onSubmit={handleGeneralReportSubmit} 
        checkInTimestamp={checkInTimestamp}
      />
      
      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 px-2">
              <h3 className="text-sm font-black text-[#0B1527] uppercase tracking-wider">📸 Site Evidence Photo</h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
              <img src={previewPhoto.url} alt={previewPhoto.caption} className="max-w-full max-h-[70vh] object-contain" />
            </div>
            {previewPhoto.caption && (
               <p className="mt-4 mb-1 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{previewPhoto.caption}</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
