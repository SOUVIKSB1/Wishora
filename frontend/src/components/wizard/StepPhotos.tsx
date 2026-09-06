import React, { useState, useRef } from 'react';
import { Image, Plus, Trash2, Sparkles, Star, MoveUp, MoveDown, UploadCloud, Link2 } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { compressAndReadFileAsDataUrl } from '../../utils/avatar.js';

interface PhotoItem {
  id: string;
  storage_url: string;
  caption?: string;
  is_featured?: number;
}

interface StepPhotosProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

const CURATED_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'
];

export const StepPhotos: React.FC<StepPhotosProps> = ({ photos, onChange }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    const remainingSlots = 12 - photos.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots).filter(f => f.type.startsWith('image/'));
    if (filesToProcess.length === 0) return;

    setIsProcessing(true);
    try {
      const compressedUrls = await Promise.all(
        filesToProcess.map(file => compressAndReadFileAsDataUrl(file, 800, 0.72))
      );

      const newPhotos: PhotoItem[] = compressedUrls.map((url, idx) => ({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${idx}`,
        storage_url: url,
        caption: filesToProcess[idx].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        is_featured: (photos.length === 0 && idx === 0) ? 1 : 0
      }));

      onChange([...photos, ...newPhotos]);
    } catch (err) {
      console.error('Error processing photos:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleAddPhotoUrl = (url: string) => {
    if (!url || photos.length >= 12) return;
    const newPhoto: PhotoItem = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storage_url: url,
      caption: '',
      is_featured: photos.length === 0 ? 1 : 0
    };
    onChange([...photos, newPhoto]);
    setCustomUrl('');
  };

  const handleRemovePhoto = (id: string) => {
    onChange(photos.filter(p => p.id !== id));
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    onChange(photos.map(p => p.id === id ? { ...p, caption } : p));
  };

  const handleSetFeatured = (id: string) => {
    onChange(photos.map(p => ({ ...p, is_featured: p.id === id ? 1 : 0 })));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const newArr = [...photos];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    onChange(newArr);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-text-2 uppercase tracking-wider block">
            Memory Album & Film Photos
          </label>
          <p className="text-xs text-text-3 mt-0.5">Upload personal photos from device or paste image URLs (up to 12 photos)</p>
        </div>
        <span className="text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
          {photos.length} / 12 photos
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop / Device Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-accent bg-accent/10 shadow-glow-sm'
            : 'border-white/[0.15] bg-surface-elevated/50 hover:border-accent/50 hover:bg-surface-elevated/80'
        }`}
      >
        <div className="w-11 h-11 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent mx-auto mb-2 shadow-glow-sm">
          <UploadCloud size={22} />
        </div>
        <h4 className="text-sm font-bold text-text-1">Upload Photos from Device</h4>
        <p className="text-xs text-text-2 mt-0.5">Tap to browse files or drag & drop images here (PNG, JPG, HEIC)</p>
      </div>

      {/* Or Paste URL */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="absolute left-3.5 top-3.5 text-text-3" />
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Or paste direct image URL..."
            className="w-full bg-surface-elevated/70 border border-white/[0.09] rounded-2xl pl-10 pr-4 py-3 text-sm text-text-1 placeholder-text-3 focus:border-accent outline-none"
          />
        </div>
        <VelvetButton
          variant="secondary"
          icon={<Plus size={16} />}
          onClick={() => handleAddPhotoUrl(customUrl)}
          disabled={!customUrl.trim() || photos.length >= 12}
        >
          Add URL
        </VelvetButton>
      </div>

      {/* Sample preset photos for easy testing */}
      <div>
        <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block mb-2">
          QUICK PRESET SAMPLES (OPTIONAL)
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CURATED_SAMPLE_PHOTOS.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPhotoUrl(url)}
              disabled={photos.length >= 12}
              className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/[0.12] hover:border-accent transition-all flex-shrink-0 group cursor-pointer"
            >
              <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-void/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={14} className="text-accent" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid & Captions */}
      {photos.length === 0 ? (
        <div className="border border-dashed border-white/[0.12] rounded-3xl p-8 text-center bg-white/[0.02]">
          <Image size={32} className="mx-auto text-text-3 mb-2" />
          <p className="text-sm font-medium text-text-2">No photos added yet</p>
          <p className="text-xs text-text-3 mt-1">Add at least 1 photo to complete the cinematic memory album.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {photos.map((p, index) => (
            <div
              key={p.id}
              className="relative bg-surface-elevated/60 border border-white/[0.08] rounded-2xl p-3 flex gap-3 items-center backdrop-blur-xl group"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.1]">
                <img src={p.storage_url} alt="Uploaded" className="w-full h-full object-cover" />
                {p.is_featured === 1 && (
                  <div className="absolute top-1 left-1 bg-accent rounded-full p-0.5 text-void shadow-glow-sm">
                    <Star size={10} fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Caption & Controls */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  maxLength={40}
                  value={p.caption || ''}
                  onChange={(e) => handleUpdateCaption(p.id, e.target.value)}
                  placeholder="Caption (e.g. Paris 2024)"
                  className="w-full bg-void/60 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-text-1 placeholder-text-3 font-serif italic outline-none focus:border-accent mb-2"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetFeatured(p.id)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      p.is_featured === 1
                        ? 'bg-accent/20 border-accent text-accent font-semibold'
                        : 'bg-white/[0.06] border-white/[0.12] text-text-2 hover:text-text-1 hover:border-white/[0.25]'
                    }`}
                  >
                    {p.is_featured === 1 ? '★ Cover' : 'Set Cover'}
                  </button>

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-text-2 hover:text-text-1 disabled:opacity-30 cursor-pointer"
                    title="Move earlier"
                  >
                    <MoveUp size={12} />
                  </button>

                  <button
                    type="button"
                    disabled={index === photos.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-text-2 hover:text-text-1 disabled:opacity-30 cursor-pointer"
                    title="Move later"
                  >
                    <MoveDown size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(p.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 ml-auto cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
