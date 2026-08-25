import express, { Request, Response } from 'express';
import TechnicianAttendance from '../models/TechnicianAttendance';
import User from '../models/User';
import { processWaitingQueue } from '../services/queueService';
import { broadcastEvent, emitToRole } from '../socket';

const router = express.Router();

// GET all attendance records with flexible filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { technicianId, date, month } = req.query;
    const query: any = {};
    
    if (technicianId) query.technicianId = technicianId;
    if (date) query.date = date;
    if (month && typeof month === 'string') {
      query.date = { $regex: `^${month}` }; // Match YYYY-MM
    }

    const records = await TechnicianAttendance.find(query).sort({ date: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const getTodayIST = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
};

// GET today's attendance roster for all technicians (Live Dashboard Radar)
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = getTodayIST();
    const records = await TechnicianAttendance.find({ date: today }).sort({ checkInTimestamp: -1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST Check-In (Punch In)
router.post('/check-in', async (req: Request, res: Response) => {
  try {
    const { technicianId, technicianName, location, latitude, longitude, notes } = req.body;
    if (!technicianId || !technicianName) {
      return res.status(400).json({ message: 'Technician information is required' });
    }

    const now = new Date();
    const today = getTodayIST();
    const checkInTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    // Check if already punched in today
    let record = await TechnicianAttendance.findOne({ technicianId, date: today });
    if (record) {
      // Update check in if not set
      if (!record.checkInTimestamp) {
        record.checkInTime = checkInTimeStr;
        record.checkInTimestamp = now;
        record.status = 'PRESENT';
        if (location) record.location = location;
        if (latitude) record.latitude = latitude;
        if (longitude) record.longitude = longitude;
        await record.save();
      }
    } else {
      record = new TechnicianAttendance({
        technicianId,
        technicianName,
        date: today,
        checkInTime: checkInTimeStr,
        checkInTimestamp: now,
        status: 'PRESENT',
        location: location || 'Field Operations',
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || 'Full Day (1.0 Day)'
      });
      await record.save();
    }

    // 🟢 Mark Technician as Online & Available
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(technicianId);
    await User.updateMany(
      { $or: [...(isMongoId ? [{ _id: technicianId }] : []), { name: technicianName }] },
      { $set: { isAvailable: true } }
    );

    // ⚡ Trigger Auto-Queue processor to assign any waiting jobs!
    processWaitingQueue().catch(err => console.error('Queue processing error:', err));

    // Broadcast live socket update
    broadcastEvent('technician:status_updated', {
      technicianId,
      technicianName,
      status: 'ONLINE',
      isAvailable: true,
      checkInTime: checkInTimeStr
    });

    res.status(201).json({ success: true, message: 'Check-In Successful. You are now ONLINE.', attendance: record });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// POST Check-Out (Punch Out)
router.post('/check-out', async (req: Request, res: Response) => {
  try {
    const { technicianId, notes } = req.body;
    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    const now = new Date();
    const today = getTodayIST();
    const checkOutTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    let record = await TechnicianAttendance.findOne({ technicianId, date: today });
    if (!record) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }

    record.checkOutTime = checkOutTimeStr;
    record.checkOutTimestamp = now;
    record.status = 'OFF_DUTY';
    if (notes) record.notes = notes;

    // Calculate total hours worked
    if (record.checkInTimestamp) {
      const diffMs = now.getTime() - new Date(record.checkInTimestamp).getTime();
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      record.totalHours = hours;
    }

    await record.save();

    // 🔴 Mark Technician as Offline
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(technicianId);
    await User.updateMany(
      { $or: [...(isMongoId ? [{ _id: technicianId }] : []), { name: record.technicianName }] },
      { $set: { isAvailable: false } }
    );

    // Broadcast live socket update
    broadcastEvent('technician:status_updated', {
      technicianId,
      technicianName: record.technicianName,
      status: 'OFFLINE',
      isAvailable: false,
      checkOutTime: checkOutTimeStr
    });

    res.json({ success: true, message: 'Check-Out Successful. You are now OFFLINE.', attendance: record });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

export default router;
