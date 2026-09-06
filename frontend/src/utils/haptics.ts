/**
 * Haptic & Tactile Feedback Utilities for Wishora Cinema
 * Leverages the Web Vibration API with graceful fallbacks.
 */

export const haptic = {
  /** Subtle 10ms click for tabs, chips, toggles, and buttons */
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch (_) {}
    }
  },

  /** Standard 25ms tactile pulse for card selection, audio play/pause, slider drag */
  medium: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (_) {}
    }
  },

  /** Double pulse for successful operations (Save, Create, Share, Copy Link) */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 35, 25]);
      } catch (_) {}
    }
  },

  /** Celebratory rhythm for confetti bursts, candle blowout, cake cutting */
  celebrate: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 30, 20, 30, 40, 50, 60]);
      } catch (_) {}
    }
  },

  /** Dramatic impact for countdown zero, envelope opening, surprise reveals */
  impact: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([45, 25, 45]);
      } catch (_) {}
    }
  },

  /** Multi-tick sparkle for AI text generation, photo auto-captioning */
  sparkle: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([8, 20, 8, 20, 15]);
      } catch (_) {}
    }
  },

  /** Alert/warning pulse for delete confirmations or errors */
  warning: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([35, 40, 35, 40, 50]);
      } catch (_) {}
    }
  }
};
