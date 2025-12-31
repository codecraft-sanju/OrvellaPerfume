import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useShop } from './ShopContext'; // Import Context to check user role

export default function OrderSuccess() {
  const { user } = useShop(); 

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-center selection:bg-[#D4AF37] selection:text-black">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md w-full bg-[#121212] border border-[#D4AF37]/30 p-12 rounded-xl shadow-[0_0_60px_rgba(212,175,55,0.15)] relative overflow-hidden"
      >
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        
        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <CheckCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-serif text-white mb-2 tracking-wide">Order Confirmed</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Thank you for choosing Orvella. Your edition is being prepared by our artisans and will be shipped shortly.
        </p>

        <div className="space-y-3">
            {/* Show Admin Button only if the user is an Admin */}
            {user && user.role === 'admin' && (
                <Link to="/admin" className="block w-full bg-[#1a1a1a] text-gray-400 py-3 rounded border border-white/5 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase text-xs font-bold tracking-widest flex items-center justify-center gap-2 group">
                    <LayoutDashboard size={14} className="group-hover:scale-110 transition-transform"/> Track in Dashboard
                </Link>
            )}

            <Link to="/" className="block w-full bg-[#D4AF37] text-black py-4 rounded font-bold hover:bg-white transition-colors uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(212,175,55,0.2)]">
                Return to Orvella <ArrowRight size={14} />
            </Link>
        </div>
      </motion.div>
    </div>
  );
}