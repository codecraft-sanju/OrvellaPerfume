import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  motion, 
  useTransform, 
  useScroll,
  AnimatePresence,
  useMotionValue,
  useSpring
} from "framer-motion";
import { 
  ShoppingBag, Menu, X, Star, ShieldCheck, Truck, 
  Instagram, Twitter, Facebook, Plus, Minus, Trash2, LogOut, ArrowRight,
  CreditCard, Banknote, Loader2, CheckCircle2
} from "lucide-react";

// --- SIBLING IMPORT ---
import { useShop } from "./ShopContext"; 

// ==========================================
// 1. COMPONENT: CINEMATIC NOISE OVERLAY
// ==========================================
const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-overlay">
    <svg className="w-full h-full">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

// ==========================================
// 2. COMPONENT: MAGNETIC CUSTOM CURSOR
// ==========================================
const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a') || target.closest('.clickable')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener("mousemove", mouseMove);
    return () => window.removeEventListener("mousemove", mouseMove);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#D4AF37] pointer-events-none z-[9999] hidden md:flex items-center justify-center mix-blend-difference"
      animate={{
        x: mousePos.x - 16,
        y: mousePos.y - 16,
        scale: isHovering ? 2 : 1,
        backgroundColor: isHovering ? "#D4AF37" : "transparent",
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    />
  );
};

// ==========================================
// 3. COMPONENT: ANIMATED TITLE
// ==========================================
const AnimatedTitle = ({ text, className }) => {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 50, transition: { type: "spring", damping: 12, stiffness: 100 } },
  };

  return (
    <motion.h1 
      variants={container} 
      initial="hidden" 
      animate="visible" 
      className={`flex flex-wrap ${className}`}
    >
      {words.map((word, index) => (
        <motion.div 
          key={index} 
          className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0"
          variants={container}
        >
          {Array.from(word).map((letter, i) => (
            <motion.span variants={child} key={i} className="inline-block">
              {letter}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </motion.h1>
  );
};

// ==========================================
// 4. COMPONENT: SCROLL REVEAL WRAPPER
// ==========================================
const RevealOnScroll = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

// ==========================================
// 5. COMPONENT: 3D TILT CARD
// ==========================================
const TiltCard = ({ children }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]));
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]));

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 200);
    y.set(yPct * 200);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-full h-full flex items-center justify-center perspective-1000 group"
    >
      <div className="absolute inset-0 bg-[#D4AF37]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      {children}
    </motion.div>
  );
};

// ==========================================
// 6. COMPONENT: CHECKOUT MODAL (NEW)
// ==========================================
const CheckoutModal = ({ cart, subtotal, onClose, onConfirmOrder }) => {
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  const [isProcessing, setIsProcessing] = useState(false);
  
  const COD_FEE = 50;
  const finalTotal = paymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    // Simulate API call / Payment Gateway
    setTimeout(() => {
        setIsProcessing(false);
        onConfirmOrder(paymentMethod);
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 bg-[#0a0a0a] border border-[#D4AF37]/30 w-full max-w-2xl rounded-sm overflow-hidden flex flex-col md:flex-row shadow-[0_0_80px_rgba(212,175,55,0.2)]"
      >
        {isProcessing ? (
             <div className="w-full h-[500px] flex flex-col items-center justify-center p-12 text-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                >
                    <Loader2 size={64} className="text-[#D4AF37]" />
                </motion.div>
                <h3 className="text-2xl font-serif text-white mb-2">Processing Payment</h3>
                <p className="text-gray-400 text-sm tracking-widest uppercase">
                    {paymentMethod === 'online' ? "Connecting to Gateway..." : "Confirming Order..."}
                </p>
             </div>
        ) : (
            <>
                {/* Left Side: Order Summary */}
                <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/10 bg-[#050505]">
                    <h3 className="text-[#D4AF37] font-serif text-xl mb-6 tracking-wide">Order Summary</h3>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {cart.map((item) => (
                            <div key={item._id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{item.name} <span className="text-gray-500">x{item.qty}</span></span>
                                <span className="text-white font-mono">₹{item.price * item.qty}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Shipping</span>
                            <span className="text-green-500">FREE</span>
                        </div>
                        {paymentMethod === 'cod' && (
                             <motion.div 
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="flex justify-between text-[#D4AF37]"
                             >
                                <span>COD Fee</span>
                                <span>+₹{COD_FEE}</span>
                             </motion.div>
                        )}
                        <div className="flex justify-between text-white text-lg font-bold border-t border-white/10 pt-4 mt-2">
                            <span>Total</span>
                            <span>₹{finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Method */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-serif text-xl">Payment Method</h3>
                            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            {/* Option 1: Online */}
                            <label 
                                className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all duration-300 clickable ${
                                    paymentMethod === 'online' 
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                                    : 'border-white/10 hover:border-white/30'
                                }`}
                                onClick={() => setPaymentMethod('online')}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                    {paymentMethod === 'online' && <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-sm">Online Payment</span>
                                        <CreditCard size={18} className="text-gray-400"/>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">UPI, Credit Card, Net Banking</p>
                                </div>
                            </label>

                            {/* Option 2: COD */}
                            <label 
                                className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all duration-300 clickable ${
                                    paymentMethod === 'cod' 
                                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                                    : 'border-white/10 hover:border-white/30'
                                }`}
                                onClick={() => setPaymentMethod('cod')}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                    {paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-sm">Cash on Delivery</span>
                                        <Banknote size={18} className="text-gray-400"/>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Pay with cash upon arrival (+₹50)</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick={handlePlaceOrder}
                        className="mt-8 w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                        {paymentMethod === 'online' ? `Pay ₹${finalTotal}` : `Place Order ₹${finalTotal}`}
                    </button>
                </div>
            </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// 7. COMPONENT: ULTIMATE SUCCESS MODAL (UPDATED)
// ==========================================
const OrderSuccessModal = ({ onClose, onContinueShopping, orderDetails }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.5, opacity: 0, y: 50 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
        className="relative z-10 bg-[#0a0a0a] border border-[#D4AF37] w-full max-w-md rounded-lg p-10 text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] overflow-hidden"
      >
        {/* Animated Background Rays */}
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0%,_#D4AF3710_25%,_transparent_50%,_#D4AF3710_75%,_transparent_100%)] animate-[spin_10s_linear_infinite] opacity-50" />

        {/* --- THE CINEMATIC TICK ANIMATION --- */}
        <div className="relative mb-8 flex justify-center items-center">
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.2 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute w-32 h-32 rounded-full bg-[#D4AF37] blur-xl"
            />
            
            <svg width="120" height="120" viewBox="0 0 100 100" className="relative z-10">
                <motion.circle 
                    cx="50" cy="50" r="45" 
                    fill="none" stroke="#D4AF37" strokeWidth="2"
                    initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                    animate={{ pathLength: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                <motion.path 
                    d="M30 52 L43 65 L70 35" 
                    fill="none" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
                />
            </svg>
        </div>

        <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="text-3xl font-serif text-white mb-2 tracking-wide uppercase"
        >
            Order Placed
        </motion.h2>
        
        <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-gray-400 text-sm mb-6 leading-relaxed font-light"
        >
            Your legacy has been secured. <br/>
            Payment Mode: <span className="text-white font-bold">{orderDetails?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
        </motion.p>

        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 mb-8 rounded"
        >
             <p className="text-[#D4AF37] font-mono text-xs">ID: #ORV-{Math.floor(1000 + Math.random() * 9000)}</p>
        </motion.div>

        <motion.button 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            onClick={onContinueShopping} 
            className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        >
            Continue Shopping
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function Home() {
  const { 
    products, addToCart, cart, isCartOpen, setIsCartOpen, 
    removeFromCart, updateQty, cartTotal, cartCount, notification,
    loading, user, logout,
    showOrderSuccess, setShowOrderSuccess
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  
  // --- NEW STATE FOR CHECKOUT ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState(null);

  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  // Parallax Values
  const yHeroText = useTransform(scrollY, [0, 500], [0, 150]);
  const yHeroImage = useTransform(scrollY, [0, 500], [0, -50]);

  // Smooth Scroll Listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Body Scroll Lock & Back Button Handling
  useEffect(() => {
    // 1. Lock Body Scroll
    if (mobileMenuOpen || showOrderSuccess || selectedProduct || isCheckoutOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }

    // 2. Handle Browser Back Button (Mobile/Desktop)
    const handlePopState = (event) => {
        if (showOrderSuccess) {
            event.preventDefault();
            setShowOrderSuccess(false);
        } else if (isCheckoutOpen) {
            event.preventDefault();
            setIsCheckoutOpen(false);
        } else if (selectedProduct) {
            event.preventDefault();
            setSelectedProduct(null);
        } else if (mobileMenuOpen) {
            event.preventDefault();
            setMobileMenuOpen(false);
        }
    };

    if (showOrderSuccess || selectedProduct || mobileMenuOpen || isCheckoutOpen) {
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', handlePopState);
    }

    return () => {
        window.removeEventListener('popstate', handlePopState);
        document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, showOrderSuccess, selectedProduct, isCheckoutOpen, setShowOrderSuccess]);

  const DEFAULT_PRODUCT = {
    _id: "orvella-golden-root-main", 
    name: "Orvella The Golden Root",
    price: 5999, 
    description: "Crafted with a secret chemical formula for the elite. A scent that doesn't just linger, it commands attention. Experience the scent that defines luxury.",
    images: [{ url: "/orvella.jpeg" }], 
    category: "Signature Scent",
    stock: 100, 
    tag: "Premium Edition"
  };

  const heroProduct = products.length > 0 ? products[0] : DEFAULT_PRODUCT;

  const handleBuy = (product) => {
    if (product._id === "orvella-golden-root-main") {
        alert("⚠️ SYSTEM NOTICE: DATABASE IS EMPTY\n\nAdmin ne abhi tak product database me add nahi kiya hai.");
        return; 
    }
    if (product) {
      addToCart(product);
      setIsCartOpen(true); 
      setSelectedProduct(null); 
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // --- NEW: HANDLE CHECKOUT & SUCCESS ---
  const handleInitiateCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleConfirmOrder = (method) => {
    setIsCheckoutOpen(false);
    setLastOrderDetails({ method }); // Save detail for success modal
    setShowOrderSuccess(true);
    // Note: Ideally, call clearCart() here from your Context if available
  };

  const handleContinueShopping = () => {
    setShowOrderSuccess(false);
    setLastOrderDetails(null);
    setTimeout(() => {
        scrollToSection('details');
    }, 300);
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center overflow-hidden">
        <NoiseOverlay />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
          className="text-[#D4AF37] font-serif text-5xl md:text-7xl tracking-widest font-bold z-10"
        >
          ORVELLA
        </motion.div>
        <motion.div 
          initial={{ width: 0 }} animate={{ width: 250 }} 
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-[1px] bg-[#D4AF37] mt-6 z-10"
        />
        <p className="text-gray-500 mt-4 text-xs tracking-[0.5em] uppercase animate-pulse z-10">Initializing Luxury</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden cursor-none-md">
      
      {/* GLOBAL EFFECTS */}
      <NoiseOverlay />
      <CustomCursor />

      {/* --- TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[130] bg-[#D4AF37] text-black px-8 py-3 rounded-b-lg font-bold shadow-[0_0_30px_rgba(212,175,55,0.4)] backdrop-blur-md"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHECKOUT MODAL (NEW) --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
            <CheckoutModal 
                cart={cart}
                subtotal={cartTotal}
                onClose={() => setIsCheckoutOpen(false)}
                onConfirmOrder={handleConfirmOrder}
            />
        )}
      </AnimatePresence>

      {/* --- ORDER SUCCESS MODAL --- */}
      <AnimatePresence>
        {showOrderSuccess && (
            <OrderSuccessModal 
                onClose={() => setShowOrderSuccess(false)} 
                onContinueShopping={handleContinueShopping}
                orderDetails={lastOrderDetails}
            />
        )}
      </AnimatePresence>

      {/* --- CART DRAWER --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-l border-[#D4AF37]/20 z-[70] p-8 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <h2 className="text-2xl font-serif text-[#D4AF37]">Your Collection ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform duration-300"><X className="text-white hover:text-[#D4AF37]" /></button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <ShoppingBag size={48} className="mb-4 opacity-20" />
                  <p>Your bag is empty.</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 text-[#D4AF37] hover:underline uppercase tracking-widest text-xs">Start Shopping</button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item._id} className="flex gap-4 border-b border-white/5 pb-6 group">
                      <img 
                        src={item.images && item.images[0] ? item.images[0].url : "/orvella.jpeg"} 
                        alt={item.name} 
                        className="w-20 h-24 object-cover rounded bg-[#050505] border border-white/5" 
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-lg text-white group-hover:text-[#D4AF37] transition-colors">{item.name}</h4>
                          <button onClick={() => removeFromCart(item._id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        <p className="text-[#D4AF37] text-sm mt-1 font-mono">₹{item.price}</p>
                        <div className="flex items-center gap-4 mt-4 bg-white/5 w-max px-2 py-1 rounded-full">
                          <button onClick={() => updateQty(item._id, -1)} className="p-1 hover:text-[#D4AF37] transition-colors"><Minus size={14}/></button>
                          <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, 1)} className="p-1 hover:text-[#D4AF37] transition-colors"><Plus size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex justify-between text-xl font-serif mb-6">
                  <span>Subtotal</span>
                  <span className="text-[#D4AF37]">₹{cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleInitiateCheckout}
                  className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- PRODUCT DETAIL MODAL --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="relative bg-[#0a0a0a] border border-[#D4AF37]/30 max-w-5xl w-full rounded-sm overflow-hidden grid md:grid-cols-2 shadow-[0_0_100px_rgba(212,175,55,0.15)] z-[90]"
            >
              <div className="h-[400px] md:h-[600px] bg-[#050505] p-8 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                 <img 
                   src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].url : "/orvella.jpeg"} 
                   alt={selectedProduct.name} 
                   className="h-[80%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-10" 
                 />
              </div>
              <div className="p-10 md:p-16 flex flex-col justify-center relative">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white hover:rotate-90 transition-all"><X size={24} /></button>
                <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} delay={0.2} className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-4">{selectedProduct.tag || "Premium Edition"}</motion.span>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} delay={0.3} className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">{selectedProduct.name}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} delay={0.4} className="text-gray-400 leading-relaxed mb-8 text-sm md:text-base border-l-2 border-[#D4AF37]/30 pl-6">{selectedProduct.description}</motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} delay={0.5} className="text-3xl text-[#D4AF37] font-serif mb-10">₹{selectedProduct.price}</motion.div>
                <motion.button 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} delay={0.6}
                  onClick={() => handleBuy(selectedProduct)}
                  className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-all duration-300"
                >
                  Add to Collection
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- NAVBAR --- */}
      <nav 
        className={`fixed w-full z-[300] top-0 transition-all duration-500 ${
          // SIBLING LOGIC FIX: When menu is open, make navbar transparent to let overlay shine through, 
          // but because z-index is higher, buttons remain visible on top.
          mobileMenuOpen 
            ? "bg-transparent py-4" 
            : isScrolled 
              ? "bg-[#050505]/80 backdrop-blur-lg border-b border-white/5 py-4" 
              : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="text-2xl md:text-3xl font-serif font-bold text-[#D4AF37] tracking-[0.2em] hover:text-white transition-colors relative z-[301]">
            ORVELLA
          </Link>
          
          <div className="hidden md:flex items-center space-x-12 text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#D4AF37] transition-colors hover:scale-110 transform duration-300">Home</button>
            <button onClick={() => scrollToSection('details')} className="hover:text-[#D4AF37] transition-colors hover:scale-110 transform duration-300">The Scent</button>
            <button onClick={() => scrollToSection('offer')} className="hover:text-[#D4AF37] transition-colors hover:scale-110 transform duration-300">Offers</button>
          </div>
          
          <div className="flex items-center space-x-8 relative z-[301]">
             {user ? (
               <div className="hidden md:flex items-center gap-6">
                 {user.role === 'admin' ? (
                    <Link to="/admin" className="text-[#D4AF37] text-xs font-bold tracking-wider border border-[#D4AF37] px-4 py-2 hover:bg-[#D4AF37] hover:text-black transition-all">ADMIN</Link>
                 ) : (
                    <span className="text-white text-xs tracking-widest">HI, {user.name.split(' ')[0].toUpperCase()}</span>
                 )}
                 <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
               </div>
            ) : (
              <Link to="/auth" className="hidden md:block text-xs font-bold tracking-widest hover:text-[#D4AF37] transition-colors">LOGIN</Link>
            )}

            <button className="relative group" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag className="text-white group-hover:text-[#D4AF37] transition-colors duration-300" size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            
            {/* MOBILE TOGGLE (Increased Z-Index to stay above overlay) */}
            <button 
              className="md:hidden text-white hover:text-[#D4AF37] transition-colors z-[302] relative p-2" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {/* Added Gold color to X when menu is open so it's clearly visible against black overlay */}
              {mobileMenuOpen ? <X size={28} className="text-[#D4AF37]" /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE OVERLAY MENU (Moved outside Navbar for Perfect Positioning) --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-[#050505] z-[200] flex flex-col justify-center px-8 md:hidden overflow-hidden"
          >
            <NoiseOverlay />
            
            <div className="space-y-8 relative z-10">
              {[
                { l: "Home", action: () => { window.scrollTo({top:0, behavior:'smooth'}); setMobileMenuOpen(false); } },
                { l: "The Scent", action: () => scrollToSection('details') },
                { l: "Offers", action: () => scrollToSection('offer') },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                >
                  <button onClick={item.action} className="text-4xl font-serif text-white hover:text-[#D4AF37] transition-colors text-left w-full block">
                    {item.l}
                  </button>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-8 border-t border-white/10 mt-8">
                {user ? (
                    <div className="space-y-4">
                      <p className="text-[#D4AF37] text-xl font-serif">Welcome, {user.name}</p>
                      {user.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-white">Admin Dashboard</Link>}
                      <button onClick={() => {logout(); setMobileMenuOpen(false);}} className="text-red-500 text-lg">Logout</button>
                    </div>
                ) : (
                    <Link onClick={() => setMobileMenuOpen(false)} to="/auth" className="text-2xl font-serif text-white hover:text-[#D4AF37]">Login / Register</Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center w-full relative z-10">
          <motion.div style={{ y: yHeroText }} className="space-y-8 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 1.5 }}
              className="text-[#D4AF37] text-xs md:text-sm uppercase font-bold pl-1"
            >
              Premium Edition 2026
            </motion.div>
            
            <AnimatedTitle text="The Golden Root" className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-white leading-[1] md:leading-[0.9] justify-center md:justify-start" />
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }}
              className="text-gray-400 text-lg max-w-lg mx-auto md:mx-0 font-light leading-relaxed"
            >
              {heroProduct.description}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="pt-8 flex flex-col md:flex-row gap-6 justify-center md:justify-start"
            >
              <button 
                onClick={() => handleBuy(heroProduct)} 
                className="group px-10 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all duration-500 overflow-hidden relative"
              >
                <span className="relative z-10 group-hover:text-black transition-colors">Shop Now</span>
                <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out" />
              </button>
              
              <button 
                onClick={() => { if(heroProduct) setSelectedProduct(heroProduct); }} 
                className="px-10 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300 backdrop-blur-sm"
              >
                View Notes
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            style={{ y: yHeroImage }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative h-[500px] md:h-[800px] w-full flex justify-center items-center"
          >
             <TiltCard>
                <motion.img 
                  src={heroProduct.images[0].url} 
                  alt="Orvella Perfume Bottle" 
                  className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(212,175,55,0.15)] z-20"
                  animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                />
             </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* --- INFINITE BRAND TICKER --- */}
      <div className="py-8 bg-[#D4AF37] border-y border-white/10 overflow-hidden relative z-20">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: "-50%" }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="flex gap-16 text-black font-bold tracking-[0.2em] uppercase text-sm md:text-lg items-center"
          >
            {Array(10).fill(null).map((_, i) => (
              <React.Fragment key={i}>
                <span>Orvella • The Golden Root • Luxury Fragrance • Exclusive •</span>
                <Star size={18} fill="black" />
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- DETAILS SECTION --- */}
      <section id="details" className="py-32 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20 items-center">
                <RevealOnScroll>
                    <div className="relative bg-[#0a0a0a] p-16 border border-white/5 rounded-sm overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                      <div className="absolute top-4 left-4 border-t border-l border-[#D4AF37] w-8 h-8 transition-all group-hover:w-16 group-hover:h-16"/>
                      <div className="absolute bottom-4 right-4 border-b border-r border-[#D4AF37] w-8 h-8 transition-all group-hover:w-16 group-hover:h-16"/>
                      <img 
                          src={heroProduct.images[0].url} 
                          alt="Orvella Detail" 
                          className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                </RevealOnScroll>

                <div className="space-y-10">
                    <RevealOnScroll delay={0.2}>
                        <span className="text-[#D4AF37] uppercase tracking-[0.3em] font-bold text-xs flex items-center gap-4">
                          <span className="w-12 h-[1px] bg-[#D4AF37]"></span> The Masterpiece
                        </span>
                        <h2 className="mt-6 text-5xl md:text-6xl font-serif text-white">Unveiling The <br/> <span className="italic text-[#D4AF37]">Golden Root</span></h2>
                    </RevealOnScroll>
                    
                    <RevealOnScroll delay={0.3}>
                      <p className="text-gray-400 leading-loose text-lg">
                          {heroProduct.description}
                      </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.5}>
                      <div className="flex flex-col md:flex-row items-center gap-8 pt-4">
                          <div className="text-4xl text-[#D4AF37] font-serif">₹{heroProduct.price}</div>
                          <button 
                              onClick={() => handleBuy(heroProduct)}
                              className="w-full md:w-auto px-12 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2 group"
                          >
                              Add to Bag <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                          </button>
                      </div>
                    </RevealOnScroll>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-[#0a0a0a] border-t border-white/5 relative">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            {[
                { icon: <Star className="text-[#D4AF37]" size={32}/>, title: "Exquisite Scent", desc: "Rare ingredients blended to perfection." },
                { icon: <ShieldCheck className="text-[#D4AF37]" size={32}/>, title: "Certified Quality", desc: "Dermatologically tested and safe." },
                { icon: <Truck className="text-[#D4AF37]" size={32}/>, title: "Express Delivery", desc: "Secure shipping across India in 3 days." },
            ].map((f, idx) => (
                <RevealOnScroll key={idx} delay={idx * 0.1}>
                  <div className="p-12 border border-white/5 hover:border-[#D4AF37]/30 bg-[#050505] transition-all duration-500 group text-center hover:-translate-y-2">
                      <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-500 p-4 bg-white/5 rounded-full w-max mx-auto group-hover:bg-[#D4AF37]/10">{f.icon}</div>
                      <h3 className="text-xl font-serif text-white mb-3 group-hover:text-[#D4AF37] transition-colors">{f.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </RevealOnScroll>
            ))}
        </div>
      </section>

      {/* --- EXCLUSIVE OFFER --- */}
      <section id="offer" className="relative py-40 bg-[#050505] overflow-hidden">
        <div className="absolute inset-0 z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
            <RevealOnScroll>
              <div className="border border-[#D4AF37]/30 p-12 md:p-24 bg-[#050505]/60 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#D4AF37]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out" />
                  
                  <span className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold relative z-10">Limited Time Offer</span>
                  
                  <h2 className="mt-8 text-5xl md:text-7xl font-serif text-white leading-tight relative z-10">
                      Your First <span className="text-[#D4AF37] italic">Luxury</span>
                  </h2>
                  
                  <p className="mt-8 text-gray-400 max-w-lg mx-auto text-lg leading-relaxed relative z-10">
                      Use code <span className="text-white font-bold border-b border-[#D4AF37] mx-1">ORVELLA20</span> at checkout for an exclusive 20% discount on your first purchase.
                  </p>
                  
                  <button 
                    onClick={() => handleBuy(heroProduct)} 
                    className="mt-12 px-12 py-5 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-colors relative z-10"
                  >
                      Claim Offer
                  </button>
              </div>
            </RevealOnScroll>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#020202] border-t border-white/10 pt-32 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-16 mb-24">
                <div className="col-span-1 md:col-span-2 space-y-8">
                    <h2 className="text-4xl font-serif text-[#D4AF37] tracking-widest">ORVELLA</h2>
                    <p className="text-gray-500 max-w-sm leading-relaxed text-sm">
                        Orvella is more than a fragrance; it's an identity. The Golden Root is crafted for those who leave a mark without saying a word.
                    </p>
                    <div className="flex gap-6">
                        <Instagram className="text-gray-500 hover:text-[#D4AF37] cursor-pointer transition-colors hover:scale-110" size={20} />
                        <Twitter className="text-gray-500 hover:text-[#D4AF37] cursor-pointer transition-colors hover:scale-110" size={20} />
                        <Facebook className="text-gray-500 hover:text-[#D4AF37] cursor-pointer transition-colors hover:scale-110" size={20} />
                    </div>
                </div>
                
                <div className="space-y-8">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Menu</h4>
                    <ul className="space-y-4 text-gray-500 text-sm">
                        <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#D4AF37] transition-colors hover:pl-2 duration-300">Home</button></li>
                        <li><button onClick={() => scrollToSection('details')} className="hover:text-[#D4AF37] transition-colors hover:pl-2 duration-300">The Scent</button></li>
                        <li><button onClick={() => scrollToSection('offer')} className="hover:text-[#D4AF37] transition-colors hover:pl-2 duration-300">Offer</button></li>
                        <li><Link to="#" className="hover:text-[#D4AF37] transition-colors hover:pl-2 duration-300">Contact</Link></li>
                    </ul>
                </div>

                <div className="space-y-8">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Newsletter</h4>
                    <div className="flex flex-col gap-4">
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="bg-white/5 border border-white/10 px-4 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors text-xs placeholder:text-gray-600 tracking-wide"
                        />
                        <button className="bg-white/10 text-white px-4 py-4 hover:bg-[#D4AF37] hover:text-black transition-colors text-xs font-bold uppercase tracking-widest">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-700 font-mono">
                <p>&copy; 2026 Orvella. All Rights Reserved.</p>
                <div className="flex gap-8 mt-4 md:mt-0">
                    <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                    <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                    <Link to="/admin" className="hover:text-[#D4AF37] transition-colors">Admin</Link>
                </div>
            </div>
        </div>
      </footer>
    </main>
  );
}