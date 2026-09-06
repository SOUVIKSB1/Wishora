import React, { useMemo } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';

interface WaveformScrubberProps {
  duration?: number;
  trimStart: number;
  trimEnd: number;
  onChange: (start: number, end: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  title?: string;
  artist?: string;
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  duration = 90,
  trimStart,
  trimEnd,
  onChange,
  isPlaying = false,
  onTogglePlay,
  title = 'Selected Soundscape',
  artist = 'WISHORA Sound Engine'
}) => {
  const bars = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const height = 20 + Math.sin(i * 0.4) * 18 + Math.cos(i * 0.8) * 12 + Math.random() * 15;
      return Math.min(100, Math.max(15, height));
    });
  }, []);

  const startPercent = Math.max(0, Math.min(100, (trimStart / duration) * 100));
  const endPercent = Math.max(0, Math.min(100, (trimEnd / duration) * 100));

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val < trimEnd - 5) {
      onChange(val, trimEnd);
    }
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val > trimStart + 5) {
      onChange(trimStart, val);
    }
  };

  return (
    <div className="bg-surface/90 border border-glass-border rounded-2xl p-5 backdrop-blur-xl shadow-glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause audio track' : 'Play audio track'}
            className="w-11 h-11 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-gold hover:bg-gold hover:text-void transition-colors shadow-gold-glow"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <div>
            <h4 className="text-sm font-body font-bold text-text-1">{title}</h4>
            <p className="text-xs font-body text-text-2">{artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold-pulse border border-[rgba(200,169,110,0.3)] text-xs font-mono font-bold text-gold shadow-gold-glow">
          <Volume2 size={13} />
          <span>{Math.round(trimEnd - trimStart)}s clip</span>
        </div>
      </div>

      {/* Waveform graphic */}
      <div className="relative h-20 w-full bg-[#06060A] rounded-xl overflow-hidden flex items-center justify-between px-3 py-1.5 border border-white/15">
        {/* Active Trim window overlay */}
        <div
          className="absolute top-0 bottom-0 bg-gold/20 border-x-2 border-gold transition-all duration-75 pointer-events-none"
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
              className="w-1.5 rounded-full transition-colors duration-200"
              style={{
                height: `${height}%`,
                backgroundColor: isInTrim ? '#C8A96E' : 'rgba(255, 255, 255, 0.2)',
                boxShadow: isInTrim ? '0 0 8px #C8A96E' : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Scrubber Handles */}
      <div className="grid grid-cols-2 gap-5 mt-4">
        <div>
          <div className="flex justify-between text-xs font-mono font-bold text-text-2 mb-1.5">
            <span>START TRIM</span>
            <span className="text-gold">{trimStart.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.5"
            value={trimStart}
            onChange={handleStartSlider}
            aria-label="Audio start trim"
            className="gold-scrubber w-full h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono font-bold text-text-2 mb-1.5">
            <span>END TRIM</span>
            <span className="text-gold">{trimEnd.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.5"
            value={trimEnd}
            onChange={handleEndSlider}
            aria-label="Audio end trim"
            className="gold-scrubber w-full h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
