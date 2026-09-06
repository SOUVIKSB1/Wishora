export type ThemeKey = 'candy' | 'electric' | 'rose' | 'gold' | 'cosmic';

export interface ThemeConfig {
  key: ThemeKey;
  label: string;
  subtitle: string;
  bgGradient: string;
  cardBg: string;
  accent: string;
  accentGlow: string;
  border: string;
  textGradientClass: string;
  particleColors: string[];
  candleColor: string;
  cakeTierColors: string[];
  cakeIcingColor: string;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  candy: {
    key: 'candy',
    label: 'Candy World',
    subtitle: 'Bright, whimsical & playful for kids & fun lovers',
    bgGradient: 'radial-gradient(ellipse at top, #142E1B 0%, #08120C 70%, #050A07 100%)',
    cardBg: 'rgba(20, 46, 27, 0.4)',
    accent: '#10B981',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    border: 'rgba(16, 185, 129, 0.2)',
    textGradientClass: 'candy-gradient-text',
    particleColors: ['#10B981', '#FCD34D', '#F472B6', '#60A5FA'],
    candleColor: '#F472B6',
    cakeTierColors: ['#10B981', '#34D399', '#059669'],
    cakeIcingColor: '#FCD34D',
  },
  electric: {
    key: 'electric',
    label: 'Electric Midnight',
    subtitle: 'Sharp, energetic & cinematic midnight blue',
    bgGradient: 'radial-gradient(ellipse at top, #0F1C3F 0%, #070D1E 70%, #040812 100%)',
    cardBg: 'rgba(15, 28, 63, 0.4)',
    accent: '#3B82F6',
    accentGlow: 'rgba(59, 130, 246, 0.25)',
    border: 'rgba(59, 130, 246, 0.2)',
    textGradientClass: 'electric-gradient-text',
    particleColors: ['#60A5FA', '#3B82F6', '#93C5FD', '#F59E0B'],
    candleColor: '#60A5FA',
    cakeTierColors: ['#1E3A8A', '#2563EB', '#1D4ED8'],
    cakeIcingColor: '#93C5FD',
  },
  rose: {
    key: 'rose',
    label: 'Rose Dusk',
    subtitle: 'Romantic bloom, soft gold & rose dust',
    bgGradient: 'radial-gradient(ellipse at top, #361026 0%, #170712 70%, #0B0309 100%)',
    cardBg: 'rgba(54, 16, 38, 0.4)',
    accent: '#EC4899',
    accentGlow: 'rgba(236, 72, 153, 0.25)',
    border: 'rgba(236, 72, 153, 0.2)',
    textGradientClass: 'rose-gradient-text',
    particleColors: ['#F472B6', '#EC4899', '#FDE047', '#FDA4AF'],
    candleColor: '#F472B6',
    cakeTierColors: ['#831843', '#BE185D', '#9D174D'],
    cakeIcingColor: '#FBCFE8',
  },
  gold: {
    key: 'gold',
    label: 'Timeless Gold',
    subtitle: 'Dignified, warm amber & refined elegance',
    bgGradient: 'radial-gradient(ellipse at top, #2C2111 0%, #151009 70%, #0A0805 100%)',
    cardBg: 'rgba(44, 33, 17, 0.4)',
    accent: '#C8A96E',
    accentGlow: 'rgba(200, 169, 110, 0.25)',
    border: 'rgba(200, 169, 110, 0.2)',
    textGradientClass: 'gold-gradient-text',
    particleColors: ['#C8A96E', '#FDE047', '#E6CCA0', '#FFFBEB'],
    candleColor: '#C8A96E',
    cakeTierColors: ['#453215', '#694D20', '#543E19'],
    cakeIcingColor: '#E6CCA0',
  },
  cosmic: {
    key: 'cosmic',
    label: 'Cosmic Purple',
    subtitle: 'Ethereal, iridescent & boundless nebula aura',
    bgGradient: 'radial-gradient(ellipse at top, #26113B 0%, #12081E 70%, #09040F 100%)',
    cardBg: 'rgba(38, 17, 59, 0.4)',
    accent: '#8B5CF6',
    accentGlow: 'rgba(139, 92, 246, 0.25)',
    border: 'rgba(139, 92, 246, 0.2)',
    textGradientClass: 'cosmic-gradient-text',
    particleColors: ['#A78BFA', '#8B5CF6', '#C084FC', '#38BDF8'],
    candleColor: '#A78BFA',
    cakeTierColors: ['#4C1D95', '#6D28D9', '#5B21B6'],
    cakeIcingColor: '#DDD6FE',
  }
};
