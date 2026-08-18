import Job from '../models/Job';
import User from '../models/User';
import Dashboard from '../models/Dashboard';
import { emitToRole } from '../socket';

export const processWaitingQueue = async () => {
  try {
    // Find all available technicians
    const availableTechs = await User.find({ role: 'TECHNICIAN', isAvailable: true, isActive: true });
    
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
