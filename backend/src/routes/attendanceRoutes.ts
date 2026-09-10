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
    const { technicianId, technicianName, location, latitude, longitude, photo, punchInPhoto, notes } = req.body;
    if (!technicianId || !technicianName) {
      return res.status(400).json({ message: 'Technician information is required' });
    }

    const photoUrl = (photo || punchInPhoto || '').trim();
    const now = new Date();
    const today = getTodayIST();
    const checkInTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    // Check if record exists for today
    let record = await TechnicianAttendance.findOne({ technicianId, date: today });
    if (record) {
      if (!Array.isArray(record.punches)) {
        record.punches = [];
      }

      // Check if there is already an open session (punched in but not punched out)
      const activeSession = record.punches.find((p: any) => p.punchInTimestamp && !p.punchOutTimestamp);
      if (activeSession) {
        if (photoUrl) {
          activeSession.punchInPhoto = photoUrl;
          record.punchInPhoto = photoUrl;
        }
        if (location) activeSession.punchInLocation = location;
        if (latitude) activeSession.punchInLatitude = latitude;
        if (longitude) activeSession.punchInLongitude = longitude;
        record.status = 'PRESENT';
        await record.save();

        return res.status(200).json({ 
          success: true, 
          message: 'Already checked in for active session.', 
          attendance: record 
        });
      }

      // Start a NEW Punch Session for today
      const newSession: any = {
        punchInTime: checkInTimeStr,
        punchInTimestamp: now,
        punchInPhoto: photoUrl,
        punchInLocation: location || 'Field Operations',
        punchInLatitude: latitude || null,
        punchInLongitude: longitude || null,
        notes: notes || `Session ${record.punches.length + 1}`
      };

      record.punches.push(newSession);
      record.status = 'PRESENT';
      record.checkInTime = record.checkInTime || checkInTimeStr;
      record.checkInTimestamp = record.checkInTimestamp || now;
      if (photoUrl) record.punchInPhoto = photoUrl;
      record.checkOutTime = '';
      record.checkOutTimestamp = undefined;
      if (location) record.location = location;
      if (latitude) record.latitude = latitude;
      if (longitude) record.longitude = longitude;

      await record.save();
    } else {
      // First punch of the day
      const firstSession: any = {
        punchInTime: checkInTimeStr,
        punchInTimestamp: now,
        punchInPhoto: photoUrl,
        punchInLocation: location || 'Field Operations',
        punchInLatitude: latitude || null,
        punchInLongitude: longitude || null,
        notes: notes || 'Session 1'
      };

      record = new TechnicianAttendance({
        technicianId,
        technicianName,
        date: today,
        checkInTime: checkInTimeStr,
        checkInTimestamp: now,
        punchInPhoto: photoUrl,
        status: 'PRESENT',
        location: location || 'Field Operations',
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || 'Session 1',
        totalHours: 0,
        punches: [firstSession]
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
      checkInTime: checkInTimeStr,
      punchInPhoto: photoUrl,
      punchesCount: record.punches?.length || 1
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
    const { technicianId, location, latitude, longitude, notes } = req.body;
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

    if (!Array.isArray(record.punches)) {
      record.punches = [];
    }

    // Find the latest open session
    let activeSessionIndex = -1;
    for (let i = record.punches.length - 1; i >= 0; i--) {
      if (record.punches[i].punchInTimestamp && !record.punches[i].punchOutTimestamp) {
        activeSessionIndex = i;
        break;
      }
    }

    if (activeSessionIndex >= 0) {
      const session = record.punches[activeSessionIndex];
      session.punchOutTime = checkOutTimeStr;
      session.punchOutTimestamp = now;
      if (location) session.punchOutLocation = location;
      if (latitude) session.punchOutLatitude = latitude;
      if (longitude) session.punchOutLongitude = longitude;
      if (notes) session.notes = notes;

      const diffMs = now.getTime() - new Date(session.punchInTimestamp).getTime();
      const sessionHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
      session.durationHours = sessionHours;
    } else if (record.checkInTimestamp && !record.checkOutTimestamp) {
      const diffMs = now.getTime() - new Date(record.checkInTimestamp).getTime();
      const sessionHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
      record.punches.push({
        punchInTime: record.checkInTime || checkOutTimeStr,
        punchInTimestamp: record.checkInTimestamp || now,
        punchOutTime: checkOutTimeStr,
        punchOutTimestamp: now,
        durationHours: sessionHours,
        notes: notes || 'Single Session'
      });
    }

    // Recalculate cumulative totalHours from all completed sessions
    const cumulativeHours = record.punches.reduce((acc: number, p: any) => acc + (p.durationHours || 0), 0);
    record.totalHours = Math.round(cumulativeHours * 100) / 100;

    record.checkOutTime = checkOutTimeStr;
    record.checkOutTimestamp = now;
    record.status = 'OFF_DUTY';
    if (location) record.checkOutLocation = location;
    if (latitude) record.checkOutLatitude = latitude;
    if (longitude) record.checkOutLongitude = longitude;
    if (notes) record.notes = notes;

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
      checkOutTime: checkOutTimeStr,
      totalHours: record.totalHours,
      punchesCount: record.punches.length
    });

    res.json({ success: true, message: 'Check-Out Successful. You are now OFFLINE.', attendance: record });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

export default router;
