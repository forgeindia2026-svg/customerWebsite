import { Router, Request, Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import Dashboard from '../models/Dashboard';

const router = Router();



// POST Login with Role-based Authentication
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // NoSQL Injection Protection & Type Validation
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input format. Strings required.' });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || password.trim() === '') {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // Sanitize input
    const cleanEmail = email.toLowerCase().trim().replace(/[${\}]/g, '');
    const cleanPassword = password.replace(/[${\}]/g, '');

    // Check DB User first
    let user = await User.findOne({ email: cleanEmail });

    if (!user || user.passwordHash !== cleanPassword) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }



    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id || `user-${Date.now()}`,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatar: user.avatar || '',
        amcPlan: user.amcPlan || 'Gold AMC Plan',
        amcExpires: user.amcExpires || 'May 20, 2026',
        token: `jwt-session-${Date.now()}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, specialties } = req.body;

    // NoSQL Injection Protection & Type Validation
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input format. Strings required.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (!phone || !/^\+?[0-9\s-]{10,15}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number (10-15 digits)' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Sanitize input
    const cleanEmail = email.toLowerCase().trim().replace(/[${\}]/g, '');
    const cleanPassword = password.replace(/[${\}]/g, '');
    const cleanName = name.replace(/[${\}]/g, '');

    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const newUser = new User({
      name: cleanName,
      email: cleanEmail,
      passwordHash: cleanPassword,
      role: role || 'CUSTOMER',
      phone,
      specialties: Array.isArray(specialties) ? specialties : [],
      amcPlan: 'Gold AMC Plan',
      amcExpires: 'May 20, 2026'
    });

    const savedUser = await newUser.save();



    res.status(201).json({
      success: true,
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        phone: savedUser.phone || '',
        amcPlan: savedUser.amcPlan || 'Gold AMC Plan',
        amcExpires: savedUser.amcExpires || 'May 20, 2026',
        token: `jwt-session-${savedUser._id}`,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET Technicians List
router.get('/technicians', async (req: Request, res: Response) => {
  try {
    const technicians = await User.find({ role: 'TECHNICIAN' }).select('-passwordHash');
    res.json({ success: true, count: technicians.length, data: technicians });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Profile — fetch user profile by email
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await User.findOne({ email: (email as string).toLowerCase() }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Profile — update name/phone for a customer
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const cleanEmail = (email as string).toLowerCase().trim();
    const updateFields: any = {};
    if (name && name.trim()) updateFields.name = name.trim();
    if (phone && phone.trim()) updateFields.phone = phone.trim();
    const updated = await User.findOneAndUpdate(
      { email: cleanEmail },
      { $set: updateFields },
      { new: true }
    ).select('-passwordHash');
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Change Password
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password is required' });
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const user = await User.findOne({ email: (email as string).toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.passwordHash !== currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.passwordHash = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
