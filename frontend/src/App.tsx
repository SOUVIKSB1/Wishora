import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Users, User, Plus, Sparkles, LogOut } from 'lucide-react';
import { api, getAuthToken, clearAuthToken } from './services/api.js';
import { logOutOfFirebase } from './services/firebase.js';
import { Contact, Folder } from './types/contact.js';
import { Wish, WishExperienceData } from './types/wish.js';
import { HomeView } from './components/HomeView.js';
import { WishbookView } from './components/wishbook/WishbookView.js';
import { ContactList } from './components/contacts/ContactList.js';
import { ProfileView } from './components/ProfileView.js';
import { CreateWishModal } from './components/wizard/CreateWishModal.js';
import { AddContactModal } from './components/contacts/AddContactModal.js';
import { CsvImportModal } from './components/contacts/CsvImportModal.js';
import { OnboardingModal } from './components/OnboardingModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { WishExperienceView } from './components/experience/WishExperienceView.js';
import { ParticleField } from './components/canvas/ParticleField.js';
import { getAvatarUrl } from './utils/avatar.js';

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'wishbook' | 'contacts' | 'profile'>('home');
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
    if (token) {
      loadInitialData();
    } else {
      setIsCheckingAuth(false);
      setShowAuthModal(true);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const [authRes, contactsRes, wishesRes, foldersRes] = await Promise.all([
        api.getMe().catch(() => ({ user: null, stats: null })),
        api.getContacts().catch(() => ({ contacts: [] })),
        api.getWishes().catch(() => ({ wishes: [] })),
        api.getFolders().catch(() => ({ folders: [] })),
      ]);

      if (authRes.user) {
        setUser(authRes.user);
        setStats(authRes.stats);
        setIsAuthenticated(true);
        setShowAuthModal(false);
      } else {
        setIsAuthenticated(false);
        setShowAuthModal(true);
      }
      setContacts(contactsRes.contacts || []);
      setWishes(wishesRes.wishes || []);
      setFolders(foldersRes.folders || []);
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
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  const loadPublicExperience = async (slug: string, isPreview: boolean = false) => {
    setIsLoadingExperience(true);
    setIsDirectorPreview(isPreview);
    try {
      const res = await api.getPublicWish(slug);
      setActiveExperience(res);
    } catch (err) {
      console.error('Failed to load experience for slug:', slug, err);
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

  return (
    <div className="min-h-screen bg-void text-text-1 flex flex-col selection:bg-accent selection:text-void relative overflow-x-hidden">
      {/* Ambient Particle Field in Background */}
      <ParticleField density={30} colors={['#C8A96E', '#FFF1D0', '#7C3AED']} />

      {/* Sticky Glass Top Navbar */}
      <header className="sticky top-0 z-30 bg-void/85 backdrop-blur-2xl border-b border-white/[0.09] px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-accent to-yellow-700 flex items-center justify-center font-display font-black text-void text-base sm:text-lg shadow-[0_0_15px_rgba(200,169,110,0.35)] group-hover:scale-105 transition-transform flex-shrink-0">
              W
            </div>
            <div>
              <span className="text-base sm:text-lg font-display font-black tracking-tight text-white group-hover:text-accent transition-colors block leading-tight">
                WISHORA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-accent uppercase block font-semibold">
                CINEMATIC ENGINE
              </span>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setCreateWizardInitial(null);
                setShowCreateWizard(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] text-xs font-black shadow-[0_0_20px_rgba(200,169,110,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={13} className="text-[#06060A] fill-[#06060A]" />
              <span className="hidden sm:inline">Direct New Wish</span>
              <span className="sm:hidden font-bold">New Wish</span>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border transition-all cursor-pointer p-0.5 flex-shrink-0 ${
                  activeTab === 'profile'
                    ? 'border-accent ring-2 ring-accent/40 scale-105'
                    : 'border-white/[0.14] hover:border-accent/60'
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
        <div className="bg-[#0B0B14]/90 border border-white/[0.14] rounded-full p-1.5 sm:p-2 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(200,169,110,0.15)] flex items-center justify-around pointer-events-auto">
          {[
            { key: 'home', label: 'Home', icon: <Home size={17} /> },
            { key: 'wishbook', label: 'Wishbook', icon: <BookOpen size={17} /> },
            { key: 'contacts', label: 'Contacts', icon: <Users size={17} /> },
            { key: 'profile', label: 'Director', icon: <User size={17} /> },
          ].map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as any)}
                className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 via-accent to-yellow-500 text-void shadow-[0_0_15px_rgba(200,169,110,0.5)] font-extrabold scale-[1.02]'
                    : 'text-text-2 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {item.icon}
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Auth Modal (Presented if not logged in or requested) */}
      {(!isAuthenticated || showAuthModal) && (
        <AuthModal
          onSuccess={handleAuthSuccess}
        />
      )}

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

