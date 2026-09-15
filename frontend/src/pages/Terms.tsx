import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="bg-background text-foreground py-14 min-h-screen">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>TERMS & CONDITIONS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Agreement to Terms</h2>
            <p>
              By accessing our website, purchasing CCTV hardware, or scheduling installation services with SK Technology, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Quotations & Installation Scope</h2>
            <p>
              All installation estimates are based on initial site assessments. Any additional cabling beyond standard package inclusions or specialized civil drill work will be communicated and agreed upon before work begins.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Warranty & Service Deliverables</h2>
            <p>
              Equipment warranties are backed by the respective original equipment manufacturers (OEMs). SK Technology provides installation labor warranty and dedicated AMC support as outlined in your service agreement.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Customer Support</h2>
            <p>
              For any questions or service inquiries, reach out to us at <a href="mailto:sktechnologycctv@gmail.com" className="text-red-500 font-bold underline">sktechnologycctv@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
