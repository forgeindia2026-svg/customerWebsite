import React from 'react';
import type { TechnicianProfile } from '../../types/job';
import { 
  Award, 
  Truck, 
  CheckCircle2, 
  Star,
  LogOut 
} from 'lucide-react';

interface ProfileModuleProps {
  profile: TechnicianProfile;
  onUpdateStatus?: (status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_JOB') => Promise<void>;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  profile,
}) => {

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Header Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-900"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-zinc-900">{profile.name}</h2>
              <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
                {profile.badgeNumber}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">{profile.role}</p>
            <div className="flex items-center space-x-3 text-xs text-zinc-400 mt-1">
              <span className="flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-zinc-800">{profile.rating} Rating</span>
              </span>
              <span>•</span>
              <span>{profile.completedJobsCount} Work Orders Completed</span>
            </div>
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
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out Account</span>
        </button>
      </div>

    </div>
  );
};
