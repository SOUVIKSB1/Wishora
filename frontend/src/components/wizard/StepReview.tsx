import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Sparkles, Send, Calendar, Clock, ExternalLink, MessageCircle } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import confetti from 'canvas-confetti';

import { Folder } from '../../types/contact.js';

interface StepReviewProps {
  formData: any;
  photos: any[];
  folders?: Folder[];
  onFolderChange?: (folderId: string) => void;
  isGenerating: boolean;
  generatedSlug?: string;
  onGenerate: () => void;
  onDone: () => void;
}

const FUN_LOADER_PHRASES = [
  'Wrapping the wish in velvet gold...',
  'Teaching candles to flicker with real physics...',
  'Hiding confetti cannons inside the envelope...',
  'Tuning the musical frequencies...',
  'Polishing the wax seal...'
];

export const StepReview: React.FC<StepReviewProps> = ({
  formData,
  photos,
  folders = [],
  onFolderChange,
  isGenerating,
  generatedSlug,
  onGenerate,
  onDone
}) => {
  const [loaderIndex, setLoaderIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoaderIndex(i => (i + 1) % FUN_LOADER_PHRASES.length);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (generatedSlug) {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [generatedSlug]);

  const shareUrl = generatedSlug ? `${window.location.origin}/w/${generatedSlug}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🎉✨ Happy Birthday ${formData.recipient_name}! ✨🎉\n\nI created a personal 3D cinematic birthday experience just for you on WISHORA.\n\n👉 Open your experience here: ${shareUrl}\n\nMake a wish, blow out the candles, and let me know what you think! 🎂🥂`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSms = () => {
    const text = encodeURIComponent(
      `Happy Birthday ${formData.recipient_name}! 🎂 Open your personal 3D surprise experience: ${shareUrl}`
    );
    window.open(`sms:?&body=${text}`, '_blank');
  };

  if (generatedSlug) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent shadow-[0_0_30px_rgba(200,169,110,0.3)]">
          <Sparkles size={28} />
        </div>

        <div>
          <span className="text-xs font-mono tracking-widest text-accent uppercase">EXPERIENCE IS READY</span>
          <h2 className="text-3xl font-display font-bold text-text-1 mt-1">
            Sealed for {formData.recipient_name}
          </h2>
          <p className="text-xs text-text-2 mt-1.5 max-w-sm mx-auto">
            Your cinematic birthday experience link is live. Send it whenever you are ready!
          </p>
        </div>

        {/* Link box */}
        <div className="bg-surface-elevated/80 border border-accent/30 rounded-2xl p-3 flex items-center justify-between gap-3 max-w-md mx-auto backdrop-blur-xl">
          <span className="text-xs font-mono text-text-1 truncate pl-2">{shareUrl}</span>
          <VelvetButton
            size="sm"
            variant="primary"
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </VelvetButton>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-medium transition-all"
          >
            <MessageCircle size={15} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleSms}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 text-xs font-medium transition-all"
          >
            <Send size={14} />
            <span>SMS Message</span>
          </button>

          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-text-1 hover:bg-white/[0.1] text-xs font-medium transition-all"
          >
            <ExternalLink size={14} />
            <span>Preview Link</span>
          </a>
        </div>

        <div className="pt-4">
          <VelvetButton size="md" variant="secondary" onClick={onDone} className="w-full max-w-xs mx-auto">
            Back to Dashboard
          </VelvetButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold text-text-2 uppercase tracking-wider block">
          Review & Cinematic Package
        </label>
        <p className="text-xs text-text-3 mt-0.5">Everything is staged and ready for link generation.</p>
      </div>

      {/* Summary Matrix */}
      <div className="bg-surface-elevated/70 border border-white/[0.08] rounded-3xl p-5 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <span className="text-xs text-text-3 font-mono uppercase">RECIPIENT</span>
          <span className="text-sm font-bold text-text-1">{formData.recipient_name}</span>
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <span className="text-xs text-text-3 font-mono uppercase">DATE OF BIRTH</span>
          <span className="text-xs font-mono text-text-2">{formData.recipient_dob}</span>
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <span className="text-xs text-text-3 font-mono uppercase">PHOTOS IN ALBUM</span>
          <span className="text-xs font-medium text-accent">{photos.length} photos staged</span>
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <span className="text-xs text-text-3 font-mono uppercase">EXPERIENCE RUNTIME</span>
          <span className="text-xs font-mono text-text-2">~90 Seconds</span>
        </div>

        {folders.length > 0 && onFolderChange && (
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs text-text-3 font-mono uppercase">SAVE TO FOLDER</span>
            <select
              value={formData.folder_id || (folders[0]?.id || '')}
              onChange={(e) => onFolderChange(e.target.value)}
              className="bg-void border border-white/20 hover:border-gold rounded-xl px-3 py-1.5 text-xs text-text-1 focus:border-gold outline-none cursor-pointer font-medium"
            >
              {folders.map(f => (
                <option key={f.id} value={f.id} className="bg-[#0F0F18] text-white">
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <span className="text-xs text-text-3 font-mono uppercase block mb-1">MESSAGE SNEAK PEEK</span>
          <p className="font-serif italic text-text-1 text-sm bg-void/50 p-3 rounded-xl border border-white/[0.05] line-clamp-3">
            "{formData.wish_text || 'Happy Birthday!'}"
          </p>
        </div>
      </div>

      {/* Progressive Generation Loading Screen */}
      {isGenerating ? (
        <div className="p-6 rounded-2xl bg-surface-elevated/80 border border-accent/30 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-serif italic text-accent animate-pulse">
            "{FUN_LOADER_PHRASES[loaderIndex]}"
          </p>
        </div>
      ) : (
        <div className="pt-2">
          <VelvetButton
            size="lg"
            variant="glow"
            icon={<Sparkles size={18} />}
            onClick={onGenerate}
            className="w-full"
          >
            Generate Sealed Experience Link
          </VelvetButton>
        </div>
      )}
    </div>
  );
};
