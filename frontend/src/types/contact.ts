export interface Contact {
  id: string;
  user_id?: string;
  name: string;
  nickname?: string;
  dob_day?: number;
  dob_month: number;
  dob_year?: number;
  gender: 'male' | 'female' | 'nonbinary' | 'child' | 'unspecified';
  relationship: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  note?: string;
  extra_fields?: Record<string, any>;
  notify_days?: number[];
  days_remaining: number;
  age_turning?: number;
  is_today: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  wish_count?: number;
}
