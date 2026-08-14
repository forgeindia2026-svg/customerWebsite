import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const fallbackCategories = [
  {
    name: "CCTV Cameras",
    image: "/images/cctv_camera.png",
    link: "/products?category=cctv",
  },
  {
    name: "IP Cameras",
    image: "/images/ip_camera.png",
    link: "/products?category=ip",
  },
  {
    name: "WiFi Cameras",
    image: "/images/wifi_camera.png",
    link: "/products?category=wifi",
  },
  {
    name: "DVR",
    image: "/images/dvr_system.png",
    link: "/products?category=dvr",
  },
  {
    name: "NVR",
    image: "/images/nvr_system.png",
    link: "/products?category=nvr",
  },
  {
    name: "Accessories",
    image: "/images/cctv_accessories.png",
    link: "/products?category=accessories",
  },
  {
    name: "Video Door Phone",
    image: "/images/video_door_phone.png",
    link: "/products?category=vdp",
  },
  {
    name: "Alarm Systems",
    image: "/images/alarm_system.png",
    link: "/products?category=alarm",
  },
];

export default function CategoryCirclesBar() {
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
        const res = await fetch(`${API_URL}/api/categories?featured=true`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const mappedCats = data.data.map((cat: any) => ({
            name: cat.name,
            image: cat.image,
            link: `/products?category=${cat.slug}`,
          }));
          setCategories(mappedCats);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic categories, using fallback.", err);
      }
    };
    fetchCategories();
  }, []);
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-5">
          <h2 className="text-sm font-extrabold tracking-wider uppercase text-gray-900">
            EXPLORE BY CATEGORY
          </h2>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-9 gap-2 sm:gap-6 justify-items-center">
          {categories.map((cat, index) => (
            <Link
              key={index}
              to={cat.link}
              className="flex flex-col items-center gap-1.5 sm:gap-2.5 group cursor-pointer text-center"
            >
              {/* Circular Container with Real Product Photo */}
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-[#f4f6f9] border border-gray-200/70 p-1 sm:p-1.5 flex items-center justify-center overflow-hidden group-hover:bg-white group-hover:border-gray-300 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-[9px] sm:text-[11px] font-semibold text-gray-700 group-hover:text-black transition-colors leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}

          {/* View All Circle Icon */}
          <Link
            to="/products"
            className="flex flex-col items-center gap-1.5 sm:gap-2.5 group cursor-pointer text-center"
          >
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-[#eef2ff] border border-blue-100 p-1.5 sm:p-2 flex items-center justify-center group-hover:bg-white group-hover:border-blue-500 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                <span className="h-2 w-2 sm:h-3.5 sm:w-3.5 rounded-full bg-[#2563eb]"></span>
                <span className="h-2 w-2 sm:h-3.5 sm:w-3.5 rounded-full bg-[#2563eb]"></span>
                <span className="h-2 w-2 sm:h-3.5 sm:w-3.5 rounded-full bg-[#2563eb]"></span>
                <span className="h-2 w-2 sm:h-3.5 sm:w-3.5 rounded-full bg-[#2563eb]"></span>
              </div>
            </div>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#2563eb] group-hover:text-blue-700 transition-colors leading-tight">
              View All
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
