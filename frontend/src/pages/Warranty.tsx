import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  FileText,
  PhoneCall,
  ArrowRight,
  Shield,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Warranty() {
  const [activePlan, setActivePlan] = useState<"standard" | "amc" | "enterprise">("amc");

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-muted/40 via-background to-background border-b border-border/40 py-12 lg:py-16">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>PROTECTION & SERVICE GUARANTEE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Warranty & Annual Maintenance <span className="text-red-500">(AMC)</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Ensure 100% continuous surveillance uptime. We back all installations with genuine manufacturer warranties and comprehensive preventive AMC service plans.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <a
              href="tel:+919600975483"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Claim Warranty / Book AMC</span>
            </a>
            <Link
              to="/dashboard?tab=requests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted hover:bg-muted/80 border border-border text-foreground font-bold text-xs transition-all"
            >
              <span>Submit Service Ticket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Key AMC & Warranty Options */}
      <div className="py-14 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Choose Your Protection Plan
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tailored coverage for homes, retail establishments, and industrial premises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Standard Warranty */}
          <div
            onClick={() => setActivePlan("standard")}
            className={`p-6 sm:p-8 rounded-3xl bg-card border transition-all cursor-pointer space-y-5 relative ${
              activePlan === "standard"
                ? "border-red-500 shadow-xl ring-2 ring-red-500/20"
                : "border-border hover:border-slate-300"
            }`}
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-foreground">Standard OEM Warranty</h3>
              <p className="text-xs text-muted-foreground">
                Included automatically with all newly purchased CCTV cameras and DVR/NVR hardware.
              </p>
            </div>

            <div className="text-2xl font-black text-foreground">
              Free <span className="text-xs font-semibold text-muted-foreground">/ Included</span>
            </div>

            <ul className="space-y-2.5 text-xs text-muted-foreground pt-2 border-t border-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>1 to 2 Years Manufacturer Warranty</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hardware defect repair or replacement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>OEM authorized service center assistance</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>On-site technician visit charged per visit</span>
              </li>
            </ul>

            <Button
              variant={activePlan === "standard" ? "default" : "outline"}
              className="w-full rounded-full text-xs font-bold"
            >
              Select Standard
            </Button>
          </div>

          {/* Plan 2: Comprehensive AMC (Popular) */}
          <div
            onClick={() => setActivePlan("amc")}
            className={`p-6 sm:p-8 rounded-3xl bg-card border transition-all cursor-pointer space-y-5 relative ${
              activePlan === "amc"
                ? "border-red-500 shadow-2xl ring-2 ring-red-500/30"
                : "border-border hover:border-slate-300"
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              Most Popular
            </div>

            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-foreground">Comprehensive AMC</h3>
              <p className="text-xs text-muted-foreground">
                All-inclusive maintenance with free on-site service visits, regular tune-ups, and cleaning.
              </p>
            </div>

            <div className="text-2xl font-black text-red-500">
              Custom Quote <span className="text-xs font-semibold text-muted-foreground">/ per year</span>
            </div>

            <ul className="space-y-2.5 text-xs text-muted-foreground pt-2 border-t border-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Zero Service Visit Charges</strong> all year</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Quarterly camera lens cleaning & angle tuning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>DVR/NVR HDD health check & recording audit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Priority 4-Hour Breakdown Response</span>
              </li>
            </ul>

            <Button
              className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md"
            >
              Get AMC Quote
            </Button>
          </div>

          {/* Plan 3: Enterprise & Industrial AMC */}
          <div
            onClick={() => setActivePlan("enterprise")}
            className={`p-6 sm:p-8 rounded-3xl bg-card border transition-all cursor-pointer space-y-5 relative ${
              activePlan === "enterprise"
                ? "border-red-500 shadow-xl ring-2 ring-red-500/20"
                : "border-border hover:border-slate-300"
            }`}
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-foreground">Enterprise 24/7 AMC</h3>
              <p className="text-xs text-muted-foreground">
                Dedicated SLA for factories, large warehouses, school campuses, and corporate parks.
              </p>
            </div>

            <div className="text-2xl font-black text-foreground">
              Enterprise SLA <span className="text-xs font-semibold text-muted-foreground">/ Dedicated</span>
            </div>

            <ul className="space-y-2.5 text-xs text-muted-foreground pt-2 border-t border-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dedicated Relationship Manager & Lead Tech</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Standby replacement units for zero downtime</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Monthly cable integrity & switch inspections</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>2-Hour Rapid Emergency On-Site SLA</span>
              </li>
            </ul>

            <Button
              variant={activePlan === "enterprise" ? "default" : "outline"}
              className="w-full rounded-full text-xs font-bold"
            >
              Talk to Enterprise Team
            </Button>
          </div>
        </div>
      </div>

      {/* Coverage Breakdown Table */}
      <div className="py-14 bg-muted/20 border-t border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-black text-center mb-8">What Is Covered Under Warranty & AMC?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Covered */}
            <div className="p-6 rounded-2xl bg-card border border-emerald-500/30 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>COVERED (FREE REPLACEMENT / REPAIR)</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li>• Internal electronic defects in Camera sensor, DSP chip, or IR LED board.</li>
                <li>• DVR/NVR motherboard power failures and HDMI/VGA output issues.</li>
                <li>• Surveillance Hard Drive read/write failure within manufacturer warranty.</li>
                <li>• PoE Switch port failure and SMPS power adapter manufacturer defects.</li>
                <li>• Cloud mobile app connection configuration and firmware updates.</li>
              </ul>
            </div>

            {/* Not Covered */}
            <div className="p-6 rounded-2xl bg-card border border-rose-500/30 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>NOT COVERED (CHARGED REPAIRS)</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li>• Physical external damage, cracked lens glass, or vandalism.</li>
                <li>• Damage caused by high-voltage lightning strikes or external electrical short-circuits.</li>
                <li>• Cable chewing by rodents or intentional tampering.</li>
                <li>• Water logging due to submergence beyond IP rating specifications.</li>
                <li>• Unauthorized third-party repairs or modifications.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Claim Process */}
      <div className="py-16 container max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-black text-center mb-10">How to Claim Warranty or Schedule AMC Service</h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white font-black text-base flex items-center justify-center mx-auto shadow-md">
              1
            </div>
            <h4 className="font-extrabold text-sm">Find Serial No.</h4>
            <p className="text-xs text-muted-foreground">
              Check the barcode sticker on your camera, DVR, or original invoice.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white font-black text-base flex items-center justify-center mx-auto shadow-md">
              2
            </div>
            <h4 className="font-extrabold text-sm">Raise a Ticket</h4>
            <p className="text-xs text-muted-foreground">
              Submit a support ticket on our website or call our helpline +91 96009 75483.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white font-black text-base flex items-center justify-center mx-auto shadow-md">
              3
            </div>
            <h4 className="font-extrabold text-sm">Tech Inspection</h4>
            <p className="text-xs text-muted-foreground">
              Our certified engineer visits your site to diagnose and test the issue.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white font-black text-base flex items-center justify-center mx-auto shadow-md">
              4
            </div>
            <h4 className="font-extrabold text-sm">Repair / Replace</h4>
            <p className="text-xs text-muted-foreground">
              Hardware is repaired or replaced with genuine manufacturer stock immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
