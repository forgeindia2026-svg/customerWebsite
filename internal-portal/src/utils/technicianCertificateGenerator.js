import jsPDF from 'jspdf';

/**
 * Loads an image from URL or path and converts to Base64 Data URL.
 * Falls back gracefully if loading fails.
 */
export const loadImageAsBase64 = async (url) => {
  if (!url) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (_) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch (_) {
      resolve(null);
    }
  });
};

/**
 * Generate A4 Landscape Certificate of Excellence & Performance
 * Designed specifically for High-Quality Color Printing & Lamination.
 *
 * @param {Object} params
 * @param {Object} params.tech - Technician Object
 * @param {number} params.rank - 1, 2, or 3
 * @param {string} params.monthYear - e.g. "NOVEMBER 2026"
 * @param {number} params.monthlyEarnings - Amount earned in the month
 * @param {number} params.jobsCompleted - Number of completed jobs
 * @param {string} params.adminName - Name of the awarding Admin
 * @param {string} [params.logoBase64] - Preloaded logo data URL
 * @param {string} [params.techAvatarBase64] - Preloaded avatar data URL
 */
export const generateTechnicianCertificate = async ({
  tech,
  rank = 1,
  monthYear = 'NOVEMBER 2026',
  monthlyEarnings = 0,
  jobsCompleted = 0,
  adminName = 'SARAN KUMAR',
  logoBase64 = null,
  techAvatarBase64 = null
}) => {
  // A4 Landscape: 841.89 pt x 595.28 pt (~297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compress: true
  });

  const W = doc.internal.pageSize.getWidth();   // 841.89
  const H = doc.internal.pageSize.getHeight();  // 595.28

  // Rank Palette & Titles
  const rankConfig = {
    1: {
      title: 'STAR TECHNICIAN OF THE MONTH',
      subtitle: 'FIRST PLACE - TOP EARNER & HIGHEST PERFORMANCE',
      badge: '1st PLACE',
      primaryRgb: [180, 83, 9],       // Amber-700 / Rich Gold
      accentRgb: [245, 158, 11],      // Amber-500
      lightBgRgb: [254, 252, 232],    // Amber-50
      medal: 'GOLD MEDALIST'
    },
    2: {
      title: 'OUTSTANDING TECHNICIAN OF THE MONTH',
      subtitle: 'SECOND PLACE - 1st RUNNER UP PERFORMANCE',
      badge: '2nd PLACE',
      primaryRgb: [71, 85, 105],      // Slate-600 / Silver Steel
      accentRgb: [148, 163, 184],     // Slate-400
      lightBgRgb: [248, 250, 252],    // Slate-50
      medal: 'SILVER MEDALIST'
    },
    3: {
      title: 'EXCELLENCE IN SERVICE AWARD',
      subtitle: 'THIRD PLACE - 2nd RUNNER UP PERFORMANCE',
      badge: '3rd PLACE',
      primaryRgb: [180, 83, 9],       // Bronze Warm Amber/Brown
      accentRgb: [217, 119, 6],      // Amber-600
      lightBgRgb: [255, 251, 235],    // Amber-50
      medal: 'BRONZE MEDALIST'
    }
  };

  const cfg = rankConfig[rank] || rankConfig[1];

  // 1. Clean Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Subtle Outer Margin / Guilloche Base
  const m1 = 18;
  const m2 = 24;
  const m3 = 30;

  // Outer Deep Navy Border
  doc.setDrawColor(30, 41, 59); // Slate-800
  doc.setLineWidth(3);
  doc.rect(m1, m1, W - m1 * 2, H - m1 * 2, 'S');

  // Middle Gold / Metallic Accent Border
  doc.setDrawColor(cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2]);
  doc.setLineWidth(1.5);
  doc.rect(m2, m2, W - m2 * 2, H - m2 * 2, 'S');

  // Inner Thin Hairline Border
  doc.setDrawColor(148, 163, 184); // Slate-400
  doc.setLineWidth(0.5);
  doc.rect(m3, m3, W - m3 * 2, H - m3 * 3, 'S');

  // Corner Floral / Geometric Accents
  const drawCorner = (x, y, dx, dy) => {
    doc.setFillColor(cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2]);
    doc.rect(x, y, dx * 16, dy * 3, 'F');
    doc.rect(x, y, dx * 3, dy * 16, 'F');
  };
  drawCorner(m2 + 2, m2 + 2, 1, 1);
  drawCorner(W - m2 - 2, m2 + 2, -1, 1);
  drawCorner(m2 + 2, H - m2 - 2, 1, -1);
  drawCorner(W - m2 - 2, H - m2 - 2, -1, -1);

  // 2. Company Logo & Brand Header
  const centerX = W / 2;
  let curY = 56;

  if (logoBase64) {
    try {
      // 100 x 40 aspect
      doc.addImage(logoBase64, 'PNG', centerX - 55, curY - 14, 110, 42);
      curY += 34;
    } catch (_) {
      // Fallback text logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text('SK TECHNOLOGY', centerX, curY, { align: 'center' });
      curY += 16;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('SK TECHNOLOGY', centerX, curY, { align: 'center' });
    curY += 16;
  }

  // Company Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cfg.primaryRgb[0], cfg.primaryRgb[1], cfg.primaryRgb[2]);
  doc.text('PREMIUM CCTV SECURITY & SURVEILLANCE SOLUTIONS', centerX, curY, { align: 'center' });
  curY += 8;

  // Thin Decorative Separator
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(1);
  doc.line(centerX - 140, curY, centerX + 140, curY);

  // Diamond Center
  doc.setFillColor(cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2]);
  doc.rect(centerX - 4, curY - 3, 8, 6, 'F');
  curY += 28;

  // 3. Certificate Main Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(30, 41, 59);
  doc.text('CERTIFICATE OF EXCELLENCE', centerX, curY, { align: 'center' });
  curY += 16;

  // Sub-title Award Category
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(cfg.primaryRgb[0], cfg.primaryRgb[1], cfg.primaryRgb[2]);
  doc.text(cfg.title, centerX, curY, { align: 'center' });
  curY += 18;

  // "PROUDLY PRESENTED TO"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', centerX, curY, { align: 'center' });
  curY += 28;

  // 4. Technician Name (Prominent & Elegant)
  const techName = (tech.name || 'Technician').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(techName, centerX, curY, { align: 'center' });
  curY += 8;

  // Underline beneath Technician Name
  const nameWidth = Math.max(doc.getTextWidth(techName) + 40, 240);
  doc.setDrawColor(cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2]);
  doc.setLineWidth(2);
  doc.line(centerX - nameWidth / 2, curY, centerX + nameWidth / 2, curY);
  curY += 14;

  // Technician ID & Specialization
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const techId = tech.id ? (tech.id.length > 10 ? tech.id.slice(-8) : tech.id) : 'TECH';
  const techRole = tech.specialization || 'Certified Field Technician';
  doc.text(`EMPLOYEE ID: ${techId.toUpperCase()}   |   SPECIALIZATION: ${techRole.toUpperCase()}`, centerX, curY, { align: 'center' });
  curY += 22;

  // 5. Commendation Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85); // Slate-700
  const statement = `In sincere appreciation and recognition of outstanding dedication, exceptional work ethics,`;
  const statement2 = `and superior field performance during ${monthYear.toUpperCase()}. Having secured Rank #${rank} among all company technicians.`;
  doc.text(statement, centerX, curY, { align: 'center' });
  curY += 14;
  doc.text(statement2, centerX, curY, { align: 'center' });
  curY += 24;

  // 6. Highlight Performance Metric Badges (3 Box Strip)
  const boxW = 140;
  const boxH = 46;
  const gap = 18;
  const totalStripW = boxW * 3 + gap * 2;
  const startX = centerX - totalStripW / 2;

  // Metric 1: Monthly Earning
  const m1X = startX;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m1X, curY, boxW, boxH, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(m1X, curY, boxW, boxH, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MONTHLY EARNINGS', m1X + boxW / 2, curY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.text(`Rs. ${Number(monthlyEarnings).toLocaleString('en-IN')}`, m1X + boxW / 2, curY + 34, { align: 'center' });

  // Metric 2: Rank Award
  const m2X = startX + boxW + gap;
  doc.setFillColor(cfg.lightBgRgb[0], cfg.lightBgRgb[1], cfg.lightBgRgb[2]);
  doc.roundedRect(m2X, curY, boxW, boxH, 6, 6, 'F');
  doc.setDrawColor(cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2]);
  doc.roundedRect(m2X, curY, boxW, boxH, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cfg.primaryRgb[0], cfg.primaryRgb[1], cfg.primaryRgb[2]);
  doc.text('COMPANY RANK', m2X + boxW / 2, curY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`RANK #${rank} (${cfg.badge})`, m2X + boxW / 2, curY + 34, { align: 'center' });

  // Metric 3: Jobs / Efficiency
  const m3X = startX + (boxW + gap) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m3X, curY, boxW, boxH, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(m3X, curY, boxW, boxH, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('COMPLETED JOBS', m3X + boxW / 2, curY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text(`${jobsCompleted} Successful`, m3X + boxW / 2, curY + 34, { align: 'center' });

  curY += boxH + 34;

  // 7. Golden Stamp Seal (Center-Bottom)
  const sealX = centerX;
  const sealY = curY + 22;
  doc.setFillColor(cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2]);
  doc.circle(sealX, sealY, 26, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  doc.circle(sealX, sealY, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SK TECH', sealX, sealY - 4, { align: 'center' });
  doc.setFontSize(8);
  doc.text('★ VERIFIED ★', sealX, sealY + 6, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('OFFICIAL SEAL', sealX, sealY + 14, { align: 'center' });

  // 8. Signatures Section (Left: Date & Verified, Right: Admin Signature)
  const sigLineY = curY + 36;
  const sigLeftX = 140;
  const sigRightX = W - 140;

  // Left Signatory (Date of Issue)
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(todayStr, sigLeftX, sigLineY - 6, { align: 'center' });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  doc.line(sigLeftX - 70, sigLineY, sigLeftX + 70, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE OF PRESENTATION', sigLeftX, sigLineY + 12, { align: 'center' });

  // Right Signatory (Managing Director / Admin)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(adminName.toUpperCase(), sigRightX, sigLineY - 6, { align: 'center' });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  doc.line(sigRightX - 80, sigLineY, sigRightX + 80, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MANAGING DIRECTOR / ADMIN', sigRightX, sigLineY + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('SK Technology Head Office', sigRightX, sigLineY + 22, { align: 'center' });

  // 9. Bottom Footer Certificate Identification Number
  const certId = `SK-CERT-${monthYear.replace(/\s+/g, '')}-${techId}-${rank}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Official Certificate ID: ${certId}  •  Protected by SK Technology Security Systems Administration  •  Lamination & Framing Ready`, centerX, H - 24, { align: 'center' });

  // Save PDF
  const cleanTechName = tech.name ? tech.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Technician';
  const filename = `Certificate_Rank${rank}_${cleanTechName}_${monthYear.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);

  return filename;
};

/**
 * Bulk Generate Certificates for All Top 3 Technicians in one go
 */
export const bulkDownloadTop3Certificates = async ({
  top3 = [],
  monthYear = 'NOVEMBER 2026',
  adminName = 'SARAN KUMAR',
  logoBase64 = null
}) => {
  if (!top3 || top3.length === 0) return;

  for (let i = 0; i < top3.length; i++) {
    const item = top3[i];
    await generateTechnicianCertificate({
      tech: item.tech,
      rank: item.rank || (i + 1),
      monthYear,
      monthlyEarnings: item.monthlyEarnings,
      jobsCompleted: item.jobsCompleted,
      adminName,
      logoBase64
    });
  }
};
