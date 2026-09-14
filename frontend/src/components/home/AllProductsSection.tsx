import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Star,
  Heart,
  CheckSquare,
  Search,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Package,
  Layers,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ProductItem {
  id: string;
  brand: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  inStock: boolean;
  specs: string[];
}

export default function AllProductsSection() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const mapped: ProductItem[] = data.data.map((item: any) => {
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
              name: item.title || item.name || 'Security Product',
              category: item.category || 'CCTV Cameras',
              subCategory: item.subCategory || item.subcategory || '',
              price: finalPrice,
              originalPrice: finalOriginalPrice,
              rating: item.rating || 4.5,
              reviews: item.reviewsCount || Math.floor(Math.random() * 50) + 12,
              image: item.image ? item.image.replace('https://65.0.45.64.sslip.io', API_URL) : '/images/cctv_camera.png',
              badge: badgeStr,
              isNew: item.isNew,
              inStock: item.stock !== undefined ? item.stock > 0 : true,
              specs: item.specs || []
            };
          });
          setProducts(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch all products:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Compute available category tabs
  const categoryTabs = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    const dynamicCats = new Set<string>();

    products.forEach((p) => {
      const cat = p.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
        dynamicCats.add(cat);
      }
      const sub = p.subCategory?.trim();
      if (sub && sub !== cat) {
        counts[sub] = (counts[sub] || 0) + 1;
        dynamicCats.add(sub);
      }
    });

    const tabs = [{ id: "all", label: "All Products", count: products.length }];
    Array.from(dynamicCats).forEach((cat) => {
      if (counts[cat] >= 2) {
        tabs.push({ id: cat, label: cat, count: counts[cat] });
      }
    });
    return tabs;
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category match
        if (selectedCategory !== "all") {
          const matchCat = product.category?.toLowerCase() === selectedCategory.toLowerCase();
          const matchSub = product.subCategory?.toLowerCase() === selectedCategory.toLowerCase();
          if (!matchCat && !matchSub) return false;
        }
        // Search query match
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(query);
          const matchBrand = product.brand.toLowerCase().includes(query);
          const matchCategory = product.category.toLowerCase().includes(query);
          if (!matchName && !matchBrand && !matchCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "discount") {
          const discA = a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const discB = b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return discB - discA;
        }
        if (sortBy === "rating") return b.rating - a.rating;
        return 0; // featured default
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (product: ProductItem) => {
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
        category: product.category || 'cctv',
        quantity: 1
      });
    }
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));

    setToastMessage(`Added "${product.name}" to cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <section className="py-14 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-gray-200 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium line-clamp-1">{toastMessage}</span>
        </div>
      )}

      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Store Catalog ({products.length} Products)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">
              EXPLORE ALL PRODUCTS
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Browse our complete range of high-definition CCTV cameras, smart DVRs, WiFi security systems, and accessories.
            </p>
          </div>

          {/* Direct Link to Full Shop */}
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 hover:underline transition-colors shrink-0"
          >
            <span>View Full Filter Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter Controls Bar: Category Tabs + Search + Sort */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {categoryTabs.map((tab) => {
              const active = selectedCategory.toLowerCase() === tab.id.toLowerCase();
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setVisibleCount(12);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    active
                      ? "bg-red-600 text-white shadow-md shadow-red-600/25 scale-[1.02]"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(12);
                }}
                placeholder="Search by title, brand, or model..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Product Count & Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-xs text-gray-500 font-medium">
                Showing <strong className="text-gray-900">{displayedProducts.length}</strong> of{" "}
                <strong className="text-gray-900">{filteredProducts.length}</strong> items
              </span>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products"
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="featured">Featured / Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 animate-pulse">
                <div className="bg-gray-100 h-40 rounded-xl w-full" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No products matched your search</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Try changing your search term or selecting a different category tab above.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl hover:border-red-200 transition-all duration-300 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Photo Area */}
                  <div className="relative bg-gradient-to-b from-gray-50/80 to-white h-40 sm:h-52 p-4 flex items-center justify-center overflow-hidden border-b border-gray-100">
                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs z-10 tracking-wide">
                        {product.badge}
                      </span>
                    )}
                    {product.isNew && !product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs z-10">
                        NEW
                      </span>
                    )}

                    {/* Wishlist Heart */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 backdrop-blur-xs hover:bg-white flex items-center justify-center text-gray-400 hover:text-red-500 shadow-2xs transition-colors z-10 cursor-pointer"
                      title="Add to Wishlist"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </button>

                    <Link
                      to={`/products/${product.id}`}
                      className="flex items-center justify-center h-full w-full p-2"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/cctv_camera.png';
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-300"
                      />
                    </Link>
                  </div>

                  {/* Content */}
                  <div className="p-3.5 sm:p-4 space-y-2">
                    {/* Brand & Stock */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate">
                        {product.brand}
                      </span>
                      {product.inStock && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          In Stock
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link to={`/products/${product.id}`} className="block">
                      <h3
                        className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">{product.rating}</span>
                      <span className="text-[11px] text-gray-400">({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 pt-1 border-t border-gray-100">
                      <span className="text-base sm:text-lg font-black text-gray-900 font-mono">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through font-mono">
                          ₹{product.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="p-3 sm:p-4 pt-0 flex items-center gap-2">
                  <button
                    onClick={() => setQuickViewProduct(product)}
                    className="flex-1 h-8 sm:h-9 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-gray-500" />
                    <span>Quick View</span>
                  </button>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="h-8 sm:h-9 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer shrink-0"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Products / Progress Footer */}
        {!loading && filteredProducts.length > 0 && (
          <div className="pt-6 pb-2 text-center space-y-4">
            {visibleCount < filteredProducts.length ? (
              <div className="space-y-3">
                <Button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-red-600/25 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  LOAD MORE PRODUCTS ({filteredProducts.length - visibleCount} REMAINING)
                </Button>
                <p className="text-xs text-gray-500 font-medium">
                  Showing {displayedProducts.length} of {filteredProducts.length} products
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 inline-block text-center">
                <p className="text-xs font-bold text-gray-700">
                  🎉 You have viewed all {filteredProducts.length} products in this selection!
                </p>
                <Link
                  to="/products"
                  className="text-xs text-red-600 hover:underline font-bold mt-1 inline-block"
                >
                  Explore Advanced Filters & Comparison in Full Store →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <Dialog
        open={Boolean(quickViewProduct)}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      >
        <DialogContent className="max-w-xl p-6 bg-white sm:rounded-2xl">
          {quickViewProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="relative bg-gray-50 rounded-2xl p-6 flex items-center justify-center border border-gray-100">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/cctv_camera.png';
                  }}
                  className="max-h-52 object-contain"
                />
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-red-600 tracking-wider bg-red-50 px-2 py-0.5 rounded-full">
                    {quickViewProduct.brand}
                  </span>

                  <h2 className="text-base font-bold text-gray-900 mt-1.5 leading-snug">
                    {quickViewProduct.name}
                  </h2>

                  <div className="flex items-center gap-2 mt-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-900">{quickViewProduct.rating}</span>
                    <span className="text-xs text-gray-500">({quickViewProduct.reviews} verified reviews)</span>
                  </div>

                  <div className="flex items-baseline gap-2.5 mt-3">
                    <span className="text-2xl font-black text-gray-900 font-mono">
                      ₹{quickViewProduct.price.toLocaleString("en-IN")}
                    </span>
                    {quickViewProduct.originalPrice > quickViewProduct.price && (
                      <span className="text-sm text-gray-400 line-through font-mono">
                        ₹{quickViewProduct.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                    {quickViewProduct.badge && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                        {quickViewProduct.badge}
                      </span>
                    )}
                  </div>

                  {quickViewProduct.specs && quickViewProduct.specs.length > 0 && (
                    <div className="mt-3 text-[11px] text-gray-600 space-y-1">
                      {quickViewProduct.specs.slice(0, 3).map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-red-500" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                  <Button
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 rounded-xl"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>

                  <Link
                    to={`/products/${quickViewProduct.id}`}
                    onClick={() => setQuickViewProduct(null)}
                    className="px-3.5 h-10 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
