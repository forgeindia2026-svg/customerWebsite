import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag, CheckCircle2, X, MapPin } from "lucide-react";
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

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "", // Street Address
    state: "",
    zipcode: "",
    serviceType: "ONLY_PRODUCT_DELIVERY",
    paymentMethod: "RAZORPAY" // "RAZORPAY" | "COD"
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
              const house = addr.house_number || addr.building || "";
              const road = addr.road || "";
              const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
              const city = addr.city || addr.town || addr.village || "";

              let addressParts = [];
              if (house) addressParts.push(house);
              if (road) addressParts.push(road);
              if (suburb) addressParts.push(suburb);
              if (city) addressParts.push(city);

              const streetAddress = addressParts.length > 0 ? addressParts.join(", ") : city;
              const state = addr.state || "";
              const postcode = addr.postcode || "";

              setCheckoutForm((prev) => ({
                ...prev,
                address: streetAddress,
                state: state,
                zipcode: postcode,
              }));
            }
          })
          .catch((err) => {
            console.error("Geocoding failed:", err);
            setCheckoutForm((prev) => ({
              ...prev,
              address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
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
      window.location.href = "/login?redirect=cart";
      return;
    }

    const email = localStorage.getItem("user_email") || "";
    const name = localStorage.getItem("user_name") || "";
    const phone = localStorage.getItem("user_phone") || "";

    setCheckoutForm({
      name,
      email,
      phone,
      address: "",
      state: "",
      zipcode: "",
      serviceType: "ONLY_PRODUCT_DELIVERY",
      paymentMethod: "RAZORPAY"
    });
    setCheckoutError("");
    setCheckoutOpen(true);

    // Try to load cached profile address
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/profile?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const freshAddress = data.data.shippingAddress || data.data.address || "";
          setCheckoutForm(prev => ({ ...prev, address: freshAddress }));
        }
      })
      .catch(err => console.warn("Could not load address on checkout open:", err));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const isSubmittingRef = useRef(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.state || !checkoutForm.zipcode) {
      setCheckoutError("Please fill in all fields.");
      return;
    }

    if (isSubmittingRef.current || placingOrder) return;
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

    const fullAddress = `${checkoutForm.address}, ${checkoutForm.state} - ${checkoutForm.zipcode} [Service: ${checkoutForm.serviceType === 'DELIVERY_INSTALLATION' ? 'DELIVERY + INSTALLATION' : 'ONLY PRODUCT DELIVERY'}]`;

    try {
      // 1. Create Order in backend database
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: checkoutForm.name,
          customerEmail: checkoutForm.email,
          customerPhone: checkoutForm.phone,
          shippingAddress: fullAddress,
          items: orderItems,
          totalAmount: total,
          serviceType: checkoutForm.serviceType,
          paymentMethod: checkoutForm.paymentMethod,
        })
      });

      const data = await res.json();
      if (!data.success || !data.data) {
        setCheckoutError(data.message || "Failed to place order.");
        setPlacingOrder(false);
        return;
      }

      const createdOrder = data.data;

      // 2. If Razorpay Online Payment selected, launch Razorpay Gateway
      if (checkoutForm.paymentMethod === "RAZORPAY") {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setCheckoutError("Razorpay SDK failed to load. Please check your network.");
          setPlacingOrder(false);
          return;
        }

        const paymentRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/payments/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            orderId: createdOrder._id,
            notes: { orderNumber: createdOrder.orderNumber }
          })
        });
        const paymentOrderData = await paymentRes.json();

        if (paymentOrderData.success && paymentOrderData.order) {
          const options = {
            key: paymentOrderData.key,
            amount: paymentOrderData.order.amount,
            currency: paymentOrderData.order.currency || "INR",
            name: "SK Technology CCTV Solutions",
            description: `Payment for Order #${createdOrder.orderNumber}`,
            order_id: paymentOrderData.order.id,
            handler: async (response: any) => {
              // Verify Payment Signature on Backend
              await fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/payments/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: createdOrder._id,
                  paymentMethod: "Razorpay Online (UPI/Card)"
                })
              });

              createdOrder.paymentStatus = "PAID";
              setOrderSuccess(createdOrder);
              localStorage.removeItem("shopping_cart");
              window.dispatchEvent(new Event("cart-updated"));
              setPlacingOrder(false);
            },
            prefill: {
              name: checkoutForm.name,
              email: checkoutForm.email,
              contact: checkoutForm.phone,
            },
            theme: {
              color: "#ff3b30"
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (resp: any) {
            setCheckoutError(`Payment Failed: ${resp.error.description || 'Transaction cancelled'}`);
            setPlacingOrder(false);
            isSubmittingRef.current = false;
          });
          rzp.open();
          return;
        }
      }

      // COD or Fallback Success
      setOrderSuccess(createdOrder);
      localStorage.removeItem("shopping_cart");
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err: any) {
      setCheckoutError(err.message || "An error occurred. Please try again.");
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
                  <Link to="/dashboard">
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
              <form onSubmit={handlePlaceOrder}>
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Checkout Details</h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {checkoutError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold">
                      {checkoutError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.name}
                      onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={checkoutForm.email}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-150 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={checkoutForm.phone}
                      onChange={e => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900"
                    />
                  </div>

                  {/* Street Address */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Street Address</label>
                      <button
                        type="button"
                        onClick={handleFetchLocation}
                        disabled={fetchingLocation}
                        className="text-[10px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>{fetchingLocation ? "Fetching..." : "Fetch Live Location"}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-450">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Street, locality, area name..."
                        value={checkoutForm.address}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* State & Zipcode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">State</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tamil Nadu"
                        value={checkoutForm.state}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Zipcode</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 600001"
                        value={checkoutForm.zipcode}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, zipcode: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white text-gray-900 shadow-2xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Service Type Selection Cards */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Service Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Only Product Delivery */}
                      <div
                        onClick={() => setCheckoutForm(prev => ({ ...prev, serviceType: "ONLY_PRODUCT_DELIVERY" }))}
                        className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          checkoutForm.serviceType === "ONLY_PRODUCT_DELIVERY"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                            : "border-gray-200/80 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <h4 className="font-extrabold text-xs text-gray-900 uppercase">Only Product Delivery</h4>
                        <p className="text-[10px] text-gray-500 mt-1">Fastest dispatch without setup.</p>
                      </div>

                      {/* Delivery + Installation */}
                      <div
                        onClick={() => setCheckoutForm(prev => ({ ...prev, serviceType: "DELIVERY_INSTALLATION" }))}
                        className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          checkoutForm.serviceType === "DELIVERY_INSTALLATION"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                            : "border-gray-200/80 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <h4 className="font-extrabold text-xs text-gray-900 uppercase">Delivery + Installation</h4>
                        <p className="text-[10px] text-gray-500 mt-1">Verified technicians for expert setup.</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Method</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "RAZORPAY" }))}
                        className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          checkoutForm.paymentMethod === "RAZORPAY"
                            ? "border-[#ff3b30] bg-red-50/40 dark:bg-red-950/20"
                            : "border-gray-200/80 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-gray-900 uppercase">Razorpay Online</h4>
                          <span className="text-[9px] bg-red-100 text-[#ff3b30] font-black px-1.5 py-0.5 rounded">UPI / CARDS</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Instant digital payment with warranty lock.</p>
                      </div>

                      <div
                        onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: "COD" }))}
                        className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          checkoutForm.paymentMethod === "COD"
                            ? "border-[#ff3b30] bg-red-50/40 dark:bg-red-950/20"
                            : "border-gray-200/80 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-gray-900 uppercase">Pay After Service</h4>
                          <span className="text-[9px] bg-gray-100 text-gray-600 font-black px-1.5 py-0.5 rounded">COD / CASH</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Pay upon delivery or completed installation.</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary inside modal */}
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>Total Amount to Pay</span>
                      <span className="text-sm font-black text-gray-900">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 bg-gray-50 dark:bg-slate-900/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCheckoutOpen(false)}
                    className="border-gray-200 text-gray-650 hover:bg-gray-100 text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={placingOrder}
                    className="bg-[#ff3b30] hover:bg-red-700 text-white text-xs font-bold px-6 py-2 rounded-xl"
                  >
                    {placingOrder ? "Placing Order..." : "Confirm & Place Order"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
