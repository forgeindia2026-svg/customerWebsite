import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  ChevronDown,
  Search,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Tv,
  Wrench,
  Truck,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FAQItem {
  id: string;
  category: "installation" | "mobile" | "warranty" | "orders";
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "inst-1",
    category: "installation",
    question: "How long does a CCTV installation usually take?",
    answer: "A standard 4 to 8 camera residential or retail installation is typically completed in 3 to 6 hours on the same day. Larger commercial or multi-floor industrial projects may take 1 to 2 days depending on conduit wiring length and camera mounting height."
  },
  {
    id: "inst-2",
    category: "installation",
    question: "Do you provide free site inspection before installation?",
    answer: "Yes! For homes, offices, and factories across Shoolagiri, Hosur, Krishnagiri, and nearby regions, our technician can perform a free on-site survey to map camera angles, identify blind spots, and provide a transparent itemized quotation."
  },
  {
    id: "inst-3",
    category: "installation",
    question: "What is the difference between IP Cameras and HD Analog (Bullet/Dome) cameras?",
    answer: "HD Analog cameras connect via coaxial cable (3+1) directly to a DVR. They are cost-effective and dependable for standard monitoring. IP (Network) cameras transmit digital data via CAT6 network cables to an NVR, offering superior 4K clarity, advanced AI person/vehicle motion detection, two-way audio, and greater scalability."
  },
  {
    id: "mob-1",
    category: "mobile",
    question: "Can I watch live CCTV camera feeds on my phone when away from home?",
    answer: "Yes, absolutely! Once our technician connects your DVR or NVR to an active internet connection (Wi-Fi router or LAN cable), you can download the mobile app on iOS or Android and view crystal-clear live video feeds, receive instant intrusion alerts, and playback recordings from anywhere in the world."
  },
  {
    id: "mob-2",
    category: "mobile",
    question: "How many users can access the mobile app simultaneously?",
    answer: "You can share access with family members, office partners, or security guards. The system allows up to 10 to 16 simultaneous user accounts with customizable access levels (such as Live View only vs Playback & Settings access)."
  },
  {
    id: "mob-3",
    category: "mobile",
    question: "Will the cameras still record video if the internet goes down?",
    answer: "Yes. All cameras record locally onto the internal surveillance hard drive inside your DVR/NVR 24/7, completely independent of the internet. The internet is only required for remote viewing on your smartphone."
  },
  {
    id: "warr-1",
    category: "warranty",
    question: "What warranty comes with newly purchased CCTV products?",
    answer: "All our cameras, DVRs, NVRs, and surveillance hard drives come with 1 to 2 years official manufacturer replacement warranty from authorized brands (Hikvision, CP PLUS, Dahua). Defective parts within the warranty period are repaired or replaced free of charge."
  },
  {
    id: "warr-2",
    category: "warranty",
    question: "What is an Annual Maintenance Contract (AMC) and do I need one?",
    answer: "An AMC is a preventive maintenance plan. It includes scheduled quarterly visits for lens cleaning, angle adjustments, hard drive health diagnostics, wiring checks, and priority breakdown attendance with zero service-charge fees. It is highly recommended for offices, apartments, and factories to prevent sudden surveillance failure."
  },
  {
    id: "warr-3",
    category: "warranty",
    question: "How do I raise a repair or service request?",
    answer: "You can submit a service ticket directly from your Customer Dashboard on this website, call our direct helpline at +91 96009 75483, or message us on WhatsApp. Our technician will contact you and schedule an on-site visit within 24 hours."
  },
  {
    id: "ord-1",
    category: "orders",
    question: "How do I track my camera product order?",
    answer: "Once you place an order on our store, you can visit the 'Track Order' link in your customer dashboard to see live dispatch status, courier tracking ID, and technician assignment details."
  },
  {
    id: "ord-2",
    category: "orders",
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Net Banking, Credit/Debit Cards, and Cash on Delivery / Pay on Installation for approved locations."
  },
  {
    id: "ord-3",
    category: "orders",
    question: "Can I cancel or return my product order?",
    answer: "Unopened and unused hardware in its original manufacturer packaging can be returned or exchanged within 7 days of delivery. For customized installation packages, our technician verifies everything on-site before finalizing billing."
  }
];

export default function Faq() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openIds, setOpenIds] = useState<string[]>(["inst-1", "mob-1"]);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Search Header */}
      <div className="bg-gradient-to-b from-muted/40 via-background to-background border-b border-border/40 py-12 lg:py-16">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-extrabold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>HELP & SUPPORT CENTER</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Frequently Asked <span className="text-red-500">Questions</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Have questions about CCTV installation, remote mobile viewing, warranties, or AMC contracts? Find fast answers below.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto mt-4 relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. installation, mobile app, warranty, AMC)..."
              className="w-full pl-11 pr-10 h-12 rounded-2xl bg-card border-border shadow-sm text-sm text-left focus-visible:ring-red-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex items-center justify-center flex-wrap gap-2 pb-6 border-b border-border/50">
          {[
            { id: "all", label: "All Questions", icon: Sparkles },
            { id: "installation", label: "Installation & Setup", icon: Wrench },
            { id: "mobile", label: "Mobile App & Live View", icon: Tv },
            { id: "warranty", label: "Warranty & AMC", icon: ShieldCheck },
            { id: "orders", label: "Orders & Delivery", icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-red-500 text-white shadow-md scale-105"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQs Accordion List */}
        <div className="py-8 space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-red-500/10 text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3">
              <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base">No matching questions found</h3>
              <p className="text-xs text-muted-foreground">
                Try searching with different keywords or browse our categories.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="rounded-full text-xs"
              >
                Reset Search
              </Button>
            </div>
          )}
        </div>

        {/* Still Have Questions Box */}
        <div className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <h3 className="font-black text-lg text-foreground">Still have questions?</h3>
            <p className="text-xs text-muted-foreground">
              Can’t find what you’re looking for? Our friendly security experts are here to help.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:+919600975483"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Us</span>
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card hover:bg-muted border border-border text-foreground font-bold text-xs transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Form</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
