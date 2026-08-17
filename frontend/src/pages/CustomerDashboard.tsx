import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  X
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

export default function CustomerDashboard() {
  const navigate = useNavigate();
  
  // Auth state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string>("No address saved yet.");

  // Tab State
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic Dashboard Stats
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbRequests, setDbRequests] = useState<any[]>([]);
  const [dbInstallations, setDbInstallations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Settings form state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

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
    
    setUserEmail(email);
    setUserName(name);
    setUserPhone(phone);
    setProfileName(name);
    setProfilePhone(phone);
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
          const freshAddress = u.shippingAddress || u.address || "";
          setUserName(freshName);
          setUserPhone(freshPhone);
          setProfileName(freshName);
          setProfilePhone(freshPhone);
          if (freshAddress) setUserAddress(freshAddress);
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

  // Save profile name + phone to MongoDB
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, name: profileName, phone: profilePhone })
      });
      const data = await res.json();
      if (data.success) {
        setUserName(data.data.name);
        setUserPhone(data.data.phone || "");
        localStorage.setItem("user_name", data.data.name);
        localStorage.setItem("user_phone", data.data.phone || "");
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

  // Helper values derived from database + preset fallbacks
  const displayOrders = dbOrders.length > 0 ? dbOrders.map((o, idx) => ({
    id: o.orderNumber || o.id || `ORD-${idx + 100}`,
    date: new Date(o.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    price: o.totalAmount || 3200,
    itemsCount: o.items?.length || 1,
    status: o.orderStatus ? (o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1).toLowerCase()) : "Processing",
    productType: idx % 2 === 0 ? "bullet" : (idx % 3 === 0 ? "dome" : (idx % 4 === 0 ? "nvr" : "hdd"))
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
    { name: "Dashboard", icon: HomeIcon, section: "main" },
    { name: "My Orders", icon: ShoppingBag, section: "ORDER & PRODUCTS" },
    { name: "My Products", icon: Package, section: "ORDER & PRODUCTS" },
    { name: "Returns & Refunds", icon: RefreshCw, section: "ORDER & PRODUCTS" },
    { name: "Wishlist", icon: Heart, section: "ORDER & PRODUCTS" },
    { name: "My Installations", icon: ShieldCheck, section: "SERVICES" },
    { name: "AMC Plans", icon: Star, section: "SERVICES" },
    { name: "Service Requests", icon: Wrench, section: "SERVICES" },
    { name: "Profile Settings", icon: Settings, section: "ACCOUNT" },
    { name: "Addresses", icon: MapPin, section: "ACCOUNT" },
    { name: "Payment Methods", icon: CreditCard, section: "ACCOUNT" },
    { name: "Change Password", icon: Lock, section: "ACCOUNT" }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans relative">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-100 p-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-extrabold animate-pulse">
            {userName?.charAt(0).toUpperCase() || "R"}
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight">Customer Panel</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 text-left md:pt-6 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Sidebar Brand / Avatar Profile Summary */}
        <div className="px-6 mb-6 mt-6 md:mt-0">
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
          
          {/* Main Dashboard item */}
          <div>
            <button
              onClick={() => { setActiveTab("Dashboard"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "Dashboard"
                  ? "bg-red-50/70 text-red-500"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-850"
              }`}
            >
              <HomeIcon className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Grouped menu sections */}
          {["ORDER & PRODUCTS", "SERVICES", "ACCOUNT"].map(sectionName => (
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
      <main className="flex-1 overflow-y-auto p-8 text-left">
        
        {activeTab === "Dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight leading-none">
                  Welcome back, {userName || "Ramesh"}! 👋
                </h1>
                <p className="text-xs text-slate-450 font-semibold mt-2.5">
                  Here's what's happening with your account today.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 shadow-sm self-start sm:self-auto cursor-pointer hover:bg-slate-50 transition-all">
                <Calendar className="w-4 h-4 text-slate-455" />
                <span>May 20, 2025</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Metric 1 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50/70 text-red-500 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{totalOrdersCount}</h3>
                    <span className="text-[9px] sm:text-[10px] text-slate-450 font-bold block uppercase tracking-wider mt-1 sm:mt-0.5">Total Orders</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab("My Orders")} className="text-red-500 hover:text-red-600 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-0.5 self-start sm:self-auto">
                  <span>View</span> <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Metric 2 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{inProgressCount}</h3>
                    <span className="text-[9px] sm:text-[10px] text-slate-455 font-bold block uppercase tracking-wider mt-1 sm:mt-0.5">In Progress</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab("My Orders")} className="text-emerald-650 hover:text-emerald-700 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-0.5 self-start sm:self-auto">
                  <span>Track</span> <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Metric 3 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">{completedCount}</h3>
                    <span className="text-[9px] sm:text-[10px] text-slate-450 font-bold block uppercase tracking-wider mt-1 sm:mt-0.5">Completed Orders</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab("My Orders")} className="text-amber-605 hover:text-amber-700 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-0.5 self-start sm:self-auto">
                  <span>History</span> <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Metric 4 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">1</h3>
                    <span className="text-[9px] sm:text-[10px] text-slate-450 font-bold block uppercase tracking-wider mt-1 sm:mt-0.5">Active AMC Plan</span>
                  </div>
                </div>
                <button onClick={() => setActiveTab("AMC Plans")} className="text-purple-650 hover:text-purple-700 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-0.5 self-start sm:self-auto">
                  <span>Details</span> <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

            </div>

            {/* Layout Row 1: Recent Orders & Installations + CCTV Promo Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Orders card */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Recent Orders</h3>
                  <button onClick={() => setActiveTab("My Orders")} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-0.5">
                    <span>View All Orders</span> <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-50 flex-grow">
                  {displayOrders.slice(0, 4).map(order => (
                    <div key={order.id} className="py-3 flex items-center justify-between hover:bg-slate-50/35 px-1 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <ProductThumb type={order.productType} />
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-800">{order.id}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">{order.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-800">₹{order.price.toLocaleString("en-IN")}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">{order.itemsCount} {order.itemsCount === 1 ? "Item" : "Items"}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(order.status)}`}>
                          {getDisplayStatus(order.status)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-350" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Installations + Security camera upgrade banner column */}
              <div className="space-y-6">
                
                {/* My Installations */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">My Installations</h3>
                    <button onClick={() => setActiveTab("My Installations")} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-0.5">
                      <span>View All</span> <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {displayInstallations.map(inst => (
                      <div key={inst.id} className="flex items-center justify-between p-3 border border-slate-105 hover:border-slate-200 rounded-2xl transition-all bg-slate-50/20">
                        <div className="flex items-center gap-3">
                          {inst.type === "home" ? <HouseThumb /> : <ShopThumb />}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-xs text-slate-850">{inst.name}</h4>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                                inst.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}>
                                {inst.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-450 block font-semibold mt-1">
                              {inst.camerasCount} Cameras, {inst.dvrCount} DVR
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">
                              {inst.date}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-350" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade Security Promo banner */}
                <div className="bg-gradient-to-br from-[#0b0f19] to-[#1e293b] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex items-center justify-between min-h-[120px]">
                  <div className="z-10 text-left max-w-[60%]">
                    <h3 className="font-black text-sm leading-tight text-white">Upgrade Your Security!</h3>
                    <p className="text-[9px] text-slate-300 font-bold mt-2 leading-relaxed">
                      Explore our latest AI-powered security cameras.
                    </p>
                    <Link to="/products">
                      <button className="h-8 px-4 bg-white hover:bg-slate-50 text-slate-905 font-extrabold text-[10px] rounded-xl mt-4 transition-all shadow-sm">
                        Shop Now
                      </button>
                    </Link>
                  </div>
                  {/* Decorative Security Camera mockup overlapping right */}
                  <div className="absolute right-[-15px] bottom-[-10px] opacity-90 w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 text-slate-350" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="2" y="5" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.08" />
                      <circle cx="9" cy="10" r="3" />
                      <line x1="16" y1="8" x2="22" y2="5" strokeLinecap="round" />
                      <line x1="16" y1="12" x2="22" y2="15" strokeLinecap="round" />
                      <path d="M7 18h4l-2 3z" fill="currentColor" />
                    </svg>
                  </div>
                </div>

              </div>

            </div>

            {/* Layout Row 2: Active AMC Plan & Quick Actions & Need Help */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Active AMC Plan card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between text-left">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                  <div className="flex items-center gap-2 text-emerald-650 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Active AMC Plan</span>
                  </div>
                  <button onClick={() => setActiveTab("AMC Plans")} className="text-xs font-bold text-red-500 hover:underline">
                    View Plan →
                  </button>
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-850">{amcPlan}</h3>
                    <span className="text-[10px] text-emerald-600 font-bold block">Valid till {amcExpires}</span>
                  </div>
                  {/* Gold star ribbon seal inline SVG */}
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                      <polygon points="12,4 14.5,9.5 20.5,10 16,14 17.5,20 12,17 6.5,20 8,14 3.5,10 9.5,9.5" />
                    </svg>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-[11px] font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quarterly Maintenance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Priority Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free Software Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Service Calls</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setActiveTab("AMC Plans")}
                  className="w-full h-9 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-700 font-bold rounded-xl mt-6 text-xs transition-all"
                >
                  Plan Details
                </Button>
              </div>

              {/* Quick Actions card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="border-b border-slate-50 pb-4 mb-4 text-left">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Quick Actions</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Action 1 */}
                  <button 
                    onClick={() => setActiveTab("My Orders")}
                    className="flex flex-col items-center justify-center p-3 border border-slate-50 hover:border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all text-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black text-slate-655 leading-none">Track Order</span>
                  </button>

                  {/* Action 2 */}
                  <button 
                    onClick={() => setActiveTab("My Installations")}
                    className="flex flex-col items-center justify-center p-3 border border-slate-50 hover:border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all text-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black text-slate-655 leading-none">Book Installation</span>
                  </button>

                  {/* Action 3 */}
                  <button 
                    onClick={() => setShowRequestModal(true)}
                    className="flex flex-col items-center justify-center p-3 border border-slate-50 hover:border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all text-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black text-slate-655 leading-none">Request Service</span>
                  </button>

                  {/* Action 4 */}
                  <button 
                    onClick={() => setActiveTab("My Orders")}
                    className="flex flex-col items-center justify-center p-3 border border-slate-55 hover:border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all text-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black text-slate-655 leading-none">Buy Again</span>
                  </button>

                  {/* Action 5 */}
                  <button 
                    onClick={() => setActiveTab("My Orders")}
                    className="flex flex-col items-center justify-center p-3 border border-slate-50 hover:border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all text-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black text-slate-655 leading-none">Download Invoice</span>
                  </button>

                  {/* Action 6 */}
                  <button 
                    onClick={() => alert("Invite link copied to clipboard!")}
                    className="flex flex-col items-center justify-center p-3 border border-slate-50 hover:border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all text-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                      <Gift className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black text-slate-655 leading-none">Refer & Earn</span>
                  </button>
                </div>
              </div>

              {/* Need Help? Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between text-left">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Need Help?</h3>
                  <button onClick={() => setActiveTab("Service Requests")} className="text-xs font-bold text-red-500 hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Contact 1 */}
                  <a href="tel:+919876543210" className="flex items-center justify-between p-2.5 border border-slate-50 hover:border-slate-100 rounded-xl bg-slate-50/20 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800">Call Us</h4>
                        <span className="text-[10px] text-slate-450 font-bold block mt-0.5">+91 98765 43210</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-550 transition-colors" />
                  </a>

                  {/* Contact 2 */}
                  <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 border border-slate-50 hover:border-slate-100 rounded-xl bg-slate-50/20 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.167 1.485 4.774 1.486 5.279 0 9.574-4.287 9.577-9.552.001-2.546-1.043-4.936-2.91-6.803C16.166 2.418 13.785 1.385 11.24 1.385 5.961 1.385 1.668 5.673 1.665 10.952c-.001 1.705.452 3.37 1.309 4.866l-.995 3.637 3.673-.961zm11.233-6.52c-.27-.135-1.602-.79-1.85-.88-.25-.09-.432-.136-.614.137-.182.273-.706.88-.865 1.063-.16.183-.318.206-.588.07-2.316-1.157-3.83-2.288-5.362-4.908-.27-.46.27-.426.772-1.428.082-.164.041-.307-.02-.442-.063-.136-.614-1.477-.841-2.023-.222-.533-.487-.46-.614-.466-.118-.006-.254-.008-.39-.008s-.356.05-.543.254c-.187.204-.716.7-.716 1.704 0 1.004.73 1.977.83 2.113.1.136 1.436 2.193 3.48 3.074 1.116.48 1.987.767 2.662.98.677.213 1.293.183 1.782.11.545-.08 1.602-.655 1.826-1.286.223-.632.223-1.173.156-1.286-.067-.113-.247-.204-.517-.34z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800">WhatsApp Support</h4>
                        <span className="text-[10px] text-slate-450 font-bold block mt-0.5">Chat with our team</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-550 transition-colors" />
                  </a>

                  {/* Contact 3 */}
                  <a href="mailto:support@sktechnology.com" className="flex items-center justify-between p-2.5 border border-slate-50 hover:border-slate-100 rounded-xl bg-slate-50/20 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50/70 text-red-500 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800">Email Support</h4>
                        <span className="text-[10px] text-slate-450 font-bold block mt-0.5">support@sktechnology.com</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </a>
                </div>
              </div>

            </div>

          </div>
        )}

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
                      <button className="text-[9px] text-red-500 font-bold flex items-center gap-0.5 mt-1.5 ml-auto hover:text-red-600">
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
        {activeTab !== "Dashboard" && activeTab !== "My Orders" && activeTab !== "My Installations" && activeTab !== "Service Requests" && (
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
              <form onSubmit={handleProfileSave} className="max-w-md space-y-4 text-xs font-semibold text-slate-655">
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
                    onChange={(e) => setProfilePhone(e.target.value)} 
                    className="h-10 rounded-xl" 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={profileSaving}
                  className="h-10 px-5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/10"
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}

            {activeTab === "Addresses" && (
              <div className="space-y-4">
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/20">
                  <h4 className="font-bold text-xs text-slate-800">Primary Installation / Shipping Address</h4>
                  <p className="text-slate-505 text-xs font-semibold mt-2 leading-relaxed">
                    {userAddress || "No. 45, 1st Avenue, Anna Nagar East, Chennai, Tamil Nadu - 600102"}
                  </p>
                </div>
                <Button className="h-10 px-5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs">Add New Address</Button>
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

    </div>
  );
}
