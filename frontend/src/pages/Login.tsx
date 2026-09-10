import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin,
  Building,
  Navigation,
  Map,
  Eye, 
  EyeOff, 
  Shield, 
  Headphones, 
  Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SKLogo from "../components/layout/SKLogo";

// Custom SVG Illustration of Wall-Mounted Security Camera for Login Sidebar
function WallCameraIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-52 h-52 text-white drop-shadow-2xl opacity-90">
      {/* Bracket */}
      <path d="M35 75h18v45H35z" fill="#94a3b8" />
      <path d="M53 85h38v22H53z" fill="#64748b" />
      <path d="M85 96L102 113h18l-18-17z" fill="#475569" />
      {/* Joint */}
      <circle cx="95" cy="96" r="14" fill="#cbd5e1" />
      {/* Camera Body (angled) */}
      <g transform="rotate(22 95 96)">
        <rect x="85" y="65" width="82" height="46" rx="8" fill="white" />
        <path d="M85 65h10v46H85z" fill="#cbd5e1" />
        <rect x="162" y="63" width="10" height="50" rx="3" fill="#334155" />
        <ellipse cx="167" cy="88" rx="2" ry="16" fill="#38bdf8" />
        <path d="M75 60l98 6v5L75 67z" fill="#e2e8f0" />
        <path d="M90 65L72 48" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <circle cx="72" cy="48" r="4" fill="#64748b" />
      </g>
    </svg>
  );
}

// Custom SVG Mockup of CCTV Cameras & NVR for Registration Card
function CctvSystemIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-36 h-22 text-slate-700 drop-shadow-md">
      {/* NVR Box */}
      <rect x="15" y="80" width="150" height="24" rx="4" fill="#1e293b" />
      <circle cx="28" cy="92" r="3.5" fill="#10b981" />
      <circle cx="38" cy="92" r="3.5" fill="#3b82f6" />
      <rect x="115" y="88" width="38" height="8" rx="2" fill="#0f172a" />
      <line x1="52" y1="88" x2="52" y2="96" stroke="#475569" strokeWidth="2" />
      <line x1="57" y1="88" x2="57" y2="96" stroke="#475569" strokeWidth="2" />
      <line x1="62" y1="88" x2="62" y2="96" stroke="#475569" strokeWidth="2" />
      <line x1="67" y1="88" x2="67" y2="96" stroke="#475569" strokeWidth="2" />
      
      {/* Dome Camera */}
      <g transform="translate(25, 22)">
        <path d="M10 25h50l-4-8H14z" fill="#cbd5e1" />
        <path d="M14 25a21 21 0 0 0 42 0z" fill="#1e293b" fillOpacity="0.8" />
        <circle cx="35" cy="31" r="8" fill="black" />
        <circle cx="37" cy="29" r="2.5" fill="#38bdf8" />
      </g>

      {/* Bullet Camera 1 */}
      <g transform="translate(108, 12)">
        <path d="M45 42L32 28h8z" fill="#94a3b8" />
        <rect x="12" y="16" width="40" height="22" rx="3" transform="rotate(-15 12 16)" fill="white" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M8 12l42-11l2 4L8 18z" fill="#cbd5e1" />
        <rect x="10" y="20" width="5" height="21" transform="rotate(-15 10 20)" fill="#334155" />
      </g>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  
  // Flipkart-style 6 Address Fields
  const [doorNo, setDoorNo] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    if (isRegister) {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        setIsLoading(false);
        return;
      }
      if (!agreeToTerms) {
        setErrorMsg("You must agree to the Terms & Conditions and Privacy Policy");
        setIsLoading(false);
        return;
      }
    }

    const formattedAddress = [
      doorNo.trim(),
      street.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : "",
      city.trim(),
      stateName.trim() ? `${stateName.trim()} - ${pincode.trim()}` : pincode.trim()
    ].filter(Boolean).join(", ");

    const url = isRegister 
      ? `${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/register` 
      : `${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/auth/login`;

    const body = isRegister
      ? { 
          name, 
          email, 
          password, 
          role: "CUSTOMER", 
          phone: mobile, 
          address: formattedAddress,
          doorNo,
          street,
          city,
          state: stateName,
          pincode,
          landmark
        }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (data.success && data.data) {
        const userRole = data.data.role;
        localStorage.setItem("user_token", data.data.token);
        localStorage.setItem("user_role", userRole);
        localStorage.setItem("user_name", data.data.name);
        localStorage.setItem("user_email", data.data.email || "");
        localStorage.setItem("user_phone", data.data.phone || "");
        localStorage.setItem("user_address", data.data.address || formattedAddress || "");
        if (isRegister) {
          localStorage.setItem("user_door_no", doorNo);
          localStorage.setItem("user_street", street);
          localStorage.setItem("user_city", city);
          localStorage.setItem("user_state", stateName);
          localStorage.setItem("user_pincode", pincode);
          localStorage.setItem("user_landmark", landmark);
        }
        localStorage.setItem("user_amc_plan", data.data.amcPlan || "Gold AMC Plan");
        localStorage.setItem("user_amc_expires", data.data.amcExpires || "May 20, 2026");

        if (userRole === "ADMIN") {
          window.location.href = "http://localhost:5175/";
        } else if (userRole === "TECHNICIAN") {
          window.location.href = "http://localhost:5175/";
        } else {
          window.dispatchEvent(new Event("storage"));
          navigate("/dashboard");
        }
      } else {
        setErrorMsg(data.message || "Invalid credentials");
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to the authentication server. Please check if the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {isRegister ? (
        // ==================== REGISTRATION SCREEN ====================
        <div className="flex-grow flex items-center justify-center py-10 px-4">
          <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl shadow-xl p-6 sm:p-10 space-y-5">
            
            {/* Top Logo */}
            <div className="flex justify-start">
              <SKLogo variant="iconOnly" theme="original" iconClassName="h-16 w-auto" />
            </div>

            {/* Card Header with Side-by-Side Content */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1 pb-1 border-b border-slate-100/60">
              <div className="text-left space-y-1">
                <h2 className="text-2xl font-extrabold text-[#0f2942]">Create Your Account</h2>
                <p className="text-xs text-slate-500 font-medium">Join us and experience smarter security solutions.</p>
              </div>
              <div className="hidden sm:block">
                <CctvSystemIllustration />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form className="space-y-4 pt-1" onSubmit={handleLoginSubmit}>
              {/* Name & Mobile (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit Mobile Number"
                      className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {/* Delivery / Installation Address (Flipkart Standard) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 pb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>Installation & Delivery Address</span>
                </div>

                {/* 1. Door No / Building & 2. Street / Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      1. Door No / Building / Apartment Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={doorNo}
                        onChange={(e) => setDoorNo(e.target.value)}
                        placeholder="Flat 4B / House No"
                        className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      2. Street / Area / Colony <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street Name, Area"
                        className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. City, 4. State & 5. Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      3. City / Town <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Map className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      4. State <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium px-3.5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      5. Pincode (6 digits) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="600001"
                      className="h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium px-3.5"
                      required
                    />
                  </div>
                </div>

                {/* 6. Landmark (Optional) */}
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    6. Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Bus Stand, Opp. Temple"
                    className="h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium px-3.5"
                  />
                </div>
              </div>

              {/* Passwords (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="pl-10 pr-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="pl-10 pr-10 h-10 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-xs sm:text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#ff3b30] focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="agreeToTerms" className="text-xs text-slate-500 font-semibold select-none cursor-pointer">
                  I agree to the <span className="text-[#ff3b30] hover:underline">Terms & Conditions</span> and <span className="text-[#ff3b30] hover:underline">Privacy Policy</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#ff3b30] hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/10 transition-all cursor-pointer"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Footer switcher */}
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-100/60 text-xs">
              <p className="font-semibold text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg("");
                  }}
                  className="text-[#ff3b30] hover:text-red-750 hover:underline font-bold cursor-pointer"
                >
                  Login
                </button>
              </p>
            </div>

          </div>
        </div>
      ) : (
        // ==================== LOGIN SCREEN (SPLIT DESIGN) ====================
        <div className="flex-grow flex flex-col md:flex-row">
          
          {/* Left Sidebar (Desktop Only) */}
          <div className="hidden md:flex md:w-5/12 bg-[#0b0f19] flex-col justify-between p-12 relative overflow-hidden">
            {/* Dots background overlay */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* Modern house illustration bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-[48%] bg-cover bg-bottom opacity-50 mix-blend-lighten pointer-events-none scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80')`,
              }}
            />

            {/* Red/dark tint gradient to match the website theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f19] via-[#0b0f19]/80 to-[#0b0f19]/40 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Brand logo at top of sidebar */}
              <div className="flex justify-start text-white">
                <SKLogo variant="iconOnly" theme="light" iconClassName="h-15 w-auto" />
              </div>

              {/* Mounted Wall Camera SVG Illustration */}
              <div className="flex justify-center items-center my-auto py-8">
                <WallCameraIllustration />
              </div>

              {/* Sidebar bottom signature */}
              <div className="mt-auto pt-6 text-slate-400 text-xs font-semibold font-sans tracking-wide">
                <span>© 2026 SK Technology • Active Shield Security</span>
              </div>
            </div>
          </div>

          {/* Right Main Content (Login card & Footer Badges) */}
          <div className="flex-1 flex flex-col justify-between">
            
            {/* Card Content Area */}
            <div className="flex-grow flex items-center justify-center py-14 px-4 sm:px-6">
              <div className="w-full max-w-md bg-white border border-slate-100/80 rounded-3xl shadow-xl p-8 sm:p-10 space-y-6">
                
                 {/* Logo top */}
                <div className="flex justify-start">
                  <SKLogo variant="iconOnly" theme="original" iconClassName="h-18 w-auto" />
                </div>

                {/* Form Header */}
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-extrabold text-[#0f2942]">Welcome Back!</h2>
                  <p className="text-xs text-slate-500 font-semibold">Login to access your account and manage your security.</p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Login Form */}
                <form className="space-y-4 pt-1" onSubmit={handleLoginSubmit}>
                  {/* Email */}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="pl-11 h-12 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="pl-11 pr-11 h-12 bg-white border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus-visible:ring-red-500 focus-visible:border-red-500 text-sm font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox and Forgot Password Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#ff3b30] focus:ring-red-500 cursor-pointer"
                      />
                      <label htmlFor="rememberMe" className="text-slate-500 font-semibold select-none cursor-pointer">
                        Remember Me
                      </label>
                    </div>
                    <a href="#forgot" className="text-[#ff3b30] font-semibold hover:text-red-700 hover:underline">
                      Forgot Password?
                    </a>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#ff3b30] hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/10 transition-all cursor-pointer"
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>

                {/* Footer Switcher */}
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-100/60 text-xs">
                  <p className="font-semibold text-slate-500">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setErrorMsg("");
                      }}
                      className="text-[#ff3b30] hover:text-red-750 hover:underline font-bold cursor-pointer"
                    >
                      Register Now
                    </button>
                  </p>
                </div>

              </div>
            </div>

            {/* Bottom Trust Badges (Aligned at bottom of white right side) */}
            <div className="w-full bg-[#f8fafc] border-t border-slate-200/50 py-6 px-6 sm:px-12 mt-auto">
              <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto grid grid-cols-3 gap-2 sm:gap-6 text-center">
                {/* Badge 1 */}
                <div className="flex flex-col items-center gap-2 sm:gap-3.5">
                  <div className="p-2 sm:p-3 bg-red-50 text-red-500 rounded-full shrink-0 shadow-sm">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[9px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide leading-none">Secure & Reliable</h4>
                    <p className="hidden sm:block text-[10.5px] text-slate-500 font-semibold mt-1">Your data is safe with us</p>
                  </div>
                </div>
                {/* Badge 2 */}
                <div className="flex flex-col items-center gap-2 sm:gap-3.5">
                  <div className="p-2 sm:p-3 bg-red-50 text-red-500 rounded-full shrink-0 shadow-sm">
                    <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[9px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide leading-none">24/7 Support</h4>
                    <p className="hidden sm:block text-[10.5px] text-slate-500 font-semibold mt-1">We're always here to help you</p>
                  </div>
                </div>
                {/* Badge 3 */}
                <div className="flex flex-col items-center gap-2 sm:gap-3.5">
                  <div className="p-2 sm:p-3 bg-red-50 text-red-500 rounded-full shrink-0 shadow-sm">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h4 className="text-[9px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide leading-none">Trusted by 5000+</h4>
                    <p className="hidden sm:block text-[10.5px] text-slate-500 font-semibold mt-1">Customers across India</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
