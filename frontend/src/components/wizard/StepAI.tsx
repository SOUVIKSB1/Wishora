import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, RefreshCw, Wand2, Quote, Check } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { api } from '../../services/api.js';

interface StepAIProps {
  name: string;
  age: number;
  gender: string;
  relationship: string;
  wishText: string;
  language: string;
  onChange: (text: string, lang: string) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
];

const TONES = ['Heartfelt', 'Poetic', 'Funny', 'Short & Sweet'];

export const StepAI: React.FC<StepAIProps> = ({
  name,
  age,
  gender,
  relationship,
  wishText,
  language,
  onChange
}) => {
  const [selectedTone, setSelectedTone] = useState<string>('Heartfelt');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ tone: string; message: string; emoji_suggestion: string }>>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchAiSuggestions(selectedTone);
  }, [name, age, language]);

  const fetchAiSuggestions = async (toneToFetch?: string) => {
    setIsLoading(true);
    try {
      const res = await api.suggestWish({
        name: name || 'Friend',
        age: age || 25,
        gender,
        relationship,
        language,
        tone: toneToFetch || selectedTone
      });
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
        if (!wishText) {
          onChange(res.suggestions[0].message, language);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (msg: string, idx: number) => {
    onChange(msg, language);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Language & Tone Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-elevated/60 border border-white/[0.08] p-3 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-accent" />
          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              onChange(wishText, newLang);
            }}
            className="bg-void/80 border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-text-1 focus:border-accent outline-none font-medium cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-surface text-text-1">
                {l.native} ({l.label})
              </option>
            ))}
          </select>
        </div>

        {/* Tone pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => {
                setSelectedTone(tone);
                fetchAiSuggestions(tone);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selectedTone === tone
                  ? 'bg-accent text-void font-semibold shadow-glow-sm'
                  : 'bg-white/[0.05] border border-white/[0.1] text-text-2 hover:text-text-1 hover:border-white/[0.2] hover:bg-white/[0.08]'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Main Wish Text Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-text-2 uppercase tracking-wider flex items-center gap-1.5">
            <Quote size={13} className="text-accent" />
            <span>Birthday Message (Cinematic Reveal)</span>
          </label>
          <span className={`text-[11px] font-mono ${wishText.length > 280 ? 'text-amber-400' : 'text-text-3'}`}>
            {wishText.length} / 500
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={5}
            maxLength={500}
            value={wishText}
            onChange={(e) => onChange(e.target.value, language)}
            placeholder={`Write a heartfelt wish for ${name || 'them'} or tap 'Generate with AI' below...`}
            className="w-full bg-surface-elevated/70 border border-white/[0.09] rounded-2xl p-4 text-text-1 placeholder-text-3 font-serif italic text-lg leading-relaxed focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none transition-all shadow-inner"
          />

          <div className="absolute right-3 bottom-3">
            <VelvetButton
              size="sm"
              variant="glow"
              icon={<Sparkles size={14} />}
              isLoading={isLoading}
              onClick={() => fetchAiSuggestions()}
            >
              {suggestions.length > 0 ? 'Regenerate' : 'Generate with AI'}
            </VelvetButton>
          </div>
        </div>
      </div>

      {/* AI Suggestions Deck */}
      {suggestions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
              <Wand2 size={13} />
              <span>AI Inspired Variations</span>
            </div>
            <span className="text-[11px] text-text-3">Tap any card to apply</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(s.message, idx)}
                className="group relative bg-surface-elevated/50 hover:bg-surface-elevated/90 border border-white/[0.07] hover:border-accent/40 rounded-2xl p-4 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-accent">
                    {s.tone}
                  </span>
                  <span className="text-sm">{s.emoji_suggestion}</span>
                </div>
                <p className="font-serif italic text-text-1 text-sm leading-relaxed pr-6">
                  "{s.message}"
                </p>

                <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium">
                    {copiedIdx === idx ? <Check size={13} className="text-emerald-400" /> : <Sparkles size={13} />}
                    {copiedIdx === idx ? 'Applied!' : 'Use This'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
