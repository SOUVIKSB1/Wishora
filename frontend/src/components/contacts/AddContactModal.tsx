import React, { useState, useRef } from 'react';
import { X, User, Phone, Mail, FileText, Heart, Plus, Sparkles, Camera, Upload, RefreshCw } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { WheelDatePicker } from '../ui/WheelDatePicker.js';
import { api } from '../../services/api.js';
import { getAvatarPresetsForGender, getAvatarUrl, readFileAsDataUrl } from '../../utils/avatar.js';

interface AddContactModalProps {
  onClose: () => void;
  onAdded: () => void;
  editContact?: any;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onAdded, editContact }) => {
  const [name, setName] = useState(editContact?.name || '');
  const [nickname, setNickname] = useState(editContact?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(editContact?.avatar_url || '');
  const [dob, setDob] = useState(
    editContact?.dob_year
      ? `${editContact.dob_year}-${String(editContact.dob_month).padStart(2, '0')}-${String(editContact.dob_day || 1).padStart(2, '0')}`
      : editContact?.dob_month
      ? `2000-${String(editContact.dob_month).padStart(2, '0')}-${String(editContact.dob_day || 1).padStart(2, '0')}`
      : '2000-01-01'
  );
  const [gender, setGender] = useState(editContact?.gender || 'female');
  const [relationship, setRelationship] = useState(editContact?.relationship || 'Best Friend');
  const [phone, setPhone] = useState(editContact?.phone || '');
  const [email, setEmail] = useState(editContact?.email || '');
  const [note, setNote] = useState(editContact?.note || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parts = dob.split('-');
    const dob_year = parseInt(parts[0], 10);
    const dob_month = parseInt(parts[1], 10);
    const dob_day = parseInt(parts[2], 10);

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        nickname: nickname.trim() || null,
        dob_day,
        dob_month,
        dob_year,
        gender,
        relationship: relationship.trim() || 'Friend',
        phone: phone.trim() || null,
        email: email.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        note: note.trim() || null
      };

      if (editContact?.id) {
        await api.updateContact(editContact.id, payload);
      } else {
        await api.createContact(payload);
      }
      onAdded();
      onClose();
    } catch (err) {
      console.error('Failed to save contact:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const previewAvatar = avatarUrl || getAvatarUrl(name, null, gender);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-surface border border-white/[0.14] rounded-3xl p-6 shadow-glass-card max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-3 hover:text-white p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-display font-extrabold text-white mb-1">
          {editContact ? 'Edit Birthday VIP Contact' : 'Add Birthday VIP Contact'}
        </h2>
        <p className="text-xs text-text-2 mb-5 font-medium">Auto-assigns a luxury avatar or upload a custom photo.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector Header */}
          <div className="bg-surface-elevated/90 border border-white/[0.12] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative group flex-shrink-0">
                <img
                  src={previewAvatar}
                  alt="Contact Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/50 shadow-[0_0_15px_rgba(212,175,55,0.25)] bg-void"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-void/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-amber-300"
                >
                  <Camera size={18} />
                  <span className="text-[8px] font-mono font-bold mt-0.5 uppercase">Upload</span>
                </button>
              </div>

              <div>
                <span className="text-xs font-bold text-white block">
                  {avatarUrl ? 'Custom Photo Set' : 'Auto-Assigned Studio Avatar'}
                </span>
                <span className="text-[11px] text-text-2 font-mono">
                  {avatarUrl ? 'Photo uploaded' : 'Generates dynamically for this person'}
                </span>

                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.14] text-white transition-colors cursor-pointer"
                  >
                    <Upload size={10} className="text-amber-400" />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 transition-colors cursor-pointer"
                  >
                    <Sparkles size={10} />
                    <span>{showAvatarPicker ? 'Hide' : 'Presets'}</span>
                  </button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Studio Avatar Picker Grid */}
          {showAvatarPicker && (
            <div className="p-3.5 bg-surface-elevated border border-amber-400/30 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                  Select Preset Avatar
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl('');
                    setShowAvatarPicker(false);
                  }}
                  className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={10} />
                  <span>Use Auto</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {getAvatarPresetsForGender(gender).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.url);
                      setShowAvatarPicker(false);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                      avatarUrl === preset.url
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                        : 'border-white/[0.1] hover:border-white/[0.3] hover:scale-105'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover rounded-lg bg-void"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">NICKNAME (OPTIONAL)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Annie, Rockstar"
              className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400 transition-colors font-medium"
            />
          </div>

          <WheelDatePicker value={dob} onChange={setDob} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">GENDER</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="female" className="bg-surface">Girl / Woman</option>
                <option value="male" className="bg-surface">Boy / Man</option>
                <option value="child" className="bg-surface">Child (&lt;15)</option>
                <option value="nonbinary" className="bg-surface">Non-binary</option>
                <option value="unspecified" className="bg-surface">Unspecified</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">RELATIONSHIP</label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Best Friend, Sister"
                className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">PHONE (FOR SMS)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0199"
                className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-3 uppercase font-extrabold mb-1">PERSONAL NOTE</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Loves photography and matcha lattes"
              className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-400 resize-none font-medium"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <VelvetButton variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </VelvetButton>
            <VelvetButton variant="glow" size="md" isLoading={isLoading} type="submit" className="shadow-[0_0_20px_rgba(212,175,55,0.35)]">
              Save Contact
            </VelvetButton>
          </div>
        </form>
      </div>
    </div>
  );
};

