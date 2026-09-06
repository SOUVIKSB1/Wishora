import React from 'react';
import { clsx } from 'clsx';

interface GlowBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'rose' | 'electric' | 'green' | 'purple' | 'ghost' | 'cyan' | 'emerald';
  className?: string;
  icon?: React.ReactNode;
}

export const GlowBadge: React.FC<GlowBadgeProps> = ({
  children,
  variant = 'gold',
  className,
  icon
}) => {
  const variantStyles = {
    gold: 'bg-gold-pulse text-gold border-[rgba(200,169,110,0.35)] shadow-gold-glow',
    rose: 'bg-pink-500/15 text-pink-200 border-pink-500/35 shadow-[0_0_15px_rgba(232,121,160,0.25)]',
    electric: 'bg-blue-500/15 text-blue-200 border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.25)]',
    cyan: 'bg-sky-500/15 text-sky-200 border-sky-500/35 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
    green: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    purple: 'bg-purple-500/15 text-purple-200 border-purple-500/35 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
    ghost: 'bg-white/[0.08] text-text-1 border-white/20',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-body font-semibold border backdrop-blur-md transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="opacity-90">{icon}</span>}
      {children}
    </span>
  );
};

