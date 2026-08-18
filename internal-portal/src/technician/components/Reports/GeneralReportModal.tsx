import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface GeneralReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  checkInTimestamp?: string | null;
}

export const GeneralReportModal: React.FC<GeneralReportModalProps> = ({ isOpen, onClose, onSubmit, checkInTimestamp }) => {
  const getInitialHours = () => {
    const authUser = JSON.parse(localStorage.getItem('tech_user') || '{}');
    const techId = authUser.id || authUser._id || 'TECH-01';
    const checkInTime = checkInTimestamp || localStorage.getItem(`tech_checkin_${techId}`);
    if (checkInTime) {
      const diffMs = Date.now() - new Date(checkInTime).getTime();
      return Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);
    }
    return 8;
  };

  const [activityType, setActivityType] = useState('Office Work');
  const [hoursWorked, setHoursWorked] = useState<number>(getInitialHours());
  const [workDescription, setWorkDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate dynamic hours every time modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setHoursWorked(getInitialHours());
    }
  }, [isOpen, checkInTimestamp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({
      activityType,
      hoursWorked,
      workDescription,
      date: new Date().toISOString().split('T')[0]
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white">Submit General Daily Log</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs mb-2">
            You do not have any active customer jobs. Use this form to log your general daily activities for the admin.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white"
            >
              <option value="Office Work">Office Work</option>
              <option value="Maintenance">Equipment Maintenance</option>
              <option value="Standby">Standby / Idle</option>
              <option value="Leave">On Leave / Paid Time Off</option>
              <option value="Customer Job">Other Customer Job (Unassigned)</option>
            </select>
          </div>


          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Work Description</label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="Describe what you worked on today..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !workDescription.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Submit Daily Log
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
