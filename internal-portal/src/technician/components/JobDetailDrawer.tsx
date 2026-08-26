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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CUSTOMER'>('OVERVIEW');
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
          {(['OVERVIEW', 'CUSTOMER'] as const).map((tab) => (
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
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Job Status & Allocation</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">Status: {String(job.status || 'IN_PROGRESS')}</p>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Assigned to: {
                      (job.assignedTechnicians && Array.isArray(job.assignedTechnicians) && job.assignedTechnicians.length > 0)
                        ? job.assignedTechnicians.map((t: any) => (typeof t === 'object' && t ? t.name : String(t))).join(', ')
                        : (typeof job.assignedTechnician === 'object' && job.assignedTechnician ? job.assignedTechnician.name : String(job.assignedTechnician || job.assignedTechnicianName || localStorage.getItem('user_name') || 'Assigned Technician'))
                    }
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(job.isAvailableToAccept || !job.isAssignedToMe || job.status === 'PENDING') && job.status !== 'COMPLETED' && (
                    <>
                      <button
                        disabled={isSubmitting}
                        onClick={() => onUpdateStatus(job.id, 'ACCEPTED')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Job</span>
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={() => onUpdateStatus(job.id, 'ON_HOLD')}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline Job</span>
                      </button>
                    </>
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





              {/* Installation Details Card */}
              <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-zinc-600" />
                  <span>Installation Equipment Details</span>
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Equipment Type</span>
                    <span className="font-semibold text-zinc-800">{job.installation?.equipmentType || job.category || 'CCTV Security System'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Model / Job Code</span>
                    <span className="font-mono text-zinc-800">{job.installation?.modelNumber || job.jobCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Serial Number</span>
                    <span className="font-mono text-zinc-800">{job.installation?.serialNumber || 'STD-SYS-2026'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Location Details</span>
                    <span className="text-zinc-800">{job.installation?.locationDetails || job.customer?.address || 'Standard Site Deployment'}</span>
                  </div>
                </div>

                {job.installation?.specialInstructions && (
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
                    <p><span className="font-medium text-zinc-900">Auditor:</span> {job.inspection?.inspectedBy || 'Lead Auditor'}</p>
                    <p><span className="font-medium text-zinc-900">Date:</span> {job.inspection?.inspectionDate || 'Today'}</p>
                    <p className="mt-2 p-2.5 bg-zinc-50 rounded border border-zinc-200 font-mono text-zinc-700">
                      {job.inspection?.notes || 'Standard QA inspection passed.'}
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
                    {(job.customer?.name || 'Customer').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">{job.customer?.name || 'Customer Account'}</h3>
                    <p className="text-xs text-zinc-500">Commercial Field Account</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-3 text-zinc-700">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span className="font-mono text-sm">{job.customer?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-zinc-700">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span>{job.customer?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start space-x-3 text-zinc-700">
                    <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span>{job.customer?.address || 'Site Address'}, {job.customer?.city || ''} {job.customer?.postalCode || ''}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${job.customer?.address || ''}, ${job.customer?.city || ''}`
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
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Job ID: {job.id || job.jobCode}</span>
          <span>Last Updated: {job.updatedAt ? new Date(job.updatedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
