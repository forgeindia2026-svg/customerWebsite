import { getApiUrl } from './config';

const STORAGE_KEY = 'sk_technician_expenses';

export const getLocalExpenses = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Strictly filter out any mock/seed data
    const clean = parsed.filter(e => {
      const id = String(e._id || '');
      if (id.startsWith('exp-seed')) return false;
      if (e.notes === 'Bike petrol for Hosur & Denkanikottai site inspection') return false;
      if (e.notes === 'Afternoon lunch & refreshments on CCTV installation site') return false;
      if (e.notes === 'Emergency PVC conduits and anchor fasteners bought from local hardware shop') return false;
      if (e.notes === 'Electronic City expressway toll & parking') return false;
      if (e.notes === 'Field visit fuel for 4 client sites in Attibele') return false;
      if (e.notes === 'RJ45 crimping tool replacement cutter blades') return false;
      return true;
    });

    if (clean.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch (_) {
    return [];
  }
};

export const saveLocalExpenses = (list) => {
  try {
    const clean = (list || []).filter(e => !String(e._id || '').startsWith('exp-seed-'));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('expenses_updated'));
    }
  } catch (e) {
    console.warn('Failed to save expenses to localStorage:', e);
  }
};

const PETTY_KEY = 'sk_petty_cash_accounts';

export const getLocalPettyAccounts = () => {
  try {
    const raw = localStorage.getItem(PETTY_KEY);
    if (!raw) {
      return {
        'branch-1': { branchId: 'branch-1', branchName: 'Branch 1 (Main Office)', openingBalance: 0, topups: [] },
        'branch-2': { branchId: 'branch-2', branchName: 'Branch 2', openingBalance: 0, topups: [] }
      };
    }
    return JSON.parse(raw);
  } catch (_) {
    return {
      'branch-1': { branchId: 'branch-1', branchName: 'Branch 1 (Main Office)', openingBalance: 0, topups: [] },
      'branch-2': { branchId: 'branch-2', branchName: 'Branch 2', openingBalance: 0, topups: [] }
    };
  }
};

export const saveLocalPettyAccounts = (accounts) => {
  try {
    localStorage.setItem(PETTY_KEY, JSON.stringify(accounts));
  } catch (_) {}
};

/**
 * Compute summary statistics from expenses list
 */
export const calculateExpensesSummary = (expensesList, targetMonth) => {
  const now = new Date();
  let today = '';
  let currentMonth = targetMonth || '';
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
    today = fmt.format(now);
    if (!currentMonth) currentMonth = today.substring(0, 7);
  } catch (_) {
    today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!currentMonth) currentMonth = today.substring(0, 7);
  }

  // Filter clean items (no mock data)
  const list = (Array.isArray(expensesList) ? expensesList : [])
    .filter(e => !String(e._id || '').startsWith('exp-seed-'));

  const thisMonthExpenses = list.filter(e => e.date && e.date.startsWith(currentMonth));
  const todayExpenses = list.filter(e => e.date === today);

  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const allTimeTotal = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Group by technician
  const techMap = {};

  list.forEach(e => {
    const name = (e.technicianName || '').trim();
    if (!name) return;
    if (!techMap[name]) {
      techMap[name] = {
        technicianName: name,
        monthTotal: 0,
        allTimeTotal: 0,
        monthCount: 0,
        allTimeCount: 0,
        categories: {},
        recentExpenses: []
      };
    }

    const amt = Number(e.amount) || 0;
    techMap[name].allTimeTotal += amt;
    techMap[name].allTimeCount += 1;

    if (e.date && e.date.startsWith(currentMonth)) {
      techMap[name].monthTotal += amt;
      techMap[name].monthCount += 1;
      techMap[name].categories[e.category] = (techMap[name].categories[e.category] || 0) + amt;
    }

    if (techMap[name].recentExpenses.length < 5) {
      techMap[name].recentExpenses.push(e);
    }
  });

  const technicianBreakdown = Object.values(techMap).sort((a, b) => b.monthTotal - a.monthTotal);

  const categoryBreakdown = {};
  thisMonthExpenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (Number(e.amount) || 0);
  });

  // Calculate local Petty Cash summary
  const pettyAccounts = getLocalPettyAccounts();
  const calcBranch = (accId, fallbackName) => {
    const acc = pettyAccounts[accId] || { openingBalance: 0, topups: [] };
    const opening = Number(acc.openingBalance) || 0;
    const topupsSum = (acc.topups || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalAllocated = opening + topupsSum;

    const branchExpenses = list.filter(e => {
      const src = (e.fundSource || '').toLowerCase();
      if (accId === 'branch-1') return src.includes('branch 1') || (!e.fundSource && !src.includes('branch 2') && !src.includes('admin'));
      return src.includes('branch 2');
    });

    const monthSpent = branchExpenses
      .filter(e => e.date && e.date.startsWith(currentMonth))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalSpent = branchExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const remaining = totalAllocated - totalSpent;

    return {
      branchId: accId,
      branchName: acc.branchName || fallbackName,
      openingBalance: opening,
      totalTopups: topupsSum,
      totalAllocated,
      monthSpent,
      totalSpent,
      remainingBalance: remaining,
      recentTopups: (acc.topups || []).slice(-5).reverse()
    };
  };

  const branch1 = calcBranch('branch-1', 'Branch 1 (Main Office)');
  const branch2 = calcBranch('branch-2', 'Branch 2');

  const adminExpenses = list.filter(e => (e.fundSource || '').toLowerCase().includes('admin'));
  const adminMonthSpent = adminExpenses
    .filter(e => e.date && e.date.startsWith(currentMonth))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const adminTotalSpent = adminExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const adminByMode = {
    'UPI - PhonePe': 0,
    'UPI - GPay': 0,
    'UPI - Paytm': 0,
    'Net Banking': 0,
    'Cash': 0
  };
  adminExpenses.filter(e => e.date && e.date.startsWith(currentMonth)).forEach(e => {
    const m = e.paymentMode || 'UPI - PhonePe';
    adminByMode[m] = (adminByMode[m] || 0) + (Number(e.amount) || 0);
  });

  const pettyCashSummary = {
    branch1,
    branch2,
    adminAccount: {
      accountName: 'Admin Account (SARAN KUMAR)',
      monthSpent: adminMonthSpent,
      totalSpent: adminTotalSpent,
      byMode: adminByMode
    }
  };

  return {
    success: true,
    currentMonth,
    today,
    summary: {
      thisMonthTotal,
      todayTotal,
      allTimeTotal,
      thisMonthCount: thisMonthExpenses.length,
      todayCount: todayExpenses.length,
      activeTechniciansCount: technicianBreakdown.filter(t => t.monthTotal > 0).length,
    },
    categoryBreakdown,
    technicianBreakdown,
    pettyCashSummary
  };
};

const getExpensesBase = () => {
  if (typeof window !== 'undefined') {
    return '/api/expenses';
  }
  return `${getApiUrl()}/api/expenses`;
};

/**
 * Fetch expenses with automatic local fallback
 */
export const fetchExpensesApi = async (month) => {
  const url = `${getExpensesBase()}?month=${month || ''}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        saveLocalExpenses(data.data);
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/expenses not accessible, using local storage.');
  }

  // Fallback to local storage (strictly zero mock data)
  const localList = getLocalExpenses();
  return localList.filter(e => !month || (e.date && e.date.startsWith(month)));
};

/**
 * Fetch summary with automatic local fallback
 */
export const fetchExpensesSummaryApi = async (month) => {
  const url = `${getExpensesBase()}/summary?month=${month || ''}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/expenses/summary not accessible, calculating locally.');
  }

  // Fallback to local calculation (strictly zero mock data)
  const localList = getLocalExpenses();
  return calculateExpensesSummary(localList, month);
};

/**
 * Fetch petty cash summary
 */
export const fetchPettyCashSummaryApi = async (month) => {
  const url = `${getExpensesBase()}/petty-cash?month=${month || ''}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        saveLocalPettyAccounts({
          'branch-1': data.data.branch1,
          'branch-2': data.data.branch2
        });
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/expenses/petty-cash not accessible, calculating locally.');
  }

  const localList = getLocalExpenses();
  const summary = calculateExpensesSummary(localList, month);
  return summary.pettyCashSummary;
};

/**
 * Top-up or reset opening balance for a petty cash account
 */
export const topupPettyCashApi = async ({ branchId, amount, isOpeningBalanceReset, notes, paymentMode, date }) => {
  // Update local storage first
  const accounts = getLocalPettyAccounts();
  const acc = accounts[branchId] || { branchId, branchName: branchId === 'branch-1' ? 'Branch 1 (Main Office)' : 'Branch 2', openingBalance: 0, topups: [] };

  const parsedAmt = Number(amount) || 0;
  if (isOpeningBalanceReset) {
    acc.openingBalance = parsedAmt;
    acc.topups = [];
  } else {
    acc.topups = acc.topups || [];
    acc.topups.push({
      amount: parsedAmt,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      paymentMode: paymentMode || 'Cash',
      addedBy: 'Admin'
    });
  }
  accounts[branchId] = acc;
  saveLocalPettyAccounts(accounts);

  // Sync with backend
  try {
    const res = await fetch(`${getExpensesBase()}/petty-cash/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId, amount: parsedAmt, isOpeningBalanceReset, notes, paymentMode, date })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (_) {
    // Local update succeeded
  }

  return { success: true, data: acc };
};

/**
 * Save new expense with automatic local sync
 */
export const createExpenseApi = async (expenseData) => {
  const localList = getLocalExpenses();
  const newRecord = {
    _id: 'exp-' + Date.now(),
    ...expenseData,
    createdAt: new Date().toISOString()
  };

  const updatedList = [newRecord, ...localList];
  saveLocalExpenses(updatedList);

  // Sync with backend
  try {
    const res = await fetch(getExpensesBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data) {
        newRecord._id = data.data._id || newRecord._id;
        saveLocalExpenses([newRecord, ...localList]);
      }
    }
  } catch (_) {
    // Local save already succeeded
  }

  return { success: true, data: newRecord };
};

/**
 * Delete expense with local sync
 */
export const deleteExpenseApi = async (id) => {
  const localList = getLocalExpenses();
  const updatedList = localList.filter(e => e._id !== id);
  saveLocalExpenses(updatedList);

  try {
    await fetch(`${getExpensesBase()}/${id}`, { method: 'DELETE' });
  } catch (_) {
    // Local delete already succeeded
  }

  return { success: true };
};
