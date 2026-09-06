import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Sparkles, Check, Share2, PlusSquare, ArrowRight } from 'lucide-react';
import { VelvetButton } from './VelvetButton.js';
import { haptic } from '../../utils/haptics.js';
import { AuraHalfCircle } from './AuraHalfCircle.js';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose, deferredPrompt }) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    setIsAndroid(/android/i.test(ua));
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    haptic.celebrate();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setTimeout(() => onClose(), 2000);
      }
    } else {
      // Fallback: create downloadable browser web shortcut / PWA link
      const blob = new Blob([
        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${window.location.origin}"><title>WISHORA</title></head><body><script>window.location.href="${window.location.origin}";</script></body></html>`
      ], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WISHORA-App-Launcher.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setInstalled(true);
      setTimeout(() => onClose(), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-2xl">
      <div className="relative w-full max-w-md bg-surface-elevated border border-amber-400/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(212,175,55,0.25)] overflow-hidden space-y-5">
        <AuraHalfCircle position="top-right" variant="gold-purple" size="md" opacity={0.6} />
        <AuraHalfCircle position="bottom-left" variant="sunset" size="sm" opacity={0.4} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-3 hover:text-text-1 p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Icon & App Badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-700 p-0.5 shadow-[0_0_25px_rgba(212,175,55,0.4)] flex-shrink-0">
            <div className="w-full h-full bg-void rounded-[14px] flex items-center justify-center text-amber-400 font-display font-black text-2xl">
              W
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-mono font-bold text-amber-300 mb-1">
              <Sparkles size={11} />
              <span>OFFICIAL PWA APP</span>
            </div>
            <h2 className="text-xl font-display font-extrabold text-white">Install WISHORA</h2>
            <p className="text-xs text-text-2 font-medium">Bespoke 3D Birthday Cinema Engine</p>
          </div>
        </div>

        {installed ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Check size={24} />
            </div>
            <h3 className="text-lg font-display font-bold text-white">App Ready & Installed!</h3>
            <p className="text-xs text-text-2">Enjoy fast 1-tap birthday direction from your home screen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 space-y-2 text-xs text-text-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Sparkles size={14} className="text-amber-400" />
                <span>Why install the standalone app?</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-[11px] leading-relaxed">
                <li>Instant 1-tap launch directly from your home screen or dock</li>
                <li>Full screen cinematic playback without browser address bars</li>
                <li>Real-time haptic feedback and offline birthday radar caching</li>
              </ul>
            </div>

            {/* iOS Safari Instructions */}
            {isIOS && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-3.5 space-y-2 text-xs text-amber-200">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <span>📱 Installing on iPhone / iPad Safari:</span>
                </p>
                <ol className="space-y-1 pl-4 list-decimal text-[11px]">
                  <li>Tap the <strong>Share</strong> button <Share2 size={12} className="inline" /> in your Safari toolbar</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={12} className="inline" /></li>
                  <li>Tap <strong>Add</strong> in the top-right corner ✨</li>
                </ol>
              </div>
            )}

            {/* Android / Desktop One-Tap Install Action */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-void font-extrabold text-sm shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>{deferredPrompt ? 'Add to Home Screen / Install' : 'Download Chrome App Shortcut'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-xs font-mono text-text-3 hover:text-text-2 py-1.5 cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
