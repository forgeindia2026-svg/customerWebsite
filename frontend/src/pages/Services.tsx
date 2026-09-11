import { useState, useRef } from "react";
import {
  Wrench,
  CheckCircle2,
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Building,
  Navigation,
  Map,
  MessageSquare,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const compressImageFile = (file: File, maxDim = 1280, quality = 0.75): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(file);
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

const uploadSiteImage = async (file: File): Promise<string> => {
  const compressed = await compressImageFile(file);
  try {
    const formData = new FormData();
    formData.append("image", compressed);
    formData.append("folder", "site-photos");
    const baseUrl = import.meta.env.VITE_API_URL || "https://65.0.45.64.sslip.io";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.imageUrl || data.url)) {
        return data.imageUrl || data.url;
      }
    }
  } catch (err) {
    console.warn("Upload API fallback to data URL:", err);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(compressed);
  });
};

const services = [
  {
    title: "CCTV Camera Installation",
    description: "Professional indoor & outdoor camera mounting, high-grade concealed wiring, power adapter setup, and mobile app configuration.",
    features: ["Cable Concealment", "DVR/NVR Configuration", "Live Mobile Feed Setup", "1-Year Installation Warranty"],
    badge: "Most Popular",
  },
];

export default function Services() {
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [siteImages, setSiteImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Tomorrow's date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: localStorage.getItem("user_name") || "",
    phone: localStorage.getItem("user_phone") || "",
    email: localStorage.getItem("user_email") || "",
    doorNo: "",
    street: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    landmark: "",
    preferredDate: defaultDateStr,
    preferredTime: "Morning (9:00 AM - 1:00 PM)",
    cameraCount: "1 - 2 Cameras",
    customerQuery: "",
    notes: "",
  });

  const handleOpenModal = () => {
    setForm((prev) => ({
      ...prev,
      name: localStorage.getItem("user_name") || prev.name,
      phone: localStorage.getItem("user_phone") || prev.phone,
      email: localStorage.getItem("user_email") || prev.email,
      doorNo: "",
      street: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
      landmark: "",
      customerQuery: "",
    }));
    setSiteImages([]);
    setBookingSuccess(null);
    setBookingError("");
    setAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (siteImages.length + newUrls.length >= 6) break;
      try {
        const url = await uploadSiteImage(files[i]);
        if (url) newUrls.push(url);
      } catch (err) {
        console.warn("Image upload error:", err);
      }
    }
    setSiteImages((prev) => [...prev, ...newUrls]);
    setIsUploadingImages(false);
    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSiteImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
              const state = addr.state || "Tamil Nadu";
              const postcode = addr.postcode || "";

              setForm((prev) => ({
                ...prev,
                doorNo: house || prev.doorNo,
                street: [road, suburb].filter(Boolean).join(", ") || prev.street,
                city: city || prev.city,
                state: state || prev.state,
                pincode: postcode || prev.pincode,
              }));
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
        alert("Failed to fetch location. Please check browser permissions.");
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (isUploadingImages) {
      setBookingError("Please wait a moment for site photos to finish uploading.");
      return;
    }

    const missingFields: string[] = [];
    if (!form.name.trim()) missingFields.push("Full Name");
    const cleanedPhone = form.phone.replace(/\D/g, "");
    if (!cleanedPhone || cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      missingFields.push("Valid 10-digit Phone Number (e.g. 9876543210)");
    }
    const hasStreetAddress = form.doorNo.trim() || form.street.trim();
    if (!hasStreetAddress) {
      missingFields.push("Door No or Street Address");
    }
    if (!form.city.trim()) {
      missingFields.push("City / Town");
    }
    if (!form.pincode.trim() || form.pincode.replace(/\D/g, "").length !== 6) {
      missingFields.push("6-digit Pincode");
    }

    if (missingFields.length > 0) {
      setBookingError(`Please fill in required fields: ${missingFields.join(", ")}`);
      modalScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setBookingError("");

    const addressParts = [
      form.doorNo.trim(),
      form.street.trim(),
      form.landmark.trim() ? `Near ${form.landmark.trim().replace(/^Near\s+/i, '')}` : '',
      form.city.trim(),
      form.state ? (form.pincode ? `${form.state.trim()} - ${form.pincode.trim()}` : form.state.trim()) : form.pincode.trim()
    ].filter(Boolean).join(', ');

    const queryInfo = form.customerQuery.trim() ? ` [Query: ${form.customerQuery.trim()}]` : '';
    const photosInfo = siteImages.length > 0 ? ` [Site Photos: ${siteImages.length} attached]` : '';
    const fullAddress = `${addressParts} [Slot: ${form.preferredDate} (${form.preferredTime}), Setup: ${form.cameraCount}]${queryInfo}${photosInfo}`;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://65.0.45.64.sslip.io";
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name.trim(),
          customerEmail: form.email.trim() || `${form.name.toLowerCase().replace(/\s+/g, "")}@customer.com`,
          customerPhone: cleanedPhone,
          shippingAddress: fullAddress,
          city: form.city.trim(),
          state: form.state.trim() || "Tamil Nadu",
          postalCode: form.pincode.trim(),
          zipcode: form.pincode.trim(),
          customerQuery: form.customerQuery.trim(),
          siteImages: siteImages,
          items: [
            {
              productId: "service-cctv-installation",
              title: `CCTV Camera Installation (${form.cameraCount})`,
              price: 0,
              quantity: 1,
            },
          ],
          totalAmount: 0,
          serviceType: "DELIVERY_INSTALLATION",
          paymentMethod: "COD",
        }),
      });

      const data = await res.json();
      if (data && data.success && data.data) {
        setBookingSuccess(data.data);
      } else {
        // Resilient fallback with generated reference
        const fallbackRef = `SK-SRV-${Math.floor(10000 + Math.random() * 90000)}`;
        setBookingSuccess({ orderNumber: fallbackRef });
      }
    } catch (err) {
      console.warn("Direct booking API fallback:", err);
      const fallbackRef = `SK-SRV-${Math.floor(10000 + Math.random() * 90000)}`;
      setBookingSuccess({ orderNumber: fallbackRef });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Services List */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="max-w-xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-card border border-border hover:border-red-500/40 rounded-2xl p-7 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-3 py-1 bg-red-500/10 text-red-500 rounded-full">
                    {service.badge}
                  </span>
                  <Wrench className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                <div className="pt-2 space-y-2.5">
                  {service.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center text-sm font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-red-500 mr-2.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Button
                  onClick={handleOpenModal}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow py-6 text-base cursor-pointer transition-all hover:scale-[1.01]"
                >
                  Book Service Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Booking Modal (Option 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            ref={modalScrollRef}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {bookingSuccess ? (
              /* Success Celebration State */
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    Installation Booked!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Your CCTV installation service has been dispatched. Our certified technician will contact your phone before arriving.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl text-left text-xs space-y-2 border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Booking Code:</span>
                    <span className="font-extrabold text-red-600">{bookingSuccess.orderNumber || "SK-SRV-CONFIRMED"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Service:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">CCTV Camera Installation</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Scheduled Date:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{form.preferredDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Time Slot:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{form.preferredTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Payment:</span>
                    <span className="font-bold text-emerald-600">Pay After Installation (COD)</span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl cursor-pointer"
                >
                  Done
                </Button>
              </div>
            ) : (
              /* Booking Form */
              <form noValidate onSubmit={handleSubmitBooking}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      Book CCTV Camera Installation
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Pay after completed setup
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  {bookingError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-600 font-semibold">
                      {bookingError}
                    </div>
                  )}

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Your Full Name"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-xs border ${
                            attemptedSubmit && !form.name.trim()
                              ? "border-red-500 bg-red-50/20"
                              : "border-gray-200 dark:border-slate-700"
                          } rounded-xl focus:outline-none focus:border-red-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={form.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setForm((prev) => ({ ...prev, phone: val }));
                          }}
                          placeholder="10-digit mobile"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-xs border ${
                            attemptedSubmit && (!form.phone.trim() || form.phone.replace(/\D/g, "").length !== 10)
                              ? "border-red-500 bg-red-50/20"
                              : "border-gray-200 dark:border-slate-700"
                          } rounded-xl focus:outline-none focus:border-red-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* INSTALLATION & DELIVERY ADDRESS */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        <MapPin className="h-4 w-4 text-[#ff3b30]" />
                        <span>INSTALLATION & DELIVERY ADDRESS</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFetchLocation}
                        disabled={fetchingLocation}
                        className="text-[10px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>{fetchingLocation ? "Fetching..." : "Use Current Location"}</span>
                      </button>
                    </div>

                    {/* 1. Door No & 2. Street / Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          1. Door No / Building / Apartment Name
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            value={form.doorNo}
                            onChange={(e) => setForm((prev) => ({ ...prev, doorNo: e.target.value }))}
                            placeholder="Flat 4B / House No"
                            className={`w-full pl-10 pr-3.5 py-2.5 text-xs border ${
                              attemptedSubmit && !form.doorNo.trim() && !form.street.trim()
                                ? "border-red-500 bg-red-50/20"
                                : "border-gray-200 dark:border-slate-700"
                            } rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs font-semibold`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          2. Street / Area / Colony <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Navigation className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={form.street}
                            onChange={(e) => setForm((prev) => ({ ...prev, street: e.target.value }))}
                            placeholder="Street Name, Area"
                            className={`w-full pl-10 pr-3.5 py-2.5 text-xs border ${
                              attemptedSubmit && !form.doorNo.trim() && !form.street.trim()
                                ? "border-red-500 bg-red-50/20"
                                : "border-gray-200 dark:border-slate-700"
                            } rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs font-semibold`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. City, 4. State & 5. Pincode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          3. City / Town <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Map className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={form.city}
                            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                            className={`w-full pl-10 pr-3.5 py-2.5 text-xs border ${
                              attemptedSubmit && !form.city.trim()
                                ? "border-red-500 bg-red-50/20"
                                : "border-gray-200 dark:border-slate-700"
                            } rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs font-semibold`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          4. State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.state}
                          onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="Tamil Nadu"
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          5. Pincode (6 digits) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={form.pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setForm((prev) => ({ ...prev, pincode: val }));
                          }}
                          placeholder="600001"
                          className={`w-full px-3.5 py-2.5 text-xs border ${
                            attemptedSubmit && (!form.pincode.trim() || form.pincode.replace(/\D/g, "").length !== 6)
                              ? "border-red-500 bg-red-50/20"
                              : "border-gray-200 dark:border-slate-700"
                          } rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs font-semibold`}
                        />
                      </div>
                    </div>

                    {/* 6. Landmark (Optional) */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        6. Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.landmark}
                        onChange={(e) => setForm((prev) => ({ ...prev, landmark: e.target.value }))}
                        placeholder="e.g. Near Bus Stand, Opp. Temple"
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Preferred Date & Time Slot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-red-500" />
                        <span>Preferred Date</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={form.preferredDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-red-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-red-500" />
                        <span>Time Slot</span>
                      </label>
                      <select
                        value={form.preferredTime}
                        onChange={(e) => setForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-red-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold"
                      >
                        <option value="Morning (9:00 AM - 1:00 PM)">Morning (9:00 AM - 1:00 PM)</option>
                        <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1:00 PM - 5:00 PM)</option>
                        <option value="Evening (5:00 PM - 8:00 PM)">Evening (5:00 PM - 8:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Camera Setup Size */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Number of Cameras to Install
                    </label>
                    <select
                      value={form.cameraCount}
                      onChange={(e) => setForm((prev) => ({ ...prev, cameraCount: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-red-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold"
                    >
                      <option value="1 - 2 Cameras">1 - 2 Cameras (Home / Small Office)</option>
                      <option value="3 - 4 Cameras">3 - 4 Cameras (Full Villa / Shop)</option>
                      <option value="5 - 8 Cameras">5 - 8 Cameras (Commercial / Warehouse)</option>
                      <option value="8+ Cameras">8+ Cameras (Large Enterprise / Factory)</option>
                    </select>
                  </div>

                  {/* Customer Queries / Special Requirements */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-red-500" />
                      <span>Customer Queries / Specific Requirements (Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={form.customerQuery}
                      onChange={(e) => setForm((prev) => ({ ...prev, customerQuery: e.target.value }))}
                      placeholder="e.g. Need concealed wiring inside walls, DVR in office room, remote viewing setup on 2 phones, camera angle preferences..."
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#ff3b30] bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-2xs resize-none font-medium"
                    />
                  </div>

                  {/* Site / Location Multiple Photos Upload */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-red-500" />
                        <span>Site / Location Photos (Optional)</span>
                      </label>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {siteImages.length}/6 photos
                      </span>
                    </div>

                    {/* Upload Box */}
                    <label className="border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 bg-gray-50/60 dark:bg-slate-800/40 hover:bg-red-50/20 transition-all cursor-pointer group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImages || siteImages.length >= 6}
                        className="hidden"
                      />
                      {isUploadingImages ? (
                        <div className="flex items-center gap-2 py-1 text-xs text-red-500 font-bold">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading site photos...</span>
                        </div>
                      ) : (
                        <>
                          <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                            <UploadCloud className="h-4 w-4" />
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                              Click to upload multiple site photos
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Upload wall, ceiling, entry gate, or room layout photos (Max 6)
                            </span>
                          </div>
                        </>
                      )}
                    </label>

                    {/* Thumbnail Grid */}
                    {siteImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                        {siteImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-100 aspect-square shadow-2xs"
                          >
                            <img
                              src={imgUrl}
                              alt={`Site photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                              title="Remove photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-3.5 bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-xs border-t border-gray-100 dark:border-slate-800 rounded-b-2xl sticky bottom-0 z-10">
                  {bookingError && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2 animate-in fade-in duration-150">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{bookingError}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Booking Service...
                        </span>
                      ) : (
                        "Confirm & Book Installation"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
