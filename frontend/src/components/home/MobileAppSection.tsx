import {
  ShieldCheck,
  ArrowRight,
  Tv,
  Bell,
  Cloud,
  Smartphone,
  Download,
  Star,
  Users,
  ShieldAlert,
  Mic,
  Camera,
  Video,
  SlidersHorizontal,
  Maximize2,
} from "lucide-react";

export default function MobileAppSection() {
  return (
    <section className="py-16 sm:py-20 bg-[#070b14] text-white relative overflow-hidden border-t border-b border-slate-800/80">
      {/* Soft Ambient Background Glow (Subtle & Not Harsh) */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* LEFT COLUMN: Text, App Store Buttons, 4 Feature Badges & 4 Stats Bar (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Pill Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-[#ff3b30] text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-[#ff3b30]" />
                <span>SK TECHNOLOGY MOBILE APP</span>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight uppercase">
              Your Security,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] via-rose-500 to-red-400">
                one tap away
              </span>
            </h2>

            {/* Sub-description */}
            <p className="text-slate-300 text-[11px] sm:text-sm max-w-xl leading-relaxed font-normal">
              Monitor your cameras in real time, receive instant alerts, and access live footage from anywhere. Available for iOS and Android.
            </p>

            {/* App Store Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 pt-1">
              {/* Official Google Play Store Button */}
              <a
                href="https://play.google.com/store/apps/details?id=com.sktechnology.cctv&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-6 sm:py-3.5 rounded-xl bg-[#0d1322] border border-red-500/40 hover:border-red-500 text-white transition-all duration-300 shadow-[0_0_12px_rgba(255,59,48,0.1)] hover:shadow-[0_0_18px_rgba(255,59,48,0.25)] hover:scale-[1.02] sm:min-w-[200px]"
              >
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <svg className="h-5 w-5 sm:h-7 sm:w-7 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3.6 1.8 C3.2 2.2 3 2.8 3 3.6 V20.4 C3 21.2 3.2 21.8 3.6 22.2 L3.7 22.3 L13.1 12.9 V12.7 V11.1 L3.7 1.7 L3.6 1.8 Z" fill="#00D2FF" />
                    <path d="M16.2 16 L13.1 12.9 V11.1 L16.2 8 L16.3 8.1 L20 10.2 C21.1 10.8 21.1 11.8 20 12.4 L16.3 14.5 L16.2 16 Z" fill="#FFC700" />
                    <path d="M16.3 14.5 L13.1 11.3 L3.6 20.8 C4 21.2 4.7 21.3 5.5 20.8 L16.3 14.5 Z" fill="#FF3A44" />
                    <path d="M16.3 9.5 L5.5 3.2 C4.7 2.7 4 2.8 3.6 3.2 L13.1 12.7 L16.3 9.5 Z" fill="#00E676" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[7px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">GET IT ON</p>
                    <p className="text-[10px] sm:text-sm font-black leading-tight text-white mt-0.5">Play Store</p>
                  </div>
                </div>
                <ArrowRight className="hidden sm:block h-4 w-4 text-[#ff3b30] shrink-0" />
              </a>

              {/* Apple App Store Button */}
              <a
                href="#"
                className="flex items-center justify-center sm:justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-6 sm:py-3.5 rounded-xl bg-[#0d1322] border border-slate-700/80 hover:border-slate-500 text-white transition-all duration-300 hover:scale-[1.02] sm:min-w-[200px]"
              >
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <svg className="h-5 w-5 sm:h-7 sm:w-7 fill-current text-white shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.82 1.44-.61.71-1.15 1.86-1.01 2.96 1.08.08 2.18-.56 2.84-1.36z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[7px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">DOWNLOAD ON THE</p>
                    <p className="text-[10px] sm:text-sm font-black leading-tight text-white mt-0.5">App Store</p>
                  </div>
                </div>
                <ArrowRight className="hidden sm:block h-4 w-4 text-slate-400 shrink-0" />
              </a>
            </div>

            {/* 4 Feature Badges Grid */}
            <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
              <div className="flex flex-col items-center text-center space-y-1.5 p-1.5">
                <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#ff3b30]">
                  <Tv className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-white">Live View</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Watch your cameras in real time</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 p-1.5 pt-3 sm:pt-1.5">
                <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#ff3b30]">
                  <Bell className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-white">Instant Alerts</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Get real-time motion and event alerts</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 p-1.5 pt-3 sm:pt-1.5">
                <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#ff3b30]">
                  <Cloud className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-white">Cloud Playback</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Securely access and playback recordings</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-1.5 p-1.5 pt-3 sm:pt-1.5">
                <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#ff3b30]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-extrabold text-white">Access Anywhere</h4>
                <p className="text-[11px] text-slate-400 leading-tight">View your cameras from anywhere</p>
              </div>
            </div>

            {/* 4 Stats Bar Card */}
            <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center items-center divide-x divide-slate-800">
              <div className="flex items-center justify-center gap-2.5 p-1">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-[#ff3b30]">
                  <Download className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-white">10K+</p>
                  <p className="text-[10px] text-slate-400 font-medium">Downloads</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2.5 p-1">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-[#ff3b30]">
                  <Star className="h-4 w-4 fill-[#ff3b30] text-[#ff3b30]" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-white">4.8</p>
                  <p className="text-[10px] text-slate-400 font-medium">Average Rating</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2.5 p-1">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-[#ff3b30]">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-white">1000+</p>
                  <p className="text-[10px] text-slate-400 font-medium">Happy Users</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2.5 p-1">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-[#ff3b30]">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-white">100%</p>
                  <p className="text-[10px] text-slate-400 font-medium">Secure & Reliable</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Clean Smartphone Mockup (No Heavy Red Shadow) */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Smartphone Outer Frame */}
            <div className="relative w-84 sm:w-[380px] bg-[#090d16] border-[6px] border-slate-700/90 rounded-[52px] shadow-2xl shadow-slate-950/90 p-4 overflow-hidden">
              
              {/* Dynamic Island / Notch */}
              <div className="w-28 h-4 bg-slate-950 rounded-full mx-auto mb-3 flex items-center justify-center border border-slate-800">
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>

              {/* Smartphone Screen: Dark High-Tech CCTV App UI */}
              <div className="bg-[#0f172a] rounded-[38px] p-4 text-white shadow-inner space-y-4 border border-slate-800">
                
                {/* App Top Header Bar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff3b30] animate-ping"></span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      SK LIVE CAM 4K
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ONLINE
                    </span>
                    <Bell className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* 4 Live Camera Feeds 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Cam 1: Main Gate */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 group h-32">
                    <img
                      src="/images/about_cctv.jpg"
                      alt="CAM 01 Main Gate"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60"></div>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#ff3b30]"></span>
                      <span className="text-[10px] font-extrabold text-white shadow-sm">CAM 01 - GATE</span>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-200 bg-black/50 px-1.5 py-0.5 rounded">
                      REC 🔴
                    </div>
                  </div>

                  {/* Cam 2: Parking */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 group h-32">
                    <img
                      src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80"
                      alt="CAM 02 Parking"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60"></div>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-400"></span>
                      <span className="text-[10px] font-extrabold text-white shadow-sm">CAM 02 - PARKING</span>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] font-bold text-[#ff3b30] bg-black/50 px-1.5 py-0.5 rounded">
                      🌙 NIGHT
                    </div>
                  </div>

                  {/* Cam 3: Office Lobby */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 group h-32">
                    <img
                      src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80"
                      alt="CAM 03 Lobby"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60"></div>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                      <span className="text-[10px] font-extrabold text-white shadow-sm">CAM 03 - LOBBY</span>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] font-bold text-amber-400 bg-black/50 px-1.5 py-0.5 rounded">
                      ⚠️ MOTION
                    </div>
                  </div>

                  {/* Cam 4: Garden */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 group h-32">
                    <img
                      src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"
                      alt="CAM 04 Garden"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60"></div>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="text-[10px] font-extrabold text-white shadow-sm">CAM 04 - GARDEN</span>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] font-bold text-emerald-400 bg-black/50 px-1.5 py-0.5 rounded">
                      LIVE 4K
                    </div>
                  </div>
                </div>

                {/* CCTV App Control Dashboard Bar */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-around text-slate-300">
                  <button className="flex flex-col items-center gap-1 hover:text-[#ff3b30]">
                    <Mic className="h-4.5 w-4.5 text-[#ff3b30]" />
                    <span className="text-[10px] font-bold text-white">Audio</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 hover:text-emerald-400">
                    <Camera className="h-4.5 w-4.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-white">Snapshot</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 hover:text-red-400">
                    <Video className="h-4.5 w-4.5 text-red-500" />
                    <span className="text-[10px] font-bold text-white">Record</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 hover:text-amber-400">
                    <SlidersHorizontal className="h-4.5 w-4.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-white">PTZ</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 hover:text-purple-400">
                    <Maximize2 className="h-4.5 w-4.5 text-purple-400" />
                    <span className="text-[10px] font-bold text-white">Full</span>
                  </button>
                </div>

                {/* Download CTA Banner inside Phone */}
                <div className="pt-1">
                  <div className="w-full py-2.5 px-4 bg-gradient-to-r from-[#ff3b30] to-rose-600 rounded-2xl text-white text-xs font-black flex items-center justify-between shadow-lg">
                    <span>SK Technology Mobile App</span>
                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px]">v2.4 Live</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
