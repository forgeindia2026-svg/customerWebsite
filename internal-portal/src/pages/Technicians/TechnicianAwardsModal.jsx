import React, { useState } from 'react';
import { FiAward, FiDownload, FiX, FiCheckCircle, FiStar, FiCalendar, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { downloadRenderedCertificate } from '../../utils/technicianCertificateGenerator';

export default function TechnicianAwardsModal({
  isOpen,
  onClose,
  top3 = [],
  monthYear = 'NOVEMBER 2026',
  adminName = 'SARAN KUMAR'
}) {
  const [downloadingRank, setDownloadingRank] = useState(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSingle = async (item) => {
    try {
      setDownloadingRank(item.rank);
      await downloadRenderedCertificate({
        tech: item.tech,
        rank: item.rank,
        monthYear,
        monthlyEarnings: item.monthlyEarnings,
        jobsCompleted: item.jobsCompleted,
        adminName
      });
      toast.success(`Certificate for ${item.tech.name} downloaded successfully!`);
    } catch (err) {
      console.error('Certificate generation error:', err);
      toast.error('Failed to generate certificate');
    } finally {
      setDownloadingRank(null);
    }
  };

  const handleBulkDownload = async () => {
    try {
      setIsBulkDownloading(true);
      for (let i = 0; i < top3.length; i++) {
        const item = top3[i];
        await downloadRenderedCertificate({
          tech: item.tech,
          rank: item.rank || (i + 1),
          monthYear,
          monthlyEarnings: item.monthlyEarnings,
          jobsCompleted: item.jobsCompleted,
          adminName
        });
      }
      toast.success('All 3 Top Performer Certificates downloaded!');
    } catch (err) {
      console.error('Bulk certificate download error:', err);
      toast.error('Failed to download certificates');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const rankThemes = {
    1: {
      border: 'border-amber-300 dark:border-amber-600/80',
      bg: 'bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/20 dark:to-slate-900',
      badgeBg: 'bg-amber-500 text-white shadow-amber-500/30',
      medalText: '1st Place • Star Performer',
      accentColor: 'text-amber-700 dark:text-amber-300',
      btnBg: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    2: {
      border: 'border-slate-300 dark:border-slate-700',
      bg: 'bg-gradient-to-b from-slate-100/80 to-white dark:from-slate-800/40 dark:to-slate-900',
      badgeBg: 'bg-slate-500 text-white shadow-slate-500/30',
      medalText: '2nd Place • 1st Runner Up',
      accentColor: 'text-slate-700 dark:text-slate-300',
      btnBg: 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
    },
    3: {
      border: 'border-amber-200 dark:border-amber-800/60',
      bg: 'bg-gradient-to-b from-orange-50/60 to-white dark:from-orange-950/20 dark:to-slate-900',
      badgeBg: 'bg-amber-600 text-white shadow-amber-600/30',
      medalText: '3rd Place • 2nd Runner Up',
      accentColor: 'text-amber-800 dark:text-amber-200',
      btnBg: 'bg-amber-700 hover:bg-amber-800 text-white'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-[fadeIn_0.15s_ease]">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20">
              <FiAward size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">Top Earned Technicians</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  Monthly Awards
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <FiCalendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Recognition & Official Certificates for <strong className="text-white">{monthYear}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBulkDownload}
              disabled={isBulkDownloading || top3.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <FiDownload size={14} className={isBulkDownloading ? 'animate-bounce' : ''} />
              <span>{isBulkDownloading ? 'Generating All...' : 'Download All 3 Certificates (PDF)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Subtitle Notice */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                🖨️ Ready for Print & Lamination:
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Generated as <strong>High-Resolution A4 Landscape PDFs</strong> with official SK Technology branding, verified seal, and Managing Director signature block.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <FiUser className="text-primary" /> Awarding Authority: <span className="text-slate-900 dark:text-white">{adminName}</span>
            </div>
          </div>

          {/* Top 3 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {top3.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No technician earnings recorded for this month.
              </div>
            ) : (
              top3.map((item) => {
                const theme = rankThemes[item.rank] || rankThemes[1];
                const isDownloading = downloadingRank === item.rank;

                return (
                  <div
                    key={item.tech.id}
                    className={`relative rounded-2xl border ${theme.border} ${theme.bg} p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md`}
                  >
                    {/* Rank Ribbon Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${theme.badgeBg}`}>
                        <FiStar size={11} className="fill-current" />
                        <span>Rank #{item.rank}</span>
                      </span>
                      <span className={`text-[11px] font-bold ${theme.accentColor}`}>
                        {theme.medalText}
                      </span>
                    </div>

                    {/* Technician Profile Details */}
                    <div className="py-4 text-center">
                      <div className="w-16 h-16 rounded-full mx-auto relative overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                        <img
                          src={item.tech.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={item.tech.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white mt-2.5 leading-tight">
                        {item.tech.name}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
                        {item.tech.specialization || 'Field Technician'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: {item.tech.id.length > 8 ? item.tech.id.slice(-8) : item.tech.id}
                      </p>
                    </div>

                    {/* Earnings & Performance Metrics */}
                    <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Month Earned</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                          ₹{Number(item.monthlyEarnings).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="border-l border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Jobs Done</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
                          {item.jobsCompleted}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleDownloadSingle(item)}
                      disabled={isDownloading || isBulkDownloading}
                      className={`w-full mt-4 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${theme.btnBg} disabled:opacity-50`}
                    >
                      <FiDownload size={13} className={isDownloading ? 'animate-bounce' : ''} />
                      <span>{isDownloading ? 'Generating PDF...' : 'Download Certificate (PDF)'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiCheckCircle className="text-emerald-500" />
            <span>High resolution vector layout. Ready for photo paper color print & lamination.</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleBulkDownload}
              disabled={isBulkDownloading || top3.length === 0}
              className="sm:hidden px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
            >
              Download All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
