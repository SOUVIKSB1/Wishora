import React, { useState, useEffect, useRef } from 'react';
import { Crown, Sparkles, Shield, User, Globe, Bell, Check, Cake, Star, Award, Film, KeyRound, Camera, Upload, RefreshCw, Image as ImageIcon, LogOut } from 'lucide-react';
import { VelvetButton } from './ui/VelvetButton.js';
import { GlowBadge } from './ui/GlowBadge.js';
import { WheelDatePicker } from './ui/WheelDatePicker.js';
import { AuraHalfCircle } from './ui/AuraHalfCircle.js';
import { api } from '../services/api.js';
import { LUXURY_AVATAR_PRESETS, getAvatarUrl, readFileAsDataUrl } from '../utils/avatar.js';

interface ProfileViewProps {
  user: any;
  stats: any;
  onUpdate: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, stats, onUpdate, onLogout }) => {
  const [displayName, setDisplayName] = useState(user?.display_name || 'Souvik Sinhababu');
  const [userDob, setUserDob] = useState(user?.user_dob || '1998-05-20');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [plan, setPlan] = useState<'free' | 'premium'>(user?.plan || 'premium');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.display_name) setDisplayName(user.display_name);
    if (user?.user_dob) setUserDob(user.user_dob);
    if (user?.avatar_url !== undefined) setAvatarUrl(user.avatar_url || '');
    if (user?.plan) setPlan(user.plan);
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err: any) {
      alert(err?.message || 'Failed to read image file');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({
        display_name: displayName,
        user_dob: userDob,
        avatar_url: avatarUrl || null,
        plan
      });
      onUpdate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentEffectiveAvatar = avatarUrl || getAvatarUrl(displayName, null);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono text-amber-400 font-bold tracking-widest uppercase">
            EXECUTIVE CREDENTIALS
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">Director Profile & Settings</h1>
        <p className="text-xs sm:text-sm text-text-2 mt-0.5 font-medium leading-relaxed">Manage your director identity, photo avatar, personal birthday radar, and cinema production preferences.</p>
      </div>

      {/* ─── HOLOGRAPHIC VIP PASSPORT CARD ─── */}
      <div className="vip-passport-card rounded-3xl p-6 sm:p-7 backdrop-blur-2xl relative overflow-hidden space-y-6">
        <AuraHalfCircle position="top-right" variant="gold-purple" size="lg" opacity={0.65} />
        <AuraHalfCircle position="bottom-left" variant="cyan-emerald" size="sm" opacity={0.4} />

        {/* Profile Header & Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-white/[0.1]">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={currentEffectiveAvatar}
                alt="Director Avatar"
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_25px_rgba(212,175,55,0.35)] bg-surface"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-void/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-amber-300"
                title="Change Photo"
              >
                <Camera size={20} />
                <span className="text-[9px] font-mono font-bold mt-1 uppercase">Upload</span>
              </button>

              <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-amber-400 text-void border border-amber-200 shadow-sm">
                <Crown size={12} className="fill-void" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display font-extrabold text-white">{displayName}</h2>
                <GlowBadge variant={plan === 'premium' ? 'gold' : 'ghost'}>
                  {plan === 'premium' ? 'VIP PRO' : 'DIRECTOR'}
                </GlowBadge>
              </div>
              <p className="text-xs text-text-2 mt-0.5 font-mono">{user?.email || 'director@wishora.app'}</p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-[11px] font-mono font-bold text-white transition-colors cursor-pointer"
                >
                  <Upload size={11} className="text-amber-400" />
                  <span>Upload Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[11px] font-mono font-bold text-amber-300 transition-colors cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>{showAvatarPicker ? 'Hide Avatars' : 'Studio Avatars'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-3 flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <span className="text-[10px] font-mono text-text-3 uppercase font-bold">DIRECTOR ID</span>
            <span className="text-xs font-mono text-amber-300 font-extrabold tracking-wider">#WSH-88219</span>
          </div>
        </div>

        {/* Studio Avatar Gallery Picker Dropdown */}
        {showAvatarPicker && (
          <div className="p-4 bg-surface-elevated/95 border border-amber-400/30 rounded-2xl space-y-3 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Select Luxury Studio Avatar
              </span>
              <button
                type="button"
                onClick={() => {
                  setAvatarUrl('');
                  setShowAvatarPicker(false);
                }}
                className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Reset to Auto</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {LUXURY_AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(preset.url);
                    setShowAvatarPicker(false);
                  }}
                  className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all p-0.5 group cursor-pointer ${
                    avatarUrl === preset.url
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'border-white/[0.12] hover:border-white/[0.4] hover:scale-105'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover rounded-xl bg-void"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-void/80 p-0.5 text-[8px] font-mono text-center text-white/90 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-amber-400" />
              <span>DIRECTOR DISPLAY NAME</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-void/90 border border-white/[0.14] rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-2 flex items-center gap-1.5">
              <Cake size={13} className="text-amber-400" />
              <span>PERSONAL BIRTHDAY (FOR COUNTDOWN RADAR)</span>
            </label>
            <WheelDatePicker value={userDob} onChange={setUserDob} />
          </div>
        </div>
      </div>

      {/* ─── PREMIUM PRO TIER CARTRIDGE ─── */}
      <div className="relative bg-gradient-to-br from-amber-500/20 via-surface-elevated to-surface border-2 border-amber-400/40 rounded-3xl p-6 backdrop-blur-xl overflow-hidden shadow-[0_0_35px_rgba(212,175,55,0.18)]">
        <AuraHalfCircle position="top-right" variant="sunset" size="md" opacity={0.5} />
        <AuraHalfCircle position="bottom-left" variant="gold-purple" size="sm" opacity={0.3} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono tracking-widest uppercase font-bold">
              <Crown size={15} />
              <span>LIFETIME MEMBERSHIP</span>
            </div>
            <h3 className="text-xl font-display font-extrabold text-white">WISHORA Cinema Suite</h3>
            <p className="text-xs text-text-2 leading-relaxed max-w-md font-medium">
              Direct unlimited cinematic birthday experiences, upload custom studio audio tracks, assemble 12-photo polaroid albums, and capture real-time recipient reaction videos.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
            <button
              onClick={() => setPlan(plan === 'premium' ? 'free' : 'premium')}
              className={`px-5 py-2.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                plan === 'premium'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-void border-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'bg-white/[0.08] border-white/[0.14] text-white hover:bg-white/[0.15]'
              }`}
            >
              {plan === 'premium' ? '✓ VIP Active' : 'Activate VIP'}
            </button>
          </div>
        </div>
      </div>

      {/* Save & Sign Out Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        )}

        <div className="flex items-center justify-end gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
              <Check size={16} /> Changes Saved!
            </span>
          )}
          <VelvetButton
            variant="glow"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
            className="shadow-[0_0_25px_rgba(212,175,55,0.35)]"
          >
            Save Profile
          </VelvetButton>
        </div>
      </div>
    </div>
  );
};


