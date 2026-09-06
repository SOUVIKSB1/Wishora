import React, { useState } from 'react';
import { Contact } from '../../types/contact.js';
import { Plus, UploadCloud, Search, Sparkles, Calendar, Heart, MoreVertical, Trash2, Edit, UserCheck, Shield } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { GlowBadge } from '../ui/GlowBadge.js';
import { AuraHalfCircle } from '../ui/AuraHalfCircle.js';
import { LUXURY_AVATAR_PRESETS, getAvatarUrl } from '../../utils/avatar.js';

interface ContactListProps {
  contacts: Contact[];
  onAddContact: () => void;
  onImportCsv: () => void;
  onCreateWishForContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onEditContact: (contact: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onAddContact,
  onImportCsv,
  onCreateWishForContact,
  onDeleteContact,
  onEditContact
}) => {
  const [search, setSearch] = useState('');

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

        <div className="flex items-center gap-2.5">
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

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-3 bg-surface-elevated border border-white/[0.14] p-3.5 rounded-2xl backdrop-blur-xl shadow-glass-card">
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
        <span className="text-xs font-mono text-amber-400 font-bold pr-2 hidden sm:inline">
          {filtered.length} VIPs
        </span>
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

            return (
              <div
                key={c.id}
                className={`relative overflow-hidden bg-surface-elevated border rounded-3xl p-5 flex flex-col justify-between gap-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 shadow-glass-card ${
                  isToday
                    ? 'border-amber-400 shadow-[0_0_35px_rgba(212,175,55,0.3)] bg-gradient-to-b from-amber-500/15 to-surface-elevated'
                    : 'border-white/[0.14] hover:border-white/[0.28]'
                }`}
              >
                <AuraHalfCircle position="top-right" variant={isToday ? "gold-purple" : relInfo.aura} size="sm" opacity={0.35} />

                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={getAvatarUrl(c.name, c.avatar_url, c.gender)}
                      alt={c.name}
                      className={`w-12 h-12 rounded-2xl object-cover flex-shrink-0 bg-void border transition-transform group-hover:scale-105 ${
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
                <div className="flex items-center justify-between border-t border-white/[0.08] pt-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-text-3 font-bold">
                    <Calendar size={13} className="text-amber-400/80" />
                    <span>{c.dob_day ? `${c.dob_day}/${c.dob_month}` : `Month ${c.dob_month}`}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditContact(c)}
                      className="p-2 rounded-xl text-text-3 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="Edit Contact"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="p-2 rounded-xl text-text-3 hover:text-rose-400 hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="Delete Contact"
                    >
                      <Trash2 size={15} />
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
    </div>
  );
};

