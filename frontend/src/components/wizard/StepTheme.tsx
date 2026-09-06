import React, { useMemo } from 'react';
import { Palette, Sparkles, Check } from 'lucide-react';
import { THEMES, ThemeKey } from '../../types/theme.js';
import { GlowBadge } from '../ui/GlowBadge.js';

interface StepThemeProps {
  selectedTheme: string; // 'auto' | ThemeKey
  recipientName: string;
  recipientDob: string;
  recipientGender: string;
  onChange: (themeKey: string) => void;
}

export const StepTheme: React.FC<StepThemeProps> = ({
  selectedTheme,
  recipientName,
  recipientDob,
  recipientGender,
  onChange
}) => {
  // Resolve auto theme
  const autoResolvedKey: ThemeKey = useMemo(() => {
    const dob = new Date(recipientDob || '2000-01-01');
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (age < 15) return 'candy';
    if (recipientGender === 'female' && age <= 45) return 'rose';
    if (recipientGender === 'male' && age <= 45) return 'electric';
    if (age > 45) return 'gold';
    return 'cosmic';
  }, [recipientDob, recipientGender]);

  const activeThemeConfig = THEMES[selectedTheme === 'auto' ? autoResolvedKey : (selectedTheme as ThemeKey)] || THEMES.gold;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold text-text-2 uppercase tracking-wider block">
          Visual Atmosphere & Theming
        </label>
        <p className="text-xs text-text-3 mt-0.5">Themes adapt dynamically to the recipient's age and personality.</p>
      </div>

      {/* Auto-suggested Pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange('auto')}
          className={`flex-1 p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
            selectedTheme === 'auto'
              ? 'border-accent bg-accent/10 shadow-glow-sm'
              : 'border-white/[0.08] bg-surface-elevated/50 hover:bg-surface-elevated/80'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-sm font-semibold text-text-1">AI Adaptive Smart Theme</span>
            </div>
            <p className="text-xs text-text-3 mt-0.5">
              Auto-selected: <span className="text-accent font-medium">{THEMES[autoResolvedKey]?.label}</span>
            </p>
          </div>

          {selectedTheme === 'auto' && (
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Check size={14} />
            </div>
          )}
        </button>
      </div>

      {/* Theme Cards Palette Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(THEMES) as ThemeKey[]).map(key => {
          const t = THEMES[key];
          const isSelected = selectedTheme === key || (selectedTheme === 'auto' && autoResolvedKey === key);

          return (
            <div
              key={key}
              onClick={() => onChange(key)}
              className={`relative rounded-2xl p-4 border cursor-pointer transition-all overflow-hidden ${
                isSelected
                  ? 'border-accent bg-surface-elevated/90 shadow-[0_0_25px_rgba(200,169,110,0.2)]'
                  : 'border-white/[0.07] bg-surface-elevated/50 hover:border-white/[0.15]'
              }`}
            >
              {/* Color swatches */}
              <div className="flex items-center gap-1.5 mb-3">
                {t.particleColors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                ))}
              </div>

              <h4 className="text-sm font-bold text-text-1">{t.label}</h4>
              <p className="text-xs text-text-3 mt-1 leading-relaxed">{t.subtitle}</p>

              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-void flex items-center justify-center font-bold text-xs shadow-glow-sm">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Card Preview in Theme */}
      <div className="pt-2">
        <span className="text-[10px] font-mono tracking-wider text-text-3 uppercase block mb-2">
          ATMOSPHERE LIVE CARD PREVIEW
        </span>

        <div
          className="rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden"
          style={{
            background: activeThemeConfig.bgGradient,
            borderColor: activeThemeConfig.border,
            boxShadow: `0 15px 40px ${activeThemeConfig.accentGlow}`
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono tracking-widest text-white/50 uppercase">WISHORA EXPERIENCE</span>
            <GlowBadge variant="gold">
              {activeThemeConfig.label}
            </GlowBadge>
          </div>

          <h3 className={`text-3xl font-display font-bold mb-2 ${activeThemeConfig.textGradientClass}`}>
            Happy Birthday, {recipientName || 'Friend'}!
          </h3>

          <p className="font-serif italic text-text-1/90 text-sm leading-relaxed max-w-md">
            "Every candle on your cake is a luminous reminder of how much light and warmth you bring to everyone."
          </p>
        </div>
      </div>
    </div>
  );
};
