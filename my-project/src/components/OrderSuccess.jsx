import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function OrderSuccess() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-[#121212] border border-[#D4AF37]/30 p-12 rounded-xl shadow-[0_0_60px_rgba(212,175,55,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        
        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
            <CheckCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-serif text-white mb-2">Order Confirmed</h1>
        <p className="text-gray-400 mb-8">
            Thank you for choosing Orvella. Your order has been placed successfully and is being processed by our artisans.
        </p>

        <div className="space-y-4">
            <Link to="/admin" className="block w-full bg-[#1a1a1a] text-gray-300 py-3 rounded hover:bg-[#222] transition-colors uppercase text-xs font-bold tracking-widest">
                View in Dashboard
            </Link>
            <Link to="/" className="block w-full bg-[#D4AF37] text-black py-3 rounded hover:bg-white transition-colors uppercase text-xs font-bold tracking-widest flex items-center justify-center gap-2">
                Continue Shopping <ArrowRight size={14} />
            </Link>
        </div>
      </motion.div>
    </div>
  );
}