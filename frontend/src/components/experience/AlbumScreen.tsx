import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Heart, RefreshCw } from 'lucide-react';
import { WishPhoto } from '../../types/wish.js';

interface AlbumScreenProps {
  photos: WishPhoto[];
  senderName?: string;
  wishText?: string;
  onNext: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  scale: number;
  opacity: number;
  type: '💗' | '✨' | '🌸';
  lifetime: number;
  maxLife: number;
}

export const AlbumScreen: React.FC<AlbumScreenProps> = ({
  photos,
  senderName = 'Souvik Sinhababu',
  wishText = 'May your journey ahead shimmer with effortless joy, boundless wonder, and all the magic you bring into every room you step into.',
  onNext
}) => {
  const prefersReduced = useReducedMotion();
  const validPhotos = photos.length > 0 ? photos : [
    {
      id: 'p_1',
      storage_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      caption: 'Golden memories and radiant smiles ✨',
      sort_order: 0
    },
    {
      id: 'p_2',
      storage_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
      caption: 'Another unforgettable trip together 🌍',
      sort_order: 1
    },
    {
      id: 'p_3',
      storage_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
      caption: 'Here is to endless laughter ahead! 🥂',
      sort_order: 2
    }
  ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [loveCounts, setLoveCounts] = useState<Record<number, number>>({});
  const [lightHighlight, setLightHighlight] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // 3D Tilt Lerp
  const [tiltTarget, setTiltTarget] = useState<{ rotX: number; rotY: number }>({ rotX: 0, rotY: 0 });
  const [currentTilt, setCurrentTilt] = useState<{ rotX: number; rotY: number }>({ rotX: 0, rotY: 0 });

  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Real-time lerp for smooth 3D tilt
  useEffect(() => {
    if (isFlipped || prefersReduced) return;

    let id: number;
    const updateLerp = () => {
      setCurrentTilt((prev) => ({
        rotX: prev.rotX + (tiltTarget.rotX - prev.rotX) * 0.08,
        rotY: prev.rotY + (tiltTarget.rotY - prev.rotY) * 0.08,
      }));
      id = requestAnimationFrame(updateLerp);
    };
    id = requestAnimationFrame(updateLerp);
    return () => cancelAnimationFrame(id);
  }, [tiltTarget, isFlipped, prefersReduced]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped || prefersReduced) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const dx = (mouseX - rect.width / 2) / rect.width;
    const dy = (mouseY - rect.height / 2) / rect.height;

    const rotX = Math.max(-14, Math.min(14, dy * -14));
    const rotY = Math.max(-18, Math.min(18, dx * 18));
    setTiltTarget({ rotX, rotY });

    setLightHighlight({
      x: Math.round((mouseX / rect.width) * 100),
      y: Math.round((mouseY / rect.height) * 100),
    });
  };

  const handleMouseLeave = () => {
    setTiltTarget({ rotX: 0, rotY: 0 });
    setLightHighlight({ x: 50, y: 50 });
  };

  // Gyroscope tilt support on mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (isFlipped || prefersReduced || !e.beta || !e.gamma) return;
      const rotX = Math.max(-14, Math.min(14, (e.beta - 45) * 0.4));
      const rotY = Math.max(-18, Math.min(18, e.gamma * 0.5));
      setTiltTarget({ rotX, rotY });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isFlipped, prefersReduced]);

  // Double Tap Heart Fountain
  const handlePhotoTouchOrClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Trigger Double Tap
      triggerHeartFountain(e.clientX, e.clientY);
      setLoveCounts((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || 0) + 1,
      }));
      if (navigator.vibrate) {
        navigator.vibrate([8, 30, 12]);
      }
    }
    lastTapRef.current = now;
  };

  const triggerHeartFountain = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const spawnX = clientX - rect.left;
    const spawnY = clientY - rect.top;

    const newParticles: Particle[] = [];
    const types: ('💗' | '✨' | '🌸')[] = ['💗', '💗', '✨', '✨', '🌸'];

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      const life = 55 + Math.random() * 35;
      newParticles.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rotation: (Math.random() - 0.5) * 720,
        vRot: (Math.random() - 0.5) * 12,
        scale: 1,
        opacity: 1,
        type: types[Math.floor(Math.random() * types.length)],
        lifetime: 0,
        maxLife: life,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];

    if (!animFrameRef.current) {
      runParticles();
    }
  }, []);

  const runParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const active: Particle[] = [];
    for (const p of particlesRef.current) {
      p.lifetime++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravity
      p.rotation += p.vRot;
      p.scale = Math.max(0, 1 - p.lifetime / p.maxLife);

      const remaining = p.maxLife - p.lifetime;
      if (remaining < p.maxLife * 0.3) {
        p.opacity = Math.max(0, remaining / (p.maxLife * 0.3));
      }

      if (p.lifetime < p.maxLife) {
        active.push(p);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.opacity;
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type, 0, 0);
        ctx.restore();
      }
    }

    particlesRef.current = active;

    if (active.length > 0) {
      animFrameRef.current = requestAnimationFrame(runParticles);
    } else {
      animFrameRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const currentPhoto = validPhotos[currentIndex];
  const activeLoveCount = loveCounts[currentIndex] || 0;

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : validPhotos.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex === validPhotos.length - 1) {
      onNext();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-void flex flex-col justify-between items-center py-3 sm:py-5 px-3 sm:px-6 select-none overflow-hidden">
      {/* Top Header with Photo Counter & Skip Action */}
      <header className="relative z-20 w-full max-w-md flex items-center justify-between pt-1 px-2">
        <div className="bg-glass border border-glass-border rounded-full px-4 py-1.5 backdrop-blur-[16px] text-xs font-mono font-bold text-accent shadow-glass-card">
          📷 {currentIndex + 1} OF {validPhotos.length} MEMORIES
        </div>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-void text-xs font-bold transition-all cursor-pointer"
        >
          <span>Skip to Finale</span>
          <ArrowRight size={13} />
        </button>
      </header>

      {/* Main 3D Polaroid Stack Stage with Perspective */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-sm perspective-1200 py-1">
        {/* Particle Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={360}
          height={480}
          className="absolute inset-0 pointer-events-none z-40 w-full h-full"
          aria-hidden="true"
        />

        <div className="relative w-[230px] sm:w-[270px] max-h-[42vh] aspect-[3/4] flex items-center justify-center">
          {/* Card in Stack Depth #2 (Bottom layer) */}
          {currentIndex + 2 < validPhotos.length && (
            <div
              className="absolute inset-0 rounded-[4px] p-[10px_10px_36px_10px] bg-[#E5E2DA] border border-black/10 shadow-md pointer-events-none transition-all duration-300"
              style={{
                transform: 'translateY(20px) scale(0.88) rotate(4deg)',
                opacity: 0.45,
                zIndex: 1,
              }}
            >
              <div className="w-full aspect-square rounded-[2px] bg-neutral-800 overflow-hidden">
                <img
                  src={validPhotos[currentIndex + 2].storage_url}
                  alt="Stacked memory"
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
            </div>
          )}

          {/* Card in Stack Depth #1 (Middle layer) */}
          {currentIndex + 1 < validPhotos.length && (
            <div
              className="absolute inset-0 rounded-[4px] p-[10px_10px_36px_10px] bg-[#F0EDE6] border border-black/10 shadow-lg pointer-events-none transition-all duration-300"
              style={{
                transform: 'translateY(10px) scale(0.94) rotate(-3deg)',
                opacity: 0.75,
                zIndex: 5,
              }}
            >
              <div className="w-full aspect-square rounded-[2px] bg-neutral-800 overflow-hidden">
                <img
                  src={validPhotos[currentIndex + 1].storage_url}
                  alt="Stacked memory"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            </div>
          )}

          {/* ACTIVE FRONT CARD (Interactive with Elastic Drag, 3D Tilt & Zero-Bleed Flip) */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            drag={prefersReduced ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
            whileTap={{ scale: 0.98 }}
            onDragEnd={(_, info) => {
              if (info.velocity.x < -180 || info.offset.x < -60) {
                handleNext();
              } else if (info.velocity.x > 180 || info.offset.x > 60) {
                handlePrev();
              }
            }}
            animate={{
              rotateX: prefersReduced ? 0 : currentTilt.rotX,
              rotateY: prefersReduced ? (isFlipped ? 180 : 0) : isFlipped ? 180 : currentTilt.rotY,
              z: prefersReduced ? 0 : 28,
              scale: isFlipped ? 1.02 : 1,
            }}
            transition={{
              rotateY: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
            }}
            className="relative w-full h-full transform-style-3d cursor-grab active:cursor-grabbing z-10"
          >
            {/* FRONT: Polaroid Frame + Photo + Handwritten Caption */}
            <div
              onClick={handlePhotoTouchOrClick}
              className="absolute inset-0 backface-hidden rounded-[8px] p-[10px_10px_36px_10px] flex flex-col justify-between"
              style={{
                backgroundColor: '#FAF8F5',
                background: 'linear-gradient(145deg, #FAF8F5, #EDE8DE)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4), 0 2px 0 rgba(255,255,255,0.6) inset',
                opacity: isFlipped ? 0 : 1,
                pointerEvents: isFlipped ? 'none' : 'auto',
                transition: 'opacity 0.25s ease',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Photo Viewport */}
              <div className="relative w-full aspect-square rounded-[4px] overflow-hidden bg-black flex-shrink-0">
                <img
                  src={currentPhoto.storage_url}
                  alt={currentPhoto.caption || 'Memory'}
                  loading="lazy"
                  className="w-full h-full object-cover pointer-events-none select-none"
                />

                {/* Real-time Specular Light Reflection */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70 transition-all duration-75"
                  style={{
                    background: `radial-gradient(ellipse at ${lightHighlight.x}% ${lightHighlight.y}%, rgba(255,255,255,0.22) 0%, transparent 65%)`,
                  }}
                />

                {/* Double-tap instruction pill */}
                <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-[9px] text-white/90 font-mono">
                  Double tap ❤️
                </div>

                {/* Love Count Pill */}
                <AnimatePresence>
                  {activeLoveCount > 0 && (
                    <motion.div
                      key={activeLoveCount}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="absolute top-1.5 right-1.5 bg-[rgba(255,59,92,0.25)] border border-[rgba(255,59,92,0.5)] rounded-full px-2 py-0.5 text-[11px] font-body font-bold text-red-heart shadow-md backdrop-blur-md"
                    >
                      ❤️ {activeLoveCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Handwritten Caption Area */}
              <div className="h-[36px] flex items-center justify-center px-1 text-center">
                <p
                  className="font-marker text-[12px] sm:text-[13px] text-[#2A1A0A] leading-tight tracking-[0.02em] line-clamp-2 select-none"
                  style={{ fontFamily: '"Permanent Marker", "Satisfy", cursive' }}
                >
                  {currentPhoto.caption || 'Unforgettable smiles and timeless memories ✨'}
                </p>
              </div>
            </div>

            {/* BACK: Aged Stationery + Handwritten Sender Memory Note + Wax Seal (Zero Bleed) */}
            <div
              className="absolute inset-0 backface-hidden rotate-y-180 rounded-[8px] p-4 sm:p-5 flex flex-col justify-between text-left"
              style={{
                backgroundColor: '#FAF5EA',
                background: 'linear-gradient(160deg, #FAF5EA, #EFE6D2)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                opacity: isFlipped ? 1 : 0,
                pointerEvents: isFlipped ? 'auto' : 'none',
                transition: 'opacity 0.25s ease',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-black/[0.1] pb-1.5">
                  <span className="text-[10px] font-mono tracking-widest text-[#8A6E42] uppercase font-bold">
                    MEMORY #{currentIndex + 1} ARCHIVE 💌
                  </span>
                  <span className="text-[9px] font-mono text-[#8A6E42] font-semibold bg-[#E8DCBF] px-2 py-0.5 rounded-full">
                    {currentIndex === 0 ? '✨ Featured' : '📸 Moment'}
                  </span>
                </div>

                <h4 className="font-display font-bold text-xs text-[#2A1A0A] pt-0.5">
                  {currentPhoto.caption || `Unforgettable Smiles & Pure Light`}
                </h4>

                <p
                  className="font-marker text-[12px] sm:text-[13px] text-[#2A1A0A] leading-relaxed pt-0.5 line-clamp-5 select-none"
                  style={{ fontFamily: '"Permanent Marker", "Satisfy", cursive' }}
                >
                  {currentPhoto.caption
                    ? `Captured with so much love. Looking back at this memory brings a huge smile — thank you for being such an extraordinary, radiant part of my life!`
                    : [
                        "A golden moment frozen in time. Looking at this reminds me of how much effortless joy and warmth you bring into every room.",
                        "Unstoppable energy and endless laughter! One of my absolute favorite adventures together.",
                        "Here is to the unscripted magic, spontaneous jokes, and unforgettable moments we share.",
                        "Every memory with you feels like a timeless classic. You make every single day brighter!",
                        "Your radiant smile in this photo literally lights up the entire room. So grateful for you!"
                      ][currentIndex % 5]}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.1)]">
                {/* Gold Wax Seal Stamp */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E5C178] to-[#9C753A] border border-[#FDE047] flex items-center justify-center text-[#06060A] font-extrabold text-[11px] shadow-sm">
                    W
                  </div>
                  <span className="text-[10px] font-mono text-[#8A6E42] font-semibold">Wishora Keepsake</span>
                </div>

                <span className="text-[12px] font-serif italic text-gold-dim font-bold">
                  — {senderName}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stack Control Action Row */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-white disabled:opacity-20 hover:border-gold transition-all cursor-pointer shadow-sm"
            title="Previous Photo"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            aria-label="Flip polaroid card"
            className="px-5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.18] backdrop-blur-md text-white font-body font-semibold text-xs hover:border-gold hover:text-accent transition-all flex items-center gap-2 active:scale-95 shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} className={isFlipped ? 'rotate-180 transition-transform' : ''} />
            <span>{isFlipped ? 'Flip to Photo 🖼️' : 'Flip to Letter 💌'}</span>
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-white hover:border-gold transition-all cursor-pointer shadow-sm"
            title="Next Photo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Dots & Progress Action */}
      <footer className="relative z-20 pb-2 sm:pb-4 flex flex-col items-center gap-2.5 w-full max-w-sm">
        {/* Swipe dots */}
        <div className="flex items-center gap-2">
          {validPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(i);
              }}
              aria-label={`Go to photo ${i + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex ? 'w-6 h-1.5 bg-accent shadow-[0_0_10px_rgba(200,169,110,0.5)]' : 'w-1.5 h-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Dynamic Grand Celebration / Next Photo CTA */}
        {currentIndex === validPhotos.length - 1 ? (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-extrabold text-xs tracking-wider shadow-[0_0_25px_rgba(200,169,110,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Grand Celebration Finale 🎉</span>
            <Sparkles size={15} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.18] text-white font-body font-bold text-xs tracking-wide hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Next Memory ({validPhotos.length - 1 - currentIndex} left)</span>
            <ArrowRight size={13} />
          </button>
        )}
      </footer>
    </div>
  );
};
