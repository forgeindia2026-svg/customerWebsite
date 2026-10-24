import { invalidateCache } from '../services/redisService';
import express, { Request, Response } from 'express';
import Expense from '../models/Expense';
import PettyCashAccount from '../models/PettyCashAccount';

const router = express.Router();

// Helper to get current Year-Month in IST (YYYY-MM)
const getCurrentYearMonth = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).substring(0, 7);
  } catch (_) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
};

// Helper to get today's date in IST (YYYY-MM-DD)
const getTodayDate = (): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (_) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

// Helper to compute Petty Cash and Fund Accounts balances
export const getPettyCashAccountsSummary = async (targetMonth?: string) => {
  const currentMonth = targetMonth || getCurrentYearMonth();

  // Find or create Branch 1 and Branch 2 accounts
  let b1 = await PettyCashAccount.findOne({ branchId: 'branch-1' });
  if (!b1) {
    b1 = await PettyCashAccount.create({
      branchId: 'branch-1',
      branchName: 'Branch 1',
      openingBalance: 0,
      topups: []
    });
  }

  let b2 = await PettyCashAccount.findOne({ branchId: 'branch-2' });
  if (!b2) {
    b2 = await PettyCashAccount.create({
      branchId: 'branch-2',
      branchName: 'Branch 2',
      openingBalance: 0,
      topups: []
    });
  }

  // Branch 1 allocation & spent
  const b1TopupsTotal = (b1.topups || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const b1Allocated = (Number(b1.openingBalance) || 0) + b1TopupsTotal;

  // Current Account (Company Bank / Direct Pay)
  let ca = await PettyCashAccount.findOne({
    $or: [{ branchId: 'current-account' }, { branchId: 'admin-account' }]
  });
  if (!ca) {
    ca = await PettyCashAccount.create({
      branchId: 'current-account',
      branchName: 'Current Account',
      openingBalance: 0,
      topups: []
    });
  }

  // Branch 2 allocation & spent
  const b2TopupsTotal = (b2.topups || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const b2Allocated = (Number(b2.openingBalance) || 0) + b2TopupsTotal;

  // Current Account allocation & spent
  const caTopupsTotal = (ca.topups || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const caAllocated = (Number(ca.openingBalance) || 0) + caTopupsTotal;

  // Fetch all expenses to calculate live remaining balances
  const allExpenses = await Expense.find({});

  const b1Expenses = allExpenses.filter(e => e.fundSource === 'Branch 1 Petty Cash');
  const b1Spent = b1Expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const b1MonthSpent = b1Expenses
    .filter(e => e.date && e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const b1Remaining = Math.max(0, b1Allocated - b1Spent);

  const b2Expenses = allExpenses.filter(e => e.fundSource === 'Branch 2 Petty Cash');
  const b2Spent = b2Expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const b2MonthSpent = b2Expenses
    .filter(e => e.date && e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const b2Remaining = Math.max(0, b2Allocated - b2Spent);

  // Current Account / Admin Account expenses
  const caExpenses = allExpenses.filter(e => {
    const src = (e.fundSource || '').toLowerCase();
    return src.includes('current account') || src.includes('admin account') || src.includes('bank');
  });
  const caSpent = caExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const caMonthSpent = caExpenses
    .filter(e => e.date && e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const caRemaining = Math.max(0, caAllocated - caSpent);

  const caByMode: Record<string, number> = {};
  caExpenses.forEach(e => {
    const mode = e.paymentMode || 'UPI - PhonePe';
    caByMode[mode] = (caByMode[mode] || 0) + (Number(e.amount) || 0);
  });

  const currentAccObj = {
    branchId: 'current-account',
    branchName: ca.branchName || 'Current Account',
    name: ca.branchName || 'Current Account',
    openingBalance: Number(ca.openingBalance) || 0,
    totalTopups: caTopupsTotal,
    totalAllocated: caAllocated,
    totalSpent: caSpent,
    monthSpent: caMonthSpent,
    remainingBalance: caRemaining,
    topups: ca.topups || [],
    byMode: caByMode
  };

  return {
    branch1: {
      branchId: 'branch-1',
      branchName: 'Branch 1',
      openingBalance: Number(b1.openingBalance) || 0,
      totalTopups: b1TopupsTotal,
      totalAllocated: b1Allocated,
      totalSpent: b1Spent,
      monthSpent: b1MonthSpent,
      remainingBalance: b1Remaining,
      topups: b1.topups || []
    },
    branch2: {
      branchId: 'branch-2',
      branchName: 'Branch 2',
      openingBalance: Number(b2.openingBalance) || 0,
      totalTopups: b2TopupsTotal,
      totalAllocated: b2Allocated,
      totalSpent: b2Spent,
      monthSpent: b2MonthSpent,
      remainingBalance: b2Remaining,
      topups: b2.topups || []
    },
    currentAccount: currentAccObj,
    adminAccount: currentAccObj
  };
};

/**
 * GET /api/expenses/petty-cash
 * Get current live petty cash balances and accounts summary
 */
router.get('/petty-cash', async (req: Request, res: Response) => {
  try {
    const summary = await getPettyCashAccountsSummary(req.query.month as string);
    res.json({
      success: true,
      data: summary
    });
  } catch (err: any) {
    console.error('Error fetching petty cash accounts:', err);
    res.status(500).json({ success: false, message: 'Server error fetching petty cash', error: err.message });
  }
});

/**
 * POST /api/expenses/petty-cash/topup
 * Add fund / top-up or set opening balance for Branch 1 or Branch 2
 */
router.post('/petty-cash/topup', async (req: Request, res: Response) => {
  try {
    const { branchId, amount, isOpeningBalanceReset, notes, paymentMode, date, addedBy } = req.body;

    if (!branchId || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'branchId and amount are required' });
    }

    const rawId = String(branchId).toLowerCase().trim();
    let cleanBranchId = 'branch-1';
    let cleanBranchName = 'Branch 1';
    if (rawId.includes('current') || rawId.includes('admin') || rawId === 'current-account') {
      cleanBranchId = 'current-account';
      cleanBranchName = 'Current Account';
    } else if (rawId.includes('2') || rawId === 'branch-2') {
      cleanBranchId = 'branch-2';
      cleanBranchName = 'Branch 2';
    }
    const numAmount = Math.max(0, Number(amount));

    let account = await PettyCashAccount.findOne({ branchId: cleanBranchId });
    if (!account) {
      account = new PettyCashAccount({
        branchId: cleanBranchId,
        branchName: cleanBranchName,
        openingBalance: isOpeningBalanceReset ? numAmount : 0,
        topups: []
      });
    }

    if (isOpeningBalanceReset) {
      account.openingBalance = numAmount;
      account.topups = [];
    } else {
      account.topups.push({
        amount: numAmount,
        date: date || getTodayDate(),
        notes: notes || 'Petty cash top-up',
        paymentMode: paymentMode || 'Cash',
        addedBy: addedBy || 'Admin',
        createdAt: new Date()
      });
    }

    await account.save();

    try { await invalidateCache('dashboard:*'); } catch (_) {}
    const updatedSummary = await getPettyCashAccountsSummary();

    res.json({
      success: true,
      message: isOpeningBalanceReset
        ? `${cleanBranchName} opening balance updated to Rs. ${numAmount}`
        : `${cleanBranchName} topped up with Rs. ${numAmount}`,
      data: updatedSummary
    });
  } catch (err: any) {
    console.error('Error updating petty cash:', err);
    res.status(500).json({ success: false, message: 'Server error updating petty cash', error: err.message });
  }
});

/**
 * GET /api/expenses/summary
 * Aggregate summary for Dashboard KPI, Overview, and Accounts
 */

/**
 * PUT /api/expenses/petty-cash/topup
 * Edit a specific top-up amount / notes / date
 */
router.put('/petty-cash/topup', async (req: Request, res: Response) => {
  try {
    const { branchId, topupId, index, amount, notes, date, paymentMode } = req.body;
    const rawId = String(branchId || '').toLowerCase().trim();
    let cleanBranchId = 'branch-1';
    if (rawId.includes('current') || rawId.includes('admin')) {
      cleanBranchId = 'current-account';
    } else if (rawId.includes('2')) {
      cleanBranchId = 'branch-2';
    }

    const account = await PettyCashAccount.findOne({
      $or: [{ branchId: cleanBranchId }, ...(cleanBranchId === 'current-account' ? [{ branchId: 'admin-account' }] : [])]
    });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let topupItem: any = null;
    if (topupId) {
      topupItem = (account.topups as any).id ? (account.topups as any).id(topupId) : null;
    }
    if (!topupItem && index !== undefined && account.topups[index]) {
      topupItem = account.topups[index];
    }
    if (!topupItem && Array.isArray(account.topups) && account.topups.length > 0) {
      topupItem = account.topups.find((t: any) => String(t._id || '') === String(topupId));
    }

    if (!topupItem) {
      return res.status(404).json({ success: false, message: 'Top-up entry not found' });
    }

    if (amount !== undefined) topupItem.amount = Math.max(0, Number(amount));
    if (notes !== undefined) topupItem.notes = notes;
    if (date !== undefined) topupItem.date = date;
    if (paymentMode !== undefined) topupItem.paymentMode = paymentMode;

    await account.save();
    try { await invalidateCache('dashboard:*'); } catch (_) {}
    const updatedSummary = await getPettyCashAccountsSummary();
    res.json({ success: true, message: 'Top-up updated successfully', data: updatedSummary });
  } catch (err: any) {
    console.error('Error editing top-up:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

/**
 * DELETE /api/expenses/petty-cash/topup
 * Delete a specific top-up voucher from an account
 */
router.delete('/petty-cash/topup', async (req: Request, res: Response) => {
  try {
    const { branchId, topupId } = req.body;
    const rawId = String(branchId || '').toLowerCase().trim();
    let cleanBranchId = 'branch-1';
    if (rawId.includes('current') || rawId.includes('admin')) {
      cleanBranchId = 'current-account';
    } else if (rawId.includes('2')) {
      cleanBranchId = 'branch-2';
    }

    const account = await PettyCashAccount.findOne({
      $or: [{ branchId: cleanBranchId }, ...(cleanBranchId === 'current-account' ? [{ branchId: 'admin-account' }] : [])]
    });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const initialLen = account.topups.length;
    account.topups = account.topups.filter((t: any) => String(t._id || '') !== String(topupId)) as any;

    if (account.topups.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Top-up voucher not found' });
    }

    await account.save();
    try { await invalidateCache('dashboard:*'); } catch (_) {}
    const updatedSummary = await getPettyCashAccountsSummary();
    res.json({ success: true, message: 'Top-up voucher deleted successfully', data: updatedSummary });
  } catch (err: any) {
    console.error('Error deleting top-up:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

/**
 * PUT /api/expenses/petty-cash/opening-balance
 * Update only the opening balance without touching topup vouchers
 */
router.put('/petty-cash/opening-balance', async (req: Request, res: Response) => {
  try {
    const { branchId, amount } = req.body;
    const rawId = String(branchId || '').toLowerCase().trim();
    let cleanBranchId = 'branch-1';
    if (rawId.includes('current') || rawId.includes('admin')) {
      cleanBranchId = 'current-account';
    } else if (rawId.includes('2')) {
      cleanBranchId = 'branch-2';
    }

    let account = await PettyCashAccount.findOne({
      $or: [{ branchId: cleanBranchId }, ...(cleanBranchId === 'current-account' ? [{ branchId: 'admin-account' }] : [])]
    });
    if (!account) {
      account = new PettyCashAccount({ branchId: cleanBranchId, branchName: cleanBranchId, openingBalance: 0, topups: [] });
    }
    account.openingBalance = Math.max(0, Number(amount) || 0);
    await account.save();
    try { await invalidateCache('dashboard:*'); } catch (_) {}
    const updatedSummary = await getPettyCashAccountsSummary();
    res.json({ success: true, message: 'Opening balance updated', data: updatedSummary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/expenses/petty-cash/account-name
 * Edit account name (e.g. Current Account, Company Bank, etc.)
 */
router.put('/petty-cash/account-name', async (req: Request, res: Response) => {
  try {
    const { branchId, name } = req.body;
    if (!branchId || !name) {
      return res.status(400).json({ success: false, message: 'branchId and name are required' });
    }
    const rawId = String(branchId).toLowerCase().trim();
    let cleanBranchId = 'branch-1';
    if (rawId.includes('current') || rawId.includes('admin')) cleanBranchId = 'current-account';
    else if (rawId.includes('2')) cleanBranchId = 'branch-2';

    let account = await PettyCashAccount.findOne({
      $or: [{ branchId: cleanBranchId }, ...(cleanBranchId === 'current-account' ? [{ branchId: 'admin-account' }] : [])]
    });
    if (!account) {
      account = new PettyCashAccount({ branchId: cleanBranchId, branchName: name.trim(), openingBalance: 0, topups: [] });
    } else {
      account.branchName = name.trim();
    }
    await account.save();
    try { await invalidateCache('dashboard:*'); } catch (_) {}
    res.json({ success: true, message: 'Account name updated successfully', branchName: account.branchName });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const currentMonth = (req.query.month as string) || getCurrentYearMonth();
    const today = getTodayDate();

    const [allExpenses, pettyCashSummary] = await Promise.all([
      Expense.find({}).sort({ date: -1, createdAt: -1 }),
      getPettyCashAccountsSummary(currentMonth)
    ]);

    const thisMonthExpenses = allExpenses.filter(e => e.date && e.date.startsWith(currentMonth));
    const todayExpenses = allExpenses.filter(e => e.date === today);

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const todayTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const allTimeTotal = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Group by technician
    const techMap: Record<string, {
      technicianName: string;
      monthTotal: number;
      allTimeTotal: number;
      monthCount: number;
      allTimeCount: number;
      categories: Record<string, number>;
      recentExpenses: any[];
    }> = {};

    allExpenses.forEach(e => {
      const name = (e.technicianName || 'Unknown').trim();
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

    // Category breakdown for this month
    const categoryBreakdown: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (Number(e.amount) || 0);
    });

    // Breakdown by Fund Source (Branch 1, Branch 2, Admin Account)
    const fundSourceBreakdown: Record<string, number> = {
      'Branch 1 Petty Cash': 0,
      'Branch 2 Petty Cash': 0,
      'Admin Account': 0
    };
    thisMonthExpenses.forEach(e => {
      const src = e.fundSource || 'Branch 1 Petty Cash';
      fundSourceBreakdown[src] = (fundSourceBreakdown[src] || 0) + (Number(e.amount) || 0);
    });

    res.json({
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
      pettyCashSummary,
      fundSourceBreakdown,
      categoryBreakdown,
      technicianBreakdown
    });
  } catch (err: any) {
    console.error('Error fetching expenses summary:', err);
    res.status(500).json({ success: false, message: 'Server error fetching expenses summary', error: err.message });
  }
});

/**
 * GET /api/expenses
 * List all expenses with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, date, technicianName, category, fundSource, expenseType } = req.query;

    const filter: any = {};

    if (date && typeof date === 'string') {
      filter.date = date;
    } else if (month && typeof month === 'string') {
      filter.date = { $regex: `^${month}` };
    }

    if (technicianName && typeof technicianName === 'string') {
      filter.technicianName = { $regex: technicianName, $options: 'i' };
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      filter.category = category;
    }

    if (fundSource && typeof fundSource === 'string' && fundSource !== 'ALL') {
      filter.fundSource = fundSource;
    }

    if (expenseType && typeof expenseType === 'string' && expenseType !== 'ALL') {
      filter.expenseType = expenseType;
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err: any) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ success: false, message: 'Server error fetching expenses', error: err.message });
  }
});

/**
 * POST /api/expenses
 * Create a new daily expense
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      technicianName,
      technicianId,
      employeeName,
      expenseType,
      fundSource,
      paymentMode,
      referenceId,
      date,
      time,
      category,
      amount,
      notes,
      receiptPhoto,
      jobCode,
      status,
      createdBy
    } = req.body;

    const resolvedExpenseType = expenseType === 'OFFICE' ? 'OFFICE' : 'TECHNICIAN';
    const resolvedEmployeeName = (employeeName || '').trim();
    const resolvedTechName = (technicianName && technicianName.trim())
      ? technicianName.trim()
      : (resolvedExpenseType === 'OFFICE' ? (resolvedEmployeeName ? `Office (${resolvedEmployeeName})` : 'Office Purpose') : 'Field Technician');

    if (!resolvedTechName || !amount) {
      return res.status(400).json({ success: false, message: 'Technician/Beneficiary Name and Amount are required' });
    }

    const finalDate = date || getTodayDate();
    const finalTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const resolvedFundSource = fundSource || 'Branch 1 Petty Cash';
    const resolvedPaymentMode = paymentMode || (resolvedFundSource === 'Admin Account' ? 'UPI - PhonePe' : 'Petty Cash');

    const newExpense = new Expense({
      technicianName: resolvedTechName,
      technicianId: technicianId || '',
      employeeName: resolvedEmployeeName,
      expenseType: resolvedExpenseType,
      fundSource: resolvedFundSource,
      paymentMode: resolvedPaymentMode,
      referenceId: referenceId || '',
      date: finalDate,
      time: finalTime,
      category: category || (resolvedExpenseType === 'OFFICE' ? 'Pooja / Flowers' : 'Petrol / Fuel'),
      amount: Math.max(0, Number(amount)),
      notes: notes || '',
      receiptPhoto: receiptPhoto || '',
      jobCode: jobCode || '',
      status: status || 'APPROVED',
      createdBy: createdBy || 'Admin'
    });

    const saved = await newExpense.save();

    res.status(201).json({
      success: true,
      message: 'Daily expense recorded successfully',
      data: saved
    });
  } catch (err: any) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, message: 'Server error creating expense', error: err.message });
  }
});

/**
 * PUT /api/expenses/:id
 * Update an existing expense
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updated
    });
  } catch (err: any) {
    console.error('Error updating expense:', err);
    res.status(500).json({ success: false, message: 'Server error updating expense', error: err.message });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ success: false, message: 'Server error deleting expense', error: err.message });
  }
});

export default router;
