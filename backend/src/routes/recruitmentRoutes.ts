import { Router, Request, Response } from 'express';
import HrReference from '../models/HrReference';
import CandidateApplication from '../models/CandidateApplication';

const router = Router();

// Middleware to check Admin authorization
const requireAdmin = (req: Request, res: Response, next: any) => {
  const role = (req.headers['role'] || req.headers['user-role'] || '').toString().toUpperCase();
  // Allow ADMIN or SUPER_ADMIN (or fallback if header not passed in dev)
  if (role && role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'HR') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Admin can modify HR references.' });
  }
  next();
};

// Seed initial HR References and Applications if collection is empty
const seedRecruitmentData = async () => {
  try {
    const hrCount = await HrReference.countDocuments();
    if (hrCount === 0) {
      await HrReference.insertMany([
        { hrName: 'Priyadharshini', hrCode: 'HR-27394', email: 'priya.hr@sktechnology.com', phone: '9876543210', department: 'Human Resources', status: 'ACTIVE' },
        { hrName: 'Mohammed', hrCode: 'HR-36295', email: 'mohammed.hr@sktechnology.com', phone: '9876543211', department: 'Talent Acquisition', status: 'ACTIVE' },
        { hrName: 'Anitha', hrCode: 'HR-18492', email: 'anitha.hr@sktechnology.com', phone: '9876543212', department: 'Human Resources', status: 'ACTIVE' },
      ]);
      console.log('✅ Initial HR References seeded successfully.');
    }

    const appCount = await CandidateApplication.countDocuments();
    if (appCount === 0) {
      await CandidateApplication.insertMany([
        {
          applicantName: 'Munikaprasanna',
          email: 'munikaprasanna651@gmail.com',
          city: 'Vellore',
          appliedJob: 'Relationship Manager',
          company: 'IDFC First Bank',
          appliedOn: '10/5/2026',
          hrReference: { hrName: 'Priyadharshini', hrCode: 'HR-27394' },
          payment: { amount: 49, transactionId: 'pay_Tk6vspLO3AI1J1', status: 'Applied' },
          status: 'Applied',
        },
        {
          applicantName: 'Agilavarthani',
          email: 'agilavarthani@gmail.com',
          city: 'Puducherry',
          appliedJob: 'customer support officer',
          company: 'YES Bank',
          appliedOn: '10/5/2026',
          hrReference: { hrName: 'Mohammed', hrCode: 'HR-36295' },
          payment: { amount: 49, transactionId: 'pay_Tk7xqpLO3AI9K2', status: 'Applied' },
          status: 'Applied',
        },
      ]);
      console.log('✅ Initial Candidate Applications seeded successfully.');
    }
  } catch (err) {
    console.warn('Recruitment seed warning:', err);
  }
};

// Run seed check on module load
seedRecruitmentData();

// 1. GET all HR references
router.get('/hr-references', async (req: Request, res: Response) => {
  try {
    const references = await HrReference.find().sort({ createdAt: -1 });
    res.json({ success: true, count: references.length, data: references });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST create new HR reference (Admin Only)
router.post('/hr-references', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { hrName, hrCode, email, phone, department } = req.body;
    if (!hrName || !hrName.trim()) {
      return res.status(400).json({ success: false, message: 'HR Name is required.' });
    }

    const cleanCode = (hrCode || `HR-${Math.floor(10000 + Math.random() * 90000)}`).toUpperCase().trim();

    const existing = await HrReference.findOne({ hrCode: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `HR Code ${cleanCode} already exists.` });
    }

    const newRef = await HrReference.create({
      hrName: hrName.trim(),
      hrCode: cleanCode,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      department: department ? department.trim() : 'Human Resources',
      status: 'ACTIVE',
    });

    res.status(21).json({ success: true, message: 'New HR Reference added successfully!', data: newRef });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET all candidate applications
router.get('/applications', async (req: Request, res: Response) => {
  try {
    const applications = await CandidateApplication.find().sort({ createdAt: -1 });
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. PUT update candidate HR Reference (Admin Only)
router.put('/applications/:id/hr-reference', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hrName, hrCode, hrId } = req.body;

    if (!hrName) {
      return res.status(400).json({ success: false, message: 'HR Name is required.' });
    }

    const app = await CandidateApplication.findById(id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Candidate application not found.' });
    }

    app.hrReference = {
      hrName: hrName.trim(),
      hrCode: hrCode ? hrCode.trim() : (app.hrReference?.hrCode || 'HR-10000'),
      hrId: hrId || app.hrReference?.hrId,
    };

    await app.save();

    res.json({ success: true, message: `HR Reference updated to ${hrName} successfully!`, data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. PUT update application status
router.put('/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const app = await CandidateApplication.findById(id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Candidate application not found.' });
    }

    app.status = status || app.status;
    await app.save();

    res.json({ success: true, message: 'Application status updated.', data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
