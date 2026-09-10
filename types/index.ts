export type GuestType = 'adult' | 'child';

export interface Guest {
  id?: string;
  person_id?: string;
  name: string;
  type: GuestType;
  age?: number;
  phone?: string;
  dietary?: string;
  status?: InviteStatus;
  requested_date?: string;
}

export type InviteStatus = 'pending' | 'confirmed' | 'declined' | 'pending_date' | 'expired';

export type InviteTier = 'main' | 'reserve'; // 'main' = Lista Principal | 'reserve' = Lista de Espera (Reserva)

export type UserRole = 'admin' | 'birthday_person' | 'assessor';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authenticatedRole?: UserRole;
  avatar_url?: string;
  authenticatedAt?: number; // Timestamp (ms) de realização do login
  expiresAt?: number;       // Timestamp (ms) de expiração da sessão em 24h
}

export interface SurpriseContribution {
  invite_id: string;
  head_name: string;
  has_sent_photo: boolean;
  has_sent_video: boolean;
  has_sent_text: boolean;
  photo_url?: string;
  video_url?: string;
  message?: string;
  updated_at?: string;
}

export type SpecialRole = 'guest' | 'birthday_person' | 'ceremonialist' | 'musician' | 'staff';

export type RelationshipType =
  | 'spouse'     // Cônjuge / Marido / Esposa
  | 'child'      // Filho / Filha
  | 'parent'     // Pai / Mãe
  | 'sibling'    // Irmão / Irmã
  | 'relative'   // Pessoa da Família / Parente
  | 'friend';    // Amigo / Amiga

export type ChildCategory = 'isento' | 'meia' | 'inteira';

export interface Relationship {
  target_person_id: string;
  relationship_type: RelationshipType;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  age?: number;
  type?: GuestType;
  child_category?: ChildCategory;
  family_id?: string | null;
  family_name?: string;
  relationships?: Relationship[];
  table_id?: string | null;
  seat_number?: number | null;
  invite_id?: string | null;
  role_in_invite?: 'head' | 'companion' | null;
  special_role?: SpecialRole;
  counts_towards_buffet?: boolean;
  special_arrival_time?: string;
  notes?: string;
}

export interface Invite {
  id: string; // Token (ex: carlos-silva-9x7k)
  invite_type?: 'individual' | 'family';
  head_person_id?: string;
  companion_person_ids?: string[];
  head_name: string;
  phone: string;
  target_phone_numbers?: string[];
  whatsapp_dispatch_mode?: 'centralized' | 'multi_contact';
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
  
  // Funções Especiais & Isenção de Cota
  special_role?: SpecialRole;
  counts_towards_buffet?: boolean;
  special_arrival_time?: string;
  custom_whatsapp_message?: string;
  
  // Controle de Lista de Espera & Rastreamento de Envio
  tier?: InviteTier;                  // 'main' ou 'reserve'
  sent_at?: string | null;
  sent_status?: 'not_sent' | 'sent';
  individual_deadline?: string | null; // ISO Date String
  requested_date?: string | null;     // Data informada pelo convidado na opção 'pending_date'
  
  // Homenagem Surpresa
  surprise_sent?: boolean;            // Status geral de recebimento
  surprise_photo_sent?: boolean;      // Se enviou foto
  surprise_video_sent?: boolean;      // Se enviou vídeo
  surprise_text_sent?: boolean;       // Se enviou recado por escrito
  surprise_message?: string;          // Recado/Depoimento para o telão
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  allocated_count?: number;
  shape?: 'round' | 'square' | 'lounge';
  description?: string;
  spot_id?: string;
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

export type FontOption = 'playfair' | 'cinzel' | 'script' | 'serif' | 'sans';

export interface EventTheme {
  preset: ThemePreset;
  invite_mode?: 'off' | 'upload' | 'custom'; // Modo 1: Off (Sem Convite) | Modo 2: Upload da Arte Impressa | Modo 3: Customizador
  uploaded_invite_url?: string;     // URL ou DataURL da imagem do convite físico enviada pelo usuário
  primary_color: string;           // ex: #6b4684
  accent_color: string;            // ex: #c5a059
  bg_color: string;                // ex: #faf6f0
  card_bg_color: string;           // ex: #ffffff
  text_color: string;              // ex: #2d2138
  font_family: FontOption;         // 'playfair' | 'cinzel' | 'script' | 'serif' | 'sans'
  banner_image_url?: string;
}

export interface EventConfig {
  title: string;
  birthday_person: string;
  age_celebrating?: number;
  date_time: string; // ISO String
  deadline_rsvp: string; // ISO String Geral do Buffet
  buffet_capacity?: number; // Limite de vagas contratadas com o buffet (ex: 100)
  child_free_max_age?: number; // Idade máxima para criança ser ISENTA no buffet (ex: 5 anos)
  child_half_max_age?: number; // Idade máxima para criança ser MEIA-ENTRADA (ex: 11 anos)
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
  surprise_photo_template?: string;
  surprise_video_template?: string;
  surprise_text_template?: string;
  surprise_video_orientation?: 'horizontal' | 'vertical' | 'selfie';
  show_digital_invite?: boolean; // Feature Toggle: Exibe Módulo Hotsite/Convite Digital (true) ou apenas RSVP Direto (false)
  access_token?: string;        // Código Token de Acesso do Evento (ex: FERNANDA40)
  allowed_emails?: string[];     // Lista Whitelist de e-mails Google com acesso direto liberado
  admin_pin?: string;            // PIN de 4 dígitos para Admin Geral (ex: '4040')
  birthday_person_pin?: string;  // PIN de 4 dígitos para Aniversariante (ex: '1986')
  assessor_pin?: string;         // PIN de 4 dígitos para Cerimonial/Assessora (ex: '2026')
  theme?: EventTheme;
}
