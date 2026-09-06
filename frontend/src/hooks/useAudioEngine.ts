import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentVolumeRef = useRef<number>(0.8);

  const initAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.gain.value = 0.35 * currentVolumeRef.current;
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const audioIntervalRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.onended = null;
        htmlAudioRef.current.ontimeupdate = null;
        htmlAudioRef.current.src = '';
        htmlAudioRef.current = null;
      } catch (e) {}
    }
    setIsPlaying(false);
  }, []);

  const playSynthTheme = useCallback((
    themePreset: string = 'synth://golden_hour',
    volume: number = 0.8,
    trimStart: number = 0,
    trimEnd?: number
  ) => {
    stop();
    currentVolumeRef.current = Math.max(0, Math.min(1, volume));

    // 1. If it's a real audio file (Data URL or HTTP web URL)
    if (themePreset && (themePreset.startsWith('data:audio') || themePreset.startsWith('http://') || themePreset.startsWith('https://') || themePreset.startsWith('blob:'))) {
      try {
        const audio = new Audio(themePreset);
        audio.preload = 'auto';
        audio.volume = isMuted ? 0 : currentVolumeRef.current;
        htmlAudioRef.current = audio;

        const startSec = Math.max(0, trimStart || 0);

        const seekToStartAndPlay = () => {
          try {
            if (audio.currentTime !== startSec) {
              audio.currentTime = startSec;
            }
          } catch (e) {}
          audio.play().catch(err => {
            console.warn('Audio auto-play policy prevented playback or failed:', err);
          });
        };

        audio.addEventListener('loadedmetadata', () => {
          seekToStartAndPlay();
        });

        // Fast high-frequency time checking for gapless looping between trimStart and trimEnd
        const loopMonitor = () => {
          if (!htmlAudioRef.current) return;
          const cur = htmlAudioRef.current.currentTime;
          const effectiveEnd = (trimEnd && trimEnd > startSec) ? trimEnd : (htmlAudioRef.current.duration || Infinity);

          if (cur >= effectiveEnd - 0.08) {
            htmlAudioRef.current.currentTime = startSec;
            if (htmlAudioRef.current.paused) {
              htmlAudioRef.current.play().catch(() => {});
            }
          }
        };

        audio.addEventListener('timeupdate', loopMonitor);
        audioIntervalRef.current = window.setInterval(loopMonitor, 80);

        audio.onended = () => {
          if (htmlAudioRef.current) {
            htmlAudioRef.current.currentTime = startSec;
            htmlAudioRef.current.play().catch(() => {});
          }
        };

        setIsPlaying(true);
        seekToStartAndPlay();
        return;
      } catch (err) {
        console.error('Failed to initialize HTML audio element:', err);
      }
    }

    // 2. Synthesized Soundtracks for Built-in Tracks
    initAudioCtx();
    if (!audioCtxRef.current || !gainNodeRef.current) return;

    setIsPlaying(true);
    const ctx = audioCtxRef.current;
    const masterGain = gainNodeRef.current;
    masterGain.gain.value = isMuted ? 0 : 0.35 * currentVolumeRef.current;

    const presetLower = (themePreset || '').toLowerCase();

    // Configure distinct parameters per soundtrack
    let chordNotes: number[][] = [];
    let oscType: OscillatorType = 'sine';
    let tempoMs = 280;
    let attackTime = 0.04;
    let releaseTime = 0.55;
    let peakGain = 0.22;

    if (presetLower.includes('lofi') || presetLower.includes('trk_2')) {
      // TRACK 2: Midnight Lo-Fi Nostalgia (Warm mellow chords, slow swing tempo)
      chordNotes = [
        [220.00, 261.63, 329.63, 392.00], // Am7
        [146.83, 220.00, 261.63, 349.23], // Dm7
        [196.00, 246.94, 293.66, 349.23], // G7
        [130.81, 196.00, 246.94, 329.63], // Cmaj7
      ];
      oscType = 'triangle';
      tempoMs = 380;
      attackTime = 0.08;
      releaseTime = 0.7;
      peakGain = 0.24;
    } else if (presetLower.includes('pop') || presetLower.includes('electric') || presetLower.includes('trk_3')) {
      // TRACK 3: Joyful Electric Pop (Upbeat, bouncy, energetic major triad arpeggios)
      chordNotes = [
        [293.66, 369.99, 440.00, 587.33], // D Major
        [246.94, 293.66, 369.99, 493.88], // B Minor
        [196.00, 246.94, 293.66, 392.00], // G Major
        [220.00, 277.18, 329.63, 440.00], // A Major
      ];
      oscType = 'sawtooth';
      tempoMs = 180;
      attackTime = 0.01;
      releaseTime = 0.35;
      peakGain = 0.12;
    } else if (presetLower.includes('acoustic') || presetLower.includes('velvet') || presetLower.includes('trk_4')) {
      // TRACK 4: Romantic Velvet Acoustic (Intimate, soft harp/guitar picking in G major)
      chordNotes = [
        [196.00, 246.94, 293.66, 392.00, 493.88], // G Major
        [130.81, 196.00, 261.63, 329.63, 392.00], // Cadd9
        [164.81, 246.94, 329.63, 392.00, 493.88], // Em7
        [146.83, 220.00, 293.66, 369.99, 440.00], // D/F#
      ];
      oscType = 'triangle';
      tempoMs = 260;
      attackTime = 0.02;
      releaseTime = 0.6;
      peakGain = 0.2;
    } else if (presetLower.includes('bollywood') || presetLower.includes('dhol') || presetLower.includes('trk_5')) {
      // TRACK 5: Bollywood Celebration Dhol (Festive rhythm with melodic punch)
      chordNotes = [
        [293.66, 440.00, 587.33, 739.99], // D high festive
        [220.00, 329.63, 440.00, 659.25], // A celebratory
        [196.00, 293.66, 392.00, 587.33], // G vibrant
        [246.94, 369.99, 493.88, 739.99], // Bm climax
      ];
      oscType = 'square';
      tempoMs = 210;
      attackTime = 0.01;
      releaseTime = 0.28;
      peakGain = 0.09;
    } else if (presetLower.includes('ambient') || presetLower.includes('celestial') || presetLower.includes('trk_6')) {
      // TRACK 6: Celestial Ambient Dreams (Slow, ethereal space chimes, long reverbs)
      chordNotes = [
        [164.81, 246.94, 329.63, 493.88, 659.25], // Em9
        [130.81, 196.00, 261.63, 329.63, 523.25], // Cmaj7
        [220.00, 261.63, 329.63, 440.00, 659.25], // Am9
        [146.83, 220.00, 293.66, 440.00, 587.33], // Dsus4
      ];
      oscType = 'sine';
      tempoMs = 450;
      attackTime = 0.15;
      releaseTime = 1.2;
      peakGain = 0.22;
    } else {
      // TRACK 1 / DEFAULT: Cinematic Golden Hour (Uplifting Orchestral Arpeggio)
      chordNotes = [
        [261.63, 329.63, 392.00, 523.25], // C Major
        [220.00, 261.63, 329.63, 440.00], // A Minor
        [174.61, 220.00, 261.63, 349.23], // F Major
        [196.00, 246.94, 293.66, 392.00], // G Major
      ];
      oscType = 'sine';
      tempoMs = 280;
      attackTime = 0.04;
      releaseTime = 0.55;
      peakGain = 0.22;
    }

    let step = 0;
    const playArp = () => {
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const currentChord = chordNotes[Math.floor(step / 4) % chordNotes.length];
      const freq = currentChord[step % currentChord.length];

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(peakGain, now + attackTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + releaseTime + 0.05);

      step++;
      timerRef.current = window.setTimeout(playArp, tempoMs);
    };

    playArp();
  }, [initAudioCtx, isMuted, stop]);

  const playCelebrationChime = useCallback(() => {
    initAudioCtx();
    if (!audioCtxRef.current || !gainNodeRef.current) return;
    const ctx = audioCtxRef.current;
    const master = gainNodeRef.current;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + 0.85);
    });
  }, [initAudioCtx]);

  const playPaperCrinkleSound = useCallback(() => {
    initAudioCtx();
    if (!audioCtxRef.current || !gainNodeRef.current) return;
    const ctx = audioCtxRef.current;
    const master = gainNodeRef.current;

    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(g);
    g.connect(master);

    noise.start();
  }, [initAudioCtx]);

  const toggleMute = useCallback(() => {
    if (htmlAudioRef.current) {
      if (isMuted) {
        htmlAudioRef.current.volume = currentVolumeRef.current;
        setIsMuted(false);
      } else {
        htmlAudioRef.current.volume = 0;
        setIsMuted(true);
      }
    } else if (gainNodeRef.current) {
      if (isMuted) {
        gainNodeRef.current.gain.value = 0.35 * currentVolumeRef.current;
        setIsMuted(false);
      } else {
        gainNodeRef.current.gain.value = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stop]);

  return {
    isPlaying,
    isMuted,
    playSynthTheme,
    playCelebrationChime,
    playPaperCrinkleSound,
    stop,
    toggleMute
  };
}

