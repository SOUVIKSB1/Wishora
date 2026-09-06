import React, { useMemo } from 'react';
import { User, Sparkles, Heart, Folder as FolderIcon } from 'lucide-react';
import { WheelDatePicker } from '../ui/WheelDatePicker.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { Folder } from '../../types/contact.js';

interface StepDetailsProps {
  formData: {
    recipient_name: string;
    recipient_dob: string;
    recipient_gender: 'male' | 'female' | 'nonbinary' | 'child' | 'unspecified';
    relationship: string;
    folder_id?: string;
  };
  folders?: Folder[];
  onChange: (fields: Partial<StepDetailsProps['formData']>) => void;
}

const GENDERS = [
  { key: 'female', label: 'Girl / Woman' },
  { key: 'male', label: 'Boy / Man' },
  { key: 'child', label: 'Child (<15)' },
  { key: 'nonbinary', label: 'Non-binary' },
  { key: 'unspecified', label: 'Prefer not to say' },
] as const;

const RELATIONSHIPS = [
  'Best Friend', 'Sister', 'Brother', 'Partner', 'Mother', 'Father', 'Colleague', 'Mentor', 'Friend'
];

export const StepDetails: React.FC<StepDetailsProps> = ({ formData, folders = [], onChange }) => {
  const age = useMemo(() => {
    if (!formData.recipient_dob) return 25;
    const dob = new Date(formData.recipient_dob);
    const today = new Date();
    let calculated = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      calculated--;
    }
    return Math.max(1, calculated);
  }, [formData.recipient_dob]);

  return (
    <div className="space-y-6">
      {/* Live Name Spotlight Preview */}
      <div className="relative rounded-2xl bg-surface border-2 border-gold/40 p-6 overflow-hidden text-center backdrop-blur-xl shadow-glass-card">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-24 bg-gold/20 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[11px] font-mono font-bold tracking-widest text-gold uppercase">EXPERIENCE HEADLINE PREVIEW</span>
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold mt-1.5 text-text-1 tracking-tight">
          {formData.recipient_name.trim() || 'Their Name'}
        </h2>
        <div className="flex items-center justify-center gap-2.5 mt-3">
          <GlowBadge variant="gold">Turning {age} Years Old</GlowBadge>
          <GlowBadge variant="ghost">{formData.relationship}</GlowBadge>
        </div>
      </div>

      {/* Recipient Full Name */}
      <div>
        <label className="block text-xs font-mono font-bold text-text-2 uppercase tracking-wider mb-2">
          Who is this cinematic wish for?
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
          <input
            type="text"
            maxLength={30}
            value={formData.recipient_name}
            onChange={(e) => onChange({ recipient_name: e.target.value })}
            placeholder="Enter their full name or nickname"
            className="w-full bg-[#06060A] border border-white/20 focus:border-gold rounded-2xl pl-12 pr-4 py-3.5 text-text-1 placeholder:text-text-3 text-base outline-none font-body font-semibold transition-all"
          />
        </div>
      </div>

      {/* Custom Wheel Date Picker */}
      <WheelDatePicker
        value={formData.recipient_dob}
        onChange={(dob) => onChange({ recipient_dob: dob })}
      />

      {/* Gender Selection */}
      <div>
        <label className="block text-xs font-mono font-bold text-text-2 uppercase tracking-wider mb-2">
          Gender / Atmosphere Adaptation
        </label>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => {
            const isSelected = formData.recipient_gender === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => onChange({ recipient_gender: g.key })}
                className={`px-4 py-2.5 rounded-xl text-xs font-body font-bold border transition-all ${
                  isSelected
                    ? 'bg-gold-pulse border-gold text-gold shadow-gold-glow'
                    : 'bg-surface border-white/15 text-text-2 hover:text-text-1 hover:border-white/30'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Relationship Selector */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-text-2 uppercase tracking-wider">
          <Heart size={13} className="text-pink" />
          <span>Your Relationship</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIPS.map((rel) => {
            const isSelected = formData.relationship === rel;
            return (
              <button
                key={rel}
                type="button"
                onClick={() => onChange({ relationship: rel })}
                className={`px-3.5 py-2 rounded-xl text-xs font-body font-semibold transition-all ${
                  isSelected
                    ? 'bg-white/20 text-white border border-white/40 font-bold'
                    : 'bg-surface border border-white/10 text-text-2 hover:text-white hover:border-white/25'
                }`}
              >
                {rel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Folder Selection */}
      {folders.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-xs font-mono font-bold text-text-2 uppercase tracking-wider">
            <FolderIcon size={13} className="text-gold" />
            <span>Save to Folder</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {folders.map((f) => {
              const isSelected = (formData.folder_id || 'fld_1') === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange({ folder_id: f.id })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-body font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-accent/20 text-accent border border-accent font-bold shadow-glow-sm'
                      : 'bg-surface border border-white/10 text-text-2 hover:text-white hover:border-white/25'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <span>{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
