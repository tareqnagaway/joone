import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useRide } from '../contexts/RideContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function RadarScreen() {
  const { cancelRide, isLoading } = useRide();
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 z-40 bg-gray-900/90 flex flex-col items-center justify-center text-white" dir="rtl">
      <div className="relative flex items-center justify-center">
        {/* Animated Ripple Effects */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/20"
            initial={{ width: 64, height: 64, opacity: 0.8 }}
            animate={{ 
              width: 256, 
              height: 256, 
              opacity: 0,
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 1,
              ease: "linear" 
            }}
          />
        ))}
        
        {/* Center Logo */}
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center z-10 shadow-lg shadow-primary/50">
          <span className="font-black text-2xl text-white">JO</span>
        </div>
      </div>
      
      <div className="mt-16 text-center px-6">
        <h3 className="text-2xl font-black mb-2">جاري البحث عن كابتن...</h3>
        <p className="text-white/60 font-bold mb-10">يرجى الانتظار، نحن نحدد أقرب سائق إليك</p>

        <button
          type="button"
          onClick={() => void cancelRide()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-[2rem] border-2 border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none font-black text-sm tracking-wide transition-colors"
        >
          <X size={20} aria-hidden />
          {t('ride.cancelRequest')}
        </button>
      </div>
    </div>
  );
}
