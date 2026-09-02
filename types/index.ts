export type GuestType = 'adult' | 'child';

export interface Guest {
  id?: string;
  name: string;
  type: GuestType;
  age?: number;
  dietary?: string;
}

export type InviteStatus = 'pending' | 'confirmed' | 'declined';

export interface Invite {
  id: string; // Token (ex: carlos-silva-9x7k)
  head_name: string;
  phone: string;
  max_guests: number;
  status: InviteStatus;
  confirmed_count: number;
  table_id: string | null;
  checked_in: boolean;
  checked_in_at?: string | null;
  created_at?: string;
  updated_at: string;
  guests: Guest[];
  notes?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  allocated_count?: number;
  shape?: 'round' | 'square' | 'lounge';
  description?: string;
  position?: { x: number; y: number };
}

export interface GiftSuggestion {
  id: string;
  title: string;
  description: string;
  category?: 'clothes' | 'shoes' | 'experience' | 'vaquinha' | 'other';
  link?: string;
}

export type ThemePreset = 'lavender_floral' | 'midnight_gold' | 'rose_gold' | 'royal_purple' | 'custom';

export interface EventTheme {
  preset: ThemePreset;
  primary_color: string; // ex: #6b4684
  accent_color: string;  // ex: #c5a059
  bg_color: string;      // ex: #faf6f0 ou #0f172a
  card_bg_color: string; // ex: #ffffff
  text_color: string;    // ex: #332940
  font_family: 'playfair' | 'serif' | 'sans';
  banner_image_url?: string;
}

export interface EventConfig {
  title: string;
  birthday_person: string;
  age_celebrating?: number;
  date_time: string; // ISO String
  deadline_rsvp: string; // ISO String
  location_name: string;
  address: string;
  maps_url: string;
  waze_url: string;
  pix_key: string;
  pix_name?: string;
  pix_bank?: string;
  pix_qrcode_url?: string;
  floorplan_image_url?: string;
  gift_suggestions: GiftSuggestion[];
  custom_message_template?: string;
  theme?: EventTheme;
}
