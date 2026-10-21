import express, { Request, Response } from 'express';
import Expense from '../models/Expense';

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



/**
 * GET /api/expenses/summary
 * Aggregate summary for Dashboard KPI & Overview
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const currentMonth = (req.query.month as string) || getCurrentYearMonth();
    const today = getTodayDate();

    const allExpenses = await Expense.find({}).sort({ date: -1, createdAt: -1 });

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

    // Convert map to sorted array (highest month expense first)
    const technicianBreakdown = Object.values(techMap).sort((a, b) => b.monthTotal - a.monthTotal);

    // Category breakdown for this month
    const categoryBreakdown: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (Number(e.amount) || 0);
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
    const { month, date, technicianName, category } = req.query;

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

    if (!technicianName || !amount) {
      return res.status(400).json({ success: false, message: 'Technician Name and Amount are required' });
    }

    const finalDate = date || getTodayDate();
    const finalTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newExpense = new Expense({
      technicianName: technicianName.trim(),
      technicianId: technicianId || '',
      date: finalDate,
      time: finalTime,
      category: category || 'Petrol / Fuel',
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
