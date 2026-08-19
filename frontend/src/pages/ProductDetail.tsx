import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  ShieldCheck, 
  Truck, 
  ChevronRight, 
  Plus, 
  Minus, 
  Play, 
  Check, 
  HelpCircle, 
  Video, 
  Clock, 
  Info,
  ChevronDown,
  User,
  ThumbsUp,
  MapPin,
  Lock,
  ArrowRight
} from 'lucide-react';

interface Product {
  id: number;
  brand: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  discountBadge?: string;
  isNew?: boolean;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  warranty: string;
  freeDelivery: boolean;
  image: string;
  images?: string[];
  modelName?: string;
  discount?: number;
  promotionalOffer?: string;
  description?: string;
  features?: { iconName: string; label: string }[];
  offers?: { title: string; subtitle: string }[];
  specs?: { name: string; value: string }[] | string[];
  resolution?: string;
  delivery?: string;
  relatedProducts?: any[];
}

// Fallback lists if API fails
const mockProductsList: Product[] = [
  {
    id: 1,
    brand: "HIKVISION",
    name: "Hikvision 2MP Full HD Bullet Camera",
    category: "cctv",
    subCategory: "bullet",
    price: 2499,
    originalPrice: 3199,
    discountBadge: "-20%",
    rating: 4.7,
    reviewsCount: 96,
    inStock: true,
    stockCount: 45,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p (2MP)",
    specs: ["1080p Full HD", "20m Smart IR Night Vision", "IP67 Weatherproof metal housing"],
    description: "The Hikvision 2MP Full HD Bullet Camera provides high-definition analog output. With infrared smart IR technology, it ensures up to 20 meters of visibility even in pitch darkness. Designed with an IP67 weatherproof rating, this camera is highly robust and operates seamlessly in harsh environmental conditions."
  },
  {
    id: 2,
    brand: "DAHUA",
    name: "Dahua 4MP IP Dome Camera",
    category: "cctv",
    subCategory: "dome",
    price: 3999,
    originalPrice: 5499,
    isNew: true,
    rating: 4.7,
    reviewsCount: 96,
    inStock: true,
    stockCount: 28,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    resolution: "4MP (2K)",
    specs: ["4MP Real-Time Resolution", "IK10 Vandal-Proof Rating", "PoE Easy Installation"],
    description: "The Dahua 4MP IP Dome Camera offers state-of-the-art surveillance. It comes equipped with PoE support for ease of wiring, an IK10 vandal-proof housing, and smart motion detection technology. Perfect for both outdoor office entries and indoor shop security monitoring."
  },
  {
    id: 3,
    brand: "CP PLUS",
    name: "CP Plus 2MP HD Bullet Camera",
    category: "cctv",
    subCategory: "bullet",
    price: 2199,
    originalPrice: 2599,
    discountBadge: "-15%",
    rating: 4.6,
    reviewsCount: 75,
    inStock: true,
    stockCount: 60,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p (2MP)",
    specs: ["20m IR Distance", "Full HD Clarity", "Plug and Play"],
    description: "The CP Plus 2MP HD Bullet Camera is an economical and practical solution for home and retail store security. It operates on a plug-and-play basis and offers high-resolution night recording up to 20 meters."
  },
  {
    id: 4,
    brand: "HIKVISION",
    name: "Hikvision 2MP PTZ Speed Dome Camera",
    category: "cctv",
    subCategory: "ptz",
    price: 8999,
    originalPrice: 10999,
    isNew: true,
    rating: 4.9,
    reviewsCount: 64,
    inStock: true,
    stockCount: 12,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    resolution: "2MP (1080p)",
    specs: ["4x Optical Zoom", "Pan-Tilt-Zoom Function", "Smart Intrusion Detection"],
    description: "The Hikvision 2MP PTZ Camera allows remote pan, tilt, and zoom movements via phone apps or NVR dashboards. It offers a 4x optical zoom lens to capture fine details, intelligent human alerts, and smart night vision filtering."
  }
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'features' | 'install' | 'warranty' | 'reviews' | 'faqs'>('desc');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeVerified, setPincodeVerified] = useState(false);

  // Zoom on Hover states
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const containerRef = useRef<HTMLDivElement>(null);

  // Frequently bought together accessories
  const accessories = useMemo(() => {
    if (!product || !product.relatedProducts || !Array.isArray(product.relatedProducts)) return [];
    return product.relatedProducts.map(rp => ({
      id: rp._id || rp.id,
      name: rp.title || rp.name,
      price: rp.price,
      originalPrice: rp.originalPrice || rp.price,
      image: rp.image || rp.imageUrl || (rp.images && rp.images[0]) || "https://via.placeholder.com/150",
      checked: true
    }));
  }, [product]);

  const [checkedAddons, setCheckedAddons] = useState<any[]>([]);

  useEffect(() => {
    if (accessories.length > 0) {
      setCheckedAddons(accessories.map(a => a.id));
    }
  }, [accessories]);

  // Fetch product detail
  useEffect(() => {
    setLoading(true);
    // Attempt live fetch
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          // Format backend fields to fit layout
          const item = data.data;
          setProduct({
            id: item._id || item.id,
            brand: item.brand || 'SK BRAND',
            name: item.title || item.name,
            category: item.category,
            price: item.price,
            originalPrice: item.originalPrice || Math.round(item.price * 1.25),
            discountBadge: item.badge || '-20%',
            rating: item.rating || 4.5,
            reviewsCount: item.reviewsCount || 42,
            inStock: item.stock > 0,
            stockCount: item.stock || 20,
            warranty: item.specs?.find((s: string) => s.toLowerCase().includes('warranty')) || "2 Years Warranty",
            freeDelivery: true,
            image: (item.image ? item.image.replace('https://65.0.45.64.sslip.io', import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io') : null) || "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
            resolution: item.specs?.find((s: string) => s.toLowerCase().includes('mp') || s.toLowerCase().includes('p')) || "1080p (2MP)",
            specs: item.specs || ["Full HD Security Tracking", "Infrared Smart Night Vision"],
            description: item.description || "Premium surveillance hardware ensuring peace of mind."
          });
        } else {
          throw new Error("No data");
        }
      })
      .catch(() => {
        // Fallback to mock product
        const fallback = mockProductsList.find((p) => p.id === Number(id)) || mockProductsList[0];
        setProduct(fallback);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Sync selected image
  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
    }
  }, [product]);

  // Check wishlist state
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (product && list.includes(product.id)) {
      setIsWishlisted(true);
    }
  }, [product]);

  // Alternate images for thumbnail gallery
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      // Ensure the main image is included if not already
      const images = [...product.images];
      if (!images.includes(product.image)) {
        images.unshift(product.image);
      }
      return images;
    }
    return [product.image];
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Product Not Found</h2>
        <Link to="/products" className="text-blue-600 hover:underline">Back to Shop</Link>
      </div>
    );
  }

  // Hover Zoom Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${selectedImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  // Add to Cart
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
    const existing = cart.find((item: any) => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        quantity: quantity
      });
    }
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    
    // Add check addons
    checkedAddons.forEach(addonId => {
      const addon = accessories.find(a => a.id === addonId);
      if (addon) {
        const existAddon = cart.find((item: any) => item.id === addon.id);
        if (existAddon) {
          existAddon.quantity += 1;
        } else {
          cart.push({
            id: addon.id,
            name: addon.name,
            brand: "SK SOLUTIONS",
            price: addon.price,
            originalPrice: addon.originalPrice,
            image: addon.image,
            category: "accessories",
            quantity: 1
          });
        }
      }
    });
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
  };

  // Buy Now
  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  // Wishlist Toggle
  const handleToggleWishlist = () => {
    let list = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (isWishlisted) {
      list = list.filter((item: number) => item !== product.id);
      setIsWishlisted(false);
    } else {
      list.push(product.id);
      setIsWishlisted(true);
    }
    localStorage.setItem("wishlist", JSON.stringify(list));
  };

  // Pincode Verification
  const verifyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6 && !isNaN(Number(pincode))) {
      setPincodeVerified(true);
    }
  };

  // Addons toggle
  const toggleAddon = (id: number) => {
    setCheckedAddons(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Total price calculation for addons
  const addonTotal = checkedAddons.reduce((sum, currentId) => {
    const item = accessories.find(a => a.id === currentId);
    return sum + (item ? item.price : 0);
  }, 0);

  return (
    <div className="bg-white text-gray-800 font-sans min-h-screen">
      {/* Toast Feedback */}
      {addedToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-slate-800 animate-bounce">
          <ShoppingCart className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-bold">Successfully added to Cart!</span>
        </div>
      )}

      {/* Main Breadcrumbs */}
      <div className="border-b border-gray-100 py-3.5 bg-gray-50/50">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-blue-600">CCTV Products</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        
        {/* ================== PRODUCT OVERVIEW ROW ================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* LEFT SIDE: Image Gallery & Hover Zoom */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Main Interactive Zoom Box */}
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-square w-full bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden cursor-zoom-in"
            >
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="max-h-[85%] max-w-[85%] object-contain transition-transform duration-200"
              />
              
              {/* Floating Magnified Glass Overlay */}
              <div 
                style={zoomStyle}
                className="absolute inset-0 pointer-events-none rounded-2xl border border-gray-100 shadow-inner bg-no-repeat z-20"
              />

              {/* Discount / Category Badge */}
              <span className="absolute top-4 left-4 bg-blue-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-lg shadow-sm z-10 uppercase tracking-wider">
                {product.discountBadge ? `${product.discountBadge.replace('-', '')} OFF` : '2% OFF'}
              </span>
            </div>

            {/* Thumbnail Navigation Gallery */}
            <div className="flex gap-3 justify-center">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-16 bg-gray-50 border rounded-xl overflow-hidden p-1.5 flex items-center justify-center transition-all ${
                    selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Key Specifications & Pricing */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Headers */}
            <div className="space-y-2 text-left">
              <span className="text-xs font-black tracking-widest text-blue-600 uppercase">
                {product.brand}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>
              {product.modelName && (
                <p className="text-sm font-semibold text-gray-500 mt-1">
                  Model: {product.modelName}
                </p>
              )}
              
              {/* Rating & Assured Tag */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-0.5 bg-emerald-600 text-white text-xs font-extrabold px-2 py-0.5 rounded">
                  <span>{product.rating}</span>
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {product.reviewsCount} Ratings & Reviews
                </span>
                <span className="text-gray-300">|</span>
                <div className="bg-blue-50 border border-blue-100 rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">SK Assured</span>
                </div>
              </div>
            </div>

            {/* Price Detail Block */}
            <div className="bg-gray-50/70 border border-gray-100/50 rounded-2xl p-5 space-y-3.5 text-left">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-black text-slate-900">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                  {product.discountBadge ? `${product.discountBadge.replace('-', '')} OFF` : (product.discount ? `${product.discount}% OFF` : '2% OFF')}
                </span>
              </div>

              {(product.promotionalOffer || product.offers) && (
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">Special Offer</span>
                  </div>
                  <p className="text-sm font-medium text-orange-800 mt-1">
                    {product.promotionalOffer || product.offers}
                  </p>
                </div>
              )}
              
              {/* EMI Callout */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-650 pt-1">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-extrabold">No Cost EMI</span>
                <span>Starting from <strong className="text-slate-900">₹299/month</strong>. Standard plans available.</span>
              </div>
            </div>

            {/* Logistics & Delivery details */}
            <div className="space-y-3 text-left border-y border-gray-100 py-4">
              
              {/* Pincode search wrapper */}
              <form onSubmit={verifyPincode} className="flex items-center gap-2.5 max-w-sm mb-4">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-450" />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter Delivery Pincode"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 font-medium"
                    maxLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl h-10 shadow-sm"
                >
                  Verify
                </button>
              </form>

              {pincodeVerified && (
                <p className="text-xs font-bold text-emerald-600 -mt-2 mb-2 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Fast delivery available to your region!
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-slate-650">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>{product.warranty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span>Stock: <strong className="text-slate-900">{product.inStock ? `In Stock (${product.stockCount} left)` : 'Out of Stock'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Controls */}
            <div className="flex items-center gap-4 flex-wrap text-left pt-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2.5 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-5 font-bold text-sm text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2.5 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 rounded-xl bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 h-12 rounded-xl bg-[#ff9f00] hover:bg-[#e08b00] text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Buy Now</span>
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all ${
                  isWishlisted 
                    ? 'bg-red-50 border-red-200 text-red-500' 
                    : 'bg-white border-gray-200 text-gray-400 hover:text-red-500'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ================== DETAILED SPECIFICATION TABS ================== */}
        <div className="border-t border-gray-100 pt-8 mb-12">
          
          {/* Tab Switcher Headers */}
          <div className="flex gap-4 border-b border-gray-100 overflow-x-auto no-scrollbar mb-6">
            {[
              { id: 'desc', label: 'Description' },
              { id: 'specs', label: 'Specifications' },
              { id: 'features', label: 'Key Features' },
              { id: 'install', label: 'Installation' },
              { id: 'warranty', label: 'Warranty Policy' },
              { id: 'reviews', label: `Reviews (${product.reviewsCount})` },
              { id: 'faqs', label: 'FAQs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs sm:text-sm font-extrabold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="bg-gray-50/30 border border-gray-100 rounded-2xl p-6 sm:p-8 text-left shadow-sm min-h-[250px]">
            {activeTab === 'desc' && (
              <div className="space-y-4 max-w-4xl">
                <h3 className="text-lg font-bold text-slate-900">Product Description</h3>
                <p className="text-sm leading-relaxed text-slate-650">{product.description}</p>
                <p className="text-sm leading-relaxed text-slate-650">
                  Ensure 24/7 continuous monitoring inside your store, parking area, or home front. This camera coordinates intelligent frame filtering to ignore false visual alarms such as wind or leaves, alerting you only to real human occurrences.
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-3xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Technical Specifications</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs sm:text-sm">
                    <tbody>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-slate-600 w-1/3">Brand</td>
                        <td className="px-4 py-3 text-slate-800">{product.brand}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold text-slate-600">Model</td>
                        <td className="px-4 py-3 text-slate-800">{product.name}</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-slate-600">Resolution</td>
                        <td className="px-4 py-3 text-slate-800">{product.resolution}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold text-slate-600">Camera Type</td>
                        <td className="px-4 py-3 text-slate-800 capitalize">{product.subCategory || 'Bullet'}</td>
                      </tr>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-slate-600">Warranty</td>
                        <td className="px-4 py-3 text-slate-800">{product.warranty}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold text-slate-600">Weatherproofing</td>
                        <td className="px-4 py-3 text-slate-800">IP67 Weatherproof Rated</td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-slate-600">Connection Mode</td>
                        <td className="px-4 py-3 text-slate-800">Power Over Ethernet / Analog Coaxial</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Key Features & Highlights</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.specs.map((spec, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-650">
                      <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{spec}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-sm text-slate-650">
                    <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>Infrared Night Vision up to 25 meters range.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-slate-650">
                    <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>Supports Smart Mobile Application alerting.</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'install' && (
              <div className="space-y-4 max-w-4xl">
                <h3 className="text-lg font-bold text-slate-900">Professional Installation Services</h3>
                <p className="text-sm leading-relaxed text-slate-650">
                  Book a certified SK Technology technician to perform your site mounting, cabling setup, NVR system configuration, and phone app linking! 
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3 text-xs sm:text-sm text-blue-700">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">How to Book?</strong>
                    You can schedule a professional site mounting on our Services Booking page, or add "Installation Service Pack" on your checkout bag.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'warranty' && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="text-lg font-bold text-slate-900">Warranty Coverage</h3>
                <p className="text-sm text-slate-650 leading-relaxed">
                  Your purchase includes a <strong className="text-slate-900">{product.warranty}</strong> replacement promise covering manufacturing defects or hardware malfunctions.
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                  <li>Coverage includes camera sensors, lenses, and PoE processors.</li>
                  <li>Physical damage or unauthorized disassembly voids coverage.</li>
                  <li>Complimentary courier pickup during the repair/exchange period.</li>
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex gap-8 items-center border-b border-gray-150 pb-6 flex-wrap">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-slate-900 leading-none block">{product.rating}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">Out of 5 Stars</span>
                  </div>
                  <div className="flex-1 space-y-1.5 max-w-xs">
                    {[5, 4, 3, 2, 1].map(stars => (
                      <div key={stars} className="flex items-center gap-2 text-xs">
                        <span className="font-bold w-3">{stars}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : '5%' }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Review Comments */}
                <div className="space-y-5">
                  <div className="text-xs sm:text-sm border-b border-gray-100 pb-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <span>5</span>
                        <Star className="h-2 w-2 fill-white text-white" />
                      </div>
                      <strong className="font-bold text-slate-900">Highly Recommend! Clear Night Vision</strong>
                    </div>
                    <p className="text-slate-600 leading-relaxed py-1">
                      Installed this bullet camera on my main gate entrance. The smart IR feature is incredible, pitch black darkness looks extremely bright!
                    </p>
                    <div className="text-slate-400 text-xs flex items-center gap-2 pt-1 font-semibold">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Rajesh Kumar</span>
                      <span>• Verified Purchase • 2 weeks ago</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm border-b border-gray-100 pb-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <span>4</span>
                        <Star className="h-2 w-2 fill-white text-white" />
                      </div>
                      <strong className="font-bold text-slate-900">Good Build Quality</strong>
                    </div>
                    <p className="text-slate-600 leading-relaxed py-1">
                      Solid metal casing housing the lens. Waterproof sealing stands rain perfectly. Highly satisfied.
                    </p>
                    <div className="text-slate-400 text-xs flex items-center gap-2 pt-1 font-semibold">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Amit Patel</span>
                      <span>• Verified Purchase • 1 month ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-4 max-w-4xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Frequently Asked Questions</h3>
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <strong className="block font-bold text-slate-900 mb-1">Q: Does this camera support PoE?</strong>
                    <p className="text-slate-650 leading-relaxed">A: Yes, if you selected the IP camera model, it draws power directly through the RJ45 ethernet cable, meaning no individual power adapter is required near the mounting spot.</p>
                  </div>
                  <div>
                    <strong className="block font-bold text-slate-900 mb-1">Q: Can I view the camera live feed on my mobile phone?</strong>
                    <p className="text-slate-650 leading-relaxed">A: Absolutely! We provide a free application download for iOS and Android devices, enabling cloud remote monitoring anywhere in the world.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================== FREQUENTLY BOUGHT TOGETHER ================== */}
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8 mb-12 text-left shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Frequently Bought Together</h3>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Horizontal Items Row */}
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Primary Product */}
              <div className="flex items-center gap-3 p-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-sm max-w-xs shrink-0">
                <img src={product.image} alt={product.name} className="h-14 w-14 object-contain" />
                <div className="text-xs">
                  <strong className="block font-bold text-slate-800 line-clamp-1">{product.name}</strong>
                  <span className="text-slate-900 font-extrabold mt-1 block">₹{product.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <span className="text-xl font-bold text-slate-400">+</span>

              {/* Accessories Loop */}
              {accessories.map(addon => (
                <div 
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex items-center gap-3 p-3.5 border rounded-2xl shadow-sm max-w-xs shrink-0 cursor-pointer transition-all ${
                    checkedAddons.includes(addon.id) ? 'bg-white border-blue-500' : 'bg-gray-100/50 border-gray-250 hover:bg-white'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={checkedAddons.includes(addon.id)} 
                    onChange={() => {}} // handled by click wrapper
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 shrink-0" 
                  />
                  <img src={addon.image} alt={addon.name} className="h-14 w-14 object-contain rounded-lg" />
                  <div className="text-xs">
                    <strong className="block font-bold text-slate-800 line-clamp-1">{addon.name}</strong>
                    <span className="text-slate-900 font-extrabold mt-1 block">₹{addon.price.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Price & Action Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full lg:w-72 shadow-sm text-left">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Combo Offer Total</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">₹{(product.price + addonTotal).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bundle consists of {checkedAddons.length + 1} item(s).</p>
              <button
                onClick={handleAddToCart}
                className="w-full mt-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Add Combo to Cart
              </button>
            </div>

          </div>
        </div>

        {/* ================== VISUAL INSTALLATION PROCESS ================== */}
        <div className="border-t border-gray-100 py-10 mb-6 text-left">
          <h3 className="text-lg font-bold text-slate-900 mb-1">CCTV Installation Process</h3>
          <p className="text-xs text-slate-500 mb-8">Professional installation in 5 simple, guaranteed steps.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { step: '01', title: 'Site Survey', desc: 'Optimal height & coverage angle calculation.' },
              { step: '02', title: 'Mounting & Wiring', desc: 'Secure weatherproof mounting & neat PoE cabling.' },
              { step: '03', title: 'NVR Configuration', desc: 'Formatting secure backup recording drive.' },
              { step: '04', title: 'Mobile Integration', desc: 'Configuring direct live-streaming remote apps.' },
              { step: '05', title: 'Handover & Training', desc: 'Demonstrating smart playback functions.' }
            ].map((proc, i) => (
              <div key={i} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3 relative group hover:border-blue-400 transition-colors">
                <span className="text-3xl font-black text-blue-100 group-hover:text-blue-500 transition-colors">{proc.step}</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">{proc.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{proc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================== PRODUCT VIDEOS PANEL ================== */}
        <div className="bg-slate-900 rounded-3xl p-8 mb-12 text-left relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url(${product.image})` }} />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
            <div className="space-y-2">
              <span className="bg-blue-600/35 border border-blue-500/40 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Video Demonstration</span>
              <h3 className="text-xl sm:text-2xl font-black text-white">Hikvision Smart IR Security Live Demo</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Observe the camera's auto switching threshold between bright sunlight and dark pitch black night vision. High frame rates ensure zero motion blur.
              </p>
            </div>
            
            {/* Fake Video Play Trigger Button */}
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-500 hover:scale-110 transition-all shadow-lg shrink-0">
              <Play className="h-6 w-6 fill-white ml-1" />
            </div>
          </div>
        </div>

        {/* ================== SECURITY TIPS BLOCK ================== */}
        <div className="border-t border-gray-100 py-10 mb-6 text-left">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" /> Professional CCTV Placement & Security Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50/70 border border-gray-100 p-5 rounded-2xl shadow-sm text-xs sm:text-sm space-y-1">
              <strong className="block font-bold text-slate-900">1. Mounting Height Choice</strong>
              <p className="text-slate-600 leading-relaxed">Mount cameras at 8-10 feet off the ground. This prevents intruder tampering while retaining facial capture angles.</p>
            </div>
            <div className="bg-gray-50/70 border border-gray-100 p-5 rounded-2xl shadow-sm text-xs sm:text-sm space-y-1">
              <strong className="block font-bold text-slate-900">2. Backlight Consideration</strong>
              <p className="text-slate-600 leading-relaxed">Avoid pointing lenses directly into direct sun rays. Use cameras with Wide Dynamic Range (WDR) to balance high glare spots.</p>
            </div>
            <div className="bg-gray-50/70 border border-gray-100 p-5 rounded-2xl shadow-sm text-xs sm:text-sm space-y-1">
              <strong className="block font-bold text-slate-900">3. Secure Your Router</strong>
              <p className="text-slate-650 leading-relaxed">Always update NVR firmware passwords from factory defaults. Isolate cameras on a dedicated IP subnet for privacy protection.</p>
            </div>
          </div>
        </div>

        {/* ================== RELATED & SIMILAR PRODUCTS ================== */}
        <div className="border-t border-gray-100 pt-10 text-left">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Similar Products You May Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockProductsList.filter(p => p.id !== product.id).map(similar => (
              <Link 
                key={similar.id} 
                to={`/products/${similar.id}`}
                className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-blue-400 transition-all group"
              >
                <div>
                  <div className="relative h-40 bg-gray-50/50 rounded-xl flex items-center justify-center p-3 mb-4 overflow-hidden">
                    <img src={similar.image} alt={similar.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9px] font-black tracking-wider text-blue-600 block mb-1">{similar.brand}</span>
                  <h4 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-2">{similar.name}</h4>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center gap-0.5 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded">
                      <span>{similar.rating}</span>
                      <Star className="h-2 w-2 fill-white text-white" />
                    </div>
                    <span className="text-[10px] text-gray-400">({similar.reviewsCount})</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pt-1.5 border-t border-gray-50 mt-1">
                  <span className="text-sm font-extrabold text-slate-900">₹{similar.price.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-gray-400 line-through">₹{similar.originalPrice.toLocaleString("en-IN")}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
