import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Sparkles, Wind } from 'lucide-react';
import { FlameCanvas } from '../canvas/FlameCanvas.js';
import { useMicBlowDetection } from '../../hooks/useMicBlowDetection.js';
import { THEMES, ThemeKey } from '../../types/theme.js';
import confetti from 'canvas-confetti';

interface CakeScreenProps {
  recipientName: string;
  themeKey?: ThemeKey;
  onFinished: () => void;
}

export const CakeScreen: React.FC<CakeScreenProps> = ({
  recipientName,
  themeKey = 'gold',
  onFinished
}) => {
  const theme = THEMES[themeKey] || THEMES.gold;
  const firstName = recipientName ? recipientName.trim().split(' ')[0] : 'Friend';
  const candleCount = 5;
  const [extinguishedCandles, setExtinguishedCandles] = useState<boolean[]>(
    Array(candleCount).fill(false)
  );
  const [allExtinguished, setAllExtinguished] = useState(false);

  const handleBlowOut = () => {
    // Extinguish candles progressively
    setExtinguishedCandles(Array(candleCount).fill(true));
    setAllExtinguished(true);

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.55 },
      colors: theme.particleColors
    });

    setTimeout(() => {
      onFinished();
    }, 2500);
  };

  const { hasPermission, isListening, audioLevel, startListening } = useMicBlowDetection(handleBlowOut);

  const handleManualBlow = () => {
    handleBlowOut();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-void py-3 px-4 sm:py-6 sm:px-6 select-none overflow-hidden min-h-[100dvh] max-h-[100dvh]">
      {/* Background glow */}
      <div
        className="absolute top-1/3 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-[80px] sm:blur-[100px] pointer-events-none transition-all duration-700"
        style={{ backgroundColor: allExtinguished ? 'rgba(0,0,0,0)' : theme.accentGlow }}
      />

      {/* Top Banner */}
      <div className="text-center pt-2 sm:pt-6 z-10">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] sm:text-xs font-mono tracking-widest text-accent uppercase block mb-0.5 font-bold"
        >
          {allExtinguished ? '🎉 WISH GRANTED!' : '✨ MAKE A BESPOKE WISH'}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-4xl font-display font-extrabold text-text-1"
        >
          {allExtinguished ? (
            <span className={theme.textGradientClass}>Happy Birthday, {firstName}! 🎂</span>
          ) : (
            <span>Blow out the candles, <span className={theme.textGradientClass}>{firstName}</span></span>
          )}
        </motion.h2>
      </div>

      {/* Handcrafted Cake Model with Candles (Optimized for Mobile Viewport) */}
      <div className="relative my-auto flex flex-col items-center justify-center scale-[0.78] xs:scale-[0.88] sm:scale-100 transition-transform origin-center">
        {/* Candles Row */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 mb-[-12px] z-20">
          {extinguishedCandles.map((isOut, idx) => (
            <div key={idx} className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform" onClick={handleManualBlow}>
              {/* Flame */}
              <div className="h-14 sm:h-16 flex items-end">
                <FlameCanvas isExtinguished={isOut} color={theme.accent} />
              </div>

              {/* Candle Body */}
              <div
                className="w-3 sm:w-3.5 h-14 sm:h-16 rounded-t-sm shadow-md border border-white/20 relative overflow-hidden"
                style={{ backgroundColor: theme.candleColor }}
              >
                {/* Spiral stripes */}
                <div className="absolute inset-0 opacity-25 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.8)_50%,transparent_75%)] bg-[length:10px_10px]" />
              </div>
            </div>
          ))}
        </div>

        {/* Cake Tier 2 (Top Tier) */}
        <div
          className="relative w-44 sm:w-56 h-16 sm:h-20 rounded-t-3xl border-t-2 border-x-2 border-white/10 shadow-2xl z-10 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: theme.cakeTierColors[1] || '#BE185D' }}
        >
          {/* Icing Drips */}
          <div
            className="absolute top-0 inset-x-0 h-3.5 sm:h-4 rounded-b-xl opacity-90"
            style={{ backgroundColor: theme.cakeIcingColor }}
          />
          <span className="font-serif italic text-white/60 text-[11px] sm:text-xs">✨ Make a wish ✨</span>
        </div>

        {/* Cake Tier 1 (Bottom Tier) */}
        <div
          className="relative w-58 sm:w-76 h-20 sm:h-26 rounded-t-3xl rounded-b-xl border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: theme.cakeTierColors[0] || '#831843' }}
        >
          <div
            className="absolute top-0 inset-x-0 h-4 sm:h-5 rounded-b-2xl opacity-90"
            style={{ backgroundColor: theme.cakeIcingColor }}
          />
          {/* Cake Stand shadow */}
          <div className="absolute bottom-1 inset-x-6 h-2 bg-black/40 rounded-full blur-xs" />
        </div>

        {/* Glass Plate / Stand */}
        <div className="w-66 sm:w-88 h-3.5 sm:h-4 bg-white/10 rounded-full border border-white/20 backdrop-blur-md shadow-2xl -mt-2 z-0" />
      </div>

      {/* Mic & Interaction Bar */}
      <div className="pb-8 z-10 flex flex-col items-center gap-3">
        {!isListening && !allExtinguished && (
          <button
            onClick={startListening}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-surface-elevated/90 border border-accent/40 text-text-1 hover:border-accent text-xs font-semibold shadow-glow-sm transition-all"
          >
            <Mic size={16} className="text-accent animate-pulse" />
            <span>Enable Mic to Blow 🎤</span>
          </button>
        )}

        {isListening && !allExtinguished && (
          <div className="flex flex-col items-center gap-2 bg-surface-elevated/80 border border-white/[0.08] px-5 py-2.5 rounded-full backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-text-2">
              <Wind size={14} className="text-accent animate-bounce" />
              <span>Blow steadily onto your microphone...</span>
            </div>
            {/* Audio level meter */}
            <div className="w-32 h-1 bg-void rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
        )}

        {!allExtinguished && (
          <button
            onClick={handleManualBlow}
            className="flex items-center gap-2 text-xs text-text-2 hover:text-accent font-medium bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 rounded-full border border-white/[0.1] hover:border-accent/40 cursor-pointer transition-all mt-1"
          >
            <Sparkles size={12} className="text-accent" />
            <span>Tap here to blow out candles manually</span>
          </button>
        )}
      </div>
    </div>
  );
};
