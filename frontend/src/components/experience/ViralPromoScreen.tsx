import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Copy, Check, Share2, ArrowRight } from 'lucide-react';

interface ViralPromoScreenProps {
  slug: string;
  recipientName?: string;
  senderName?: string;
  onRestartOrHome: () => void;
}

export const ViralPromoScreen: React.FC<ViralPromoScreenProps> = ({
  slug,
  recipientName = 'Friend',
  senderName = 'Someone who cares about you',
  onRestartOrHome
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fullWishURL = `${window.location.origin}/w/${slug}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉✨ You've got a surprise birthday experience! ✨🎉\n\nHey ${recipientName || 'Friend'}! A personal 3D cinematic birthday experience was crafted just for you on WISHORA.\n\n👉 Open your experience here: ${fullWishURL}\n\nMake a wish, blow out the candles, and explore your memory lane! 🎂💛`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleInstagram = () => {
    navigator.clipboard.writeText(fullWishURL);
    showToast('Experience link copied! Paste into your IG Story 📸');
  };

  const handleTwitterX = () => {
    const text = encodeURIComponent(
      `🎂 A bespoke 3D cinematic birthday experience made with love on WISHORA! ✨ Check it out: ${fullWishURL}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullWishURL);
    setCopiedLink(true);
    showToast('Experience link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My WISHORA Birthday Experience',
          text: 'Check out this bespoke 3D birthday experience created on WISHORA!',
          url: fullWishURL,
        });
      } catch (e) {}
    }
  };

  return (
    <motion.div
      initial={{ y: '100vh' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className="relative w-full min-h-screen bg-void text-text-1 flex flex-col justify-between items-center py-8 px-4 sm:px-8 select-none overflow-y-auto"
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 z-50 bg-[rgba(30,215,96,0.15)] border border-[rgba(30,215,96,0.4)] text-[#1ED760] font-body text-sm rounded-full px-6 py-3 backdrop-blur-xl shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 Animated Background Accent Circles */}
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-[rgba(200,169,110,0.04)] filter blur-[80px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] rounded-full bg-[rgba(232,121,160,0.03)] filter blur-[80px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[rgba(59,130,246,0.02)] filter blur-[80px] pointer-events-none z-0" />

      {/* SECTION 1 — THE EMOTIONAL RECAP */}
      <header className="relative z-10 text-center max-w-[360px] mx-auto pt-2">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-pulse border border-[rgba(200,169,110,0.2)] text-gold font-body text-xs mb-3 shadow-gold-glow"
        >
          <span>🎂 Just for you</span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="text-2xl sm:text-[32px] font-display font-medium text-text-1 leading-[1.2]"
        >
          You just experienced something special.
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm sm:text-[15px] font-body text-text-2 leading-[1.6] mt-3"
        >
          <span className="text-text-1 font-semibold">{senderName}</span> made this just for you — in about 3 minutes.
        </motion.p>
      </header>

      {/* SECTION 2 — THE OFFER (Cards A & B) */}
      <div className="relative z-10 my-8 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CARD A — CREATE FOR A FRIEND (Primary CTA) */}
        <div
          className="rounded-[24px] p-6 sm:p-7 flex flex-col justify-between text-left shadow-glass-card border"
          style={{
            background: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))',
            borderColor: 'rgba(200,169,110,0.35)',
          }}
        >
          <div>
            {/* Avatars row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center -space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gold to-gold-dim border border-void" />
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink to-rose-400 border border-void" />
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue to-cyan-400 border border-void" />
              </div>
              <span className="text-xs font-body text-text-2">+24 people wished today</span>
            </div>

            <div className="text-4xl mb-2">🎁</div>

            <h2 className="text-lg sm:text-[20px] font-display font-semibold text-text-1 leading-[1.3]">
              Create a wish for someone you love
            </h2>

            <p className="text-xs sm:text-[13px] font-body text-text-2 mt-1.5 leading-relaxed">
              It takes 3 minutes. They'll remember it forever.
            </p>
          </div>

          <div className="pt-6">
            <button
              onClick={onRestartOrHome}
              className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-gold via-[#E2C792] to-gold-dim text-[#06060A] font-body font-bold text-[15px] shadow-gold-glow flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.97] transition-all"
            >
              <span>Start creating →</span>
            </button>
            <p className="text-[11px] font-body text-text-3 text-center mt-2.5">
              Free to start • No credit card
            </p>
          </div>
        </div>

        {/* CARD B — DOWNLOAD APP (Secondary CTA) */}
        <div className="bg-glass border border-glass-border rounded-[24px] p-6 sm:p-7 flex flex-col justify-between text-left shadow-glass-card">
          <div>
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void font-display font-black text-xl shadow-gold-glow mb-4">
              W
            </div>

            <h2 className="text-base sm:text-[18px] font-display font-medium text-text-1 leading-snug">
              Get WISHORA on your phone
            </h2>

            <p className="text-xs sm:text-[13px] font-body text-text-2 mt-1.5 leading-relaxed">
              Create from anywhere. Birthday reminders built in.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-6">
            <button
              onClick={() => showToast('WISHORA App Store link coming soon!')}
              className="flex-1 py-2.5 px-3 rounded-[12px] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-text-1 font-body font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>🍎 App Store</span>
            </button>

            <button
              onClick={() => showToast('WISHORA Google Play link coming soon!')}
              className="flex-1 py-2.5 px-3 rounded-[12px] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-text-1 font-body font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>▶ Google Play</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3 — SOCIAL SHARING (1-click) */}
      <div className="relative z-10 w-full max-w-md text-center space-y-3 pb-6">
        <span className="text-[13px] font-body font-medium text-text-2 block">
          Share the love 🌍
        </span>

        <div className="flex items-center justify-center gap-3 overflow-x-auto py-1">
          {/* WhatsApp */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleWhatsApp}
              aria-label="Share via WhatsApp"
              className="w-[52px] h-[52px] rounded-full bg-glass border border-glass-border flex items-center justify-center text-[#25D366] hover:scale-110 active:scale-95 transition-all shadow-md"
            >
              <MessageCircle size={22} />
            </button>
            <span className="text-[10px] font-body font-medium text-text-2">WhatsApp</span>
          </div>

          {/* Instagram */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleInstagram}
              aria-label="Share to Instagram"
              className="w-[52px] h-[52px] rounded-full bg-glass border border-glass-border flex items-center justify-center text-[#E1306C] hover:scale-110 active:scale-95 transition-all shadow-md"
            >
              <Sparkles size={20} />
            </button>
            <span className="text-[10px] font-body font-medium text-text-2">Instagram</span>
          </div>

          {/* Twitter / X */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleTwitterX}
              aria-label="Share to Twitter X"
              className="w-[52px] h-[52px] rounded-full bg-glass border border-glass-border flex items-center justify-center text-[#F2F2F2] hover:scale-110 active:scale-95 transition-all shadow-md font-bold text-sm"
            >
              𝕏
            </button>
            <span className="text-[10px] font-body font-medium text-text-2">Twitter/X</span>
          </div>

          {/* Copy Link */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleCopyLink}
              aria-label="Copy Experience Link"
              className="w-[52px] h-[52px] rounded-full bg-glass border border-glass-border flex items-center justify-center text-gold hover:scale-110 active:scale-95 transition-all shadow-md"
            >
              {copiedLink ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
            </button>
            <span className="text-[10px] font-body font-medium text-text-2">Copy Link</span>
          </div>

          {/* Native Web Share */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleNativeShare}
                aria-label="Share via system dialog"
                className="w-[52px] h-[52px] rounded-full bg-glass border border-glass-border flex items-center justify-center text-blue hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                <Share2 size={20} />
              </button>
              <span className="text-[10px] font-body font-medium text-text-2">More...</span>
            </div>
          )}
        </div>
      </div>

      {/* WISHORA BRANDING FOOTER */}
      <footer className="relative z-10 text-center pb-2">
        <a
          href="https://wishora.app"
          target="_blank"
          rel="noreferrer"
          className="text-[12px] font-body text-text-3 hover:text-text-2 transition-colors flex items-center justify-center gap-1"
        >
          <span>Made with</span>
          <span className="font-display font-bold text-text-2 tracking-wider">
            WISH<span className="text-gold animate-pulse">O</span>RA
          </span>
        </a>
      </footer>
    </motion.div>
  );
};
