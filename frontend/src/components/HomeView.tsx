import React, { useState, useEffect } from 'react';
import { Contact } from '../types/contact.js';
import { Wish } from '../types/wish.js';
import { Sparkles, Calendar, Plus, Play, Eye, Video, ArrowRight, Heart, PartyPopper, Clock, Cake, Compass, Film, Flame, Star, ShieldCheck, Share2, MessageCircle, ExternalLink, Check, Crown, BookOpen, Users } from 'lucide-react';
import { VelvetButton } from './ui/VelvetButton.js';
import { GlowBadge } from './ui/GlowBadge.js';
import { AuraHalfCircle } from './ui/AuraHalfCircle.js';
import confetti from 'canvas-confetti';
import { getAvatarUrl } from '../utils/avatar.js';

interface HomeViewProps {
  user: any;
  contacts: Contact[];
  wishes: Wish[];
  stats: any;
  onNewWish: () => void;
  onSelectWish?: (wish: Wish) => void;
  onCreateWishForContact: (contact: Contact) => void;
  onPreviewExperience: (slug: string) => void;
  onNavigateToTab: (tab: 'contacts' | 'wishbook' | 'profile') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  contacts,
  wishes,
  stats,
  onNewWish,
  onSelectWish,
  onCreateWishForContact,
  onPreviewExperience,
  onNavigateToTab
}) => {
  const drafts = wishes.filter(w => w.status === 'draft');
  const upcomingContacts = contacts.slice(0, 6);
  const recentWishes = wishes.filter(w => w.status === 'generated' || w.status === 'sent').slice(0, 4);

  // User Birthday Countdown calculations
  const [personalTimeLeft, setPersonalTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    progressPercent: 100
  });

  const bdayInfo = user?.birthday_info;

  useEffect(() => {
    if (!user?.user_dob) return;

    const tick = () => {
      const parts = user.user_dob.split('-');
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const now = new Date();
      const currentYear = now.getFullYear();

      let target = new Date(currentYear, month, day, 0, 0, 0);
      if (target.getTime() < now.getTime()) {
        target = new Date(currentYear + 1, month, day, 0, 0, 0);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setPersonalTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, progressPercent: 100 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const progressPercent = Math.max(0, Math.min(100, 100 - (days / 365) * 100));

      setPersonalTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        progressPercent
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [user?.user_dob]);

  const isUserBirthdayToday = bdayInfo?.is_today || personalTimeLeft.days === 0;

  const triggerBirthdayConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#F472B6', '#38BDF8', '#34D399']
    });
  };

  const [copiedWishSlug, setCopiedWishSlug] = useState<string | null>(null);

  const handleCopyShareLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`);
    setCopiedWishSlug(slug);
    setTimeout(() => setCopiedWishSlug(null), 2000);
  };

  const handleFastShareWhatsApp = (w: Wish) => {
    const shareUrl = `${window.location.origin}/w/${w.slug}`;
    const text = encodeURIComponent(`✨ Happy Birthday ${w.recipient_name}! I directed a bespoke birthday film experience just for you: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const getRelationshipColor = (rel: string) => {
    const lower = (rel || '').toLowerCase();
    if (lower.includes('partner') || lower.includes('love') || lower.includes('spouse') || lower.includes('wife') || lower.includes('husband')) {
      return { variant: 'rose' as const, dot: 'bg-pink-400' };
    }
    if (lower.includes('friend') || lower.includes('bestie')) {
      return { variant: 'cyan' as const, dot: 'bg-sky-400' };
    }
    if (lower.includes('mom') || lower.includes('dad') || lower.includes('family') || lower.includes('sister') || lower.includes('brother')) {
      return { variant: 'emerald' as const, dot: 'bg-emerald-400' };
    }
    return { variant: 'gold' as const, dot: 'bg-amber-400' };
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = (user?.display_name || 'Friend').split(' ')[0];

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* ─── CLEAN & ELEGANT ANIMATED HERO GREETING ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#12101e] via-[#0b0914] to-[#151124] border border-white/[0.12] p-5 sm:p-7 backdrop-blur-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] group">
        {/* Animated eye-soothing half-circle corner auras */}
        <AuraHalfCircle position="top-right" variant="gold-purple" size="lg" opacity={0.75} />
        <AuraHalfCircle position="bottom-left" variant="cyan-emerald" size="md" opacity={0.5} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-mono text-amber-300">
              <Sparkles size={13} className="text-amber-400 animate-spin-slow" />
              <span>{getGreeting()}, {firstName} ✨</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight leading-tight">
              Direct bespoke <span className="gold-gradient-text">birthday experiences</span>
            </h1>

            <p className="text-xs sm:text-sm text-text-2 font-medium leading-relaxed">
              Create interactive 3D blow-candle cakes, nostalgic memory reels, soundscapes, and capture live video reactions.
            </p>
          </div>
        </div>
      </div>

      {/* ─── DIRECTOR'S BIRTHDAY RADAR MICRO-HUD (ISOLATED & COMPACT) ─── */}
      {user?.user_dob && (
        <div
          className={`relative bg-surface-elevated/90 border rounded-3xl p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-glass-card transition-all overflow-hidden ${
            isUserBirthdayToday
              ? 'border-pink-400/60 shadow-[0_0_30px_rgba(244,114,182,0.3)] bg-gradient-to-r from-pink-500/15 via-surface-elevated to-amber-500/15'
              : 'border-white/[0.14] hover:border-amber-400/40'
          }`}
        >
          {/* Soothing half-circle aura */}
          <AuraHalfCircle position="top-right" variant={isUserBirthdayToday ? "rose-gold" : "gold-purple"} size="sm" opacity={0.7} />

          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <div
              onClick={isUserBirthdayToday ? triggerBirthdayConfetti : undefined}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${
                isUserBirthdayToday
                  ? 'bg-gradient-to-tr from-pink-500 to-amber-400 text-void border-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.6)] cursor-pointer animate-bounce'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <Cake size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  DIRECTOR'S BIRTHDAY RADAR
                </span>
                {isUserBirthdayToday && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-bold animate-pulse">
                    🎉 TODAY
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {isUserBirthdayToday
                  ? `Happy Birthday, ${user?.display_name || 'Director'}! Tap for confetti 🎊`
                  : `Turning ${bdayInfo?.age_turning || 29} on ${bdayInfo?.birth_day || 20}/${bdayInfo?.birth_month || 5}`}
              </h3>
            </div>
          </div>

          {/* Compact Digital Countdown */}
          <div className="relative z-10 flex items-center justify-center gap-1.5 bg-void/80 border border-white/[0.1] px-3.5 py-2 rounded-2xl backdrop-blur-md self-stretch sm:self-auto">
            {[
              { label: 'D', val: personalTimeLeft.days },
              { label: 'H', val: personalTimeLeft.hours },
              { label: 'M', val: personalTimeLeft.minutes },
              { label: 'S', val: personalTimeLeft.seconds },
            ].map((item, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-mono font-black text-white text-xs sm:text-sm">
                    {String(item.val).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[9px] text-amber-400 font-bold">{item.label}</span>
                </div>
                {idx < 3 && <span className="text-white/20 text-xs font-mono">:</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ─── JEWEL-TONED QUICK STATS GRID ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          {
            label: 'WISHES DIRECTED',
            val: stats?.total_wishes ?? wishes.length,
            icon: <Film size={16} className="text-amber-300" />,
            glow: 'from-amber-500/20 to-yellow-600/5',
            auraVariant: 'gold-purple' as const,
            border: 'hover:border-amber-400/50',
            action: () => onNavigateToTab('wishbook')
          },
          {
            label: 'TIMES OPENED',
            val: stats?.total_opens ?? 0,
            icon: <Eye size={16} className="text-sky-300" />,
            glow: 'from-sky-500/20 to-blue-600/5',
            auraVariant: 'cyan-emerald' as const,
            border: 'hover:border-sky-400/50',
            action: () => onNavigateToTab('wishbook')
          },
          {
            label: 'REACTIONS CAPTURED',
            val: stats?.total_reactions ?? wishes.filter(w => !!w.reaction_url).length,
            icon: <Video size={16} className="text-pink-300" />,
            glow: 'from-pink-500/20 to-rose-600/5',
            auraVariant: 'rose-gold' as const,
            border: 'hover:border-pink-400/50',
            action: () => onNavigateToTab('wishbook')
          },
          {
            label: 'SAVED BIRTHDAYS',
            val: stats?.total_contacts ?? contacts.length,
            icon: <Calendar size={16} className="text-emerald-300" />,
            glow: 'from-emerald-500/20 to-teal-600/5',
            auraVariant: 'emerald-gold' as const,
            border: 'hover:border-emerald-400/50',
            action: () => onNavigateToTab('contacts')
          },
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={item.action}
            className={`relative overflow-hidden bg-gradient-to-b ${item.glow} bg-surface-elevated border border-white/[0.12] ${item.border} rounded-2xl p-3.5 sm:p-5 backdrop-blur-xl cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-glass-card`}
          >
            <AuraHalfCircle position="top-right" variant={item.auraVariant} size="sm" opacity={0.6} />

            <div className="relative z-10 flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[9px] sm:text-[10px] font-mono text-text-3 font-extrabold tracking-wider uppercase group-hover:text-text-1 transition-colors">
                {item.label}
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                {item.icon}
              </div>
            </div>
            <div className="relative z-10 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-display font-black text-white font-mono">
                {item.val}
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                View →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── ACTIVE DRAFTS SECTION ─── */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-base sm:text-lg font-display font-bold text-white">Active Drafts in Production</h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">
                {drafts.length} ready to complete
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('wishbook')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>View in Wishbook</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {drafts.map(d => (
              <div
                key={d.id}
                className="relative overflow-hidden bg-surface-elevated/90 border border-amber-500/35 hover:border-amber-400 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 backdrop-blur-xl group transition-all shadow-glass-card"
              >
                <AuraHalfCircle position="top-right" variant="gold-purple" size="sm" opacity={0.4} />

                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(
                      d.recipient_name,
                      (d as any).contact_avatar_url || (d as any).avatar_url,
                      (d as any).recipient_gender
                    )}
                    alt={d.recipient_name || 'Draft'}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover bg-void border border-amber-400/40 flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {d.recipient_name || 'Untitled Draft'}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-semibold uppercase flex-shrink-0">
                        {(d as any).stage ? `Stage ${(d as any).stage}/5` : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-text-2 font-serif italic truncate mt-0.5">
                      "{d.wish_text || 'Personalized customized message...'}"
                    </p>
                  </div>
                </div>

                <VelvetButton
                  size="sm"
                  variant="primary"
                  onClick={() => onSelectWish && onSelectWish(d)}
                  className="relative z-10 flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                >
                  Resume
                </VelvetButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── UPCOMING BIRTHDAYS VIP ROLODEX (Next 30 Days) ─── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-400" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white">Upcoming Birthday Calendar</h2>
          </div>
          <button
            onClick={() => onNavigateToTab('contacts')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Manage Contacts</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto pb-2 no-scrollbar">
          {upcomingContacts.length === 0 ? (
            <div className="w-full bg-surface-elevated/50 border border-dashed border-white/[0.14] rounded-3xl p-8 text-center text-xs text-text-2">
              No birthdays saved in calendar yet. <button onClick={() => onNavigateToTab('contacts')} className="text-amber-400 font-bold hover:underline">Add contacts now</button>
            </div>
          ) : (
            upcomingContacts.map(c => {
              const isToday = c.days_remaining === 0;
              const relStyle = getRelationshipColor(c.relationship);

              return (
                <div
                  key={c.id}
                  className={`relative overflow-hidden flex-shrink-0 w-60 sm:w-64 bg-surface-elevated/95 border rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 ${
                    isToday
                      ? 'border-amber-400 shadow-[0_0_30px_rgba(212,175,55,0.35)] bg-gradient-to-b from-amber-500/15 to-surface-elevated'
                      : 'border-white/[0.14] hover:border-white/[0.28] shadow-glass-card'
                  }`}
                >
                  <AuraHalfCircle position="top-right" variant={isToday ? "gold-purple" : "cyan-emerald"} size="sm" opacity={0.4} />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      {isToday ? (
                        <GlowBadge variant="gold">TODAY 🎉</GlowBadge>
                      ) : c.days_remaining <= 7 ? (
                        <GlowBadge variant="rose">in {c.days_remaining}d</GlowBadge>
                      ) : (
                        <GlowBadge variant="ghost">in {c.days_remaining}d</GlowBadge>
                      )}
                      <span className="text-xs font-mono text-text-3 font-bold">{c.dob_day}/{c.dob_month}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarUrl(c.name, c.avatar_url, c.gender)}
                        alt={c.name}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover bg-void flex-shrink-0 border ${
                          isToday ? 'border-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/[0.14]'
                        }`}
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">{c.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${relStyle.dot}`} />
                          <p className="text-xs text-text-2 font-medium truncate">{c.relationship}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <VelvetButton
                      size="sm"
                      variant={isToday ? 'glow' : 'primary'}
                      icon={<Sparkles size={13} />}
                      onClick={() => onCreateWishForContact(c)}
                      className="w-full font-bold cursor-pointer justify-center"
                    >
                      Direct Wish
                    </VelvetButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RECENT EXPERIENCES DIRECTED ─── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-amber-400" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white">Recent Experiences</h2>
          </div>
          <button
            onClick={() => onNavigateToTab('wishbook')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Wishbook</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {recentWishes.length === 0 ? (
            <div className="col-span-full border border-dashed border-white/[0.14] rounded-3xl p-8 text-center text-xs text-text-2">
              No generated experiences yet. <button onClick={onNewWish} className="text-amber-400 font-bold hover:underline">Direct your first film</button>
            </div>
          ) : (
            recentWishes.map(w => (
              <div
                key={w.id}
                className="relative overflow-hidden bg-surface-elevated/90 border border-white/[0.14] hover:border-amber-400/50 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 backdrop-blur-xl group transition-all duration-200 hover:-translate-y-0.5 shadow-glass-card"
              >
                <AuraHalfCircle position="top-right" variant="sunset" size="sm" opacity={0.35} />

                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(
                      w.recipient_name,
                      (w as any).contact_avatar_url || (w as any).avatar_url,
                      (w as any).recipient_gender
                    )}
                    alt={w.recipient_name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover bg-void border border-white/[0.16] flex-shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {w.recipient_name}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-text-2 font-semibold uppercase flex-shrink-0">
                        {w.theme || 'Cinematic'}
                      </span>
                    </div>
                    <p className="text-xs text-text-2 font-serif italic truncate mt-0.5">
                      "{w.wish_text || 'Happy Birthday!'}"
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/[0.08] gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleFastShareWhatsApp(w)}
                      className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer"
                      title="Share on WhatsApp"
                    >
                      <MessageCircle size={13} />
                    </button>

                    <button
                      onClick={() => handleCopyShareLink(w.slug)}
                      className="p-2 rounded-xl bg-white/[0.08] border border-white/[0.12] text-text-2 hover:text-white hover:bg-white/[0.15] transition-all cursor-pointer flex items-center gap-1 text-xs"
                      title="Copy sealed link"
                    >
                      {copiedWishSlug === w.slug ? <Check size={13} className="text-emerald-400" /> : <ExternalLink size={13} />}
                      <span className="text-[10px] font-mono font-bold">{copiedWishSlug === w.slug ? 'Copied' : 'Link'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onPreviewExperience(w.slug)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-black text-xs shadow-[0_0_20px_rgba(200,169,110,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play size={12} className="fill-[#06060A]" />
                    <span>Play Film</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

