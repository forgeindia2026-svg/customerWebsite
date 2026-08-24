import Job from '../models/Job';
import User from '../models/User';
import Dashboard from '../models/Dashboard';
import { emitToRole } from '../socket';

export const processWaitingQueue = async () => {
  try {
    // 1. Fetch all active technicians
    const allTechs = await User.find({ role: 'TECHNICIAN', isActive: true });
    
    // 2. Find all currently active unfinished jobs
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

    const availableTechs = allTechs.filter((t: any) => 
      !busyTechIds.has(t._id.toString()) && 
      !busyTechNames.has(t.name.toLowerCase().trim())
    );
    
    if (availableTechs.length === 0) {
      return; // No one available
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
