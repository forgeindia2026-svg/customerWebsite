import { useState } from "react";
import { Phone, MapPin, Send, MessageCircle, Shield, HelpCircle, ChevronDown, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inquiryTypes = [
  { id: "installation", label: "📹 New CCTV Installation" },
  { id: "amc", label: "🔧 Repair & AMC" },
  { id: "commercial", label: "🏢 Business Audit" },
  { id: "bulk", label: "📦 Bulk Orders" },
];

const faqs = [
  {
    q: "How fast can a technician visit my location?",
    a: "We offer same-day emergency dispatch for active system failures and within 24 hours for new installation bookings.",
  },
  {
    q: "Do you offer free on-site security surveys?",
    a: "Yes! Our security engineers provide zero-cost on-site assessments for both residential homes and commercial buildings.",
  },
  {
    q: "What warranty comes with SKTechnology CCTV systems?",
    a: "All cameras and NVR recording equipment come with a 2-Year Full Replacement Warranty plus 1-year free installation labor coverage.",
  },
  {
    q: "Can I monitor my CCTV cameras on my mobile phone?",
    a: "Absolutely. Our technician will set up live HD remote streaming on your iPhone or Android phone during installation.",
  },
];

export default function Contact() {
  const [selectedType, setSelectedType] = useState("installation");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", city: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Premium Dark Hero Header */}
      <div className="bg-[#0b0f19] text-white py-16 px-4 relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/5 pointer-events-none"></div>
        <div className="container max-w-7xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold uppercase tracking-widest border border-red-500/30">
            <Phone className="h-3.5 w-3.5" /> 24/7 Security Assistance
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            How Can We Protect Your Space Today?
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Speak with an authorized SKTechnology security expert or request a callback in 10 minutes.
          </p>

          {/* 3 Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-8">
            {/* Phone Card */}
            <a
              href="tel:+919600975483"
              className="p-5 bg-gray-900/90 border border-gray-800 hover:border-red-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">24/7 Service</span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Call Sales & Support</p>
              <p className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors">+91 96009 75483</p>
            </a>

            {/* WhatsApp Card */}
            <a
              href="https://wa.me/919600975483"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 bg-gray-900/90 border border-gray-800 hover:border-green-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Instant</span>
              </div>
              <p className="text-xs text-gray-400 font-medium">WhatsApp Live Chat</p>
              <p className="text-base font-extrabold text-white group-hover:text-green-400 transition-colors">Chat With Engineer</p>
            </a>

            {/* Site Visit Card */}
            <a
              href="#inquiry-form"
              className="p-5 bg-gray-900/90 border border-gray-800 hover:border-red-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Free Audit</span>
              </div>
              <p className="text-xs text-gray-400 font-medium">On-Site Inspection</p>
              <p className="text-base font-extrabold text-white group-hover:text-red-400 transition-colors">Book Free Visit</p>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12" id="inquiry-form">
          
          {/* Left Column: Interactive Form (7 Cols) */}
          <div className="lg:col-span-7 bg-card border border-border shadow-xl rounded-3xl p-6 sm:p-10 space-y-6">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Fast Response Guarantee</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">Request a Callback</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Select your service requirement and our senior technician will call you within 10 minutes.
              </p>
            </div>

            {/* Service Type Selection Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Select Requirement *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {inquiryTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedType === type.id
                        ? "bg-red-500 text-white border-red-500 shadow-md"
                        : "bg-muted/60 text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {submitted ? (
              <div className="py-10 text-center space-y-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div className="h-14 w-14 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Request Submitted Successfully!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Thank you, <strong className="text-foreground">{formData.name}</strong>. Our security engineer is reviewing your request for <strong className="text-foreground">{selectedType}</strong> and will call <strong className="text-foreground">{formData.phone}</strong> shortly.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 text-xs font-bold"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Your Name *</label>
                    <Input
                      required
                      placeholder="e.g. John Miller"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Phone Number *</label>
                    <Input
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: cleaned });
                      }}
                      className={`bg-background h-10 ${
                        formData.phone && (formData.phone.length !== 10 || !/^[6-9]\d{9}$/.test(formData.phone))
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }`}
                    />
                    {formData.phone && formData.phone.length < 10 && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">
                        Phone number must be exactly 10 digits ({formData.phone.length}/10)
                      </p>
                    )}
                    {formData.phone && formData.phone.length === 10 && !/^[6-9]\d{9}$/.test(formData.phone) && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">
                        Must start with 6, 7, 8, or 9 for valid Indian mobile number
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Email Address (Optional)</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">City / Location *</label>
                    <Input
                      required
                      placeholder="e.g. New York, NY"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-background h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Describe Your Property or Need</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Need 4 4K cameras for a 2-story home with mobile app viewing..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-md border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold h-12 text-sm gap-2 shadow-lg transition-all hover:scale-[1.01]"
                >
                  <Send className="h-4 w-4" /> Get Free Consultation & Callback
                </Button>

                <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-red-500" />
                  Your information is 100% encrypted & never shared with third parties.
                </p>
              </form>
            )}
          </div>

          {/* Right Column: Office Info & Accordion FAQs (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Experience Center Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">SKTechnology Experience Center</h3>
                  <p className="text-xs text-muted-foreground">Visit our live demo showroom</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-foreground shrink-0">Address:</span>
                  <span className="leading-tight">Down street, 2/222A, Berigai - Shoolagiri Rd,<br/>Dhoodi, Shoolagiri, Tamil Nadu 635117</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-foreground shrink-0">Showroom Hours:</span>
                  <span>Mon – Sat: 9:00 AM – 8:00 PM IST</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-foreground shrink-0">Support Mail:</span>
                  <span>sktechnologycctv@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Accordion FAQs */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
                <HelpCircle className="h-5 w-5 text-red-500" />
                Frequently Asked Questions
              </h3>

              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-border/80 rounded-xl overflow-hidden text-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full text-left p-3.5 font-bold text-foreground flex justify-between items-center hover:bg-muted/50"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-red-500 transition-transform ${
                          openFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === index && (
                      <div className="p-3.5 pt-0 text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
