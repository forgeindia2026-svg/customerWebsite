import React, { useState, useEffect } from 'react';
import { Megaphone, Search, Bell, Info, AlertTriangle, Sparkles, Calendar, Users, ShieldAlert } from 'lucide-react';
import { getApiUrl } from '../../../utils/config';

export interface AnnouncementItem {
  id: string;
  title: string;
  target?: string;
  priority?: 'High' | 'Medium' | 'Normal' | string;
  content: string;
  date?: string;
  createdAt?: string;
}

export const AnnouncementsModule: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/dashboard?refresh=true`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.announcements)) {
            setAnnouncements(json.data.announcements);
          }
        }
      } catch (err) {
        console.warn('Announcements fetch notice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'High':
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>High Priority</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>Medium Priority</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>General Notice</span>
          </span>
        );
    }
  };

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case 'High':
      case 'URGENT':
        return 'border-l-4 border-l-rose-500';
      case 'Medium':
        return 'border-l-4 border-l-amber-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  const filtered = announcements.filter((ann) => {
    const term = searchTerm.toLowerCase();
    return (
      (ann.title || '').toLowerCase().includes(term) ||
      (ann.content || '').toLowerCase().includes(term) ||
      (ann.target || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      
      {/* Header Bar with Search & KPI */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Official Announcements</h2>
            <p className="text-[11px] text-slate-500 font-medium">Broadcast notices and policy updates from Management</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-800"
          />
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading official announcements...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <Info className="w-10 h-10 mx-auto opacity-40 text-blue-500" />
          <h3 className="text-sm font-extrabold text-slate-800">No Announcements Found</h3>
          <p className="text-xs max-w-sm mx-auto text-slate-500 font-medium">
            There are currently no active announcements matching your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ann) => (
            <div
              key={ann.id || ann.title}
              className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${getPriorityBorder(
                ann.priority
              )}`}
            >
              {/* Header Badges & Target */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getPriorityBadge(ann.priority)}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span>{ann.target || 'All Technicians'}</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {ann.date || 'Today'}
                </span>
              </div>

              {/* Content Body */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{ann.content}</p>
              </div>

              {/* Footer Note */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100">
                <span className="flex items-center gap-1 text-blue-600">
                  <Bell className="w-3 h-3" />
                  SK Admin Broadcast
                </span>
                <span>ID: {ann.id || 'ANN-OFFICIAL'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
