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
 * Designed with a Luxury Gold & Royal Blue Guilloche Aesthetic, 
 * matching premium corporate award / recognition diplomas.
 */
export const generateTechnicianCertificate = async ({
  tech,
  rank = 1,
  monthYear = 'NOVEMBER 2026',
  monthlyEarnings = 0,
  jobsCompleted = 0,
  adminName = 'SARAN KUMAR',
  logoBase64 = null
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
  const centerX = W / 2;

  // Rank Palette & Titles
  const rankConfig = {
    1: {
      awardBadge: 'STAR TECHNICIAN OF THE MONTH',
      subRank: 'FIRST PLACE - TOP EARNER & HIGHEST PERFORMANCE',
      rankTitle: 'RANK #1 (1st PLACE)',
      medalBadge: '1st PLACE',
      goldPrimary: [212, 160, 23],    // #D4A017 Metallic Rich Gold
      goldDark: [161, 114, 10],       // #A1720A
      goldLight: [254, 250, 235],     // Light Golden Sheen
      navy: [15, 23, 42],             // Slate-900 / Midnight Navy
      royalBlue: [30, 58, 138]        // Blue-900
    },
    2: {
      awardBadge: 'OUTSTANDING TECHNICIAN OF THE MONTH',
      subRank: 'SECOND PLACE - 1st RUNNER UP PERFORMANCE',
      rankTitle: 'RANK #2 (2nd PLACE)',
      medalBadge: '2nd PLACE',
      goldPrimary: [148, 163, 184],   // Silver Chrome
      goldDark: [71, 85, 105],        // Deep Steel
      goldLight: [248, 250, 252],
      navy: [15, 23, 42],
      royalBlue: [51, 65, 85]
    },
    3: {
      awardBadge: 'EXCELLENCE IN SERVICE AWARD',
      subRank: 'THIRD PLACE - 2nd RUNNER UP PERFORMANCE',
      rankTitle: 'RANK #3 (3rd PLACE)',
      medalBadge: '3rd PLACE',
      goldPrimary: [194, 112, 38],    // Polished Bronze
      goldDark: [146, 64, 14],
      goldLight: [255, 251, 235],
      navy: [15, 23, 42],
      royalBlue: [120, 53, 15]
    }
  };

  const cfg = rankConfig[rank] || rankConfig[1];

  // 1. Soft Parchment / Clean White Background
  doc.setFillColor(254, 254, 254);
  doc.rect(0, 0, W, H, 'F');

  // Subtle Vintage Texture Layer (Subtle warm tint)
  doc.setFillColor(255, 253, 248);
  doc.rect(20, 20, W - 40, H - 40, 'F');

  // ─────────────────────────────────────────────────────────────
  // 2. LUXURY MULTI-TIER BORDER SUITE (ROYAL GOLD & MIDNIGHT NAVY)
  // ─────────────────────────────────────────────────────────────
  // Outer Border 1: Deep Navy
  doc.setDrawColor(15, 23, 42); // Midnight Navy
  doc.setLineWidth(4);
  doc.rect(20, 20, W - 40, H - 40, 'S');

  // Outer Border 2: Gold Ribbon Inset
  doc.setDrawColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
  doc.setLineWidth(1.5);
  doc.rect(25, 25, W - 50, H - 50, 'S');

  // Inner Border 3: Hairline with Corner Rosettes
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.75);
  doc.rect(32, 32, W - 64, H - 64, 'S');

  // Decorative Corner Flourishes
  const drawCornerFlourish = (cx, cy, dirX, dirY) => {
    doc.setFillColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
    // Corner Box
    doc.rect(cx, cy, dirX * 16, dirY * 3, 'F');
    doc.rect(cx, cy, dirX * 3, dirY * 16, 'F');
    // Inner Accent Dot
    doc.circle(cx + dirX * 10, cy + dirY * 10, 2.5, 'F');
  };
  drawCornerFlourish(27, 27, 1, 1);
  drawCornerFlourish(W - 27, 27, -1, 1);
  drawCornerFlourish(27, H - 27, 1, -1);
  drawCornerFlourish(W - 27, H - 27, -1, -1);

  // ─────────────────────────────────────────────────────────────
  // 3. TOP COMPANY HEADER & LOGO
  // ─────────────────────────────────────────────────────────────
  let curY = 52;

  if (logoBase64) {
    try {
      // 130 x 44 Proportional Logo Banner
      doc.addImage(logoBase64, 'PNG', centerX - 65, curY - 14, 130, 44);
      curY += 38;
    } catch (_) {
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.text('SK TECHNOLOGY', centerX, curY, { align: 'center' });
      curY += 20;
    }
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(15, 23, 42);
    doc.text('SK TECHNOLOGY', centerX, curY, { align: 'center' });
    curY += 20;
  }

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cfg.goldDark[0], cfg.goldDark[1], cfg.goldDark[2]);
  doc.text('PREMIUM CCTV SECURITY & SURVEILLANCE SOLUTIONS', centerX, curY, { align: 'center' });
  curY += 8;

  // Thin Decorative Golden Divider with Center Emblem
  doc.setDrawColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
  doc.setLineWidth(1);
  doc.line(centerX - 130, curY, centerX - 12, curY);
  doc.line(centerX + 12, curY, centerX + 130, curY);

  // Center Mini Diamond
  doc.setFillColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
  doc.rect(centerX - 4, curY - 3, 8, 6, 'F');
  curY += 30;

  // ─────────────────────────────────────────────────────────────
  // 4. MAIN CERTIFICATE TITLE (SERIF LUXURY DIPLOMA FONT)
  // ─────────────────────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(15, 23, 42); // Midnight Navy
  doc.text('CERTIFICATE OF EXCELLENCE', centerX, curY, { align: 'center' });
  curY += 18;

  // Award Title (Gold / Star Performer)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(cfg.goldDark[0], cfg.goldDark[1], cfg.goldDark[2]);
  doc.text(cfg.awardBadge, centerX, curY, { align: 'center' });
  curY += 18;

  // "THIS CERTIFICATE IS PROUDLY PRESENTED TO"
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', centerX, curY, { align: 'center' });
  curY += 32;

  // ─────────────────────────────────────────────────────────────
  // 5. TECHNICIAN NAME (LARGE, MAJESTIC, TIMELESS)
  // ─────────────────────────────────────────────────────────────
  const techName = (tech.name || 'Technician').toUpperCase();
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42); // Midnight Slate
  doc.text(techName, centerX, curY, { align: 'center' });
  curY += 8;

  // Double Underline Accent
  const nameWidth = Math.max(doc.getTextWidth(techName) + 60, 260);
  doc.setDrawColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
  doc.setLineWidth(1.5);
  doc.line(centerX - nameWidth / 2, curY, centerX + nameWidth / 2, curY);
  doc.setLineWidth(0.5);
  doc.line(centerX - nameWidth / 2 + 15, curY + 3, centerX + nameWidth / 2 - 15, curY + 3);
  curY += 16;

  // Technician ID & Role
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const techId = tech.id ? (tech.id.length > 10 ? tech.id.slice(-8) : tech.id) : 'TECH';
  const techRole = tech.specialization || 'Certified Field Technician';
  doc.text(`EMPLOYEE ID: ${techId.toUpperCase()}    |    SPECIALIZATION: ${techRole.toUpperCase()}`, centerX, curY, { align: 'center' });
  curY += 20;

  // ─────────────────────────────────────────────────────────────
  // 6. OFFICIAL COMMENDATION STATEMENT
  // ─────────────────────────────────────────────────────────────
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  const line1 = `In sincere appreciation and recognition of outstanding dedication, exceptional work ethics,`;
  const line2 = `and superior field performance during ${monthYear.toUpperCase()}. Having secured Rank #${rank} among all company technicians.`;
  doc.text(line1, centerX, curY, { align: 'center' });
  curY += 14;
  doc.text(line2, centerX, curY, { align: 'center' });
  curY += 24;

  // ─────────────────────────────────────────────────────────────
  // 7. PERFORMANCE BADGES STRIP (EXACT CAROUSEL REPUTATION)
  // ─────────────────────────────────────────────────────────────
  const boxW = 160;
  const boxH = 50;
  const gap = 20;
  const totalStripW = boxW * 3 + gap * 2;
  const startX = centerX - totalStripW / 2;

  // Box 1: Monthly Earnings
  const b1X = startX;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(b1X, curY, boxW, boxH, 8, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(b1X, curY, boxW, boxH, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('MONTHLY EARNINGS', b1X + boxW / 2, curY + 17, { align: 'center' });
  doc.setFont('helvetica', 'black');
  doc.setFontSize(15);
  doc.setTextColor(16, 185, 129); // Emerald-600
  doc.text(`Rs. ${Number(monthlyEarnings).toLocaleString('en-IN')}`, b1X + boxW / 2, curY + 36, { align: 'center' });

  // Box 2: Center Highlight (Company Rank with Golden Border)
  const b2X = startX + boxW + gap;
  doc.setFillColor(cfg.goldLight[0], cfg.goldLight[1], cfg.goldLight[2]);
  doc.roundedRect(b2X, curY, boxW, boxH, 8, 8, 'F');
  doc.setDrawColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
  doc.setLineWidth(2);
  doc.roundedRect(b2X, curY, boxW, boxH, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cfg.goldDark[0], cfg.goldDark[1], cfg.goldDark[2]);
  doc.text('COMPANY RANK', b2X + boxW / 2, curY + 17, { align: 'center' });
  doc.setFont('helvetica', 'black');
  doc.setFontSize(14.5);
  doc.setTextColor(cfg.goldDark[0], cfg.goldDark[1], cfg.goldDark[2]);
  doc.text(cfg.rankTitle, b2X + boxW / 2, curY + 36, { align: 'center' });

  // Box 3: Completed Jobs
  const b3X = startX + (boxW + gap) * 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(b3X, curY, boxW, boxH, 8, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(b3X, curY, boxW, boxH, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('COMPLETED JOBS', b3X + boxW / 2, curY + 17, { align: 'center' });
  doc.setFont('helvetica', 'black');
  doc.setFontSize(15);
  doc.setTextColor(37, 99, 235); // Royal Blue
  doc.text(`${jobsCompleted} Successful`, b3X + boxW / 2, curY + 36, { align: 'center' });

  curY += boxH + 30;

  // ─────────────────────────────────────────────────────────────
  // 8. LUXURY EMBOSSED GOLD MEDAL SEAL (CENTER-BOTTOM)
  // ─────────────────────────────────────────────────────────────
  const sealX = centerX;
  const sealY = curY + 28;

  // Outer Gold Sunburst Ray Ring
  doc.setFillColor(cfg.goldPrimary[0], cfg.goldPrimary[1], cfg.goldPrimary[2]);
  doc.circle(sealX, sealY, 28, 'F');

  // Inner Gold Border Ring
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.5);
  doc.circle(sealX, sealY, 24, 'S');

  // Second Inner Border Ring
  doc.setDrawColor(cfg.goldDark[0], cfg.goldDark[1], cfg.goldDark[2]);
  doc.setLineWidth(0.75);
  doc.circle(sealX, sealY, 21, 'S');

  // Seal Typography
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SK TECH', sealX, sealY - 6, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('★ VERIFIED ★', sealX, sealY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('OFFICIAL SEAL', sealX, sealY + 13, { align: 'center' });

  // Two Hanging Silk Ribbons from Seal
  doc.setFillColor(cfg.goldDark[0], cfg.goldDark[1], cfg.goldDark[2]);
  // Left Ribbon
  doc.triangle(sealX - 12, sealY + 24, sealX - 22, sealY + 48, sealX - 8, sealY + 44, 'F');
  // Right Ribbon
  doc.triangle(sealX + 12, sealY + 24, sealX + 8, sealY + 44, sealX + 22, sealY + 48, 'F');

  // ─────────────────────────────────────────────────────────────
  // 9. SIGNATURES & VERIFICATION (ELEGANT CORPORATE COLUMNS)
  // ─────────────────────────────────────────────────────────────
  const sigLineY = curY + 40;
  const sigLeftX = 150;
  const sigRightX = W - 150;

  // Left Signatory (Date of Issue)
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(todayStr, sigLeftX, sigLineY - 8, { align: 'center' });
  doc.setDrawColor(148, 163, 184); // Slate-400
  doc.setLineWidth(1);
  doc.line(sigLeftX - 75, sigLineY, sigLeftX + 75, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE OF PRESENTATION', sigLeftX, sigLineY + 12, { align: 'center' });

  // Right Signatory (Managing Director / Admin)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(adminName.toUpperCase(), sigRightX, sigLineY - 8, { align: 'center' });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  doc.line(sigRightX - 85, sigLineY, sigRightX + 85, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MANAGING DIRECTOR / ADMIN', sigRightX, sigLineY + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('SK Technology Head Office', sigRightX, sigLineY + 22, { align: 'center' });

  // 10. Bottom Footer Identification Line
  const certId = `SK-CERT-${monthYear.replace(/\s+/g, '')}-${techId}-${rank}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Official Certificate ID: ${certId}  •  Authenticated by SK Technology Security Systems Administration  •  Lamination & Framing Ready`, centerX, H - 22, { align: 'center' });

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
