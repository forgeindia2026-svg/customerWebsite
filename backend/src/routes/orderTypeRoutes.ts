import { Router, Request, Response } from 'express';
import OrderType from '../models/OrderType';

const router = Router();

const DEFAULT_TYPES = [
  'Cameras Installation',
  'CCTV Installation',
  'AMC Service',
  'Cameras Repair',
  'DVR Upgrade',
  'System Audit'
];

// GET all order types (with default fallback & auto-seeding)
router.get('/', async (req: Request, res: Response) => {
  try {
    let types = await OrderType.find({}).sort({ name: 1 }).lean();

    if (!types || types.length === 0) {
      // Seed default types
      const docs = DEFAULT_TYPES.map(name => ({ name }));
      await OrderType.insertMany(docs, { ordered: false }).catch(() => {});
      types = await OrderType.find({}).sort({ name: 1 }).lean();
    }

    const typeNames = types.map((t: any) => t.name);
    
    // Ensure all DEFAULT_TYPES are present in output
    for (const dt of DEFAULT_TYPES) {
      if (!typeNames.includes(dt)) {
        typeNames.push(dt);
      }
    }

    res.json({ success: true, data: typeNames, raw: types });
  } catch (error: any) {
    console.error('Error fetching order types:', error);
    res.json({ success: true, data: DEFAULT_TYPES });
  }
});

// POST add a new custom order type
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Order type name is required' });
    }

    const existing = await OrderType.findOne({ 
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    if (!existing) {
      const newType = new OrderType({ name: cleanName });
      await newType.save();
    }

    // Return updated list
    const types = await OrderType.find({}).sort({ name: 1 }).lean();
    const typeNames = types.map((t: any) => t.name);
    for (const dt of DEFAULT_TYPES) {
      if (!typeNames.includes(dt)) {
        typeNames.push(dt);
      }
    }

    res.status(201).json({ success: true, data: typeNames, added: cleanName, message: `Order type "${cleanName}" added successfully` });
  } catch (error: any) {
    console.error('Error adding order type:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add order type' });
  }
});

// DELETE remove a custom order type
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const paramName = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
    const targetName = decodeURIComponent(String(paramName || '')).trim();
    if (!targetName) {
      return res.status(400).json({ success: false, message: 'Invalid name' });
    }

    await OrderType.deleteOne({ 
      name: { $regex: new RegExp(`^${targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });

    const types = await OrderType.find({}).sort({ name: 1 }).lean();
    const typeNames = types.map((t: any) => t.name);
    for (const dt of DEFAULT_TYPES) {
      if (!typeNames.includes(dt)) {
        typeNames.push(dt);
      }
    }

    res.json({ success: true, data: typeNames, message: `Order type "${targetName}" deleted` });
  } catch (error: any) {
    console.error('Error deleting order type:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order type' });
  }
});

export default router;
