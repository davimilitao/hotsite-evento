export type GuestType = 'adult' | 'child';

export interface Guest {
  id?: string;
  name: string;
  type: GuestType;
  age?: number;
  dietary?: string;
}

export type InviteStatus = 'pending' | 'confirmed' | 'declined' | 'pending_date' | 'expired';

export type InviteTier = 'main' | 'reserve'; // 'main' = Lista Principal | 'reserve' = Lista de Espera (Reserva)

export type UserRole = 'admin' | 'birthday_person' | 'assessor';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

export interface SurpriseContribution {
  invite_id: string;
  head_name: string;
  has_sent_photo: boolean;
  photo_url?: string;
  message?: string;
  updated_at?: string;
}

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
  
  // Controle de Lista de Espera & Rastreamento de Envio
  tier?: InviteTier;                  // 'main' ou 'reserve'
  sent_at?: string | null;
  sent_status?: 'not_sent' | 'sent';
  individual_deadline?: string | null; // ISO Date String
  requested_date?: string | null;     // Data informada pelo convidado na opção 'pending_date'
  
  // Homenagem Surpresa
  surprise_sent?: boolean;            // Se já enviou foto para o mural surpresa
  surprise_message?: string;          // Recado para o telão
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
  bg_color: string;      // ex: #faf6f0
  card_bg_color: string; // ex: #ffffff
  text_color: string;    // ex: #2d2138
  font_family: 'playfair' | 'serif' | 'sans';
  banner_image_url?: string;
}

export interface EventConfig {
  title: string;
  birthday_person: string;
  age_celebrating?: number;
  date_time: string; // ISO String
  deadline_rsvp: string; // ISO String Geral do Buffet
  buffet_capacity?: number; // Limite de vagas contratadas com o buffet (ex: 100)
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
  surprise_campaign_template?: string;
  theme?: EventTheme;
}
