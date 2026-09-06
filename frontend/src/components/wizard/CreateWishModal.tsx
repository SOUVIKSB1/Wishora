import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { StepDetails } from './StepDetails.js';
import { StepAI } from './StepAI.js';
import { StepPhotos } from './StepPhotos.js';
import { StepMusic } from './StepMusic.js';
import { StepTheme } from './StepTheme.js';
import { StepReview } from './StepReview.js';
import { api } from '../../services/api.js';
import { useAudioEngine } from '../../hooks/useAudioEngine.js';

import { Folder } from '../../types/contact.js';

interface CreateWishModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  folders?: Folder[];
}

const WIZARD_STEPS = [
  { step: 1, title: 'Recipient', subtitle: 'Person & Milestone' },
  { step: 2, title: 'Message', subtitle: 'AI Multi-Tone Copy' },
  { step: 3, title: 'Memories', subtitle: 'Photo Album & Captions' },
  { step: 4, title: 'Soundscape', subtitle: 'Soundtrack & Trimming' },
  { step: 5, title: 'Atmosphere', subtitle: 'Adaptive Visuals' },
  { step: 6, title: 'Sealing', subtitle: 'Review & Link Generation' },
];

export const CreateWishModal: React.FC<CreateWishModalProps> = ({ onClose, onSuccess, initialData, folders = [] }) => {
  const getInitialStep = () => {
    if (!initialData) return 1;
    if (initialData.status === 'draft' || initialData.id) {
      if (initialData.theme && initialData.theme !== 'auto') return 5;
      if (initialData.custom_music_url || (initialData.music_id && initialData.music_id !== 'trk_1')) return 4;
      if (initialData.photos && initialData.photos.length > 0) return 3;
      if (initialData.wish_text && initialData.wish_text.trim().length > 0) return 2;
      if (initialData.recipient_name) return 2;
    }
    if (initialData.contact_id || initialData.name) {
      return 2;
    }
    return 1;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [formData, setFormData] = useState({
    recipient_name: initialData?.recipient_name || initialData?.name || '',
    recipient_dob: initialData?.recipient_dob || '2001-03-14',
    recipient_gender: initialData?.recipient_gender || initialData?.gender || 'female',
    relationship: initialData?.relationship || 'Best Friend',
    wish_text: initialData?.wish_text || '',
    wish_language: initialData?.wish_language || 'en',
    theme: initialData?.theme || 'auto',
    music_id: initialData?.music_id || 'trk_1',
    custom_music_url: initialData?.custom_music_url || '',
    music_trim_start: initialData?.music_trim_start || 0,
    music_trim_end: initialData?.music_trim_end || 30,
    music_volume: initialData?.music_volume ?? 0.8,
    folder_id: initialData?.folder_id || (folders && folders.length > 0 ? folders[0].id : ''),
    contact_id: initialData?.contact_id || null,
  });

  const [photos, setPhotos] = useState<any[]>(
    initialData?.photos || [
      {
        id: 'p_def_1',
        storage_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        caption: 'Radiant smiles and unforgettable memories',
        is_featured: 1
      },
      {
        id: 'p_def_2',
        storage_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        caption: 'Another spectacular year together!',
        is_featured: 0
      }
    ]
  );

  // Fetch full details if resuming a draft that only had summary
  useEffect(() => {
    if (initialData?.id && (!initialData.photos || initialData.photos.length === 0)) {
      api.getWish(initialData.id).then((res) => {
        if (res.wish) {
          setFormData((prev) => ({
            ...prev,
            recipient_name: res.wish.recipient_name || prev.recipient_name,
            recipient_dob: res.wish.recipient_dob || prev.recipient_dob,
            recipient_gender: res.wish.recipient_gender || prev.recipient_gender,
            relationship: res.wish.relationship || prev.relationship,
            wish_text: res.wish.wish_text || prev.wish_text,
            wish_language: res.wish.wish_language || prev.wish_language,
            theme: res.wish.theme || prev.theme,
            music_id: res.wish.music_id || prev.music_id,
            custom_music_url: res.wish.custom_music_url || prev.custom_music_url,
            music_trim_start: res.wish.music_trim_start ?? prev.music_trim_start,
            music_trim_end: res.wish.music_trim_end ?? prev.music_trim_end,
            music_volume: res.wish.music_volume ?? prev.music_volume,
            folder_id: res.wish.folder_id || prev.folder_id,
          }));
        }
        if (res.photos && res.photos.length > 0) {
          setPhotos(res.photos);
        }
      }).catch((e) => console.warn('Could not fetch wish details:', e));
    }
  }, [initialData?.id]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState<string | undefined>(undefined);

  const { isPlaying, playSynthTheme, setVolume, setTrim, stop } = useAudioEngine();

  // Automatically pause/stop any playing background track when navigating between wizard steps
  useEffect(() => {
    stop();
  }, [currentStep, stop]);

  const recipientAge = React.useMemo(() => {
    if (!formData.recipient_dob) return 25;
    const dob = new Date(formData.recipient_dob);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (age <= 0 || isNaN(age)) age = 25;
    return age;
  }, [formData.recipient_dob]);

  const handleNext = () => {
    stop();
    if (currentStep < 6) setCurrentStep(s => s + 1);
  };

  const handlePrev = () => {
    stop();
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      if (initialData?.id) {
        await api.updateWish(initialData.id, {
          ...formData,
          photos,
          status: 'draft'
        });
      } else {
        await api.createWish({
          ...formData,
          photos,
          status: 'draft'
        });
      }
      stop();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save draft:', err);
      stop();
      onClose();
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let res: any;
      if (initialData?.id) {
        res = await api.updateWish(initialData.id, {
          ...formData,
          photos,
          status: 'generated'
        });
      } else {
        res = await api.createWish({
          ...formData,
          photos,
          status: 'generated'
        });
      }
      if (res?.wish?.slug) {
        setGeneratedSlug(res.wish.slug);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Failed to generate wish link:', err);
      alert(err?.message || 'Failed to generate sealed link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPreview = (trackId: string, storageUrl: string) => {
    if (isPlaying) {
      stop();
    } else {
      playSynthTheme(
        storageUrl || 'synth://golden_hour',
        formData.music_volume ?? 0.8,
        formData.music_trim_start ?? 0,
        formData.music_trim_end
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-void/85 backdrop-blur-2xl overflow-y-auto select-none">
      <div className="relative w-full max-w-2xl bg-surface border border-white/[0.1] rounded-3xl p-5 sm:p-8 shadow-glass-card my-auto overflow-hidden">
        {/* Top Header & Close */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            {currentStep > 1 && !generatedSlug && (
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-full text-text-3 hover:text-text-1 hover:bg-white/[0.05]"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-accent uppercase block">
                STEP {currentStep} OF 6 • {WIZARD_STEPS[currentStep - 1].subtitle}
              </span>
              <h2 className="text-xl font-display font-bold text-text-1">
                {WIZARD_STEPS[currentStep - 1].title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              stop();
              onClose();
            }}
            className="p-1.5 rounded-full text-text-3 hover:text-text-1 bg-white/[0.04]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/[0.06] rounded-full my-4 overflow-hidden">
          <motion.div
            className="h-full bg-accent shadow-glow-sm"
            animate={{ width: `${(currentStep / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step Content Container */}
        <div className="py-2 min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 1 && (
                <StepDetails
                  formData={formData}
                  folders={folders}
                  onChange={(fields) => setFormData(prev => ({ ...prev, ...fields }))}
                />
              )}

              {currentStep === 2 && (
                <StepAI
                  name={formData.recipient_name}
                  age={recipientAge}
                  gender={formData.recipient_gender}
                  relationship={formData.relationship}
                  wishText={formData.wish_text}
                  language={formData.wish_language}
                  onChange={(text, lang) => setFormData(prev => ({ ...prev, wish_text: text, wish_language: lang }))}
                />
              )}

              {currentStep === 3 && (
                <StepPhotos
                  photos={photos}
                  onChange={setPhotos}
                  recipientName={formData.recipient_name}
                  relationship={formData.relationship}
                  recipientAge={recipientAge}
                  recipientGender={formData.recipient_gender}
                  theme={formData.theme}
                />
              )}

              {currentStep === 4 && (
                <StepMusic
                  selectedMusicId={formData.music_id}
                  customMusicUrl={formData.custom_music_url}
                  trimStart={formData.music_trim_start}
                  trimEnd={formData.music_trim_end}
                  volume={formData.music_volume}
                  onSelectMusic={(id, customUrl) => setFormData(prev => ({
                    ...prev,
                    music_id: id,
                    custom_music_url: customUrl !== undefined ? customUrl : (id.startsWith('custom_') ? prev.custom_music_url : '')
                  }))}
                  onTrimChange={(start, end) => {
                    setFormData(prev => ({ ...prev, music_trim_start: start, music_trim_end: end }));
                    setTrim(start, end);
                  }}
                  onVolumeChange={(vol) => {
                    setFormData(prev => ({ ...prev, music_volume: vol }));
                    setVolume(vol);
                  }}
                  onPlayPreview={handlePlayPreview}
                  isPlaying={isPlaying}
                />
              )}

              {currentStep === 5 && (
                <StepTheme
                  selectedTheme={formData.theme}
                  recipientName={formData.recipient_name}
                  recipientDob={formData.recipient_dob}
                  recipientGender={formData.recipient_gender}
                  onChange={(themeKey) => setFormData(prev => ({ ...prev, theme: themeKey as any }))}
                />
              )}

              {currentStep === 6 && (
                <StepReview
                  formData={formData}
                  photos={photos}
                  folders={folders}
                  onFolderChange={(folderId) => setFormData(prev => ({ ...prev, folder_id: folderId }))}
                  isGenerating={isGenerating}
                  generatedSlug={generatedSlug}
                  onGenerate={handleGenerate}
                  onDone={() => {
                    stop();
                    onClose();
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Nav (for steps 1-5) */}
        {currentStep < 6 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] mt-4">
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="text-xs font-medium text-text-2 hover:text-text-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingDraft ? 'Saving Draft...' : 'Save as Draft & Exit'}
            </button>

            <VelvetButton
              size="md"
              variant="glow"
              icon={<ArrowRight size={16} />}
              onClick={handleNext}
              disabled={currentStep === 1 && !formData.recipient_name.trim()}
            >
              Continue to {WIZARD_STEPS[currentStep].title}
            </VelvetButton>
          </div>
        )}
      </div>
    </div>
  );
};
