import React, { useState, useRef } from 'react';
import type { TechnicianProfile } from '../../types/job';
import { JobsApiService } from '../../services/apiService';
import { 
  Award, 
  Truck, 
  CheckCircle2, 
  Star,
  LogOut,
  Camera,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface ProfileModuleProps {
  profile: TechnicianProfile;
  onUpdateStatus?: (status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_JOB') => Promise<void>;
  onUpdateAvatar?: (newAvatarUrl: string) => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  profile,
  onUpdateAvatar,
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<string>(profile.avatarUrl);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setStatusMessage(null);
    setPhotoModalOpen(false);

    try {
      // 1. Upload to S3 with automatic client-side compression (~300KB) and base64 fallback
      const uploadedUrl = await JobsApiService.uploadImageToS3(file);
      
      // 2. Persist in backend and localStorage
      await JobsApiService.updateTechnicianAvatar(uploadedUrl);

      // 3. Update local state and parent state
      setCurrentAvatar(uploadedUrl);
      onUpdateAvatar?.(uploadedUrl);

      setStatusMessage({ text: '✅ Profile photo updated successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update avatar:', err);
      setStatusMessage({ text: '⚠️ Failed to update photo. Please try again.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden File Inputs for Direct Camera vs Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        capture="user"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          
          {/* Avatar with Camera Badge */}
          <div className="relative group shrink-0 w-16 h-16 sm:w-20 sm:h-20">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-zinc-900 bg-zinc-100 flex items-center justify-center relative shadow-sm"
            >
              <img
                src={currentAvatar}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full aspect-square block"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2874F0&color=fff&size=150`;
                }}
              />

              {/* Uploading Overlay */}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[8px] sm:text-[9px] font-bold">Uploading</span>
                </div>
              )}
            </div>

            {/* Camera Edit Badge Button */}
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              disabled={isUploadingPhoto}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-90 transition-transform"
              title="Change Profile Photo"
            >
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {/* Name and Tech Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 leading-tight truncate">
                {profile.name}
              </h2>
              <span className="text-[10px] sm:text-xs font-mono font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md w-fit whitespace-nowrap">
                {profile.badgeNumber}
              </span>
            </div>

            <p className="text-xs text-zinc-500 font-medium mt-0.5">{profile.role}</p>

            {/* Stats Chips (Neat Pills that never wrap awkwardly) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-[11px] font-bold text-amber-800 whitespace-nowrap">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{profile.rating} Rating</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-[11px] font-bold text-blue-800 whitespace-nowrap">
                <span>{profile.completedJobsCount} Work Orders Completed</span>
              </span>
            </div>

            {/* Quick Upload Link */}
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Profile Photo</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('internal_token');
            localStorage.removeItem('internal_role');
            localStorage.removeItem('sk_tech_token');
            localStorage.removeItem('tech_user');
            window.location.href = '/login';
          }}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out Account</span>
        </button>
      </div>

      {/* Photo Selection Modal */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-zinc-900 text-base">
                  Update Profile Photo
                </h3>
              </div>
              <button 
                onClick={() => setPhotoModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Select how you want to add your new technician profile photo:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Option 1: Live Camera / Selfie */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer active:scale-95 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-900 block">Take Selfie</span>
                  <span className="text-[10px] text-blue-600">Open Camera</span>
                </div>
              </button>

              {/* Option 2: Gallery / Choose from Device */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer active:scale-95 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">From Gallery</span>
                  <span className="text-[10px] text-zinc-500">Choose File</span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPhotoModalOpen(false)}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
