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

    const reports = await TechnicianReport.find(query).sort({ updatedAt: -1, createdAt: -1 });

    // Return all submitted daily reports as distinct historical entries
    const uniqueReports: any[] = reports.map(r => r.toObject());

    // Resolve any MongoDB ObjectID photo references to actual URLs
    // The mobile app sometimes stores the photo's ObjectID instead of the URL
    const isMongoId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);

    // Collect all IDs that need resolving
    const allPhotoIds: Set<string> = new Set();
    for (const rep of uniqueReports) {
      for (const p of [...(rep.beforePhotos || []), ...(rep.afterPhotos || [])]) {
        if (typeof p === 'string' && isMongoId(p)) allPhotoIds.add(p);
      }
    }

    // Build a map: photoId -> url by scanning all Jobs
    const photoIdToUrl: Record<string, string> = {};
    if (allPhotoIds.size > 0) {
      const jobs = await Job.find({
        $or: [
          { 'beforePhotos.id': { $in: Array.from(allPhotoIds) } },
          { 'afterPhotos.id': { $in: Array.from(allPhotoIds) } },
          { 'proofImages.id': { $in: Array.from(allPhotoIds) } },
        ]
      }).select('beforePhotos afterPhotos proofImages').lean();

      for (const job of jobs) {
        const allJobPhotos = [
          ...(job.beforePhotos || []),
          ...(job.afterPhotos || []),
          ...(job.proofImages || []),
        ];
        for (const photo of allJobPhotos as any[]) {
          if (photo?.id && photo?.url) {
            photoIdToUrl[photo.id] = photo.url;
          }
          if (photo?._id && photo?.url) {
            photoIdToUrl[String(photo._id)] = photo.url;
          }
        }
      }
    }

    // Replace any ObjectID strings with the real URL (skip if URL not found)
    const resolvePhotos = (photos: string[]) =>
      (photos || [])
        .map((p: string) => {
          if (typeof p === 'string' && isMongoId(p)) {
            return photoIdToUrl[p] || null; // null means not resolvable, will be filtered
          }
          return p;
        })
        .filter(Boolean);

    for (const rep of uniqueReports) {
      rep.beforePhotos = resolvePhotos(rep.beforePhotos || []);
      rep.afterPhotos = resolvePhotos(rep.afterPhotos || []);

      // If the report photos are empty or corrupted (e.g. "[object Object]"), fallback to pulling them directly from the Job
      // Ensure customerPhone and photos are resolved from matching Job
      if (rep.jobCode) {
        const cleanCode = rep.jobCode.replace(/^#/, '');
        const matchingJob = await Job.findOne({ 
          $or: [{ jobCode: rep.jobCode }, { jobCode: cleanCode }, { jobCode: `#${cleanCode}` }]
        }).lean();
        
        if (matchingJob) {
          if (!rep.customerPhone && matchingJob.customer?.phone) {
            rep.customerPhone = matchingJob.customer.phone;
          }
          const isCorrupted = (photos: any[]) => photos.length === 0 || photos.some(p => p === '[object Object]' || (typeof p === 'string' && p.includes('[object Object]')));
          if (isCorrupted(rep.beforePhotos) && matchingJob.beforePhotos && matchingJob.beforePhotos.length > 0) {
            rep.beforePhotos = matchingJob.beforePhotos.map((p: any) => p.url || p);
          }
          if (isCorrupted(rep.afterPhotos) && matchingJob.afterPhotos && matchingJob.afterPhotos.length > 0) {
            rep.afterPhotos = matchingJob.afterPhotos.map((p: any) => p.url || p);
          }
        }
      }
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
      technicianId, technicianName, technicianRole: reqRole, isSubTechnician, date, activityType, 
      workDescription, hoursWorked, checkInTime, checkOutTime, 
      status, jobStatus, jobId, jobCode, customerName, customerPhone, location, 
      isMultiDay, dayNumber, beforePhotos, afterPhotos,
      voiceNoteUrl, hasVoiceNote, time: reqTime
    } = req.body;
    
    const finalTechId = technicianId || 'TECH-01';
    const finalTechName = technicianName || 'Field Technician';
    const cleanJobCode = (jobCode || '').trim();
    const currentSubmissionTime = reqTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Find linked job if jobCode is present to determine Main vs Sub Technician
    let isSubTech = Boolean(isSubTechnician) || (typeof reqRole === 'string' && reqRole.toUpperCase() === 'SUB');
    let matchingJob: any = null;

    if (cleanJobCode && cleanJobCode !== 'DAILY WORK LOG') {
      const strippedCode = cleanJobCode.replace(/^#/, '');
      matchingJob = await Job.findOne({
        $or: [
          { jobCode: cleanJobCode },
          { jobCode: strippedCode },
          { jobCode: `#${strippedCode}` }
        ]
      });

      if (matchingJob) {
        // Check if technician is listed in subTechnicians
        const isListedSubTech = (matchingJob.subTechnicians || []).some((st: string) => 
          st.toLowerCase().trim() === finalTechName.toLowerCase().trim() ||
          st.toLowerCase().trim() === finalTechId.toLowerCase().trim()
        );
        if (isListedSubTech) {
          isSubTech = true;
        }
      }
    }

    const determinedRole = isSubTech ? 'SUB' : (reqRole || 'MAIN');

    // Sub Technicians can submit daily progress reports (IN_PROGRESS), but cannot set jobStatus to COMPLETED.
    // Only Main Technicians can complete a job.
    let finalJobStatus = jobStatus || (
      (status && status.toUpperCase().includes('COMPLET')) ? 'COMPLETED' : 'IN_PROGRESS'
    );

    if (isSubTech && finalJobStatus === 'COMPLETED') {
      finalJobStatus = 'IN_PROGRESS'; // Restrict Sub-Technician completion override
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // If a report for this jobCode AND date already exists, UPDATE it in-place!
    if (cleanJobCode && cleanJobCode !== 'DAILY WORK LOG') {
      const existing = await TechnicianReport.findOne({ 
        jobCode: { $regex: new RegExp(`^#?${cleanJobCode.replace(/^#/, '')}$`, 'i') },
        date: targetDate
      });

      if (existing) {
        existing.technicianId = finalTechId;
        existing.technicianName = finalTechName;
        existing.technicianRole = determinedRole;
        existing.date = date || new Date().toISOString().split('T')[0];
        existing.time = currentSubmissionTime;
        if (workDescription) existing.workDescription = workDescription;
        if (activityType) existing.activityType = activityType;
        if (customerName) existing.customerName = customerName;
        if (customerPhone) existing.customerPhone = customerPhone;
        if (location) existing.location = location;
        
        // Update jobStatus (Sub Techs stay IN_PROGRESS, Main Tech can set COMPLETED)
        if (isSubTech) {
          if (!existing.jobStatus) existing.jobStatus = 'IN_PROGRESS';
        } else {
          if (jobStatus) existing.jobStatus = jobStatus;
          else if (finalJobStatus === 'COMPLETED') existing.jobStatus = 'COMPLETED';
        }

        // Merge Before Photos (preserve unique URLs)
        if (beforePhotos && beforePhotos.length > 0) {
          const beforeSet = new Set(existing.beforePhotos || []);
          beforePhotos.forEach((p: string) => beforeSet.add(p));
          existing.beforePhotos = Array.from(beforeSet);
        }

        // Merge After Photos (preserve unique URLs)
        if (afterPhotos && afterPhotos.length > 0) {
          const afterSet = new Set(existing.afterPhotos || []);
          afterPhotos.forEach((p: string) => afterSet.add(p));
          existing.afterPhotos = Array.from(afterSet);
        }

        if (voiceNoteUrl) existing.voiceNoteUrl = voiceNoteUrl;
        existing.hasVoiceNote = Boolean(hasVoiceNote || (voiceNoteUrl && voiceNoteUrl.length > 0) || existing.hasVoiceNote);
        existing.updatedAt = new Date();

        const saved = await existing.save();

        // If Main Tech marked it as COMPLETED, update Job status as well
        if (matchingJob && !isSubTech && finalJobStatus === 'COMPLETED') {
          matchingJob.status = 'COMPLETED';
          matchingJob.completedAt = new Date();
          await matchingJob.save();
        }

        return res.status(200).json({ success: true, data: saved, message: 'Report updated successfully' });
      }
    }

    const report = new TechnicianReport({
      technicianId: finalTechId,
      technicianName: finalTechName,
      technicianRole: determinedRole,
      date: date || new Date().toISOString().split('T')[0],
      time: currentSubmissionTime,
      activityType: activityType || 'General Work',
      workDescription: workDescription || 'General daily log submitted',
      hoursWorked: hoursWorked != null ? Number(hoursWorked) : 8,
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      status: status || 'PRESENT',
      jobId: jobId || '',
      jobCode: cleanJobCode || '',
      jobStatus: finalJobStatus,
      customerName: customerName || '',
      customerPhone: customerPhone || '',
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

    // If Main Tech marked it as COMPLETED, update Job status as well
    if (matchingJob && !isSubTech && finalJobStatus === 'COMPLETED') {
      matchingJob.status = 'COMPLETED';
      matchingJob.completedAt = new Date();
      await matchingJob.save();
    }

    res.status(201).json({ success: true, data: savedReport, message: 'Report submitted successfully' });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit report' });
  }
});

// PUT approve report
router.put('/:id/approve', async (req: Request, res: Response) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(rawId);

    // Find report by Mongo ID or jobCode
    const report = await TechnicianReport.findOneAndUpdate(
      {
        $or: [
          ...(isMongoId ? [{ _id: rawId }] : []),
          { jobId: rawId },
          { jobCode: rawId },
        ]
      },
      { approvedByAdmin: true },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Also update the linked Job/Order status to COMPLETED
    if (report.jobId || report.jobCode) {
      const cleanCode = String(report.jobCode || '').replace(/^#/, '');
      await Job.findOneAndUpdate(
        {
          $or: [
            ...(report.jobId ? [{ id: report.jobId }, { _id: report.jobId.length === 24 ? report.jobId : undefined }] : []),
            { jobCode: report.jobCode },
            { jobCode: `#${cleanCode}` },
            { jobCode: cleanCode },
          ].filter(Boolean)
        },
        { $set: { status: 'COMPLETED', completedAt: new Date() } }
      );
    }

    res.json(report);
  } catch (error) {
    console.error('Approve error:', error);
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
