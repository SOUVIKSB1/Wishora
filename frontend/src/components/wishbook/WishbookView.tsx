import React, { useState } from 'react';
import { Wish } from '../../types/wish.js';
import { Folder } from '../../types/contact.js';
import { Folder as FolderIcon, Sparkles, Clock, Video, Eye, Plus, Trash2, ExternalLink, Play, Pause, MessageSquare, X, ArrowLeft, Mic, Share2, Heart, Check, Edit3, ChevronDown, CheckCircle2, Layers, Calendar, History, Send, MessageCircle, RotateCcw, Loader2 } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { getAvatarUrl } from '../../utils/avatar.js';
import { api } from '../../services/api.js';

interface WishbookViewProps {
  wishes: Wish[];
  folders: Folder[];
  onCreateFolder: (name: string, color: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onMoveWishToFolder?: (wishId: string, folderId: string) => void;
  onSelectWish: (wish: Wish) => void;
  onPreviewExperience: (slug: string) => void;
  onDeleteWish: (id: string) => void;
  onNewWish: () => void;
}

export const WishbookView: React.FC<WishbookViewProps> = ({
  wishes,
  folders,
  onCreateFolder,
  onDeleteFolder,
  onMoveWishToFolder,
  onSelectWish,
  onPreviewExperience,
  onDeleteWish,
  onNewWish
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'timeline' | 'folders' | 'drafts' | 'vault'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#EAB308');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [openFolderPickerWishId, setOpenFolderPickerWishId] = useState<string | null>(null);
  const [expandedStacks, setExpandedStacks] = useState<Record<string, boolean>>({});

  // Fast share feedback
  const [copiedWishSlug, setCopiedWishSlug] = useState<string | null>(null);

  // Version history modal state
  const [activeVersionWish, setActiveVersionWish] = useState<Wish | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // Reaction viewer modal state
  const [activeReactionWish, setActiveReactionWish] = useState<Wish | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const drafts = wishes.filter(w => w.status === 'draft');
  const generatedWishes = wishes.filter(w => w.status === 'generated' || w.status === 'sent');
  const reactedWishes = wishes.filter(w => !!w.reaction_url || (w.reaction_count && w.reaction_count > 0));

  const filteredGeneratedWishes = selectedFolderId
    ? generatedWishes.filter(w => w.folder_id === selectedFolderId)
    : generatedWishes;

  // Group wishes by recipient name to stack multiple wishes for the same person
  const groupedWishes = React.useMemo(() => {
    const groups: Record<string, Wish[]> = {};
    filteredGeneratedWishes.forEach(w => {
      const key = (w.recipient_name || 'Friend').trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    });
    return Object.entries(groups).map(([recipient, items]) => ({
      recipient,
      firstName: recipient.split(' ')[0] || recipient,
      items
    }));
  }, [filteredGeneratedWishes]);

  // Chronological Time-Wise Hierarchy Grouping (Year / Month)
  const timeGroupedWishes = React.useMemo(() => {
    const groups: Record<string, Wish[]> = {};
    const sorted = [...filteredGeneratedWishes].sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tB - tA;
    });

    sorted.forEach(w => {
      const d = w.created_at ? new Date(w.created_at) : new Date();
      const year = isNaN(d.getFullYear()) ? '2026' : d.getFullYear().toString();
      const month = isNaN(d.getMonth()) ? 'Recent' : d.toLocaleString('en-US', { month: 'long' });
      const key = `${year} • ${month}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    });

    return Object.entries(groups).map(([timeLabel, items]) => ({
      timeLabel,
      items
    }));
  }, [filteredGeneratedWishes]);

  const toggleStack = (recipient: string) => {
    setExpandedStacks(prev => ({
      ...prev,
      [recipient]: !prev[recipient]
    }));
  };

  const handleCopyShareLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`);
    setCopiedWishSlug(slug);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedWishSlug(null);
      setCopiedLink(false);
    }, 2000);
  };

  const handleFastShareWhatsApp = (w: Wish) => {
    const shareUrl = `${window.location.origin}/w/${w.slug}`;
    const text = encodeURIComponent(`✨ Happy Birthday ${w.recipient_name}! I directed a bespoke birthday film experience just for you: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleFastShareSMS = (w: Wish) => {
    const shareUrl = `${window.location.origin}/w/${w.slug}`;
    const text = encodeURIComponent(`✨ Happy Birthday ${w.recipient_name}! Open your sealed birthday film: ${shareUrl}`);
    window.open(`sms:?&body=${text}`, '_blank');
  };

  const handleNativeShare = async (w: Wish) => {
    const shareUrl = `${window.location.origin}/w/${w.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Birthday Film for ${w.recipient_name}`,
          text: `A sealed cinematic birthday surprise for ${w.recipient_name}! ✨`,
          url: shareUrl
        });
      } catch (e) {}
    } else {
      handleCopyShareLink(w.slug);
    }
  };

  const handleOpenVersions = async (w: Wish) => {
    setActiveVersionWish(w);
    setIsLoadingVersions(true);
    try {
      const res = await api.getWishVersions(w.id);
      setVersions(res.versions || []);
    } catch (err) {
      console.error('Failed to load wish versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRevertVersion = async (versionId: string) => {
    if (!activeVersionWish) return;
    setIsReverting(true);
    try {
      await api.revertWishVersion(activeVersionWish.id, versionId);
      setActiveVersionWish(null);
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Failed to revert version');
    } finally {
      setIsReverting(false);
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleConfirmDeleteFolder = () => {
    if (folderToDelete && onDeleteFolder) {
      onDeleteFolder(folderToDelete.id);
      if (selectedFolderId === folderToDelete.id) {
        setSelectedFolderId(null);
      }
      setFolderToDelete(null);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderId(folderId);
    setActiveTab('all');
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            My Wishbook
          </h1>
          <p className="text-xs sm:text-sm text-text-2 mt-1 font-medium">
            Your personal archives of cinematic moments, organized folders, and emotional reactions.
          </p>
        </div>

        <VelvetButton
          variant="glow"
          size="sm"
          icon={<Plus size={15} />}
          onClick={onNewWish}
        >
          Direct New Wish
        </VelvetButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.12] pb-3 overflow-x-auto">
        {[
          { key: 'all', label: 'All Wishes', count: generatedWishes.length },
          { key: 'timeline', label: '📅 Time Timeline', count: timeGroupedWishes.length },
          { key: 'folders', label: 'Folders', count: folders.length },
          { key: 'drafts', label: 'Drafts', count: drafts.length },
          { key: 'vault', label: 'Memory Vault', count: reactedWishes.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              if (tab.key !== 'all' && tab.key !== 'timeline') setSelectedFolderId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key && !selectedFolderId
                ? 'bg-accent/20 border border-accent text-accent shadow-glow-sm'
                : 'text-text-2 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.1] text-white font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Folder Filter Bar if Selected */}
      {selectedFolder && (activeTab === 'all' || activeTab === 'timeline') && (
        <div className="flex items-center justify-between bg-surface-elevated/90 border border-accent/40 rounded-2xl p-3 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{ backgroundColor: `${selectedFolder.color}25`, color: selectedFolder.color }}
            >
              <FolderIcon size={14} />
            </div>
            <span className="text-xs font-bold text-white">
              Folder: <span className="text-accent">{selectedFolder.name}</span> ({filteredGeneratedWishes.length} wishes)
            </span>
          </div>

          <button
            onClick={() => setSelectedFolderId(null)}
            className="text-xs font-mono text-text-2 hover:text-white flex items-center gap-1 bg-white/[0.06] hover:bg-white/[0.1] px-3 py-1 rounded-full cursor-pointer transition-colors"
          >
            <X size={12} />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* TAB 1: ALL WISHES (Grouped & Stacked by Person) */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {groupedWishes.length === 0 ? (
            <div className="border border-dashed border-white/[0.14] rounded-3xl p-12 text-center bg-white/[0.02]">
              <Sparkles size={36} className="mx-auto text-accent mb-3 opacity-80" />
              <h3 className="text-base font-bold text-white">No wishes in this folder yet</h3>
              <p className="text-xs text-text-2 mt-1 mb-4">Start crafting your first bespoke 90s birthday film.</p>
              <VelvetButton variant="primary" size="sm" onClick={onNewWish}>
                Craft a Wish
              </VelvetButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedWishes.map(group => {
                const isStack = group.items.length > 1;
                const isExpanded = expandedStacks[group.recipient] || false;
                const displayItems = isStack && !isExpanded ? [group.items[0]] : group.items;

                return (
                  <div key={group.recipient} className={isStack ? 'col-span-1 space-y-3' : 'col-span-1'}>
                    {/* Stack Header for Multiple Wishes */}
                    {isStack && (
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-accent" />
                          <span className="text-xs font-bold text-white">{group.firstName}'s Stack</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
                            {group.items.length} Films
                          </span>
                        </div>
                        <button
                          onClick={() => toggleStack(group.recipient)}
                          className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <span>{isExpanded ? 'Collapse Stack ↑' : 'Expand All (' + group.items.length + ') ↓'}</span>
                        </button>
                      </div>
                    )}

                    {displayItems.map((w, idx) => (
                      <div
                        key={w.id}
                        className={`bg-surface-elevated border rounded-3xl p-5 flex flex-col justify-between gap-4 backdrop-blur-xl group transition-all shadow-glass-card relative ${
                          isStack && !isExpanded
                            ? 'border-accent/40 shadow-[0_10px_25px_rgba(200,169,110,0.12)] ring-1 ring-accent/30'
                            : 'border-white/[0.14] hover:border-accent/60'
                        }`}
                      >
                        {/* Visual layered stack backing effect when collapsed */}
                        {isStack && !isExpanded && idx === 0 && (
                          <div className="absolute -bottom-1.5 inset-x-4 h-3 bg-surface border-b border-accent/20 rounded-b-2xl -z-10 opacity-70" />
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-3 relative">
                            {/* Folder Pill / Dropdown to move wish */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenFolderPickerWishId(openFolderPickerWishId === w.id ? null : w.id)}
                                className="text-[11px] font-mono px-3 py-1 rounded-full uppercase font-bold tracking-wider hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                                style={{
                                  backgroundColor: `${w.folder_color || '#EAB308'}25`,
                                  color: w.folder_color || '#EAB308',
                                  border: `1px solid ${w.folder_color || '#EAB308'}40`
                                }}
                                title="Click to move to another folder"
                              >
                                <FolderIcon size={11} />
                                <span>{w.folder_name || 'My Wishes'}</span>
                                <ChevronDown size={10} className="opacity-70" />
                              </button>

                              {/* Dropdown Menu for moving wish to folder */}
                              {openFolderPickerWishId === w.id && (
                                <div className="absolute top-full left-0 mt-1 z-30 w-48 bg-[#0F0F18] border border-white/20 rounded-2xl p-2 shadow-2xl space-y-1 backdrop-blur-2xl">
                                  <span className="text-[10px] font-mono text-text-3 font-bold px-2 py-1 block uppercase">
                                    Move to Folder
                                  </span>
                                  {folders.map(f => (
                                    <button
                                      key={f.id}
                                      onClick={() => {
                                        if (onMoveWishToFolder) onMoveWishToFolder(w.id, f.id);
                                        setOpenFolderPickerWishId(null);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                        w.folder_id === f.id
                                          ? 'bg-accent/20 text-accent font-bold'
                                          : 'text-text-1 hover:bg-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                                        <span className="truncate">{f.name}</span>
                                      </div>
                                      {w.folder_id === f.id && <Check size={12} className="text-accent" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Version History Button */}
                              <button
                                onClick={() => handleOpenVersions(w)}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] hover:bg-accent/20 border border-white/[0.12] hover:border-accent/40 text-text-2 hover:text-accent text-[10px] font-mono font-bold transition-all cursor-pointer"
                                title="View revision history"
                              >
                                <History size={10} />
                                <span>v{w.version || 1}</span>
                              </button>

                              {w.reaction_url && (
                                <button
                                  onClick={() => setActiveReactionWish(w)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[10px] font-bold animate-pulse cursor-pointer"
                                >
                                  <Heart size={10} />
                                  <span>Reaction</span>
                                </button>
                              )}
                              <div className="flex items-center gap-1 text-xs text-text-2 font-mono font-semibold">
                                <Eye size={13} className="text-accent" />
                                <span>{w.open_count || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <img
                              src={getAvatarUrl(
                                w.recipient_name,
                                (w as any).contact_avatar_url || (w as any).avatar_url,
                                (w as any).recipient_gender
                              )}
                              alt={w.recipient_name}
                              className="w-11 h-11 rounded-2xl object-cover bg-void border border-white/[0.14] flex-shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0">
                              <h3 className="text-lg font-display font-bold text-white group-hover:text-accent transition-colors truncate">
                                {w.recipient_name}
                              </h3>
                            </div>
                          </div>
                          <p className="text-xs text-text-2 font-serif italic line-clamp-3 mt-2 leading-relaxed">
                            "{w.wish_text || 'May your journey ahead shimmer with joy and wonder! ✨'}"
                          </p>
                        </div>

                        {/* Fast Sharing Switch Bar */}
                        <div className="flex items-center justify-between bg-black/40 border border-white/[0.08] rounded-2xl p-1.5 px-2.5 backdrop-blur-md mt-1">
                          <span className="text-[10px] font-mono text-text-3 font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Send size={10} className="text-accent" /> Fast Share:
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleFastShareWhatsApp(w)}
                              className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                              title="Share on WhatsApp"
                            >
                              <MessageCircle size={12} />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                            <button
                              onClick={() => handleFastShareSMS(w)}
                              className="p-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                              title="Share via SMS"
                            >
                              <MessageSquare size={12} />
                              <span className="hidden sm:inline">SMS</span>
                            </button>
                            <button
                              onClick={() => handleCopyShareLink(w.slug)}
                              className="p-1.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-text-2 hover:text-white hover:bg-white/[0.12] transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                              title="Copy sealed link"
                            >
                              {copiedWishSlug === w.slug ? <Check size={12} className="text-emerald-400" /> : <ExternalLink size={12} />}
                              <span>{copiedWishSlug === w.slug ? 'Copied!' : 'Link'}</span>
                            </button>
                            <button
                              onClick={() => handleNativeShare(w)}
                              className="p-1.5 rounded-xl bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-all cursor-pointer text-[10px] font-bold"
                              title="More share options"
                            >
                              <Share2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/[0.1] pt-3 mt-0.5">
                          <span className="text-[11px] font-mono text-text-3 font-semibold uppercase">
                            Theme: <span className="text-accent">{w.theme || 'Auto'}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Edit Creation Button */}
                            <button
                              onClick={() => onSelectWish(w)}
                              className="p-2 text-white/80 hover:text-accent rounded-xl bg-white/[0.08] hover:bg-accent/15 border border-white/[0.12] hover:border-accent/40 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title="Edit wish details"
                            >
                              <Edit3 size={14} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            {/* Delete Creation Button */}
                            <button
                              onClick={() => onDeleteWish(w.id)}
                              className="p-2 text-white/70 hover:text-rose-300 rounded-xl bg-white/[0.08] hover:bg-rose-500/20 border border-white/[0.12] transition-colors cursor-pointer"
                              title="Delete wish"
                            >
                              <Trash2 size={14} />
                            </button>

                            {/* Experience Button */}
                            <VelvetButton
                              size="sm"
                              variant="primary"
                              icon={<Play size={13} className="fill-[#06060A]" />}
                              onClick={() => onPreviewExperience(w.slug)}
                            >
                              Experience
                            </VelvetButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIME-WISE TIMELINE (Organized by Year & Month) */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {timeGroupedWishes.length === 0 ? (
            <div className="border border-dashed border-white/[0.14] rounded-3xl p-12 text-center bg-white/[0.02]">
              <Calendar size={36} className="mx-auto text-accent mb-3 opacity-80" />
              <h3 className="text-base font-bold text-white">Timeline is Empty</h3>
              <p className="text-xs text-text-2 mt-1 mb-4">Direct your first film to start your chronological timeline.</p>
              <VelvetButton variant="primary" size="sm" onClick={onNewWish}>
                Craft a Wish
              </VelvetButton>
            </div>
          ) : (
            timeGroupedWishes.map(group => (
              <div key={group.timeLabel} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
                    {group.timeLabel}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-text-3">
                    {group.items.length} {group.items.length === 1 ? 'wish' : 'wishes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map(w => (
                    <div
                      key={w.id}
                      className="bg-surface-elevated border border-white/[0.14] hover:border-accent/60 rounded-3xl p-5 flex flex-col justify-between gap-3 backdrop-blur-xl shadow-glass-card"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold"
                            style={{
                              backgroundColor: `${w.folder_color || '#EAB308'}25`,
                              color: w.folder_color || '#EAB308',
                              border: `1px solid ${w.folder_color || '#EAB308'}40`
                            }}
                          >
                            {w.folder_name || 'My Wishes'}
                          </span>

                          <button
                            onClick={() => handleOpenVersions(w)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-accent/20 border border-white/[0.12] hover:border-accent/40 text-text-2 hover:text-accent text-[10px] font-mono font-bold transition-all cursor-pointer"
                          >
                            <History size={10} />
                            <span>v{w.version || 1}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(
                              w.recipient_name,
                              (w as any).contact_avatar_url || (w as any).avatar_url,
                              (w as any).recipient_gender
                            )}
                            alt={w.recipient_name}
                            className="w-10 h-10 rounded-2xl object-cover bg-void border border-white/[0.14]"
                          />
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-white truncate">{w.recipient_name}</h4>
                            <span className="text-[10px] font-mono text-text-3">
                              {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-text-2 font-serif italic line-clamp-2 mt-2">
                          "{w.wish_text || 'Happy Birthday!'}"
                        </p>
                      </div>

                      {/* Fast Sharing Bar */}
                      <div className="flex items-center justify-between bg-black/40 border border-white/[0.08] rounded-xl p-1.5 px-2">
                        <span className="text-[9px] font-mono text-text-3 font-semibold uppercase">Share:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFastShareWhatsApp(w)}
                            className="p-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[10px] font-bold"
                            title="WhatsApp"
                          >
                            <MessageCircle size={12} />
                          </button>
                          <button
                            onClick={() => handleFastShareSMS(w)}
                            className="p-1 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 text-[10px] font-bold"
                            title="SMS"
                          >
                            <MessageSquare size={12} />
                          </button>
                          <button
                            onClick={() => handleCopyShareLink(w.slug)}
                            className="p-1 px-2 rounded-lg bg-white/[0.06] text-text-2 hover:text-white text-[10px] font-bold flex items-center gap-1"
                          >
                            {copiedWishSlug === w.slug ? <Check size={11} className="text-emerald-400" /> : <ExternalLink size={11} />}
                            <span>{copiedWishSlug === w.slug ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                        <button
                          onClick={() => onSelectWish(w)}
                          className="text-xs text-text-2 hover:text-accent font-semibold flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        <VelvetButton
                          size="sm"
                          variant="primary"
                          icon={<Play size={12} className="fill-[#06060A]" />}
                          onClick={() => onPreviewExperience(w.slug)}
                        >
                          Experience
                        </VelvetButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: FOLDERS (Interactive Click to Filter) */}
      {activeTab === 'folders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-2 font-semibold">
              Tap any folder to view its archived wishes
            </span>
            <VelvetButton
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => setShowNewFolderModal(true)}
            >
              New Folder
            </VelvetButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {folders.map(f => {
              const folderWishCount = wishes.filter(w => w.folder_id === f.id && (w.status === 'generated' || w.status === 'sent')).length;
              const isDefaultFolder = f.id === 'fld_1';

              return (
                <div
                  key={f.id}
                  className="bg-surface-elevated border border-white/[0.14] hover:border-accent/80 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl group transition-all shadow-sm relative"
                >
                  <div
                    onClick={() => handleFolderClick(f.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-110 flex-shrink-0"
                      style={{ backgroundColor: `${f.color}25`, color: f.color }}
                    >
                      <FolderIcon size={22} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white group-hover:text-accent transition-colors truncate">
                        {f.name}
                      </h4>
                      <span className="text-xs text-text-2 font-mono font-medium">
                        {folderWishCount} {folderWishCount === 1 ? 'wish' : 'wishes'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    {!isDefaultFolder && onDeleteFolder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToDelete(f);
                        }}
                        className="p-2 text-white/60 hover:text-rose-300 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 border border-white/[0.1] transition-colors cursor-pointer"
                        title="Delete folder"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => handleFolderClick(f.id)}
                      className="flex items-center gap-1 text-xs text-accent font-bold px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                    >
                      <span>Open</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DRAFTS */}
      {activeTab === 'drafts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {drafts.length === 0 ? (
            <div className="col-span-full border border-dashed border-white/[0.14] rounded-3xl p-8 text-center bg-white/[0.02]">
              <Clock size={32} className="mx-auto text-text-3 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-text-2">No incomplete drafts.</p>
            </div>
          ) : (
            drafts.map(d => (
              <div
                key={d.id}
                className="bg-surface-elevated border border-white/[0.14] rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl"
              >
                <div>
                  <h4 className="text-base font-bold text-white">{d.recipient_name || 'Untitled Draft'}</h4>
                  <span className="text-xs text-text-3 font-mono">Updated recently</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteWish(d.id)}
                    className="p-2 text-white/70 hover:text-rose-300 rounded-xl bg-white/[0.08] hover:bg-rose-500/20 border border-white/[0.12] transition-colors cursor-pointer"
                    title="Delete draft"
                  >
                    <Trash2 size={15} />
                  </button>
                  <VelvetButton size="sm" variant="primary" onClick={() => onSelectWish(d)}>
                    Resume Draft
                  </VelvetButton>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: MEMORY VAULT (Interactive Reaction Viewer) */}
      {activeTab === 'vault' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reactedWishes.length === 0 ? (
            <div className="col-span-full border border-dashed border-white/[0.14] rounded-3xl p-12 text-center bg-white/[0.02]">
              <Video size={36} className="mx-auto text-accent mb-2 opacity-80" />
              <h3 className="text-base font-bold text-white">Memory Vault is Waiting</h3>
              <p className="text-xs text-text-2 mt-1">
                When recipients submit a heartfelt text note, voice note or video reaction, they are securely preserved here for you to watch and replay anytime.
              </p>
            </div>
          ) : (
            reactedWishes.map(w => (
              <div
                key={w.id}
                onClick={() => setActiveReactionWish(w)}
                className="bg-surface-elevated border border-white/[0.14] hover:border-pink-500/60 rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between gap-4 cursor-pointer group transition-all shadow-glass-card hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <GlowBadge variant="rose">
                      {w.last_reaction_type === 'voice'
                        ? '🎙️ Voice Note'
                        : w.last_reaction_type === 'video'
                        ? '🎥 Video Reaction'
                        : '✍️ Personal Text Note'}
                    </GlowBadge>
                    <span className="text-xs font-mono text-accent font-bold group-hover:underline">
                      Tap to Open & Play 💌
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">From {w.recipient_name}</h3>
                  {w.last_reaction_text && (
                    <p className="text-xs text-text-2 font-serif italic line-clamp-2 mt-1">
                      "{w.last_reaction_text}"
                    </p>
                  )}
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-void/80 border border-white/[0.12] flex items-center justify-center">
                  <img
                    src={w.cover_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'}
                    alt="Reaction Preview"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-void/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-accent text-void flex items-center justify-center shadow-glow-sm group-hover:scale-110 transition-transform">
                      <Play size={20} className="ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REACTION VIEWER MODAL */}
      {activeReactionWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-xl">
          <div className="relative w-full max-w-lg bg-surface border border-white/[0.15] rounded-[28px] p-6 shadow-glass-card max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => {
                setActiveReactionWish(null);
                setIsPlayingAudio(false);
              }}
              className="absolute top-5 right-5 text-text-2 hover:text-white p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300">
                <Heart size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
                  CAPTURED RESPONSE
                </span>
                <h3 className="text-xl font-display font-bold text-white">
                  Reaction from {activeReactionWish.recipient_name}
                </h3>
              </div>
            </div>

            {/* Reaction Content */}
            <div className="bg-surface-elevated/90 border border-white/[0.1] rounded-2xl p-5 space-y-4">
              {/* If Video */}
              {activeReactionWish.last_reaction_type === 'video' && (
                <div className="relative aspect-[9/16] max-h-[320px] rounded-xl overflow-hidden mx-auto bg-black flex items-center justify-center">
                  <video
                    src={activeReactionWish.last_reaction_media || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* If Voice */}
              {activeReactionWish.last_reaction_type === 'voice' && (
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.1] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent">
                    <Mic size={24} />
                  </div>
                  <span className="text-xs font-mono font-bold text-white block">
                    🎙️ Voice Note Duration: {activeReactionWish.last_reaction_duration ? `${activeReactionWish.last_reaction_duration}s` : 'Recorded Audio'}
                  </span>
                  {activeReactionWish.last_reaction_media ? (
                    <audio
                      src={activeReactionWish.last_reaction_media}
                      controls
                      className="w-full max-w-xs mx-auto mt-2 accent-accent"
                    />
                  ) : (
                    <p className="text-xs text-text-3 font-mono italic">Audio recording preview</p>
                  )}
                </div>
              )}

              {/* If Text or has text */}
              {activeReactionWish.last_reaction_text && (
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.1] space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-3 font-bold block">
                    WRITTEN NOTE
                  </span>
                  <p className="font-serif italic text-white text-base leading-relaxed">
                    "{activeReactionWish.last_reaction_text}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-mono text-text-3 pt-1">
                <span>Wish: {activeReactionWish.slug}</span>
                <span>Captured via Wishora Engine ✨</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleCopyShareLink(activeReactionWish.slug)}
                className="flex items-center gap-1.5 text-xs text-text-2 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] px-4 py-2.5 rounded-full cursor-pointer transition-colors"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <VelvetButton
                size="md"
                variant="primary"
                icon={<Play size={14} />}
                onClick={() => {
                  onPreviewExperience(activeReactionWish.slug);
                  setActiveReactionWish(null);
                }}
              >
                Experience Wish Film
              </VelvetButton>
            </div>
          </div>
        </div>
      )}

      {/* NEW FOLDER MODAL */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-md">
          <div className="bg-surface border border-white/[0.15] rounded-3xl p-6 max-w-sm w-full shadow-glass-card">
            <h3 className="text-base font-bold text-white mb-3">Create Folder</h3>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder Name (e.g. College Friends)"
                className="w-full bg-surface-elevated border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent"
              />

              <div className="flex items-center gap-2">
                {['#EAB308', '#DB2777', '#2563EB', '#10B981', '#7C3AED'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${newFolderColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <VelvetButton size="sm" variant="ghost" type="button" onClick={() => setShowNewFolderModal(false)}>
                  Cancel
                </VelvetButton>
                <VelvetButton size="sm" variant="primary" type="submit">
                  Save Folder
                </VelvetButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLDER DELETE CONFIRMATION MODAL */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-md">
          <div className="bg-surface border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-glass-card space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Delete "{folderToDelete.name}"?</h3>
              <p className="text-xs text-text-2 mt-1">
                Wishes inside this folder will not be lost and will be moved to your primary archive.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <VelvetButton size="sm" variant="ghost" type="button" onClick={() => setFolderToDelete(null)}>
                Cancel
              </VelvetButton>
              <button
                onClick={handleConfirmDeleteFolder}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-sm cursor-pointer transition-colors"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WISH REVISION HISTORY MODAL */}
      {activeVersionWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-xl">
          <div className="relative w-full max-w-lg bg-surface border border-white/[0.15] rounded-[28px] p-6 shadow-glass-card max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setActiveVersionWish(null)}
              className="absolute top-5 right-5 text-text-2 hover:text-white p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                <History size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
                  REVISION SNAPSHOTS
                </span>
                <h3 className="text-xl font-display font-bold text-white">
                  Version History • {activeVersionWish.recipient_name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-text-2">
              Every edit creates a safe snapshot. You can preview previous text, soundtracks, and revert back at any time.
            </p>

            {isLoadingVersions ? (
              <div className="py-12 text-center text-text-3 flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-accent" />
                <span className="text-xs font-mono">Loading saved revisions...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="border border-dashed border-white/[0.12] rounded-2xl p-6 text-center text-xs text-text-3">
                This is version 1 (Current). No previous revisions saved yet.
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver) => {
                  const data = ver.snapshot_data || {};
                  const dateStr = new Date(ver.created_at).toLocaleString();
                  return (
                    <div
                      key={ver.id}
                      className="bg-surface-elevated border border-white/[0.1] hover:border-accent/40 rounded-2xl p-4 space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-accent bg-accent/15 px-2.5 py-0.5 rounded-full border border-accent/30">
                            Version {ver.version_number}
                          </span>
                          <span className="text-[11px] font-mono text-text-3">{dateStr}</span>
                        </div>
                        <button
                          onClick={() => handleRevertVersion(ver.id)}
                          disabled={isReverting}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-accent/20 border border-white/[0.12] hover:border-accent/40 text-text-1 hover:text-accent text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
                        </button>
                      </div>
                      {data.wish_text && (
                        <p className="text-xs text-text-2 font-serif italic bg-void/50 p-2.5 rounded-xl border border-white/[0.06] line-clamp-3">
                          "{data.wish_text}"
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[10px] font-mono text-text-3">
                        <span>Theme: {data.theme || 'Auto'}</span>
                        <span>Photos: {data.photos ? data.photos.length : 0}</span>
                        <span>Music: {data.music_id || 'Track'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
