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
    technicianBreakdown
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
