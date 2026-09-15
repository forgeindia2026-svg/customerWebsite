import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Clock,
  Wrench,
  Users,
  Camera,
  Server,
  Smartphone,
  PhoneCall,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="bg-background text-foreground">
      {/* Top Hero Section */}
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/30 via-background to-background py-12 lg:py-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>ABOUT SK TECHNOLOGY</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                Securing Homes & Businesses{" "}
                <span className="text-red-500">Since 2014</span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                At SK Technology, surveillance is more than just hardware—it is peace of mind. Over the past decade, we have grown to become a trusted surveillance infrastructure partner across Tamil Nadu, powering smart security for residences, retail stores, commercial complexes, and industrial warehouses.
              </p>

              {/* 4 Stat Highlights */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-xs">
                  <p className="text-2xl sm:text-3xl font-black text-red-500 font-mono">10,000+</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Surveillance Installs</p>
                </div>
                <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-xs">
                  <p className="text-2xl sm:text-3xl font-black text-red-500 font-mono">99.9%</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">System Uptime SLA</p>
                </div>
                <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-xs">
                  <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">10+ Years</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Industry Leadership</p>
                </div>
                <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-xs">
                  <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">24/7</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Active Tech Support</p>
                </div>
              </div>
            </div>

            {/* Right Showcase Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border group bg-slate-900">
                <img
                  src="/images/about_cctv.jpg"
                  alt="SK Technology CCTV Surveillance Installation"
                  className="w-full h-80 sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center font-black">
                      SK
                    </div>
                    <div>
                      <p className="text-xs font-bold">SK Technology Security</p>
                      <p className="text-[11px] text-slate-300">ISO Certified & Authorized OEM Partner</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Advantages Grid */}
      <div className="py-14 lg:py-20 bg-muted/20 border-b border-border/40">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Why Thousands Trust SK Technology
            </h2>
            <p className="text-sm text-muted-foreground">
              We engineer dependable surveillance setups with certified components, clean wiring, and lifecycle warranty coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-red-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">Expert Technicians</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trained field engineers specializing in conduit routing, angle tuning, DVR/NVR rack setups, and zero-blindspot layouts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-red-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">100% Genuine Hardware</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct authorized products with valid manufacturer warranties from brands like CP PLUS, Hikvision, Dahua, and Honeywell.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-red-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">Fast Dispatch & Setup</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rapid site surveys, quotation turnarounds within 2 hours, and same-day installation availability for urgent requirements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-red-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">Dedicated AMC & Support</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Annual Maintenance Contracts (AMC), camera lens cleaning, cabling checkups, and priority helpline support.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Surveillance Domains / What We Do */}
      <div className="py-14 lg:py-20 border-b border-border/40">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              End-to-End Security Solutions
            </h2>
            <p className="text-sm text-muted-foreground">
              Tailored surveillance ecosystems crafted for homes, enterprises, and public infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all space-y-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">IP & HD Analog Systems</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Crystal clear 2MP to 4K ultra-definition cameras with night vision, wide dynamic range, and smart human/vehicle classification.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ColorVu & Full-Color Night Vision
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Smart Motion & Intrusion Alerts
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all space-y-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Storage & Centralized NVRs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Scalable surveillance recording servers supporting 4 to 64 channels with RAID redundancy and multi-month video archiving.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  High-Capacity Surveillance Hard Drives
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Automated Cloud & Local Backup
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Live App & Remote Access</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Control your cameras from anywhere on iOS, Android, and PC. Watch live feeds, playback recordings, and receive immediate alerts.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Real-time Push Notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Multi-device simultaneous streaming
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Call To Action Banner */}
      <div className="py-14 lg:py-16 bg-gradient-to-r from-[#0b1324] via-[#0f1b33] to-[#0b1324] text-white">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to upgrade your security?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Schedule a Free Site Inspection & Expert Consultation
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Get personalized camera placement recommendations and a guaranteed transparent quote tailored specifically to your premises.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="tel:+919600975483"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg transition-all hover:scale-105"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call +91 96009 75483</span>
            </a>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all hover:scale-105"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
