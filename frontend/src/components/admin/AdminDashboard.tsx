import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Music, FileText, Bell, Sparkles, Trash2, 
  Plus, Search, RefreshCw, Crown, AlertTriangle, Check, X,
  Play, Pause, Send, ExternalLink, Filter, ShieldAlert, Award
} from 'lucide-react';
import { api } from '../../services/api.js';
import { AuraHalfCircle } from '../ui/AuraHalfCircle.js';
import { VelvetButton } from '../ui/VelvetButton.js';

interface AdminDashboardProps {
  currentUser: any;
  onClose?: () => void;
}

type AdminTab = 'users' | 'notifications' | 'music' | 'templates' | 'stats';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');

  // Audio Playback
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  // Modals
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [newMusic, setNewMusic] = useState({
    title: '',
    artist: 'Wishora Studio',
    genre: 'Birthday Classics',
    mood_tags: 'joyful, celebration',
    storage_url: '',
    duration: 60,
    is_premium: false
  });

  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    category: 'heartfelt',
    tone: 'warm',
    language: 'en',
    is_premium: false
  });

  const [showSendNotifModal, setShowSendNotifModal] = useState(false);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    type: 'announcement'
  });

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
  const handleUpdateUserPlan = async (userId: string, newPlan: string) => {
    try {
      await api.updateUserPlan(userId, newPlan);
      showToast('success', `User upgraded/changed to ${newPlan.toUpperCase()}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update user plan');
    }
  };

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

  // 2. Music Actions
  const handleCreateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusic.title || !newMusic.storage_url) {
      showToast('error', 'Title and Storage URL are required');
      return;
    }
    try {
      const tags = newMusic.mood_tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.addAdminMusic({
        title: newMusic.title,
        artist: newMusic.artist,
        genre: newMusic.genre,
        storage_url: newMusic.storage_url,
        duration: Number(newMusic.duration) || 60,
        mood_tags: tags,
        is_premium: newMusic.is_premium
      });
      showToast('success', `Track "${newMusic.title}" published to library`);
      setMusicTracks(prev => [res.track, ...prev]);
      setShowAddMusicModal(false);
      setNewMusic({
        title: '',
        artist: 'Wishora Studio',
        genre: 'Birthday Classics',
        mood_tags: 'joyful, celebration',
        storage_url: '',
        duration: 60,
        is_premium: false
      });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to publish music track');
    }
  };

  const handleDeleteMusic = async (id: string, title: string) => {
    if (!confirm(`Delete music track "${title}" permanently?`)) return;
    try {
      await api.deleteAdminMusic(id);
      showToast('success', `Track "${title}" deleted`);
      setMusicTracks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete track');
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

    if (track.storage_url?.startsWith('http')) {
      const audio = new Audio(track.storage_url);
      audio.play().catch(() => showToast('error', 'Could not play audio track URL'));
      audio.onended = () => setPlayingTrackId(null);
      setAudioElem(audio);
      setPlayingTrackId(track.id);
    } else {
      showToast('success', `Previewing track: ${track.title}`);
    }
  };

  // 3. Wish Template Actions
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
        language: 'en',
        is_premium: false
      });
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (!confirm(`Delete template "${title}"?`)) return;
    try {
      await api.deleteAdminTemplate(id);
      showToast('success', `Template deleted`);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete template');
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
    const matchesSearch = 
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
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

      {/* ─── ADMIN HEADER WITH LIVE METRICS ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#181124] via-[#100c1a] to-[#1a1429] border border-amber-400/30 p-6 sm:p-8 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)]">
        <AuraHalfCircle position="top-right" variant="gold-purple" size="lg" opacity={0.7} />
        <AuraHalfCircle position="bottom-left" variant="rose-gold" size="md" opacity={0.5} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono font-black uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <ShieldCheck size={14} className="text-amber-400" />
                MASTER ADMIN CONTROL
              </span>
              <span className="text-xs font-mono text-text-3">
                Logged in as <strong className="text-amber-300">{currentUser?.email}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight">
              Wishora <span className="gold-gradient-text">Command Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-2 max-w-xl">
              Manage platform users, upgrade VIP subscriptions, push updates, manage audio library & templates, and broadcast announcements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Stats</span>
            </button>
            <button
              onClick={() => { setTargetUser(null); setShowSendNotifModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-void text-xs font-black shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Send size={14} />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </div>

        {/* Live System Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/[0.1]">
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
              <Crown size={12} className="text-purple-400" />
              VIP MEMBERS
            </span>
            <span className="text-2xl font-display font-black text-purple-300 mt-1">{stats?.active_vip_users ?? '...'}</span>
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
          { id: 'users', label: 'User Management & VIP Plans', icon: Users, count: users.length },
          { id: 'notifications', label: 'Broadcasts & Direct Messages', icon: Bell, count: notifications.length },
          { id: 'music', label: 'Music Library Controls', icon: Music, count: musicTracks.length },
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
          TAB 1: USER MANAGEMENT & VIP PLANS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-surface-elevated/70 border border-white/[0.1] rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                placeholder="Search user by name, email or ID..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-void border border-white/[0.1] rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-mono text-text-3">PLAN:</span>
              <select
                value={userPlanFilter}
                onChange={e => setUserPlanFilter(e.target.value)}
                className="bg-void border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">All Plans ({users.length})</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP</option>
                <option value="executive">Executive</option>
              </select>
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
                    <th className="py-3.5 px-3">VIP Plan Tier</th>
                    <th className="py-3.5 px-3 text-center">Wishes</th>
                    <th className="py-3.5 px-3 text-center">Contacts</th>
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

                      <td className="py-3.5 px-3">
                        <select
                          value={u.plan || 'free'}
                          onChange={e => handleUpdateUserPlan(u.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer transition-all ${
                            u.plan === 'executive'
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                              : u.plan === 'vip'
                              ? 'bg-purple-400/20 text-purple-300 border-purple-400/50'
                              : u.plan === 'pro'
                              ? 'bg-sky-400/20 text-sky-300 border-sky-400/50'
                              : 'bg-void text-text-2 border-white/[0.1]'
                          }`}
                        >
                          <option value="free" className="bg-void text-white">Free Tier</option>
                          <option value="pro" className="bg-void text-sky-300">Pro Tier</option>
                          <option value="vip" className="bg-void text-purple-300">VIP Tier</option>
                          <option value="executive" className="bg-void text-amber-300">Executive VIP</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-300">
                        {u.wish_count || 0}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-sky-300">
                        {u.contact_count || 0}
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
              Sent Announcements & Bulletins ({notifications.length})
            </h3>
            <button
              onClick={() => { setTargetUser(null); setShowSendNotifModal(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Compose Message</span>
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
          TAB 3: MUSIC LIBRARY CONTROLLER
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'music' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Music Tracks ({musicTracks.length})
            </h3>
            <button
              onClick={() => setShowAddMusicModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-void text-xs font-black transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              <Plus size={14} />
              <span>Add New Track</span>
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
                  {t.is_premium ? (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      👑 VIP ONLY
                    </span>
                  ) : (
                    <span className="text-emerald-400">FREE FOR ALL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: TEXT WISH TEMPLATES
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Curated Wish Text Templates ({templates.length})
            </h3>
            <button
              onClick={() => setShowAddTemplateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-void text-xs font-black transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
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
                      {tpl.is_premium ? (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold">
                          VIP
                        </span>
                      ) : null}
                    </div>
                    <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                  </div>

                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                    className="p-1 rounded-lg text-text-3 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-xs text-text-2 leading-relaxed italic">"{tpl.content}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD MUSIC ─── */}
      {showAddMusicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-white/[0.15] rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music size={18} className="text-amber-400" />
                <span>Add Audio Track</span>
              </h3>
              <button onClick={() => setShowAddMusicModal(false)} className="text-text-3 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMusic} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Midnight Sunset Symphony"
                  value={newMusic.title}
                  onChange={e => setNewMusic({ ...newMusic, title: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Artist / Composer</label>
                <input
                  type="text"
                  placeholder="e.g., Wishora Orchestra"
                  value={newMusic.artist}
                  onChange={e => setNewMusic({ ...newMusic, artist: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g., Lo-fi Chill"
                    value={newMusic.genre}
                    onChange={e => setNewMusic({ ...newMusic, genre: e.target.value })}
                    className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Duration (sec)</label>
                  <input
                    type="number"
                    value={newMusic.duration}
                    onChange={e => setNewMusic({ ...newMusic, duration: Number(e.target.value) })}
                    className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Audio URL / Storage Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or synth://track_name"
                  value={newMusic.storage_url}
                  onChange={e => setNewMusic({ ...newMusic, storage_url: e.target.value })}
                  className="w-full bg-void border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_prem"
                  checked={newMusic.is_premium}
                  onChange={e => setNewMusic({ ...newMusic, is_premium: e.target.checked })}
                  className="rounded border-white/[0.2] bg-void text-amber-400 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_prem" className="text-xs text-text-2 font-medium cursor-pointer">
                  Require VIP Subscription for this track
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMusicModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-3 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <VelvetButton type="submit" variant="glow" size="sm">
                  Publish Track
                </VelvetButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD TEMPLATE ─── */}
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
                  placeholder="e.g., Midnight Stars & Memories"
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
                <label className="block text-[10px] font-mono text-text-3 uppercase font-bold mb-1">Wish Text Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the full heartfelt wish message..."
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

      {/* ─── MODAL 3: SEND NOTIFICATION (BULK OR DIRECT) ─── */}
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
                📢 This bulletin will be broadcast to all registered Wishora directors simultaneously.
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
                  placeholder="Type your official announcement or personalized gift note..."
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

      {/* ─── MODAL 4: PERMANENT TERMINATE USER CONFIRMATION ─── */}
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
                  <li>All contacts & birthday reminders ({deleteConfirmUser.contact_count || 0})</li>
                  <li>All photo albums, memory reels, and voice/video reactions</li>
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
