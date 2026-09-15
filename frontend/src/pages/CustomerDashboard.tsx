import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  ShoppingBag, 
  Wrench, 
  CreditCard, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ArrowRight,
  ShieldCheck,
  Package,
  Home as HomeIcon,
  HelpCircle,
  Truck,
  Download,
  Gift,
  RefreshCw,
  LogOut,
  ChevronRight,
  Star,
  Settings,
  Lock,
  Heart,
  Briefcase,
  Menu,
  X,
  Building,
  Navigation,
  Map,
  Trash2,
  Edit2,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



// Inline SVGs for Product Thumbnails matching the layout mockup
function BulletCameraThumb() {
  return (
    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200/50 shrink-0">
      <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="12" height="8" rx="2" fill="currentColor" fillOpacity="0.1" />
        <path d="M14 9l6-3v12l-6-3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="11" r="2" fill="currentColor" />
        <line x1="4" y1="15" x2="8" y2="15" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DomeCameraThumb() {
  return (
    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200/50 shrink-0">
      <svg className="w-8 h-8 text-slate-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a10 10 0 0 0-10 10h20a10 10 0 0 0-10-10z" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 12a4 4 0 0 1-4 4h8a4 4 0 0 1-4-4z" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}

// Custom NVR graphic SVG
function NvrThumb() {
  return (
    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200/50 shrink-0">
      <svg className="w-8 h-8 text-slate-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="8" rx="2" fill="currentColor" fillOpacity="0.1" />
        <circle cx="6" cy="10" r="1" fill="currentColor" />
        <circle cx="10" cy="10" r="1" fill="currentColor" />
        <line x1="16" y1="10" x2="18" y2="10" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Custom hard drive HDD graphic SVG
function HddThumb() {
  return (
    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200/50 shrink-0">
      <svg className="w-8 h-8 text-slate-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
        <circle cx="12" cy="7" r="3" />
        <path d="M6 14h12M6 18h8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ProductThumb({ type }: { type: string }) {
  if (type === "bullet") return <BulletCameraThumb />;
  if (type === "dome") return <DomeCameraThumb />;
  if (type === "nvr") return <NvrThumb />;
  return <HddThumb />;
}

// Side-by-Side Images for Installations
function HouseThumb() {
  return (
    <div className="w-12 h-12 bg-red-50/70 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
      <HomeIcon className="w-6 h-6 text-red-500" />
    </div>
  );
}

function ShopThumb() {
  return (
    <div className="w-12 h-12 bg-red-50/70 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
      <Briefcase className="w-6 h-6 text-red-500" />
    </div>
  );
}

function getDisplayStatus(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "ASSIGNMENT_PENDING_ACCEPTANCE" || s === "WAITING_FOR_TECH") {
    return "Pending";
  }
  if (s === "IN_PROGRESS") {
    return "Assigned";
  }
  if (s === "WAITING_ADMIN_APPROVAL") {
    return "Pending Approval";
  }
  return status;
}

function getStatusBadgeClass(status: string) {
  const s = getDisplayStatus(status).toLowerCase();
  if (s === "delivered" || s === "completed" || s === "approved") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (s === "shipped" || s === "in transit" || s === "assigned") {
    return "bg-blue-50/80 text-blue-600 border-blue-100";
  }
  if (s === "processing" || s === "pending" || s === "in progress" || s === "pending approval") {
    return "bg-amber-55 text-amber-700 border-amber-100";
  }
  return "bg-red-50/70 text-red-500 border-red-100";
}

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  type: "HOME" | "WORK" | "OTHER";
  isPrimary?: boolean;
  flat: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  
  // Auth state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string>("No address saved yet.");

  // Tab State
  const [searchParams] = useSearchParams();
  const getTabFromParam = (param: string | null) => {
    const p = param?.toLowerCase();
    if (p === "orders" || p === "my-orders" || p === "order") return "My Orders";
    if (p === "profile" || p === "settings" || p === "profile-settings") return "Profile Settings";
    if (p === "installations" || p === "my-installations") return "My Installations";
    if (p === "requests" || p === "service-requests") return "Service Requests";
    if (p === "wishlist") return "Wishlist";
    if (p === "products" || p === "my-products") return "My Products";
    if (p === "addresses" || p === "address") return "Addresses";
    if (p === "payments" || p === "payment-methods") return "Payment Methods";
    if (p === "password" || p === "change-password") return "Change Password";
    return "Profile Settings";
  };

  const [activeTab, setActiveTab] = useState<string>(() => getTabFromParam(searchParams.get("tab")));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync tab from URL query parameter (e.g. /dashboard?tab=orders or /dashboard?tab=profile)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(getTabFromParam(tabParam));
    }
  }, [searchParams]);

  // Dynamic Dashboard Stats
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbRequests, setDbRequests] = useState<any[]>([]);
  const [dbInstallations, setDbInstallations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Settings form state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Detailed Installation & Delivery Address states
  const [addrDoorNo, setAddrDoorNo] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("Tamil Nadu");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Change Password form state
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpSaving, setCpSaving] = useState(false);
  const [cpMsg, setCpMsg] = useState("");
  const [cpError, setCpError] = useState("");

  // New Request Form
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    type: "Camera not working properly",
    description: "",
    priority: "Medium"
  });
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [serviceSuccessMsg, setServiceSuccessMsg] = useState("");

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Saved Addresses State & Modal
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrModalData, setAddrModalData] = useState<{
    name: string;
    phone: string;
    type: "HOME" | "WORK" | "OTHER";
    isPrimary: boolean;
    flat: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
  }>({
    name: "",
    phone: "",
    type: "HOME",
    isPrimary: false,
    flat: "",
    locality: "",
    city: "",
    state: "Tamil Nadu",
    pincode: ""
  });
  const [addrModalError, setAddrModalError] = useState("");
  const [addrSuccessMsg, setAddrSuccessMsg] = useState("");
  const [fetchingLocationModal, setFetchingLocationModal] = useState(false);

  const loadSavedAddresses = (fallbackAddress?: string, fallbackName?: string, fallbackPhone?: string) => {
    try {
      const raw = localStorage.getItem("user_saved_addresses");
      let list: SavedAddress[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.filter(a => a && a.id && (a.flat || a.locality || a.city));
        }
      }

      const activeAddr = fallbackAddress || localStorage.getItem("user_address") || "";
      const activeName = fallbackName || localStorage.getItem("user_name") || "Customer";
      const activePhone = fallbackPhone || localStorage.getItem("user_phone") || "";

      if (list.length === 0 && activeAddr && activeAddr !== "No address saved yet.") {
        const parts = activeAddr.split(',').map((s: string) => s.trim()).filter(Boolean);
        const pinMatch = activeAddr.match(/\b\d{6}\b/);
        const savedDoor = localStorage.getItem("user_door_no") || "";
        const savedStreet = localStorage.getItem("user_street") || "";
        const savedCity = localStorage.getItem("user_city") || "";
        const savedState = localStorage.getItem("user_state") || "Tamil Nadu";
        const savedPin = localStorage.getItem("user_pincode") || "";

        const primaryAddr: SavedAddress = {
          id: `addr-${Date.now()}`,
          name: activeName,
          phone: activePhone,
          type: "HOME",
          isPrimary: true,
          flat: savedDoor || parts[0] || activeAddr,
          locality: savedStreet || parts[1] || "",
          city: savedCity || parts[2] || "Chennai",
          state: savedState || "Tamil Nadu",
          pincode: savedPin || (pinMatch ? pinMatch[0] : "600001")
        };
        list = [primaryAddr];
        localStorage.setItem("user_saved_addresses", JSON.stringify(list));
      }

      setSavedAddresses(list);
    } catch (e) {
      console.error("Error loading saved addresses:", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    const role = localStorage.getItem("user_role");
    
    if (!token || role !== "CUSTOMER") {
      navigate("/login");
      return;
    }
    
    const email = localStorage.getItem("user_email") || "";
    const name = localStorage.getItem("user_name") || "";
    const phone = localStorage.getItem("user_phone") || "";
    const address = localStorage.getItem("user_address") || "";
    
    setUserEmail(email);
    setUserName(name);
    setUserPhone(phone);
    setUserAddress(address);
    setProfileName(name);
    setProfilePhone(phone);
    setProfileAddress(address);

    const savedDoor = localStorage.getItem("user_door_no") || "";
    const savedStreet = localStorage.getItem("user_street") || "";
    const savedCity = localStorage.getItem("user_city") || "";
    const savedState = localStorage.getItem("user_state") || "Tamil Nadu";
    const savedPin = localStorage.getItem("user_pincode") || "";
    const savedLandmark = localStorage.getItem("user_landmark") || "";

    if (savedDoor) setAddrDoorNo(savedDoor);
    if (savedStreet) setAddrStreet(savedStreet);
    if (savedCity) setAddrCity(savedCity);
    if (savedState) setAddrState(savedState);
    if (savedPin) setAddrPincode(savedPin);
    if (savedLandmark) setAddrLandmark(savedLandmark);

    if (!savedDoor && !savedStreet && address) {
      const parts = address.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 0) setAddrDoorNo(parts[0]);
      if (parts.length > 1) setAddrStreet(parts[1]);
      if (parts.length > 2) setAddrCity(parts[2]);
      const pinMatch = address.match(/\b\d{6}\b/);
      if (pinMatch) setAddrPincode(pinMatch[0]);
    }

    loadSavedAddresses(address, name, phone);

    const handleStorage = () => {
      loadSavedAddresses();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [navigate]);

  // Fetch fresh profile from DB when email is available
  useEffect(() => {
    if (!userEmail) return;
    const syncProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/profile?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (data.success && data.data) {
          const u = data.data;
          const freshName = u.name || userEmail.split("@")[0];
          const freshPhone = u.phone || "";
          const freshAddress = u.address || u.shippingAddress || "";
          setUserName(freshName);
          setUserPhone(freshPhone);
          setProfileName(freshName);
          setProfilePhone(freshPhone);
          setProfileAddress(freshAddress);
          if (freshAddress) {
            setUserAddress(freshAddress);
            localStorage.setItem("user_address", freshAddress);
            if (!localStorage.getItem("user_door_no") && !localStorage.getItem("user_street")) {
              const parts = freshAddress.split(',').map((s: string) => s.trim()).filter(Boolean);
              if (parts.length > 0) setAddrDoorNo(parts[0]);
              if (parts.length > 1) setAddrStreet(parts[1]);
              if (parts.length > 2) setAddrCity(parts[2]);
              const pinMatch = freshAddress.match(/\b\d{6}\b/);
              if (pinMatch) setAddrPincode(pinMatch[0]);
            }
          }
          // Keep localStorage in sync
          localStorage.setItem("user_name", freshName);
          localStorage.setItem("user_phone", freshPhone);
        }
      } catch (err) {
        console.warn("Could not sync profile from DB:", err);
      }
    };
    syncProfile();
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch orders filtered by this customer's email (server-side)
        const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/orders?email=${encodeURIComponent(userEmail)}`);
        const ordersData = await ordersRes.json();
        if (ordersData.success && Array.isArray(ordersData.data)) {
          setDbOrders(ordersData.data);
        }

        const dashRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/dashboard`);
        const dashData = await dashRes.json();
        if (dashData.success && dashData.data) {
          const allReqs = dashData.data.serviceRequests || [];
          const currentName = localStorage.getItem("user_name") || userEmail.split("@")[0];
          const filteredReqs = allReqs.filter(
            (r: any) => 
              r.customer?.toLowerCase().includes(currentName.toLowerCase()) ||
              r.contact === userPhone
          );
          setDbRequests(filteredReqs);

          const allProjs = dashData.data.projects || [];
          const filteredProjs = allProjs.filter(
            (p: any) => p.customer?.toLowerCase().includes(currentName.toLowerCase())
          );
          setDbInstallations(filteredProjs);
        }
      } catch (err) {
        console.error("Failed to load customer dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userEmail, userPhone]);

  // Submit service request via modal
  const handleCreateServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingService(true);
    setServiceSuccessMsg("");

    try {
      const dashRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/dashboard`);
      const dashData = await dashRes.json();
      
      if (dashData.success && dashData.data) {
        const dashboardState = dashData.data;
        const newRequest = {
          id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          customer: userName || "Ramesh",
          contact: userPhone || "+91 98765 43210",
          type: serviceForm.type,
          priority: serviceForm.priority,
          status: "Open",
          assignedTech: "Unassigned",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          description: serviceForm.description
        };

        const updatedRequests = [newRequest, ...(dashboardState.serviceRequests || [])];
        const updatedNotifications = [
          {
            id: `NTF-${Date.now()}`,
            title: `Service Request raised by Customer`,
            message: `${newRequest.type} raised by ${newRequest.customer}.`,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + ", Today",
            category: "Request",
            read: false
          },
          ...(dashboardState.notifications || [])
        ];

        const updateRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/dashboard`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...dashboardState,
            serviceRequests: updatedRequests,
            notifications: updatedNotifications
          })
        });

        const updateData = await updateRes.json();
        if (updateData.success) {
          setServiceSuccessMsg("Service Request registered successfully!");
          setDbRequests(prev => [newRequest, ...prev]);
          setServiceForm({ type: "Camera not working properly", description: "", priority: "Medium" });
          setTimeout(() => {
            setShowRequestModal(false);
            setServiceSuccessMsg("");
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Failed to submit service request:", err);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_phone");
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/";
  };

  // Fetch Geolocation automatically
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.address) {
              const addr = data.address;
              const road = addr.road || addr.suburb || addr.neighbourhood || "";
              const town = addr.city || addr.town || addr.village || addr.county || "";
              const st = addr.state || "Tamil Nadu";
              const postcode = addr.postcode || "";
              const houseNo = addr.house_number || "";

              if (houseNo) setAddrDoorNo(houseNo);
              if (road) setAddrStreet(road);
              if (town) setAddrCity(town);
              if (st) setAddrState(st);
              if (postcode) setAddrPincode(postcode);
            }
          })
          .catch((err) => {
            console.error("Geocoding failed:", err);
          })
          .finally(() => {
            setFetchingLocation(false);
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to fetch location. Please check browser permissions and try again.");
        setFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Save profile name + phone + address to MongoDB
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");

    const fullAddress = [
      addrDoorNo.trim(),
      addrStreet.trim(),
      addrCity.trim(),
      addrState.trim() ? `${addrState.trim()} - ${addrPincode.trim()}` : addrPincode.trim(),
      addrLandmark.trim() ? `(${addrLandmark.trim()})` : ""
    ].filter(Boolean).join(', ');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: profileName,
          phone: profilePhone,
          address: fullAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        const savedAddress = data.data?.address || fullAddress;
        setUserName(data.data.name);
        setUserPhone(data.data.phone || "");
        setUserAddress(savedAddress);
        setProfileAddress(savedAddress);
        localStorage.setItem("user_name", data.data.name);
        localStorage.setItem("user_phone", data.data.phone || "");
        localStorage.setItem("user_door_no", addrDoorNo.trim());
        localStorage.setItem("user_street", addrStreet.trim());
        localStorage.setItem("user_city", addrCity.trim());
        localStorage.setItem("user_state", addrState.trim());
        localStorage.setItem("user_pincode", addrPincode.trim());
        localStorage.setItem("user_landmark", addrLandmark.trim());
        localStorage.setItem("user_address", savedAddress);
        // Update user_saved_addresses primary entry
        try {
          const raw = localStorage.getItem("user_saved_addresses");
          let list: SavedAddress[] = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(list)) list = [];
          const primaryIdx = list.findIndex(a => a.isPrimary);
          const updatedPrimary: SavedAddress = {
            id: primaryIdx >= 0 ? list[primaryIdx].id : `addr-${Date.now()}`,
            name: profileName || data.data.name,
            phone: profilePhone || data.data.phone || "",
            type: primaryIdx >= 0 ? list[primaryIdx].type : "HOME",
            isPrimary: true,
            flat: addrDoorNo.trim(),
            locality: addrStreet.trim(),
            city: addrCity.trim(),
            state: addrState.trim() || "Tamil Nadu",
            pincode: addrPincode.trim()
          };
          if (primaryIdx >= 0) {
            list[primaryIdx] = updatedPrimary;
          } else {
            list = [updatedPrimary, ...list.map(a => ({ ...a, isPrimary: false }))];
          }
          localStorage.setItem("user_saved_addresses", JSON.stringify(list));
          setSavedAddresses(list);
        } catch (e) {}

        window.dispatchEvent(new Event("storage"));
        setProfileMsg("✓ Profile updated successfully!");
      } else {
        setProfileMsg(`Error: ${data.message}`);
      }
    } catch (err) {
      setProfileMsg("Error: Could not connect to server.");
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(""), 3000);
    }
  };

  // Change password via backend
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpMsg("");
    setCpError("");
    if (cpNew !== cpConfirm) {
      setCpError("New passwords do not match.");
      return;
    }
    if (cpNew.length < 6) {
      setCpError("New password must be at least 6 characters.");
      return;
    }
    setCpSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, currentPassword: cpCurrent, newPassword: cpNew })
      });
      const data = await res.json();
      if (data.success) {
        setCpMsg("✓ Password changed successfully!");
        setCpCurrent(""); setCpNew(""); setCpConfirm("");
      } else {
        setCpError(data.message || "Failed to change password.");
      }
    } catch (err) {
      setCpError("Error: Could not connect to server.");
    } finally {
      setCpSaving(false);
      setTimeout(() => { setCpMsg(""); setCpError(""); }, 4000);
    }
  };

  // Address Management Actions
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrModalData({
      name: userName || "",
      phone: userPhone || "",
      type: "HOME",
      isPrimary: savedAddresses.length === 0,
      flat: "",
      locality: "",
      city: addrCity || "",
      state: addrState || "Tamil Nadu",
      pincode: addrPincode || ""
    });
    setAddrModalError("");
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrModalData({
      name: addr.name || "",
      phone: addr.phone || "",
      type: addr.type || "HOME",
      isPrimary: !!addr.isPrimary,
      flat: addr.flat || "",
      locality: addr.locality || "",
      city: addr.city || "",
      state: addr.state || "Tamil Nadu",
      pincode: addr.pincode || ""
    });
    setAddrModalError("");
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (idToDelete: string) => {
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    const remaining = savedAddresses.filter(a => a.id !== idToDelete);
    if (remaining.length > 0 && !remaining.some(a => a.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    setSavedAddresses(remaining);
    localStorage.setItem("user_saved_addresses", JSON.stringify(remaining));
    setAddrSuccessMsg("Address removed successfully.");
    setTimeout(() => setAddrSuccessMsg(""), 3000);
  };

  const handleSetPrimary = async (id: string) => {
    const target = savedAddresses.find(a => a.id === id);
    if (!target) return;

    const updated = savedAddresses.map(a => ({
      ...a,
      isPrimary: a.id === id
    }));
    setSavedAddresses(updated);
    localStorage.setItem("user_saved_addresses", JSON.stringify(updated));

    const formatted = [
      target.flat,
      target.locality,
      target.city,
      target.state ? `${target.state} - ${target.pincode}` : target.pincode
    ].filter(Boolean).join(", ");

    setUserAddress(formatted);
    localStorage.setItem("user_address", formatted);
    if (target.flat) localStorage.setItem("user_door_no", target.flat);
    if (target.locality) localStorage.setItem("user_street", target.locality);
    if (target.city) localStorage.setItem("user_city", target.city);
    if (target.state) localStorage.setItem("user_state", target.state);
    if (target.pincode) localStorage.setItem("user_pincode", target.pincode);

    if (userEmail) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            name: profileName || userName,
            phone: profilePhone || userPhone,
            address: formatted
          })
        });
      } catch (err) {
        console.warn("Could not sync primary address to profile:", err);
      }
    }

    window.dispatchEvent(new Event("storage"));
    setAddrSuccessMsg("Primary address updated!");
    setTimeout(() => setAddrSuccessMsg(""), 3000);
  };

  const handleFetchLocationForModal = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingLocationModal(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.address) {
              const addr = data.address;
              const road = addr.road || addr.suburb || addr.neighbourhood || "";
              const town = addr.city || addr.town || addr.village || addr.county || "";
              const st = addr.state || "Tamil Nadu";
              const postcode = addr.postcode || "";
              const houseNo = addr.house_number || "";

              setAddrModalData(prev => ({
                ...prev,
                flat: houseNo ? `${houseNo}, ${road}`.trim() : (road || prev.flat),
                locality: addr.suburb || addr.neighbourhood || addr.city_district || prev.locality,
                city: town || prev.city,
                state: st || prev.state,
                pincode: postcode || prev.pincode
              }));
            }
          })
          .catch((err) => {
            console.error("Geocoding failed:", err);
          })
          .finally(() => {
            setFetchingLocationModal(false);
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to fetch location. Please allow location permissions.");
        setFetchingLocationModal(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSaveAddressModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrModalError("");

    if (!addrModalData.name.trim()) {
      setAddrModalError("Please enter receiver name.");
      return;
    }
    const cleanPhone = addrModalData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setAddrModalError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!addrModalData.flat.trim()) {
      setAddrModalError("Please enter Flat / Door No. / Street address.");
      return;
    }
    if (!addrModalData.city.trim()) {
      setAddrModalError("Please enter city.");
      return;
    }
    const cleanPin = addrModalData.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setAddrModalError("Please enter a valid 6-digit pincode.");
      return;
    }

    let updatedList: SavedAddress[] = [];
    const isPrimary = addrModalData.isPrimary || savedAddresses.length === 0;

    if (editingAddressId) {
      updatedList = savedAddresses.map(item => {
        if (item.id === editingAddressId) {
          return {
            ...item,
            name: addrModalData.name.trim(),
            phone: cleanPhone,
            type: addrModalData.type,
            flat: addrModalData.flat.trim(),
            locality: addrModalData.locality.trim(),
            city: addrModalData.city.trim(),
            state: addrModalData.state.trim() || "Tamil Nadu",
            pincode: cleanPin,
            isPrimary
          };
        }
        return isPrimary ? { ...item, isPrimary: false } : item;
      });
    } else {
      const newAddrItem: SavedAddress = {
        id: `addr-${Date.now()}`,
        name: addrModalData.name.trim(),
        phone: cleanPhone,
        type: addrModalData.type,
        flat: addrModalData.flat.trim(),
        locality: addrModalData.locality.trim(),
        city: addrModalData.city.trim(),
        state: addrModalData.state.trim() || "Tamil Nadu",
        pincode: cleanPin,
        isPrimary
      };
      if (isPrimary) {
        updatedList = [newAddrItem, ...savedAddresses.map(a => ({ ...a, isPrimary: false }))];
      } else {
        updatedList = [...savedAddresses, newAddrItem];
      }
    }

    setSavedAddresses(updatedList);
    localStorage.setItem("user_saved_addresses", JSON.stringify(updatedList));

    if (isPrimary) {
      const formatted = [
        addrModalData.flat.trim(),
        addrModalData.locality.trim(),
        addrModalData.city.trim(),
        addrModalData.state.trim() ? `${addrModalData.state.trim()} - ${cleanPin}` : cleanPin
      ].filter(Boolean).join(", ");

      setUserAddress(formatted);
      localStorage.setItem("user_address", formatted);
      localStorage.setItem("user_door_no", addrModalData.flat.trim());
      localStorage.setItem("user_street", addrModalData.locality.trim());
      localStorage.setItem("user_city", addrModalData.city.trim());
      localStorage.setItem("user_state", addrModalData.state.trim());
      localStorage.setItem("user_pincode", cleanPin);

      if (userEmail) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userEmail,
              name: profileName || userName,
              phone: profilePhone || userPhone,
              address: formatted
            })
          });
        } catch (err) {
          console.warn("Could not sync to DB:", err);
        }
      }
      window.dispatchEvent(new Event("storage"));
    }

    setShowAddressModal(false);
    setAddrSuccessMsg(editingAddressId ? "Address updated successfully!" : "New address added successfully!");
    setTimeout(() => setAddrSuccessMsg(""), 3500);
  };

  // Helper values derived from database + preset fallbacks
  const displayOrders = dbOrders.length > 0 ? dbOrders.map((o, idx) => ({
    raw: o,
    id: o.orderNumber || o.id || `ORD-${idx + 100}`,
    date: new Date(o.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: new Date(o.createdAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    price: o.totalAmount || 3200,
    itemsCount: o.items?.length || 1,
    status: o.orderStatus ? (o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1).toLowerCase()) : "Processing",
    productType: idx % 2 === 0 ? "bullet" : (idx % 3 === 0 ? "dome" : (idx % 4 === 0 ? "nvr" : "hdd")),
    items: o.items || [],
    shippingAddress: o.shippingAddress || "",
    paymentStatus: o.paymentStatus || "PENDING",
    paymentMethod: o.paymentMethod || "Cash on Delivery",
    serviceType: o.serviceType || "ONLY_PRODUCT_DELIVERY",
    assignedTechnician: o.assignedTechnicianName || o.assignedTechnician || "Unassigned"
  })) : [];

  const totalOrdersCount = displayOrders.length;
  
  const inProgressCount = displayOrders.filter(o => {
    const s = (o.status || "").toLowerCase();
    return s === "processing" || s === "in transit" || s === "in progress" || s === "shipped";
  }).length;

  const completedCount = displayOrders.filter(o => {
    const s = (o.status || "").toLowerCase();
    return s === "delivered" || s === "completed" || s === "approved";
  }).length;

  const displayInstallations = dbInstallations.length > 0 ? dbInstallations.map((p, idx) => ({
    id: p.id || `INST-${idx + 101}`,
    name: p.name || "CCTV Setup",
    camerasCount: p.devicesCount ? p.devicesCount - 1 : 4,
    dvrCount: 1,
    date: p.status === "Approved" ? `Installed on ${p.submissionDate || "May 10, 2025"}` : `Scheduled on ${p.submissionDate || "May 22, 2025"}`,
    status: p.status === "Approved" ? "Completed" : "In Progress",
    type: (p.name || "").toLowerCase().includes("shop") ? "shop" : "home"
  })) : [];

  const amcPlan = localStorage.getItem("user_amc_plan") || "Gold AMC Plan";
  const amcExpires = localStorage.getItem("user_amc_expires") || "May 20, 2026";

  const purchasedProducts = dbOrders.reduce((acc: any[], order: any) => {
    if (order && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (!acc.some(p => p.title?.toLowerCase() === item.title?.toLowerCase())) {
          acc.push({
            title: item.title,
            productId: item.productId || "prod-gen",
            productType: item.title?.toLowerCase().includes("bullet") ? "bullet" : (item.title?.toLowerCase().includes("dome") ? "dome" : (item.title?.toLowerCase().includes("nvr") ? "nvr" : "hdd"))
          });
        }
      });
    }
    return acc;
  }, []);

  const displayProducts = purchasedProducts;

  const sidebarMenu = [
    { name: "Profile Settings", icon: User, section: "ACCOUNT" },
    { name: "Addresses", icon: MapPin, section: "ACCOUNT" },
    { name: "My Orders", icon: ShoppingBag, section: "ORDER & PRODUCTS" },
    { name: "My Products", icon: Package, section: "ORDER & PRODUCTS" },
    { name: "Returns & Refunds", icon: RefreshCw, section: "ORDER & PRODUCTS" },
    { name: "Wishlist", icon: Heart, section: "ORDER & PRODUCTS" },
    { name: "My Installations", icon: ShieldCheck, section: "SERVICES" },
    { name: "AMC Plans", icon: Star, section: "SERVICES" },
    { name: "Service Requests", icon: Wrench, section: "SERVICES" },
    { name: "Payment Methods", icon: CreditCard, section: "ACCOUNT" },
    { name: "Change Password", icon: Lock, section: "ACCOUNT" }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans relative">
      
      {/* --- SIDEBAR NAVIGATION (Desktop) --- */}
      <aside className="hidden md:flex inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100 flex-col shrink-0 text-left pt-6">
        {/* Sidebar Brand / Avatar Profile Summary */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-extrabold text-base animate-pulse">
              {userName?.charAt(0).toUpperCase() || "R"}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-800 leading-tight">{userName || "Ramesh"}</span>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Premium Customer</span>
            </div>
          </div>
        </div>

        {/* Navigation Items grouped by section */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          
          {/* Grouped menu sections */}
          {["ACCOUNT", "ORDER & PRODUCTS", "SERVICES"].map(sectionName => (
            <div key={sectionName} className="space-y-1">
              <span className="block px-3.5 text-[9px] font-black text-slate-405 tracking-wider uppercase mb-1.5 mt-2">
                {sectionName}
              </span>
              {sidebarMenu
                .filter(item => item.section === sectionName)
                .map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => { setActiveTab(item.name); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        activeTab === item.name
                          ? "bg-red-50/70 text-red-500"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-850"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
            </div>
          ))}

        </div>

        {/* Sidebar Helpdesk & Signout Area */}
        <div className="p-4 border-t border-slate-50 space-y-4">
          {/* Support widget box */}
          <div className="bg-red-500 text-white rounded-2xl p-4 text-left shadow-md shadow-red-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 opacity-90" />
              <span className="font-extrabold text-xs">Need Help?</span>
            </div>
            <p className="text-[10px] text-red-100 leading-normal font-medium">
              Our support team is available 24/7.
            </p>
            <button
              onClick={() => { setActiveTab("Service Requests"); setIsMobileMenuOpen(false); }}
              className="w-full h-8 bg-white hover:bg-slate-50 text-red-500 font-extrabold text-[11px] rounded-xl transition-all shadow-sm"
            >
              Contact Support
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-650 hover:bg-red-50 transition-all text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN PANEL AREA --- */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 text-left">
        
        {/* Mobile Horizontal Navigation Tabs */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-5 -mx-4 px-4 border-b border-slate-200">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white shadow-sm shadow-red-600/25"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
        
        {/* --- MY ORDERS TAB --- */}
        {activeTab === "My Orders" && (
          <div className="bg-white border border-slate-105 rounded-3xl p-6 shadow-sm text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg leading-snug">Order History</h3>
                <p className="text-[11px] text-slate-505 font-semibold mt-0.5">Browse all your product orders and installation receipts</p>
              </div>
              <ShoppingBag className="w-5 h-5 text-slate-400" />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs font-semibold text-slate-650">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{order.id}</td>
                      <td className="py-3.5 px-4 text-slate-550">{order.date}</td>
                      <td className="py-3.5 px-4">{order.itemsCount} {order.itemsCount === 1 ? "Item" : "Items"}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">₹{order.price.toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeClass(order.status)}`}>
                          {getDisplayStatus(order.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-[11px] text-red-500 hover:text-red-700 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Flipkart Style) */}
            <div className="md:hidden grid grid-cols-1 gap-4 mt-2">
              {displayOrders.map(order => (
                <div key={`mobile-${order.id}`} className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="font-extrabold text-slate-800 text-xs">{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusBadgeClass(order.status)}`}>
                      {getDisplayStatus(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <ProductThumb type={order.productType} />
                      <div>
                        <p className="text-slate-800 font-bold text-xs">{order.itemsCount} {order.itemsCount === 1 ? "Item" : "Items"}</p>
                        <p className="text-slate-400 font-semibold text-[10px] mt-0.5">{order.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-800 text-sm">₹{order.price.toLocaleString("en-IN")}</p>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-[10px] text-red-500 font-bold flex items-center gap-0.5 mt-1.5 ml-auto hover:text-red-600 cursor-pointer"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MY INSTALLATIONS TAB --- */}
        {activeTab === "My Installations" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-5">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg leading-snug">My CCTV Installations</h3>
                <p className="text-[11px] text-slate-505 font-semibold mt-0.5">Track deployment schedules and camera setups</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayInstallations.map(inst => (
                <div key={inst.id} className="border border-slate-100 hover:border-slate-200 rounded-2xl p-5 bg-slate-50/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {inst.type === "home" ? <HouseThumb /> : <ShopThumb />}
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{inst.name}</h4>
                        <span className="text-[10px] text-slate-405 font-bold">{inst.id}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      inst.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-red-50/70 text-red-500 border-red-100"
                    }`}>
                      {inst.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-slate-655 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Devices Configuration:</span>
                      <span className="text-slate-800 font-bold">{inst.camerasCount} IP Cameras, {inst.dvrCount} NVR Recorder</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date details:</span>
                      <span className="text-slate-800 font-bold">{inst.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SERVICE REQUESTS TAB --- */}
        {activeTab === "Service Requests" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left animate-in fade-in duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg leading-snug">Service & Support Tickets</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Raise helpdesk queries and view active technician visits</p>
              </div>
              <Button 
                onClick={() => setShowRequestModal(true)}
                className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/10 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> New Ticket
              </Button>
            </div>

            {dbRequests.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No active service requests.
              </div>
            ) : (
              <div className="space-y-4">
                {dbRequests.map(req => (
                  <div key={req.id} className="p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all bg-slate-50/20 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-850">{req.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === "Open"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : req.status === "In Progress"
                          ? "bg-red-50/70 text-red-500 border-red-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800">{req.type}</h4>
                    {req.description && <p className="text-slate-500 mt-1">{req.description}</p>}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-between text-slate-400 font-bold">
                      <span>Date Raised: {req.date}</span>
                      <span>Assigned Tech: <strong className="text-slate-655">{req.assignedTech}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- OTHER SUB-TABS (Wishlist, Returns, Profile Settings, etc.) --- */}
        {activeTab !== "My Orders" && activeTab !== "My Installations" && activeTab !== "Service Requests" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-left animate-in fade-in duration-200 space-y-6">
            <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-50 pb-3">{activeTab}</h3>
            
            {activeTab === "My Products" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayProducts.map((prod, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-2xl p-4 flex gap-4 hover:shadow-sm transition-all">
                    <ProductThumb type={prod.productType} />
                    <div className="text-left">
                      <h4 className="font-bold text-xs text-slate-800">{prod.title}</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">ID: {prod.productId}</span>
                      <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider mt-2 block">Warranty Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "AMC Plans" && (
              <div className="space-y-4">
                <div className="p-5 border border-emerald-250 bg-emerald-50/10 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-emerald-655 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>{amcPlan} (Active)</span>
                  </div>
                  <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                    Covers 4 onsite inspections per year, free replacement of wires/connectors, and unlimited remote helpline ticketing support.
                  </p>
                  <div className="text-[10px] text-slate-400 font-bold pt-2">
                    Valid till: {amcExpires}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Wishlist" && (
              <div className="py-8 text-center text-xs font-semibold text-slate-400">
                Your wishlist is empty. Add cameras and NVRs while browsing the shop page!
              </div>
            )}

            {activeTab === "Returns & Refunds" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-505 font-medium">To initiate a replacement or return request for recently ordered security products, choose the order number below:</p>
                <div className="max-w-md space-y-4 pt-2">
                  <select className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none bg-white">
                    <option>Select Order Number</option>
                    {displayOrders.map(o => (
                      <option key={o.id}>{o.id} - ₹{o.price.toLocaleString("en-IN")}</option>
                    ))}
                  </select>
                  <textarea placeholder="Reason for return..." rows={4} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none" />
                  <Button className="h-10 px-5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/10">Submit Request</Button>
                </div>
              </div>
            )}

            {activeTab === "Profile Settings" && (
              <form onSubmit={handleProfileSave} className="max-w-2xl space-y-4 text-xs font-semibold text-slate-655">
                {profileMsg && (
                  <div className={`p-3 rounded-xl text-center text-xs font-bold ${
                    profileMsg.startsWith("Error") ? "bg-red-50 border border-red-200 text-red-600" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  }`}>
                    {profileMsg}
                  </div>
                )}
                <div>
                  <label className="block text-slate-455 mb-1.5">Full Name</label>
                  <Input 
                    type="text" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    className="h-10 rounded-xl" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-slate-455 mb-1.5">Email Address</label>
                  <Input type="email" value={userEmail || ""} className="h-10 rounded-xl" disabled />
                </div>
                <div>
                  <label className="block text-slate-455 mb-1.5">Mobile Phone</label>
                  <Input 
                    type="tel" 
                    value={profilePhone} 
                    maxLength={10}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="h-10 rounded-xl" 
                    placeholder="10-digit mobile number"
                  />
                </div>

                {/* INSTALLATION & DELIVERY ADDRESS */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1">
                    <MapPin className="h-4 w-4 text-[#ff3b30]" />
                    <span>INSTALLATION & DELIVERY ADDRESS</span>
                  </div>

                  {/* 1. Door No & 2. Street / Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        1. Door No / Building / Apartment Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={addrDoorNo}
                          onChange={e => setAddrDoorNo(e.target.value)}
                          placeholder="Flat 4B / House No"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        2. Street / Area / Colony <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Navigation className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={addrStreet}
                          onChange={e => setAddrStreet(e.target.value)}
                          placeholder="Street Name, Area"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. City, 4. State & 5. Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        3. City / Town <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Map className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={addrCity}
                          onChange={e => setAddrCity(e.target.value)}
                          placeholder="City"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        4. State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={addrState}
                        onChange={e => setAddrState(e.target.value)}
                        placeholder="Tamil Nadu"
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        5. Pincode (6 digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={addrPincode}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setAddrPincode(val);
                        }}
                        placeholder="600001"
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* 6. Landmark (Optional) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      6. Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={addrLandmark}
                      onChange={e => setAddrLandmark(e.target.value)}
                      placeholder="e.g. Near Bus Stand, Opp. Temple"
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={profileSaving}
                    className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "Addresses" && (
              <div className="space-y-4">
                {addrSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{addrSuccessMsg}</span>
                  </div>
                )}

                {savedAddresses.length === 0 ? (
                  <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20">
                    <h4 className="font-bold text-xs text-slate-800">Primary Installation / Shipping Address</h4>
                    <p className="text-slate-505 text-xs font-semibold mt-2 leading-relaxed">
                      {userAddress || "No. 45, 1st Avenue, Anna Nagar East, Chennai, Tamil Nadu - 600102"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => {
                      const isPrimary = !!addr.isPrimary;
                      return (
                        <div
                          key={addr.id}
                          className={`p-4 border rounded-2xl transition-all ${
                            isPrimary
                              ? "border-slate-200 bg-slate-50/40"
                              : "border-slate-150 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-bold text-xs text-slate-800">
                                  {isPrimary ? "Primary Installation / Shipping Address" : (addr.name || "Delivery Address")}
                                </h4>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                  addr.type === "WORK"
                                    ? "bg-amber-100 text-amber-800"
                                    : addr.type === "HOME"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}>
                                  {addr.type || "HOME"}
                                </span>
                                {isPrimary && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                    PRIMARY
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-505 text-xs font-semibold mt-2 leading-relaxed">
                                {[addr.flat, addr.locality, addr.city, addr.state].filter(Boolean).join(", ")}
                                {addr.pincode && <> &ndash; {addr.pincode}</>}
                              </p>

                              {addr.phone && (
                                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                                  📞 {addr.phone} {addr.name && !isPrimary ? `(${addr.name})` : ""}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAddress(addr)}
                                title="Edit Address"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                title="Delete Address"
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {!isPrimary && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(addr.id)}
                                className="text-xs font-bold text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                Set as Primary Address
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="h-10 px-5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </Button>
              </div>
            )}

            {activeTab === "Payment Methods" && (
              <div className="space-y-4">
                <div className="p-4 border border-slate-105 rounded-2xl bg-slate-50/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-slate-100 rounded border border-slate-200/50 flex items-center justify-center font-black text-[9px] text-slate-550 uppercase">UPI</div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{userName || "Customer"}'s GPay</h4>
                      <span className="text-[10px] text-slate-404 font-semibold mt-0.5 block">
                        {(userName || "customer").toLowerCase().replace(/\s+/g, '')}@okhdfcbank
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Primary</span>
                </div>
              </div>
            )}

            {activeTab === "Change Password" && (
              <form onSubmit={handleChangePassword} className="max-w-md space-y-4 text-xs font-semibold text-slate-655">
                {cpMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center text-xs font-bold">
                    {cpMsg}
                  </div>
                )}
                {cpError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-650 text-center text-xs font-bold">
                    {cpError}
                  </div>
                )}
                <div>
                  <label className="block text-slate-455 mb-1.5">Current Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={cpCurrent} 
                    onChange={(e) => setCpCurrent(e.target.value)} 
                    className="h-10 rounded-xl" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-slate-455 mb-1.5">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="Minimum 6 characters" 
                    value={cpNew} 
                    onChange={(e) => setCpNew(e.target.value)} 
                    className="h-10 rounded-xl" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-slate-455 mb-1.5">Confirm New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={cpConfirm} 
                    onChange={(e) => setCpConfirm(e.target.value)} 
                    className="h-10 rounded-xl" 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={cpSaving}
                  className="h-10 px-5 bg-red-500 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/10"
                >
                  {cpSaving ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}

          </div>
        )}

      </main>

      {/* Book Service Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowRequestModal(false)}
            className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-left animate-in zoom-in duration-200">
            <h3 className="font-extrabold text-slate-855 text-xl mb-1.5">Book Service Request</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Describe the issues you are facing and submit for dispatch.</p>

            {serviceSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center mb-5">
                {serviceSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateServiceRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Request Reason / Type</label>
                <select
                  value={serviceForm.type}
                  onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-202 rounded-xl focus:outline-none focus:border-red-500 bg-white"
                >
                  <option>Camera not working properly</option>
                  <option>No video recording / DVR restart</option>
                  <option>Camera Feed Blur</option>
                  <option>NVR Login Credentials not working</option>
                  <option>Cable damage / Rerouting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Problem Details & Comments</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us what's happening (e.g. Channel 3 camera shows static, NVR warning beep)..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-202 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Urgency / Priority</label>
                <div className="flex gap-4">
                  {["Low", "Medium", "High"].map(p => (
                    <label key={p} className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priority"
                        value={p}
                        checked={serviceForm.priority === p}
                        onChange={() => setServiceForm({ ...serviceForm, priority: p })}
                        className="h-4 w-4 text-red-500 focus:ring-red-500"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-205 text-slate-505 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingService}
                  className="px-5 py-2 bg-red-500 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/10 transition-colors"
                >
                  {isSubmittingService ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
          />
          <div className="relative w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-2xl text-left animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                    {selectedOrder.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {getDisplayStatus(selectedOrder.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Placed on {selectedOrder.date} {selectedOrder.time ? `at ${selectedOrder.time}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Stepper */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Order Status</div>
              <div className="flex items-center justify-between relative">
                {[
                  { label: "Placed", done: true },
                  { 
                    label: "Processing", 
                    done: !["cancelled"].includes(selectedOrder.status?.toLowerCase()) 
                  },
                  { 
                    label: "Shipped", 
                    done: ["shipped", "in transit", "delivered", "completed"].includes(selectedOrder.status?.toLowerCase()) 
                  },
                  { 
                    label: "Delivered", 
                    done: ["delivered", "completed", "approved"].includes(selectedOrder.status?.toLowerCase()) 
                  }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center z-10 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step.done 
                        ? "bg-emerald-500 text-white shadow-sm" 
                        : "bg-slate-200 text-slate-500"
                    }`}>
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 ${step.done ? "text-slate-800" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Order Items ({selectedOrder.items?.length || selectedOrder.itemsCount || 1})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-3 bg-white">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((it: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      {it.image ? (
                        <img 
                          src={it.image.startsWith('http') ? it.image : `${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}${it.image}`} 
                          alt={it.title || it.name} 
                          className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0" 
                        />
                      ) : (
                        <ProductThumb type={selectedOrder.productType} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{it.title || it.name || "CCTV Equipment"}</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          Qty: <strong className="text-slate-700">{it.quantity || 1}</strong> × ₹{(it.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 py-2">
                    <ProductThumb type={selectedOrder.productType} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">CCTV Security Equipment</p>
                      <p className="text-[11px] text-slate-400 font-semibold">Qty: {selectedOrder.itemsCount}</p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">₹{selectedOrder.price.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery & Payment Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
              {/* Delivery Address */}
              <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Delivery Address
                </div>
                <p className="text-slate-800 font-bold text-xs">{selectedOrder.raw?.customerName || userName}</p>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed break-words">
                  {selectedOrder.shippingAddress || userAddress || "Address provided during checkout"}
                </p>
                <p className="text-slate-500 text-[11px] mt-1 font-semibold">
                  📞 {selectedOrder.raw?.customerPhone || userPhone}
                </p>
              </div>

              {/* Payment Summary */}
              <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    Payment Details
                  </div>
                  <div className="flex justify-between items-center text-[11px] mt-1">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-bold text-slate-800">{selectedOrder.paymentMethod || "Cash on Delivery"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] mt-1">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      selectedOrder.paymentStatus === "PAID" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {selectedOrder.paymentStatus === "PAID" ? "PAID" : "CASH ON DELIVERY (PENDING)"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200/60 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Total Amount:</span>
                  <span className="text-sm font-black text-slate-900">₹{selectedOrder.price.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enter complete delivery and installation address details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddressModal} className="overflow-y-auto px-6 py-5 space-y-4">
              {addrModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addrModalError}</span>
                </div>
              )}

              {/* Geolocation auto-fill */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleFetchLocationForModal}
                  disabled={fetchingLocationModal}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${fetchingLocationModal ? "animate-spin" : ""}`} />
                  {fetchingLocationModal ? "Locating..." : "Use My Current Location"}
                </button>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Receiver Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={addrModalData.name}
                    onChange={e => setAddrModalData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full Name"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    10-Digit Mobile <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    required
                    maxLength={10}
                    value={addrModalData.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddrModalData(prev => ({ ...prev, phone: val }));
                    }}
                    placeholder="9876543210"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Flat / Door No / Street */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Flat / House No. / Building / Street <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={addrModalData.flat}
                  onChange={e => setAddrModalData(prev => ({ ...prev, flat: e.target.value }))}
                  placeholder="e.g. Flat 4B / Door No. 11, Anna Nagar"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Locality / Area / Landmark */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Area / Locality / Landmark
                </label>
                <Input
                  type="text"
                  value={addrModalData.locality}
                  onChange={e => setAddrModalData(prev => ({ ...prev, locality: e.target.value }))}
                  placeholder="e.g. Near Bus Stand, Opp. Temple"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={addrModalData.city}
                    onChange={e => setAddrModalData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addrModalData.state}
                    onChange={e => setAddrModalData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full h-10 px-3 text-xs font-semibold border border-input rounded-xl focus:outline-none focus:border-red-500 bg-white"
                  >
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Pincode (6 digits) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    value={addrModalData.pincode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAddrModalData(prev => ({ ...prev, pincode: val }));
                    }}
                    placeholder="635301"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Address Tag */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["HOME", "WORK", "OTHER"] as const).map(tag => {
                    const isSelected = addrModalData.type === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAddrModalData(prev => ({ ...prev, type: tag }))}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-red-500 border-red-500 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Address Checkbox */}
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addrModalData.isPrimary}
                  onChange={e => setAddrModalData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  className="w-4 h-4 rounded text-red-500 focus:ring-red-400 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">
                  Set as Primary / Default Address for orders & installations
                </span>
              </label>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddressModal(false)}
                  className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/10 cursor-pointer"
                >
                  {editingAddressId ? "Save Changes" : "Add Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
