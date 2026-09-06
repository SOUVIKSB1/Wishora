import React, { useState, useEffect, useRef } from 'react';
import { Home, BookOpen, Users, User, Plus, Sparkles, LogOut, ShieldCheck, Bell, Check, X, Download } from 'lucide-react';
import { api, getAuthToken, clearAuthToken, getCachedUser, setCachedUser } from './services/api.js';
import { logOutOfFirebase } from './services/firebase.js';
import { Contact, Folder } from './types/contact.js';
import { Wish, WishExperienceData } from './types/wish.js';
import { HomeView } from './components/HomeView.js';
import { WishbookView } from './components/wishbook/WishbookView.js';
import { ContactList } from './components/contacts/ContactList.js';
import { ProfileView } from './components/ProfileView.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { CreateWishModal } from './components/wizard/CreateWishModal.js';
import { AddContactModal } from './components/contacts/AddContactModal.js';
import { CsvImportModal } from './components/contacts/CsvImportModal.js';
import { OnboardingModal } from './components/OnboardingModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { WishExperienceView } from './components/experience/WishExperienceView.js';
import { DynamicBackground } from './components/ui/DynamicBackground.js';
import { InstallAppModal } from './components/ui/InstallAppModal.js';
import { getAvatarUrl } from './utils/avatar.js';
import { haptic } from './utils/haptics.js';
import { motion, AnimatePresence } from 'framer-motion';

const SAMPLE_DEMO_EXPERIENCE: WishExperienceData = {
  wish: {
    id: 'wsh_demo_01',
    user_id: 'usr_demo',
    slug: 'demo',
    recipient_name: 'Alex Rivera',
    recipient_dob: '2001-09-18',
    recipient_gender: 'female',
    wish_text: 'Happy Birthday Alex! May your journey ahead shimmer with boundless joy, unforgettable memories, and golden adventures! ✨',
    wish_language: 'en',
    theme: 'rose',
    music_id: 'trk_1',
    custom_music_url: null,
    music_trim_start: 0,
    music_trim_end: 30,
    music_volume: 0.8,
    version: 1,
    status: 'generated',
    scheduled_for: null,
    open_count: 1,
    last_opened_at: new Date().toISOString(),
    reaction_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_theme: 'rose',
    age_turning: 25,
    birth_year: 2001,
    sender_name: 'Director Souvik',
    music_title: 'Cinematic Golden Hour',
    music_artist: 'Wishora Orchestra',
    music_genre: 'Orchestral',
    music_storage_url: 'synth://golden_hour'
  },
  photos: [
    {
      id: 'pht_demo_1',
      wish_id: 'wsh_demo_01',
      storage_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      caption: 'Celebrating another unforgettable chapter ✨',
      sort_order: 0,
      is_featured: 1
    },
    {
      id: 'pht_demo_2',
      wish_id: 'wsh_demo_01',
      storage_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
      caption: 'Always illuminating every room you walk in 🌟',
      sort_order: 1,
      is_featured: 0
    }
  ],
  reactions: [],
  milestones: [
    { year: 2001, age: 0, title: 'The World Welcomed You', description: 'A brand new star began to illuminate the world.', tag: 'Birth Year', trivia: 'A timeless chapter began.' },
    { year: 2006, age: 5, title: 'Days of Boundless Wonder', description: 'Playground laughter and cartoons.', tag: 'Childhood', trivia: 'Building castles and dreams.' },
    { year: 2013, age: 12, title: 'Unlocking Passions', description: 'Late-night music and golden memories.', tag: 'Golden Era', trivia: 'Discovering who you are.' },
    { year: 2026, age: 25, title: '25 Magnificent Years', description: 'Here is to all your brilliance and every milestone to come!', tag: 'Today', trivia: 'Standing tall and loved by all.' }
  ]
};

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'wishbook' | 'contacts' | 'profile' | 'admin'>('home');
  const [user, setUser] = useState<any>(() => getCachedUser());
  const [stats, setStats] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getAuthToken() || !!getCachedUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // PWA Install Prompt State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createWizardInitial, setCreateWizardInitial] = useState<any>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Recipient experience state
  const [activeExperience, setActiveExperience] = useState<WishExperienceData | null>(null);
  const [isDirectorPreview, setIsDirectorPreview] = useState(false);
  const [isLoadingExperience, setIsLoadingExperience] = useState(false);

  // Capture PWA Install event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Check URL slug for direct recipient link (/w/:slug)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/w\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const slug = match[1];
      loadPublicExperience(slug, false);
      setIsCheckingAuth(false);
      return;
    }

    // Check auth status
    const token = getAuthToken();
    const cachedUser = getCachedUser();
    if (token || cachedUser) {
      if (cachedUser) {
        setUser(cachedUser);
        setIsAuthenticated(true);
        if (cachedUser.role === 'admin') {
          setActiveTab('admin');
        }
      }
      loadInitialData();
    } else {
      setIsCheckingAuth(false);
      setShowAuthModal(true);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const [authRes, contactsRes, wishesRes, foldersRes, notifsRes] = await Promise.all([
        api.getMe().catch(() => ({ user: null, stats: null })),
        api.getContacts().catch(() => ({ contacts: [] })),
        api.getWishes().catch(() => ({ wishes: [] })),
        api.getFolders().catch(() => ({ folders: [] })),
        api.getNotifications().catch(() => ({ notifications: [] })),
      ]);

      if (authRes.user) {
        setUser(authRes.user);
        setCachedUser(authRes.user);
        setStats(authRes.stats);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        if (authRes.user.role === 'admin') {
          setActiveTab('admin');
        }
      } else {
        const cached = getCachedUser();
        if (cached && getAuthToken()) {
          // Keep user logged in with cached identity - never auto logout!
          setUser(cached);
          setIsAuthenticated(true);
          setShowAuthModal(false);
          if (cached.role === 'admin') {
            setActiveTab('admin');
          }
        } else {
          setIsAuthenticated(false);
          setShowAuthModal(true);
        }
      }
      setContacts(contactsRes.contacts || []);
      setWishes(wishesRes.wishes || []);
      setFolders(foldersRes.folders || []);
      setNotifications(notifsRes.notifications || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    if (authenticatedUser?.role === 'admin') {
      setActiveTab('admin');
    }
    loadInitialData();
  };

  const handleLogout = async () => {
    await logOutOfFirebase();
    api.logout();
    setUser(null);
    setStats(null);
    setContacts([]);
    setWishes([]);
    setFolders([]);
    setNotifications([]);
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {}
  };

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  const loadPublicExperience = async (slug: string, isPreview: boolean = false) => {
    setIsLoadingExperience(true);
    setIsDirectorPreview(isPreview);
    if (slug === 'demo') {
      setActiveExperience(SAMPLE_DEMO_EXPERIENCE);
      setIsLoadingExperience(false);
      return;
    }
    try {
      const res = await api.getPublicWish(slug);
      setActiveExperience(res || SAMPLE_DEMO_EXPERIENCE);
    } catch (err) {
      console.warn('Using demo experience fallback:', err);
      setActiveExperience(SAMPLE_DEMO_EXPERIENCE);
    } finally {
      setIsLoadingExperience(false);
    }
  };

  const handleCreateWishForContact = (c: Contact) => {
    const dobString = c.dob_year
      ? `${c.dob_year}-${String(c.dob_month).padStart(2, '0')}-${String(c.dob_day || 1).padStart(2, '0')}`
      : `2000-${String(c.dob_month).padStart(2, '0')}-${String(c.dob_day || 1).padStart(2, '0')}`;

    setCreateWizardInitial({
      name: c.name,
      recipient_dob: dobString,
      gender: c.gender,
      relationship: c.relationship,
      avatar_url: c.avatar_url,
      contact_id: c.id
    });
    setShowCreateWizard(true);
  };

  const handleDeleteContact = async (id: string) => {
    await api.deleteContact(id);
    loadInitialData();
  };

  const handleBulkDeleteContacts = async (ids: string[]) => {
    await api.bulkDeleteContacts(ids);
    loadInitialData();
  };

  const handleDeleteAllContacts = async () => {
    await api.deleteAllContacts();
    loadInitialData();
  };

  const handleDeleteWish = async (id: string) => {
    await api.deleteWish(id);
    loadInitialData();
  };

  const handleCreateFolder = async (name: string, color: string) => {
    await api.createFolder({ name, color });
    loadInitialData();
  };

  const handleDeleteFolder = async (folderId: string) => {
    await api.deleteFolder(folderId);
    loadInitialData();
  };

  const handleMoveWishToFolder = async (wishId: string, folderId: string) => {
    await api.updateWish(wishId, { folder_id: folderId });
    loadInitialData();
  };

  if (activeExperience) {
    return (
      <WishExperienceView
        data={activeExperience}
        isPreview={isDirectorPreview}
        onExit={() => {
          setActiveExperience(null);
          setIsDirectorPreview(false);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  // ─── DEDICATED EXCLUSIVE ADMIN INTERFACE (CONCEALED FOR ADMINS ONLY) ───
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-void text-text-1 flex flex-col selection:bg-accent selection:text-void relative overflow-x-hidden p-4 sm:p-6">
        <DynamicBackground />
        <AdminDashboard currentUser={user} onLogout={handleLogout} />
      </div>
    );
  }

  // ─── STANDARD USER INTERFACE (REGULAR USERS) ───
  return (
    <div className="min-h-screen bg-void text-text-1 flex flex-col selection:bg-accent selection:text-void relative overflow-x-hidden">
      {/* Dynamic Ambient Rainbow Aura & Particle Flow in Background */}
      <DynamicBackground />

      {/* Sticky Glass Top Navbar */}
      <header className="sticky top-0 z-30 bg-void/85 backdrop-blur-2xl border-b border-white/[0.09] px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div
            onClick={() => {
              haptic.light();
              setActiveTab('home');
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 via-purple-600 to-cyan-400 p-[1.5px] shadow-[0_0_20px_rgba(244,114,182,0.35)] group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-void rounded-[14px] flex items-center justify-center font-display font-black text-amber-300 text-base sm:text-lg">
                W
              </div>
            </div>
            <div>
              <span className="text-base sm:text-lg font-display font-black tracking-tight text-white group-hover:text-amber-400 transition-colors block leading-tight">
                WISHORA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-amber-400/90 uppercase block font-semibold">
                CINEMATIC ENGINE
              </span>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install App Button */}
            <button
              onClick={() => {
                haptic.medium();
                setShowInstallModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-95"
              title="Install WISHORA App"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {/* Notification Center Bell */}
            {user && (
              <button
                onClick={() => {
                  haptic.light();
                  setShowNotificationsModal(true);
                }}
                className="relative p-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-text-2 hover:text-white transition-all cursor-pointer flex-shrink-0 active:scale-95"
                title="Announcements & Bulletins"
              >
                <Bell size={16} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-void text-[9px] font-mono font-black flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {user && (
              <button
                onClick={() => {
                  haptic.light();
                  setActiveTab('profile');
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border transition-all cursor-pointer p-0.5 flex-shrink-0 active:scale-95 ${
                  activeTab === 'profile'
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'border-white/[0.14] hover:border-amber-400/60'
                }`}
                title="Director Profile"
              >
                <img
                  src={getAvatarUrl(user.display_name || 'Director', user.avatar_url, user.gender)}
                  alt={user.display_name || 'Director'}
                  className="w-full h-full object-cover rounded-[14px] bg-surface-elevated"
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 mb-24">
        {/* Tab Pages */}
        <main className="w-full">
          {activeTab === 'home' && (
            <HomeView
              user={user}
              contacts={contacts}
              wishes={wishes}
              stats={stats}
              onNewWish={() => {
                setCreateWizardInitial(null);
                setShowCreateWizard(true);
              }}
              onSelectWish={(w) => {
                setCreateWizardInitial(w);
                setShowCreateWizard(true);
              }}
              onCreateWishForContact={handleCreateWishForContact}
              onPreviewExperience={(slug) => loadPublicExperience(slug, true)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'wishbook' && (
            <WishbookView
              wishes={wishes}
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onMoveWishToFolder={handleMoveWishToFolder}
              onSelectWish={(w) => {
                setCreateWizardInitial(w);
                setShowCreateWizard(true);
              }}
              onPreviewExperience={(slug) => loadPublicExperience(slug, true)}
              onDeleteWish={handleDeleteWish}
              onNewWish={() => {
                setCreateWizardInitial(null);
                setShowCreateWizard(true);
              }}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactList
              contacts={contacts}
              onAddContact={() => {
                setEditContact(null);
                setShowAddContact(true);
              }}
              onImportCsv={() => setShowCsvImport(true)}
              onCreateWishForContact={handleCreateWishForContact}
              onDeleteContact={handleDeleteContact}
              onBulkDeleteContacts={handleBulkDeleteContacts}
              onDeleteAllContacts={handleDeleteAllContacts}
              onEditContact={(c) => {
                setEditContact(c);
                setShowAddContact(true);
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              stats={stats}
              onUpdate={loadInitialData}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Navigation Bar (Apple-Grade Responsive Dock) */}
      <nav className="fixed bottom-3 sm:bottom-4 inset-x-0 z-40 max-w-sm sm:max-w-md mx-auto px-3 sm:px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        <div className="bg-[#0B0B14]/90 border border-white/[0.14] rounded-full p-1.5 sm:p-2 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(212,175,55,0.18)] flex items-center justify-around pointer-events-auto relative">
          {[
            { key: 'home', label: 'Home', icon: <Home size={17} /> },
            { key: 'wishbook', label: 'Wishbook', icon: <BookOpen size={17} /> },
            { key: 'contacts', label: 'Contacts', icon: <Users size={17} /> },
            { key: 'profile', label: 'Director', icon: <User size={17} /> },
          ].map((item) => {
            const isActive = activeTab === item.key;
            return (
              <motion.button
                key={item.key}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  haptic.light();
                  setActiveTab(item.key as any);
                }}
                className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer z-10 ${
                  isActive
                    ? 'text-void font-extrabold'
                    : 'text-text-2 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDockPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(212,175,55,0.6)] -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                {item.icon}
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Notification Center Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-xl">
          <div className="relative w-full max-w-lg bg-surface-elevated border border-white/[0.15] rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Announcements & Bulletins</h3>
                  <p className="text-[11px] font-mono text-text-3">Updates from Wishora Headquarters</p>
                </div>
              </div>
              <button onClick={() => setShowNotificationsModal(false)} className="text-text-3 hover:text-white cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkNotificationRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    n.is_read
                      ? 'bg-white/[0.02] border-white/[0.06] text-text-2'
                      : 'bg-amber-400/[0.08] border-amber-400/30 text-white shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{n.title}</span>
                    <span className="text-[10px] font-mono text-text-3">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-text-2 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                  {!n.is_read && (
                    <div className="flex justify-end pt-1">
                      <span className="text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1">
                        <Check size={12} /> Mark read
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12 text-text-3 font-mono text-xs">
                  No announcements at this time. You are all caught up! ✨
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Presented if not logged in or requested) */}
      {(!isAuthenticated || showAuthModal) && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onPreviewDemo={() => loadPublicExperience('demo', true)}
        />
      )}

      {/* PWA App Install Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredInstallPrompt}
      />

      {/* Modals */}
      {showCreateWizard && (
        <CreateWishModal
          initialData={createWizardInitial}
          folders={folders}
          onClose={() => setShowCreateWizard(false)}
          onSuccess={() => {
            loadInitialData();
          }}
        />
      )}

      {showAddContact && (
        <AddContactModal
          editContact={editContact}
          onClose={() => setShowAddContact(false)}
          onAdded={loadInitialData}
        />
      )}

      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onImported={loadInitialData}
        />
      )}

      {showOnboarding && isAuthenticated && (
        <OnboardingModal
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}

export default App;

