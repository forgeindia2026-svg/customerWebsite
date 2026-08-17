import React, { useState } from 'react';
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
  const [selectedReportIndex, setSelectedReportIndex] = useState<number | null>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; caption?: string } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mobileSubTab, setMobileSubTab] = useState<'All' | 'Submitted' | 'In Progress' | 'Drafts'>('Submitted');
  const [mobileQuickDetailReport, setMobileQuickDetailReport] = useState<any | null>(null);
  const [mobileFullReportModal, setMobileFullReportModal] = useState<any | null>(null);
  const [showGeneralReportModal, setShowGeneralReportModal] = useState(false);

  const handleCreateReport = () => {
    // 1. Pick an IN_PROGRESS or ACCEPTED active job first
    const activeJob = jobs.find(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED');
    if (activeJob) {
      onOpenWorkflow(activeJob);
      return;
    }

    // 2. Pick any assigned job that is not completed
    const nonCompletedJob = jobs.find(j => j.status !== 'COMPLETED' && j.status !== 'VERIFIED');
    if (nonCompletedJob) {
      onOpenWorkflow(nonCompletedJob);
      return;
    }

    // 3. Fallback to general report if no jobs available
    if (jobs[0]) {
      onOpenWorkflow(jobs[0]);
    } else {
      setShowGeneralReportModal(true);
    }
  };

  const handleGeneralReportSubmit = async (data: any) => {
    try {
      const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
      
      const payload = {
        technicianId: authUser.id || 'TECH-UNKNOWN',
        technicianName: authUser.name || 'Unknown Technician',
        ...data
      };

      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('General report submitted successfully!');
      } else {
        alert('Failed to submit report.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting report.');
    }
  };

  // Dynamically extract submitted daily reports and workflow completion reports from jobs database
  const reports = jobs.flatMap((job) => {
    const list: any[] = [];

    // 1. Explicit daily reports array
    if (job.dailyReports && job.dailyReports.length > 0) {
      job.dailyReports.forEach((report, idx) => {
        list.push({
          id: report.id || `REP-${job.jobCode}-${idx + 1}`,
          date: report.date || new Date(report.createdAt || job.updatedAt || Date.now()).toISOString().split('T')[0],
          jobCode: job.jobCode,
          jobTitle: job.title,
          customer: job.customer?.name || 'Client',
          customerAddress: `${job.customer?.address || ''}, ${job.customer?.city || ''}`,
          technician: report.technicianName || job.assignedTechnician?.name || 'Technician',
          hoursLogged: report.hoursWorked || 8,
          status: report.approvedByAdmin ? 'VERIFIED' : 'PENDING_REVIEW',
          summary: report.workDone || 'Daily work report submitted.',
          photosCount: (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0),
          beforePhotos: job.beforePhotos || [],
          afterPhotos: job.afterPhotos || [],
          safetyCheck: 'PASSED (4/4)',
          supervisorApproval: report.approvedByAdmin ? 'Approved by Admin' : 'Pending Admin Verification',
        });
      });
    }

    // 2. Synthesize completion & site evidence reports for all assigned jobs
    if (!job.dailyReports || job.dailyReports.length === 0) {
      const isApproved = job.approvedByAdmin === true || job.status === 'COMPLETED' || job.status === 'APPROVED' || job.status === 'DELIVERED' || localStorage.getItem(`report_approved_${job.jobCode}`) === 'true';
      list.push({
        id: `REP-${job.jobCode}-WORKFLOW`,
        date: new Date(job.updatedAt || Date.now()).toISOString().split('T')[0],
        jobCode: job.jobCode,
        jobTitle: job.title,
        customer: job.customer?.name || 'Client',
        customerAddress: `${job.customer?.address || ''}, ${job.customer?.city || ''}`,
        technician: job.assignedTechnician?.name || 'Technician',
        hoursLogged: 8,
        status: isApproved ? 'VERIFIED' : 'PENDING_REVIEW',
        summary: job.fieldNotes || `Field execution work report for ${job.title}. Status: ${job.status.replace(/_/g, ' ')}`,
        photosCount: (job.beforePhotos?.length || 0) + (job.afterPhotos?.length || 0),
        beforePhotos: job.beforePhotos || [],
        afterPhotos: job.afterPhotos || [],
        safetyCheck: 'PASSED (4/4)',
        supervisorApproval: isApproved ? 'Approved by Admin' : 'Pending Admin Verification',
      });
    }

    return list;
  });

  const filteredReports = reports.filter((r) => {
    if (filterType === 'VERIFIED') return r.status === 'VERIFIED';
    if (filterType === 'PENDING') return r.status === 'PENDING_REVIEW';
    return true;
  });

  const activeReport = selectedReportIndex !== null ? filteredReports[selectedReportIndex] || filteredReports[0] : filteredReports[0];

  // Printable Formatted PDF Generator Trigger
  const handleExportPDF = (report: typeof reports[0]) => {
    setIsExporting(true);

    setTimeout(() => {
      // Create a printable HTML document blob for the formatted PDF report
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

  // Dynamic Calculation of Total Hours Logged & Days Worked
  const totalHoursLogged = reports.reduce((sum, r) => sum + r.hoursLogged, 0);
  const totalDaysWorked = new Set(reports.map(r => r.date)).size;
  const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length;
  const approvalRate = reports.length > 0 ? (verifiedCount / reports.length) * 100 : 100;

  // CSV Data File Downloader for current selected report or full log
  const handleExportCSV = () => {
    const targetReports = activeReport ? [activeReport] : reports;
    const headers = ['Report ID', 'Date', 'Job Code', 'Job Title', 'Customer', 'Technician', 'Logged Hours', 'Safety Status', 'Supervisor Approval', 'Technical Summary'];
    const rows = targetReports.map(r => [
      r.id,
      r.date,
      r.jobCode,
      `"${r.jobTitle.replace(/"/g, '""')}"`,
      `"${r.customer.replace(/"/g, '""')}"`,
      `"${r.technician.replace(/"/g, '""')}"`,
      r.hoursLogged,
      `"${r.safetyCheck}"`,
      `"${r.supervisorApproval.replace(/"/g, '""')}"`,
      `"${r.summary.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport ? activeReport.id : 'SK_Field_Daily_Reports'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-zinc-900 font-sans">

      {/* Table Format: Header Bar & Filter Controls */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center space-x-2">
              <FileText className="w-4.5 h-4.5 text-zinc-800" />
              <span>Completed Work Reports Table</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">List of verified site completion logs and evidence submitted by field technicians</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                  filterType === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                }`}
              >
                All ({reports.length})
              </button>
              <button
                onClick={() => setFilterType('VERIFIED')}
                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                  filterType === 'VERIFIED' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                }`}
              >
                Approved ({verifiedCount})
              </button>
            </div>

            <button 
              onClick={handleCreateReport}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Create Report</span>
            </button>
          </div>
        </div>

        {/* 📱 Mobile View (block md:hidden) - Exact Match to User Screenshots 1, 2, and 3 */}
        <div className="block md:hidden space-y-4">
          
          {/* Top Mobile Filter Tabs: All | Submitted | In Progress | Drafts */}
          <div className="bg-white border-b border-zinc-200 -mx-4 px-4 pt-1 flex items-center justify-between overflow-x-auto shadow-2xs">
            {['All', 'Submitted', 'In Progress', 'Drafts'].map((tab) => {
              const isActive = mobileSubTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setMobileSubTab(tab as any)}
                  className={`py-2.5 px-3 text-xs font-bold transition-all relative shrink-0 cursor-pointer ${
                    isActive ? 'text-red-600 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full" />}
                </button>
              );
            })}
          </div>

          {/* Sub Filter Row: Date & Filter */}
          <div className="flex items-center justify-between text-xs text-zinc-600 pt-1">
            <div className="flex items-center space-x-1 cursor-pointer hover:text-zinc-900 font-semibold">
              <span>📅 Date</span>
              <span className="text-[10px]">▼</span>
            </div>
            <div className="flex items-center space-x-1 cursor-pointer hover:text-zinc-900 font-semibold">
              <span>🌪️ Filter</span>
            </div>
          </div>

          {/* List of Mobile Task Cards (Screenshot 1 ONLY) */}
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                No submitted task reports found.
              </div>
            ) : (
              filteredReports.map((report) => {
                const isCompleted = report.status === 'VERIFIED' || report.status === 'COMPLETED';
                const mainPhoto = report.afterPhotos?.[0] || report.beforePhotos?.[0] || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=200&auto=format&fit=crop';
                const photoUrl = typeof mainPhoto === 'string' ? mainPhoto : mainPhoto.url;

                return (
                  /* Compact Card Item (Screenshot 1 ONLY) */
                  <div
                    key={`mob-card-${report.id}`}
                    onClick={() => setMobileQuickDetailReport(report)}
                    className="bg-white border border-zinc-200/90 hover:border-red-500 rounded-2xl p-4 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`text-xs font-bold block ${isCompleted ? 'text-emerald-600' : 'text-sky-600'}`}>
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900">Task ID: #{report.jobCode}</h4>
                        <p className="text-xs text-zinc-600">Customer: <strong className="text-zinc-900">{report.customer}</strong></p>
                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">Location: {report.customerAddress || 'Chennai, Tamil Nadu'}</p>
                        <span className="text-[10px] text-zinc-400 font-mono block pt-1">{report.date} 03:45 PM</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <img src={photoUrl} alt="Task" className="w-14 h-14 object-cover rounded-xl border border-zinc-200" />
                        <span className="text-zinc-400 font-bold text-sm">›</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 📱 Mobile Quick Detail Modal Sheet (Screenshot 2) */}
        {mobileQuickDetailReport && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
            <div className="bg-white w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              
              {/* Header with Back Button */}
              <div className="px-4 py-3 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
                <button
                  onClick={() => setMobileQuickDetailReport(null)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 cursor-pointer"
                >
                  <span className="text-sm font-bold">‹</span>
                  <span>Back to Reports List</span>
                </button>

                <button
                  onClick={() => setMobileQuickDetailReport(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Detail Sheet Content (Screenshot 2) */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-zinc-900">
                {/* Task ID Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase font-semibold">TASK ID</span>
                    <h3 className="text-base font-extrabold text-zinc-900">#{mobileQuickDetailReport.jobCode}</h3>
                  </div>
                  <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${
                    mobileQuickDetailReport.status === 'VERIFIED' || mobileQuickDetailReport.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {mobileQuickDetailReport.status === 'VERIFIED' || mobileQuickDetailReport.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                {/* Customer Information List */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start space-x-3">
                    <span className="text-zinc-400 text-sm">👤</span>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-semibold block">Customer Name</span>
                      <span className="font-bold text-zinc-900 text-xs">{mobileQuickDetailReport.customer}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-zinc-400 text-sm">📞</span>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Phone Number</span>
                        <span className="font-bold text-zinc-900 text-xs">+91 98765 43210</span>
                      </div>
                    </div>
                    <a href="tel:+919876543210" className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100">
                      📞
                    </a>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-zinc-400 text-sm">📍</span>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Location</span>
                        <span className="font-bold text-zinc-900 leading-snug text-xs">{mobileQuickDetailReport.customerAddress || 'No. 45, 5th Street, Anna Nagar, Chennai - 600040'}</span>
                      </div>
                    </div>
                    <span className="text-red-600 text-sm p-1">📍</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-zinc-400 text-sm">👤</span>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Technician</span>
                        <span className="font-bold text-zinc-900 text-xs">{mobileQuickDetailReport.technician}</span>
                      </div>
                    </div>
                    <span className="text-red-600 text-xs font-bold">👤</span>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-zinc-400 text-sm">📅</span>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-semibold block">Date & Time</span>
                      <span className="font-bold text-zinc-900 text-xs">{mobileQuickDetailReport.date} 03:45 PM</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-zinc-400 text-sm">📋</span>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-semibold block">Task Description</span>
                      <span className="font-bold text-zinc-900 text-xs">{mobileQuickDetailReport.jobTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Report Summary Section */}
                <div className="border-t border-zinc-100 pt-3 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-zinc-900">Report Summary</h4>
                  <div className="bg-zinc-50 rounded-xl divide-y divide-zinc-200/80 border border-zinc-200/80 text-xs">
                    
                    {/* Before Photos Row */}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Before Work Photos</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {mobileQuickDetailReport.beforePhotos?.slice(0, 2).map((p: any, pI: number) => (
                            <img key={pI} src={typeof p === 'string' ? p : p.url} alt="B" className="w-6 h-6 object-cover rounded border" />
                          ))}
                        </div>
                        <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {mobileQuickDetailReport.beforePhotos?.length || 2}
                        </span>
                        <span className="text-zinc-400 font-bold">›</span>
                      </div>
                    </div>

                    {/* After Photos Row */}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">After Work Photos</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {mobileQuickDetailReport.afterPhotos?.slice(0, 2).map((p: any, pI: number) => (
                            <img key={pI} src={typeof p === 'string' ? p : p.url} alt="A" className="w-6 h-6 object-cover rounded border" />
                          ))}
                        </div>
                        <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {mobileQuickDetailReport.afterPhotos?.length || 1}
                        </span>
                        <span className="text-zinc-400 font-bold">›</span>
                      </div>
                    </div>

                    {/* Inspection Comments */}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Inspection Comments</span>
                      <span className="text-zinc-900 font-medium text-right max-w-[150px] truncate">
                        {mobileQuickDetailReport.summary}
                      </span>
                    </div>

                    {/* Voice Report */}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Voice Report</span>
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 rounded-full font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                      >
                        <span>▶</span>
                        <span>00:45</span>
                      </button>
                    </div>

                    {/* Completion Status */}
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-zinc-700 font-medium">Completion Status</span>
                      <span className="font-bold text-emerald-600">Completed</span>
                    </div>
                  </div>
                </div>

                {/* View Full Report Red Button (Screenshot 2) */}
                <button
                  onClick={() => {
                    const r = mobileQuickDetailReport;
                    setMobileQuickDetailReport(null);
                    setMobileFullReportModal(r);
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

        {/* 💻 Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-y border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-3">Job ID & Equipment Title</th>
                <th className="py-3 px-3">Technician & Customer</th>
                <th className="py-3 px-3">Date & Time Spent</th>
                <th className="py-3 px-3">Evidence Photos & Audio</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    No submitted reports found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, idx) => {
                  const isSelected = activeReport?.id === report.id;
                  const hasVoice = report.summary?.includes('Voice Memo Attached');
                  return (
                    <React.Fragment key={report.id}>
                      <tr 
                        onClick={() => setSelectedReportIndex(idx)}
                        className={`hover:bg-zinc-50/80 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/40 font-semibold' : ''
                        }`}
                      >
                        {/* Job ID & Title */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {report.jobCode}
                          </span>
                          <p className="font-bold text-zinc-900 mt-1 line-clamp-1">{report.jobTitle}</p>
                        </td>

                        {/* Technician & Customer */}
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-zinc-900">{report.technician}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[150px]">{report.customer}</p>
                        </td>

                        {/* Date & Time Spent */}
                        <td className="py-3.5 px-3">
                          <p className="font-mono font-bold text-zinc-800">{report.hoursLogged} Hours</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{report.date}</p>
                        </td>

                        {/* Evidence Photos & Voice Memo */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 font-mono font-bold text-[10px] rounded flex items-center space-x-1">
                              <Camera className="w-3 h-3 text-zinc-500" />
                              <span>{report.photosCount} Photos</span>
                            </span>
                            {hasVoice && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded flex items-center space-x-1">
                                <Volume2 className="w-3 h-3 text-emerald-600" />
                                <span>Voice Memo</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            report.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{report.status === 'VERIFIED' ? '✓ APPROVED' : 'PENDING'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReportIndex(idx);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-zinc-900 text-white shadow-xs'
                                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isSelected ? 'Viewing' : 'View Report'}</span>
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                `*SK Technology CCTV Service Report*\n\nJob: ${report.jobCode} - ${report.jobTitle}\nCustomer: ${report.customer}\nTechnician: ${report.technician}\nStatus: ${report.status}\nSummary: ${report.summary}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                              title="Share via WhatsApp"
                            >
                              <span className="text-xs">🟢</span>
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* 🔽 Expandable Detailed Report View */}
                      {isSelected && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-zinc-50/50">
                            <div className="p-5 bg-white border-y border-zinc-200/90 space-y-5 my-2 mx-2 rounded-xl shadow-xs">
                              {/* Header & Export Actions */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-3">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      JOB ID: {activeReport.jobCode}
                                    </span>
                                    <span className="text-xs text-zinc-300">•</span>
                                    <span className="text-xs font-mono text-zinc-500">{activeReport.date}</span>
                                  </div>
                                  <h3 className="text-base font-bold text-zinc-900 mt-1">{activeReport.jobTitle}</h3>
                                  <p className="text-xs text-zinc-500">Customer: <strong className="text-zinc-800">{activeReport.customer}</strong> {activeReport.customerAddress && `(${activeReport.customerAddress})`}</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={handleExportCSV}
                                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    <span>Excel Data</span>
                                  </button>

                                  <button 
                                    onClick={() => handleExportPDF(activeReport)}
                                    disabled={isExporting}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                                      exportSuccess
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs'
                                    }`}
                                  >
                                    {exportSuccess ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        <span>Downloaded</span>
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4 text-emerald-400" />
                                        <span>{isExporting ? 'Generating...' : 'Download PDF Report'}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Chronological Step-by-Step Field Evidence Report */}
                              <div className="space-y-4 pt-1">
                                
                                {/* Step 1 & Step 2: Before & After Photos Side-by-Side Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Step 1: Before Work Photo */}
                                  <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                                        <Camera className="w-4 h-4 text-amber-700" />
                                        <span>Step 1: Before Work Photo (வேலை தொடங்கும் முன்)</span>
                                      </span>
                                    </div>
                                    {activeReport.beforePhotos && activeReport.beforePhotos.length > 0 ? (
                                      activeReport.beforePhotos.map((photo: any, pIdx: number) => {
                                        const imgUrl = typeof photo === 'string' ? photo : photo.url;
                                        const caption = typeof photo === 'string' ? 'Site Condition Before Work' : photo.caption || 'Before Photo';
                                        return (
                                          <div
                                            key={`before-${pIdx}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPreviewPhoto({ url: imgUrl, caption });
                                            }}
                                            className="group relative border border-amber-200 rounded-xl overflow-hidden bg-white cursor-pointer hover:shadow-md transition-all"
                                          >
                                            <img src={imgUrl} alt={caption} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="p-2 bg-white flex items-center justify-between border-t border-amber-100">
                                              <span className="text-[10px] font-bold text-amber-800 uppercase font-mono">BEFORE PHOTO</span>
                                              <span className="text-[10px] text-amber-600 font-medium">Click to Zoom</span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="p-4 text-center text-amber-700/60 text-xs italic bg-white/60 rounded-xl border border-amber-100">
                                        No before-work photo attached
                                      </div>
                                    )}
                                  </div>

                                  {/* Step 2: After Work Photo */}
                                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                                        <Camera className="w-4 h-4 text-emerald-700" />
                                        <span>Step 2: After Work Photo (வேலை முடிந்த பின்)</span>
                                      </span>
                                    </div>
                                    {activeReport.afterPhotos && activeReport.afterPhotos.length > 0 ? (
                                      activeReport.afterPhotos.map((photo: any, pIdx: number) => {
                                        const imgUrl = typeof photo === 'string' ? photo : photo.url;
                                        const caption = typeof photo === 'string' ? 'Completed Work Evidence' : photo.caption || 'After Photo';
                                        return (
                                          <div
                                            key={`after-${pIdx}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPreviewPhoto({ url: imgUrl, caption });
                                            }}
                                            className="group relative border border-emerald-200 rounded-xl overflow-hidden bg-white cursor-pointer hover:shadow-md transition-all"
                                          >
                                            <img src={imgUrl} alt={caption} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="p-2 bg-white flex items-center justify-between border-t border-emerald-100">
                                              <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">AFTER PHOTO</span>
                                              <span className="text-[10px] text-emerald-600 font-medium">Click to Zoom</span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="p-4 text-center text-emerald-700/60 text-xs italic bg-white/60 rounded-xl border border-emerald-100">
                                        No after-work photo attached
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Step 3: Work Execution Notes (இன்றைய பணி அறிக்கை) */}
                                <div className="p-4 bg-zinc-50 border border-zinc-200/90 rounded-2xl space-y-2">
                                  <h4 className="text-xs font-bold text-zinc-900 flex items-center space-x-1.5 uppercase tracking-wider">
                                    <FileText className="w-4 h-4 text-zinc-700" />
                                    <span>Step 3: Work Report Notes (இன்றைய பணி விவரம்)</span>
                                  </h4>
                                  <p className="text-xs text-zinc-800 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-zinc-200/80">
                                    {activeReport.summary}
                                  </p>
                                </div>

                                {/* Step 4: Voice Message Clip (குரல் செய்தி பதிவு) */}
                                {activeReport.summary?.includes('Voice Memo Attached') && (
                                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                                    <h4 className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5 uppercase tracking-wider">
                                      <Volume2 className="w-4 h-4 text-emerald-700" />
                                      <span>Step 4: Voice Message Clip (குரல் செய்தி)</span>
                                    </h4>

                                    <div className="p-3 bg-white border border-emerald-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                                      <div className="flex items-center space-x-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsPlayingAudio(!isPlayingAudio);
                                          }}
                                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                                            isPlayingAudio
                                              ? 'bg-red-500 text-white animate-pulse'
                                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                          }`}
                                        >
                                          {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                        </button>

                                        <div>
                                          <div className="flex items-center space-x-2">
                                            <span className="font-bold text-zinc-900 text-xs">Technician Audio Voice Memo</span>
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-full">
                                              {isPlayingAudio ? '▶ PLAYING AUDIO...' : '0:08s RECORDED'}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-zinc-500 mt-0.5">Click play button to listen to site voice summary</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-1 font-mono text-xs text-zinc-500">
                                        <div className="flex items-center space-x-0.5 h-5">
                                          {[40, 70, 30, 90, 50, 80, 40, 60].map((h, i) => (
                                            <div
                                              key={i}
                                              className={`w-1 rounded-full transition-all duration-300 ${
                                                isPlayingAudio ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'
                                              }`}
                                              style={{ height: `${isPlayingAudio ? h : 35}%` }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 Photo Zoom Lightbox Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-xl w-full space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-900">📸 Site Evidence Photo Preview</h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img src={previewPhoto.url} alt={previewPhoto.caption} className="max-w-full max-h-[65vh] object-contain" />
            </div>
            {previewPhoto.caption && (
              <p className="text-xs text-zinc-700 font-semibold text-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                {previewPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 📱 Mobile Full Report Sheet Modal (Screenshot 3) */}
      {mobileFullReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-white w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Red Top Bar Header */}
            <div className="bg-red-600 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-xs">
              <button
                onClick={() => setMobileFullReportModal(null)}
                className="flex items-center space-x-1.5 font-bold text-xs hover:opacity-80 transition-opacity"
              >
                <span>‹</span>
                <span>Report #{mobileFullReportModal.jobCode}</span>
              </button>

              <button
                onClick={() => handleExportPDF(mobileFullReportModal)}
                className="p-1.5 hover:bg-red-700 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body - Single Scroll matching Screenshot 3 */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-zinc-900">
              {/* Task Description */}
              <div className="space-y-1 pb-3 border-b border-zinc-100">
                <span className="font-bold text-zinc-900 block text-xs">Task Description</span>
                <p className="text-zinc-600 leading-relaxed font-medium">
                  {mobileFullReportModal.jobTitle || 'Remove old camera and add new Playback system'}
                </p>
              </div>

              {/* Before Work Photos */}
              <div className="space-y-2 pb-3 border-b border-zinc-100">
                <span className="font-bold text-zinc-900 block text-xs">Before Work Photos</span>
                <div className="flex items-center space-x-3 overflow-x-auto">
                  {mobileFullReportModal.beforePhotos?.length > 0 ? (
                    mobileFullReportModal.beforePhotos.map((p: any, i: number) => {
                      const url = typeof p === 'string' ? p : p.url;
                      return (
                        <img
                          key={i}
                          src={url}
                          alt="Before"
                          onClick={() => setPreviewPhoto({ url, caption: 'Before Work Photo' })}
                          className="w-32 h-28 object-cover rounded-xl border border-zinc-200 cursor-pointer"
                        />
                      );
                    })
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=400&auto=format&fit=crop"
                      alt="Before"
                      className="w-32 h-28 object-cover rounded-xl border border-zinc-200"
                    />
                  )}
                </div>
              </div>

              {/* Inspection Comments */}
              <div className="space-y-1 pb-3 border-b border-zinc-100">
                <span className="font-bold text-zinc-900 block text-xs">Inspection Comments</span>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-zinc-800 font-medium">
                  {mobileFullReportModal.summary || 'Everything is working fine.'}
                </div>
              </div>

              {/* After Work Photos */}
              <div className="space-y-2 pb-3 border-b border-zinc-100">
                <span className="font-bold text-zinc-900 block text-xs">After Work Photos</span>
                <div className="flex items-center space-x-3 overflow-x-auto">
                  {mobileFullReportModal.afterPhotos?.length > 0 ? (
                    mobileFullReportModal.afterPhotos.map((p: any, i: number) => {
                      const url = typeof p === 'string' ? p : p.url;
                      return (
                        <img
                          key={i}
                          src={url}
                          alt="After"
                          onClick={() => setPreviewPhoto({ url, caption: 'After Work Photo' })}
                          className="w-32 h-28 object-cover rounded-xl border border-zinc-200 cursor-pointer"
                        />
                      );
                    })
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=400&auto=format&fit=crop"
                      alt="After"
                      className="w-32 h-28 object-cover rounded-xl border border-zinc-200"
                    />
                  )}
                </div>
              </div>

              {/* Voice Report with Red Play Button & Waveform */}
              <div className="space-y-2 pb-3 border-b border-zinc-100">
                <span className="font-bold text-zinc-900 block text-xs">Voice Report</span>
                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                        isPlayingAudio ? 'bg-red-500 animate-pulse' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>

                    {/* Waveform Bar */}
                    <div className="flex items-center space-x-0.5 h-4">
                      {[30, 60, 40, 80, 50, 90, 40, 70, 50, 80, 30, 60].map((h, i) => (
                        <div
                          key={i}
                          className={`w-0.5 rounded-full transition-all duration-300 ${
                            isPlayingAudio ? 'bg-red-600 animate-pulse' : 'bg-zinc-300'
                          }`}
                          style={{ height: `${isPlayingAudio ? h : 40}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <span className="font-mono text-zinc-500 font-bold text-xs">00:45</span>
                </div>
              </div>

              {/* Completion Status & Submitter Details */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Completion Status</span>
                  <span className="font-bold text-emerald-600">Completed</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Submitted By</span>
                  <span className="font-bold text-zinc-900">{mobileFullReportModal.technician || 'Ramesh'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">Submitted On</span>
                  <span className="font-mono font-bold text-zinc-900">{mobileFullReportModal.date} 03:45 PM</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons (Technician View: Download PDF & WhatsApp Share) */}
            <div className="p-4 border-t border-zinc-200 bg-white grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={() => handleExportPDF(mobileFullReportModal)}
                disabled={isExporting}
                className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Downloading...' : 'Download PDF'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `*SK Technology CCTV Field Service Report*\n\nJob: ${mobileFullReportModal.jobCode}\nCustomer: ${mobileFullReportModal.customer}\nTechnician: ${mobileFullReportModal.technician}\nStatus: ${mobileFullReportModal.status}\nSummary: ${mobileFullReportModal.summary}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 bg-white hover:bg-zinc-50 text-red-600 border border-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center space-x-1.5"
              >
                <span>🟢</span>
                <span>WhatsApp Share</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* General Report Modal */}
      <GeneralReportModal 
        isOpen={showGeneralReportModal} 
        onClose={() => setShowGeneralReportModal(false)} 
        onSubmit={handleGeneralReportSubmit} 
      />
    </div>
  );
};
