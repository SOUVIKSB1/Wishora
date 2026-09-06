import React, { useState, useRef } from 'react';
import { Sparkles, Mail, Lock, User, Cake, Crown, ArrowRight, ArrowLeft, ShieldCheck, Camera, Upload, Check, AlertCircle, Film, Heart, Music, Flame } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { WheelDatePicker } from '../ui/WheelDatePicker.js';
import { signInWithGoogle } from '../../services/firebase.js';
import { api } from '../../services/api.js';
import { LUXURY_AVATAR_PRESETS, getAvatarUrl, readFileAsDataUrl } from '../../utils/avatar.js';

interface AuthModalProps {
  onSuccess: (user: any) => void;
  onCancel?: () => void;
}

type AuthView = 'welcome' | 'register_step1' | 'register_step2' | 'register_step3' | 'google_complete' | 'login';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [view, setView] = useState<AuthView>('welcome');
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

  // Google Temp State for Completion Step
  const [googleProfile, setGoogleProfile] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
  } | null>(null);

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

  // Google Sign-In Handler
  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      setGoogleProfile(googleUser);
      setDisplayName(googleUser.displayName || '');
      if (googleUser.photoURL) setAvatarUrl(googleUser.photoURL);

      // Try logging in with Google
      const res = await api.googleLogin({
        email: googleUser.email,
        google_id: googleUser.uid,
        display_name: googleUser.displayName,
        avatar_url: googleUser.photoURL || undefined,
      });

      // If returning existing user, complete login immediately
      if (!res.is_new_user) {
        onSuccess(res.user);
      } else {
        // First-time new user -> Prompt clean 1-step Google completion
        setView('google_complete');
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try registering with email.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google Completion Step Submit
  const handleGoogleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleProfile) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.googleComplete({
        email: googleProfile.email,
        google_id: googleProfile.uid,
        display_name: displayName.trim() || googleProfile.displayName,
        avatar_url: avatarUrl || googleProfile.photoURL || undefined,
        user_dob: userDob,
        gender: gender,
      });
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to finalize profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email Registration Step 1 Validation
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!displayName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setView('register_step2');
  };

  // Final Registration Submit (from Step 3)
  const handleFinalRegister = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.register({
        display_name: displayName.trim(),
        email: email.trim(),
        password,
        user_dob: userDob,
        gender,
        avatar_url: avatarUrl || undefined,
      });
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const effectiveAvatar = avatarUrl || getAvatarUrl(displayName || 'Director', gender);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-2xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-surface-elevated/95 border border-white/[0.14] rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl my-8 transition-all">
        {/* Glow ambient background accents */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle size={17} className="flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 1: WELCOME SCREEN (THE CINEMA GATE)
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'welcome' && (
          <div className="space-y-6 text-center">
            {/* Cinematic Icon Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-700 p-0.5 shadow-[0_0_35px_rgba(212,175,55,0.4)] mx-auto">
              <div className="w-full h-full bg-void rounded-[22px] flex items-center justify-center text-amber-400">
                <Crown size={30} className="fill-amber-400" />
              </div>
            </div>

            {/* Headlines */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase block">
                CINEMATIC BIRTHDAY ENGINE
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                Welcome to WISHORA
              </h1>
              <p className="text-xs sm:text-sm text-text-2 max-w-sm mx-auto leading-relaxed">
                Direct unforgettable, interactive birthday experiences with realistic 3D cakes, polaroid albums, and live reactions.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col items-center gap-1.5">
                <Flame size={16} className="text-amber-400" />
                <span className="text-[10px] font-mono font-bold text-text-2">3D Blow Cake</span>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col items-center gap-1.5">
                <Film size={16} className="text-purple-400" />
                <span className="text-[10px] font-mono font-bold text-text-2">Memory Reel</span>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 flex flex-col items-center gap-1.5">
                <Heart size={16} className="text-rose-400" />
                <span className="text-[10px] font-mono font-bold text-text-2">Live Reactions</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* 1-Tap Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
              </button>

              {/* Direct Registration Wizard Button */}
              <button
                type="button"
                onClick={() => { setView('register_step1'); setErrorMessage(''); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-void font-extrabold text-sm shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Create Director Account</span>
              </button>
            </div>

            {/* Footer switch to login */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-center gap-1.5 text-xs text-text-2">
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() => { setView('login'); setErrorMessage(''); }}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 2: REGISTRATION - STEP 1 (IDENTITY & CREDENTIALS)
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'register_step1' && (
          <form onSubmit={handleStep1Next} className="space-y-5">
            {/* Step Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">STEP 1 OF 3</span>
                <span className="text-text-3">IDENTITY & LOGIN</span>
              </div>
              <div className="h-1.5 w-full bg-void rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 w-1/3 rounded-full transition-all duration-300" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-black text-white">Create Your Account</h2>
              <p className="text-xs text-text-2 mt-0.5">Let's set up your executive director profile.</p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-amber-400" />
                  <span>WHAT SHOULD WE CALL YOU? (FULL NAME)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Souvik Sinhababu"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-void border border-white/[0.14] rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>

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
                  className="w-full bg-void border border-white/[0.14] rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-400" />
                  <span>SECURE PASSWORD (MIN 6 CHARACTERS)</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-void border border-white/[0.14] rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setView('welcome'); setErrorMessage(''); }}
                className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-text-2 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <VelvetButton
                type="submit"
                variant="glow"
                size="md"
                className="shadow-[0_0_20px_rgba(212,175,55,0.35)]"
              >
                <span>Continue to Birthday</span>
                <ArrowRight size={15} />
              </VelvetButton>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 3: REGISTRATION - STEP 2 (BIRTHDAY & RADAR)
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'register_step2' && (
          <div className="space-y-5">
            {/* Step Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">STEP 2 OF 3</span>
                <span className="text-text-3">PERSONAL BIRTHDAY</span>
              </div>
              <div className="h-1.5 w-full bg-void rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 w-2/3 rounded-full transition-all duration-300" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-black text-white">When Is Your Birthday?</h2>
              <p className="text-xs text-text-2 mt-0.5">
                We will configure your personal countdown radar and birthday celestial theme.
              </p>
            </div>

            {/* Interactive Wheel Date Picker */}
            <div className="py-2">
              <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-2 flex items-center gap-1.5">
                <Cake size={13} className="text-amber-400" />
                <span>SCROLL TO SELECT YOUR DATE OF BIRTH</span>
              </label>
              <WheelDatePicker value={userDob} onChange={setUserDob} />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setView('register_step1'); setErrorMessage(''); }}
                className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-text-2 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <VelvetButton
                type="button"
                variant="glow"
                size="md"
                onClick={() => setView('register_step3')}
                className="shadow-[0_0_20px_rgba(212,175,55,0.35)]"
              >
                <span>Continue to Avatar</span>
                <ArrowRight size={15} />
              </VelvetButton>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 4: REGISTRATION - STEP 3 (AVATAR & PERSONA)
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'register_step3' && (
          <div className="space-y-5">
            {/* Step Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">STEP 3 OF 3</span>
                <span className="text-text-3">DIRECTOR PERSONA</span>
              </div>
              <div className="h-1.5 w-full bg-void rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 w-full rounded-full transition-all duration-300" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-black text-white">Choose Your Avatar</h2>
              <p className="text-xs text-text-2 mt-0.5">
                Customize your executive director passport and AI storytelling tone.
              </p>
            </div>

            {/* Gender Selector */}
            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-2">
                YOUR GENDER
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'male', label: 'Male' },
                  { key: 'female', label: 'Female' },
                  { key: 'nonbinary', label: 'Nonbinary' },
                  { key: 'unspecified', label: 'Director' },
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

            {/* Avatar Preview & Upload */}
            <div className="p-4 bg-void/60 border border-white/[0.1] rounded-2xl space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={effectiveAvatar}
                    alt="Director"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/70 bg-surface shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-void/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-amber-300"
                  >
                    <Camera size={18} />
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
                  <h4 className="text-sm font-bold text-white">{displayName || 'Director'}</h4>
                  <p className="text-[11px] font-mono text-text-3 mt-0.5">Birthday: {userDob}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-[10px] font-mono text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Upload size={11} className="text-amber-400" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="px-3 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={11} />
                      <span>{showAvatarPicker ? 'Hide' : 'Studio Avatars'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar Presets Grid */}
              {showAvatarPicker && (
                <div className="p-3 bg-void border border-amber-400/30 rounded-xl grid grid-cols-6 gap-2 animate-fadeIn">
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
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setView('register_step2'); setErrorMessage(''); }}
                className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-text-2 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <VelvetButton
                type="button"
                variant="glow"
                size="md"
                isLoading={loading}
                onClick={handleFinalRegister}
                className="shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                <span>Launch Director Studio</span>
                <Sparkles size={16} />
              </VelvetButton>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 5: GOOGLE ONBOARDING COMPLETION STEP
            (Prompt Date of Birth & Gender for Google users)
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'google_complete' && (
          <form onSubmit={handleGoogleCompleteSubmit} className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              {googleProfile?.photoURL ? (
                <img
                  src={googleProfile.photoURL}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl mx-auto border-2 border-amber-400/80 shadow-[0_0_25px_rgba(212,175,55,0.35)] object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl mx-auto bg-amber-400 text-void flex items-center justify-center font-display font-black text-2xl shadow-glow-sm">
                  {displayName.charAt(0) || 'D'}
                </div>
              )}
              <h2 className="text-2xl font-display font-black text-white">
                Welcome, {displayName}!
              </h2>
              <p className="text-xs text-text-2 max-w-xs mx-auto">
                Google connected successfully. Please set your birthday to complete your Director Passport.
              </p>
            </div>

            {/* Date of Birth Wheel Picker */}
            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-2 flex items-center gap-1.5">
                <Cake size={13} className="text-amber-400" />
                <span>YOUR DATE OF BIRTH</span>
              </label>
              <WheelDatePicker value={userDob} onChange={setUserDob} />
            </div>

            {/* Gender Selector */}
            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-bold mb-2">
                YOUR GENDER
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'male', label: 'Male' },
                  { key: 'female', label: 'Female' },
                  { key: 'nonbinary', label: 'Nonbinary' },
                  { key: 'unspecified', label: 'Director' },
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

            <div className="pt-2">
              <VelvetButton
                type="submit"
                variant="glow"
                size="lg"
                isLoading={loading}
                className="w-full justify-center shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                <span>Enter Director Studio</span>
                <ArrowRight size={16} />
              </VelvetButton>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW 6: EMAIL SIGN IN SCREEN
        ══════════════════════════════════════════════════════════════════ */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => { setView('welcome'); setErrorMessage(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-text-3 hover:text-amber-400 font-mono mb-3 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>BACK TO WELCOME</span>
              </button>
              <h2 className="text-2xl font-display font-black text-white">Sign In to Studio</h2>
              <p className="text-xs text-text-2 mt-0.5">Enter your email and password to access your wishes.</p>
            </div>

            <div className="space-y-4">
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
                  className="w-full bg-void border border-white/[0.14] rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>

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
                  className="w-full bg-void border border-white/[0.14] rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400 font-medium transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <VelvetButton
                type="submit"
                variant="glow"
                size="lg"
                isLoading={loading}
                className="w-full justify-center shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                <span>Enter Studio</span>
                <ArrowRight size={16} />
              </VelvetButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setView('register_step1'); setErrorMessage(''); }}
                  className="text-xs text-text-2 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Don't have an account? <span className="text-amber-400 font-bold underline">Create one</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Security badge footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] font-mono text-text-3">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Encrypted Session • Multi-tenant Isolation</span>
        </div>
      </div>
    </div>
  );
};
