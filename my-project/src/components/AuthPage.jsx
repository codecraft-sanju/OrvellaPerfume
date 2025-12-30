import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios"; // Import Axios
import { 
  Mail, Lock, User, ArrowRight, Eye, EyeOff, 
  CheckCircle, AlertCircle, Loader2 
} from "lucide-react";
import { useShop } from "./ShopContext";

// --- API CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/v1`;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  // Destructure manualLogin to update global state instantly
  const { showNotification, manualLogin } = useShop(); 
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on typing
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation for Register
    if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }
    }

    try {
      const config = { 
          headers: { "Content-Type": "application/json" },
          withCredentials: true // CRITICAL: Allows browser to save the HTTPOnly Cookie
      };
      
      // Use API_URL from env
      const url = isLogin 
          ? `${API_URL}/login` 
          : `${API_URL}/register`;

      const { data } = await axios.post(url, formData, config);

      // Successful Request
      if (isLogin) {
          showNotification(`Welcome back, ${data.user.name}`);
          
          // --- KEY UPDATE: Update Context State Immediately ---
          manualLogin(data.user); 

          // Redirect based on role
          if (data.user.role === 'admin') {
              navigate("/admin");
          } else {
              navigate("/");
          }
      } else {
          showNotification("Account created successfully. Please login.");
          // Automatically switch to login view so they can sign in
          setIsLogin(true);
          setFormData({ ...formData, password: "", confirmPassword: "" });
      }

    } catch (err) {
      // Handle Backend Errors
      const message = err.response?.data?.message || "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Calc (Visual only)
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    if (pass.length > 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 100;
    if (pass.length > 6) return 60;
    return 30;
  };
  const strength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 z-10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 bg-[#121212]">
        
        {/* LEFT SIDE: Image/Brand */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-[#0a0a0a] relative overflow-hidden group">
            <img 
              src="/orvella.jpeg" 
              alt="Luxury" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[2s]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            
            <div className="relative z-10">
              <Link to="/" className="text-2xl font-serif font-bold text-[#D4AF37] tracking-widest">ORVELLA</Link>
            </div>

            <div className="relative z-10 space-y-4">
              <h2 className="text-4xl font-serif text-white leading-tight">
                {isLogin ? "Welcome Back to Luxury." : "Join the Elite Circle."}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Unlock exclusive access to "The Golden Root" and member-only drops.
              </p>
              
              {/* Reviews Ticker */}
              <div className="flex items-center gap-2 pt-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#0a0a0a]" />
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  <span className="text-white font-bold">5.0</span> from 2,000+ Reviews
                </div>
              </div>
            </div>
        </div>

        {/* RIGHT SIDE: Interactive Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative bg-[#121212]/80 backdrop-blur-xl">
          
          <div className="flex justify-end mb-8">
             <Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Skip to Store</Link>
          </div>

          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-serif text-white mb-2">{isLogin ? "Sign In" : "Create Account"}</h3>
              <p className="text-gray-500 text-sm">
                {isLogin ? "Enter your details to access your collection." : "Begin your journey with Orvella today."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Field (Register Only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs text-[#D4AF37] uppercase font-bold tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      placeholder="e.g. Sanjay Choudhary" 
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs text-[#D4AF37] uppercase font-bold tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="name@example.com" 
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-[#D4AF37] uppercase font-bold tracking-wider ml-1">Password</label>
                  {isLogin && <a href="#" className="text-[10px] text-gray-500 hover:text-white transition-colors">Forgot Password?</a>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 pl-12 pr-12 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength Meter (Register only) */}
                {!isLogin && formData.password && (
                  <div className="h-1 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${strength > 60 ? 'bg-green-500' : strength > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${strength}%` }} 
                    />
                  </div>
                )}
              </div>

              {/* Confirm Password (Register Only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs text-[#D4AF37] uppercase font-bold tracking-wider ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      placeholder="••••••••" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded p-3 flex items-center gap-2 text-red-400 text-xs"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button 
                disabled={isLoading}
                className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Sign In" : "Register Now")}
                {!isLoading && <ArrowRight size={18} />}
              </button>

              {/* Social Login (Visual) */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#121212] px-2 text-gray-500">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                  Apple
                </button>
              </div>

            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already a member?"}{" "}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(""); }} 
                  className="text-[#D4AF37] font-bold hover:underline underline-offset-4"
                >
                  {isLogin ? "Join Now" : "Sign In"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}