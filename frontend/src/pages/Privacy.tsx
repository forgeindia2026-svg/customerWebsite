import { ShieldCheck } from "lucide-react";

export default function Privacy() {
  return (
    <div className="bg-background text-foreground py-14 min-h-screen">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LEGAL INFORMATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Introduction</h2>
            <p>
              SK Technology ("we", "our", or "us") is dedicated to safeguarding your privacy. This Privacy Policy clarifies how we gather, utilize, disclose, and secure your personal and surveillance data when you utilize our website, mobile application, and installation services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
            <p>
              We collect information that you supply directly during inquiry submission, service booking, equipment purchase, or account registration:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact Information:</strong> Name, phone number, email address, and installation site address.</li>
              <li><strong>Order & Billing Information:</strong> Purchase history, hardware serial numbers, and transaction IDs.</li>
              <li><strong>Technical Service Data:</strong> Device IP parameters, DVR/NVR network settings required solely for mobile app configuration.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Surveillance Video Privacy Guarantee</h2>
            <p>
              <strong>We do not access, view, or record your private camera footage.</strong> All video footage is saved strictly onto your local storage drives (HDD/SD Card) or personal cloud account credentials. Our technicians only assist in initial network setup and hand over complete master credentials directly to you.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy, please contact our support desk at <a href="mailto:sktechnologycctv@gmail.com" className="text-red-500 font-bold underline">sktechnologycctv@gmail.com</a> or call <a href="tel:+919600975483" className="text-red-500 font-bold underline">+91 96009 75483</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
