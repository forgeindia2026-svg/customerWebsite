import { Router, Request, Response } from 'express';
import User from '../models/User';
import { sendPushToUser } from '../utils/pushHelper';

const router = Router();

// POST /api/users/push/subscribe
router.post('/push/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) return res.status(400).json({ success: false, message: 'Missing data' });
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (!user.pushSubscriptions) user.pushSubscriptions = [];
    
    // Prevent duplicate subscriptions
    const exists = user.pushSubscriptions.find((sub: any) => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users?roles=TECHNICIAN,ADMIN,HR — list all employees (for messaging contacts)
router.get('/', async (req: Request, res: Response) => {
  try {
    const rolesParam = req.query.roles as string;
    const roles = rolesParam 
      ? rolesParam.split(',').map(r => r.trim().toUpperCase())
      : ['TECHNICIAN', 'ADMIN', 'HR'];
    
    const users = await User.find({ role: { $in: roles }, isActive: { $ne: false } } as any)
      .select('name email phone role avatar isAvailable rating')
      .sort({ role: 1, name: 1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
