import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trash2, ArrowRight, ArrowLeft, ShoppingBag, CheckCircle2, X, MapPin, Building, Navigation, Map, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItem {
  id: string | number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  quantity: number;
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

export default function Cart() {
  const [searchParams] = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Saved Addresses State (Flipkart/Amazon style)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: "",
    phone: "",
    pincode: "",
    locality: "",
    flat: "",
    city: "",
    state: "Tamil Nadu",
    type: "HOME" as "HOME" | "WORK" | "OTHER"
  });

  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    doorNo: "",
    street: "",
    city: "",
    state: "Tamil Nadu",
    zipcode: "",
    landmark: "",
    serviceType: "ONLY_PRODUCT_DELIVERY" as "ONLY_PRODUCT_DELIVERY" | "DELIVERY_INSTALLATION",
    paymentMethod: "COD" as "COD" | "RAZORPAY"
  });
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
      setCartItems(cart);
    };

    loadCart();
    window.addEventListener("storage", loadCart);
    window.addEventListener("cart-updated", loadCart);
    return () => {
      window.removeEventListener("storage", loadCart);
      window.removeEventListener("cart-updated", loadCart);
    };
  }, []);

  const handleRemoveItem = (id: string | number) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem("shopping_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const handleQuantityChange = (id: string | number, newQty: number) => {
    if (newQty < 1) return;
    const updated = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    );
    setCartItems(updated);
    localStorage.setItem("shopping_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.address) {
              const addr = data.address;
              const house = addr.house_number || addr.building || addr.house || "";
              const road = addr.road || addr.street || "";
              const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
              const city = addr.city || addr.town || addr.village || "";
              const state = addr.state || "Tamil Nadu";
              const postcode = addr.postcode || "";

              const streetName = [road, suburb].filter(Boolean).join(", ");

              setCheckoutForm((prev) => ({
                ...prev,
                doorNo: house || prev.doorNo || "",
                street: streetName || prev.street || "",
                city: city || suburb || prev.city || "Chennai",
                state: state || "Tamil Nadu",
                zipcode: postcode || prev.zipcode || "600001",
              }));
            }
          })
          .catch((err) => {
            console.error("Geocoding failed:", err);
            setCheckoutForm((prev) => ({
              ...prev,
              street: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            }));
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

  const handleCheckoutClick = () => {
    const token = localStorage.getItem("user_token");
    const role = localStorage.getItem("user_role");
    
    if (!token || role !== "CUSTOMER") {
      window.location.href = "/login?redirect=/cart?checkout=true";
      return;
    }

    const email = localStorage.getItem("user_email") || "";
    const name = localStorage.getItem("user_name") || "";
    const phone = localStorage.getItem("user_phone") || "";

    const localDoorNo = localStorage.getItem("user_door_no") || "";
    const localStreet = localStorage.getItem("user_street") || "";
    const localCity = localStorage.getItem("user_city") || "";
    const localState = localStorage.getItem("user_state") || "Tamil Nadu";
    const localPincode = localStorage.getItem("user_pincode") || "";
    const localAddress = localStorage.getItem("user_address") || "";

    let profileFlat = localDoorNo;
    let profileLocality = localStreet;
    let profileCity = localCity;
    let profileState = localState;
    let profilePin = localPincode;

    if (!localDoorNo && !localStreet && localAddress) {
      const parts = localAddress.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) {
        profileFlat = parts[0] || '';
        profileLocality = parts[1] || '';
        const pMatch = localAddress.match(/\b\d{6}\b/);
        if (pMatch) profilePin = pMatch[0];
        if (parts.length >= 4) {
          profileCity = parts[parts.length - 2].replace(/^Near\s+.*$/i, '').trim() || '';
          profileState = parts[parts.length - 1].replace(/-\s*\d{6}/, '').replace(/\b\d{6}\b/, '').trim() || 'Tamil Nadu';
        }
      }
    }

    // Load saved addresses from localStorage and strictly purge mock/sample entries
    let storedAddrs: SavedAddress[] = [];
    try {
      const raw = localStorage.getItem("user_saved_addresses");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          storedAddrs = parsed.filter((a: SavedAddress) => {
            const isMockId = a.id === "addr-work-1" || a.id === "addr-home-primary";
            const isMockText =
              a.flat?.includes("Kengeri") ||
              a.locality?.includes("Vinayaka Layout") ||
              a.flat?.includes("36 Harur") ||
              a.city?.includes("Bengaluru");
            return !isMockId && !isMockText && a.name && a.flat && a.pincode;
          });
        }
      }
    } catch (e) {}

    // Check if user has a genuine profile address configured in profile
    const hasRealProfileAddress = Boolean(
      (profileFlat || profileLocality || localAddress) &&
      profileCity &&
      profilePin &&
      !profileFlat.includes("36 Harur") &&
      !profileFlat.includes("Kengeri")
    );

    if (storedAddrs.length === 0 && hasRealProfileAddress) {
      storedAddrs.push({
        id: `addr-profile-${Date.now()}`,
        name: name || "Customer",
        phone: phone || "",
        type: "HOME",
        flat: profileFlat || localAddress,
        locality: profileLocality || "",
        city: profileCity,
        state: profileState || "Tamil Nadu",
        pincode: profilePin,
        isPrimary: true
      });
    }

    // Save back the sanitized address list to localStorage
    localStorage.setItem("user_saved_addresses", JSON.stringify(storedAddrs));
    setSavedAddresses(storedAddrs);

    // If addresses exist, select the first. Otherwise, open "Add New Address" form directly.
    if (storedAddrs.length > 0) {
      setSelectedAddressId(storedAddrs[0].id);
      setIsAddingNewAddress(false);
    } else {
      setSelectedAddressId("");
      setIsAddingNewAddress(true);
    }

    setNewAddr({
      name: name,
      phone: phone,
      pincode: profilePin || "",
      locality: profileLocality || "",
      flat: profileFlat || "",
      city: profileCity || "",
      state: profileState || "Tamil Nadu",
      type: "HOME"
    });

    setCheckoutStep(1);
    setCheckoutError("");
    setCheckoutOpen(true);
  };

  const handleDeleteAddress = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAddresses.filter(a => a.id !== idToDelete);
    setSavedAddresses(updated);
    localStorage.setItem("user_saved_addresses", JSON.stringify(updated));
    if (selectedAddressId === idToDelete) {
      if (updated.length > 0) {
        setSelectedAddressId(updated[0].id);
      } else {
        setSelectedAddressId("");
        setIsAddingNewAddress(true);
      }
    }
  };

  // Auto-open checkout modal if customer just logged in / registered via redirect
  useEffect(() => {
    const isCheckoutAuto = searchParams.get("checkout") === "true";
    const token = localStorage.getItem("user_token");
    const role = localStorage.getItem("user_role");
    if (isCheckoutAuto && token && role === "CUSTOMER") {
      const items = JSON.parse(localStorage.getItem("shopping_cart") || "[]");
      if (items.length > 0) {
        handleCheckoutClick();
      }
    }
  }, [searchParams]);

  const handleProceedToPayment = () => {
    setCheckoutError("");
    if (isAddingNewAddress) {
      if (!newAddr.name.trim() || !newAddr.phone.trim() || !newAddr.flat.trim() || !newAddr.pincode.trim() || !newAddr.city.trim()) {
        setCheckoutError("Please fill in all required fields (Name, Mobile, Flat, Locality, City, Pincode).");
        return;
      }
      if (newAddr.phone.length !== 10 || !/^[6-9]\d{9}$/.test(newAddr.phone)) {
        setCheckoutError("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      const created: SavedAddress = {
        id: `addr-${Date.now()}`,
        name: newAddr.name.trim(),
        phone: newAddr.phone.trim(),
        flat: newAddr.flat.trim(),
        locality: newAddr.locality.trim(),
        city: newAddr.city.trim(),
        state: newAddr.state || "Tamil Nadu",
        pincode: newAddr.pincode.trim(),
        type: newAddr.type,
        isPrimary: savedAddresses.length === 0
      };
      const updated = [created, ...savedAddresses];
      setSavedAddresses(updated);
      setSelectedAddressId(created.id);
      localStorage.setItem("user_saved_addresses", JSON.stringify(updated));
      setIsAddingNewAddress(false);
    } else {
      if (!selectedAddressId) {
        setCheckoutError("Please select an address or add a new one.");
        return;
      }
    }
    setCheckoutStep(2);
  };

  const isSubmittingRef = useRef(false);

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingRef.current || placingOrder) return;

    const activeAddr = savedAddresses.find(a => a.id === selectedAddressId) || (isAddingNewAddress ? newAddr : (savedAddresses[0] || newAddr));
    if (!activeAddr || !activeAddr.name || !activeAddr.phone || !activeAddr.flat || !activeAddr.pincode) {
      setCheckoutError("Please select or fill in a complete delivery address.");
      return;
    }

    isSubmittingRef.current = true;
    setPlacingOrder(true);
    setCheckoutError("");

    const orderItems = cartItems.map(item => ({
      productId: item.id.toString(),
      title: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image ? item.image.replace('https://65.0.45.64.sslip.io', import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io') : ''
    }));

    const fullAddress = [activeAddr.flat, activeAddr.locality, activeAddr.city, activeAddr.state].filter(Boolean).join(", ") + ` - ${activeAddr.pincode} [Service: ${checkoutForm.serviceType === 'DELIVERY_INSTALLATION' ? 'DELIVERY + INSTALLATION' : 'ONLY PRODUCT DELIVERY'}]`;
    const userEmail = localStorage.getItem("user_email") || checkoutForm.email || "customer@sktechnology.in";

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: activeAddr.name,
          customerEmail: userEmail,
          customerPhone: activeAddr.phone,
          shippingAddress: fullAddress,
          doorNo: activeAddr.flat,
          street: activeAddr.locality,
          city: activeAddr.city || '',
          state: activeAddr.state || 'Tamil Nadu',
          postalCode: activeAddr.pincode || '',
          zipcode: activeAddr.pincode || '',
          landmark: '',
          items: orderItems,
          totalAmount: total,
          serviceType: checkoutForm.serviceType,
          paymentMethod: "Cash on Delivery",
        })
      });

      const data = await res.json();
      if (!data.success || !data.data) {
        setCheckoutError(data.message || "Failed to place order.");
        setPlacingOrder(false);
        isSubmittingRef.current = false;
        return;
      }

      const createdOrder = data.data;
      setOrderSuccess(createdOrder);
      localStorage.removeItem("shopping_cart");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      console.error("Order placement error:", err);
      setCheckoutError(err.message || "An error occurred while placing order.");
    } finally {
      setPlacingOrder(false);
      isSubmittingRef.current = false;
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const total = subtotal;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-20 pt-10 font-sans">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-8">Your Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-gray-200/90 rounded-2xl p-16 text-center space-y-5 shadow-sm max-w-lg mx-auto">
            <div className="h-16 w-16 bg-red-50 text-[#ff3b30] rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Your Cart is Empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Looks like you haven't added any products to your cart yet.
              </p>
            </div>
            <Link to="/products">
              <Button className="bg-[#ff3b30] hover:bg-red-700 text-white text-xs font-bold px-6 py-2 rounded-xl mt-2">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200/90 rounded-xl p-4 flex items-center gap-4 text-left shadow-xs">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=300&q=80"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-50 border border-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#ff3b30] uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded">
                      {item.brand}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 mt-2 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide font-semibold">{item.category}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                        className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity || 1}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                        className="w-6 h-6 rounded border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-extrabold text-[#ff3b30]">
                      ₹{(item.price * (item.quantity || 1)).toLocaleString("en-IN")}
                    </span>
                    {item.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{(item.originalPrice * (item.quantity || 1)).toLocaleString("en-IN")}
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500 h-8 w-8 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200/90 rounded-xl p-6 h-fit space-y-4 shadow-xs text-left">
              <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Estimated Shipping</span>
                  <span className="text-emerald-500 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>2-Year Warranty</span>
                  <span className="text-emerald-500 font-bold">INCLUDED</span>
                </div>
                <div className="flex justify-between font-bold text-base text-gray-900 pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-[#ff3b30]">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Button 
                onClick={handleCheckoutClick}
                className="w-full bg-[#ff3b30] hover:bg-red-700 text-white font-bold gap-2 py-5 shadow-sm rounded-xl"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal Overlay */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 text-left animate-in zoom-in-95 duration-200">
            {orderSuccess ? (
              <div className="p-8 text-center space-y-6">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Order Placed Successfully!</h3>
                  <p className="text-sm text-gray-500">
                    Thank you for your purchase. Your order number is{" "}
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {orderSuccess.orderNumber}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                  <Link to="/dashboard?tab=orders">
                    <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-white font-bold px-6 py-2.5 rounded-xl text-xs">
                      View My Orders
                    </Button>
                  </Link>
                  <button
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(null);
                    }}
                    className="w-full sm:w-auto border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-6 py-2.5 rounded-xl text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Modal Header (Dark Navy with Yellow Circle Icon & Step Badge) */}
                <div className="bg-[#0b192e] text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fca311] flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                      <MapPin className="w-5 h-5 fill-slate-950 text-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                          {checkoutStep === 1 ? "Select Delivery & Service Address" : "Confirm Cash on Delivery"}
                        </h3>
                        <span className="bg-[#242b26] text-[#ffb703] border border-[#ffb703]/50 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          STEP {checkoutStep} OF 2
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {checkoutStep === 1 
                          ? "Choose where your order or service booking should be delivered" 
                          : "Review your address and confirm your Cash on Delivery order"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Error Banner */}
                {checkoutError && (
                  <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 font-bold">
                    {checkoutError}
                  </div>
                )}

                {/* ================= STEP 1: ADDRESS SELECTION / ADD NEW ================= */}
                {checkoutStep === 1 && (
                  <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {!isAddingNewAddress ? (
                      /* --- SAVED ADDRESSES VIEW (Image 1) --- */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            SELECT FROM SAVED ADDRESSES
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewAddress(true)}
                            className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                          >
                            + Add New Address
                          </button>
                        </div>

                        {/* Address Cards List */}
                        <div className="space-y-3">
                          {savedAddresses.map(addr => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-amber-400 bg-amber-50/20 shadow-xs"
                                    : "border-slate-150 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    {/* Radio Circle */}
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                                      isSelected ? "border-amber-500" : "border-slate-300"
                                    }`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                          {addr.name}
                                        </h4>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                          addr.type === "WORK"
                                            ? "bg-amber-100 text-amber-800"
                                            : addr.type === "HOME"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-purple-100 text-purple-800"
                                        }`}>
                                          {addr.type}
                                        </span>
                                        {addr.isPrimary && (
                                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                            PRIMARY PROFILE ADDRESS
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {[addr.flat, addr.locality, addr.city, addr.state].filter(Boolean).join(", ")} - <strong className="text-slate-900">{addr.pincode}</strong>
                                      </p>

                                      <p className="text-[11px] text-slate-500 font-semibold mt-1.5 flex items-center gap-1">
                                        📞 Contact: {addr.phone}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                    title="Delete address"
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* --- ADD NEW ADDRESS VIEW (Image 2) --- */
                      <div className="space-y-3.5">
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewAddress(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Saved Addresses
                          </button>
                        )}

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            RECEIVER NAME <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.name}
                            onChange={e => setNewAddr(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Receiver Name"
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            10-DIGIT MOBILE NUMBER <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={newAddr.phone}
                            onChange={e => setNewAddr(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                            placeholder="Mobile Number"
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            PINCODE <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={newAddr.pincode}
                            onChange={e => setNewAddr(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                            placeholder="6-Digit Pincode"
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            LOCALITY / SECTOR <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.locality}
                            onChange={e => setNewAddr(prev => ({ ...prev, locality: e.target.value }))}
                            placeholder="Locality / Area"
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            FLAT / HOUSE NO / STREET ADDRESS <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.flat}
                            onChange={e => setNewAddr(prev => ({ ...prev, flat: e.target.value }))}
                            placeholder="Building / House No, Street Name"
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            CITY <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.city}
                            onChange={e => setNewAddr(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                            STATE <span className="text-amber-500">*</span>
                          </label>
                          <select
                            value={newAddr.state}
                            onChange={e => setNewAddr(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-4 py-2.5 text-xs font-semibold border-2 border-slate-200/90 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
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
                          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            SAVE ADDRESS AS <span className="text-amber-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {(["Home", "Work", "Other"] as const).map(tag => {
                              const isSelected = newAddr.type === tag.toUpperCase();
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setNewAddr(prev => ({ ...prev, type: tag.toUpperCase() as any }))}
                                  className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                                    isSelected
                                      ? "bg-[#ffb703] border-[#ffb703] text-slate-950 shadow-xs"
                                      : "bg-slate-50 border-slate-200/90 text-slate-650 hover:bg-slate-100"
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Price Summary Box (from Image 1) */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/70 text-xs font-bold space-y-2 mt-4">
                      <div className="flex justify-between text-slate-650">
                        <span>Selected Items ({cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)}):</span>
                        <span className="text-slate-900 font-extrabold">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-650">
                        <span>Delivery Charge:</span>
                        <span className="text-emerald-600 font-black tracking-wide">FREE EXPRESS</span>
                      </div>
                      <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center text-sm">
                        <span className="text-slate-800 font-black tracking-wider uppercase">AMOUNT PAYABLE:</span>
                        <span className="text-base font-black text-[#ff3b30]">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Footer Navigation Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutOpen(false)}
                        className="text-xs font-black text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
                      >
                        ← BACK TO CART
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        className="bg-[#0b192e] hover:bg-slate-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
                      >
                        PROCEED TO PAYMENT <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 2: CASH ON DELIVERY & CONFIRMATION ================= */}
                {checkoutStep === 2 && (
                  <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Selected Address Preview */}
                    {(() => {
                      const active = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0] || newAddr;
                      return (
                        <div className="p-4 rounded-2xl border-2 border-amber-400/80 bg-amber-50/20 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                              DELIVERING TO
                            </span>
                            <button
                              type="button"
                              onClick={() => setCheckoutStep(1)}
                              className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Change Address
                            </button>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900">{active.name}</h4>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {[active.flat, active.locality, active.city, active.state].filter(Boolean).join(", ")} - <strong className="text-slate-900">{active.pincode}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">
                            📞 Contact: {active.phone}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Service Type Selection */}
                    <div className="space-y-2 text-left">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Service Type</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setCheckoutForm(prev => ({ ...prev, serviceType: "ONLY_PRODUCT_DELIVERY" }))}
                          className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            checkoutForm.serviceType === "ONLY_PRODUCT_DELIVERY"
                              ? "border-blue-600 bg-blue-50/40"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <h5 className="font-extrabold text-xs text-slate-900 uppercase">Only Product Delivery</h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">Fastest dispatch without setup.</p>
                        </div>

                        <div
                          onClick={() => setCheckoutForm(prev => ({ ...prev, serviceType: "DELIVERY_INSTALLATION" }))}
                          className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                            checkoutForm.serviceType === "DELIVERY_INSTALLATION"
                              ? "border-blue-600 bg-blue-50/40"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <h5 className="font-extrabold text-xs text-slate-900 uppercase">Delivery + Installation</h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">Expert technicians for site mounting.</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method - Solely Cash on Delivery */}
                    <div className="space-y-2 text-left">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Payment Method</label>
                      <div className="p-4 rounded-xl border-2 border-emerald-500/90 bg-emerald-50/40 text-left flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs text-slate-900 uppercase">Cash on Delivery</h4>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded">COD / CASH</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Pay upon delivery or completed installation.</p>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/70 text-xs font-bold space-y-2">
                      <div className="flex justify-between text-slate-650">
                        <span>Items Total:</span>
                        <span className="text-slate-900 font-extrabold">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-650">
                        <span>Delivery:</span>
                        <span className="text-emerald-600 font-black">FREE EXPRESS</span>
                      </div>
                      <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center text-sm">
                        <span className="text-slate-800 font-black uppercase">Total Amount to Pay:</span>
                        <span className="text-base font-black text-[#ff3b30]">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Step 2 Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(1)}
                        className="text-xs font-black text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
                      >
                        ← CHANGE ADDRESS
                      </button>
                      <Button
                        type="button"
                        onClick={() => handlePlaceOrder()}
                        disabled={placingOrder}
                        className="bg-[#ff3b30] hover:bg-red-700 text-white text-xs font-black px-6 py-3.5 rounded-xl shadow-md cursor-pointer transition-all"
                      >
                        {placingOrder ? "Placing Order..." : "Confirm & Place Order"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
