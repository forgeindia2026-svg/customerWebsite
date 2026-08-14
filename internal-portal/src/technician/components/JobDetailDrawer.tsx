import { useState } from 'react';
import type { Job, JobPhoto, JobActivity, JobStatus } from '../types/job';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Wrench,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Upload,
  ExternalLink
} from 'lucide-react';

import { formatDate, calculateJobDaysStats } from '../services/dateUtils';

interface JobDetailDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: JobStatus, note?: string) => Promise<void>;
  onUploadPhoto: (jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER') => Promise<void>;
}

export const JobDetailDrawer = ({
  job,
  isOpen,
  onClose,
  onUpdateStatus,
  onUploadPhoto,
}: JobDetailDrawerProps) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CUSTOMER' | 'PHOTOS' | 'TIMELINE'>('OVERVIEW');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoType, setPhotoType] = useState<'BEFORE' | 'AFTER'>('BEFORE');
  const [mockPhotoIndex, setMockPhotoIndex] = useState(1);
  const [liveTracking, setLiveTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  if (!isOpen || !job) return null;

  const toggleLiveTracking = () => {
    if (liveTracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setLiveTracking(false);
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/jobs/${job.id}/location`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lat: latitude,
                lng: longitude,
                technicianId: localStorage.getItem('user_id') || 'tech_123',
              }),
            });
          } catch (err) {
            console.error('Location sync error:', err);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      setWatchId(id);
      setLiveTracking(true);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    setIsSubmitting(true);
    try {
      await onUpdateStatus(job.id, newStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSamplePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoCaption.trim()) return;

    setIsSubmitting(true);
    const sampleUrls = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=600&q=80',
    ];
    const chosenUrl = sampleUrls[mockPhotoIndex % sampleUrls.length];
    setMockPhotoIndex((prev) => prev + 1);

    try {
      await onUploadPhoto(job.id, chosenUrl, photoCaption, photoType);
      setPhotoCaption('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-in-right">

        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-zinc-500">{job.jobCode}</span>
              <StatusBadge status={job.status} size="sm" />
              <StatusBadge priority={job.priority} size="sm" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mt-1">{job.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 px-6 bg-white space-x-6 text-sm font-medium">
          {(['OVERVIEW', 'CUSTOMER', 'PHOTOS', 'TIMELINE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 border-b-2 transition-colors ${activeTab === tab
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Quick Action Bar */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Job Quick Status Action</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">Current: {job.status}</p>
                  <p className="text-xs font-medium text-sky-600 mt-0.5">
                    {job.assignedTechnicians && job.assignedTechnicians.length > 0 
                      ? `Assigned to: ${job.assignedTechnicians.map(t => t.name).join(', ')}` 
                      : 'Available (Unassigned)'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {(job.isAvailableToAccept || !job.isAssignedToMe || job.status === 'PENDING') && job.status !== 'COMPLETED' && (
                    <button
                      disabled={isSubmitting}
                      onClick={() => onUpdateStatus(job.id, 'ACCEPTED')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Job</span>
                    </button>
                  )}
                  {job.isAssignedToMe && job.status === 'ACCEPTED' && (
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Job</span>
                    </button>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={toggleLiveTracking}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          liveTracking
                            ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{liveTracking ? 'Sharing Location Live...' : 'Start GPS Tracking'}</span>
                      </button>
                      <button
                        disabled={isSubmitting || !job.beforePhotos?.length || !job.afterPhotos?.length}
                        onClick={() => {
                          if (!job.beforePhotos?.length || !job.afterPhotos?.length) {
                            alert('You must upload at least one Before photo and one After photo to complete this job.');
                            return;
                          }
                          handleStatusChange('COMPLETED');
                        }}
                        title={(!job.beforePhotos?.length || !job.afterPhotos?.length) ? "Requires Before & After photos" : ""}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center space-x-2 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Job</span>
                      </button>
                    </>
                  )}
                  {job.status !== 'ON_HOLD' && job.status !== 'COMPLETED' && (
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleStatusChange('ON_HOLD')}
                      className="px-3.5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-medium rounded-lg transition-colors"
                    >
                      Put On Hold
                    </button>
                  )}
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                  <div className="flex items-center space-x-2 text-zinc-500 text-xs font-medium mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Scheduled Slot</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{formatDate(job.scheduledDate)}</p>
                  <p className="text-xs text-zinc-600">{job.scheduledTimeSlot}</p>
                </div>

                <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                  <div className="flex items-center space-x-2 text-zinc-500 text-xs font-medium mb-1">
                    <Wrench className="w-4 h-4" />
                    <span>Category & Duration</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{job.category}</p>
                  <p className="text-xs text-zinc-600">Est. {job.estimatedDuration}</p>
                </div>
              </div>

              {/* Date Tracking & Day Calculation Card */}
              {(() => {
                const daysStats = calculateJobDaysStats(job);
                return (
                  <div className="border border-sky-100 rounded-xl p-5 bg-gradient-to-br from-sky-50/50 to-white space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-sky-600" />
                        <span>Project Date Schedule & Day Calculation</span>
                      </h3>
                      <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${daysStats.isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : job.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-sky-100 text-sky-800'
                        }`}>
                        {daysStats.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white border border-zinc-200/80 rounded-lg">
                        <span className="text-zinc-400 block font-medium">Start Date</span>
                        <span className="font-bold text-zinc-900">{formatDate(daysStats.startDate)}</span>
                      </div>
                      <div className="p-3 bg-white border border-zinc-200/80 rounded-lg">
                        <span className="text-zinc-400 block font-medium">Target Finish</span>
                        <span className="font-bold text-zinc-900">{formatDate(daysStats.targetCompletionDate)}</span>
                      </div>
                      <div className="p-3 bg-white border border-zinc-200/80 rounded-lg">
                        <span className="text-zinc-400 block font-medium">Actual Finish</span>
                        <span className="font-bold text-zinc-900">
                          {daysStats.actualCompletionDate ? formatDate(daysStats.actualCompletionDate) : 'Ongoing'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Role Specific Day Breakdowns */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                        <span>Timeline Progress ({daysStats.elapsedDays} of {daysStats.totalTargetDays} Days Elapsed)</span>
                        <span className="font-bold text-zinc-900">{daysStats.dayProgressPercentage}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${daysStats.isOverdue ? 'bg-rose-500' : job.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-sky-500'
                            }`}
                          style={{ width: `${daysStats.dayProgressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 bg-sky-50/80 rounded border border-sky-100">
                        <span className="font-bold text-sky-900 block">👤 Admin Metric</span>
                        <span className="text-sky-700">{daysStats.totalTargetDays} Total Days Allocated</span>
                      </div>
                      <div className="p-2 bg-amber-50/80 rounded border border-amber-100">
                        <span className="font-bold text-amber-900 block">🛠️ Tech Logged</span>
                        <span className="text-amber-700">{daysStats.totalReportedDays} Work Days Logged</span>
                      </div>
                      <div className="p-2 bg-emerald-50/80 rounded border border-emerald-100">
                        <span className="font-bold text-emerald-900 block">🏢 Customer Timeline</span>
                        <span className="text-emerald-700">Est. {daysStats.totalTargetDays} Days Project</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Installation Details Card */}
              <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-zinc-600" />
                  <span>Installation Equipment Details</span>
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Equipment Type</span>
                    <span className="font-semibold text-zinc-800">{job.installation.equipmentType}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Model Number</span>
                    <span className="font-mono text-zinc-800">{job.installation.modelNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Serial Number</span>
                    <span className="font-mono text-zinc-800">{job.installation.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Location Details</span>
                    <span className="text-zinc-800">{job.installation.locationDetails}</span>
                  </div>
                </div>

                {job.installation.specialInstructions && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Special Instructions: </span>
                      {job.installation.specialInstructions}
                    </div>
                  </div>
                )}
              </div>

              {/* Inspection Summary if available */}
              {job.inspection && (
                <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center space-x-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    <span>Inspection Summary</span>
                  </h3>
                  <div className="text-xs text-zinc-600 space-y-1">
                    <p><span className="font-medium text-zinc-900">Auditor:</span> {job.inspection.inspectedBy}</p>
                    <p><span className="font-medium text-zinc-900">Date:</span> {job.inspection.inspectionDate}</p>
                    <p className="mt-2 p-2.5 bg-zinc-50 rounded border border-zinc-200 font-mono text-zinc-700">
                      {job.inspection.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOMER INFORMATION */}
          {activeTab === 'CUSTOMER' && (
            <div className="space-y-6">
              <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-800 text-sm">
                    {job.customer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">{job.customer.name}</h3>
                    <p className="text-xs text-zinc-500">Commercial Field Account</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-3 text-zinc-700">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span className="font-mono text-sm">{job.customer.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-zinc-700">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>{job.customer.email}</span>
                  </div>
                  <div className="flex items-start space-x-3 text-zinc-700">
                    <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span>{job.customer.address}, {job.customer.city} {job.customer.postalCode}</span>
                  </div>
                </div>
              </div>

              {/* Customer Live Status Notification Card */}
              <div className="border border-emerald-200/80 rounded-xl p-5 bg-emerald-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>CUSTOMER DISPATCH NOTIFICATION</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    SMS & EMAIL SENT
                  </span>
                </div>

                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  {job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS'
                    ? `📱 Notification dispatched to customer ${job.customer.name}: "Technician Alex Vance has accepted your work order (${job.jobCode}) and is en route/active on site."`
                    : `📱 Customer dispatch notification ready for automated SMS delivery upon technician acceptance.`
                  }
                </p>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-mono text-emerald-800">
                  <span>Recipient: {job.customer.email}</span>
                  <span className="font-bold">Status: Delivered ✓</span>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${job.customer.address}, ${job.customer.city}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <span>Open Navigation Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: BEFORE & AFTER PHOTOS */}
          {activeTab === 'PHOTOS' && (
            <div className="space-y-6">
              {/* Photo Upload Form */}
              <form onSubmit={handleAddSamplePhoto} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Attach Inspection Photo
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-500 mb-1">Photo Category</label>
                    <select
                      value={photoType}
                      onChange={(e) => setPhotoType(e.target.value as 'BEFORE' | 'AFTER')}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg font-medium text-zinc-900"
                    >
                      <option value="BEFORE">Before Photo</option>
                      <option value="AFTER">After Photo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Caption / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Wiring terminal setup"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !photoCaption.trim()}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Inspection Evidence Photo</span>
                </button>
              </form>

              {/* Before Photos Gallery */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Before Photos ({job.beforePhotos.length})
                </h4>
                {job.beforePhotos.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No before photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {job.beforePhotos.map((photo: JobPhoto) => (
                      <div key={photo.id} className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover" />
                        <div className="p-2.5 text-xs">
                          <p className="font-medium text-zinc-800 truncate">{photo.caption}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{photo.uploadedAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* After Photos Gallery */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  After Photos ({job.afterPhotos.length})
                </h4>
                {job.afterPhotos.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No after photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {job.afterPhotos.map((photo: JobPhoto) => (
                      <div key={photo.id} className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <img src={photo.url} alt={photo.caption} className="w-full h-32 object-cover" />
                        <div className="p-2.5 text-xs">
                          <p className="font-medium text-zinc-800 truncate">{photo.caption}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{photo.uploadedAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Audit Trail & Activity
              </h4>
              <div className="relative pl-6 border-l-2 border-zinc-200 space-y-6">
                {job.activities.map((act: JobActivity) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-zinc-900 border-2 border-white"></div>
                    <div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-zinc-900">{act.action}</span>
                        <span className="text-zinc-400">• {act.timestamp}</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">{act.details}</p>
                      <span className="text-[10px] font-mono text-zinc-400 mt-1 block">By {act.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Job ID: {job.id}</span>
          <span>Last Updated: {new Date(job.updatedAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
