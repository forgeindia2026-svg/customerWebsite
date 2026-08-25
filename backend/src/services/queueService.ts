import Job from '../models/Job';
import User from '../models/User';
import Dashboard from '../models/Dashboard';
import TechnicianAttendance from '../models/TechnicianAttendance';
import { emitToRole, broadcastEvent } from '../socket';

export const processWaitingQueue = async () => {
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    // 1. Fetch technicians who have PUNCHED IN today and are NOT OFF_DUTY (Online & On-Duty)
    const todayAttendance = await TechnicianAttendance.find({
      date: today,
      status: { $in: ['PRESENT', 'HALF_DAY', 'OVERTIME'] }
    });

    const onlineTechIds = new Set<string>();
    const onlineTechNames = new Set<string>();
    todayAttendance.forEach(att => {
      if (att.technicianId) onlineTechIds.add(att.technicianId.toString());
      if (att.technicianName) onlineTechNames.add(att.technicianName.toLowerCase().trim());
    });

    if (onlineTechIds.size === 0 && onlineTechNames.size === 0) {
      return; // No technicians online today
    }

    // 2. Fetch all active registered technicians
    const allTechs = await User.find({ role: 'TECHNICIAN', isActive: true });
    
    // 3. Find all currently active unfinished jobs
    const activeJobs = await Job.find({
      status: { $in: ['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED', 'ASSIGNMENT_PENDING_ACCEPTANCE', 'WAITING_ADMIN_APPROVAL'] }
    } as any);

    const busyTechIds = new Set<string>();
    const busyTechNames = new Set<string>();
    activeJobs.forEach((j: any) => {
      (j.assignedTechnicians || []).forEach((t: any) => {
        if (t.id) busyTechIds.add(t.id.toString());
        if (t.name) busyTechNames.add(t.name.toLowerCase().trim());
      });
    });

    // Online (Punched In Today) AND Not Busy with an active job
    const availableTechs = allTechs.filter((t: any) => {
      const isOnline = onlineTechIds.has(t._id.toString()) || onlineTechNames.has(t.name.toLowerCase().trim());
      const isBusy = busyTechIds.has(t._id.toString()) || busyTechNames.has(t.name.toLowerCase().trim());
      return isOnline && !isBusy;
    });
    
    if (availableTechs.length === 0) {
      return; // No online technician available
    }

    for (const tech of availableTechs) {
      // Find the oldest WAITING_FOR_TECH job that this tech hasn't rejected
      const nextJob = await Job.findOne({
        status: 'WAITING_FOR_TECH',
        rejectedTechnicianIds: { $ne: tech._id.toString() }
      }).sort({ createdAt: 1 });

      if (nextJob) {
        // Assign this job to the available tech
        tech.isAvailable = false;
        tech.currentJobId = nextJob.jobCode;
        await tech.save();

        nextJob.status = 'ASSIGNMENT_PENDING_ACCEPTANCE';
        if (!nextJob.assignedTechnicians) {
          nextJob.assignedTechnicians = [];
        }
        nextJob.assignedTechnicians = [{
          id: tech._id.toString(),
          name: tech.name,
          phone: tech.phone || '',
          avatar: tech.avatar || ''
        }];
        await nextJob.save();

        // Add Notification for Dashboard
        let dashboardData = await Dashboard.findOne();
        if (!dashboardData) {
          dashboardData = new Dashboard();
        }
        dashboardData.notifications.push({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: 'Automated Job Assignment from Queue',
          message: `Job ${nextJob.jobCode} assigned to ${tech.name} from the waiting queue.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'ASSIGNMENT',
          jobId: nextJob.jobCode
        });
        await dashboardData.save();

        // Broadcast real-time updates
        emitToRole('admin', 'job:auto_assigned', {
          jobId: nextJob._id,
          jobCode: nextJob.jobCode,
          technician: tech.name,
          status: nextJob.status
        });
      }
    }
  } catch (err) {
    console.error('Error processing job queue:', err);
  }
};
