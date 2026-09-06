import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = false,
  glowColor = 'rgba(200, 169, 110, 0.15)',
  interactive = false,
  ...props
}) => {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      style={{
        boxShadow: glow ? `0 12px 40px ${glowColor}` : '0 10px 30px rgba(0,0,0,0.3)',
      }}
      className={twMerge(
        clsx(
          'relative rounded-2xl bg-surface/80 backdrop-blur-xl border border-white/[0.08] p-5 overflow-hidden transition-colors duration-200',
          interactive && 'cursor-pointer hover:border-white/[0.16] hover:bg-surface/90',
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
