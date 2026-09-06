import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Users, Music, FileText, Bell, Sparkles, Trash2, 
  Plus, Search, RefreshCw, AlertTriangle, Check, X,
  Play, Pause, Send, ExternalLink, Filter, ShieldAlert, LogOut,
  Upload, Volume2, Pencil, CheckCircle2, Music2, Loader2
} from 'lucide-react';
import { api } from '../../services/api.js';
import { AuraHalfCircle } from '../ui/AuraHalfCircle.js';
import { VelvetButton } from '../ui/VelvetButton.js';
import { haptic } from '../../utils/haptics.js';

interface AdminDashboardProps {
  currentUser: any;
  onLogout?: () => void;
  onClose?: () => void;
}

type AdminTab = 'users' | 'notifications' | 'music' | 'templates';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Search
  const [userSearch, setUserSearch] = useState('');

  // Audio Playback
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  // Song Upload File Tool States
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicFilePreviewUrl, setMusicFilePreviewUrl] = useState<string>('');
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [isPublishingMusic, setIsPublishingMusic] = useState(false);
  const [publishingStep, setPublishingStep] = useState('Encoding Studio Audio Buffer...');
  const [deletingMusicId, setDeletingMusicId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [newMusic, setNewMusic] = useState({
    title: '',
    artist: 'Wishora Studio',
    genre: 'Birthday Classics',
    mood_tags: 'joyful, celebration',
    storage_url: '',
    duration: 60
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wish Template Create & Edit Modals
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    category: 'heartfelt',
    tone: 'warm',
    language: 'en'
  });

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editTemplateForm, setEditTemplateForm] = useState({
    title: '',
    content: '',
    category: 'heartfelt',
    tone: 'warm',
    language: 'en'
  });

  // Notifications Modal
  const [showSendNotifModal, setShowSendNotifModal] = useState(false);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    type: 'announcement'
  });

  // User Deletion Modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Load Admin Data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, musicRes, templatesRes, notifsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminMusic(),
        api.getAdminTemplates(),
        api.getAdminNotifications()
      ]);

      setStats(statsRes.stats);
      setUsers(usersRes.users || []);
      setMusicTracks(musicRes.tracks || []);
      setTemplates(templatesRes.templates || []);
      setNotifications(notifsRes.notifications || []);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    return () => {
      if (audioElem) {
        audioElem.pause();
      }
    };
  }, []);

  // 1. User Management Actions
  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(userId, newRole);
      showToast('success', `User role set to ${newRole.toUpperCase()}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to change role');
    }
  };

  const handleDeleteUserPermanently = async () => {
    if (!deleteConfirmUser) return;
    try {
      await api.deleteUser(deleteConfirmUser.id);
      showToast('success', `User ${deleteConfirmUser.email} and all data permanently terminated`);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete user');
    }
  };

  // 2. Music Upload Tool Handler
  const handleAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingAudio(true);
    setMusicFile(file);

    // Auto fill title if empty
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!newMusic.title) {
      setNewMusic(prev => ({ ...prev, title: rawName }));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setMusicFilePreviewUrl(dataUrl);
      setNewMusic(prev => ({ ...prev, storage_url: dataUrl }));

      // Detect audio duration
      const tempAudio = new Audio(dataUrl);
      tempAudio.onloadedmetadata = () => {
        const dur = Math.round(tempAudio.duration) || 60;
        setNewMusic(prev => ({ ...prev, duration: dur }));
        setIsReadingAudio(false);
      };
      tempAudio.onerror = () => {
        setIsReadingAudio(false);
      };
    };
    reader.onerror = () => {
      setIsReadingAudio(false);
      showToast('error', 'Could not read audio file');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusic.title || !newMusic.storage_url) {
      showToast('error', 'Please upload a valid audio song file');
      return;
    }
    setIsPublishingMusic(true);
    setPublishingStep('Encoding & processing studio audio track...');
    try {
      const tags = newMusic.mood_tags.split(',').map(t => t.trim()).filter(Boolean);
      
      setPublishingStep('Publishing & syncing to Wishora global library...');
      const res = await api.addAdminMusic({
        title: newMusic.title,
        artist: newMusic.artist,
        genre: newMusic.genre,
        storage_url: newMusic.storage_url,
        duration: Number(newMusic.duration) || 60,
        mood_tags: tags
      });
      haptic.success();
      showToast('success', `Track "${newMusic.title}" successfully published to library! ✨`);
      setMusicTracks(prev => [res.track, ...prev]);
      setShowAddMusicModal(false);
      setMusicFile(null);
      setMusicFilePreviewUrl('');
      setNewMusic({
        title: '',
        artist: 'Wishora Studio',
        genre: 'Birthday Classics',
        mood_tags: 'joyful, celebration',
        storage_url: '',
        duration: 60
      });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to publish music track');
    } finally {
      setIsPublishingMusic(false);
    }
  };

  const handleDeleteMusic = async (id: string, title: string) => {
    if (!confirm(`Delete music track "${title}" permanently?`)) return;
    setDeletingMusicId(id);
    try {
      await api.deleteAdminMusic(id);
      haptic.medium();
      showToast('success', `Track "${title}" deleted successfully`);
      setMusicTracks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete track');
    } finally {
      setDeletingMusicId(null);
    }
  };

  const togglePlayMusic = (track: any) => {
    if (playingTrackId === track.id) {
      audioElem?.pause();
      setPlayingTrackId(null);
      return;
    }

    if (audioElem) {
      audioElem.pause();
    }

    if (track.storage_url) {
      const audio = new Audio(track.storage_url);
      audio.play().catch(() => showToast('error', 'Could not play audio track'));
      audio.onended = () => setPlayingTrackId(null);
      setAudioElem(audio);
      setPlayingTrackId(track.id);
    }
  };

  // 3. Wish Template Actions (Create, Edit, Delete)
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.content) {
      showToast('error', 'Title and Content are required');
      return;
    }
    try {
      const res = await api.createAdminTemplate(newTemplate);
      showToast('success', `Template "${newTemplate.title}" added`);
      setTemplates(prev => [res.template, ...prev]);
      setShowAddTemplateModal(false);
      setNewTemplate({
        title: '',
        content: '',
        category: 'heartfelt',
        tone: 'warm',
        language: 'en'
      });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to create template');
    }
  };

  const handleOpenEditTemplate = (tpl: any) => {
    setEditingTemplate(tpl);
    setEditTemplateForm({
      title: tpl.title || '',
      content: tpl.content || '',
      category: tpl.category || 'heartfelt',
      tone: tpl.tone || 'warm',
      language: tpl.language || 'en'
    });
  };

  const handleSaveEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    try {
      const res = await api.updateAdminTemplate(editingTemplate.id, editTemplateForm);
      showToast('success', `Template updated successfully`);
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? res.template : t));
      setEditingTemplate(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (!confirm(`Delete template "${title}"?`)) return;
    setDeletingTemplateId(id);
    try {
      await api.deleteAdminTemplate(id);
      haptic.medium();
      showToast('success', `Template deleted successfully`);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete template');
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // 4. Notification Actions
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) {
      showToast('error', 'Title and message are required');
      return;
    }
    try {
      const res = await api.sendAdminNotification({
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
        user_id: targetUser ? targetUser.id : null
      });
      showToast('success', `Notification sent (${res.recipient_type})`);
      setNotifications(prev => [res.notification, ...prev]);
      setShowSendNotifModal(false);
      setTargetUser(null);
      setNotifForm({ title: '', message: '', type: 'announcement' });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to broadcast notification');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteAdminNotification(id);
      showToast('success', 'Announcement removed');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete notification');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    return (
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Toast Alert */}
      {statusMessage && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slideUp text-sm font-medium ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <Check size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-rose-400" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ─── ADMIN HEADER WITH LIVE METRICS & LOGOUT ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#181124] via-[#100c1a] to-[#1a1429] border border-amber-400/30 p-6 sm:p-8 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)]">
        <AuraHalfCircle position="top-right" variant="gold-purple" size="lg" opacity={0.7} />
        <AuraHalfCircle position="bottom-left" variant="rose-gold" size="md" opacity={0.5} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono font-black uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <ShieldCheck size={14} className="text-amber-400" />
                CONCEALED MASTER ADMIN CONTROL
              </span>
              <span className="text-xs font-mono text-text-3">
                Logged in as <strong className="text-amber-300">{currentUser?.email}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight">
              Wishora <span className="gold-gradient-text">Administration Suite</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-xl">
              Strictly restricted admin operations. Direct audio file uploads, text template editors, bulk bulletins, and lifetime multi-tenant controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => { setTargetUser(null); setShowSendNotifModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-void text-xs font-black shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Send size={14} />
              <span>Broadcast Alert</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
                title="Log Out Administrator Session"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Live System Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/[0.1]">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-3 uppercase font-bold flex items-center gap-1">
              <Users size={12} className="text-sky-400" />
              TOTAL USERS
            </span>
            <span className="text-2xl font-display font-black text-white mt-1">{stats?.total_users ?? '...'}</span>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-3 uppercase font-bold flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              WISHES CREATED
            </span>
            <span className="text-2xl font-display font-black text-amber-300 mt-1">{stats?.total_wishes ?? '...'}</span>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-3 uppercase font-bold flex items-center gap-1">
              <Music size={12} className="text-emerald-400" />
              AUDIO TRACKS
            </span>
            <span className="text-2xl font-display font-black text-emerald-300 mt-1">{stats?.total_tracks ?? '...'}</span>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-3 uppercase font-bold flex items-center gap-1">
              <FileText size={12} className="text-pink-400" />
              TEXT TEMPLATES
            </span>
            <span className="text-2xl font-display font-black text-pink-300 mt-1">{stats?.total_templates ?? '...'}</span>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-3 uppercase font-bold flex items-center gap-1">
              <Bell size={12} className="text-rose-400" />
              NOTIFICATIONS
            </span>
            <span className="text-2xl font-display font-black text-rose-300 mt-1">{stats?.total_notifications ?? '...'}</span>
          </div>
        </div>
      </div>

      {/* ─── ADMIN TAB SELECTOR ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08]">
        {[
          { id: 'users', label: 'User Directory & Moderation', icon: Users, count: users.length },
          { id: 'notifications', label: 'Broadcasts & Direct Messages', icon: Bell, count: notifications.length },
          { id: 'music', label: 'Song Upload & Music Controls', icon: Music, count: musicTracks.length },
          { id: 'templates', label: 'Text Wish Templates', icon: FileText, count: templates.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                  : 'bg-white/[0.04] border border-white/[0.08] text-text-2 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-amber-400/30 text-amber-200' : 'bg-white/[0.1] text-text-3'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: USER MANAGEMENT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-4 bg-surface-elevated/70 border border-white/[0.1] rounded-2xl">
            <div className="relative w-full sm:w-96">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                placeholder="Search user by name, email or ID..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-void border border-white/[0.1] rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div className="text-xs font-mono text-text-3">
              Total registered: <strong className="text-white">{filteredUsers.length}</strong>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-surface-elevated/80 border border-white/[0.1] rounded-3xl overflow-hidden shadow-glass-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-void/60 text-[10px] font-mono text-text-3 uppercase tracking-wider">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-3">Role</th>
                    <th className="py-3.5 px-3 text-center">Wishes</th>
                    <th className="py-3.5 px-3 text-center">Contacts</th>
                    <th className="py-3.5 px-3 text-center">Reactions</th>
                    <th className="py-3.5 px-3">Registered</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                            alt={u.display_name}
                            className="w-9 h-9 rounded-xl object-cover border border-white/[0.1] bg-surface flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate flex items-center gap-1.5">
                              <span>{u.display_name || 'Anonymous User'}</span>
                              {u.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-400/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-text-3 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleUserRole(u.id, u.role)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                              : 'bg-white/[0.05] text-text-3 border-white/[0.1] hover:text-white'
                          }`}
                        >
                          {u.role === 'admin' ? '🛡️ ADMIN' : '👤 USER'}
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-300">
                        {u.wish_count || 0}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-sky-300">
                        {u.contact_count || 0}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-pink-300">
                        {u.reaction_count || 0}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-text-3">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setTargetUser(u); setShowSendNotifModal(true); }}
                            title="Send Direct Message to User"
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all cursor-pointer"
                          >
                            <Send size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            title="Permanently Terminate User & Data"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-text-3 font-mono text-xs">
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: BROADCASTS & NOTIFICATIONS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Sent Bulletins & Direct Messages ({notifications.length})
            </h3>
            <button
              onClick={() => { setTargetUser(null); setShowSendNotifModal(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Compose Bulletin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {notifications.map(n => (
              <div key={n.id} className="p-4 rounded-2xl bg-surface-elevated/70 border border-white/[0.1] space-y-2.5 relative group hover:border-amber-400/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        n.user_id ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}>
                        {n.user_id ? `DIRECT: ${n.target_user_email || n.user_id}` : 'ALL USERS (BROADCAST)'}
                      </span>
                      <span className="text-[10px] font-mono text-text-3">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="p-1 rounded-lg text-text-3 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-text-2 leading-relaxed whitespace-pre-wrap">{n.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed border-white/[0.1] rounded-3xl p-6">
                <Bell size={28} className="mx-auto text-text-3 mb-2" />
                <p className="text-xs text-text-2">No announcements sent yet. Broadcast updates or message users directly.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: MUSIC LIBRARY CONTROLLER WITH AUDIO UPLOAD TOOL
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'music' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Sound Library ({musicTracks.length} Tracks)
            </h3>
            <button
              onClick={() => setShowAddMusicModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-void text-xs font-black transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95"
            >
              <Upload size={14} />
              <span>Upload New Song</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {musicTracks.map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-surface-elevated/70 border border-white/[0.1] space-y-3 relative group hover:border-amber-400/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => togglePlayMusic(t)}
                      className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                    >
                      {playingTrackId === t.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{t.title}</h4>
                      <p className="text-[11px] font-mono text-text-3 truncate">{t.artist} • {t.duration}s</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMusic(t.id, t.title)}
                    className="p-1 rounded-lg text-text-3 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/[0.06] text-text-2">{t.genre || 'Soundtrack'}</span>
                  <span className="text-emerald-400 font-bold">● ACTIVE IN ENGINE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: TEXT WISH TEMPLATES (WITH EDIT & CREATE)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Curated Wish Text Templates ({templates.length})
            </h3>
            <button
              onClick={() => setShowAddTemplateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-void text-xs font-black transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95"
            >
              <Plus size={14} />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {templates.map(tpl => (
              <div key={tpl.id} className="p-4 rounded-2xl bg-surface-elevated/70 border border-white/[0.1] space-y-2.5 relative group hover:border-amber-400/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[9px] font-mono font-bold uppercase">
                        {tpl.category} • {tpl.tone}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTemplate(tpl)}
                      title="Edit Template"
                      className="p-1.5 rounded-lg text-text-3 hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                      title="Delete Template"
                      className="p-1.5 rounded-lg text-text-3 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-text-2 leading-relaxed italic">"{tpl.content}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: PROPER SONG UPLOAD TOOL (NO RAW URL) ─── */}
      {showAddMusicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-xl">
          <div className="relative w-full max-w-lg bg-surface-elevated border border-white/[0.15] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music2 size={20} className="text-amber-400" />
                <span>Upload Audio Song File</span>
              </h3>
              {!isPublishingMusic && (
                <button onClick={() => setShowAddMusicModal(false)} className="text-text-3 hover:text-white cursor-pointer p-1">
                  <X size={18} />
                </button>
              )}
            </div>

            {isPublishingMusic ? (
              <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-scaleIn">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin shadow-[0_0_30px_rgba(212,175,55,0.4)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-amber-300">
                    <Music2 size={26} className="animate-pulse" />
                  </div>
                </div>

                {/* Animated Soundwave Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-10">
                  {[40, 80, 100, 65, 95, 50, 85, 60, 90, 70].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-amber-500 via-rose-500 to-yellow-300 rounded-full animate-soundwave-pulse"
                      style={{ animationDelay: `${i * 0.1}s`, height: `${h}%` }}
                    />
                  ))}
                </div>

                <div className="space-y-2 max-w-sm">
                  <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Publishing Studio Audio Track
                  </h4>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold animate-pulse">
                    <Loader2 size={13} className="animate-spin" />
                    <span>{publishingStep}</span>
                  </div>
                  <p className="text-[11px] text-text-2 font-medium leading-relaxed">
                    Uploading high-fidelity audio data and indexing for all directors. Please keep this screen active...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateMusic} className="space-y-4">
                {/* File Upload Drop Zone */}
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1.5">
                    SELECT AUDIO FILE (.MP3, .WAV, .M4A, .AAC, .FLAC, .OGG)
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                      musicFile 
                        ? 'border-amber-400/70 bg-amber-400/[0.08]' 
                        : 'border-white/[0.15] hover:border-amber-400/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
                      className="hidden"
                      onChange={handleAudioFileSelected}
                    />

                    {isReadingAudio ? (
                      <div className="space-y-2 py-3">
                        <Loader2 size={24} className="animate-spin text-amber-400 mx-auto" />
                        <p className="text-xs font-bold text-white">Reading Audio & Computing Duration...</p>
                      </div>
                    ) : musicFile ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-amber-400 text-void flex items-center justify-center mx-auto shadow-glow-sm">
                          <Volume2 size={20} />
                        </div>
                        <div className="text-xs font-bold text-white truncate max-w-xs mx-auto">
                          {musicFile.name}
                        </div>
                        <div className="text-[10px] font-mono text-amber-300 font-bold">
                          {Math.round(musicFile.size / 1024)} KB • Duration: {newMusic.duration}s
                        </div>
                        <span className="inline-block text-[10px] font-mono text-text-3 underline">
                          Click to choose another song
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.06] text-amber-400 flex items-center justify-center mx-auto">
                          <Upload size={18} />
                        </div>
                        <p className="text-xs font-bold text-white">
                          Click to browse or drop an audio song
                        </p>
                        <p className="text-[10px] font-mono text-text-3">
                          MP3, WAV, M4A, FLAC supported
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Playback Test Preview */}
                {musicFilePreviewUrl && !isReadingAudio && (
                  <div className="p-3 bg-void/80 border border-white/[0.1] rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-white">Live Audio Loaded</span>
                    </div>
                    <audio controls src={musicFilePreviewUrl} className="h-8 max-w-[220px]" />
                  </div>
                )}

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Song Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Midnight Sunset Melody"
                      value={newMusic.title}
                      onChange={e => setNewMusic({ ...newMusic, title: e.target.value })}
                      className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Artist / Composer</label>
                    <input
                      type="text"
                      placeholder="e.g., Wishora Studio"
                      value={newMusic.artist}
                      onChange={e => setNewMusic({ ...newMusic, artist: e.target.value })}
                      className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Genre Category</label>
                    <input
                      type="text"
                      placeholder="e.g., Lo-fi Chill"
                      value={newMusic.genre}
                      onChange={e => setNewMusic({ ...newMusic, genre: e.target.value })}
                      className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Mood Tags</label>
                    <input
                      type="text"
                      placeholder="e.g., happy, celebratory"
                      value={newMusic.mood_tags}
                      onChange={e => setNewMusic({ ...newMusic, mood_tags: e.target.value })}
                      className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMusicModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-3 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <VelvetButton 
                    type="submit" 
                    variant="glow" 
                    size="md"
                    disabled={!newMusic.storage_url || isReadingAudio}
                  >
                    <Upload size={14} />
                    <span>Publish Song to App</span>
                  </VelvetButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CREATE TEMPLATE ─── */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-white/[0.15] rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-amber-400" />
                <span>Create Wish Template</span>
              </h3>
              <button onClick={() => setShowAddTemplateModal(false)} className="text-text-3 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Starlight & Golden Memories"
                  value={newTemplate.title}
                  onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full bg-void border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="heartfelt">Heartfelt</option>
                    <option value="playful">Playful / Humorous</option>
                    <option value="poetic">Poetic</option>
                    <option value="milestone">Milestone</option>
                    <option value="romantic">Romantic</option>
                    <option value="friendship">Friendship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Tone</label>
                  <select
                    value={newTemplate.tone}
                    onChange={e => setNewTemplate({ ...newTemplate, tone: e.target.value })}
                    className="w-full bg-void border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="warm">Warm</option>
                    <option value="humorous">Humorous</option>
                    <option value="nostalgic">Nostalgic</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="intimate">Intimate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Wish Text Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the full wish message..."
                  value={newTemplate.content}
                  onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-3 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <VelvetButton type="submit" variant="glow" size="sm">
                  Save Template
                </VelvetButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EDIT TEMPLATE ─── */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-white/[0.15] rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil size={18} className="text-amber-400" />
                <span>Edit Wish Template</span>
              </h3>
              <button onClick={() => setEditingTemplate(null)} className="text-text-3 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTemplate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTemplateForm.title}
                  onChange={e => setEditTemplateForm({ ...editTemplateForm, title: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Category</label>
                  <select
                    value={editTemplateForm.category}
                    onChange={e => setEditTemplateForm({ ...editTemplateForm, category: e.target.value })}
                    className="w-full bg-void border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="heartfelt">Heartfelt</option>
                    <option value="playful">Playful / Humorous</option>
                    <option value="poetic">Poetic</option>
                    <option value="milestone">Milestone</option>
                    <option value="romantic">Romantic</option>
                    <option value="friendship">Friendship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Tone</label>
                  <select
                    value={editTemplateForm.tone}
                    onChange={e => setEditTemplateForm({ ...editTemplateForm, tone: e.target.value })}
                    className="w-full bg-void border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="warm">Warm</option>
                    <option value="humorous">Humorous</option>
                    <option value="nostalgic">Nostalgic</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="intimate">Intimate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Wish Text Content</label>
                <textarea
                  required
                  rows={4}
                  value={editTemplateForm.content}
                  onChange={e => setEditTemplateForm({ ...editTemplateForm, content: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-3 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <VelvetButton type="submit" variant="glow" size="sm">
                  Save Changes
                </VelvetButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SEND NOTIFICATION (BULK OR DIRECT) ─── */}
      {showSendNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-white/[0.15] rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send size={18} className="text-amber-400" />
                <span>{targetUser ? `Message to ${targetUser.display_name}` : 'Broadcast to ALL Users'}</span>
              </h3>
              <button onClick={() => { setShowSendNotifModal(false); setTargetUser(null); }} className="text-text-3 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {targetUser ? (
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center gap-3">
                <img
                  src={targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.id}`}
                  alt=""
                  className="w-8 h-8 rounded-xl object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-white">{targetUser.display_name}</div>
                  <div className="text-[10px] font-mono text-sky-300">{targetUser.email}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200">
                📢 This bulletin will be broadcast to all registered Wishora users simultaneously.
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Exciting New 3D Cake Themes Available! ✨"
                  value={notifForm.title}
                  onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Message Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your official announcement or personalized message..."
                  value={notifForm.message}
                  onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowSendNotifModal(false); setTargetUser(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-3 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <VelvetButton type="submit" variant="glow" size="sm">
                  {targetUser ? 'Send Direct Message' : 'Send Broadcast'}
                </VelvetButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: PERMANENT TERMINATE USER CONFIRMATION ─── */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Permanently Terminate Account?</h3>
              <p className="text-xs text-text-2">
                You are about to delete user <strong className="text-rose-400">{deleteConfirmUser.email}</strong>.
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-300 text-left">
                ⚠️ This will permanently erase:
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>All wishes created by this user ({deleteConfirmUser.wish_count || 0})</li>
                  <li>All contacts & reminders ({deleteConfirmUser.contact_count || 0})</li>
                  <li>All photo albums, memory reels, and reactions</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-2 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleDeleteUserPermanently}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
              >
                Yes, Terminate Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
