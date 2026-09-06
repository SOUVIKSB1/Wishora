import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface EnvelopeScreenProps {
  recipientName: string;
  senderName?: string;
  onUnseal: () => void;
}

export const EnvelopeScreen: React.FC<EnvelopeScreenProps> = ({
  recipientName,
  senderName,
  onUnseal
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const firstName = recipientName ? recipientName.trim().split(' ')[0] : 'Friend';
  const senderFirstName = senderName ? senderName.trim().split(' ')[0] : 'Someone Special';

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => {
      onUnseal();
    }, 900);
  };

  const senderInitials = (senderName || 'W')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'W';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void p-4 overflow-hidden select-none">
      {/* Background ambient spotlight */}
      <div className="absolute top-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      {/* Recipient Headline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-8 space-y-1"
      >
        <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-bold">
          A BESPOKE BIRTHDAY FILM CRAFTED BY {senderFirstName.toUpperCase()}
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-text-1 tracking-tight">
          This is for <span className="gold-gradient-text">{firstName}</span>
        </h1>
      </motion.div>

      {/* 3D Wax Sealed Envelope with Gravity Spring Drop */}
      <motion.div
        initial={{ y: -400, rotate: -5, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120, duration: 1.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="relative w-72 sm:w-88 h-48 sm:h-56 bg-gradient-to-b from-[#1E1E2A] to-[#12121B] rounded-2xl border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(200,169,110,0.15)] flex items-center justify-center cursor-pointer group"
      >
        {/* Envelope Flap Fold lines */}
        <div className="absolute top-0 left-0 right-0 h-28 border-b border-white/[0.08] bg-white/[0.02] clip-envelope-flap" />

        {/* Luxury Monogram Wax Seal Stamp (Embossed Crown & Rosette Insignia) */}
        <motion.div
          animate={isOpening ? { scale: 1.4, opacity: 0 } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#F5D77F] via-[#C8A96E] to-[#8A6E42] p-1 border-2 border-[#FFE8A3] shadow-[0_0_35px_rgba(200,169,110,0.6),0_8px_16px_rgba(0,0,0,0.5)] flex items-center justify-center group-hover:scale-105 transition-transform"
        >
          {/* Inner Beaded Ring */}
          <div className="w-full h-full rounded-full border border-[#FFE8A3]/60 bg-gradient-to-tr from-[#9C753A] to-[#E5C178] flex flex-col items-center justify-center shadow-inner">
            <span className="text-base sm:text-lg leading-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              👑
            </span>
            <span className="text-[8px] font-mono tracking-widest text-[#2A1A0A] font-extrabold uppercase mt-0.5">
              WISHORA
            </span>
          </div>
        </motion.div>

        {/* Inner letter peek animation */}
        <motion.div
          animate={isOpening ? { y: -80, opacity: 1 } : { y: 0, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-x-4 top-2 h-20 bg-[#F2EFE9] text-void rounded-t-xl p-3 shadow-lg font-serif italic text-xs"
        >
          <span>Happy Birthday...</span>
        </motion.div>
      </motion.div>

      {/* Swipe/Tap Prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-8 text-center"
      >
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-surface-elevated/90 border border-accent/40 hover:border-accent text-text-1 hover:text-accent text-xs font-semibold tracking-wide transition-all shadow-glow-sm cursor-pointer"
        >
          <Sparkles size={14} className="text-accent animate-pulse" />
          <span>Tap to Break Seal & Unfold</span>
        </button>
      </motion.div>
    </div>
  );
};
