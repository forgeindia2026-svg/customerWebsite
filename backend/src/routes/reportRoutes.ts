import express, { Request, Response } from 'express';
import TechnicianReport from '../models/TechnicianReport';

const router = express.Router();

// GET all reports with flexible query filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { technicianId, date, month } = req.query;
    
    let query: any = {};
    if (technicianId) query.technicianId = technicianId;
    if (date) query.date = date;
    if (month && typeof month === 'string') {
      query.date = { $regex: `^${month}` }; // Match YYYY-MM
    }

    const reports = await TechnicianReport.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new report / punch log
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      technicianId, technicianName, date, activityType, 
      workDescription, hoursWorked, checkInTime, checkOutTime, 
      status, jobId, jobCode, customerName, location, 
      isMultiDay, dayNumber, beforePhotos, afterPhotos 
    } = req.body;
    
    if (!technicianId || !technicianName) {
      return res.status(400).json({ message: 'Missing technician information' });
    }

    const report = new TechnicianReport({
      technicianId,
      technicianName,
      date: date || new Date().toISOString().split('T')[0],
      activityType: activityType || 'General Work',
      workDescription: workDescription || 'Shift logged',
      hoursWorked: hoursWorked != null ? hoursWorked : 8,
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      status: status || 'PRESENT',
      jobId: jobId || '',
      jobCode: jobCode || '',
      customerName: customerName || '',
      location: location || '',
      isMultiDay: Boolean(isMultiDay),
      dayNumber: dayNumber || 1,
      beforePhotos: beforePhotos || [],
      afterPhotos: afterPhotos || [],
      approvedByAdmin: false
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT approve report
router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const report = await TechnicianReport.findByIdAndUpdate(
      req.params.id,
      { approvedByAdmin: true },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE single report
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await TechnicianReport.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE cleanup test/mock reports
router.delete('/cleanup/all-test', async (req: Request, res: Response) => {
  try {
    await TechnicianReport.deleteMany({
      $or: [
        { technicianName: { $regex: /unknown|mock|test/i } },
        { technicianId: { $regex: /unknown|mock|test/i } },
        { workDescription: { $regex: /test|mock/i } },
        { activityType: { $regex: /test|mock/i } }
      ]
    });
    res.json({ success: true, message: 'All test reports cleaned up' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
