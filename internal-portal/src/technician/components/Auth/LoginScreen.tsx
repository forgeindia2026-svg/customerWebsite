import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck,
  Sparkles,
  Activity,
  Radio,
  Cpu
} from 'lucide-react';
import { SKLogoIcon } from '../SKLogoIcon';

interface LoginScreenProps {
  onLoginSuccess: (technician: { name: string; email: string; badge: string; role: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const demoAccounts = [
    {
      name: 'Kathir',
      email: 'kathir@gmail.com',
      badge: 'SK-TECH-KATHIR',
      role: 'CCTV Field Specialist',
      avatar: 'K',
      password: 'demoPass123!',
    },
    {
      name: 'Moorthy',
      email: 'moorthy@sktechnology.in',
      badge: 'SK-TECH-MOORTHY',
      role: 'Senior CCTV Field Engineer',
      avatar: 'M',
      password: 'demoPass123!',
    },
    {
      name: 'Selvam',
      email: 'selvam@sktechnology.in',
      badge: 'SK-TECH-SELVAM',
      role: 'IP Camera & Network Specialist',
      avatar: 'S',
      password: 'demoPass123!',
    },
    {
      name: 'Alex Vance',
      email: 'alex.vance@sktechnology.com',
      badge: 'SK-TECH-9042',
      role: 'Senior HVAC & Power Engineer',
      avatar: 'AV',
      password: 'demoPass123!',
    },
  ];

  const [selectedDemo, setSelectedDemo] = useState(demoAccounts[0]);
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectDemo = (account: typeof demoAccounts[0]) => {
    setSelectedDemo(account);
    setEmail(account.email);
    setPassword(account.password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const typedEmail = email.trim() || 'kathir@gmail.com';
    let nameFromEmail = typedEmail.split('@')[0];
    nameFromEmail = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    const userName = (typedEmail === selectedDemo.email) ? selectedDemo.name : nameFromEmail;
    const userEmail = typedEmail;
    const userId = `SK-TECH-${userName.toUpperCase()}`;
    const userRole = (typedEmail === selectedDemo.email) ? selectedDemo.role : 'CCTV Field Specialist';

    localStorage.setItem('user_name', userName);
    localStorage.setItem('user_email', userEmail);
    localStorage.setItem('user_id', userId);

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        name: userName,
        email: userEmail,
        badge: userId,
        role: userRole,
      });
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-white flex font-sans text-zinc-900 overflow-hidden">
      {/* LEFT SIDE: Grayscale Image Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 flex-col justify-between p-12 overflow-hidden border-r border-zinc-200">
        {/* Background Image in Pure Grayscale / Monochromatic Tone */}
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale contrast-125 opacity-40 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80')`,
          }}
        />

        {/* Dark Vignette Overlay for Crisp White Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-700 p-1">
            <SKLogoIcon className="w-9 h-9" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white tracking-tight">SK Technology</h2>
            <p className="text-[11px] text-sky-400 font-semibold tracking-wider uppercase">CCTV SOLUTIONS</p>
          </div>
        </div>

        {/* Center Hero Glassmorphism Card */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-mono text-emerald-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Offline Queue & Sync Portal</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Next-Gen Field Service Management Platform.
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed font-normal">
            Streamline installations, upload high-res site photos, log daily progress reports, and capture digital customer sign-offs cleanly in real time.
          </p>

          {/* Glassmorphism Metrics Card */}
          <div className="p-6 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl grid grid-cols-3 gap-4 text-white">
            <div>
              <div className="flex items-center space-x-1 text-zinc-400 text-xs font-medium">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Uptime</span>
              </div>
              <p className="text-lg font-bold font-mono mt-1 text-emerald-400">99.9%</p>
            </div>
            <div>
              <div className="flex items-center space-x-1 text-zinc-400 text-xs font-medium">
                <Cpu className="w-3.5 h-3.5 text-zinc-300" />
                <span>Offline Engine</span>
              </div>
              <p className="text-lg font-bold font-mono mt-1 text-white">Active</p>
            </div>
            <div>
              <div className="flex items-center space-x-1 text-zinc-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
                <span>Security</span>
              </div>
              <p className="text-lg font-bold font-mono mt-1 text-white">256-bit</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 font-mono pt-6 border-t border-white/10">
          <span>SK Enterprise Workforce Portal</span>
          <span>© 2026 SK Technology</span>
        </div>
      </div>

      {/* RIGHT SIDE: White Background with Premium Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Header Branding */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-md border border-slate-700 p-1">
              <SKLogoIcon className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">SK Technology</h2>
            <p className="text-xs text-sky-600 font-semibold uppercase tracking-wider">CCTV Solutions Portal</p>
          </div>

          {/* Form Card Container */}
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Technician Portal Login</h2>
              <p className="text-xs text-zinc-500 mt-1">Select a demo technician account or enter credentials below.</p>
            </div>

            {/* Demo Account Quick Selector Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-700 uppercase tracking-wider text-[11px]">
                  Select Demo Account
                </span>
                <span className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Click to Autofill</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {demoAccounts.map((account) => {
                  const isSelected = selectedDemo.email === account.email;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleSelectDemo(account)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 text-white border-zinc-800 shadow-md'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-900'
                        }`}>
                          {account.avatar}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{account.name}</p>
                          <p className={`text-[10px] font-mono truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {account.badge}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Technician Email / ID</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800 transition-all"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800 transition-all"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>


              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating Technician...' : `Sign In as ${selectedDemo.name}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
