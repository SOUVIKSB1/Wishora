import React, { useState, useRef } from 'react';
import { Sparkles, Mail, Lock, User, Cake, Crown, ArrowRight, ShieldCheck, Camera, Upload, Check, AlertCircle } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { WheelDatePicker } from '../ui/WheelDatePicker.js';
import { signInWithGoogle } from '../../services/firebase.js';
import { api } from '../../services/api.js';
import { LUXURY_AVATAR_PRESETS, getAvatarUrl, readFileAsDataUrl } from '../../utils/avatar.js';

interface AuthModalProps {
  onSuccess: (user: any) => void;
  onCancel?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userDob, setUserDob] = useState('2000-01-01');
  const [gender, setGender] = useState<'male' | 'female' | 'nonbinary' | 'unspecified'>('unspecified');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read image file');
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const res = await api.googleLogin({
        email: googleUser.email,
        google_id: googleUser.uid,
        display_name: googleUser.displayName,
        avatar_url: googleUser.photoURL || undefined,
        user_dob: userDob,
        gender: gender,
      });
      onSuccess(res.user);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try email registration.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDirectAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'register') {
        if (!displayName.trim()) {
          setErrorMessage('Please enter your full name.');
          setLoading(false);
          return;
        }

        const res = await api.register({
          display_name: displayName.trim(),
          email: email.trim(),
          password,
          user_dob: userDob,
          gender,
          avatar_url: avatarUrl || undefined,
        });
        onSuccess(res.user);
      } else {
        const res = await api.login(email.trim(), password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const effectiveAvatar = avatarUrl || getAvatarUrl(displayName || 'Director', gender);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-surface-elevated/95 border border-white/[0.14] rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl my-8">
        {/* Glow ambient background accents */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <Crown size={12} />
            <span>DIRECTOR STUDIO ACCESS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Welcome to WISHORA
          </h2>
          <p className="text-xs sm:text-sm text-text-2 mt-1">
            Sign in or create your executive director profile to start crafting cinematic experiences.
          </p>
        </div>

        {/* 1-Tap Google Sign-In */}
        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.1]" />
            <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">or direct email</span>
            <div className="flex-1 h-px bg-white/[0.1]" />
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-void/60 border border-white/[0.08] p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-accent text-void shadow-glow-sm'
                : 'text-text-2 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-accent text-void shadow-glow-sm'
                : 'text-text-2 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDirectAuth} className="space-y-4">
          {tab === 'register' && (
            <>
              {/* Profile Avatar Selection */}
              <div className="flex items-center gap-4 p-3.5 bg-void/50 border border-white/[0.08] rounded-2xl">
                <div className="relative group">
                  <img
                    src={effectiveAvatar}
                    alt="Director"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/60 bg-surface shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-void/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-amber-300"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="flex-1">
                  <span className="text-[11px] font-mono text-text-2 font-bold uppercase tracking-wider block">
                    DIRECTOR AVATAR
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-[10px] font-mono text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={10} />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={10} />
                      <span>{showAvatarPicker ? 'Hide' : 'Presets'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar Presets Grid */}
              {showAvatarPicker && (
                <div className="p-3 bg-void/80 border border-amber-400/30 rounded-2xl grid grid-cols-6 gap-2">
                  {LUXURY_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(preset.url);
                        setShowAvatarPicker(false);
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-transform p-0.5 cursor-pointer ${
                        avatarUrl === preset.url
                          ? 'border-amber-400 scale-105 shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                          : 'border-white/[0.1] hover:border-white/[0.3]'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-amber-400" />
                  <span>FULL NAME</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Souvik Sinhababu"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-void border border-white/[0.12] rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 font-medium"
                />
              </div>

              {/* Gender Selector */}
              <div>
                <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5">
                  GENDER (FOR CUSTOMIZED AI THEMES)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'male', label: 'Male' },
                    { key: 'female', label: 'Female' },
                    { key: 'nonbinary', label: 'Nonbinary' },
                    { key: 'unspecified', label: 'Other' },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGender(g.key as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        gender === g.key
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                          : 'bg-void border-white/[0.08] text-text-2 hover:border-white/[0.2]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth Wheel Picker */}
              <div>
                <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                  <Cake size={13} className="text-amber-400" />
                  <span>YOUR DATE OF BIRTH</span>
                </label>
                <WheelDatePicker value={userDob} onChange={setUserDob} />
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-amber-400" />
              <span>EMAIL ADDRESS</span>
            </label>
            <input
              type="email"
              required
              placeholder="director@wishora.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-void border border-white/[0.12] rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5 flex items-center gap-1.5">
              <Lock size={13} className="text-amber-400" />
              <span>PASSWORD</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-void border border-white/[0.12] rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div className="pt-2">
            <VelvetButton
              type="submit"
              variant="glow"
              size="lg"
              isLoading={loading}
              className="w-full justify-center shadow-[0_0_25px_rgba(212,175,55,0.4)]"
            >
              <span>{tab === 'register' ? 'Launch Director Studio' : 'Enter Studio'}</span>
              <ArrowRight size={16} />
            </VelvetButton>
          </div>
        </form>

        {/* Security badge footer */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] font-mono text-text-3">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Encrypted Session • Multi-tenant Data Privacy</span>
        </div>
      </div>
    </div>
  );
};
