import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Truck, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { useShop } from "./ShopContext";

export default function Checkout() {
  // Access Global Shop State
  const { cart, cartTotal, user, createOrder, loading: appLoading } = useShop();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Local loading state for form submission

  const [shippingInfo, setShippingInfo] = useState({
    address: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
    phoneNo: ""
  });

  // --- REDIRECT LOGIC ---
  useEffect(() => {
    // 1. Wait for global app loading to finish
    if (appLoading) return;

    // 2. If cart is empty, go back to Home
    if (cart.length === 0) {
        navigate("/");
    } 
    // 3. If not logged in, go to Auth
    else if (!user) {
        navigate("/auth");
    }
  }, [cart, user, navigate, appLoading]);

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Call the centralized order creation logic in Context
    await createOrder(shippingInfo, navigate);
    setLoading(false);
  };

  // --- CALCULATIONS ---
  // 18% Luxury Tax/GST
  const taxPrice = cartTotal * 0.18;
  // Free shipping for single luxury item (usually > 5000), else 200
  const shippingPrice = cartTotal > 5000 ? 0 : 200; 
  const finalTotal = cartTotal + taxPrice + shippingPrice;

  // --- LOADING SPINNER (PRE-RENDER) ---
  if (appLoading) {
    return (
        <div className="min-h-screen bg-[#050505] flex justify-center items-center">
            <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#D4AF37] selection:text-black flex justify-center items-center p-4 md:p-8">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16"
      >
        
        {/* --- LEFT COLUMN: SHIPPING FORM --- */}
        <div className="space-y-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Return to The Scent
            </button>
            
            <div>
                <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">Secure Checkout</h1>
                <p className="text-gray-500">Enter delivery details for your Orvella Edition.</p>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="uppercase text-xs font-bold text-[#D4AF37] tracking-widest">Street Address</label>
                    <input 
                        required type="text" placeholder="House No, Building, Street" 
                        value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        className="w-full bg-[#121212] border border-white/10 p-4 rounded text-white focus:border-[#D4AF37] outline-none transition-colors"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="uppercase text-xs font-bold text-gray-500 tracking-widest">City</label>
                        <input 
                            required type="text" placeholder="Mumbai"
                            value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                            className="w-full bg-[#121212] border border-white/10 p-4 rounded text-white focus:border-[#D4AF37] outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="uppercase text-xs font-bold text-gray-500 tracking-widest">State</label>
                        <input 
                            required type="text" placeholder="Maharashtra"
                            value={shippingInfo.state} onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                            className="w-full bg-[#121212] border border-white/10 p-4 rounded text-white focus:border-[#D4AF37] outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="uppercase text-xs font-bold text-gray-500 tracking-widest">Pincode</label>
                        <input 
                            required type="number" placeholder="400001"
                            value={shippingInfo.pinCode} onChange={(e) => setShippingInfo({...shippingInfo, pinCode: e.target.value})}
                            className="w-full bg-[#121212] border border-white/10 p-4 rounded text-white focus:border-[#D4AF37] outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="uppercase text-xs font-bold text-gray-500 tracking-widest">Phone Number</label>
                        <input 
                            required type="number" placeholder="+91 98765 43210"
                            value={shippingInfo.phoneNo} onChange={(e) => setShippingInfo({...shippingInfo, phoneNo: e.target.value})}
                            className="w-full bg-[#121212] border border-white/10 p-4 rounded text-white focus:border-[#D4AF37] outline-none transition-colors"
                        />
                    </div>
                </div>
            </form>
        </div>

        {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
        <div className="bg-[#121212] p-8 md:p-12 rounded-xl border border-white/5 h-fit lg:sticky lg:top-8">
            <h2 className="text-xl font-serif text-white mb-8 border-b border-white/10 pb-4">Your Selection</h2>
            
            {/* Cart Items List */}
            <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                    <div key={item._id} className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-[#050505] rounded flex items-center justify-center border border-white/5">
                             <img 
                                src={item.images && item.images[0] ? item.images[0].url : "/orvella.jpeg"} 
                                alt={item.name} 
                                className="h-full object-contain p-1" 
                             />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-serif text-white text-lg">{item.name}</h4>
                            <p className="text-[#D4AF37] text-xs uppercase tracking-wider">Premium Edition</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-bold">₹{item.price * item.qty}</p>
                            <p className="text-gray-500 text-sm">Qty: {item.qty}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-white/10 pt-6 text-sm">
                <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span>GST (18%)</span>
                    <span>₹{taxPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className={shippingPrice === 0 ? "text-[#D4AF37]" : ""}>
                        {shippingPrice === 0 ? "Complimentary" : `₹${shippingPrice}`}
                    </span>
                </div>
                <div className="flex justify-between text-white text-xl font-serif pt-4 border-t border-white/10 mt-4">
                    <span>Total</span>
                    <span className="text-[#D4AF37]">₹{finalTotal.toLocaleString()}</span>
                </div>
            </div>

            {/* Submit Button */}
            <button 
                form="checkout-form"
                disabled={loading}
                className="w-full mt-8 bg-[#D4AF37] text-black font-bold py-4 uppercase tracking-widest hover:bg-white transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
                {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                {loading ? "Processing..." : "Confirm Order"}
            </button>

            {/* Trust Badges */}
            <div className="flex justify-center gap-6 mt-6 text-gray-600">
                <div className="flex items-center gap-2 text-xs uppercase"><Truck size={14}/> Fast Delivery</div>
                <div className="flex items-center gap-2 text-xs uppercase"><CheckCircle size={14}/> Secure Payment</div>
            </div>
        </div>

      </motion.div>
    </div>
  );
}