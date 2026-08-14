import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, ShoppingCart, ChevronRight, CheckCircle2, AlarmClock } from "lucide-react";

interface FlashDealProduct {
  id: number;
  brand: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  rating: number;
  reviews: number;
  image: string;
}

const flashDealsProducts: FlashDealProduct[] = [
  {
    id: 101,
    brand: "HIKVISION",
    name: "Hikvision 2MP Full HD Bullet Camera",
    price: 2499,
    originalPrice: 3199,
    discount: "-30%",
    rating: 4.8,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 102,
    brand: "DAHUA",
    name: "Dahua 4MP IP Camera Full Color",
    price: 3999,
    originalPrice: 4999,
    discount: "-18%",
    rating: 4.7,
    reviews: 96,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 103,
    brand: "CP PLUS",
    name: "CP Plus 8 Channel DVR",
    price: 6999,
    originalPrice: 8999,
    discount: "-25%",
    rating: 4.6,
    reviews: 75,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 104,
    brand: "SEAGATE",
    name: "Seagate 1TB Surveillance HDD",
    price: 2899,
    originalPrice: 3699,
    discount: "-15%",
    rating: 4.6,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 105,
    brand: "HIKVISION",
    name: "Hikvision 2MP PTZ Camera",
    price: 8999,
    originalPrice: 10999,
    discount: "-22%",
    rating: 4.9,
    reviews: 32,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
  },
];

export default function FlashDealsSection() {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deals, setDeals] = useState<FlashDealProduct[]>([]);

  // Real Ticking Countdown Timer State (02 Days, 12 Hrs, 45 Mins, 30 Secs)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  // Fetch live products to check if any are marked as Flash Deals
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const liveDeals = data.data.filter((item: any) => item.isFlashDeal === true);
          const formatted = liveDeals.map((item: any) => ({
            id: item.id || item._id,
            brand: item.brand || 'SK BRAND',
            name: item.title || item.name,
            price: item.price,
            originalPrice: item.originalPrice || Math.round(item.price * 1.25),
            discount: item.badge || '-20%',
            rating: item.rating || 4.5,
            reviews: item.reviewsCount || 10,
            image: item.image ? item.image.replace('https://65.0.45.64.sslip.io', import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io') : ''
          }));
          setDeals(formatted);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch flash deals:', err);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
    const existing = cart.find((item: any) => item.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: 'cctv',
        quantity: 1
      });
    }
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));

    setToastMessage(`Added "${product.name}" to cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTwoDigits = (num: number) => String(num).padStart(2, "0");

  if (deals.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-white border-b border-gray-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header Bar with Grouped Title & Timer Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-gray-100">
          
          {/* Left Group: FLASH DEALS Title + OFFER ENDS IN Countdown Badge */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            
            {/* Main Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                FLASH DEALS
              </h2>
            </div>

            {/* Offer Countdown Timer Badge */}
            <div className="bg-red-50/80 border border-red-200/90 rounded-2xl px-3.5 py-1.5 flex items-center gap-3 shadow-sm">
              {/* Red Alarm Clock Circle */}
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-[#ff3b30] shrink-0 border border-red-200/60">
                <AlarmClock className="h-4 w-4 animate-pulse" />
              </div>

              {/* Timer Labels & Numbers */}
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-black uppercase text-rose-900 tracking-wider leading-none mb-0.5">
                  OFFER ENDS IN
                </span>
                <div className="flex items-baseline gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-[#ff3b30] leading-none">
                      {formatTwoDigits(timeLeft.days)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">DAYS</span>
                  </div>
                  <span className="text-xs font-bold text-red-300 -mt-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-[#ff3b30] leading-none">
                      {formatTwoDigits(timeLeft.hours)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">HRS</span>
                  </div>
                  <span className="text-xs font-bold text-red-300 -mt-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-[#ff3b30] leading-none">
                      {formatTwoDigits(timeLeft.minutes)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">MINS</span>
                  </div>
                  <span className="text-xs font-bold text-red-300 -mt-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-black text-[#ff3b30] leading-none">
                      {formatTwoDigits(timeLeft.seconds)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">SECS</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Link */}
          <Link
            to="/products"
            className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors self-start sm:self-center shrink-0"
          >
            <span>View All Deals</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {deals.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
            >
              <div>
                {/* Photo Container */}
                <div className="relative bg-gray-50 h-48 p-4 flex items-center justify-center overflow-hidden">
                  {/* Discount Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-[#ff3b30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm z-10">
                    {product.discount}
                  </span>

                  {/* Wishlist Heart */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-white/80 backdrop-blur hover:bg-white flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-colors z-10"
                    title="Add to Wishlist"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </button>

                  <Link to={`/products/${product.id}`} className="flex items-center justify-center h-full w-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-1.5">
                  <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase block">
                    {product.brand}
                  </span>

                  <Link to={`/products/${product.id}`} className="block">
                    <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-extrabold text-gray-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{product.originalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 pt-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-gray-800">{product.rating}</span>
                    <span className="text-[11px] text-gray-400">({product.reviews})</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-3.5 pt-0">
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full h-8 rounded-lg bg-white border border-gray-300 hover:bg-black hover:text-white hover:border-black text-gray-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
