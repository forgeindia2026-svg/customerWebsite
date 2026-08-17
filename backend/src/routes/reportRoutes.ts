import express, { Request, Response } from 'express';
import TechnicianReport from '../models/TechnicianReport';

const router = express.Router();

// GET all reports
router.get('/', async (req: Request, res: Response) => {
  try {
    const { technicianId, date } = req.query;
    
    let query: any = {};
    if (technicianId) query.technicianId = technicianId;
    if (date) query.date = date;

    const reports = await TechnicianReport.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new report
router.post('/', async (req: Request, res: Response) => {
  try {
    const { technicianId, technicianName, date, activityType, workDescription, hoursWorked, jobId } = req.body;
    
    if (!technicianId || !technicianName || !date || !activityType || !workDescription || hoursWorked == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const report = new TechnicianReport({
      technicianId,
      technicianName,
      date,
      activityType,
      workDescription,
      hoursWorked,
      jobId
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
