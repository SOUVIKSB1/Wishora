import React, { useMemo } from 'react';
import { Volume2, Volume1, VolumeX, Play, Pause, Scissors, Sparkles } from 'lucide-react';

interface WaveformScrubberProps {
  duration?: number;
  trimStart: number;
  trimEnd: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  onChange: (start: number, end: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  title?: string;
  artist?: string;
}

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  duration = 90,
  trimStart,
  trimEnd,
  volume = 0.8,
  onVolumeChange,
  onChange,
  isPlaying = false,
  onTogglePlay,
  title = 'Selected Soundscape',
  artist = 'WISHORA Sound Engine'
}) => {
  const bars = useMemo(() => {
    return Array.from({ length: 54 }, (_, i) => {
      const height = 20 + Math.sin(i * 0.35) * 22 + Math.cos(i * 0.7) * 16 + Math.random() * 12;
      return Math.min(100, Math.max(15, height));
    });
  }, []);

  const safeDuration = Math.max(10, duration);
  const startPercent = Math.max(0, Math.min(100, (trimStart / safeDuration) * 100));
  const endPercent = Math.max(0, Math.min(100, (trimEnd / safeDuration) * 100));

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val < trimEnd - 2) {
      onChange(val, trimEnd);
    }
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val > trimStart + 2) {
      onChange(trimStart, val);
    }
  };

  const handlePreset = (start: number, end: number) => {
    const s = Math.max(0, Math.min(safeDuration - 2, start));
    const e = Math.min(safeDuration, Math.max(s + 5, end));
    onChange(s, e);
  };

  return (
    <div className="bg-surface-elevated/90 border border-white/[0.12] rounded-3xl p-5 backdrop-blur-2xl shadow-glass-card space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause audio track' : 'Play audio track'}
            className="w-11 h-11 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent hover:bg-accent hover:text-void transition-all shadow-glow-sm cursor-pointer flex-shrink-0"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <div className="min-w-0">
            <h4 className="text-sm font-display font-bold text-text-1 truncate">{title}</h4>
            <p className="text-xs text-text-3 truncate">{artist} • {formatSeconds(safeDuration)} Total</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-mono font-bold text-accent shadow-glow-sm">
            <Scissors size={12} />
            <span>Clip: {formatSeconds(trimStart)} - {formatSeconds(trimEnd)} ({Math.round(trimEnd - trimStart)}s)</span>
          </div>
        </div>
      </div>

      {/* Waveform graphic */}
      <div className="relative h-20 w-full bg-[#06060A] rounded-2xl overflow-hidden flex items-center justify-between px-3 py-1.5 border border-white/15">
        {/* Active Trim window overlay */}
        <div
          className="absolute top-0 bottom-0 bg-accent/25 border-x-2 border-accent transition-all duration-75 pointer-events-none"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(2, endPercent - startPercent)}%`,
          }}
        />

        {bars.map((height, idx) => {
          const barPercent = (idx / bars.length) * 100;
          const isInTrim = barPercent >= startPercent && barPercent <= endPercent;

          return (
            <div
              key={idx}
              className="w-1 sm:w-1.5 rounded-full transition-colors duration-200"
              style={{
                height: `${height}%`,
                backgroundColor: isInTrim ? '#C8A96E' : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isInTrim ? '0 0 8px rgba(200, 169, 110, 0.6)' : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Quick Trim Preset Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[10px] font-mono uppercase text-text-3 font-bold pr-1 whitespace-nowrap">Presets:</span>
        <button
          type="button"
          onClick={() => handlePreset(0, safeDuration)}
          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-accent/20 border border-white/[0.08] hover:border-accent/40 text-[11px] font-mono text-text-2 hover:text-accent transition-all whitespace-nowrap cursor-pointer"
        >
          Full Song (0:00 - {formatSeconds(safeDuration)})
        </button>
        <button
          type="button"
          onClick={() => handlePreset(0, Math.min(30, safeDuration))}
          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-accent/20 border border-white/[0.08] hover:border-accent/40 text-[11px] font-mono text-text-2 hover:text-accent transition-all whitespace-nowrap cursor-pointer"
        >
          Intro (0:00 - 0:30)
        </button>
        <button
          type="button"
          onClick={() => handlePreset(Math.min(30, safeDuration * 0.3), Math.min(60, safeDuration * 0.7))}
          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-accent/20 border border-white/[0.08] hover:border-accent/40 text-[11px] font-mono text-text-2 hover:text-accent transition-all whitespace-nowrap cursor-pointer"
        >
          Chorus Section
        </button>
        <button
          type="button"
          onClick={() => handlePreset(Math.max(0, safeDuration - 45), safeDuration)}
          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-accent/20 border border-white/[0.08] hover:border-accent/40 text-[11px] font-mono text-text-2 hover:text-accent transition-all whitespace-nowrap cursor-pointer"
        >
          Outro Climax
        </button>
      </div>

      {/* Sliders Grid: Start Trim, End Trim, and Track Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-white/[0.08]">
        <div>
          <div className="flex justify-between text-xs font-mono font-bold text-text-2 mb-1.5">
            <span>START TRIM</span>
            <span className="text-accent">{formatSeconds(trimStart)} ({trimStart.toFixed(1)}s)</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(1, safeDuration - 2)}
            step="0.5"
            value={trimStart}
            onChange={handleStartSlider}
            aria-label="Audio start trim"
            className="gold-scrubber w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-accent"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono font-bold text-text-2 mb-1.5">
            <span>END TRIM</span>
            <span className="text-accent">{formatSeconds(trimEnd)} ({trimEnd.toFixed(1)}s)</span>
          </div>
          <input
            type="range"
            min={Math.min(2, safeDuration)}
            max={safeDuration}
            step="0.5"
            value={trimEnd}
            onChange={handleEndSlider}
            aria-label="Audio end trim"
            className="gold-scrubber w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-accent"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono font-bold text-text-2 mb-1.5">
            <span className="flex items-center gap-1">
              {volume === 0 ? <VolumeX size={13} className="text-rose-400" /> : volume > 0.5 ? <Volume2 size={13} className="text-accent" /> : <Volume1 size={13} className="text-accent" />}
              <span>TRACK VOLUME</span>
            </span>
            <span className="text-accent">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange && onVolumeChange(parseFloat(e.target.value))}
            aria-label="Audio volume"
            className="gold-scrubber w-full h-2 bg-white/20 rounded-lg cursor-pointer accent-accent"
          />
        </div>
      </div>
    </div>
  );
};

