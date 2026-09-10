import React, { useState } from 'react';
import type { Job } from '../../types/job';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Briefcase, 
  CheckCircle2, 
  Layers,
  Zap
} from 'lucide-react';

interface LiveMapModuleProps {
  jobs: Job[];
  onSelectJob?: (job: Job) => void;
  onOpenWorkflow: (job: Job) => void;
}

export const LiveMapModule: React.FC<LiveMapModuleProps> = ({
  jobs,
  onOpenWorkflow
}) => {
  const [selectedPinId, setSelectedPinId] = useState<string>(jobs[0]?.id || '');
  const activeJob = jobs.find(j => j.id === selectedPinId) || jobs[0];

  // Coordinates simulation for Austin TX field sites
  const pins = [
    { id: jobs[0]?.id || 'j1', name: jobs[0]?.customer.name || 'Apex Industrial', top: '35%', left: '42%', status: 'IN_PROGRESS', jobCode: jobs[0]?.jobCode || 'SK-JOB-8492' },
    { id: jobs[1]?.id || 'j2', name: jobs[1]?.customer.name || 'Vanguard Data', top: '55%', left: '68%', status: 'ACCEPTED', jobCode: jobs[1]?.jobCode || 'SK-JOB-8493' },
    { id: jobs[2]?.id || 'j3', name: jobs[2]?.customer.name || 'Horizon Energy', top: '25%', left: '78%', status: 'SCHEDULED', jobCode: jobs[2]?.jobCode || 'SK-JOB-8488' },
  ];

  return (
    <div className="space-y-6 text-zinc-900 font-sans">
      {/* Top Banner Header */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                LIVE GPS FIELD TRACKING
              </span>
              <span className="text-xs text-zinc-400 font-mono">Van #SK-409 • Active Route</span>
            </div>
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mt-1 flex items-center space-x-2">
              <Compass className="w-5 h-5 text-zinc-700" />
              <span>Real-Time Field Navigation & Site Map</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live turn-by-turn route dispatch map, traffic arrival estimates, and technician proximity telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-2xs">
              <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>GPS SYNC: LIVE (3 SITES)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Map + Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map Canvas Simulation */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl h-[480px] relative overflow-hidden shadow-md flex flex-col justify-between p-6">
          {/* Map Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Map Control Overlay */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>MAP LAYER: TELEMETRY SATELLITE (AUSTIN REGION)</span>
            </div>

            <div className="bg-emerald-950/90 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-800 text-xs font-mono font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>VAN #SK-409 EN ROUTE (28 MPH)</span>
            </div>
          </div>

          {/* Simulated Route Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <path
              d="M 220 180 Q 340 220 480 260 T 700 120"
              fill="none"
              stroke="#10B981"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
          </svg>

          {/* Current Technician Vehicle Marker Pin */}
          <div className="absolute top-[38%] left-[22%] z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="px-2.5 py-1 bg-zinc-900 text-white text-[10px] font-mono font-bold rounded-lg shadow-md border border-emerald-500 mb-1 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-emerald-400 fill-current" />
              <span>ALEX VANCE (VAN #SK-409)</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-bounce">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            </div>
          </div>

          {/* Interactive Site Pins */}
          {pins.map((pin) => {
            const isSelected = selectedPinId === pin.id;
            return (
              <div
                key={pin.id}
                onClick={() => setSelectedPinId(pin.id)}
                style={{ top: pin.top, left: pin.left }}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                <div className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg shadow-md border mb-1 flex items-center space-x-1 whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-white'
                    : 'bg-slate-950/90 text-slate-200 border-slate-700'
                }`}>
                  <span>{pin.jobCode} • {pin.name}</span>
                </div>

                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  pin.status === 'IN_PROGRESS' 
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300' 
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}>
                  <MapPin className="w-4 h-4 fill-current" />
                </div>
              </div>
            );
          })}

          {/* Map Footer Legend */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Green: Technician Current GPS</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Amber: Active Work Order Site</span>
            </span>
          </div>
        </div>

        {/* Right 1 Col: Selected Site Route Details */}
        {activeJob && (
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <span className="text-xs font-mono font-bold text-zinc-500">{activeJob.jobCode} • {activeJob.category}</span>
                <h3 className="text-base font-extrabold text-zinc-900 mt-0.5">{activeJob.title}</h3>
                <p className="text-xs text-zinc-500 flex items-center space-x-1 mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{activeJob.customer.name}</span>
                </p>
              </div>

              {/* Navigation Telemetry Cards */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Destination Address</span>
                  <span className="font-bold text-zinc-900 text-right">{activeJob.customer.address}</span>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Estimated Arrival (ETA)</span>
                  <span className="font-mono font-bold text-emerald-600">12 Mins (4.2 Miles)</span>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Traffic Condition</span>
                  <span className="font-mono font-bold text-zinc-800">Clear • Hwy 183 N</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${activeJob.customer.address}, ${activeJob.customer.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>LAUNCH GOOGLE NAV MAPS</span>
              </a>

              <button
                onClick={() => onOpenWorkflow(activeJob)}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>OPEN WORKFLOW MODAL</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
