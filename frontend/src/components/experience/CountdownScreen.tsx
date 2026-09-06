import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lock, Calendar, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CountdownScreenProps {
  recipientName: string;
  recipientDob: string;
  onContinue: () => void;
  isPreview?: boolean;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  recipientName,
  recipientDob,
  onContinue,
  isPreview = false
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const dobDate = new Date(recipientDob);
  const formattedDob = !isNaN(dobDate.getTime())
    ? dobDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : 'your birthday';

  useEffect(() => {
    const calculateTime = () => {
      const dob = new Date(recipientDob);
      const now = new Date();
      const currentYear = now.getFullYear();

      let target = new Date(currentYear, dob.getMonth(), dob.getDate(), 0, 0, 0);
      if (target.getTime() < now.getTime()) {
        target = new Date(currentYear + 1, dob.getMonth(), dob.getDate(), 0, 0, 0);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        confetti({ particleCount: 80, spread: 100 });
        onContinue();
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [recipientDob, onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void p-6 select-none overflow-hidden">
      {/* Background ambient spotlight */}
      <div className="absolute w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg space-y-6">
        {/* Lock Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/40 text-accent font-mono text-xs font-bold tracking-widest uppercase shadow-glow-sm"
        >
          <Lock size={13} />
          <span>SEALED UNTIL {formattedDob.toUpperCase()}</span>
        </motion.div>

        {/* Headline */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
            A surprise is waiting for you, <span className="gold-gradient-text">{recipientName}</span>
          </h2>
          <p className="text-sm text-text-2 mt-2 leading-relaxed max-w-md mx-auto">
            Someone special crafted an interactive 3D cinematic birthday experience just for you. The vault will automatically unlock when your birthday arrives!
          </p>
        </div>

        {/* Large Countdown Digits */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4 my-6">
          {[
            { label: 'DAYS', val: timeLeft.days },
            { label: 'HOURS', val: timeLeft.hours },
            { label: 'MINUTES', val: timeLeft.minutes },
            { label: 'SECONDS', val: timeLeft.seconds },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-elevated/80 border border-white/[0.12] rounded-2xl p-3 sm:p-4 text-center backdrop-blur-xl shadow-glass-card"
            >
              <div className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight font-mono">
                {String(item.val).padStart(2, '0')}
              </div>
              <div className="text-[9px] sm:text-[11px] font-mono text-accent font-semibold mt-1 tracking-widest uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-xs font-serif italic text-text-2">
            "Good things come to those who wait for their magic day ✨"
          </p>

          {/* Discreet Director Bypass Mode - Only visible to creator in dashboard preview mode */}
          {isPreview && (
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-1.5 text-xs text-text-3 hover:text-accent font-mono transition-colors pt-4 cursor-pointer"
            >
              <KeyRound size={12} />
              <span>Director Preview Mode (Bypass Lock)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
