import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * High-definition HTML-to-Canvas Certificate Generator
 * Uses pure HTML/CSS vector styling, Google Fonts, and gold gradient borders
 * then captures at 3x DPI for flawless A4 Landscape print & lamination.
 */
export const downloadRenderedCertificate = async ({
  tech,
  rank = 1,
  monthYear = 'NOVEMBER 2026',
  monthlyEarnings = 0,
  jobsCompleted = 0,
  adminName = 'SARAN KUMAR'
}) => {
  const rankMeta = {
    1: {
      awardBadge: 'STAR TECHNICIAN OF THE MONTH',
      subRank: 'FIRST PLACE - TOP EARNER & HIGHEST PERFORMANCE',
      rankTitle: 'RANK #1 (1st PLACE)',
      ribbonClass: 'from-amber-600 via-yellow-400 to-amber-600',
      badgeBg: '#D97706',
      badgeBorder: '#F59E0B',
      medalIcon: '🥇'
    },
    2: {
      awardBadge: 'OUTSTANDING TECHNICIAN OF THE MONTH',
      subRank: 'SECOND PLACE - 1st RUNNER UP PERFORMANCE',
      rankTitle: 'RANK #2 (2nd PLACE)',
      ribbonClass: 'from-slate-500 via-slate-300 to-slate-500',
      badgeBg: '#475569',
      badgeBorder: '#94A3B8',
      medalIcon: '🥈'
    },
    3: {
      awardBadge: 'EXCELLENCE IN SERVICE AWARD',
      subRank: 'THIRD PLACE - 2nd RUNNER UP PERFORMANCE',
      rankTitle: 'RANK #3 (3rd PLACE)',
      ribbonClass: 'from-amber-800 via-amber-600 to-amber-800',
      badgeBg: '#B45309',
      badgeBorder: '#D97706',
      medalIcon: '🥉'
    }
  };

  const meta = rankMeta[rank] || rankMeta[1];
  const techId = tech.id ? (tech.id.length > 8 ? tech.id.slice(-8) : tech.id) : 'TECH';
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const certId = `SK-CERT-${monthYear.replace(/\s+/g, '')}-${techId}-${rank}`;

  // Create isolated off-screen rendering element
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1122px'; // Standard A4 Landscape at 96 DPI base (scaled at 2.5x by html2canvas)
  container.style.height = '793px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';

  container.innerHTML = `
    <div style="
      width: 1122px; 
      height: 793px; 
      padding: 24px; 
      box-sizing: border-box; 
      background: radial-gradient(circle at center, #ffffff 0%, #faf8f5 100%);
      font-family: 'Cinzel', 'Playfair Display', 'Georgia', serif;
      position: relative;
      overflow: hidden;
    ">
      <!-- Outer Triple Border -->
      <div style="
        width: 100%; 
        height: 100%; 
        border: 4px solid #0f172a; 
        box-sizing: border-box; 
        padding: 6px; 
        position: relative;
      ">
        <div style="
          width: 100%; 
          height: 100%; 
          border: 2px solid #d4af37; 
          box-sizing: border-box; 
          padding: 8px; 
          position: relative;
        ">
          <div style="
            width: 100%; 
            height: 100%; 
            border: 1px solid #cbd5e1; 
            box-sizing: border-box; 
            padding: 30px 48px; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
            align-items: center;
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            position: relative;
          ">

            <!-- Corner Flourishes -->
            <div style="position: absolute; top: 6px; left: 6px; width: 24px; height: 24px; border-top: 3px solid #d4af37; border-left: 3px solid #d4af37;"></div>
            <div style="position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-top: 3px solid #d4af37; border-right: 3px solid #d4af37;"></div>
            <div style="position: absolute; bottom: 6px; left: 6px; width: 24px; height: 24px; border-bottom: 3px solid #d4af37; border-left: 3px solid #d4af37;"></div>
            <div style="position: absolute; bottom: 6px; right: 6px; width: 24px; height: 24px; border-bottom: 3px solid #d4af37; border-right: 3px solid #d4af37;"></div>

            <!-- Header Section -->
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 6px;">
                <img src="/logo.png" style="height: 52px; object-fit: contain;" onerror="this.style.display='none'" />
                <div style="text-align: left;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #0f172a; line-height: 1;">SK TECHNOLOGY</h1>
                  <p style="margin: 3px 0 0 0; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #b45309; text-transform: uppercase; font-family: sans-serif;">CCTV Solutions & Security Surveillance Systems</p>
                </div>
              </div>
              <div style="width: 280px; height: 2px; background: linear-gradient(to right, transparent, #d4af37, transparent); margin: 6px 0 14px 0;"></div>
            </div>

            <!-- Certificate Title -->
            <div>
              <div style="font-size: 34px; font-weight: 900; letter-spacing: 3px; color: #0f172a; text-transform: uppercase; margin: 0; line-height: 1.1;">
                Certificate of Excellence
              </div>
              <div style="margin-top: 6px; font-size: 13px; font-weight: 800; letter-spacing: 2.5px; color: #b45309; text-transform: uppercase; font-family: sans-serif;">
                ${meta.awardBadge}
              </div>
              <div style="margin-top: 14px; font-size: 12px; font-style: italic; color: #64748b; letter-spacing: 1px;">
                This certificate is proudly and officially conferred upon
              </div>
            </div>

            <!-- Recipient Name -->
            <div style="margin: 4px 0;">
              <div style="font-size: 36px; font-weight: 900; color: #0f172a; letter-spacing: 2px; text-transform: uppercase; line-height: 1.2;">
                ${(tech.name || 'Technician').toUpperCase()}
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px;">
                <div style="width: 60px; height: 1.5px; background: #d4af37;"></div>
                <div style="width: 6px; height: 6px; background: #d4af37; transform: rotate(45deg);"></div>
                <div style="width: 60px; height: 1.5px; background: #d4af37;"></div>
              </div>
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #475569; text-transform: uppercase; margin-top: 6px; font-family: sans-serif;">
                Employee ID: ${techId.toUpperCase()} &nbsp;&nbsp;|&nbsp;&nbsp; Specialization: ${(tech.specialization || 'Field Technician').toUpperCase()}
              </div>
            </div>

            <!-- Statement -->
            <div style="max-width: 820px; font-size: 12px; line-height: 1.6; color: #334155; font-family: 'Georgia', serif;">
              In sincere recognition and appreciation of outstanding dedication, impeccable discipline, and superior technical achievements during <strong>${monthYear.toUpperCase()}</strong>. For demonstrating extraordinary service reliability and securing <strong>Rank #${rank}</strong> across all field operations.
            </div>

            <!-- 3 Stat Metrics Strip -->
            <div style="display: flex; justify-content: center; gap: 20px; width: 100%; max-width: 680px; margin: 4px 0;">
              <!-- Box 1 -->
              <div style="flex: 1; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif;">Monthly Earnings</div>
                <div style="font-size: 20px; font-weight: 900; color: #059669; margin-top: 3px; font-family: sans-serif;">₹${Number(monthlyEarnings).toLocaleString('en-IN')}</div>
              </div>
              <!-- Box 2 (Center Rank) -->
              <div style="flex: 1.2; background: #fffdf5; border: 2px solid #d4af37; border-radius: 12px; padding: 10px 14px; box-shadow: 0 4px 12px rgba(212,175,55,0.12);">
                <div style="font-size: 9px; font-weight: 800; color: #b45309; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif;">Company Standing</div>
                <div style="font-size: 20px; font-weight: 900; color: #b45309; margin-top: 3px; font-family: sans-serif;">${meta.rankTitle}</div>
              </div>
              <!-- Box 3 -->
              <div style="flex: 1; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-family: sans-serif;">Jobs Completed</div>
                <div style="font-size: 20px; font-weight: 900; color: #2563eb; margin-top: 3px; font-family: sans-serif;">${jobsCompleted} Service Calls</div>
              </div>
            </div>

            <!-- Footer & Signatures -->
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px;">
              <!-- Left: Date -->
              <div style="width: 240px; text-align: center;">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${todayStr}</div>
                <div style="width: 180px; height: 1.5px; background: #94a3b8; margin: 0 auto 6px auto;"></div>
                <div style="font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: #64748b; text-transform: uppercase; font-family: sans-serif;">Date of Presentation</div>
              </div>

              <!-- Center: Official Golden Seal Stamp -->
              <div style="position: relative; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; margin-bottom: -6px;">
                <div style="
                  width: 78px; 
                  height: 78px; 
                  border-radius: 50%; 
                  background: radial-gradient(circle, #fde047 0%, #d97706 70%, #b45309 100%);
                  box-shadow: 0 4px 14px rgba(180, 83, 9, 0.35);
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  border: 2px dashed #ffffff;
                  color: #ffffff;
                  text-align: center;
                ">
                  <div style="font-size: 8px; font-weight: 900; letter-spacing: 1px; font-family: sans-serif;">SK TECH</div>
                  <div style="font-size: 10px; font-weight: 900; margin: 1px 0;">★ VERIFIED ★</div>
                  <div style="font-size: 7px; font-weight: 800; letter-spacing: 0.5px; font-family: sans-serif;">EXCELLENCE</div>
                </div>
              </div>

              <!-- Right: Admin Signature -->
              <div style="width: 240px; text-align: center;">
                <div style="font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: 1px; margin-bottom: 6px;">${adminName.toUpperCase()}</div>
                <div style="width: 180px; height: 1.5px; background: #94a3b8; margin: 0 auto 6px auto;"></div>
                <div style="font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: #64748b; text-transform: uppercase; font-family: sans-serif;">Managing Director / Admin</div>
                <div style="font-size: 8px; color: #94a3b8; margin-top: 2px; font-family: sans-serif;">SK Technology Head Office</div>
              </div>
            </div>

            <!-- Unique Verification Bar -->
            <div style="position: absolute; bottom: 8px; left: 0; right: 0; font-size: 7.5px; color: #94a3b8; font-family: sans-serif; letter-spacing: 1px;">
              CERTIFICATE ID: ${certId} &nbsp;&nbsp;•&nbsp;&nbsp; AUTHENTICATED BY SK TECHNOLOGY ADMINISTRATION &nbsp;&nbsp;•&nbsp;&nbsp; READY FOR COLOR PRINT & LAMINATION
            </div>

          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2.5, // 2.5x high-res rendering (crisp vector look)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const cleanTechName = tech.name ? tech.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Technician';
    const filename = `Certificate_Rank${rank}_${cleanTechName}_${monthYear.replace(/\s+/g, '_')}.pdf`;
    pdf.save(filename);

    return filename;
  } finally {
    document.body.removeChild(container);
  }
};
