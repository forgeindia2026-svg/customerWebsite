import jsPDF from 'jspdf';

/**
 * Helper to safely extract Customer Name from an order/job object
 */
const getCustomerName = (j) => {
  if (!j) return 'Client';
  if (typeof j.customer === 'string' && j.customer.trim()) return j.customer.trim();
  if (j.customer && typeof j.customer === 'object') {
    if (j.customer.name && String(j.customer.name).trim()) return String(j.customer.name).trim();
  }
  if (j.customerName && String(j.customerName).trim()) return String(j.customerName).trim();
  return 'Client Service';
};

/**
 * Helper to safely extract Customer Phone
 */
const getCustomerPhone = (j) => {
  if (!j) return '';
  if (j.phone && String(j.phone).trim()) return String(j.phone).trim();
  if (j.customerPhone && String(j.customerPhone).trim()) return String(j.customerPhone).trim();
  if (j.customer && typeof j.customer === 'object' && j.customer.phone) {
    return String(j.customer.phone).trim();
  }
  return '';
};

/**
 * Helper to safely extract Location
 */
const getLocation = (j) => {
  if (!j) return 'N/A';
  if (j.location && String(j.location).trim()) return String(j.location).trim();
  if (j.customerLocation && String(j.customerLocation).trim()) return String(j.customerLocation).trim();
  if (j.address && String(j.address).trim()) return String(j.address).trim();
  if (j.customer && typeof j.customer === 'object' && j.customer.location) {
    return String(j.customer.location).trim();
  }
  return 'N/A';
};

/**
 * Helper to safely extract Real Job / Order ID
 */
const getJobCode = (j) => {
  if (!j) return 'SK-ORD';
  const raw = j.orderNumber || j.id || j.jobCode || j.orderId || '';
  return String(raw).trim() || 'SK-ORD';
};

/**
 * Helper to safely extract Work Title / Service Type
 */
const getWorkTitle = (j) => {
  if (!j) return 'Service';
  const raw = j.type || j.title || j.serviceType || j.taskDescription || '';
  return String(raw).trim() || 'CCTV Service';
};

/**
 * Helper to format date cleanly (DD MMM YYYY)
 */
const formatDisplayDate = (rawDate) => {
  if (!rawDate) return 'N/A';
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (_) {}
  return String(rawDate).split('T')[0];
};

/**
 * Generates an executive-level PDF report summarizing all technicians'
 * completed jobs and earnings for the current month and lifetime.
 * Clean, professional corporate styling (Light background, no heavy dark blocks).
 */
export const exportAllTechniciansPDF = ({
  technicians = [],
  monthLabel = 'This Month',
  generatedBy = 'Administrator'
}) => {
  try {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // 1. Top Brand Header Bar
    doc.setFillColor(37, 99, 235); // Corporate Royal Blue
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Header Background (Crisp White/Subtle Slate-50)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 4, pageWidth, 76, 'F');

    // Title & Branding
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SK TECHNOLOGY', margin, 32);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('TECHNICIAN PERFORMANCE & PAYOUT STATEMENT', margin, 46);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFontSize(7.5);
    const nowStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    doc.text(`Official Internal Report  •  Period: ${monthLabel}  •  Generated: ${nowStr}  •  By: ${generatedBy}`, margin, 60);

    // Separator Line
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(1);
    doc.line(margin, 72, margin + contentWidth, 72);

    // 2. High-level Summary KPI Cards
    const totalMonthJobs = technicians.reduce((sum, t) => sum + (t.monthCompletedCount || 0), 0);
    const totalMonthEarnings = technicians.reduce((sum, t) => sum + (t.monthlyEarnings || 0), 0);
    const totalLifetimeJobs = technicians.reduce((sum, t) => sum + (t.totalCompleted || 0), 0);
    const totalLifetimeEarnings = technicians.reduce((sum, t) => sum + (t.totalEarnings || 0), 0);

    const kpiY = 82;
    const kpiHeight = 44;
    const kpiGap = 10;
    const kpiWidth = (contentWidth - kpiGap * 3) / 4;

    const kpis = [
      { label: 'ACTIVE CREW', val: `${technicians.length} Technicians`, color: [248, 250, 252], border: [226, 232, 240], text: [15, 23, 42] },
      { label: `${monthLabel.toUpperCase()} JOBS`, val: `${totalMonthJobs} Completed`, color: [238, 242, 255], border: [199, 210, 254], text: [67, 56, 202] },
      { label: `${monthLabel.toUpperCase()} PAYOUT`, val: `Rs. ${totalMonthEarnings.toLocaleString('en-IN')}`, color: [236, 253, 245], border: [167, 243, 208], text: [5, 150, 105] },
      { label: 'LIFETIME PAYOUT', val: `Rs. ${totalLifetimeEarnings.toLocaleString('en-IN')}`, color: [248, 250, 252], border: [226, 232, 240], text: [30, 41, 59] }
    ];

    kpis.forEach((kpi, idx) => {
      const kX = margin + idx * (kpiWidth + kpiGap);
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.roundedRect(kX, kpiY, kpiWidth, kpiHeight, 4, 4, 'F');
      doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
      doc.roundedRect(kX, kpiY, kpiWidth, kpiHeight, 4, 4, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, kX + 8, kpiY + 14);

      doc.setFontSize(10);
      doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
      doc.text(kpi.val, kX + 8, kpiY + 30);
    });

    // 3. Performance Table
    const tableStartY = 138;
    const rowHeight = 22;
    const colWidths = {
      sno: 26,
      name: 154,
      monthJobs: 75,
      monthEarn: 88,
      lifeJobs: 80,
      lifeEarn: 100
    };

    // Table Header Row (Clean Light Slate)
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(margin, tableStartY, contentWidth, 22, 'F');
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.rect(margin, tableStartY, contentWidth, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59); // Slate-800

    let curX = margin;
    doc.text('#', curX + 6, tableStartY + 14);
    curX += colWidths.sno;

    doc.text('TECHNICIAN NAME', curX + 8, tableStartY + 14);
    curX += colWidths.name;

    doc.text('MONTH JOBS', curX + colWidths.monthJobs - 8, tableStartY + 14, { align: 'right' });
    curX += colWidths.monthJobs;

    doc.text('MONTH PAYOUT', curX + colWidths.monthEarn - 8, tableStartY + 14, { align: 'right' });
    curX += colWidths.monthEarn;

    doc.text('LIFETIME JOBS', curX + colWidths.lifeJobs - 8, tableStartY + 14, { align: 'right' });
    curX += colWidths.lifeJobs;

    doc.text('LIFETIME PAYOUT', curX + colWidths.lifeEarn - 8, tableStartY + 14, { align: 'right' });

    // Table Data Rows
    let curY = tableStartY + 22;

    technicians.forEach((t, i) => {
      if (curY + rowHeight > pageHeight - 50) {
        doc.addPage();
        curY = 36;
      }

      // Zebra striping
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, curY, contentWidth, rowHeight, 'F');
      }

      // Border line
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, curY + rowHeight, margin + contentWidth, curY + rowHeight);

      // Data Text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);

      let rX = margin;
      doc.text(String(i + 1), rX + 6, curY + 14);
      rX += colWidths.sno;

      // Name & Role
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(t.name || 'Technician', rX + 8, curY + 14);
      rX += colWidths.name;

      // Month Jobs
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(67, 56, 202);
      doc.text(String(t.monthCompletedCount || 0), rX + colWidths.monthJobs - 8, curY + 14, { align: 'right' });
      rX += colWidths.monthJobs;

      // Month Earnings
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`Rs. ${(t.monthlyEarnings || 0).toLocaleString('en-IN')}`, rX + colWidths.monthEarn - 8, curY + 14, { align: 'right' });
      rX += colWidths.monthEarn;

      // Lifetime Jobs
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(String(t.totalCompleted || 0), rX + colWidths.lifeJobs - 8, curY + 14, { align: 'right' });
      rX += colWidths.lifeJobs;

      // Lifetime Earnings
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(t.totalEarnings || 0).toLocaleString('en-IN')}`, rX + colWidths.lifeEarn - 8, curY + 14, { align: 'right' });

      curY += rowHeight;
    });

    // 4. Totals Row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, curY, contentWidth, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, curY, contentWidth, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    let tX = margin + colWidths.sno;
    doc.text('TOTAL SUMMARY', tX + 8, curY + 14);
    tX += colWidths.name;

    doc.setTextColor(67, 56, 202);
    doc.text(String(totalMonthJobs), tX + colWidths.monthJobs - 8, curY + 14, { align: 'right' });
    tX += colWidths.monthJobs;

    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${totalMonthEarnings.toLocaleString('en-IN')}`, tX + colWidths.monthEarn - 8, curY + 14, { align: 'right' });
    tX += colWidths.monthEarn;

    doc.setTextColor(15, 23, 42);
    doc.text(String(totalLifetimeJobs), tX + colWidths.lifeJobs - 8, curY + 14, { align: 'right' });
    tX += colWidths.lifeJobs;

    doc.text(`Rs. ${totalLifetimeEarnings.toLocaleString('en-IN')}`, tX + colWidths.lifeEarn - 8, curY + 14, { align: 'right' });

    // 5. Page Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'SK Technology System Document • Strictly for internal administrative and accounting records.',
      margin,
      pageHeight - 20
    );
    doc.text(
      `Page 1 of ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 20,
      { align: 'right' }
    );

    // Save File
    const cleanDate = new Date().toISOString().slice(0, 10);
    doc.save(`SK_Technicians_Report_${cleanDate}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating technicians PDF report:', err);
    return false;
  }
};

/**
 * Generates an individual statement PDF for a specific technician.
 * Modern, clean corporate light aesthetic (no pitch black banners).
 * Shows Real Job Code, Customer Name, Phone Number, Location, Work Title, Date, Role & Payout.
 */
export const exportSingleTechnicianStatementPDF = ({
  technician,
  jobs = [],
  thisMonthTotal = 0,
  allTimeTotal = 0,
  completedCount = 0,
  thisMonthCompletedCount = 0,
  filterPeriod = 'ALL',
  getJobEarningDetails = () => ({ earning: 0, role: 'Technician' })
}) => {
  try {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 32;
    const contentWidth = pageWidth - margin * 2;

    // 1. Top Brand Accent Bar
    doc.setFillColor(37, 99, 235); // Corporate Blue
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Header Background (Pure White)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 4, pageWidth, 74, 'F');

    // Brand Name & Subtitle
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SK TECHNOLOGY', margin, 30);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('TECHNICIAN WORK & EARNINGS STATEMENT', margin, 44);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFontSize(7.5);
    const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Official Internal Accounting Statement  •  Date: ${nowStr}  •  Filter: ${filterPeriod === 'THIS_MONTH' ? 'This Month' : 'All Time'}`, margin, 58);

    // Separator Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(margin, 68, margin + contentWidth, 68);

    // 2. Technician Profile Card
    const profY = 76;
    const profHeight = 36;
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(margin, profY, contentWidth, profHeight, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, profY, contentWidth, profHeight, 4, 4, 'S');

    // Left Blue Accent on Profile Box
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, profY, 3, profHeight, 1, 1, 'F');

    // Technician details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(technician?.name || 'Technician', margin + 12, profY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const roleTxt = `Role: ${technician?.role || technician?.specialization || 'Technician'}`;
    const phoneTxt = technician?.phone ? `  •  Phone: ${technician.phone}` : '';
    const emailTxt = technician?.email ? `  •  Email: ${technician.email}` : '';
    doc.text(`${roleTxt}${phoneTxt}${emailTxt}`, margin + 12, profY + 28);

    // 3. Modern KPI Cards
    const kpiY = 120;
    const kpiHeight = 44;
    const kpiGap = 10;
    const kpiWidth = (contentWidth - kpiGap * 2) / 3;

    const cards = [
      {
        label: 'THIS MONTH EARNINGS',
        val: `Rs. ${thisMonthTotal.toLocaleString('en-IN')}`,
        sub: `${thisMonthCompletedCount} completed jobs this month`,
        bg: [236, 253, 245],
        border: [167, 243, 208],
        txt: [5, 150, 105]
      },
      {
        label: 'LIFETIME TOTAL EARNINGS',
        val: `Rs. ${allTimeTotal.toLocaleString('en-IN')}`,
        sub: `${completedCount} all-time completed jobs`,
        bg: [238, 242, 255],
        border: [199, 210, 254],
        txt: [67, 56, 202]
      },
      {
        label: 'COMPLETED JOBS',
        val: `${filterPeriod === 'THIS_MONTH' ? thisMonthCompletedCount : completedCount} Jobs`,
        sub: `Selected period sign-off`,
        bg: [248, 250, 252],
        border: [226, 232, 240],
        txt: [15, 23, 42]
      }
    ];

    cards.forEach((c, idx) => {
      const cX = margin + idx * (kpiWidth + kpiGap);
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      doc.roundedRect(cX, kpiY, kpiWidth, kpiHeight, 4, 4, 'F');
      doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
      doc.roundedRect(cX, kpiY, kpiWidth, kpiHeight, 4, 4, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cX + 8, kpiY + 13);

      doc.setFontSize(10.5);
      doc.setTextColor(c.txt[0], c.txt[1], c.txt[2]);
      doc.text(c.val, cX + 8, kpiY + 28);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(c.sub, cX + 8, kpiY + 38);
    });

    // 4. Jobs Table Header
    const tableStartY = 174;
    const rowHeight = 24;
    const colWidths = {
      sno: 22,
      code: 75,
      customer: 130,
      location: 75,
      service: 88,
      date: 54,
      role: 42,
      earning: 45
    };

    // Table Header Bar (Light Slate-100)
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, tableStartY, contentWidth, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, tableStartY, contentWidth, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    let curX = margin;
    doc.text('#', curX + 5, tableStartY + 14);
    curX += colWidths.sno;

    doc.text('JOB CODE', curX + 6, tableStartY + 14);
    curX += colWidths.code;

    doc.text('CUSTOMER & PHONE', curX + 6, tableStartY + 14);
    curX += colWidths.customer;

    doc.text('LOCATION', curX + 6, tableStartY + 14);
    curX += colWidths.location;

    doc.text('SERVICE / WORK', curX + 6, tableStartY + 14);
    curX += colWidths.service;

    doc.text('DATE', curX + 6, tableStartY + 14);
    curX += colWidths.date;

    doc.text('ROLE', curX + 6, tableStartY + 14);
    curX += colWidths.role;

    doc.text('PAYOUT', curX + colWidths.earning - 6, tableStartY + 14, { align: 'right' });

    let curY = tableStartY + 22;
    let totalStatementPayout = 0;

    jobs.forEach((j, i) => {
      // Handle pagination
      if (curY + rowHeight > pageHeight - 45) {
        doc.addPage();
        curY = 36;
      }

      // Zebra row
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, curY, contentWidth, rowHeight, 'F');
      }

      // Row separator
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, curY + rowHeight, margin + contentWidth, curY + rowHeight);

      const earningInfo = getJobEarningDetails(j);
      totalStatementPayout += Number(earningInfo.earning || 0);

      const realJobCode = getJobCode(j);
      const custName = getCustomerName(j);
      const custPhone = getCustomerPhone(j);
      const loc = getLocation(j);
      const workTitle = getWorkTitle(j);
      const rawDate = j.date || j.scheduledDate || j.createdAt;
      const formattedDate = formatDisplayDate(rawDate);

      let rX = margin;

      // S.No
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(String(i + 1), rX + 5, curY + 14);
      rX += colWidths.sno;

      // Job Code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text(realJobCode, rX + 6, curY + 14);
      rX += colWidths.code;

      // Customer Details (Name + Phone)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42); // Dark slate
      const displayCustName = custName.length > 20 ? custName.substring(0, 18) + '...' : custName;
      doc.text(displayCustName, rX + 6, curY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const displayPhone = custPhone ? `Ph: ${custPhone}` : 'No Phone';
      doc.text(displayPhone, rX + 6, curY + 19);
      rX += colWidths.customer;

      // Location
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      const displayLoc = loc.length > 15 ? loc.substring(0, 13) + '..' : loc;
      doc.text(displayLoc, rX + 6, curY + 14);
      rX += colWidths.location;

      // Service / Work
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const displayWork = workTitle.length > 18 ? workTitle.substring(0, 16) + '..' : workTitle;
      doc.text(displayWork, rX + 6, curY + 14);
      rX += colWidths.service;

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(formattedDate, rX + 6, curY + 14);
      rX += colWidths.date;

      // Role
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (earningInfo.role.toLowerCase().includes('lead')) {
        doc.setTextColor(37, 99, 235); // Blue
        doc.text('Lead', rX + 6, curY + 14);
      } else {
        doc.setTextColor(217, 119, 6); // Amber
        doc.text('Sub', rX + 6, curY + 14);
      }
      rX += colWidths.role;

      // Payout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105); // Emerald Green
      doc.text(`Rs. ${Number(earningInfo.earning || 0).toLocaleString('en-IN')}`, rX + colWidths.earning - 6, curY + 14, { align: 'right' });

      curY += rowHeight;
    });

    // 5. Total Row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, curY, contentWidth, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, curY, contentWidth, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    let totX = margin + colWidths.sno;
    doc.text(`TOTAL (${jobs.length} JOBS)`, totX + 6, curY + 14);
    totX += colWidths.code + colWidths.customer + colWidths.location + colWidths.service + colWidths.date + colWidths.role;

    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${totalStatementPayout.toLocaleString('en-IN')}`, totX + colWidths.earning - 6, curY + 14, { align: 'right' });

    // 6. Professional Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'SK Technology Official Statement • Computer-generated accounting record • Confidential',
      margin,
      pageHeight - 18
    );
    doc.text(
      `Page 1 of ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 18,
      { align: 'right' }
    );

    const safeName = (technician?.name || 'Tech').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`SK_Statement_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch (err) {
    console.error('Error exporting individual statement PDF:', err);
    return false;
  }
};
