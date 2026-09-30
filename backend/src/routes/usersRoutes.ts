import { Router, Request, Response } from 'express';
import User from '../models/User';
import { sendPushToUser } from '../utils/pushHelper';

const router = Router();

// POST /api/users/push/subscribe
router.post('/push/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, userName, subscription } = req.body;
    if (!subscription) return res.status(400).json({ success: false, message: 'Missing subscription data' });
    if (!userId && !userName) return res.status(400).json({ success: false, message: 'Missing user identifier' });
    
    let user;
    if (userName) {
      user = await User.findOne({ name: new RegExp(`^${userName}$`, 'i') });
    }
    if (!user && userId && userId.length === 24) {
      user = await User.findById(userId);
    }
    
    if (!user) {
      // If we can't find them in DB, we can't store push subs.
      return res.status(404).json({ success: false, message: 'User not found in DB' });
    }
    
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
