import express, { Request, Response } from 'express';
import TechnicianReport from '../models/TechnicianReport';
import Job from '../models/Job';

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

    // Deduplicate by jobCode (keep newest / most complete report)
    const seenJobCodes = new Set<string>();
    const uniqueReports = [];
    for (const r of reports) {
      const cleanCode = (r.jobCode || '').replace(/^#/, '').trim().toUpperCase();
      if (cleanCode && cleanCode !== 'DAILY WORK LOG') {
        if (seenJobCodes.has(cleanCode)) continue;
        seenJobCodes.add(cleanCode);
      }
      uniqueReports.push(r);
    }

    res.json(uniqueReports);
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
      isMultiDay, dayNumber, beforePhotos, afterPhotos,
      voiceNoteUrl, hasVoiceNote 
    } = req.body;
    
    const finalTechId = technicianId || 'TECH-01';
    const finalTechName = technicianName || 'Field Technician';
    const cleanJobCode = (jobCode || '').trim();

    // ⚡ If a report for this jobCode already exists, UPDATE it instead of creating a duplicate!
    if (cleanJobCode && cleanJobCode !== 'DAILY WORK LOG') {
      const existing = await TechnicianReport.findOne({ 
        jobCode: { $regex: new RegExp(`^#?${cleanJobCode.replace(/^#/, '')}$`, 'i') } 
      });

      if (existing) {
        existing.technicianId = finalTechId;
        existing.technicianName = finalTechName;
        existing.workDescription = workDescription || existing.workDescription;
        existing.activityType = activityType || existing.activityType;
        if (beforePhotos && beforePhotos.length > 0) existing.beforePhotos = beforePhotos;
        if (afterPhotos && afterPhotos.length > 0) existing.afterPhotos = afterPhotos;
        if (voiceNoteUrl) existing.voiceNoteUrl = voiceNoteUrl;
        existing.hasVoiceNote = Boolean(hasVoiceNote || (voiceNoteUrl && voiceNoteUrl.length > 0) || existing.hasVoiceNote);
        const saved = await existing.save();
        return res.status(200).json({ success: true, data: saved, message: 'Report updated successfully' });
      }
    }

    const report = new TechnicianReport({
      technicianId: finalTechId,
      technicianName: finalTechName,
      date: date || new Date().toISOString().split('T')[0],
      activityType: activityType || 'General Work',
      workDescription: workDescription || 'General daily log submitted',
      hoursWorked: hoursWorked != null ? Number(hoursWorked) : 8,
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      status: status || 'PRESENT',
      jobId: jobId || '',
      jobCode: cleanJobCode || '',
      customerName: customerName || '',
      location: location || '',
      isMultiDay: Boolean(isMultiDay),
      dayNumber: dayNumber || 1,
      beforePhotos: beforePhotos || [],
      afterPhotos: afterPhotos || [],
      voiceNoteUrl: voiceNoteUrl || '',
      hasVoiceNote: Boolean(hasVoiceNote || (voiceNoteUrl && voiceNoteUrl.length > 0)),
      approvedByAdmin: false
    });

    const savedReport = await report.save();
    res.status(201).json({ success: true, data: savedReport, message: 'Report submitted successfully' });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit report' });
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

// DELETE single report by Mongo ID, jobId, or jobCode
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(rawId);
    const cleanCode = rawId.replace(/^#/, '');

    const deleted = await TechnicianReport.findOneAndDelete({
      $or: [
        ...(isMongoId ? [{ _id: rawId }] : []),
        { jobId: rawId },
        { jobCode: rawId },
        { jobCode: `#${cleanCode}` },
        { jobCode: cleanCode }
      ]
    });

    // Also clear report attachments from any matching Job in MongoDB
    try {
      await Job.updateMany(
        { $or: [{ id: rawId }, { jobCode: rawId }, { jobCode: `#${cleanCode}` }, { jobCode: cleanCode }] },
        { $set: { beforePhotos: [], afterPhotos: [], fieldNotes: '', voiceNoteUrl: '', hasVoiceNote: false, dailyReports: [] } }
      );
    } catch (_) {}

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Server error deleting report' });
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
