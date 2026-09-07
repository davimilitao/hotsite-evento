import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Invite, Table, EventConfig, Guest, InviteStatus, InviteTier } from '@/types';
import { generateInviteToken } from './utils';

// Dados Reais da Festa de Fernanda Seppi (40 Anos) com Tema Claro Aquarelado
export const INITIAL_EVENT_CONFIG: EventConfig = {
  title: 'Fernanda Seppi - 40 Anos 🌸✨',
  birthday_person: 'Fernanda Seppi',
  age_celebrating: 40,
  date_time: '2026-11-07T17:00:00.000Z',
  deadline_rsvp: '2026-10-25T23:59:59.000Z',
  buffet_capacity: 100, // Limite de 100 vagas no buffet
  location_name: 'Buffet Espaço Estupendo',
  address: 'São Bernardo do Campo - SP',
  maps_url: 'https://maps.google.com/?q=Buffet+Espaco+Estupendo+Sao+Bernardo+do+Campo',
  waze_url: 'https://waze.com/ul?q=Buffet+Espaco+Estupendo+Sao+Bernardo+do+Campo',
  pix_key: 'fernanda.seppi40@email.com',
  pix_name: 'Fernanda Seppi (Vaquinha da Comemoração)',
  pix_bank: 'Banco Nubank',
  floorplan_image_url: '',
  show_digital_invite: true,
  access_token: 'FERNANDA40',
  allowed_emails: [],
  theme: {
    preset: 'lavender_floral',
    invite_mode: 'custom', // 'off' | 'upload' | 'custom'
    uploaded_invite_url: '',
    primary_color: '#6b4684', // Roxo Lavanda Elegante do Convite Impresso
    accent_color: '#c5a059',  // Dourado Nobre das Letras
    bg_color: '#faf6f0',      // Creme Suave / Marfim do Papel Aquarelado
    card_bg_color: '#ffffff', // Branco Puro para os Cards de Conteúdo
    text_color: '#2d2138',    // Violeta Escuro Profundo Legível
    font_family: 'serif',
    banner_image_url: '',
  },
  gift_suggestions: [
    {
      id: 'g1',
      title: 'Vaquinha Especial 40 Anos ✈️',
      description: 'Contribua com qualquer valor via Pix para marcar essa data inesquecível!',
      category: 'vaquinha',
    },
    {
      id: 'g2',
      title: 'Roupas & Estilo 👗',
      description: 'Vestidos / Blusas tamanho M / Cores suaves e elegantes',
      category: 'clothes',
    },
    {
      id: 'g3',
      title: 'Calçados & Acessórios 👠',
      description: 'Sandálias ou calçados confortáveis tamanho 37',
      category: 'shoes',
    },
    {
      id: 'g4',
      title: 'Experiências & Bem-Estar 💆‍♀️',
      description: 'Vale Day Spa / Jantar Especial',
      category: 'experience',
    },
  ],
};

export const INITIAL_TABLES: Table[] = [
  { id: 'mesa-01', name: 'Mesa 01 - Família Seppi', capacity: 8, shape: 'round', description: 'Próxima à pista de dança' },
  { id: 'mesa-02', name: 'Mesa 02 - Amigos de Infância', capacity: 8, shape: 'round', description: 'Setor central do salão' },
  { id: 'mesa-03', name: 'Mesa 03 - Colegas de Trabalho', capacity: 8, shape: 'round', description: 'Próxima ao buffet' },
  { id: 'mesa-04', name: 'Mesa 04 - Família Expandida', capacity: 8, shape: 'round', description: 'Ambiente tranquilo' },
  { id: 'mesa-05', name: 'Mesa 05 - Hóspedes & Viagem', capacity: 8, shape: 'round', description: 'Próxima ao bar de drinks' },
];

export const INITIAL_INVITES: Invite[] = [
  {
    id: 'carlos-silva-8a2',
    head_name: 'Carlos Silva',
    phone: '11999998888',
    max_guests: 4,
    status: 'confirmed',
    confirmed_count: 4,
    table_id: 'mesa-01',
    tier: 'main',
    sent_status: 'sent',
    sent_at: '2026-09-01T10:00:00.000Z',
    checked_in: false,
    updated_at: '2026-09-01T10:00:00.000Z',
    guests: [
      { name: 'Carlos Silva', type: 'adult' },
      { name: 'Ana Silva', type: 'adult' },
      { name: 'Lucas Silva', type: 'child', age: 7 },
      { name: 'Mariana Silva', type: 'child', age: 10, dietary: 'Sem lactose' },
    ],
  },
  {
    id: 'fernanda-lima-3k9',
    head_name: 'Fernanda Lima',
    phone: '11988887777',
    max_guests: 2,
    status: 'pending',
    confirmed_count: 0,
    table_id: null,
    tier: 'main',
    sent_status: 'not_sent',
    checked_in: false,
    updated_at: '2026-09-02T14:30:00.000Z',
    guests: [],
  },
  {
    id: 'rodrigo-alves-5m1',
    head_name: 'Rodrigo Alves',
    phone: '11977776666',
    max_guests: 3,
    status: 'pending_date',
    requested_date: '2026-10-18T00:00:00.000Z',
    confirmed_count: 0,
    table_id: null,
    tier: 'main',
    sent_status: 'sent',
    sent_at: '2026-09-02T15:00:00.000Z',
    checked_in: false,
    updated_at: '2026-09-02T15:00:00.000Z',
    guests: [],
  },
  {
    id: 'patricia-gomes-9p4',
    head_name: 'Patrícia Gomes',
    phone: '11966665555',
    max_guests: 2,
    status: 'declined',
    confirmed_count: 0,
    table_id: null,
    tier: 'main',
    sent_status: 'sent',
    sent_at: '2026-09-02T16:00:00.000Z',
    checked_in: false,
    updated_at: '2026-09-02T16:00:00.000Z',
    guests: [],
    notes: 'Viagem de trabalho agendada',
  },
  {
    id: 'marcelo-oliveira-2x8',
    head_name: 'Marcelo Oliveira (Reserva)',
    phone: '11955554444',
    max_guests: 2,
    status: 'pending',
    confirmed_count: 0,
    table_id: null,
    tier: 'reserve',
    sent_status: 'not_sent',
    checked_in: false,
    updated_at: '2026-09-03T09:00:00.000Z',
    guests: [],
  },
];

// Chaves do LocalStorage v4
const LS_KEYS = {
  CONFIG: 'festa_config_v4',
  TABLES: 'festa_tables_v4',
  INVITES: 'festa_invites_v4',
};

function getLS<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultData;
  } catch {
    return defaultData;
  }
}

function setLS<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

/**
 * Popula o banco de dados do Firestore com os dados reais de Fernanda Seppi
 */
export async function seedFirestoreData(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear();
    } catch {}
    setLS(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
    setLS(LS_KEYS.TABLES, INITIAL_TABLES);
    setLS(LS_KEYS.INVITES, INITIAL_INVITES);
  }

  if (!isFirebaseConfigured) {
    return;
  }

  await setDoc(doc(db, 'event_config', 'settings'), INITIAL_EVENT_CONFIG);

  for (const table of INITIAL_TABLES) {
    await setDoc(doc(db, 'tables', table.id), table);
  }

  for (const invite of INITIAL_INVITES) {
    await setDoc(doc(db, 'invites', invite.id), invite);
  }
}

// ---- API DO BANCO DE DADOS (COM DEEP MERGE PARA GARANTIR 100% PERSISTÊNCIA) ----

export async function getEventConfig(): Promise<EventConfig> {
  let mergedConfig: EventConfig = { ...INITIAL_EVENT_CONFIG };
  const defaultTheme = INITIAL_EVENT_CONFIG.theme || {
    preset: 'lavender_floral',
    invite_mode: 'custom',
    uploaded_invite_url: '',
    primary_color: '#6b4684',
    accent_color: '#c5a059',
    bg_color: '#faf6f0',
    card_bg_color: '#ffffff',
    text_color: '#2d2138',
    font_family: 'serif',
    banner_image_url: '',
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'event_config', 'settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as EventConfig;
        if (data.birthday_person !== 'Lucas Silva') {
          mergedConfig = {
            ...INITIAL_EVENT_CONFIG,
            ...data,
            theme: {
              preset: data.theme?.preset || defaultTheme.preset,
              invite_mode: data.theme?.invite_mode || defaultTheme.invite_mode,
              uploaded_invite_url: data.theme?.uploaded_invite_url ?? defaultTheme.uploaded_invite_url,
              primary_color: data.theme?.primary_color || defaultTheme.primary_color,
              accent_color: data.theme?.accent_color || defaultTheme.accent_color,
              bg_color: data.theme?.bg_color || defaultTheme.bg_color,
              card_bg_color: data.theme?.card_bg_color || defaultTheme.card_bg_color,
              text_color: data.theme?.text_color || defaultTheme.text_color,
              font_family: data.theme?.font_family || defaultTheme.font_family,
              banner_image_url: data.theme?.banner_image_url ?? defaultTheme.banner_image_url,
            },
          };
          setLS(LS_KEYS.CONFIG, mergedConfig);
          return mergedConfig;
        }
      }
    } catch (err) {
      console.warn('Erro ao ler Firestore event_config, usando fallback:', err);
    }
  }

  const cached = getLS<EventConfig>(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
  if (cached && cached.birthday_person !== 'Lucas Silva') {
    mergedConfig = {
      ...INITIAL_EVENT_CONFIG,
      ...cached,
      theme: {
        preset: cached.theme?.preset || defaultTheme.preset,
        invite_mode: cached.theme?.invite_mode || defaultTheme.invite_mode,
        uploaded_invite_url: cached.theme?.uploaded_invite_url ?? defaultTheme.uploaded_invite_url,
        primary_color: cached.theme?.primary_color || defaultTheme.primary_color,
        accent_color: cached.theme?.accent_color || defaultTheme.accent_color,
        bg_color: cached.theme?.bg_color || defaultTheme.bg_color,
        card_bg_color: cached.theme?.card_bg_color || defaultTheme.card_bg_color,
        text_color: cached.theme?.text_color || defaultTheme.text_color,
        font_family: cached.theme?.font_family || defaultTheme.font_family,
        banner_image_url: cached.theme?.banner_image_url ?? defaultTheme.banner_image_url,
      },
    };
  } else {
    setLS(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
  }

  return mergedConfig;
}

export async function toggleCheckin(id: string): Promise<Invite | null> {
  const invite = (await getAllInvites()).find((i) => i.id === id);
  if (!invite) return null;

  return saveInvite({
    ...invite,
    checked_in: !invite.checked_in,
    checked_in_at: !invite.checked_in ? new Date().toISOString() : null,
  });
}

export async function saveEventConfig(config: EventConfig): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'event_config', 'settings'), config);
    } catch (err) {
      console.error('Erro ao salvar event_config no Firestore:', err);
    }
  }
  setLS(LS_KEYS.CONFIG, config);
}

export async function getAllInvites(): Promise<Invite[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'invites'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invite));
      }
    } catch (err) {
      console.warn('Erro ao buscar convites no Firestore:', err);
    }
  }
  return getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'invites', token);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Invite;
      }
    } catch (err) {
      console.warn(`Erro ao buscar token ${token} no Firestore:`, err);
    }
  }

  const invites = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
  return invites.find((i) => i.id === token) || null;
}

export async function saveInvite(invite: Partial<Invite> & { id?: string }): Promise<Invite> {
  const invites = await getAllInvites();
  let fullInvite: Invite;

  if (invite.id) {
    const existingIndex = invites.findIndex((i) => i.id === invite.id);
    if (existingIndex >= 0) {
      fullInvite = {
        ...invites[existingIndex],
        ...invite,
        updated_at: new Date().toISOString(),
      };
      invites[existingIndex] = fullInvite;
    } else {
      fullInvite = {
        id: invite.id,
        head_name: invite.head_name || 'Convidado',
        phone: invite.phone || '',
        max_guests: invite.max_guests || 1,
        status: invite.status || 'pending',
        confirmed_count: invite.confirmed_count || 0,
        table_id: invite.table_id || null,
        tier: invite.tier || 'main',
        sent_status: invite.sent_status || 'not_sent',
        checked_in: invite.checked_in || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        guests: invite.guests || [],
      };
      invites.push(fullInvite);
    }
  } else {
    const newToken = generateInviteToken(invite.head_name || 'Convidado');
    fullInvite = {
      id: newToken,
      head_name: invite.head_name || 'Convidado',
      phone: invite.phone || '',
      max_guests: invite.max_guests || 1,
      status: invite.status || 'pending',
      confirmed_count: invite.confirmed_count || 0,
      table_id: invite.table_id || null,
      tier: invite.tier || 'main',
      sent_status: invite.sent_status || 'not_sent',
      checked_in: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      guests: invite.guests || [],
    };
    invites.push(fullInvite);
  }

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'invites', fullInvite.id), fullInvite);
    } catch (err) {
      console.error('Erro ao salvar convite no Firestore:', err);
    }
  }

  setLS(LS_KEYS.INVITES, invites);
  return fullInvite;
}

export async function deleteInvite(id: string): Promise<void> {
  const invites = await getAllInvites();
  const filtered = invites.filter((i) => i.id !== id);

  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'invites', id));
    } catch (err) {
      console.error('Erro ao deletar convite no Firestore:', err);
    }
  }

  setLS(LS_KEYS.INVITES, filtered);
}

export async function promoteInviteToMain(id: string): Promise<Invite | null> {
  const invite = (await getAllInvites()).find((i) => i.id === id);
  if (!invite) return null;

  return saveInvite({
    ...invite,
    tier: 'main',
    sent_status: 'not_sent',
  });
}

export async function markInviteAsSent(id: string): Promise<Invite | null> {
  const invite = (await getAllInvites()).find((i) => i.id === id);
  if (!invite) return null;

  return saveInvite({
    ...invite,
    sent_status: 'sent',
    sent_at: new Date().toISOString(),
  });
}

export async function getAllTables(): Promise<Table[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'tables'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table));
      }
    } catch (err) {
      console.warn('Erro ao buscar mesas no Firestore:', err);
    }
  }

  return getLS<Table[]>(LS_KEYS.TABLES, INITIAL_TABLES);
}

export async function saveTable(table: Partial<Table> & { id?: string }): Promise<Table> {
  const tables = await getAllTables();
  let fullTable: Table;

  if (table.id) {
    const existingIndex = tables.findIndex((t) => t.id === table.id);
    if (existingIndex >= 0) {
      fullTable = { ...tables[existingIndex], ...table };
      tables[existingIndex] = fullTable;
    } else {
      fullTable = {
        id: table.id,
        name: table.name || 'Nova Mesa',
        capacity: table.capacity || 8,
        shape: table.shape || 'round',
        description: table.description || '',
      };
      tables.push(fullTable);
    }
  } else {
    const newId = `mesa-${Date.now()}`;
    fullTable = {
      id: newId,
      name: table.name || 'Nova Mesa',
      capacity: table.capacity || 8,
      shape: table.shape || 'round',
      description: table.description || '',
    };
    tables.push(fullTable);
  }

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'tables', fullTable.id), fullTable);
    } catch (err) {
      console.error('Erro ao salvar mesa no Firestore:', err);
    }
  }

  setLS(LS_KEYS.TABLES, tables);
  return fullTable;
}

export async function deleteTable(id: string): Promise<void> {
  const tables = await getAllTables();
  const filtered = tables.filter((t) => t.id !== id);

  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (err) {
      console.error('Erro ao deletar mesa no Firestore:', err);
    }
  }

  setLS(LS_KEYS.TABLES, filtered);
}

export async function updateInviteRSVP(
  id: string,
  status: 'confirmed' | 'declined' | 'pending_date',
  confirmedCount: number,
  guests: Guest[],
  requestedDate?: string | null
): Promise<Invite | null> {
  const invite = (await getAllInvites()).find((i) => i.id === id);
  if (!invite) return null;

  return saveInvite({
    ...invite,
    status,
    confirmed_count: confirmedCount,
    guests,
    requested_date: requestedDate || null,
  });
}

export async function bulkImportInvites(rawInvites: Array<{ head_name: string; phone: string; max_guests?: number }>): Promise<number> {
  let count = 0;
  for (const item of rawInvites) {
    if (item.head_name && item.phone) {
      await saveInvite({
        head_name: item.head_name,
        phone: item.phone,
        max_guests: item.max_guests || 2,
        status: 'pending',
        tier: 'main',
        sent_status: 'not_sent',
      });
      count++;
    }
  }
  return count;
}


