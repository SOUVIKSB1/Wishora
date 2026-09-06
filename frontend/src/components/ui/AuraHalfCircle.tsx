import React from 'react';

export type AuraPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
export type AuraVariant = 'gold-purple' | 'cyan-emerald' | 'rose-gold' | 'cosmic' | 'sunset' | 'emerald-gold' | 'rainbow' | 'neon-violet' | 'electric-cyan';
export type AuraSize = 'sm' | 'md' | 'lg' | 'xl';

interface AuraHalfCircleProps {
  position?: AuraPosition;
  variant?: AuraVariant;
  size?: AuraSize;
  className?: string;
  opacity?: number;
}

export const AuraHalfCircle: React.FC<AuraHalfCircleProps> = ({
  position = 'top-right',
  variant = 'gold-purple',
  size = 'md',
  className = '',
  opacity
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-28 h-28 sm:w-36 sm:h-36',
    md: 'w-44 h-44 sm:w-60 sm:h-60',
    lg: 'w-60 h-60 sm:w-80 sm:h-80',
    xl: 'w-80 h-80 sm:w-[28rem] sm:h-[28rem]',
  }[size];

  // Position & shape mappings
  const positionClasses = {
    'top-right': 'top-0 right-0 rounded-bl-full',
    'top-left': 'top-0 left-0 rounded-br-full',
    'bottom-right': 'bottom-0 right-0 rounded-tl-full',
    'bottom-left': 'bottom-0 left-0 rounded-tr-full',
    'top-center': 'top-0 left-1/2 -translate-x-1/2 rounded-b-full',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 rounded-t-full',
  }[position];

  // Variant gradient mappings
  const gradientClasses = {
    'gold-purple': 'bg-gradient-to-bl from-amber-400/35 via-purple-600/30 via-pink-500/20 to-transparent',
    'cyan-emerald': 'bg-gradient-to-tr from-cyan-400/35 via-emerald-500/30 via-blue-600/20 to-transparent',
    'rose-gold': 'bg-gradient-to-bl from-pink-500/35 via-amber-400/30 via-purple-600/20 to-transparent',
    'cosmic': 'bg-gradient-to-bl from-indigo-500/35 via-purple-500/30 via-fuchsia-500/25 to-transparent',
    'sunset': 'bg-gradient-to-tr from-rose-500/35 via-amber-500/30 via-orange-400/20 to-transparent',
    'emerald-gold': 'bg-gradient-to-bl from-emerald-400/35 via-teal-500/25 via-amber-400/20 to-transparent',
    'rainbow': 'bg-gradient-to-tr from-amber-400/35 via-rose-500/30 via-cyan-400/30 to-purple-600/25',
    'neon-violet': 'bg-gradient-to-bl from-purple-500/40 via-fuchsia-600/30 to-transparent',
    'electric-cyan': 'bg-gradient-to-tr from-cyan-400/40 via-sky-500/30 via-indigo-600/20 to-transparent',
  }[variant];

  return (
    <div
      className={`absolute ${positionClasses} ${sizeClasses} ${gradientClasses} pointer-events-none blur-2xl sm:blur-3xl animate-aura-pulse transition-all duration-700 ${className}`}
      style={opacity !== undefined ? { opacity } : undefined}
      aria-hidden="true"
    />
  );
};
