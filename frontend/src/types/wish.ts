export interface WishPhoto {
  id: string;
  wish_id?: string;
  storage_url: string;
  caption?: string;
  sort_order: number;
  is_featured?: number;
}

export interface Wish {
  id: string;
  user_id?: string;
  folder_id?: string;
  folder_name?: string;
  folder_color?: string;
  contact_id?: string;
  slug: string;
  recipient_name: string;
  recipient_dob: string;
  recipient_gender: 'male' | 'female' | 'nonbinary' | 'child' | 'unspecified';
  wish_text: string;
  wish_language: string;
  theme: 'auto' | 'candy' | 'electric' | 'rose' | 'gold' | 'cosmic';
  resolved_theme?: 'candy' | 'electric' | 'rose' | 'gold' | 'cosmic';
  music_id?: string;
  music_title?: string;
  custom_music_url?: string;
  music_trim_start: number;
  music_trim_end: number;
  music_volume?: number;
  version?: number;
  version_count?: number;
  status: 'draft' | 'generated' | 'scheduled' | 'sent';
  scheduled_for?: string;
  open_count: number;
  last_opened_at?: string;
  reaction_url?: string;
  reaction_count?: number;
  last_reaction_type?: 'text' | 'voice' | 'video';
  last_reaction_text?: string;
  last_reaction_media?: string;
  last_reaction_duration?: number;
  last_reaction_at?: string;
  cover_photo?: string;
  photo_count?: number;
  created_at: string;
  updated_at?: string;
  age_turning?: number;
  birth_year?: number;
  sender_name?: string;
  sender_avatar?: string;
}

export interface WishVersion {
  id: string;
  wish_id: string;
  version_number: number;
  snapshot_data?: string;
  snapshot?: {
    wish: Wish;
    photos: WishPhoto[];
  };
  note?: string;
  created_at: string;
}

export interface Milestone {
  year: number;
  age: number;
  title: string;
  description: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  mood_tags: string[];
  storage_url: string;
  is_premium: number;
}

export interface WishExperienceData {
  wish: Wish;
  photos: WishPhoto[];
  reactions: Array<{ id: string; type: string; media_url: string; duration: number; created_at: string }>;
  milestones: Milestone[];
}
