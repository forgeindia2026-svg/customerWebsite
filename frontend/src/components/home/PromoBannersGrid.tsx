import { ArrowRight, Wrench, Shield, Headphones, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

export default function PromoBannersGrid() {
  return (
    <section className="py-12 bg-[#f8f9fa]">
      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1: Professional Installation */}
          <div className="relative bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative z-10 max-w-[65%] space-y-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                Professional Installation
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Certified Technicians <br />
                Quick &amp; Secure Setup
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 hover:text-blue-800 pt-2 group-hover:translate-x-1 transition-transform"
              >
                <span>BOOK NOW</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-center justify-end p-2 opacity-90 group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80"
                alt="Professional CCTV Installation"
                className="h-full w-full object-cover rounded-xl border border-white/60 shadow-sm"
              />
            </div>
          </div>

          {/* Banner 2: 1-Year Installation Warranty */}
          <div className="relative bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative z-10 max-w-[65%] space-y-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                1-Year Installation Warranty
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                100% Guaranteed Setup <br />
                Certified Expert Support
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 pt-2 group-hover:translate-x-1 transition-transform"
              >
                <span>EXPLORE SERVICE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="absolute right-4 bottom-4 flex items-center justify-center h-32 w-32 rounded-full bg-emerald-100/80 border border-emerald-200 shadow-inner group-hover:scale-110 transition-transform">
              <Shield className="h-16 w-16 text-emerald-600 stroke-[1.5]" />
              <Wrench className="h-8 w-8 text-emerald-700 absolute inset-auto stroke-[2]" />
            </div>
          </div>

          {/* Banner 3: Need Help 24/7 */}
          <div className="relative bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative z-10 max-w-[65%] space-y-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                Need Help?
              </h3>
              <p className="text-xs sm:text-sm text-purple-900 font-medium">
                24/7 Customer Support <br />
                We are always here to help you!
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-purple-700 hover:text-purple-900 pt-2 group-hover:translate-x-1 transition-transform"
              >
                <span>CONTACT US</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="absolute right-4 bottom-4 flex items-center justify-center h-32 w-32 rounded-full bg-purple-100/90 border border-purple-200 shadow-md group-hover:scale-110 transition-transform">
              <Headphones className="h-16 w-16 text-purple-600 stroke-[1.5]" />
            </div>
          </div>

          {/* Banner 4: AI Powered Security (Dark Glowing Banner) */}
          <div className="relative bg-[#090d16] border border-blue-900/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-md hover:shadow-xl transition-all group">
            {/* Blue circuit glow background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-black z-0"></div>
            
            <div className="relative z-10 max-w-[65%] space-y-3">
              <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-0.5 rounded-full inline-block">
                Next-Gen AI
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">
                AI POWERED SECURITY
              </h3>
              <p className="text-xs sm:text-sm text-blue-200 font-medium">
                Smart Detection <br />
                Better Protection
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all pt-2 mt-2"
              >
                <span>EXPLORE NOW</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-36 w-36 rounded-2xl bg-blue-900/30 border border-cyan-500/40 backdrop-blur shadow-2xl group-hover:scale-105 transition-transform">
              <Cpu className="h-20 w-20 text-cyan-400 animate-pulse stroke-[1.5]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
