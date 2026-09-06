import React, { useState, useEffect } from 'react';
import { WishExperienceData } from '../../types/wish.js';
import { EnvelopeScreen } from './EnvelopeScreen.js';
import { CountdownScreen } from './CountdownScreen.js';
import { CakeScreen } from './CakeScreen.js';
import { TimelineScreen } from './TimelineScreen.js';
import { AlbumScreen } from './AlbumScreen.js';
import { CelebrationScreen } from './CelebrationScreen.js';
import { ReactionScreen } from './ReactionScreen.js';
import { ViralPromoScreen } from './ViralPromoScreen.js';
import { useAudioEngine } from '../../hooks/useAudioEngine.js';
import { Volume2, VolumeX } from 'lucide-react';
import { api } from '../../services/api.js';

interface WishExperienceViewProps {
  data: WishExperienceData;
  onExit: () => void;
}

export const WishExperienceView: React.FC<WishExperienceViewProps> = ({ data, onExit }) => {
  const { wish, photos } = data;
  const [currentStep, setCurrentStep] = useState<
    'envelope' | 'countdown' | 'cake' | 'timeline' | 'album' | 'celebration' | 'reaction' | 'promo'
  >('envelope');

  const { playSynthTheme, playPaperCrinkleSound, playCelebrationChime, isMuted, toggleMute, stop } = useAudioEngine();

  // Log open event on load
  useEffect(() => {
    if (wish.slug) {
      api.logOpen(wish.slug).catch(() => {});
    }
    return () => {
      stop();
    };
  }, [wish.slug, stop]);

  const handleUnseal = () => {
    playPaperCrinkleSound();
    playSynthTheme(wish.custom_music_url || 'synth://golden_hour');

    // Check if birthday is today or in future
    const dob = new Date(wish.recipient_dob);
    const today = new Date();
    const isToday = dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();

    if (!isToday) {
      setCurrentStep('countdown');
    } else {
      setCurrentStep('cake');
    }
  };

  const handleCountdownContinue = () => {
    setCurrentStep('cake');
  };

  const handleCakeFinished = () => {
    playCelebrationChime();
    setCurrentStep('timeline');
  };

  const handleTimelineNext = () => {
    setCurrentStep('album');
  };

  const handleAlbumNext = () => {
    setCurrentStep('celebration');
  };

  const handleCelebrationReaction = () => {
    setCurrentStep('reaction');
  };

  const handleReactionDone = () => {
    setCurrentStep('promo');
  };

  return (
    <div className="fixed inset-0 z-50 bg-void text-text-1">
      {/* Sleek Floating Audio Controller (Positioned safely in bottom-right corner) */}
      {currentStep !== 'envelope' && currentStep !== 'promo' && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
          title={isMuted ? 'Unmute Music 🎵' : 'Mute Music 🔇'}
          className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-surface-elevated/90 border border-white/[0.18] flex items-center justify-center text-accent hover:text-white shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(200,169,110,0.25)] backdrop-blur-2xl transition-all active:scale-90 hover:scale-105 hover:border-accent cursor-pointer"
        >
          {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-accent animate-pulse" />}
        </button>
      )}

      {currentStep === 'envelope' && (
        <EnvelopeScreen
          recipientName={wish.recipient_name}
          senderName={wish.sender_name}
          onUnseal={handleUnseal}
        />
      )}

      {currentStep === 'countdown' && (
        <CountdownScreen
          recipientName={wish.recipient_name}
          recipientDob={wish.recipient_dob}
          onContinue={handleCountdownContinue}
        />
      )}

      {currentStep === 'cake' && (
        <CakeScreen
          recipientName={wish.recipient_name}
          themeKey={wish.resolved_theme || 'gold'}
          onFinished={handleCakeFinished}
        />
      )}

      {/* COMPONENT 1: 3D Glowing Memory Lane Timeline */}
      {currentStep === 'timeline' && (
        <TimelineScreen
          recipientName={wish.recipient_name}
          birthYear={wish.birth_year || 1998}
          currentAge={wish.age_turning || 28}
          onNext={handleTimelineNext}
        />
      )}

      {/* COMPONENT 2: 3D Interactive Photo Album & Polaroid */}
      {currentStep === 'album' && (
        <AlbumScreen
          photos={photos}
          senderName={wish.sender_name}
          wishText={wish.wish_text}
          onNext={handleAlbumNext}
        />
      )}

      {currentStep === 'celebration' && (
        <CelebrationScreen
          recipientName={wish.recipient_name}
          wishText={wish.wish_text}
          coverPhoto={photos[0]?.storage_url}
          themeKey={wish.resolved_theme || 'gold'}
          onOpenReaction={handleCelebrationReaction}
        />
      )}

      {/* COMPONENT 3: Multi-Modal Reaction System */}
      {currentStep === 'reaction' && (
        <ReactionScreen
          slug={wish.slug}
          senderName={wish.sender_name}
          onDone={handleReactionDone}
        />
      )}

      {/* COMPONENT 4: Viral Sharing & WISHORA Promotion */}
      {currentStep === 'promo' && (
        <ViralPromoScreen
          slug={wish.slug}
          recipientName={wish.recipient_name}
          senderName={wish.sender_name}
          onRestartOrHome={onExit}
        />
      )}
    </div>
  );
};
