import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, CheckSquare, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface BestSellingProduct {
  id: string;
  brand: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  specs: string[];
}

export default function BestSellers() {
  const [products, setProducts] = useState<BestSellingProduct[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<BestSellingProduct | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const bestSellers = data.data
            .filter((p: any) => p.isBestSeller)
            .map((item: any) => {
              const rawPrice = Number(item.price) || 0;
              const rawOriginalPrice = Number(item.originalPrice) || 0;
              const rawDiscount = Number(item.discount) || 0;

              let finalPrice = rawPrice;
              let finalOriginalPrice = rawOriginalPrice;

              if (rawOriginalPrice > rawPrice && rawPrice > 0) {
                finalPrice = rawPrice;
                finalOriginalPrice = rawOriginalPrice;
              } else if (rawDiscount > 0 && rawPrice > 0) {
                finalPrice = Math.round(rawPrice * (1 - rawDiscount / 100));
                finalOriginalPrice = rawPrice;
              } else {
                finalPrice = rawPrice;
                finalOriginalPrice = rawPrice;
              }

              const computedDiscountPercent = finalOriginalPrice > finalPrice
                ? Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100)
                : 0;

              const badgeStr = item.badge 
                ? item.badge 
                : (computedDiscountPercent > 0 ? `${computedDiscountPercent}% OFF` : undefined);

              return {
                id: item._id,
                brand: item.brand || 'SK-Vision',
                name: item.title,
                price: finalPrice,
                originalPrice: finalOriginalPrice,
                rating: item.rating || 4.5,
                reviews: item.reviewsCount || Math.floor(Math.random() * 100) + 10,
                image: item.image ? item.image.replace('https://65.0.45.64.sslip.io', import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io') : '',
                badge: badgeStr,
                isNew: item.isNew,
                specs: item.specs || []
              };
            });
          setProducts(bestSellers);
        }
      })
      .catch(console.error);
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (product: BestSellingProduct) => {
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

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };


  return (
    <section className="py-12 bg-white border-b border-gray-200 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and View All */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
            BEST SELLING PRODUCTS
          </h2>
          <Link
            to="/products"
            className="text-xs font-bold text-gray-600 hover:text-black flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Carousel Container with Controls */}
        <div className="relative group">
          {/* Scroll Prev Button */}
          <button
            onClick={scrollLeft}
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white border border-gray-300 shadow-md items-center justify-center text-gray-700 hover:text-black hover:bg-gray-50 transition-all opacity-90 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Scroll Next Button */}
          <button
            onClick={scrollRight}
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white border border-gray-300 shadow-md items-center justify-center text-gray-700 hover:text-black hover:bg-gray-50 transition-all opacity-90 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Product Cards Slider */}
          <div
            ref={sliderRef}
            className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth pb-2 pt-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] -mx-4 px-4 sm:mx-0 sm:px-1"
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[160px] sm:w-[250px] shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group/card relative snap-start"
              >
                <div>
                  {/* Photo Area */}
                  <div className="relative bg-gray-50 h-32 sm:h-44 p-3 flex items-center justify-center overflow-hidden">
                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-[#e53935] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                        {product.badge}
                      </span>
                    )}
                    {product.isNew && !product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-[#2e7d32] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                        NEW
                      </span>
                    )}

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
                          className="max-h-full max-w-full object-contain group-hover/card:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="p-3.5 space-y-1.5">
                      <Link to={`/products/${product.id}`} className="block">
                        <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight group-hover/card:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-extrabold text-gray-900">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 pt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-800">{product.rating}</span>
                      <span className="text-[11px] text-gray-400">({product.reviews})</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="p-3 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => setQuickViewProduct(product)}
                    className="flex-1 h-7 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <CheckSquare className="h-3 w-3 text-gray-500" />
                    <span>Quick View</span>
                  </button>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="h-7 w-7 rounded bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-colors shrink-0"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <Dialog
        open={Boolean(quickViewProduct)}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      >
        <DialogContent className="max-w-xl p-6 bg-white sm:rounded-xl">
          {quickViewProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative bg-gray-50 rounded-lg p-4 flex items-center justify-center border border-gray-100">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="max-h-48 object-contain"
                />
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {quickViewProduct.name}
                  </h2>

                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-900">{quickViewProduct.rating}</span>
                    <span className="text-xs text-gray-500">({quickViewProduct.reviews} reviews)</span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-extrabold text-gray-900">
                      ₹{quickViewProduct.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{quickViewProduct.originalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="w-full h-9 bg-black hover:bg-gray-800 text-white font-semibold text-xs gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
