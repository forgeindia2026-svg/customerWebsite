import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, MessageSquareQuote, ShieldCheck } from "lucide-react";

const testimonials = [
  {
    name: "Ramesh Kumar",
    role: "Home Owner",
    rating: 5,
    comment:
      "Excellent service and installation. Highly recommended! The cameras quality is superb and the team was very professional.",
    timeAgo: "2 Months Ago",
  },
  {
    name: "Vikram Singh",
    role: "Office Manager",
    rating: 5,
    comment:
      "Very good quality products and on-time installation. The night vision is crystal clear.",
    timeAgo: "1 Month Ago",
  },
  {
    name: "Anita Sharma",
    role: "Business Owner",
    rating: 5,
    comment:
      "Great support team and quick response. They helped us choose the best solution for our office.",
    timeAgo: "3 Weeks Ago",
  },
  {
    name: "Karthik R",
    role: "Shop Owner",
    rating: 5,
    comment:
      "Best CCTV solution for our shop. Very satisfied with the product quality and after sales support.",
    timeAgo: "1 Week Ago",
  },
  {
    name: "Senthil Nathan",
    role: "Factory Manager",
    rating: 5,
    comment:
      "Installed 16 IP cameras for our warehouse. Outstanding clarity and smooth remote playback on mobile.",
    timeAgo: "3 Days Ago",
  },
  {
    name: "Priya Sundaram",
    role: "Apartment Secretary",
    rating: 5,
    comment:
      "SK Technology provided complete CCTV security for our entire residential complex. Exceptional work!",
    timeAgo: "Yesterday",
  },
];

export default function CustomerTestimonials() {
  const [activePage, setActivePage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  const handlePrev = () => {
    setActivePage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setActivePage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const displayedTestimonials = testimonials.slice(
    activePage * itemsPerPage,
    activePage * itemsPerPage + itemsPerPage
  );

  return (
    <section className="py-10 sm:py-12 bg-slate-50/70 relative border-b border-gray-200/60 overflow-hidden">
      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
        
        {/* Centered Header Section (Compact Proportional Sizes) */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          
          {/* Header Tag Badge */}
          <div className="inline-flex items-center justify-center gap-2 text-[#ff3b30] text-[11px] font-black uppercase tracking-wider">
            <span className="w-6 h-[2px] bg-[#ff3b30]/40 rounded-full"></span>
            <MessageSquareQuote className="h-3.5 w-3.5 text-[#ff3b30]" />
            <span>WHAT OUR CUSTOMERS SAY</span>
            <MessageSquareQuote className="h-3.5 w-3.5 text-[#ff3b30]" />
            <span className="w-6 h-[2px] bg-[#ff3b30]/40 rounded-full"></span>
          </div>

          {/* Main Headline */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Trusted by 1000+ Happy Customers
          </h2>

          {/* Sub-description */}
          <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
            Real experiences from real customers who trust our CCTV solutions for their safety and security.
          </p>
        </div>

        {/* --- MOBILE VIEW: Horizontal Swipe Carousel (All items) --- */}
        <div className="sm:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] -mx-4 px-4 pt-2">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="w-[85vw] shrink-0 snap-center bg-white border border-gray-100/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden min-h-[190px]"
            >
              {/* Watermark Quotation Icon */}
              <div className="absolute top-2 right-3 text-4xl text-red-100/50 font-serif select-none pointer-events-none">
                “
              </div>

              <div className="space-y-2.5 relative z-10">
                <div className="flex items-center gap-2.5 pr-4">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 font-black text-xs flex items-center justify-center border border-red-200/60 shrink-0">
                    {item.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[11px] text-slate-900 leading-snug truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {item.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  {item.comment}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100/80 relative z-10 mt-2">
                <div className="inline-flex items-center gap-1.5 text-[#ff3b30] text-[9px] font-bold bg-red-50/80 px-2 py-0.5 rounded-full border border-red-100/60">
                  <ShieldCheck className="h-2.5 w-2.5 text-[#ff3b30]" />
                  <span>{item.timeAgo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- DESKTOP VIEW: Grid with Pagination (Paginated items) --- */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-center gap-4 lg:gap-6">
            {/* Navigation Arrow - Left */}
            <button
              onClick={handlePrev}
              className="z-20 shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-red-300 text-gray-700 hover:text-[#ff3b30] flex items-center justify-center transition-all duration-300 active:scale-95"
              aria-label="Previous Testimonials"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* 4 Testimonials Cards Grid */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {displayedTestimonials.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-100/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-300 flex flex-col justify-between space-y-3.5 relative overflow-hidden group min-h-[220px]"
                >
                  {/* Watermark Quotation Icon */}
                  <div className="absolute top-2.5 right-3 text-4xl text-red-100/50 font-serif select-none pointer-events-none group-hover:text-red-200/70 transition-colors">
                    “
                  </div>

                  <div className="space-y-3 relative z-10">
                    {/* User Profile Info Header */}
                    <div className="flex items-center gap-2.5 pr-4">
                      <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 font-black text-xs flex items-center justify-center border border-red-200/70 shadow-xs shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                        {item.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-xs text-slate-900 leading-snug truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.role}
                        </p>
                      </div>
                    </div>

                    {/* 5-Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>

                    {/* Comment Quote Text */}
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      {item.comment}
                    </p>
                  </div>

                  {/* Time Badge at Bottom */}
                  <div className="pt-2.5 border-t border-gray-100/80 relative z-10">
                    <div className="inline-flex items-center gap-1.5 text-[#ff3b30] text-[10px] font-bold bg-red-50/80 px-2 py-0.5 rounded-full border border-red-100/60">
                      <ShieldCheck className="h-3 w-3 text-[#ff3b30]" />
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Navigation Arrow - Right */}
            <button
              onClick={handleNext}
              className="z-20 shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-red-300 text-gray-700 hover:text-[#ff3b30] flex items-center justify-center transition-all duration-300 active:scale-95"
              aria-label="Next Testimonials"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          {/* Carousel Pagination Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activePage === i
                    ? "w-6 bg-[#ff3b30]"
                    : "w-2 bg-red-200 hover:bg-red-300"
                }`}
                aria-label={`Go to testimonial page ${i + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
