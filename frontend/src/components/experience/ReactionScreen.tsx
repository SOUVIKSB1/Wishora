import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mic, Video, ArrowRight, Check, RefreshCw, Play, Pause, Trash2, Smile, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';

interface ReactionScreenProps {
  slug: string;
  senderName?: string;
  onDone: () => void;
}

const PRESET_EMOTIONS = [
  "💖 Loved it!", "😭 Cried happy tears", "🔥 This is fire!", "🥹 Speechless",
  "🙏 So grateful", "😂 Laughing so hard", "✨ Pure magic", "❤️ You're amazing"
];

const EMOJI_GRID = [
  "❤️", "💖", "✨", "🎂", "😭", "🥹", "🥰", "🥳",
  "🥂", "🎉", "🔥", "🙏", "😍", "💫", "🌸", "👏",
  "😄", "🤣", "💌", "🌟", "💐", "🎁", "🎈", "💎"
];

export const ReactionScreen: React.FC<ReactionScreenProps> = ({
  slug,
  senderName = 'Souvik Sinhababu',
  onDone
}) => {
  const prefersReduced = useReducedMotion();
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | 'video' | null>(null);

  // Text state
  const [textNote, setTextNote] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Voice state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voicePlaybackProgress, setVoicePlaybackProgress] = useState(0);
  const [micDenied, setMicDenied] = useState(false);

  // Video state
  const [videoCountdown, setVideoCountdown] = useState<number | 'GO!' | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);

  // Audio / Waveform references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const voiceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const voiceTimerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const audioBase64Ref = useRef<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Video references
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoBlobUrlRef = useRef<string | null>(null);
  const videoBase64Ref = useRef<string | null>(null);
  const videoTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ────────────────────────── VOICE ENGINE & CANVAS WAVEFORM ────────────────────────── */
  useEffect(() => {
    if (selectedMode !== 'voice') return;

    const canvas = voiceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let idlePhase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 60;
      const gap = 3;
      const totalGaps = (numBars - 1) * gap;
      const barWidth = Math.max(2, (width - totalGaps) / numBars);
      const centerY = height / 2;

      // Faint horizontal baseline
      ctx.fillStyle = 'rgba(200, 169, 110, 0.08)';
      ctx.fillRect(0, centerY - 0.5, width, 1);

      if (isVoiceRecording && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        const chunkSize = Math.floor(dataArray.length / numBars);
        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          for (let j = 0; j < chunkSize; j++) {
            const val = (dataArray[i * chunkSize + j] - 128) / 128;
            sum += Math.abs(val);
          }
          const avg = sum / chunkSize;
          const barHeight = Math.max(4, Math.min(120, avg * 160));

          const x = i * (barWidth + gap);
          const y = centerY - barHeight / 2;

          const grad = ctx.createLinearGradient(0, y + barHeight, 0, y);
          grad.addColorStop(0, '#C8A96E');
          grad.addColorStop(1, '#E879A0');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();
        }
      } else {
        // Idle gentle sine wave
        idlePhase += 0.04;
        for (let i = 0; i < numBars; i++) {
          const osc = Math.sin(idlePhase + i * 0.18);
          const barHeight = 4 + Math.abs(osc) * 14;
          const x = i * (barWidth + gap);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = voiceRecorded ? '#8A6E42' : 'rgba(58, 58, 82, 0.4)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();
        }

        // Playback progress head
        if (isVoicePlaying) {
          const headX = width * voicePlaybackProgress;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(headX, 10, 2, height - 20);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedMode, isVoiceRecording, voiceRecorded, isVoicePlaying, voicePlaybackProgress]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicDenied(false);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBlobUrlRef.current = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            audioBase64Ref.current = reader.result;
          }
        };
        reader.readAsDataURL(blob);
        setVoiceRecorded(true);
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);
      setVoiceDuration(0);

      voiceTimerRef.current = window.setInterval(() => {
        setVoiceDuration((d) => {
          if (d >= 59) {
            stopVoiceRecording();
            return 60;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied:', err);
      setMicDenied(true);
      setSelectedMode('text');
      showToast('Switched to text note instead (Mic access denied)');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isVoiceRecording) {
      mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    setIsVoiceRecording(false);
  };

  const playVoiceNote = () => {
    if (!audioBlobUrlRef.current && !audioBase64Ref.current) return;
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioBlobUrlRef.current || audioBase64Ref.current || '');
    audioElementRef.current = audio;
    setIsVoicePlaying(true);

    audio.ontimeupdate = () => {
      setVoicePlaybackProgress(audio.currentTime / (audio.duration || 1));
    };
    audio.onended = () => {
      setIsVoicePlaying(false);
      setVoicePlaybackProgress(0);
    };
    audio.play();
  };

  const discardVoiceNote = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    audioBlobUrlRef.current = null;
    audioBase64Ref.current = null;
    setVoiceRecorded(false);
    setVoiceDuration(0);
    setVoicePlaybackProgress(0);
    setIsVoicePlaying(false);
  };

  /* ────────────────────────── VIDEO ENGINE & VIEWFINDER ────────────────────────── */
  const triggerVideoCountdown = () => {
    setVideoCountdown(3);
    const countSeq = [3, 2, 1, 'GO!' as const];
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step < countSeq.length) {
        setVideoCountdown(countSeq[step]);
      } else {
        clearInterval(interval);
        setVideoCountdown(null);
        startActualVideoRecording();
      }
    }, 700);
  };

  const startActualVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;
      setCameraDenied(false);

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.muted = true;
        videoElementRef.current.play();
      }

      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      videoMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        videoBlobUrlRef.current = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            videoBase64Ref.current = reader.result;
          }
        };
        reader.readAsDataURL(blob);
        setVideoRecorded(true);

        if (videoElementRef.current) {
          videoElementRef.current.srcObject = null;
          videoElementRef.current.src = videoBlobUrlRef.current;
          videoElementRef.current.muted = false;
          videoElementRef.current.loop = true;
          videoElementRef.current.play();
        }
      };

      mediaRecorder.start();
      setIsVideoRecording(true);
      setVideoDuration(0);

      videoTimerRef.current = window.setInterval(() => {
        setVideoDuration((d) => {
          if (d >= 14) {
            stopVideoRecording();
            return 15;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Camera permission denied:', err);
      setCameraDenied(true);
      setSelectedMode('text');
      showToast('Switched to text note instead (Camera access denied)');
    }
  };

  const stopVideoRecording = () => {
    if (videoMediaRecorderRef.current && isVideoRecording) {
      videoMediaRecorderRef.current.stop();
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    setIsVideoRecording(false);
  };

  const discardVideoRecording = () => {
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
    }
    videoBlobUrlRef.current = null;
    videoBase64Ref.current = null;
    setVideoRecorded(false);
    setVideoDuration(0);
  };

  /* ────────────────────────── SUBMISSION ────────────────────────── */
  const handleSubmit = async (type: 'text' | 'voice' | 'video') => {
    setIsSending(true);
    try {
      const mediaPayload = type === 'voice'
        ? (audioBase64Ref.current || audioBlobUrlRef.current || '')
        : type === 'video'
        ? (videoBase64Ref.current || videoBlobUrlRef.current || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400')
        : undefined;

      await api.submitReaction(slug, {
        type,
        message_text: type === 'text' ? textNote : undefined,
        media_url: mediaPayload,
        duration: type === 'voice' ? voiceDuration : type === 'video' ? videoDuration : 0,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onDone();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit reaction:', err);
      showToast('Failed to deliver reaction. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const senderFirstName = senderName ? senderName.trim().split(' ')[0] : 'Creator';

  return (
    <div className="relative w-full min-h-screen bg-void text-text-1 flex flex-col justify-between items-center p-4 sm:p-8 select-none overflow-y-auto">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-6 z-50 bg-[rgba(200,169,110,0.15)] border border-gold text-gold font-body text-xs rounded-full px-5 py-2.5 backdrop-blur-xl shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 text-center pt-2 max-w-lg mx-auto">
        <motion.h1
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.2 }}
          className="text-2xl sm:text-3xl font-display font-semibold text-text-1 tracking-tight"
        >
          How did this make you feel?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="text-sm font-body text-text-2 mt-1.5"
        >
          Send <span className="text-gold font-semibold">{senderFirstName}</span> a little something back 💌
        </motion.p>
      </header>

      {/* Center Stage: Mode Selection Cards or Active Mode Deck */}
      <div className="relative z-10 my-auto w-full max-w-xl py-6">
        {selectedMode === null && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {/* Card A: Text Note */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              onClick={() => setSelectedMode('text')}
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-gold rounded-[20px] p-5 text-center flex flex-col items-center gap-2.5 transition-all group active:scale-95 shadow-glass-card outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(200,169,110,0.15)] border border-gold/30 flex items-center justify-center text-lg">
                ✍️
              </div>
              <div>
                <h3 className="text-sm font-body font-semibold text-text-1">Write a note</h3>
                <p className="text-xs font-body text-text-2">Type your feelings</p>
              </div>
            </motion.button>

            {/* Card B: Voice Note */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.4 }}
              onClick={() => {
                setSelectedMode('voice');
                startVoiceRecording();
              }}
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-pink rounded-[20px] p-5 text-center flex flex-col items-center gap-2.5 transition-all group active:scale-95 shadow-glass-card outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(232,121,160,0.15)] border border-pink/30 flex items-center justify-center text-pink">
                <Mic size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-body font-semibold text-text-1">Voice note</h3>
                <p className="text-xs font-body text-text-2">Record your voice</p>
              </div>
            </motion.button>

            {/* Card C: Video Note */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.66, duration: 0.4 }}
              onClick={() => setSelectedMode('video')}
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-blue-400 rounded-[20px] p-5 text-center flex flex-col items-center gap-2.5 transition-all group active:scale-95 shadow-glass-card outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(59,130,246,0.15)] border border-blue-400/30 flex items-center justify-center text-lg">
                🎥
              </div>
              <div>
                <h3 className="text-sm font-body font-semibold text-text-1">Video reaction</h3>
                <p className="text-xs font-body text-text-2">15-second video</p>
              </div>
            </motion.button>

            {/* Card D: Skip */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.74, duration: 0.4 }}
              onClick={onDone}
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.15] hover:border-gold/60 rounded-[20px] p-5 text-center flex flex-col items-center justify-center gap-2.5 transition-all active:scale-95 outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white/80">
                <ArrowRight size={18} />
              </div>
              <span className="text-sm font-body font-semibold text-white/90">Skip for now</span>
            </motion.button>
          </div>
        )}

        {/* ────────────────────────── MODE A: TEXT NOTE ────────────────────────── */}
        {selectedMode === 'text' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface/95 border border-white/[0.12] rounded-[24px] p-5 sm:p-7 backdrop-blur-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                ✍️ PERSONAL NOTE FOR {senderName}
              </span>
              <button
                onClick={() => setSelectedMode(null)}
                className="text-xs font-body text-text-2 hover:text-text-1 hover:underline cursor-pointer"
              >
                Change Mode
              </button>
            </div>

            {/* Preset Emotion Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_EMOTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setTextNote((prev) => (prev ? `${prev} ${chip}` : chip).substring(0, 200))}
                  className="bg-gold-pulse border border-[rgba(200,169,110,0.25)] hover:border-gold text-text-1 font-body text-xs rounded-full px-4 py-2 whitespace-nowrap active:scale-95 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                rows={4}
                maxLength={200}
                value={textNote}
                onChange={(e) => setTextNote(e.target.value)}
                placeholder="Tell them what you felt..."
                className="w-full bg-white/[0.04] border border-white/[0.12] focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-2xl p-4 text-sm font-body text-text-1 placeholder:text-text-3 outline-none resize-none leading-relaxed transition-all"
              />
              <span className="absolute bottom-3 right-3 text-[12px] font-body text-text-3">
                {textNote.length} / 200
              </span>
            </div>

            {/* Emoji Tray Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowEmojiTray(!showEmojiTray)}
                className="text-xs font-body text-text-2 hover:text-accent flex items-center gap-1 cursor-pointer"
              >
                <Smile size={14} />
                <span>{showEmojiTray ? 'Hide emoji' : '😊 Add emoji'}</span>
              </button>

              {showEmojiTray && (
                <div className="grid grid-cols-8 gap-2 p-3 mt-2 bg-white/[0.05] border border-white/[0.12] rounded-xl max-h-36 overflow-y-auto">
                  {EMOJI_GRID.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTextNote((prev) => (prev + em).substring(0, 200))}
                      className="text-xl p-1 rounded-lg hover:bg-white/[0.1] transition-transform active:scale-125 cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSubmit('text')}
              disabled={isSending || !textNote.trim()}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-extrabold text-base shadow-[0_0_25px_rgba(200,169,110,0.4)] hover:brightness-105 active:scale-[0.98] disabled:bg-white/[0.08] disabled:from-transparent disabled:to-transparent disabled:text-white/30 disabled:border disabled:border-white/[0.1] disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-void border-t-transparent rounded-full animate-spin" />
              ) : isSuccess ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Sent!</span>
                </div>
              ) : (
                <span>Send my reaction 💌</span>
              )}
            </button>
          </motion.div>
        )}

        {/* ────────────────────────── MODE B: VOICE NOTE ────────────────────────── */}
        {selectedMode === 'voice' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface/95 border border-white/[0.12] rounded-[24px] p-5 sm:p-7 backdrop-blur-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4 text-center"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                🎙️ VOICE NOTE FOR {senderName}
              </span>
              <button
                onClick={() => {
                  stopVoiceRecording();
                  setSelectedMode(null);
                }}
                className="text-xs font-body text-text-2 hover:text-text-1 hover:underline cursor-pointer"
              >
                Change Mode
              </button>
            </div>

            {/* 60-Bar Waveform Canvas */}
            <div className="relative w-full h-40 bg-void/80 rounded-2xl border border-white/[0.1] overflow-hidden flex items-center justify-center p-2">
              <canvas ref={voiceCanvasRef} width={480} height={140} className="w-full h-full" />
            </div>

            {/* Controls */}
            {!isVoiceRecording && !voiceRecorded && (
              <button
                onClick={startVoiceRecording}
                className="px-8 py-3.5 rounded-full bg-accent text-void font-body font-bold text-sm shadow-[0_0_20px_rgba(200,169,110,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                🎙️ Start Recording
              </button>
            )}

            {isVoiceRecording && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B5C] animate-pulse" />
                  <span className="text-2xl font-display font-semibold text-text-1">
                    0:{String(voiceDuration).padStart(2, '0')}
                  </span>
                  {voiceDuration >= 50 && (
                    <span className="text-xs font-body text-amber-400 font-medium">10s remaining</span>
                  )}
                </div>

                <button
                  onClick={stopVoiceRecording}
                  className="px-6 py-2.5 rounded-full bg-[rgba(255,59,92,0.15)] border border-[#FF3B5C] text-[#FF3B5C] font-body font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  ⏹ Stop Recording
                </button>
              </div>
            )}

            {voiceRecorded && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={playVoiceNote}
                    className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-text-1 font-body text-xs font-medium flex items-center gap-1.5 hover:border-gold cursor-pointer transition-colors"
                  >
                    {isVoicePlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isVoicePlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={discardVoiceNote}
                    className="px-5 py-2.5 rounded-full text-text-2 hover:text-rose-400 bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.1] font-body text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Discard</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSubmit('voice')}
                  disabled={isSending}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-extrabold text-base shadow-[0_0_25px_rgba(200,169,110,0.4)] hover:brightness-105 active:scale-[0.98] disabled:bg-white/[0.08] disabled:from-transparent disabled:to-transparent disabled:text-white/30 disabled:border disabled:border-white/[0.1] disabled:shadow-none transition-all flex items-center justify-center cursor-pointer"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-void border-t-transparent rounded-full animate-spin" />
                  ) : isSuccess ? (
                    <span>✓ Sent!</span>
                  ) : (
                    <span>Send Voice Note 💌</span>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ────────────────────────── MODE C: VIDEO NOTE ────────────────────────── */}
        {selectedMode === 'video' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface/95 border border-white/[0.12] rounded-[24px] p-5 backdrop-blur-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4 text-center max-w-sm mx-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                🎥 15s VIDEO NOTE
              </span>
              <button
                onClick={() => {
                  stopVideoRecording();
                  setSelectedMode(null);
                }}
                className="text-xs font-body text-text-2 hover:text-text-1 hover:underline cursor-pointer"
              >
                Change Mode
              </button>
            </div>

            {/* Viewfinder Area */}
            <div className="relative w-full aspect-[9/16] max-h-[360px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/[0.12]">
              <video
                ref={videoElementRef}
                playsInline
                className={`w-full h-full object-cover ${videoRecorded ? '' : 'scale-x-[-1]'}`}
              />

              {/* Countdown Overlay */}
              {videoCountdown !== null && (
                <div className="absolute inset-0 bg-void/70 flex items-center justify-center z-20">
                  <motion.span
                    key={String(videoCountdown)}
                    initial={{ scale: 2.5, opacity: 1 }}
                    animate={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.7 }}
                    className="font-display font-black text-6xl text-gold"
                  >
                    {videoCountdown}
                  </motion.span>
                </div>
              )}

              {/* During Recording: Progress ring & badge */}
              {isVideoRecording && (
                <>
                  <div className="absolute top-3 left-3 bg-[#FF3B5C] text-white text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                    ● REC
                  </div>
                  <div className="absolute bottom-4 inset-x-0 flex justify-center">
                    <button
                      onClick={stopVideoRecording}
                      className="w-14 h-14 rounded-full bg-[#FF3B5C] text-white flex items-center justify-center font-display font-bold text-sm shadow-lg active:scale-95 cursor-pointer"
                    >
                      {15 - videoDuration}s
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {!isVideoRecording && !videoRecorded && (
              <button
                onClick={triggerVideoCountdown}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-extrabold text-sm shadow-[0_0_20px_rgba(200,169,110,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Start 15s Recording
              </button>
            )}

            {videoRecorded && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={discardVideoRecording}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-text-1 font-body text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Retake</span>
                </button>
                <button
                  onClick={() => handleSubmit('video')}
                  disabled={isSending}
                  className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A059] text-[#06060A] font-body font-extrabold text-xs shadow-[0_0_20px_rgba(200,169,110,0.4)] hover:brightness-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-void" />
                      <span>Sending Video...</span>
                    </>
                  ) : (
                    <span>✓ Send Video</span>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Skip Link */}
      <footer className="relative z-10 pb-4 text-center">
        {selectedMode !== null && (
          <button
            onClick={onDone}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-white/80 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm"
          >
            <span>Skip and continue to finale</span>
            <ArrowRight size={13} />
          </button>
        )}
      </footer>
    </div>
  );
};
