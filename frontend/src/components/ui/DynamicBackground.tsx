import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const DynamicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const vibrantColors = [
      '#F472B6', // Rose pink
      '#38BDF8', // Cyan blue
      '#FBBF24', // Amber gold
      '#A855F7', // Royal purple
      '#34D399', // Emerald green
      '#FB7185', // Coral red
      '#E879F9', // Neon magenta
      '#FDE047'  // Bright yellow
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle constellation with smooth float and twinkle
    const count = Math.min(window.innerWidth < 640 ? 30 : 55, 60);
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      pulseSpeed: 0.015 + Math.random() * 0.02,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const currentAlpha = p.alpha * (0.5 + Math.sin(p.pulse) * 0.5);

        // Glowing particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic flowing chromatic aura orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 0.95, 1.15, 1],
          x: [0, 40, -30, 20, 0],
          y: [0, -35, 25, -20, 0],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-purple-600/25 via-pink-500/20 to-transparent blur-[80px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1, 1.1, 1],
          x: [0, -50, 30, -20, 0],
          y: [0, 40, -30, 25, 0],
          rotate: [360, 270, 180, 90, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -top-[10%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-amber-400/25 via-rose-500/20 to-transparent blur-[85px]"
      />

      <motion.div
        animate={{
          scale: [0.9, 1.15, 1, 1.2, 0.9],
          x: [0, 45, -35, 15, 0],
          y: [0, -25, 35, -15, 0]
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-[40%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-emerald-500/15 blur-[95px]"
      />

      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.2, 1, 1.1],
          x: [0, -30, 40, -20, 0],
          y: [0, 30, -35, 20, 0]
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -bottom-[15%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-emerald-400/20 via-teal-500/18 via-amber-400/15 to-transparent blur-[85px]"
      />

      {/* Twinkling ambient particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
    </div>
  );
};
