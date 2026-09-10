import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

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
  }, [location]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <nav ref={navRef} className="hidden md:flex items-center gap-8 text-sm font-semibold text-foreground/90">
            {navItems.map((item) => {
              const hasSubLinks = Boolean(item.subLinks && item.subLinks.length > 0);
              const isOpen = activeDropdown === item.name;

              if (!hasSubLinks) {
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="hover:text-red-500 transition-colors py-1 relative group"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                );
              }

              return (
                <div
                  key={item.name}
                  className="relative group py-6"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {/* Main Nav Link Button */}
                  <div
                    onClick={() => setActiveDropdown(isOpen ? null : item.name)}
                    className="flex items-center gap-1.5 cursor-pointer hover:text-red-500 transition-colors py-1 select-none"
                  >
                    <Link to={item.path} className="hover:text-red-500 transition-colors">
                      {item.name}
                    </Link>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:text-red-500 ${
                        isOpen ? "rotate-180 text-red-500" : ""
                      }`}
                    />
                  </div>

                  {/* Dropdown Menu Popup */}
                  {isOpen && (
                    <div className="absolute top-full left-0 -mt-2 w-56 rounded-2xl bg-white border border-gray-200/90 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex relative w-56 items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search cameras, NVRs..."
                className="pl-9 pr-4 h-9 rounded-full bg-muted/60 border-muted-foreground/20 focus-visible:ring-red-500 text-xs"
              />
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

            {/* User Profile or Login CTA */}
            {userToken ? (
              <div className="relative group py-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center font-bold text-xs bg-red-500/10 text-red-500 border border-red-500/20">
                  {(userName || "C").charAt(0).toUpperCase()}
                </Button>
                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-white border border-gray-200/90 shadow-xl p-1.5 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 border-b border-gray-100 mb-1 truncate">
                    {userName || "Customer"}
                  </div>
                  <Link
                    to="/dashboard"
                    className="w-full block text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors mb-0.5"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="outline" size="sm" className="rounded-full text-xs font-bold border-slate-300 hover:border-red-500 hover:text-red-500 transition-all">
                  Login
                </Button>
              </Link>
            )}

            <Link to="/contact" className="hidden xl:inline-flex">
              <Button className="h-9 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium text-xs shadow-md transition-all hover:shadow-lg">
                Get Quote
              </Button>
            </Link>

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
                <Link 
                  to={item.path} 
                  className="text-[15px] font-bold text-foreground py-2 border-b border-gray-100/50 hover:text-red-500 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.subLinks && (
                  <div className="pl-4 flex flex-col mt-2 space-y-2 border-l-2 border-red-100 ml-1">
                    {item.subLinks.map((sub) => (
                      <Link
                        key={sub.name}
                        to={sub.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-semibold text-muted-foreground hover:text-red-500 py-1 transition-colors pl-2"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
