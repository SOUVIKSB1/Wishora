import React, { useState, useEffect, useRef } from 'react';
import { Music, Sparkles, Check, Disc3, Upload, FileAudio } from 'lucide-react';
import { WaveformScrubber } from '../ui/WaveformScrubber.js';
import { api } from '../../services/api.js';
import { MusicTrack } from '../../types/wish.js';

interface StepMusicProps {
  selectedMusicId: string;
  customMusicUrl?: string;
  trimStart: number;
  trimEnd: number;
  onSelectMusic: (id: string, customUrl?: string) => void;
  onTrimChange: (start: number, end: number) => void;
  onPlayPreview: (trackId: string, storageUrl: string) => void;
  isPlaying: boolean;
}

export const StepMusic: React.FC<StepMusicProps> = ({
  selectedMusicId,
  customMusicUrl,
  trimStart,
  trimEnd,
  onSelectMusic,
  onTrimChange,
  onPlayPreview,
  isPlaying
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.getMusic()
      .then(res => setTracks(res.tracks))
      .catch(err => console.error('Failed to load music tracks:', err));
  }, []);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Audio file should be under 15MB for optimal streaming performance.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const tempAudio = new window.Audio(objectUrl);

    tempAudio.onloadedmetadata = () => {
      const detectedDuration = Math.min(180, Math.round(tempAudio.duration) || 90);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const customTrack: MusicTrack = {
            id: `custom_${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            artist: 'My Custom Song',
            genre: 'Custom Upload',
            duration: detectedDuration,
            storage_url: dataUrl,
            mood_tags: ['personal'],
            is_premium: 0
          };
          setTracks(prev => [customTrack, ...prev]);
          onSelectMusic(customTrack.id, dataUrl);
          onTrimChange(0, Math.min(30, detectedDuration));
          onPlayPreview(customTrack.id, dataUrl);
        }
      };
      reader.readAsDataURL(file);
    };

    tempAudio.onerror = () => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const customTrack: MusicTrack = {
            id: `custom_${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            artist: 'My Custom Song',
            genre: 'Custom Upload',
            duration: 90,
            storage_url: dataUrl,
            mood_tags: ['personal'],
            is_premium: 0
          };
          setTracks(prev => [customTrack, ...prev]);
          onSelectMusic(customTrack.id, dataUrl);
          onPlayPreview(customTrack.id, dataUrl);
        }
      };
      reader.readAsDataURL(file);
    };
  };

  const genres = ['All', 'Orchestral', 'Lo-fi Chill', 'Birthday Classics', 'Acoustic', 'Bollywood', 'Ambient'];

  const filteredTracks = activeGenre === 'All'
    ? tracks
    : tracks.filter(t => t.genre.toLowerCase() === activeGenre.toLowerCase());

  const currentTrack = tracks.find(t => t.id === selectedMusicId) || tracks[0];

  return (
    <div className="space-y-6">
      {/* Hidden Audio File Input */}
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs font-semibold text-text-2 uppercase tracking-wider block">
            Soundscape & Soundtrack
          </label>
          <p className="text-xs text-text-3 mt-0.5">The audio plays throughout the unsealing and swells at the celebration screen.</p>
        </div>

        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 font-semibold text-xs transition-all shadow-glow-sm cursor-pointer whitespace-nowrap"
        >
          <Upload size={14} />
          <span>Upload Custom Song (.mp3, .wav)</span>
        </button>
      </div>

      {/* Genre tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {genres.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setActiveGenre(g)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeGenre === g
                ? 'bg-accent/15 border border-accent text-accent font-semibold shadow-glow-sm'
                : 'bg-white/[0.04] border border-white/[0.06] text-text-2 hover:text-text-1'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Tracks Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredTracks.map(t => {
          const isSelected = selectedMusicId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => {
                onSelectMusic(t.id);
                onPlayPreview(t.id, t.storage_url);
              }}
              className={`relative bg-surface-elevated/60 border rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-accent bg-surface-elevated/90 shadow-[0_0_20px_rgba(200,169,110,0.15)]'
                  : 'border-white/[0.07] hover:border-white/[0.15] hover:bg-surface-elevated/80'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'bg-accent text-void' : 'bg-white/[0.05] text-accent'
              }`}>
                {isSelected && isPlaying ? <Disc3 size={20} className="animate-spin" /> : <Music size={18} />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-text-1 truncate">{t.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-3">{t.genre}</span>
                  <span className="text-[10px] text-text-3 font-mono">{t.duration}s</span>
                </div>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                  <Check size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Waveform Scrubber / Trimmer */}
      {currentTrack && (
        <div className="pt-2">
          <WaveformScrubber
            duration={currentTrack.duration || 90}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onChange={onTrimChange}
            isPlaying={isPlaying}
            onTogglePlay={() => onPlayPreview(currentTrack.id, currentTrack.storage_url)}
            title={currentTrack.title}
            artist={currentTrack.artist}
          />
        </div>
      )}
    </div>
  );
};
