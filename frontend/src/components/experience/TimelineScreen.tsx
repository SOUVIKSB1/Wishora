import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, X, Sparkles, Disc, Film, Globe, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import worldEventsData from '../../data/worldEvents.json';

interface TimelineScreenProps {
  recipientName: string;
  birthYear?: number;
  currentAge?: number;
  onNext: () => void;
}

interface YearEvent {
  year: number;
  worldEvent: string;
  songTitle: string;
  songArtist: string;
  movieTitle: string;
  movieGenre: string;
  funTrivia: string;
  indiaMilestone?: string;
  topIndianCity?: {
    name: string;
    highlight: string;
    imageUrl: string;
  };
}

const KEY_BIRTHDAYS = [1, 5, 10, 13, 16, 18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100];

export function getSmartTimelineYears(birthYear: number, currentAge: number): number[] {
  const currentYear = birthYear + currentAge;
  if (currentAge <= 12) {
    const list: number[] = [];
    for (let y = birthYear; y <= currentYear; y++) {
      list.push(y);
    }
    return list;
  }

  const milestones = new Set<number>();
  milestones.add(birthYear); // Age 0: The Arrival

  if (currentAge >= 5) milestones.add(birthYear + 5); // Childhood
  if (currentAge >= 10) milestones.add(birthYear + 10); // First Decade
  if (currentAge >= 16 && currentAge < 18) milestones.add(birthYear + 16);
  if (currentAge >= 18) milestones.add(birthYear + 18); // Adulthood
  if (currentAge >= 21) milestones.add(birthYear + 21); // Golden Milestone
  if (currentAge >= 25 && currentAge < 35) milestones.add(birthYear + 25);
  if (currentAge >= 30) milestones.add(birthYear + 30);
  if (currentAge >= 40) milestones.add(birthYear + 40);
  if (currentAge >= 50) milestones.add(birthYear + 50);
  if (currentAge >= 60) milestones.add(birthYear + 60);

  milestones.add(currentYear); // Today

  let sorted = Array.from(milestones).sort((a, b) => a - b);
  if (sorted.length > 6) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const middle = sorted.slice(1, sorted.length - 1);
    const step = Math.ceil(middle.length / 4);
    const sampledMiddle = middle.filter((_, idx) => idx % step === 0);
    sorted = [first, ...sampledMiddle, last];
  }
  return sorted;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  recipientName,
  birthYear = 1998,
  currentAge = 28,
  onNext
}) => {
  const prefersReduced = useReducedMotion();
  const currentYear = birthYear + currentAge;
  const firstName = recipientName ? recipientName.trim().split(' ')[0] : 'Friend';

  // Build smart curated array of milestone years
  const allYears = useMemo(() => {
    return getSmartTimelineYears(birthYear, currentAge);
  }, [birthYear, currentAge]);

  const [activeYearIndex, setActiveYearIndex] = useState<number>(0);
  const [expandedYear, setExpandedYear] = useState<number | null>(allYears[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // Dynamically start journey
  const [showStatusToast, setShowStatusToast] = useState<string | null>(null);
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackContainerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeYear = allYears[activeYearIndex] || allYears[0];
  const activeAge = activeYear - birthYear;
  const isAtCurrentYear = activeYearIndex === allYears.length - 1;

  // Get data for active year
  const eventData: YearEvent = (worldEventsData as Record<string, YearEvent>)[String(activeYear)] || {
    year: activeYear,
    worldEvent: activeAge === 0 ? "The world welcomed a luminous new soul into its constellation ✨" : "Another unforgettable year of growth, laughter, and cherished memories.",
    songTitle: "Timeless Melody",
    songArtist: "Top Hits Ensemble",
    movieTitle: "A Cinematic Classic",
    movieGenre: "Drama & Adventure",
    funTrivia: "The world was just getting ready for you ✨",
    indiaMilestone: "India accelerated bold national achievements in space, culture, and technology.",
    topIndianCity: {
      name: "New Delhi & Mumbai",
      highlight: "Vibrant capital culture and timeless coastlines.",
      imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop&q=80"
    }
  };

  // Graceful, snappy dynamic journey progression (3.2s per milestone)
  useEffect(() => {
    if (!isPlaying || prefersReduced) return;
    const timer = setInterval(() => {
      setActiveYearIndex((prev) => {
        if (prev >= allYears.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        setExpandedYear(allYears[next]);
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [isPlaying, allYears, prefersReduced]);

  // Smoothly scroll active milestone into center view
  useEffect(() => {
    if (nodeRefs.current[activeYearIndex]) {
      nodeRefs.current[activeYearIndex]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [activeYearIndex]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      setShowStatusToast(next ? '▶ Journey Resumed' : '⏸ Paused (Tap to Resume)');
      setTimeout(() => setShowStatusToast(null), 1500);
      return next;
    });
  };

  const handleSelectYear = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(false);
    setActiveYearIndex(idx);
    setExpandedYear(allYears[idx]);
    setShowStatusToast('⏸ Paused (Tap to Resume)');
    setTimeout(() => setShowStatusToast(null), 1500);
  };

  const handleFastForwardToPresent = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(false);
    setActiveYearIndex(allYears.length - 1);
    setExpandedYear(allYears[allYears.length - 1]);
  };

  // Ambient Particles Canvas with Node Gravitation
  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: 2,
      baseSpeed: 0.3 + Math.random() * 0.5,
      alpha: 0.15 + Math.random() * 0.25,
      sineOffset: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let targetX: number | null = null;
      let targetY: number | null = null;

      if (hoveredNodeIndex !== null && nodeRefs.current[hoveredNodeIndex]) {
        const rect = nodeRefs.current[hoveredNodeIndex]!.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      particles.forEach((p, i) => {
        p.y -= p.baseSpeed;
        p.x += Math.sin(p.y * 0.02 + p.sineOffset) * 0.4;

        if (p.y < 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        if (targetX !== null && targetY !== null && i < 5) {
          p.x += (targetX - p.x) * 0.04;
          p.y += (targetY - p.y) * 0.04;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 169, 110, ${p.alpha})`;
        ctx.shadowColor = '#C8A96E';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [hoveredNodeIndex, prefersReduced]);

  const progressPercent = (activeYearIndex / Math.max(1, allYears.length - 1)) * 100;

  return (
    <div
      onClick={togglePlayPause}
      className="fixed inset-0 w-full h-full bg-void text-text-1 flex flex-col justify-between py-2 sm:py-4 px-3 sm:px-6 overflow-hidden select-none min-h-[100dvh] cursor-pointer"
      title="Tap anywhere to pause or resume the journey"
    >
      {/* Radial Vignette Darkening */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,20,32,0.6)_0%,#06060A_85%)] pointer-events-none z-0" />

      {/* Ambient Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" aria-hidden="true" />

      {/* FLOATING STATUS HUD TOAST */}
      <AnimatePresence>
        {showStatusToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface-elevated/95 border border-accent/50 text-accent font-mono text-xs font-bold shadow-[0_0_25px_rgba(200,169,110,0.4)] backdrop-blur-2xl pointer-events-none"
          >
            {showStatusToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP: Apple-Grade Glassmorphic Dynamic Progress Scrubber Bar */}
      <header
        onClick={(e) => e.stopPropagation()}
        className="relative z-30 w-full max-w-4xl mx-auto pt-1 cursor-default"
      >
        <div className="bg-surface-elevated/90 border border-white/[0.14] rounded-2xl sm:rounded-full p-2.5 sm:px-5 sm:py-2.5 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Header Title Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-400/40 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
              ⏳
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold block">
                {firstName.toUpperCase()}'S LIVING TIMELINE
              </span>
              <h1 className="text-xs sm:text-sm font-display font-bold text-white tracking-tight">
                {activeYear} • <span className="text-accent">{activeAge === 0 ? 'Birth Year ✨' : `Age ${activeAge}`}</span>
              </h1>
            </div>
          </div>

          {/* Interactive Apple-Style Scrubber Pill */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md mx-auto w-full px-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              aria-label={isPlaying ? 'Pause journey' : 'Play journey'}
              className="w-7 h-7 rounded-full bg-accent text-void flex items-center justify-center shadow-glow-sm hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer font-bold"
              title={isPlaying ? 'Pause journey' : 'Resume journey'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>

            {/* Custom Track Scrubber with Glow Fill */}
            <div className="relative flex-1 flex items-center group cursor-pointer py-1">
              <input
                type="range"
                min="0"
                max={allYears.length - 1}
                value={activeYearIndex}
                onChange={(e) => handleSelectYear(parseInt(e.target.value, 10), e as any)}
                onClick={(e) => e.stopPropagation()}
                className="gold-scrubber w-full h-2 bg-white/[0.12] rounded-full cursor-pointer accent-[#D4AF37] relative z-10"
              />
              {/* Active Golden Progress Fill */}
              <div
                className="absolute left-0 h-2 bg-gradient-to-r from-amber-500 to-[#E5C178] rounded-full pointer-events-none transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Fast-Forward / Jump to Present Button */}
            {!isAtCurrentYear && (
              <button
                onClick={handleFastForwardToPresent}
                className="text-[10px] font-mono font-bold text-accent bg-accent/15 hover:bg-accent hover:text-void border border-accent/40 px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1"
                title="Jump to Current Year"
              >
                <span>⚡ {currentYear}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CENTERPIECE: Milestone Nodes on Glowing Track */}
      <div
        ref={trackContainerRef}
        className="relative z-10 my-auto py-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center"
      >
        {/* SVG Glowing Track Line with Top Clearance for Labels */}
        <div className="relative w-full flex items-center justify-between px-6 sm:px-12 pt-8 pb-3 overflow-x-auto no-scrollbar">
          {/* Central Glowing Track SVG */}
          <svg className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 w-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 6px #C8A96E) drop-shadow(0 0 18px rgba(200,169,110,0.4))' }}>
            <defs>
              <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(200,169,110,0.1)" />
                <stop offset="50%" stopColor="#C8A96E" />
                <stop offset="100%" stopColor="rgba(200,169,110,0.1)" />
              </linearGradient>
            </defs>
            <line x1="24" y1="12" x2="calc(100% - 24px)" y2="12" stroke="url(#trackGrad)" strokeWidth="2" />
          </svg>

          {/* Milestone Nodes */}
          <div className="relative flex items-center justify-between w-full min-w-[580px] gap-2">
            {allYears.map((year, idx) => {
              const age = year - birthYear;
              const isKey = (age === 0 || age === 5 || age === 10 || age === 15 || age === 18 || age === 21 || age === 25 || age === 30 || age === 40 || age === 50 || age === currentAge) && !(age === 1 && currentAge > 1);
              const isActive = activeYearIndex === idx;

              return (
                <div key={year} className="relative flex flex-col items-center">
                  {/* Special Node Rotating Dashed Border */}
                  {isKey && (
                    <div className="absolute -top-7 flex flex-col items-center pointer-events-none whitespace-nowrap z-20">
                      <span className="font-display font-bold text-[10px] sm:text-[11px] text-accent tracking-tight bg-void/90 px-2 py-0.5 rounded-full border border-accent/40 shadow-sm">
                        {year} 🎂 {age}y
                      </span>
                    </div>
                  )}

                  <button
                    ref={(el) => (nodeRefs.current[idx] = el)}
                    onClick={(e) => handleSelectYear(idx, e)}
                    onMouseEnter={() => setHoveredNodeIndex(idx)}
                    onMouseLeave={() => setHoveredNodeIndex(null)}
                    aria-label={`Milestone year ${year}, age ${age}`}
                    className={`relative z-10 flex items-center justify-center transition-all duration-200 outline-none cursor-pointer ${
                      isKey ? 'w-6 h-6' : 'w-4 h-4'
                    }`}
                  >
                    {isKey && (
                      <svg className="absolute inset-0 w-full h-full animate-rotate-dash pointer-events-none">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#C8A96E" strokeWidth="1.5" strokeDasharray="4 3" />
                      </svg>
                    )}

                    <motion.div
                      whileHover={prefersReduced ? undefined : { scale: 1.35, boxShadow: '0 0 32px rgba(200,169,110,0.8)' }}
                      className={`rounded-full transition-colors ${
                        isActive
                          ? 'w-4 h-4 bg-gold shadow-gold-bloom ring-2 ring-white'
                          : 'w-3 h-3 bg-gold-dim border border-gold hover:bg-gold hover:shadow-gold-glow'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nostalgia Capsule (Opens completely with rich historic details & India progress + city photo) */}
        <div className="w-full flex justify-center mt-2 sm:mt-3 px-3">
          <AnimatePresence mode="wait">
            {expandedYear !== null && (
              <motion.div
                key={activeYear}
                initial={prefersReduced ? { opacity: 0 } : { scale: 0.92, y: 15, opacity: 0 }}
                animate={prefersReduced ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { scale: 0.92, y: -15, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[420px] sm:max-w-xl bg-surface/95 border border-white/[0.14] rounded-3xl p-4 sm:p-5 backdrop-blur-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-left space-y-3 max-h-[62vh] sm:max-h-[68vh] overflow-y-auto no-scrollbar cursor-default"
              >
                {/* Header Row: Year Badge & Play/Pause Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-accent bg-accent/15 px-2.5 py-0.5 rounded-full border border-accent/30">
                      📅 {activeYear} • Age {activeAge}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-text-2 font-medium">
                      {isPlaying ? '● Auto-playing (4.8s)' : '⏸ Paused'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    aria-label={isPlaying ? 'Pause journey' : 'Resume journey'}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-accent hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] px-3 py-1 rounded-full transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Resume'}
                  >
                    {isPlaying ? <Pause size={10} className="fill-current" /> : <Play size={10} className="fill-current" />}
                    <span>{isPlaying ? 'Pause' : 'Resume'}</span>
                  </button>
                </div>

                {/* Main Historic Incident */}
                <div>
                  <h2 className="text-base sm:text-lg font-display font-bold text-white leading-tight">
                    {activeAge === 0 ? `${firstName}'s Golden Arrival ✨` : `Turning ${activeAge}: Landmark World Moments`}
                  </h2>
                  <p className="text-xs sm:text-sm font-body text-text-1/90 leading-[1.6] pt-1.5 font-medium">
                    {eventData.worldEvent}
                  </p>
                </div>

                {/* Indian Progress Milestone (Prominent Section) */}
                {eventData.indiaMilestone && (
                  <div className="bg-gradient-to-r from-orange-500/10 via-white/[0.04] to-emerald-500/10 border border-orange-500/20 rounded-2xl p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🇮🇳</span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300">
                        India's Historic Milestone in {activeYear}
                      </span>
                    </div>
                    <p className="text-xs text-text-1 leading-relaxed font-medium">
                      {eventData.indiaMilestone}
                    </p>
                  </div>
                )}

                {/* Top Visited Indian City with Real Photo */}
                {eventData.topIndianCity && (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-2.5 flex items-center gap-3">
                    <img
                      src={eventData.topIndianCity.imageUrl}
                      alt={eventData.topIndianCity.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-sm"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-accent uppercase tracking-wider">
                        <span>🏛️ Trending Destination</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {eventData.topIndianCity.name}
                      </h4>
                      <p className="text-[11px] text-text-2 line-clamp-2 mt-0.5 leading-snug">
                        {eventData.topIndianCity.highlight}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cultural Artifacts: Song & Cinema */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="flex items-center gap-2.5 bg-white/[0.04] p-2.5 rounded-2xl border border-white/[0.08]">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-accent text-sm flex-shrink-0">
                      🎵
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-text-3 font-bold block">Top Anthem</span>
                      <h4 className="text-xs font-bold text-white truncate">{eventData.songTitle}</h4>
                      <p className="text-[10px] text-text-2 truncate">{eventData.songArtist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white/[0.04] p-2.5 rounded-2xl border border-white/[0.08]">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm flex-shrink-0">
                      🎬
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-text-3 font-bold block">Hit Cinema</span>
                      <h4 className="text-xs font-bold text-white truncate">{eventData.movieTitle}</h4>
                      <p className="text-[10px] text-text-2 truncate">{eventData.movieGenre}</p>
                    </div>
                  </div>
                </div>

                {/* Nostalgia Trivia */}
                <div className="bg-accent/10 border border-accent/25 rounded-xl px-3 py-2 flex items-start gap-2">
                  <span className="text-accent text-xs">✨</span>
                  <p className="font-serif italic text-xs text-accent-hover leading-relaxed">
                    "{eventData.funTrivia}"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER: Only show "Open 3D Polaroid Album" when reached Current Year */}
      <footer
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 pb-2 max-w-md mx-auto w-full flex flex-col items-center gap-2 cursor-default"
      >
        <AnimatePresence mode="wait">
          {isAtCurrentYear ? (
            <motion.button
              key="current-year-btn"
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              onClick={onNext}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-extrabold text-sm tracking-wider shadow-[0_0_30px_rgba(200,169,110,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <span>Open 3D Memory Album 🎉</span>
              <ArrowRight size={16} />
            </motion.button>
          ) : (
            <motion.div
              key="in-progress-pill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-text-2 font-mono"
            >
              <span>Journeying to {currentYear}... ({allYears.length - 1 - activeYearIndex}y left)</span>
              <button
                onClick={handleFastForwardToPresent}
                className="text-accent font-bold hover:underline cursor-pointer"
              >
                Skip to Today →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
};
