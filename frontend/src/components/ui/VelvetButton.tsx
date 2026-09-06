import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { haptic } from '../../utils/haptics.js';

interface VelvetButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow' | 'outline' | 'subtle' | 'rainbow' | 'cyan' | 'emerald' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  hapticType?: 'light' | 'medium' | 'success' | 'celebrate' | 'impact' | 'sparkle' | 'none';
}

export const VelvetButton: React.FC<VelvetButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  hapticType = 'light',
  className,
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hapticType !== 'none') {
      if (hapticType === 'medium') haptic.medium();
      else if (hapticType === 'success') haptic.success();
      else if (hapticType === 'celebrate') haptic.celebrate();
      else if (hapticType === 'impact') haptic.impact();
      else if (hapticType === 'sparkle') haptic.sparkle();
      else haptic.light();
    }
    if (onClick) onClick(e);
  };

  const baseStyles = 'relative inline-flex items-center justify-center font-body font-semibold tracking-wide rounded-full transition-all duration-200 outline-none select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-2.5 text-sm gap-2',
    lg: 'px-8 py-3.5 text-base gap-2.5 font-bold',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-extrabold shadow-[0_0_20px_rgba(200,169,110,0.45)] hover:brightness-105 active:scale-[0.97]',
    secondary: 'bg-white/[0.12] hover:bg-white/[0.2] text-white border border-white/[0.25] font-bold backdrop-blur-md active:scale-[0.97]',
    ghost: 'bg-transparent text-white/80 hover:text-white hover:bg-white/[0.1] active:scale-[0.97]',
    outline: 'bg-transparent text-white border border-white/30 hover:border-[#D4AF37] hover:text-[#D4AF37] font-semibold active:scale-[0.97]',
    subtle: 'bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.18] text-white active:scale-[0.97]',
    danger: 'bg-rose-500/20 text-rose-100 border border-rose-500/40 hover:bg-rose-500/30 active:scale-[0.97]',
    glow: 'bg-gradient-to-r from-[#FDE047] via-[#E5C178] to-[#9C753A] text-[#06060A] font-extrabold shadow-[0_0_30px_rgba(200,169,110,0.55)] hover:brightness-110 active:scale-[0.97]',
    rainbow: 'bg-gradient-to-r from-amber-400 via-rose-500 via-purple-600 to-cyan-400 text-white font-black shadow-[0_0_25px_rgba(244,114,182,0.45)] hover:brightness-110 active:scale-[0.97]',
    cyan: 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-black shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:brightness-110 active:scale-[0.97]',
    emerald: 'bg-gradient-to-r from-emerald-400 to-teal-600 text-void font-black shadow-[0_0_25px_rgba(52,211,153,0.45)] hover:brightness-110 active:scale-[0.97]',
    rose: 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-700 text-white font-black shadow-[0_0_25px_rgba(244,114,182,0.45)] hover:brightness-110 active:scale-[0.97]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.965, transition: { type: 'spring', stiffness: 500, damping: 25 } }}
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};
