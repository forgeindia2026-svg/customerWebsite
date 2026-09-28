import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// GET /api/users?roles=TECHNICIAN,ADMIN,HR — list all employees (for messaging contacts)
router.get('/', async (req: Request, res: Response) => {
  try {
    const rolesParam = req.query.roles as string;
    const roles = rolesParam 
      ? rolesParam.split(',').map(r => r.trim().toUpperCase())
      : ['TECHNICIAN', 'ADMIN', 'HR'];
    
    const users = await User.find({ role: { $in: roles }, isActive: { $ne: false } })
      .select('name email phone role avatar isAvailable rating')
      .sort({ role: 1, name: 1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
