import React, { useState } from 'react';
import { Contact } from '../../types/contact.js';
import { 
  Plus, UploadCloud, Search, Sparkles, Calendar, Heart, MoreVertical, 
  Trash2, Edit, UserCheck, Shield, Download, CheckSquare, Square, 
  AlertTriangle, Loader2, X, Check, Filter
} from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { AuraHalfCircle } from '../ui/AuraHalfCircle.js';
import { LUXURY_AVATAR_PRESETS, getAvatarUrl } from '../../utils/avatar.js';
import { downloadContactsCsv } from '../../utils/downloader.js';
import { haptic } from '../../utils/haptics.js';

interface ContactListProps {
  contacts: Contact[];
  onAddContact: () => void;
  onImportCsv: () => void;
  onCreateWishForContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => Promise<void> | void;
  onBulkDeleteContacts?: (ids: string[]) => Promise<void> | void;
  onDeleteAllContacts?: () => Promise<void> | void;
  onEditContact: (contact: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onAddContact,
  onImportCsv,
  onCreateWishForContact,
  onDeleteContact,
  onBulkDeleteContacts,
  onDeleteAllContacts,
  onEditContact
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSingleId, setDeletingSingleId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    c.relationship.toLowerCase().includes(search.toLowerCase())
  );

  const getRelationshipColor = (rel: string) => {
    const lower = (rel || '').toLowerCase();
    if (lower.includes('partner') || lower.includes('love') || lower.includes('spouse') || lower.includes('wife') || lower.includes('husband')) {
      return { badgeVariant: 'rose' as const, dot: 'bg-pink-400', tagBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30', aura: 'rose-gold' as const };
    }
    if (lower.includes('friend') || lower.includes('bestie')) {
      return { badgeVariant: 'cyan' as const, dot: 'bg-sky-400', tagBg: 'bg-sky-500/10 text-sky-300 border-sky-500/30', aura: 'cyan-emerald' as const };
    }
    if (lower.includes('mom') || lower.includes('dad') || lower.includes('family') || lower.includes('sister') || lower.includes('brother')) {
      return { badgeVariant: 'emerald' as const, dot: 'bg-emerald-400', tagBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', aura: 'emerald-gold' as const };
    }
    return { badgeVariant: 'gold' as const, dot: 'bg-amber-400', tagBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30', aura: 'gold-purple' as const };
  };

  const toggleSelectContact = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.light();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    haptic.medium();
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const handleSingleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete contact "${name}"?`)) return;
    setDeletingSingleId(id);
    try {
      await onDeleteContact(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      haptic.medium();
    } finally {
      setDeletingSingleId(null);
    }
  };

  const handleConfirmBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;
    setIsBulkDeleting(true);
    try {
      if (onBulkDeleteContacts) {
        await onBulkDeleteContacts(idsToDelete);
      } else {
        for (const id of idsToDelete) {
          await onDeleteContact(id);
        }
      }
      haptic.impact();
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      if (onDeleteAllContacts) {
        await onDeleteAllContacts();
      } else if (onBulkDeleteContacts) {
        await onBulkDeleteContacts(contacts.map(c => c.id));
      }
      haptic.impact();
      setSelectedIds(new Set());
      setShowDeleteAllModal(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-amber-400 font-bold tracking-widest uppercase">
              VIP ROLODEX & RADAR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Birthday Contacts
          </h1>
          <p className="text-xs sm:text-sm text-text-2 mt-0.5 font-medium leading-relaxed">
            Track birthdays, get timely countdown alerts, and launch custom cinematic films in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {contacts.length > 0 && (
            <>
              <VelvetButton
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                onClick={() => {
                  downloadContactsCsv(contacts);
                }}
                title="Download full contacts list as CSV"
              >
                Export CSV
              </VelvetButton>

              <button
                type="button"
                onClick={() => setShowDeleteAllModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="Delete all contacts in rolodex"
              >
                <Trash2 size={13} className="text-rose-400" />
                <span className="hidden sm:inline">Delete All</span>
              </button>
            </>
          )}

          <VelvetButton
            variant="secondary"
            size="sm"
            icon={<UploadCloud size={14} />}
            onClick={onImportCsv}
          >
            Import CSV
          </VelvetButton>

          <VelvetButton
            variant="glow"
            size="sm"
            icon={<Plus size={15} />}
            onClick={onAddContact}
            className="shadow-[0_0_20px_rgba(212,175,55,0.35)]"
          >
            Add Person
          </VelvetButton>
        </div>
      </div>

      {/* Search & Selection Controls Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-elevated border border-white/[0.14] p-3.5 rounded-2xl backdrop-blur-xl shadow-glass-card">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name, nickname, or relationship..."
              className="w-full bg-transparent pl-10 pr-4 py-1.5 text-xs sm:text-sm text-white placeholder-text-3 outline-none font-medium"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              >
                {isAllSelected ? <CheckSquare size={15} className="text-amber-400" /> : <Square size={15} className="text-text-3" />}
                <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}
            <span className="text-xs font-mono text-amber-400 font-bold pr-2">
              {filtered.length} VIPs
            </span>
          </div>
        </div>

        {/* Floating Bulk Selection Action Banner */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/20 via-surface-elevated to-rose-500/20 border border-amber-400/50 p-3.5 px-4 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.2)] animate-scaleIn backdrop-blur-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-white">
                <strong className="text-amber-300">{selectedIds.size}</strong> of {filtered.length} contacts selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-text-2 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contacts List Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-white/[0.14] rounded-3xl p-12 text-center bg-white/[0.02]">
          <Calendar size={36} className="mx-auto text-amber-400 mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white">No Contacts Found</h3>
          <p className="text-xs text-text-2 mt-1 mb-4">Add your close friends and family to stay prepared.</p>
          <VelvetButton variant="glow" size="sm" onClick={onAddContact}>
            Add First Contact
          </VelvetButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => {
            const isToday = c.days_remaining === 0;
            const relInfo = getRelationshipColor(c.relationship);
            const isSelected = selectedIds.has(c.id);

            return (
              <div
                key={c.id}
                onClick={() => toggleSelectContact(c.id)}
                className={`relative overflow-hidden bg-surface-elevated border rounded-3xl p-5 flex flex-col justify-between gap-4 backdrop-blur-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 shadow-glass-card ${
                  isSelected 
                    ? 'border-amber-400 bg-amber-400/[0.08] shadow-[0_0_30px_rgba(212,175,55,0.25)] ring-1 ring-amber-400/50'
                    : isToday
                    ? 'border-amber-400 shadow-[0_0_35px_rgba(212,175,55,0.3)] bg-gradient-to-b from-amber-500/15 to-surface-elevated'
                    : 'border-white/[0.14] hover:border-white/[0.28]'
                }`}
              >
                <AuraHalfCircle position="top-right" variant={isToday ? "gold-purple" : relInfo.aura} size="sm" opacity={0.35} />

                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Checkbox Trigger */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectContact(c.id, e)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-amber-400 border-amber-400 text-void shadow-glow-sm' 
                          : 'bg-void/80 border-white/[0.2] hover:border-amber-400/60 text-transparent'
                      }`}
                    >
                      <Check size={14} className={isSelected ? 'text-void stroke-[3]' : 'opacity-0'} />
                    </button>

                    <img
                      src={getAvatarUrl(c.name, c.avatar_url, c.gender)}
                      alt={c.name}
                      className={`w-12 h-12 rounded-2xl object-cover flex-shrink-0 bg-void border transition-transform ${
                        isToday
                          ? 'border-amber-400 shadow-[0_0_18px_rgba(212,175,55,0.45)]'
                          : 'border-white/[0.16]'
                      }`}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate">{c.name}</h3>
                        {c.nickname && (
                          <span className="text-xs text-amber-400/90 italic font-serif truncate">"{c.nickname}"</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-bold ${relInfo.tagBg}`}>
                          {c.relationship}
                        </span>
                        {c.age_turning && (
                          <span className="text-[11px] font-mono text-text-3 font-semibold">• Turning {c.age_turning}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div className="flex-shrink-0">
                    {isToday ? (
                      <GlowBadge variant="gold">TODAY 🎉</GlowBadge>
                    ) : c.days_remaining <= 7 ? (
                      <GlowBadge variant="rose">in {c.days_remaining} days</GlowBadge>
                    ) : (
                      <GlowBadge variant="ghost">in {c.days_remaining} days</GlowBadge>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div 
                  className="flex items-center justify-between border-t border-white/[0.08] pt-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono text-text-3 font-bold">
                    <Calendar size={13} className="text-amber-400/80" />
                    <span>{c.dob_day ? `${c.dob_day}/${c.dob_month}` : `Month ${c.dob_month}`}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditContact(c)}
                      className="p-2 rounded-xl text-text-3 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer active:scale-95"
                      title="Edit Contact"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleSingleDelete(c.id, c.name)}
                      disabled={deletingSingleId === c.id}
                      className="p-2 rounded-xl text-text-3 hover:text-rose-400 hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                      title="Delete Contact"
                    >
                      {deletingSingleId === c.id ? (
                        <Loader2 size={15} className="animate-spin text-rose-400" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                    <VelvetButton
                      size="sm"
                      variant={isToday ? 'glow' : 'primary'}
                      icon={<Sparkles size={13} />}
                      onClick={() => onCreateWishForContact(c)}
                      className="font-bold shadow-[0_0_15px_rgba(200,169,110,0.3)]"
                    >
                      Direct Wish
                    </VelvetButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL 1: BULK DELETE SELECTED CONTACTS ─── */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-2xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Delete Selected Contacts?</h3>
              <p className="text-xs text-text-2">
                Are you sure you want to permanently delete <strong className="text-rose-400">{selectedIds.size}</strong> selected contacts?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-2 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isBulkDeleting ? <Loader2 size={14} className="animate-spin text-white" /> : null}
                <span>{isBulkDeleting ? 'Deleting...' : `Yes, Delete (${selectedIds.size})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DELETE ALL CONTACTS CONFIRMATION ─── */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-2xl">
          <div className="relative w-full max-w-md bg-surface-elevated border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Delete All Birthday Contacts?</h3>
              <p className="text-xs text-text-2">
                This will wipe all <strong className="text-rose-400">{contacts.length}</strong> contacts and their upcoming birthday reminders from your account.
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-300 text-left">
                ⚠️ This action cannot be undone. All saved birthdays, phone numbers, notes, and avatars will be permanently removed.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeletingAll}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-2 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep Contacts
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeletingAll}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingAll ? <Loader2 size={14} className="animate-spin text-white" /> : null}
                <span>{isDeletingAll ? 'Wiping Contacts...' : 'Yes, Delete All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
