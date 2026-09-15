import { Link } from "react-router-dom";
import { Camera, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import SKLogo from "./SKLogo";
import PushSubscriber from "../notifications/PushSubscriber";

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0b0f19] text-gray-200 border-t border-gray-800/80 mt-10 sm:mt-16 pt-10 sm:pt-12 pb-6 sm:pb-8">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Footer 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <SKLogo variant="horizontal" theme="light" iconClassName="h-11 sm:h-14 w-auto" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Premium CCTV and smart home security solutions for modern enterprises and homes.
              Professional installation and 24/7 support.
            </p>
            <div className="pt-2">
              <PushSubscriber />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-white mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-red-500 transition-colors">Shop CCTV</Link></li>
              <li><Link to="/services" className="hover:text-red-500 transition-colors">Book Installation</Link></li>
              <li><Link to="/about" className="hover:text-red-500 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-white mb-3 sm:mb-4">Customer Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/dashboard?tab=orders" className="hover:text-red-500 transition-colors">Track Order</Link></li>
              <li><Link to="/dashboard?tab=requests" className="hover:text-red-500 transition-colors">Support Tickets</Link></li>
              <li><Link to="/faq" className="hover:text-red-500 transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-white mb-3 sm:mb-4">Head Office</h3>
            <ul className="space-y-2.5 sm:space-y-3 text-sm text-gray-400">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-tight">Down street, 2/222A, Berigai - Shoolagiri Rd,<br/>Dhoodi, Shoolagiri, Tamil Nadu 635117</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-red-500 shrink-0" />
                <span>+91 96009 75483, +91 99402 52983</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-red-500 shrink-0" />
                <span>sktechnologycctv@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} SKTechnology. All rights reserved.</p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="hover:text-red-500 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-red-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
