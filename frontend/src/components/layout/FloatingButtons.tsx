import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, Mail, Headphones, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function FloatingButtons() {
  const [isOpen, setIsOpen] = useState(false);

  const contactTouchpoints = [
    {
      id: "whatsapp",
      label: "WhatsApp Us",
      subText: "+91 96009 75483",
      icon: MessageCircle,
      bgClass: "bg-[#25D366] hover:bg-[#20ba59] text-white shadow-emerald-500/30",
      action: () => window.open("https://wa.me/919600975483", "_blank"),
    },
    {
      id: "phone",
      label: "Call Support",
      subText: "+91 96009 75483",
      icon: Phone,
      bgClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30",
      action: () => window.open("tel:+919600975483", "_self"),
    },
    {
      id: "email",
      label: "Email Us",
      subText: "sktechnologycctv@gmail.com",
      icon: Mail,
      bgClass: "bg-[#ff3b30] hover:bg-red-700 text-white shadow-red-500/30",
      action: () => window.open("mailto:sktechnologycctv@gmail.com", "_self"),
    },
    {
      id: "instagram",
      label: "Follow Instagram",
      subText: "@sktechnology",
      icon: InstagramIcon,
      bgClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-purple-500/30",
      action: () => window.open("https://instagram.com/sktechnology", "_blank"),
    },
  ];

  return (
    <aside aria-label="Fixed contact shortcuts" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
      {/* Expanded Cluster Stack */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5">
            {contactTouchpoints.map((tp, idx) => {
              const IconComp = tp.icon;
              return (
                <motion.div
                  key={tp.id}
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ delay: idx * 0.06, duration: 0.2 }}
                  className="flex items-center gap-2.5 group"
                >
                  {/* Hover Tooltip Label */}
                  <span className="hidden sm:block opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap backdrop-blur-sm pointer-events-none">
                    {tp.label} <span className="text-slate-400 font-normal text-[11px] ml-1">({tp.subText})</span>
                  </span>

                  {/* Icon Button */}
                  <Button
                    size="icon"
                    onClick={tp.action}
                    aria-label={tp.label}
                    className={`h-12 w-12 sm:h-13 sm:w-13 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 ${tp.bgClass}`}
                  >
                    <IconComp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Toggle Widget Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close contact options" : "Open contact options"}
          style={!isOpen ? { animationDuration: "4.5s" } : undefined}
          className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? "bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700"
              : "bg-[#ff3b30] hover:bg-red-700 text-white animate-pulse"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Headphones className="h-6 w-6" />
          )}
        </Button>
      </motion.div>
    </aside>
  );
}
