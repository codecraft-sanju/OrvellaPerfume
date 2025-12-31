import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  motion, 
  useTransform, 
  AnimatePresence,
  useMotionValue,
  useSpring
} from "framer-motion";
import { 
  ShoppingBag, Menu, X, Star, ShieldCheck, Truck, 
  Instagram, Twitter, Facebook, Plus, Minus, Trash2, LogOut
} from "lucide-react";

// --- SIBLING IMPORT ---
import { useShop } from "./ShopContext"; 

// --- COMPONENT: 3D TILT CARD (Physics Effect) ---
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
      className="relative w-full h-full flex items-center justify-center perspective-1000"
    >
      {children}
    </motion.div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function Home() {
  // Destructure everything including 'loading' and 'user'
  const { 
    products, addToCart, cart, isCartOpen, setIsCartOpen, 
    removeFromCart, updateQty, cartTotal, cartCount, notification,
    loading, user, logout
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // For Modal
  const navigate = useNavigate();

  // Smooth Scroll Logic
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- HARDCODED REAL PRODUCT (DEFAULT) ---
  // Agar database empty hai, toh yeh REAL product use hoga.
  const DEFAULT_PRODUCT = {
    _id: "orvella-golden-root-main", // Static ID for cart logic
    name: "Orvella The Golden Root",
    price: 5999, // Aapka real price yahan set karein
    description: "Crafted with a secret chemical formula for the elite. A scent that doesn't just linger, it commands attention. Experience the scent that defines luxury.",
    images: [{ url: "/orvella.jpeg" }], // Ensure this image exists in public folder
    category: "Signature Scent",
    stock: 100, // Available stock
    tag: "Premium Edition"
  };

  // Determine Hero Product: 
  // Agar DB me product hai toh wo use karo, warna DEFAULT_PRODUCT use karo.
  const heroProduct = products.length > 0 ? products[0] : DEFAULT_PRODUCT;

  // --- LOGIC: Handle Buy Action ---
  const handleBuy = (product) => {
    console.log("Adding to cart:", product); 
    if (product) {
      addToCart(product);
      setIsCartOpen(true); // Open cart immediately
      setSelectedProduct(null); // Close modal
    }
  };

  // --- LOGIC: Scroll to Section ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // --- PRELOADER ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
          className="text-[#D4AF37] font-serif text-4xl tracking-widest font-bold"
        >
          ORVELLA
        </motion.div>
        <motion.div 
          initial={{ width: 0 }} animate={{ width: 200 }} 
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          className="h-[1px] bg-[#D4AF37] mt-4"
        />
        <p className="text-gray-500 mt-2 text-xs tracking-[0.3em] uppercase animate-pulse">Initializing Luxury</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      
      {/* --- TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-[#D4AF37] text-black px-8 py-3 rounded-b-lg font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CART DRAWER (SLIDE OVER) --- */}
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
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#121212] border-l border-white/10 z-[70] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif text-[#D4AF37]">Your Bag ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)}><X className="hover:text-[#D4AF37]" /></button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <ShoppingBag size={48} className="mb-4 opacity-20" />
                  <p>Your bag is empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    className="mt-4 text-[#D4AF37] hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {cart.map(item => (
                    <div key={item._id} className="flex gap-4 border-b border-white/5 pb-6">
                      <img 
                        src={item.images && item.images[0] ? item.images[0].url : "/orvella.jpeg"} 
                        alt={item.name} 
                        className="w-20 h-24 object-cover rounded bg-[#050505]" 
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-serif text-lg">{item.name}</h4>
                          <button onClick={() => removeFromCart(item._id)} className="text-gray-600 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        <p className="text-[#D4AF37] text-sm mt-1">₹{item.price}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <button onClick={() => updateQty(item._id, -1)} className="p-1 hover:text-[#D4AF37]"><Minus size={14}/></button>
                          <span className="text-sm font-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, 1)} className="p-1 hover:text-[#D4AF37]"><Plus size={14}/></button>
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
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/checkout");
                  }}
                  className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#121212] border border-[#D4AF37]/30 max-w-4xl w-full rounded-sm overflow-hidden grid md:grid-cols-2 shadow-[0_0_50px_rgba(212,175,55,0.1)]"
            >
              <div className="h-[400px] md:h-auto bg-[#050505] p-8 flex items-center justify-center">
                 <img 
                   src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].url : "/orvella.jpeg"} 
                   alt={selectedProduct.name} 
                   className="h-full object-contain drop-shadow-[0_10px_30px_rgba(212,175,55,0.2)]" 
                 />
              </div>
              <div className="p-10 flex flex-col justify-center">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
                <span className="text-[#D4AF37] uppercase tracking-widest text-xs font-bold mb-2">{selectedProduct.tag || "Premium Edition"}</span>
                <h2 className="text-4xl font-serif text-white mb-4">{selectedProduct.name}</h2>
                <p className="text-gray-400 leading-relaxed mb-8">{selectedProduct.description}</p>
                <div className="text-2xl text-[#D4AF37] font-serif mb-8">₹{selectedProduct.price}</div>
                
                {/* ACTION BUTTON */}
                <button 
                  onClick={() => handleBuy(selectedProduct)}
                  className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-colors"
                >
                  Add to Collection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 1. NAVBAR --- */}
      <nav 
        className={`fixed w-full z-50 top-0 transition-all duration-300 ${
          isScrolled ? "bg-[#050505]/90 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="text-2xl md:text-3xl font-serif font-bold text-[#D4AF37] tracking-widest hover:opacity-80 transition-opacity">
            ORVELLA
          </Link>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#D4AF37] transition-colors uppercase">Home</button>
            <button onClick={() => scrollToSection('details')} className="hover:text-[#D4AF37] transition-colors uppercase">The Scent</button>
            
            {user ? (
                 user.role === 'admin' ? (
                    <Link to="/admin" className="text-[#D4AF37] font-bold tracking-wider">DASHBOARD</Link>
                 ) : (
                    <span className="text-white">Hi, {user.name.split(' ')[0]}</span>
                 )
            ) : (
                <Link to="/auth" className="hover:text-[#D4AF37] transition-colors">LOGIN</Link>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
                <button onClick={logout} className="text-gray-500 hover:text-red-500 hidden md:block transition-colors" title="Logout">
                    <LogOut size={20} />
                </button>
            )}

            <button className="relative group" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag className="text-white group-hover:text-[#D4AF37] transition-colors" size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }}
            className="fixed inset-0 bg-[#050505] z-50 flex flex-col items-center justify-center space-y-8 md:hidden"
          >
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 text-[#D4AF37]">
              <X size={32} />
            </button>
            <Link onClick={() => setMobileMenuOpen(false)} to="#" className="text-2xl font-serif text-white hover:text-[#D4AF37]">Home</Link>
            <button onClick={() => scrollToSection('details')} className="text-2xl font-serif text-white hover:text-[#D4AF37]">The Scent</button>
            
            {user ? (
                <>
                    <span className="text-[#D4AF37] text-xl font-serif">{user.name}</span>
                    {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-[#D4AF37]">Admin Dashboard</Link>
                    )}
                    <button onClick={() => {logout(); setMobileMenuOpen(false);}} className="text-red-500 text-lg">Logout</button>
                </>
            ) : (
                <Link onClick={() => setMobileMenuOpen(false)} to="/auth" className="text-2xl font-serif text-white hover:text-[#D4AF37]">Login</Link>
            )}
          </motion.div>
        )}
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }}
            className="space-y-6 text-center md:text-left z-10 text-white"
            style={{ zIndex: 30 }}
          >
            <span className="text-[#D4AF37] tracking-[0.4em] text-xs md:text-sm uppercase font-bold">Premium Edition</span>
            
            {/* Dynamic Hero Text */}
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-white leading-[1.1]">
              The Golden <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] italic">
                 Root
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg max-w-lg mx-auto md:mx-0 font-light leading-relaxed">
              {heroProduct.description}
            </p>
            
            <div className="pt-6 flex flex-col md:flex-row gap-4 justify-center md:justify-start">
              {/* PRIMARY ACTION BUTTON */}
              <button 
                onClick={() => handleBuy(heroProduct)} 
                className="px-10 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 relative z-50 cursor-pointer"
              >
                Shop Now
              </button>
              
              {/* SECONDARY ACTION BUTTON */}
              <button 
                onClick={() => {
                   if(heroProduct) setSelectedProduct(heroProduct);
                }} 
                className="px-10 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300 relative z-50 cursor-pointer"
              >
                View Notes
              </button>
            </div>
          </motion.div>

          {/* Interactive 3D Product */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }}
            className="relative h-[500px] md:h-[700px] w-full flex justify-center items-center cursor-pointer"
          >
             <TiltCard>
                <motion.img 
                  style={{ z: 50 }}
                  src={heroProduct.images[0].url} 
                  alt="Orvella Perfume Bottle" 
                  className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(212,175,55,0.25)]"
                  // Clicking image opens details
                  onClick={() => handleBuy(heroProduct)}
                />
             </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* --- 3. INFINITE BRAND TICKER --- */}
      <div className="py-6 bg-[#D4AF37] border-y border-white/10 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: "-100%" }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-12 pr-12 text-black font-bold tracking-[0.2em] uppercase text-sm md:text-base"
          >
            {Array(10).fill("Orvella • The Golden Root • Luxury Fragrance • Exclusive •").map((text, i) => (
              <span key={i} className="flex items-center gap-4">{text} <Star size={14} fill="black" /></span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- 4. THE DETAILS SECTION (SINGLE PRODUCT FOCUS) --- */}
      <section id="details" className="py-24 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Product Imagery */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    viewport={{ once: true }}
                    className="relative bg-[#050505] p-12 border border-white/5 rounded-sm"
                >
                    <div className="absolute top-4 left-4 border-t border-l border-[#D4AF37] w-8 h-8"/>
                    <div className="absolute bottom-4 right-4 border-b border-r border-[#D4AF37] w-8 h-8"/>
                    <img 
                       src={heroProduct.images[0].url} 
                       alt="Orvella Detail" 
                       className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    />
                </motion.div>

                {/* Product Text Details */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div>
                        <span className="text-[#D4AF37] uppercase tracking-[0.3em] font-bold text-sm">The Masterpiece</span>
                        <h2 className="mt-4 text-4xl font-serif text-white">Unveiling The <br/> <span className="italic text-[#D4AF37]">Golden Root</span></h2>
                    </div>
                    
                    <p className="text-gray-400 leading-loose text-lg">
                        {heroProduct.description}
                    </p>

                    <div className="grid grid-cols-2 gap-6 border-y border-white/10 py-8">
                        <div>
                            <h4 className="text-white font-serif text-xl mb-2">Top Notes</h4>
                            <p className="text-gray-500 text-sm">Saffron, Jasmine, Golden Amber</p>
                        </div>
                        <div>
                            <h4 className="text-white font-serif text-xl mb-2">Base Notes</h4>
                            <p className="text-gray-500 text-sm">Cedarwood, Musk, Rare Oud</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-3xl text-[#D4AF37] font-serif">₹{heroProduct.price}</div>
                        {/* BUY BUTTON */}
                        <button 
                            onClick={() => handleBuy(heroProduct)}
                            className="px-12 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                        >
                            Add to Bag
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
      </section>

      {/* --- 5. FEATURES GRID --- */}
      <section className="py-20 bg-[#050505] border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            {[
                { icon: <Star className="text-[#D4AF37]" size={32}/>, title: "Exquisite Scent", desc: "Rare ingredients blended to perfection." },
                { icon: <ShieldCheck className="text-[#D4AF37]" size={32}/>, title: "Certified Quality", desc: "Dermatologically tested and safe." },
                { icon: <Truck className="text-[#D4AF37]" size={32}/>, title: "Express Delivery", desc: "Secure shipping across India in 3 days." },
            ].map((f, idx) => (
                <motion.div 
                    key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2 }}
                    className="p-10 border border-white/5 hover:border-[#D4AF37]/30 bg-[#121212] transition-colors group text-center"
                >
                    <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                    <h3 className="text-xl font-serif text-white mb-3">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
            ))}
        </div>
      </section>

      {/* --- 6. EXCLUSIVE OFFER --- */}
      <section id="offer" className="relative py-32 bg-[#121212] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="border border-[#D4AF37]/30 p-12 md:p-20 bg-[#050505]/80 backdrop-blur-sm relative">
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#D4AF37]"/>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#D4AF37]"/>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#D4AF37]"/>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#D4AF37]"/>

                <motion.span 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                    className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold"
                >
                    Limited Time Offer
                </motion.span>
                <motion.h2 
                    initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
                    className="mt-6 text-4xl md:text-6xl font-serif text-white leading-tight"
                >
                    Your First <span className="text-[#D4AF37] italic">Luxury</span>
                </motion.h2>
                <p className="mt-6 text-gray-400 max-w-lg mx-auto">
                    Use code <span className="text-white font-bold border-b border-[#D4AF37]">ORVELLA20</span> at checkout for an exclusive 20% discount on your first purchase.
                </p>
                <button 
                  onClick={() => handleBuy(heroProduct)} 
                  className="mt-10 px-10 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-colors"
                >
                    Claim Offer
                </button>
            </div>
        </div>
      </section>

      {/* --- 7. FOOTER --- */}
      <footer className="bg-[#050505] border-t border-white/10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 md:col-span-2 space-y-8">
                    <h2 className="text-3xl font-serif text-[#D4AF37] tracking-widest">ORVELLA</h2>
                    <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
                        Orvella is more than a fragrance; it's an identity. The Golden Root is crafted for those who leave a mark without saying a word.
                    </p>
                    <div className="flex gap-4">
                        <Instagram className="text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors" size={20} />
                        <Twitter className="text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors" size={20} />
                        <Facebook className="text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors" size={20} />
                    </div>
                </div>
                
                <div className="space-y-6">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Menu</h4>
                    <ul className="space-y-4 text-gray-500 text-sm">
                        <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#D4AF37] transition-colors">Home</button></li>
                        <li><button onClick={() => scrollToSection('details')} className="hover:text-[#D4AF37] transition-colors">The Scent</button></li>
                        <li><button onClick={() => scrollToSection('offer')} className="hover:text-[#D4AF37] transition-colors">Offer</button></li>
                        <li><Link to="#" className="hover:text-[#D4AF37] transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div className="space-y-6">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Newsletter</h4>
                    <div className="flex flex-col gap-4">
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors text-sm placeholder:text-gray-600"
                        />
                        <button className="bg-white/10 text-white px-4 py-3 hover:bg-[#D4AF37] hover:text-black transition-colors text-sm font-bold uppercase tracking-wider">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                <p>&copy; 2025 Orvella. All Rights Reserved.</p>
                <div className="flex gap-8 mt-4 md:mt-0">
                    <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    {/* Admin Link - Hidden/Subtle */}
                    <Link to="/admin" className="hover:text-[#D4AF37] opacity-40 hover:opacity-100 transition-all">
                        Admin Login
                    </Link>
                </div>
            </div>
        </div>
      </footer>
    </main>
  );
}