import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, CheckSquare, ChevronLeft, ChevronRight, CheckCircle2, Plus, Minus } from "lucide-react";
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
  const [cartMap, setCartMap] = useState<Record<string, number>>({});
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
        const map: Record<string, number> = {};
        if (Array.isArray(cart)) {
          cart.forEach((item: any) => {
            if (item?.id !== undefined && item?.id !== null) {
              map[String(item.id)] = Number(item.quantity) || 1;
            }
          });
        }
        setCartMap(map);
      } catch {
        setCartMap({});
      }
    };

    syncCart();
    window.addEventListener("cart-updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          let rawList = data.data.filter((p: any) => p.isBestSeller);
          if (rawList.length === 0) {
            rawList = data.data.slice(0, 12);
          }
          const bestSellers = rawList
            .map((item: any) => {
              const rawMrp = Number(item.price) || 0;
              const rawOfferPrice = Number(item.offerPrice) || (item.originalPrice && item.originalPrice > item.price ? Number(item.price) : 0);
              const actualMrp = (item.originalPrice && item.originalPrice > item.price) ? Number(item.originalPrice) : rawMrp;

              const hasOffer = rawOfferPrice > 0 && rawOfferPrice < actualMrp;
              const finalPrice = hasOffer ? rawOfferPrice : actualMrp;
              const finalOriginalPrice = actualMrp;

              const computedDiscountPercent = hasOffer
                ? Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100)
                : (Number(item.discount) > 0 ? Number(item.discount) : 0);

              const badgeStr = hasOffer || computedDiscountPercent > 0
                ? (item.badge || `${computedDiscountPercent}% OFF`)
                : undefined;

              return {
                id: item._id || item.id,
                brand: item.brand || 'SK-Vision',
                name: item.title || item.name || 'Security Camera',
                price: finalPrice,
                originalPrice: finalOriginalPrice,
                rating: item.rating || 4.5,
                reviews: item.reviewsCount || Math.floor(Math.random() * 50) + 10,
                image: item.image ? item.image.replace('https://65.0.45.64.sslip.io', import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io') : '/images/cctv_camera.png',
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

  const handleUpdateCartQty = (product: BestSellingProduct, delta: number) => {
    try {
      const cart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
      const pId = String(product.id);
      const existingIdx = cart.findIndex((item: any) => String(item.id) === pId);

      if (existingIdx > -1) {
        const nextQty = (Number(cart[existingIdx].quantity) || 1) + delta;
        if (nextQty <= 0) {
          cart.splice(existingIdx, 1);
          setToastMessage(`Removed "${product.name}" from cart`);
        } else {
          cart[existingIdx].quantity = nextQty;
          setToastMessage(delta > 0 ? `Updated "${product.name}" quantity (${nextQty})` : `Reduced "${product.name}" quantity`);
        }
      } else if (delta > 0) {
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
        setToastMessage(`Added "${product.name}" to cart!`);
      }

      localStorage.setItem("shopping_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Cart update error:", err);
    }
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
                    className="flex-1 h-8 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="h-3 w-3 text-gray-500" />
                    <span>Quick View</span>
                  </button>

                  {cartMap[String(product.id)] ? (
                    <div className="flex items-center justify-between bg-red-600 text-white rounded-lg h-8 px-1 shadow-sm font-bold select-none shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateCartQty(product, -1);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-1.5 font-black text-xs font-mono tracking-tight text-white">
                        {cartMap[String(product.id)]}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateCartQty(product, 1);
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpdateCartQty(product, 1)}
                      className="h-8 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shrink-0 shadow-sm cursor-pointer"
                      title="Add to Cart"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-[11px]">Add</span>
                    </button>
                  )}
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
                  {cartMap[String(quickViewProduct.id)] ? (
                    <div className="w-full h-10 flex items-center justify-between bg-red-600 text-white rounded-xl px-2.5 shadow-sm font-bold select-none">
                      <button
                        onClick={() => handleUpdateCartQty(quickViewProduct, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-white/80 uppercase font-semibold">In Cart:</span>
                        <span className="font-black text-base font-mono text-white">
                          {cartMap[String(quickViewProduct.id)]}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUpdateCartQty(quickViewProduct, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-90 transition-all text-white cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUpdateCartQty(quickViewProduct, 1)}
                      className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 rounded-xl cursor-pointer"
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
