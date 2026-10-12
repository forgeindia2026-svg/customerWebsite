import jsPDF from 'jspdf';

/**
 * Generates an executive-level PDF report summarizing all technicians'
 * completed jobs and earnings for the current month and lifetime.
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

    // 1. Header Dark Banner (Slate-900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 90, 'F');

    // Accent line (Emerald-500)
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 90, pageWidth, 3, 'F');

    // Title & Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('SK TECHNOLOGY', margin, 40);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153); // Emerald-400
    doc.text('OFFICIAL TECHNICIAN PERFORMANCE & PAYOUT REPORT', margin, 58);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    const nowStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    doc.text(`Period: ${monthLabel}  •  Generated: ${nowStr}  •  By: ${generatedBy}`, margin, 74);

    // 2. High-level Summary KPI Cards
    const totalMonthJobs = technicians.reduce((sum, t) => sum + (t.monthCompletedCount || 0), 0);
    const totalMonthEarnings = technicians.reduce((sum, t) => sum + (t.monthlyEarnings || 0), 0);
    const totalLifetimeJobs = technicians.reduce((sum, t) => sum + (t.totalCompleted || 0), 0);
    const totalLifetimeEarnings = technicians.reduce((sum, t) => sum + (t.totalEarnings || 0), 0);

    const kpiY = 110;
    const kpiHeight = 52;
    const kpiGap = 10;
    const kpiWidth = (contentWidth - kpiGap * 3) / 4;

    const kpis = [
      { label: 'ACTIVE CREW', val: `${technicians.length} Technicians`, color: [241, 245, 249], text: [15, 23, 42] },
      { label: `${monthLabel.toUpperCase()} JOBS`, val: `${totalMonthJobs} Completed`, color: [238, 242, 255], text: [79, 70, 229] },
      { label: `${monthLabel.toUpperCase()} PAYOUT`, val: `Rs. ${totalMonthEarnings.toLocaleString('en-IN')}`, color: [236, 253, 245], text: [5, 150, 105] },
      { label: 'LIFETIME PAYOUT', val: `Rs. ${totalLifetimeEarnings.toLocaleString('en-IN')}`, color: [248, 250, 252], text: [30, 41, 59] }
    ];

    kpis.forEach((kpi, idx) => {
      const kX = margin + idx * (kpiWidth + kpiGap);
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.roundedRect(kX, kpiY, kpiWidth, kpiHeight, 6, 6, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(kX, kpiY, kpiWidth, kpiHeight, 6, 6, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, kX + 10, kpiY + 18);

      doc.setFontSize(11);
      doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
      doc.text(kpi.val, kX + 10, kpiY + 38);
    });

    // 3. Performance Table
    const tableStartY = 180;
    const rowHeight = 24;
    const colWidths = {
      sno: 28,
      name: 160,
      monthJobs: 75,
      monthEarn: 85,
      lifeJobs: 80,
      lifeEarn: 95
    };

    // Table Header Row
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, tableStartY, contentWidth, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    doc.text('#', curX + 8, tableStartY + 16);
    curX += colWidths.sno;

    doc.text('TECHNICIAN NAME', curX + 8, tableStartY + 16);
    curX += colWidths.name;

    doc.text('MONTH JOBS', curX + colWidths.monthJobs - 8, tableStartY + 16, { align: 'right' });
    curX += colWidths.monthJobs;

    doc.text('MONTH PAYOUT', curX + colWidths.monthEarn - 8, tableStartY + 16, { align: 'right' });
    curX += colWidths.monthEarn;

    doc.text('LIFETIME JOBS', curX + colWidths.lifeJobs - 8, tableStartY + 16, { align: 'right' });
    curX += colWidths.lifeJobs;

    doc.text('LIFETIME PAYOUT', curX + colWidths.lifeEarn - 8, tableStartY + 16, { align: 'right' });

    // Table Data Rows
    let curY = tableStartY + 26;

    technicians.forEach((t, i) => {
      // Check page break
      if (curY + rowHeight > pageHeight - 60) {
        doc.addPage();
        curY = 40;
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
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);

      let rX = margin;
      doc.text(String(i + 1), rX + 8, curY + 16);
      rX += colWidths.sno;

      // Name & Role
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(t.name || 'Technician', rX + 8, curY + 16);
      rX += colWidths.name;

      // Month Jobs
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text(String(t.monthCompletedCount || 0), rX + colWidths.monthJobs - 8, curY + 16, { align: 'right' });
      rX += colWidths.monthJobs;

      // Month Earnings
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105); // Emerald
      doc.text(`Rs. ${(t.monthlyEarnings || 0).toLocaleString('en-IN')}`, rX + colWidths.monthEarn - 8, curY + 16, { align: 'right' });
      rX += colWidths.monthEarn;

      // Lifetime Jobs
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(String(t.totalCompleted || 0), rX + colWidths.lifeJobs - 8, curY + 16, { align: 'right' });
      rX += colWidths.lifeJobs;

      // Lifetime Earnings
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(t.totalEarnings || 0).toLocaleString('en-IN')}`, rX + colWidths.lifeEarn - 8, curY + 16, { align: 'right' });

      curY += rowHeight;
    });

    // 4. Totals Row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, curY, contentWidth, 26, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, curY, contentWidth, 26, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    let tX = margin + colWidths.sno;
    doc.text('TOTAL SUMMARY', tX + 8, curY + 16);
    tX += colWidths.name;

    doc.setTextColor(79, 70, 229);
    doc.text(String(totalMonthJobs), tX + colWidths.monthJobs - 8, curY + 16, { align: 'right' });
    tX += colWidths.monthJobs;

    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${totalMonthEarnings.toLocaleString('en-IN')}`, tX + colWidths.monthEarn - 8, curY + 16, { align: 'right' });
    tX += colWidths.monthEarn;

    doc.setTextColor(15, 23, 42);
    doc.text(String(totalLifetimeJobs), tX + colWidths.lifeJobs - 8, curY + 16, { align: 'right' });
    tX += colWidths.lifeJobs;

    doc.text(`Rs. ${totalLifetimeEarnings.toLocaleString('en-IN')}`, tX + colWidths.lifeEarn - 8, curY + 16, { align: 'right' });

    // 5. Page Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'SK Technology System Document • Strictly for internal administrative and accounting records.',
      margin,
      pageHeight - 24
    );
    doc.text(
      `Page 1 of ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      pageHeight - 24,
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
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // Header Dark Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 95, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 95, pageWidth, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('SK TECHNOLOGY', margin, 38);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153);
    doc.text('TECHNICIAN EARNINGS & WORK STATEMENT', margin, 56);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const nowStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    doc.text(`Technician: ${technician?.name || 'Technician'}  •  Statement Date: ${nowStr}`, margin, 74);

    // Profile & Summary Cards
    const kpiY = 115;
    const kpiHeight = 54;
    const kpiGap = 10;
    const kpiWidth = (contentWidth - kpiGap * 2) / 3;

    const cards = [
      { label: 'THIS MONTH EARNINGS', val: `Rs. ${thisMonthTotal.toLocaleString('en-IN')}`, sub: `${thisMonthCompletedCount} completed jobs this month`, bg: [238, 242, 255], txt: [79, 70, 229] },
      { label: 'LIFETIME TOTAL EARNINGS', val: `Rs. ${allTimeTotal.toLocaleString('en-IN')}`, sub: `${completedCount} all-time completed jobs`, bg: [236, 253, 245], txt: [5, 150, 105] },
      { label: 'MONTH COMPLETED JOBS', val: `${thisMonthCompletedCount} Jobs`, sub: `${completedCount} jobs total sign-off`, bg: [248, 250, 252], txt: [15, 23, 42] }
    ];

    cards.forEach((c, idx) => {
      const cX = margin + idx * (kpiWidth + kpiGap);
      doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      doc.roundedRect(cX, kpiY, kpiWidth, kpiHeight, 6, 6, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cX, kpiY, kpiWidth, kpiHeight, 6, 6, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cX + 10, kpiY + 16);

      doc.setFontSize(11);
      doc.setTextColor(c.txt[0], c.txt[1], c.txt[2]);
      doc.text(c.val, cX + 10, kpiY + 34);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(c.sub, cX + 10, kpiY + 46);
    });

    // Jobs Table Header
    const tableStartY = 188;
    const rowHeight = 22;
    const colWidths = {
      code: 95,
      customer: 145,
      date: 85,
      role: 110,
      earning: 88
    };

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, tableStartY, contentWidth, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    doc.text('JOB CODE', curX + 8, tableStartY + 15);
    curX += colWidths.code;
    doc.text('CUSTOMER / TITLE', curX + 8, tableStartY + 15);
    curX += colWidths.customer;
    doc.text('DATE', curX + 8, tableStartY + 15);
    curX += colWidths.date;
    doc.text('ASSIGNED ROLE', curX + 8, tableStartY + 15);
    curX += colWidths.role;
    doc.text('PAYOUT', curX + colWidths.earning - 8, tableStartY + 15, { align: 'right' });

    let curY = tableStartY + 24;

    jobs.forEach((j, i) => {
      if (curY + rowHeight > pageHeight - 50) {
        doc.addPage();
        curY = 40;
      }

      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, curY, contentWidth, rowHeight, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, curY + rowHeight, margin + contentWidth, curY + rowHeight);

      const earningInfo = getJobEarningDetails(j);
      const dStr = (j.scheduledDate || j.date || (j.dailyReports && j.dailyReports[0]?.date) || j.createdAt || '').toString().slice(0, 10);

      doc.setFontSize(8);
      let rX = margin;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(j.jobCode || 'SK-JOB', rX + 8, curY + 14);
      rX += colWidths.code;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const custName = (j.customer?.name || j.title || 'Client Service').substring(0, 22);
      doc.text(custName, rX + 8, curY + 14);
      rX += colWidths.customer;

      doc.setTextColor(100, 116, 139);
      doc.text(dStr || 'N/A', rX + 8, curY + 14);
      rX += colWidths.date;

      doc.setFont('helvetica', 'bold');
      if (earningInfo.role.includes('Lead')) {
        doc.setTextColor(79, 70, 229);
      } else {
        doc.setTextColor(180, 83, 9);
      }
      doc.text(earningInfo.role || 'Technician', rX + 8, curY + 14);
      rX += colWidths.role;

      doc.setTextColor(5, 150, 105);
      doc.text(`Rs. ${earningInfo.earning.toLocaleString('en-IN')}`, rX + colWidths.earning - 8, curY + 14, { align: 'right' });

      curY += rowHeight;
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SK Technology Official Record • Confidential Statement', margin, pageHeight - 20);

    const safeName = (technician?.name || 'Tech').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`SK_Statement_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  } catch (err) {
    console.error('Error exporting individual statement PDF:', err);
    return false;
  }
};
