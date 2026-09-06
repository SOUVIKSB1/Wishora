import React from 'react';

export type AuraPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
export type AuraVariant = 'gold-purple' | 'cyan-emerald' | 'rose-gold' | 'cosmic' | 'sunset' | 'emerald-gold';
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
    sm: 'w-24 h-24 sm:w-32 sm:h-32',
    md: 'w-40 h-40 sm:w-56 sm:h-56',
    lg: 'w-56 h-56 sm:w-72 sm:h-72',
    xl: 'w-72 h-72 sm:w-96 sm:h-96',
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
    'gold-purple': 'bg-gradient-to-bl from-amber-400/25 via-purple-600/20 via-pink-500/10 to-transparent',
    'cyan-emerald': 'bg-gradient-to-tr from-cyan-400/25 via-emerald-500/20 via-blue-600/10 to-transparent',
    'rose-gold': 'bg-gradient-to-bl from-pink-500/25 via-amber-400/20 via-purple-600/10 to-transparent',
    'cosmic': 'bg-gradient-to-bl from-indigo-500/25 via-purple-500/20 via-fuchsia-500/10 to-transparent',
    'sunset': 'bg-gradient-to-tr from-rose-500/25 via-amber-500/20 via-orange-400/10 to-transparent',
    'emerald-gold': 'bg-gradient-to-bl from-emerald-400/25 via-amber-400/15 to-transparent',
  }[variant];

  return (
    <div
      className={`absolute ${positionClasses} ${sizeClasses} ${gradientClasses} pointer-events-none blur-2xl sm:blur-3xl animate-aura-pulse transition-all duration-700 ${className}`}
      style={opacity !== undefined ? { opacity } : undefined}
      aria-hidden="true"
    />
  );
};
