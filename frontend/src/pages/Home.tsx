import HeroCarousel from "@/components/layout/HeroCarousel";
import CategoryCirclesBar from "@/components/home/CategoryCirclesBar";
import ServicesOfferRow from "@/components/home/ServicesOfferRow";
import FlashDealsSection from "@/components/home/FlashDealsSection";
import BestSellers from "@/components/layout/BestSellers";
import AllProductsSection from "@/components/home/AllProductsSection";
import { WhyChooseUsSection, InstallationProcessSection } from "@/components/home/WhyChooseUsAndProcess";
import IndustryLeadersBar from "@/components/home/IndustryLeadersBar";
import CustomerTestimonials from "@/components/home/CustomerTestimonials";
import MobileAppSection from "@/components/home/MobileAppSection";
import TopFeaturesMarquee from "@/components/home/TopFeaturesMarquee";

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-[#f8f9fa] min-h-screen">
      {/* 1. Hero Slide Banner */}
      <HeroCarousel />

      {/* 2. Category Circles Bar */}
      <CategoryCirclesBar />

      {/* 3. Services Offer Cards Row */}
      <ServicesOfferRow />

      {/* 4. FLASH DEALS Section */}
      <FlashDealsSection />

      {/* 5. BEST SELLING PRODUCTS Carousel Slider */}
      <BestSellers />

      {/* 6. ALL PRODUCTS Section (Complete 75+ Products Catalog with Filter Tabs & Search) */}
      <AllProductsSection />

      {/* 7. WHY CHOOSE SK TECHNOLOGY? Section */}
      <WhyChooseUsSection />

      {/* 7. TRUSTED BRANDS Marquee */}
      <IndustryLeadersBar />

      {/* 8. Professional CCTV Installation in 6 Simple Steps */}
      <InstallationProcessSection />

      {/* 9. WHAT OUR CUSTOMERS SAY (Customer Testimonials) */}
      <CustomerTestimonials />

      {/* 10. Mobile App Download Section */}
      <MobileAppSection />

      {/* 11. TOP FEATURES OF ALL IN ONE COMPUTER MARQUEE */}
      <TopFeaturesMarquee />
    </div>
  );
}
