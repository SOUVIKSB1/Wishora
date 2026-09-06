import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Volume2, Video, MessageSquare, Heart } from 'lucide-react';
import { BalloonCanvas } from '../canvas/BalloonCanvas.js';
import { THEMES, ThemeKey } from '../../types/theme.js';
import confetti from 'canvas-confetti';
import { haptic } from '../../utils/haptics.js';

interface CelebrationScreenProps {
  recipientName: string;
  wishText: string;
  coverPhoto?: string;
  themeKey?: ThemeKey;
  onOpenReaction: () => void;
}

export const CelebrationScreen: React.FC<CelebrationScreenProps> = ({
  recipientName,
  wishText,
  coverPhoto,
  themeKey = 'gold',
  onOpenReaction
}) => {
  const theme = THEMES[themeKey] || THEMES.gold;
  const firstName = recipientName ? recipientName.trim().split(' ')[0] : 'Friend';

  useEffect(() => {
    haptic.celebrate();
    // Initial cannon bursts from corners
    const end = Date.now() + 2.5 * 1000;
    const colors = theme.particleColors;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [theme]);

  const bgPhoto = coverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-void p-4 sm:p-6 select-none overflow-hidden">
      {/* Background with subtle Ken Burns zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={bgPhoto}
          alt="Celebration"
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="w-full h-full object-cover opacity-20 filter blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-void/60" />
      </div>

      {/* Floating Helium Balloons with Spring Physics & Tap to Pop */}
      <BalloonCanvas colors={theme.particleColors} count={12} />

      {/* Header */}
      <div className="relative z-20 text-center pt-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent font-mono text-[11px] font-bold tracking-widest uppercase mb-2 shadow-glow-sm"
        >
          <Sparkles size={12} />
          <span>CELEBRATION OF YOUR LIGHT</span>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-1"
        >
          <p className="font-serif italic text-white/90 text-2xl sm:text-3xl font-light">
            Happy Birthday,
          </p>
          <h1 className={`text-3xl sm:text-5xl font-display font-black tracking-tight ${theme.textGradientClass}`}>
            {firstName} ✨
          </h1>
        </motion.div>
      </div>

      {/* Center Emotional Wish Message in Instrument Serif */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative z-20 max-w-xl text-center bg-surface-elevated/85 border border-white/[0.15] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(200,169,110,0.15)] my-auto"
      >
        <p className="font-serif italic text-white text-xl sm:text-2xl leading-relaxed drop-shadow-md">
          "{wishText || 'May your journey ahead shimmer with effortless joy, boundless wonder, and all the magic you bring into every room you step into. ✨'}"
        </p>
      </motion.div>

      {/* Bottom CTA to Reaction */}
      <div className="relative z-20 pb-4 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onOpenReaction}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-accent to-yellow-600 text-void font-extrabold text-sm tracking-wide shadow-glow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <MessageSquare size={17} />
          <span>Send Reaction (Text, Voice or Video)</span>
        </button>
      </div>
    </div>
  );
};
