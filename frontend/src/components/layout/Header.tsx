import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Search,
  ShoppingCart,
  Heart,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Menu,
  X,
  ShoppingBag,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SKLogo from "./SKLogo";

const navItems = [
  {
    name: "Home",
    path: "/",
  },
  {
    name: "Products",
    path: "/products",
    subLinks: [
      { name: "IP Cameras", path: "/products?category=ip" },
      { name: "HD Analog Cameras", path: "/products?category=bullet" },
      { name: "DVR/NVR Recorders", path: "/products?category=dvr" },
      { name: "Video Door Phones", path: "/products?category=vdp" },
      { name: "Access Control", path: "/products?category=cctv" },
      { name: "Accessories", path: "/products?category=accessories" },
    ],
  },
  {
    name: "Services",
    path: "/services",
  },
  {
    name: "About Us",
    path: "/about",
  },
  {
    name: "Contact",
    path: "/contact",
  },
];

export default function Header() {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const [userToken, setUserToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
        const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(count);

        const wishlist = JSON.parse(localStorage.getItem("customer_wishlist") || "[]");
        setWishlistCount(Array.isArray(wishlist) ? wishlist.length : 0);
      } catch {
        setCartCount(0);
        setWishlistCount(0);
      }
    };

    updateCounts();
    window.addEventListener("storage", updateCounts);
    window.addEventListener("cart-updated", updateCounts);
    window.addEventListener("wishlist-updated", updateCounts);
    return () => {
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("cart-updated", updateCounts);
      window.removeEventListener("wishlist-updated", updateCounts);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileProductsOpen(false);
    setShowSearchDropdown(false);
  }, [location]);

  // Fetch live products for instant search suggestions
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setAllProducts(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Click outside listener to close dropdowns and search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter top 5 instant search matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter((p) => {
        const name = (p.name || p.title || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const subCat = (p.subCategory || p.subcategory || "").toLowerCase();
        return name.includes(q) || brand.includes(q) || category.includes(q) || subCat.includes(q);
      })
      .slice(0, 5);
  }, [searchQuery, allProducts]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/products");
    }
    setShowSearchDropdown(false);
    setMobileMenuOpen(false);
  };

  const handleSelectProduct = (productId: string | number) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/products/${productId}`);
  };

  // Monitor Auth State
  useEffect(() => {
    const checkAuth = () => {
      setUserToken(localStorage.getItem("user_token"));
      setUserName(localStorage.getItem("user_name"));
    };

    checkAuth();

    // Listen for custom events or storage events to update auth status
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_phone");
    setUserToken(null);
    setUserName(null);
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/";
  };

  return (
    <div className="w-full">
      {/* Top Contact & Login Bar */}
      <div className="w-full bg-[#0b0f19] text-gray-200 text-sm py-2.5 border-b border-gray-800/60">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Contact Details */}
          <div className="flex items-center gap-6">
            <a href="tel:+919600975483" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="h-4 w-4 text-red-500" />
              <span className="font-medium">+91 96009 75483</span>
            </a>
            <a href="mailto:sktechnologycctv@gmail.com" className="hidden sm:flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="h-4 w-4 text-red-500" />
              <span>sktechnologycctv@gmail.com</span>
            </a>
            <div className="hidden lg:flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="truncate max-w-[200px]">Shoolagiri, Tamil Nadu</span>
            </div>
          </div>

          {/* Social Icons & Auth Link */}
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-4 text-gray-300">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M14 13.5h2.5l1-4H14V7.5c0-1.1.9-2 2-2h1.5V1.6C17.2 1.5 16 1.4 14.8 1.4c-3.4 0-5.8 2.1-5.8 6v2.1H6v4h3v10h5v-10z"/>
                </svg>
              </a>
              <a href="https://instagram.com/sktechnology" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-gray-700/80"></div>

            {userToken ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-xs font-semibold">Hi, {userName || "Customer"}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 hover:text-white font-medium transition-colors">
                <User className="h-4 w-4 text-red-500" />
                <span className="text-gray-100">Login / Register</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-20 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <SKLogo variant="horizontal" theme="original" iconClassName="h-14 w-auto" />
          </Link>

          {/* Centered Navigation Bar */}
          <nav ref={navRef} className="hidden md:flex items-center gap-3.5 lg:gap-5 xl:gap-7 2xl:gap-8 text-sm font-semibold text-foreground/90 shrink-0">
            {navItems.map((item) => {
              const hasSubLinks = Boolean(item.subLinks && item.subLinks.length > 0);
              const isOpen = activeDropdown === item.name;

              if (!hasSubLinks) {
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="hover:text-red-500 transition-colors py-2 relative group whitespace-nowrap inline-flex items-center"
                  >
                    <span>{item.name}</span>
                    <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                );
              }

              return (
                <div
                  key={item.name}
                  className="relative group py-2 flex items-center whitespace-nowrap"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {/* Main Nav Link Button */}
                  <div
                    onClick={() => setActiveDropdown(isOpen ? null : item.name)}
                    className="flex items-center gap-1 cursor-pointer hover:text-red-500 transition-colors py-0 select-none relative group/prod"
                  >
                    <Link to={item.path} className="hover:text-red-500 transition-colors whitespace-nowrap">
                      {item.name}
                    </Link>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-red-500 ${
                        isOpen ? "rotate-180 text-red-500" : ""
                      }`}
                    />
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover/prod:w-full"></span>
                  </div>

                  {/* Dropdown Menu Popup */}
                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 rounded-2xl bg-white border border-gray-200/90 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-0.5">
                        {item.subLinks!.map((sub) => (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-800 hover:text-red-500 hover:bg-red-50/80 rounded-xl transition-all duration-150 group/sub"
                          >
                            <span>{sub.name}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-transparent group-hover/sub:bg-red-500 transition-colors"></span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Actions: Search, Cart, User & CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-3 lg:ml-6">
            {/* Search Bar with Live Instant Results */}
            <div ref={searchRef} className="hidden lg:block relative w-44 xl:w-56 2xl:w-64">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchDropdown(true);
                  }}
                  placeholder="Search cameras, NVRs..."
                  className="pl-9 pr-8 h-9 rounded-full bg-muted/60 border-muted-foreground/20 focus-visible:ring-red-500 text-xs w-full transition-all focus:bg-white dark:focus:bg-slate-900 focus:shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Instant Search Suggestions Dropdown */}
              {showSearchDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {searchResults.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Matching Products
                      </div>
                      {searchResults.map((product) => {
                        const img = product.imageUrl || product.image || (Array.isArray(product.photoUrls) ? product.photoUrls[0] : "") || "https://images.unsplash.com/photo-1557597774-9d273605dfa9";
                        const price = product.offerPrice || product.price || 0;
                        const prodId = product._id || product.id;
                        return (
                          <div
                            key={prodId}
                            onClick={() => handleSelectProduct(prodId)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                          >
                            <img
                              src={img}
                              alt={product.name || product.title}
                              className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-slate-100 dark:border-slate-800 shrink-0"
                              onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-red-500 transition-colors">
                                {product.name || product.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  {product.brand || "SK-VISION"}
                                </span>
                                <span className="text-xs font-extrabold text-red-600">
                                  ₹{Number(price).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit()}
                        className="w-full text-center py-2 px-3 mt-1 bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>View all results for "{searchQuery}"</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-500">No matching products found</p>
                      <button
                        type="button"
                        onClick={() => handleSearchSubmit()}
                        className="mt-2 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Search catalog for "{searchQuery}" →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Wishlist Button - Desktop only (hidden on mobile, moved inside mobile menu) */}
            <Link to="/products?filter=wishlist" title="View Wishlist" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted text-foreground">
                <Heart className="h-5 w-5 hover:text-red-500 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow animate-in scale-in duration-200">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Shopping Cart Button - Desktop only (hidden on mobile, moved inside mobile menu) */}
            <Link to="/cart" title="Shopping Cart" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted text-foreground">
                <ShoppingCart className="h-5 w-5 hover:text-red-500 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow animate-in scale-in duration-200">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {userToken ? (
              <Link to="/dashboard?tab=profile" title={`Logged in as ${userName || "Customer"}`} className="shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center font-bold text-xs bg-red-500/10 text-red-500 border border-red-500/20 cursor-pointer">
                  {(userName || "C").charAt(0).toUpperCase()}
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex shrink-0">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-full text-xs font-bold border-slate-300 hover:border-red-500 hover:text-red-500 transition-all whitespace-nowrap">
                  Login
                </Button>
              </Link>
            )}


            {/* Mobile Menu Toggle (Far Right on Mobile) */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9 rounded-full hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-xl z-[45] animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col p-4 px-6 space-y-3">
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative pb-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cameras, NVRs..."
                className="pl-9 pr-4 h-9 rounded-xl bg-muted/60 border-muted-foreground/20 text-xs w-full focus-visible:ring-red-500"
              />
            </form>

            {/* Mobile View Quick Actions: Wishlist & Cart */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100/60 dark:border-gray-800">
              <Link 
                to="/products?filter=wishlist" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-all shadow-2xs"
              >
                <div className="relative flex items-center">
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span>Wishlist ({wishlistCount})</span>
              </Link>

              <Link 
                to="/cart" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 text-red-700 dark:text-red-300 font-bold text-xs hover:bg-red-100 transition-all shadow-2xs"
              >
                <div className="relative flex items-center">
                  <ShoppingCart className="h-4 w-4 text-red-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span>Cart ({cartCount})</span>
              </Link>
            </div>

            {navItems.map((item) => (
              <div key={item.name} className="flex flex-col">
                {item.subLinks ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                      className="w-full flex items-center justify-between text-[15px] font-bold text-foreground py-2 border-b border-gray-100/50 hover:text-red-500 transition-colors text-left cursor-pointer"
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          mobileProductsOpen ? "rotate-180 text-red-500" : ""
                        }`}
                      />
                    </button>
                    {mobileProductsOpen && (
                      <div className="pl-4 flex flex-col mt-2 mb-2 space-y-2 border-l-2 border-red-200 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Link
                          to="/products"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileProductsOpen(false);
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700 py-1 transition-colors pl-2"
                        >
                          All Products Catalog →
                        </Link>
                        {item.subLinks.map((sub) => (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setMobileProductsOpen(false);
                            }}
                            className="text-xs font-semibold text-muted-foreground hover:text-red-500 py-1 transition-colors pl-2"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link 
                    to={item.path} 
                    className="text-[15px] font-bold text-foreground py-2 border-b border-gray-100/50 hover:text-red-500 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}

            {/* My Profile */}
            <div className="flex flex-col">
              <Link 
                to={userToken ? "/dashboard?tab=profile" : "/login"} 
                className="text-[15px] font-bold text-foreground py-2 border-b border-gray-100/50 hover:text-red-500 transition-colors flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-red-500" />
                  <span>My Profile</span>
                </div>
                {!userToken && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Login
                  </span>
                )}
              </Link>
            </div>

            {/* My Orders */}
            <div className="flex flex-col">
              <Link 
                to={userToken ? "/dashboard?tab=orders" : "/login"} 
                className="text-[15px] font-bold text-foreground py-2 border-b border-gray-100/50 hover:text-red-500 transition-colors flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-4 w-4 text-red-500" />
                  <span>My Orders</span>
                </div>
                {!userToken && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Login
                  </span>
                )}
              </Link>
            </div>

            {/* Logout button for logged in user */}
            {userToken && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-[14px] font-bold text-red-600 hover:text-red-700 py-2 border-b border-gray-100/50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout ({userName || "Customer"})</span>
              </button>
            )}

            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="pt-4 pb-2 block w-full">
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-10 rounded-full shadow-md">
                Get Quote / Contact Us
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
