import React, { useState } from 'react';
import type { Job, InspectionSummary } from '../../types/job';
import { 
  Check, 
  ShieldCheck, 
  Save 
} from 'lucide-react';

interface InspectionSummaryStepProps {
  job: Job;
  onSaveInspection: (inspection: InspectionSummary) => Promise<void>;
  onNextStep: () => void;
}

export const InspectionSummaryStep: React.FC<InspectionSummaryStepProps> = ({
  job,
  onSaveInspection,
  onNextStep,
}) => {
  const existing = job.inspection;

  const [voltageReading, setVoltageReading] = useState(existing?.voltageReading || '480V 3-Phase');
  const [groundingStatus, setGroundingStatus] = useState(existing?.groundingStatus || 'Passed (0.02 Ohms)');
  const [safetyVerified, setSafetyVerified] = useState(existing?.safetyVerified ?? true);
  const [notes, setNotes] = useState(existing?.notes || 'Pre-installation physical and electrical parameters checked.');
  
  const [checklistItems, setChecklistItems] = useState(
    existing?.checklistItems || [
      { id: '1', label: 'Main circuit breaker isolated & tagged out', passed: true },
      { id: '2', label: 'Chassis earthing and ground bonding verified', passed: true },
      { id: '3', label: 'Mounting surface structural load capacity verified', passed: true },
      { id: '4', label: 'Input voltage within ±5% tolerance band', passed: true },
      { id: '5', label: 'Environmental temperature & ventilation approved', passed: true },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCheckitem = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const summary: InspectionSummary = {
        inspectedBy: 'Alex Vance',
        inspectionDate: new Date().toISOString().split('T')[0],
        checklistPassed: checklistItems.every((i) => i.passed),
        checklistItems,
        safetyVerified,
        voltageReading,
        groundingStatus,
        notes,
      };
      await onSaveInspection(summary);
      onNextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="border border-zinc-200 rounded-xl p-5 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Technical & Safety Inspection Form</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Perform preliminary checks before starting hardware installation.
            </p>
          </div>
          <span className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md font-semibold">
            {job.jobCode}
          </span>
        </div>

        {/* Safety Lockout Toggle */}
        <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${safetyVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900">Safety Lockout / Tagout (LOTO) Verified</p>
              <p className="text-[11px] text-zinc-500">Main breaker switch isolated and locked by field engineer.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={safetyVerified}
              onChange={(e) => setSafetyVerified(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Readings Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Measured Line Voltage</label>
            <input
              type="text"
              value={voltageReading}
              onChange={(e) => setVoltageReading(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="e.g. 480V 3-Phase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Earth Grounding Resistance</label>
            <input
              type="text"
              value={groundingStatus}
              onChange={(e) => setGroundingStatus(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="e.g. Passed (0.02 Ohms)"
            />
          </div>
        </div>

        {/* Checklist */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-2">
            Inspection Protocol Checklist
          </h4>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheckitem(item.id)}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  item.passed
                    ? 'border-emerald-200 bg-emerald-50/40 text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span className="font-medium">{item.label}</span>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center ${item.passed ? 'bg-emerald-600 text-white' : 'border border-zinc-300 bg-white text-transparent'}`}>
                  <Check className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">Inspection Notes & Findings</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            placeholder="Document any environmental or pre-installation observations..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Inspection & Proceed</span>
        </button>
      </div>
    </form>
  );
};
