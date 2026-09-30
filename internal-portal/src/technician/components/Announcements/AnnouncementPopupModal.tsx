import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getApiUrl } from '../../../utils/config';

interface Announcement {
  id: string;
  title: string;
  message?: string;
  content?: string;
  date?: string;
}

export function AnnouncementPopupModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/dashboard?refresh=true`);
        if (res.ok) {
          const data = await res.json();
          const allAnns = data.announcements || [];
          if (allAnns.length > 0) {
            // Get the most recent one (assuming they are prepended, we take [0], or just sort by date if needed)
            const latest = allAnns[0];
            
            // Check if user has already seen this specific announcement
            const seenKey = `seen_announcement_${latest.id}`;
            if (!localStorage.getItem(seenKey)) {
              setAnnouncement(latest);
            }
          }
        }
      } catch (err) {
        console.warn('Popup fetch notice:', err);
      }
    };
    
    // Check shortly after login/mount
    setTimeout(fetchAnnouncements, 1000);
    
    // Poll every 1 minute for new ones
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!announcement) return null;

  const handleClose = () => {
    // Mark as seen so it doesn't pop up again
    localStorage.setItem(`seen_announcement_${announcement.id}`, 'true');
    setAnnouncement(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-300">
        
        {/* Header Graphic */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex flex-col items-center justify-center text-white relative">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="bg-white/20 p-3 rounded-full mb-3 shadow-inner">
            <Megaphone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-center tracking-tight">New Announcement</h2>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{announcement.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {announcement.message || announcement.content || 'Please check the announcements tab for more details.'}
          </p>
          
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
