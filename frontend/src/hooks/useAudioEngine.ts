import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);

  const initAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.gain.value = 0.3;
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playSynthTheme = useCallback((themePreset: string = 'synth://golden_hour') => {
    initAudioCtx();
    if (!audioCtxRef.current || !gainNodeRef.current) return;

    stop();
    setIsPlaying(true);

    const ctx = audioCtxRef.current;
    const masterGain = gainNodeRef.current;

    // Frequencies mapping for chords
    let chordNotes: number[][] = [];
    if (themePreset.includes('golden_hour') || themePreset.includes('orchestral')) {
      chordNotes = [
        [261.63, 329.63, 392.00, 523.25], // C Major
        [220.00, 261.63, 329.63, 440.00], // A Minor
        [174.61, 220.00, 261.63, 349.23], // F Major
        [196.00, 246.94, 293.66, 392.00], // G Major
      ];
    } else if (themePreset.includes('lofi')) {
      chordNotes = [
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23], // G7
        [164.81, 196.00, 246.94, 293.66], // Em7
      ];
    } else if (themePreset.includes('bollywood') || themePreset.includes('electric_pop')) {
      chordNotes = [
        [293.66, 369.99, 440.00, 587.33], // D Major
        [246.94, 293.66, 369.99, 493.88], // B Minor
        [196.00, 246.94, 293.66, 392.00], // G Major
        [220.00, 277.18, 329.63, 440.00], // A Major
      ];
    } else {
      chordNotes = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 392.00], // G
      ];
    }

    let step = 0;
    const playArp = () => {
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const currentChord = chordNotes[Math.floor(step / 4) % chordNotes.length];
      const freq = currentChord[step % currentChord.length];

      // Warm oscillator
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = themePreset.includes('lofi') ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.6);

      step++;
      timerRef.current = window.setTimeout(playArp, 280);
    };

    playArp();
  }, [initAudioCtx]);

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

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (gainNodeRef.current) {
      if (isMuted) {
        gainNodeRef.current.gain.value = 0.3;
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
