/**
 * Universal Technician Name Matcher
 */
export const isTechNameMatch = (name1, name2) => {
  if (!name1 || !name2) return false;
  const a = String(name1).toLowerCase().trim();
  const b = String(name2).toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aClean = a.replace(/[\.\s_]/g, '');
  const bClean = b.replace(/[\.\s_]/g, '');
  if (aClean === bClean) return true;
  if (aClean.length >= 4 && bClean.length >= 4 && (aClean.includes(bClean) || bClean.includes(aClean))) return true;
  return false;
};

/**
 * Universal Technician Monthly & Total Earnings Calculator
 * Evaluates lead technicians and sub-technicians across approved / completed orders
 */
export const buildTechSummaries = (itemsList) => {
  const now = new Date();
  let istMonth = '';
  try {
    istMonth = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now).substring(0, 7);
  } catch (_) {
    istMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const map = {};
  const jobsByTech = {};

  (itemsList || []).forEach((j) => {
    // 1. Status Filter: Only Approved, Completed, or Delivered
    const st = String(j.orderStatus || j.status || j.jobStatus || '').trim().toLowerCase();
    if (st === 'cancelled' || st === 'pending' || st === 'in progress') return;
    const isFinished = st === 'approved' || st === 'completed' || st === 'delivered';
    if (!isFinished) return;

    // 2. Date parsing (supporting IST YYYY-MM and formatted strings)
    let jobDateStr = '';
    if (j.scheduledDate && typeof j.scheduledDate === 'string') {
      jobDateStr = j.scheduledDate.split('T')[0];
    } else if (j.date && typeof j.date === 'string') {
      try {
        const d = new Date(j.date);
        if (!isNaN(d.getTime())) {
          jobDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
        } else {
          jobDateStr = j.date.split('T')[0];
        }
      } catch (_) {
        jobDateStr = j.date.split('T')[0];
      }
    } else if (j.financials?.approvedAt) {
      try {
        jobDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(j.financials.approvedAt));
      } catch (_) {
        jobDateStr = String(j.financials.approvedAt).split('T')[0];
      }
    } else if (j.createdAt) {
      try {
        jobDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(j.createdAt));
      } catch (_) {
        jobDateStr = String(j.createdAt).split('T')[0];
      }
    }

    const isThisMonth = jobDateStr.startsWith(istMonth) || (typeof j.date === 'string' && j.date.toLowerCase().includes('oct'));

    const leadName = (
      j.assignedTechnicianName ||
      (typeof j.assignedTechnician === 'string' ? j.assignedTechnician : j.assignedTechnician?.name) ||
      (Array.isArray(j.assignedTechnicians) && j.assignedTechnicians[0]?.name) ||
      ''
    ).trim();

    const mainEarning = Number(
      j.financials?.mainTechnicianEarning ??
      j.mainTechnicianEarning ??
      j.financials?.technicianEarning ??
      j.technicianEarning ??
      0
    );

    const countedTechs = new Set();

    // Lead Technician calculation
    if (leadName && leadName.toLowerCase() !== 'unassigned') {
      const key = leadName.toLowerCase();
      if (!map[key]) map[key] = { monthlyEarnings: 0, totalEarnings: 0, totalCompleted: 0, monthCompletedCount: 0 };
      if (!jobsByTech[key]) jobsByTech[key] = [];
      map[key].totalEarnings += mainEarning;
      map[key].totalCompleted += 1;
      if (isThisMonth) {
        map[key].monthlyEarnings += mainEarning;
        map[key].monthCompletedCount += 1;
      }
      jobsByTech[key].push(j);
      countedTechs.add(key);
    }

    // Helper to parse sub-technicians
    const parseSubs = (raw) => {
      if (!raw) return [];
      let list = [];
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          list = Array.isArray(parsed) ? parsed : [raw];
        } catch { list = raw.split(','); }
      } else if (Array.isArray(raw)) { list = raw; }
      return list.map(item => {
        if (typeof item === 'object' && item !== null) return item.name || item.technicianName || item.id || '';
        return String(item || '').trim();
      }).filter(Boolean);
    };

    const orderSubList = parseSubs(j.subTechnicians);
    const subsFinancials = j.financials?.subTechnicianEarnings || j.subTechnicianEarnings || {};

    const getSubAmount = (name) => {
      if (!name) return 0;
      const target = name.toLowerCase().trim();
      if (Array.isArray(subsFinancials)) {
        const match = subsFinancials.find(st => (st.technicianName || '').toLowerCase().trim() === target || isTechNameMatch(st.technicianName, target));
        return Number(match?.amount || 0);
      } else if (typeof subsFinancials === 'object' && subsFinancials !== null) {
        const matchKey = Object.keys(subsFinancials).find(k => k.toLowerCase().trim() === target || isTechNameMatch(k, target));
        return matchKey ? Number(subsFinancials[matchKey] || 0) : 0;
      }
      return 0;
    };

    orderSubList.forEach((sName) => {
      if (!sName) return;
      const key = sName.toLowerCase().trim();
      const amt = getSubAmount(sName);

      if (!map[key]) map[key] = { monthlyEarnings: 0, totalEarnings: 0, totalCompleted: 0, monthCompletedCount: 0 };
      if (!jobsByTech[key]) jobsByTech[key] = [];

      map[key].totalEarnings += amt;
      if (isThisMonth) {
        map[key].monthlyEarnings += amt;
      }

      if (!countedTechs.has(key)) {
        map[key].totalCompleted += 1;
        if (isThisMonth) {
          map[key].monthCompletedCount += 1;
        }
        jobsByTech[key].push(j);
        countedTechs.add(key);
      }
    });
  });

  return { map, jobsByTech };
};
