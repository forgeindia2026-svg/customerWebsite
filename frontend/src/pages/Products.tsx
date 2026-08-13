import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Heart,
  Star,
  ShieldCheck,
  Check,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Truck,
  RotateCcw,
  Headphones,
  Lock,
  Award,
  CheckSquare,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Category Tree structure as per reference design
const categoryTree = [
  {
    id: "cctv",
    name: "CCTV Cameras",
    count: 128,
    subcategories: [
      { id: "ip", name: "IP Cameras", count: 128 },
      { id: "wifi", name: "WiFi Cameras", count: 64 },
      { id: "ptz", name: "PTZ Cameras", count: 32 },
      { id: "dome", name: "Dome Cameras", count: 16 },
      { id: "bullet", name: "Bullet Cameras", count: 16 },
    ],
  },
  { id: "dvr", name: "DVR", count: 42 },
  { id: "nvr", name: "NVR", count: 35 },
  { id: "accessories", name: "Accessories", count: 89 },
  { id: "harddisk", name: "Hard Disk", count: 24 },
  { id: "vdp", name: "Video Door Phone", count: 18 },
  { id: "alarm", name: "Alarm Systems", count: 31 },
  { id: "networking", name: "Networking", count: 52 },
  { id: "kit", name: "Installation Kit", count: 15 },
  { id: "ssd", name: "SSD", count: 0 },
  { id: "pendrive", name: "Pendrive", count: 0 },
  { id: "hdmi", name: "HDMI Cables", count: 0 },
];

const brandsList = [
  { id: "hikvision", name: "Hikvision", count: 85 },
  { id: "dahua", name: "Dahua", count: 68 },
  { id: "cpplus", name: "CP Plus", count: 45 },
  { id: "unv", name: "UNV", count: 28 },
  { id: "ezviz", name: "Ezviz", count: 18 },
  { id: "tplink", name: "TP-Link", count: 14 },
  { id: "imou", name: "Imou", count: 12 },
];

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
  resolution: string;
  specs: string[];
}

const mockProducts: Product[] = [
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
    specs: ["4MP Real-Time", "IK10 Vandal-Proof", "PoE Easy Installation"],
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
    resolution: "1080p (2MP)",
    specs: ["15x Optical Zoom", "360° Endless Pan", "100m IR Distance"],
  },
  {
    id: 5,
    brand: "EZVIZ",
    name: "Ezviz Outdoor WiFi Bullet Camera",
    category: "cctv",
    subCategory: "wifi",
    price: 3299,
    originalPrice: 3999,
    discountBadge: "-18%",
    rating: 4.5,
    reviewsCount: 48,
    inStock: true,
    stockCount: 34,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p (2MP)",
    specs: ["Active Defense Light/Siren", "Two-Way Talk", "MicroSD up to 256GB"],
  },
  {
    id: 6,
    brand: "TP-LINK",
    name: "TP-Link Tapo C310 Outdoor WiFi Camera",
    category: "cctv",
    subCategory: "wifi",
    price: 2699,
    originalPrice: 3199,
    isNew: true,
    rating: 4.6,
    reviewsCount: 36,
    inStock: true,
    stockCount: 50,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    resolution: "3MP Ultra HD",
    specs: ["3MP Resolution", "Sound and Light Alarm", "Works with Alexa"],
  },
  {
    id: 7,
    brand: "UNV",
    name: "UNV 4MP IP Dome Camera",
    category: "cctv",
    subCategory: "dome",
    price: 4299,
    originalPrice: 5499,
    discountBadge: "-22%",
    rating: 4.7,
    reviewsCount: 29,
    inStock: true,
    stockCount: 19,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
    resolution: "4MP (2K)",
    specs: ["Ultra 265 Compression", "Smart IR 30m", "IP67 Weatherproof"],
  },
  {
    id: 8,
    brand: "IMOU",
    name: "Imou 2MP WiFi Bullet Camera",
    category: "cctv",
    subCategory: "wifi",
    price: 2399,
    originalPrice: 2999,
    isNew: true,
    rating: 4.5,
    reviewsCount: 21,
    inStock: true,
    stockCount: 25,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p (2MP)",
    specs: ["Human Detection", "Built-in Wi-Fi Hotspot", "IP67 Weatherproof"],
  },
  {
    id: 9,
    brand: "DAHUA",
    name: "Dahua 2MP PTZ Speed Dome",
    category: "cctv",
    subCategory: "ptz",
    price: 6299,
    originalPrice: 7499,
    discountBadge: "-16%",
    rating: 4.8,
    reviewsCount: 18,
    inStock: true,
    stockCount: 15,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p (2MP)",
    specs: ["25x Optical Zoom", "Starlight Technology", "Auto Tracking"],
  },
  {
    id: 10,
    brand: "EZVIZ",
    name: "Ezviz C6N 2MP WiFi Smart Camera",
    category: "cctv",
    subCategory: "wifi",
    price: 2099,
    originalPrice: 2599,
    isNew: true,
    rating: 4.6,
    reviewsCount: 15,
    inStock: true,
    stockCount: 40,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p (2MP)",
    specs: ["Smart Tracking", "Motorized 360° Pan & Tilt", "Sleep Mode for Privacy"],
  },
  // DVR Products
  {
    id: 11,
    brand: "CP PLUS",
    name: "CP Plus 8 Channel 1080p HD DVR",
    category: "dvr",
    price: 3499,
    originalPrice: 4299,
    discountBadge: "-18%",
    rating: 4.7,
    reviewsCount: 42,
    inStock: true,
    stockCount: 30,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p H.265+",
    specs: ["8 Channel Recording", "H.265+ Compression", "HDMI/VGA Output"],
  },
  {
    id: 12,
    brand: "HIKVISION",
    name: "Hikvision 16 Channel Turbo HD DVR",
    category: "dvr",
    price: 6499,
    originalPrice: 7999,
    rating: 4.8,
    reviewsCount: 58,
    inStock: true,
    stockCount: 20,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "4K Turbo HD",
    specs: ["16 Channel Input", "Motion Detection 2.0", "Remote Playback"],
  },
  // NVR Products
  {
    id: 13,
    brand: "HIKVISION",
    name: "Hikvision 8 Channel 4K PoE NVR",
    category: "nvr",
    price: 7999,
    originalPrice: 9999,
    discountBadge: "-20%",
    rating: 4.9,
    reviewsCount: 35,
    inStock: true,
    stockCount: 15,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "8MP 4K",
    specs: ["8 PoE Interfaces", "4K Ultra HD Decoding", "Dual OS Design"],
  },
  {
    id: 14,
    brand: "DAHUA",
    name: "Dahua 16 Channel 4K NVR",
    category: "nvr",
    price: 9499,
    originalPrice: 11999,
    rating: 4.8,
    reviewsCount: 22,
    inStock: true,
    stockCount: 18,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "4K AI NVR",
    specs: ["16 IP Channels", "Smart Motion Detection+", "Perimeter Protection"],
  },
  // Hard Disk
  {
    id: 15,
    brand: "SEAGATE",
    name: "Seagate SkyHawk 2TB Surveillance Hard Disk",
    category: "harddisk",
    price: 4899,
    originalPrice: 5999,
    discountBadge: "-18%",
    rating: 4.8,
    reviewsCount: 110,
    inStock: true,
    stockCount: 50,
    warranty: "3 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    resolution: "2TB SATA 6Gb/s",
    specs: ["24x7 Continuous Recording", "64MB Cache", "SkyHawk Health Management"],
  },
  {
    id: 16,
    brand: "SEAGATE",
    name: "Seagate SkyHawk 4TB Surveillance Hard Disk",
    category: "harddisk",
    price: 7999,
    originalPrice: 9499,
    rating: 4.9,
    reviewsCount: 88,
    inStock: true,
    stockCount: 40,
    warranty: "3 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
    resolution: "4TB SATA 6Gb/s",
    specs: ["ImagePerfect Firmware", "RV Sensors", "1M Hours MTBF"],
  },
  // Video Door Phone
  {
    id: 17,
    brand: "HIKVISION",
    name: "Hikvision IP Video Door Phone Kit",
    category: "vdp",
    price: 8499,
    originalPrice: 10499,
    isNew: true,
    rating: 4.7,
    reviewsCount: 18,
    inStock: true,
    stockCount: 14,
    warranty: "2 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
    resolution: "1080p HD VDP",
    specs: ["7-inch Touch Screen", "Mobile App Unlock", "Noise Suppression"],
  },
  // Accessories & Networking
  {
    id: 18,
    brand: "TP-LINK",
    name: "TP-Link 8-Port Gigabit Desktop PoE Switch",
    category: "networking",
    price: 3699,
    originalPrice: 4499,
    rating: 4.7,
    reviewsCount: 34,
    inStock: true,
    stockCount: 65,
    warranty: "3 Years Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "Gigabit PoE+",
    specs: ["64W Total PoE Budget", "Plug and Play", "Priority Mode for Ports"],
  },
  {
    id: 19,
    brand: "CP PLUS",
    name: "CP Plus 12V 10A 8 Channel Power Supply",
    category: "accessories",
    price: 1299,
    originalPrice: 1699,
    rating: 4.6,
    reviewsCount: 52,
    inStock: true,
    stockCount: 80,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "12V 10A SMPS",
    specs: ["Over-voltage protection", "Individual Fuse Control", "LED Indicator"],
  },
  {
    id: 20,
    brand: "CP PLUS",
    name: "SK Tech Complete 4 Camera Installation Kit",
    category: "kit",
    price: 1999,
    originalPrice: 2499,
    discountBadge: "-20%",
    rating: 4.8,
    reviewsCount: 45,
    inStock: true,
    stockCount: 100,
    warranty: "1 Year Warranty",
    freeDelivery: true,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    resolution: "Complete Kit",
    specs: ["90m 3+1 CCTV Cable", "4 BNC & DC Connectors", "Power Supply Unit"],
  },
];

export default function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Fetch live products from backend API
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const formatted: Product[] = data.data.map((item: any, idx: number) => {
            let mainCat = 'cctv';
            let subCat: string | undefined = undefined;

            const lowerCat = (item.category || '').toLowerCase().trim();
            if (lowerCat.includes('ip') || lowerCat.includes('wifi') || lowerCat.includes('ptz') || lowerCat.includes('dome') || lowerCat.includes('bullet') || lowerCat.includes('camera') || lowerCat.includes('cctv')) {
              mainCat = 'cctv';
              if (lowerCat.includes('ip')) subCat = 'ip';
              else if (lowerCat.includes('wifi')) subCat = 'wifi';
              else if (lowerCat.includes('ptz')) subCat = 'ptz';
              else if (lowerCat.includes('dome')) subCat = 'dome';
              else if (lowerCat.includes('bullet') || lowerCat.includes('analog')) subCat = 'bullet';
            } else if (lowerCat.includes('dvr')) {
              mainCat = 'dvr';
            } else if (lowerCat.includes('nvr')) {
              mainCat = 'nvr';
            } else if (lowerCat.includes('hard') || lowerCat.includes('hdd') || lowerCat.includes('disk') || lowerCat.includes('storage')) {
              mainCat = 'harddisk';
            } else if (lowerCat.includes('cable') || lowerCat.includes('power') || lowerCat.includes('accessory') || lowerCat.includes('tool')) {
              mainCat = 'accessories';
            } else if (lowerCat.includes('vdp') || lowerCat.includes('door')) {
              mainCat = 'vdp';
            } else if (lowerCat.includes('alarm')) {
              mainCat = 'alarm';
            } else if (lowerCat.includes('network')) {
              mainCat = 'networking';
            }

            const titleStr = item.name || item.title || 'CCTV Security Product';
            const imgStr = item.imageUrl || item.image || (Array.isArray(item.photoUrls) ? item.photoUrls[0] : '') || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9';

            return {
              id: item._id || item.id || idx + 100,
              brand: (item.brand || 'SK-VISION').toUpperCase(),
              name: titleStr,
              category: mainCat,
              subCategory: subCat,
              price: item.price || item.offerPrice || 0,
              originalPrice: item.originalPrice || Math.round((item.price || 1000) * 1.25),
              discountBadge: item.badge || (item.originalPrice ? `-${Math.round((item.originalPrice - item.price) / item.originalPrice * 100)}%` : undefined),
              rating: item.rating || 4.5,
              reviewsCount: item.reviewsCount || 10,
              inStock: (item.stock ?? 1) > 0,
              stockCount: item.stock ?? 10,
              warranty: item.warranty || '2 Years Warranty',
              freeDelivery: true,
              image: imgStr,
              resolution: item.specs?.[0] || 'HD Resolution',
              specs: item.specs || [],
            };
          });
          setProductsList(formatted);
        }
      })
      .catch((err) => {
        console.log('Backend API note: using initial catalog list', err);
      });
  }, []);

  // Dynamic category tree with updated counts based on productsList
  const dynamicCategoryTree = useMemo(() => {
    const tree = [
      {
        id: "cctv",
        name: "CCTV Cameras",
        count: 0,
        subcategories: [
          { id: "ip", name: "IP Cameras", count: 0 },
          { id: "wifi", name: "WiFi Cameras", count: 0 },
          { id: "ptz", name: "PTZ Cameras", count: 0 },
          { id: "dome", name: "Dome Cameras", count: 0 },
          { id: "bullet", name: "Bullet Cameras", count: 0 },
        ],
      },
      { id: "dvr", name: "DVR", count: 0 },
      { id: "nvr", name: "NVR", count: 0 },
      { id: "accessories", name: "Accessories", count: 0 },
      { id: "harddisk", name: "Hard Disk", count: 0 },
      { id: "vdp", name: "Video Door Phone", count: 0 },
      { id: "alarm", name: "Alarm Systems", count: 0 },
      { id: "networking", name: "Networking", count: 0 },
      { id: "kit", name: "Installation Kit", count: 0 },
      { id: "ssd", name: "SSD", count: 0 },
      { id: "pendrive", name: "Pendrive", count: 0 },
      { id: "hdmi", name: "HDMI Cables", count: 0 },
    ];

    productsList.forEach(prod => {
      const cat = (prod.category || '').toLowerCase().trim();
      const sub = (prod.subCategory || '').toLowerCase().trim();

      const matchedCat = tree.find(c => c.id === cat);
      if (matchedCat) {
        matchedCat.count += 1;
        if (matchedCat.subcategories && sub) {
          const matchedSub = matchedCat.subcategories.find(s => s.id === sub);
          if (matchedSub) {
            matchedSub.count += 1;
          }
        }
      }
    });

    return tree;
  }, [productsList]);

  // Dynamic brands list with updated counts based on productsList
  const dynamicBrandsList = useMemo(() => {
    const defaultBrands = [
      { id: "hikvision", name: "Hikvision", count: 0 },
      { id: "dahua", name: "Dahua", count: 0 },
      { id: "cpplus", name: "CP Plus", count: 0 },
      { id: "unv", name: "UNV", count: 0 },
      { id: "ezviz", name: "Ezviz", count: 0 },
      { id: "tplink", name: "TP-Link", count: 0 },
      { id: "imou", name: "Imou", count: 0 },
    ];

    const brandMap = new Map();
    defaultBrands.forEach(b => {
      brandMap.set(b.id, { ...b });
    });

    productsList.forEach(prod => {
      if (!prod.brand) return;
      const cleanBrandName = prod.brand.trim();
      const brandId = cleanBrandName.toLowerCase().replace(/[\s-]+/g, '');

      let existing = brandMap.get(brandId);
      if (!existing) {
        for (const [key, val] of brandMap.entries()) {
          if (val.name.toLowerCase() === cleanBrandName.toLowerCase()) {
            existing = val;
            break;
          }
        }
      }

      if (existing) {
        existing.count += 1;
      } else {
        brandMap.set(brandId, {
          id: brandId,
          name: cleanBrandName,
          count: 1
        });
      }
    });

    const list = Array.from(brandMap.values());
    if (productsList.length > 0) {
      return list.filter(b => b.count > 0);
    }
    return defaultBrands;
  }, [productsList]);

  // Dynamic rating counts based on productsList
  const dynamicRatingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0 };
    productsList.forEach(prod => {
      const r = Math.floor(prod.rating || 0);
      if (r >= 5) counts[5] += 1;
      if (r >= 4) counts[4] += 1;
      if (r >= 3) counts[3] += 1;
      if (r >= 2) counts[2] += 1;
    });
    return counts;
  }, [productsList]);

  // Dynamic in stock counts based on productsList
  const inStockCount = useMemo(() => {
    return productsList.filter(p => p.inStock).length;
  }, [productsList]);

  // State variables for category and subcategory filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["cctv"]);

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  
  // Controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Quick View Modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState<number>(1);
  const [addedToCartToast, setAddedToCartToast] = useState<string | null>(null);

  // Initialize filters from URL parameters if available
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const lower = categoryParam.toLowerCase();
      // Check if it matches a main category
      const matchedMain = categoryTree.find((c) => c.id === lower);
      if (matchedMain) {
        setSelectedCategory(matchedMain.id);
        setSelectedSubCategory("all");
        if (!expandedCategories.includes(matchedMain.id)) {
          setExpandedCategories((prev) => [...prev, matchedMain.id]);
        }
        return;
      }
      // Check if it matches a subcategory
      const cctvSub = categoryTree[0].subcategories?.find((s) => s.id === lower);
      if (cctvSub) {
        setSelectedCategory("cctv");
        setSelectedSubCategory(cctvSub.id);
        if (!expandedCategories.includes("cctv")) {
          setExpandedCategories((prev) => [...prev, "cctv"]);
        }
      }
    }
  }, [searchParams]);

  // Toggle brand selection
  const handleBrandChange = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((b) => b !== brandId) : [...prev, brandId]
    );
  };

  // Clear all active filters
  const handleClearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(100000);
    setAppliedPriceRange([0, 100000]);
    setMinRating(0);
    setInStockOnly(false);
    setSearchQuery("");
  };

  // Toggle Wishlist
  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toast feedback
  const handleAddToCart = (product: Product) => {
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
        category: product.category,
        subCategory: product.subCategory,
        quantity: 1
      });
    }
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));

    setAddedToCartToast(product.name);
    setTimeout(() => {
      setAddedToCartToast(null);
    }, 3000);
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    navigate("/cart");
  };

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // Main Category Filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }
      // Subcategory Filter
      if (selectedSubCategory !== "all" && product.subCategory !== selectedSubCategory) {
        return false;
      }
      // Brand Filter
      if (selectedBrands.length > 0) {
        const brandMatch = selectedBrands.some(
          (b) => b.toUpperCase() === product.brand.replace(/[\s-]+/g, "").toUpperCase()
        );
        if (!brandMatch) return false;
      }
      // Price Filter
      if (product.price < appliedPriceRange[0] || product.price > appliedPriceRange[1]) {
        return false;
      }
      // Rating Filter
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }
      // In Stock Filter
      if (inStockOnly && !product.inStock) {
        return false;
      }
      // Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesCategory) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return b.reviewsCount - a.reviewsCount; // Popularity default
    });
  }, [
    selectedCategory,
    selectedSubCategory,
    selectedBrands,
    appliedPriceRange,
    minRating,
    inStockOnly,
    searchQuery,
    sortBy,
    productsList,
  ]);

  // Compute Active Filter Count
  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedSubCategory !== "all" ? 1 : 0) +
    selectedBrands.length +
    (appliedPriceRange[0] > 500 || appliedPriceRange[1] < 50000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery !== "" ? 1 : 0);

  // Dynamic Heading Title
  const pageTitle = useMemo(() => {
    if (selectedSubCategory !== "all") {
      const sub = categoryTree[0].subcategories?.find((s) => s.id === selectedSubCategory);
      if (sub) return `CCTV Cameras - ${sub.name}`;
    }
    if (selectedCategory !== "all") {
      const cat = categoryTree.find((c) => c.id === selectedCategory);
      if (cat) return cat.name;
    }
    return "All Security Products";
  }, [selectedCategory, selectedSubCategory]);

  // Render filters JSX for reusability on desktop and mobile drawer
  const renderFiltersContent = () => (
    <div className="space-y-6 text-left">
      {/* Categories Accordion */}
      <div>
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">
          Categories
        </h4>
        <div className="space-y-1">
          {dynamicCategoryTree.map((cat) => {
            const isExpanded = expandedCategories.includes(cat.id);
            const isCategorySelected = selectedCategory === cat.id;

            return (
              <div key={cat.id} className="space-y-1">
                <div
                  onClick={() => {
                    if (cat.subcategories) {
                      setExpandedCategories((prev) =>
                        prev.includes(cat.id)
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id]
                      );
                    }
                    if (selectedCategory === cat.id && selectedSubCategory === "all") {
                      setSelectedCategory("all");
                    } else {
                      setSelectedCategory(cat.id);
                      setSelectedSubCategory("all");
                    }
                  }}
                  className={`flex items-center justify-between font-bold text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isCategorySelected
                      ? "bg-red-50 text-[#ff3b30] border border-red-200/80"
                      : "text-gray-900 hover:bg-gray-100/80 hover:text-black"
                  }`}
                >
                  <span>{cat.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400 font-normal">
                      ({cat.count})
                    </span>
                    {cat.subcategories && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-black" : ""
                        }`}
                      />
                    )}
                  </div>
                </div>

                {cat.subcategories && isExpanded && (
                  <div className="pl-3.5 space-y-1 border-l-2 border-red-200/80 ml-2 py-1">
                    {cat.subcategories.map((sub) => {
                      const isSubSelected =
                        selectedCategory === cat.id && selectedSubCategory === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedSubCategory(
                              isSubSelected ? "all" : sub.id
                            );
                          }}
                          className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-xs text-left transition-all ${
                            isSubSelected
                              ? "text-[#ff3b30] font-extrabold bg-red-50/80"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          <span>{sub.name}</span>
                          <span className="text-[11px] text-gray-400 font-normal">
                            ({sub.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">
            Brands
          </h4>
          {selectedBrands.length > 0 && (
            <button
              onClick={() => setSelectedBrands([])}
              className="text-[10px] text-red-600 font-bold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="space-y-2 text-xs">
          {dynamicBrandsList.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center justify-between cursor-pointer group text-gray-700 hover:text-black"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => handleBrandChange(brand.id)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#ff3b30] focus:ring-[#ff3b30] accent-[#ff3b30] cursor-pointer"
                />
                <span className={selectedBrands.includes(brand.id) ? "font-bold text-[#ff3b30]" : ""}>
                  {brand.name}
                </span>
              </div>
              <span className="text-gray-400 text-[11px]">({brand.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="border-t border-gray-100 pt-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
          Price Range
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>
          <Button
            onClick={() => setAppliedPriceRange([priceMin, priceMax])}
            className="w-full h-8 bg-[#ff3b30] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Apply Price Filter
          </Button>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="border-t border-gray-100 pt-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
          Rating
        </h4>
        <div className="space-y-2 text-xs">
          {[
            { stars: 5, count: dynamicRatingCounts[5] },
            { stars: 4, count: dynamicRatingCounts[4] },
            { stars: 3, count: dynamicRatingCounts[3] },
            { stars: 2, count: dynamicRatingCounts[2] },
          ].map((r) => (
            <label
              key={r.stars}
              className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-black"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={minRating === r.stars}
                  onChange={() => setMinRating(minRating === r.stars ? 0 : r.stars)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#ff3b30] focus:ring-[#ff3b30] accent-[#ff3b30] cursor-pointer"
                />
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < r.stars
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-medium text-gray-600 ml-1">
                  & above
                </span>
              </div>
              <span className="text-gray-450 text-[11px]">({r.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="border-t border-gray-100 pt-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
          Availability
        </h4>
        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-black">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={() => setInStockOnly(!inStockOnly)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#ff3b30] focus:ring-[#ff3b30] accent-[#ff3b30] cursor-pointer"
              />
              <span>In Stock Only</span>
            </div>
            <span className="text-gray-450 text-[11px]">({inStockCount})</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-20 font-sans">
      {/* Toast Notification */}
      {addedToCartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium">Added "{addedToCartToast}" to cart!</span>
        </div>
      )}

      {/* Main Container */}
      <div className="container max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb Bar */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <Link to="/products" className="hover:text-black transition-colors">Products</Link>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="text-gray-900 font-medium">{pageTitle}</span>
        </nav>

        {/* Layout Grid: Sidebar + Product Content */}
        <div className="flex flex-col lg:flex-row gap-7">
          {/* Left Sidebar Filter (Hidden on Mobile) */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-sm space-y-6">
              
              {/* Header with Clear All Button */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#ff3b30]" />
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-tight">
                    Filters
                  </h3>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-[11px] font-extrabold text-[#ff3b30] hover:text-red-700 flex items-center gap-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {renderFiltersContent()}

            </div>
          </aside>

          {/* Main Product Grid Area */}
          <main className="flex-1 space-y-5">
            {/* Header Control Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200/90 rounded-xl p-4 shadow-sm">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {pageTitle}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> products
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-sm"
                >
                  <Filter className="h-3.5 w-3.5 text-[#ff3b30]" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ff3b30] text-[9px] font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {/* Search in products */}
                <div className="relative w-44 sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#ff3b30]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 font-medium whitespace-nowrap">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort products by"
                    className="h-8 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#ff3b30] cursor-pointer"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Grid / List View Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid" ? "bg-red-50 text-[#ff3b30]" : "bg-white text-gray-400 hover:text-gray-700"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list" ? "bg-red-50 text-[#ff3b30]" : "bg-white text-gray-400 hover:text-gray-700"
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs">
                <span className="text-slate-500 font-medium">Active Filters:</span>
                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#ff3b30] rounded-full font-bold border border-red-100">
                    Category: {categoryTree.find((c) => c.id === selectedCategory)?.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-800"
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedSubCategory("all");
                      }}
                    />
                  </span>
                )}
                {selectedSubCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#ff3b30] rounded-full font-bold border border-red-100">
                    Subcategory: {categoryTree[0].subcategories?.find((s) => s.id === selectedSubCategory)?.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-800"
                      onClick={() => setSelectedSubCategory("all")}
                    />
                  </span>
                )}
                {selectedBrands.map((bId) => {
                  const bName = brandsList.find((b) => b.id === bId)?.name;
                  return (
                    <span
                      key={bId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-slate-800 rounded-full font-semibold border border-gray-200"
                    >
                      Brand: {bName}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-black"
                        onClick={() => handleBrandChange(bId)}
                      />
                    </span>
                  );
                })}
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-[#ff3b30] hover:underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Listing */}
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                    : "space-y-4"
                }
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex ${
                      viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row items-center p-4 gap-6"
                    } group relative`}
                  >
                    {/* Image Area */}
                    <div
                      className={`relative bg-gray-50/80 overflow-hidden flex items-center justify-center p-2 sm:p-4 ${
                        viewMode === "grid" ? "h-36 sm:h-48 w-full" : "h-40 w-full sm:w-48 shrink-0 rounded-xl"
                      }`}
                    >
                      {/* Badge Top Left */}
                      {product.discountBadge && (
                        <span className="absolute top-2.5 left-2.5 bg-[#ff3b30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm z-10">
                          {product.discountBadge}
                        </span>
                      )}
                      {product.isNew && !product.discountBadge && (
                        <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm z-10">
                          NEW
                        </span>
                      )}

                      {/* Wishlist Heart Top Right */}
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

                      {/* Product Photo */}
                      <Link to={`/products/${product.id}`} className="flex items-center justify-center h-full w-full">
                        <img
                          src={product.image && !product.image.startsWith('blob:') ? product.image : 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80'}
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80';
                          }}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>

                    {/* Product Content Details */}
                    <div
                      className={`p-4 flex-1 flex flex-col justify-between ${
                        viewMode === "grid" ? "space-y-3" : "w-full"
                      }`}
                    >
                      <div>
                        {/* Brand Name */}
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase block mb-1">
                          {product.brand}
                        </span>

                        {/* Title */}
                        <Link to={`/products/${product.id}`} className="block">
                          <h3 className="font-bold text-xs text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-tight transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Rating & Assured Badge */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <div className="flex items-center gap-0.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            <span>{product.rating}</span>
                            <Star className="h-2.5 w-2.5 fill-white text-white" />
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">
                            ({product.reviewsCount})
                          </span>
                          
                          {/* Premium "SK Assured" Trust Badge */}
                          <div className="flex items-center gap-0.5 bg-blue-50 border border-blue-100 rounded-md px-1 py-0.5 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider">SK Assured</span>
                          </div>
                        </div>

                        {/* Price & Discount */}
                        <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                          <span className="text-base font-black text-gray-900">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </span>
                          {product.discountBadge && (
                            <span className="text-[11px] font-bold text-emerald-600">
                              {product.discountBadge.replace('-', '')} off
                            </span>
                          )}
                        </div>

                        {/* Delivery Status & Urgency */}
                        <div className="mt-2 text-xs space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-655">
                            <span className="font-bold text-emerald-600">Free Delivery</span>
                          </div>
                        </div>

                        {/* Stock & Warranty Badges */}
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-2.5 pt-2 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span className="font-bold text-emerald-600">In Stock</span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-slate-400" /> {product.warranty.toLowerCase().includes('warranty') ? product.warranty : `${product.warranty} Warranty`}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Action: Side-by-Side Cart & Buy Now */}
                      <div className="pt-2 flex flex-row items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="h-8 w-8 sm:flex-1 sm:h-9 rounded-lg sm:rounded-xl bg-red-50 sm:bg-white border-0 sm:border border-slate-200 hover:bg-red-100 sm:hover:bg-slate-50 text-[#ff3b30] sm:text-slate-700 text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-all shrink-0"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">Cart</span>
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="flex-1 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-[#ff3b30] hover:bg-red-600 text-white text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-all shadow-sm sm:hover:scale-[1.02] duration-200"
                        >
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State when no products match filters */
              <div className="bg-white border border-gray-200/90 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 bg-red-50 text-[#ff3b30] rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    No Products Found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn't find any products matching your current category or brand filters.
                  </p>
                </div>
                <Button
                  onClick={handleClearAllFilters}
                  className="bg-[#ff3b30] hover:bg-red-700 text-white text-xs font-bold px-6 py-2 rounded-xl"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative ml-0 mr-auto flex h-full w-full max-w-xs flex-col bg-white py-4 shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-4 border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4.5 w-4.5 text-[#ff3b30]" />
                <h3 className="font-extrabold text-sm text-gray-900 uppercase">Filters</h3>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {renderFiltersContent()}
            </div>

            {/* Footer Action buttons */}
            <div className="border-t border-gray-150 px-4 pt-3 flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    handleClearAllFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 h-9 rounded-xl bg-[#ff3b30] hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
