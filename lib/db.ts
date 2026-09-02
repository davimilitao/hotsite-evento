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
import { Invite, Table, EventConfig, Guest } from '@/types';
import { generateInviteToken } from './utils';

// Dados Iniciais de Demonstração (Seed)
export const INITIAL_EVENT_CONFIG: EventConfig = {
  title: 'Aniversário de 30 Anos do Lucas 🎂',
  birthday_person: 'Lucas Silva',
  age_celebrating: 30,
  date_time: '2026-10-20T19:00:00.000Z',
  deadline_rsvp: '2026-10-10T23:59:59.000Z',
  location_name: 'Espaço Celebrar - Salão Principal',
  address: 'Av. das Nações, 1500 - Jardim Primavera, São Paulo - SP',
  maps_url: 'https://maps.google.com/?q=Espaco+Celebrar+Sao+Paulo',
  waze_url: 'https://waze.com/ul?q=Espaco+Celebrar+Sao+Paulo',
  pix_key: 'lucas.aniversario30@email.com',
  pix_name: 'Lucas Silva (Vaquinha da Viagem)',
  pix_bank: 'Banco Nubank',
  floorplan_image_url: '',
  gift_suggestions: [
    {
      id: 'g1',
      title: 'Vaquinha da Viagem do Aniversariante ✈️',
      description: 'Qualquer valor via Pix é super bem-vindo para realizar o sonho da viagem!',
      category: 'vaquinha',
    },
    {
      id: 'g2',
      title: 'Roupas & Estilo 👕',
      description: 'Camisetas tamanho G / Calças jeans tamanho 42 / Cores neutras',
      category: 'clothes',
    },
    {
      id: 'g3',
      title: 'Calçados & Tênis 👟',
      description: 'Tênis casual ou esportivo tamanho 41',
      category: 'shoes',
    },
    {
      id: 'g4',
      title: 'Vinhos & Bebidas Especiais 🍷',
      description: 'Vinho Seco (Cabernet Sauvignon ou Malbec) ou Cerveja Artesanal',
      category: 'experience',
    },
  ],
};

export const INITIAL_TABLES: Table[] = [
  { id: 'mesa-01', name: 'Mesa 01 - Família VIP', capacity: 8, allocated_count: 4, shape: 'round', description: 'Próxima ao palco principal' },
  { id: 'mesa-02', name: 'Mesa 02 - Amigos de Infância', capacity: 8, allocated_count: 6, shape: 'round', description: 'Central' },
  { id: 'mesa-03', name: 'Mesa 03 - Pessoal do Trabalho', capacity: 10, allocated_count: 3, shape: 'square', description: 'Próxima ao Bar' },
  { id: 'mesa-04', name: 'Mesa 04 - Amigos da Faculdade', capacity: 8, allocated_count: 0, shape: 'round', description: 'Próxima à Pista de Dança' },
  { id: 'lounge-01', name: 'Lounge Estofados', capacity: 12, allocated_count: 0, shape: 'lounge', description: 'Área externa / Descanso' },
];

export const INITIAL_INVITES: Invite[] = [
  {
    id: 'carlos-silva-8a2',
    head_name: 'Carlos Silva',
    phone: '5511999998888',
    max_guests: 4,
    status: 'confirmed',
    confirmed_count: 3,
    table_id: 'mesa-01',
    checked_in: false,
    updated_at: new Date().toISOString(),
    guests: [
      { name: 'Carlos Silva', type: 'adult' },
      { name: 'Mariana Silva', type: 'adult', dietary: 'Sem Glúten' },
      { name: 'Enzo Silva', type: 'child', age: 6 },
    ],
  },
  {
    id: 'fernanda-lima-3k9',
    head_name: 'Fernanda Lima',
    phone: '5511988887777',
    max_guests: 2,
    status: 'pending',
    confirmed_count: 0,
    table_id: 'mesa-02',
    checked_in: false,
    updated_at: new Date().toISOString(),
    guests: [],
  },
  {
    id: 'rodrigo-alves-5m1',
    head_name: 'Rodrigo Alves',
    phone: '5511977776666',
    max_guests: 3,
    status: 'declined',
    confirmed_count: 0,
    table_id: null,
    checked_in: false,
    updated_at: new Date().toISOString(),
    guests: [],
  },
];

// Helper para gerenciar dados no localStorage quando sem Firebase ativo
const LS_KEYS = {
  INVITES: 'festa_invites_v1',
  TABLES: 'festa_tables_v1',
  CONFIG: 'festa_config_v1',
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
 * Popula o banco de dados do Firestore com os dados iniciais do evento, mesas e convites
 */
export async function seedFirestoreData(): Promise<void> {
  if (!isFirebaseConfigured) {
    console.warn('Firebase não configurado, salvando seed no LocalStorage.');
    setLS(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
    setLS(LS_KEYS.TABLES, INITIAL_TABLES);
    setLS(LS_KEYS.INVITES, INITIAL_INVITES);
    return;
  }

  // 1. Salva Configuração do Evento
  await setDoc(doc(db, 'event_config', 'settings'), INITIAL_EVENT_CONFIG);

  // 2. Salva Mesas
  for (const table of INITIAL_TABLES) {
    await setDoc(doc(db, 'tables', table.id), table);
  }

  // 3. Salva Convites
  for (const invite of INITIAL_INVITES) {
    await setDoc(doc(db, 'invites', invite.id), invite);
  }
}

// ---- API DO BANCO DE DADOS (Firestore com fallback localStorage) ----

export async function getEventConfig(): Promise<EventConfig> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'event_config', 'settings');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as EventConfig;
      }
    } catch (err) {
      console.warn('Erro ao ler Firestore event_config, usando fallback:', err);
    }
  }
  return getLS(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
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
  return getLS(LS_KEYS.INVITES, INITIAL_INVITES);
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
      console.warn('Erro ao buscar convite no Firestore:', err);
    }
  }

  const invites = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
  return invites.find((i) => i.id === token) || null;
}

export async function updateInviteRSVP(
  token: string,
  rsvpData: { status: 'confirmed' | 'declined'; guests: Guest[]; notes?: string }
): Promise<Invite> {
  const current = await getInviteByToken(token);
  if (!current) throw new Error('Convite não encontrado.');

  const updated: Invite = {
    ...current,
    status: rsvpData.status,
    guests: rsvpData.guests,
    confirmed_count: rsvpData.status === 'confirmed' ? rsvpData.guests.length : 0,
    notes: rsvpData.notes || '',
    updated_at: new Date().toISOString(),
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'invites', token);
      await updateDoc(docRef, {
        status: updated.status,
        guests: updated.guests,
        confirmed_count: updated.confirmed_count,
        notes: updated.notes,
        updated_at: updated.updated_at,
      });
    } catch (err) {
      console.error('Erro ao atualizar RSVP no Firestore:', err);
    }
  }

  const all = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
  const idx = all.findIndex((i) => i.id === token);
  if (idx !== -1) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  setLS(LS_KEYS.INVITES, all);

  return updated;
}

export async function saveInvite(inviteData: Partial<Invite>): Promise<Invite> {
  const all = await getAllInvites();
  
  const id = inviteData.id || generateInviteToken(inviteData.head_name || 'convidado');
  
  const newInvite: Invite = {
    id,
    head_name: inviteData.head_name || '',
    phone: inviteData.phone || '',
    max_guests: inviteData.max_guests || 1,
    status: inviteData.status || 'pending',
    confirmed_count: inviteData.confirmed_count || 0,
    table_id: inviteData.table_id || null,
    checked_in: inviteData.checked_in || false,
    updated_at: new Date().toISOString(),
    guests: inviteData.guests || [],
    notes: inviteData.notes || '',
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'invites', id), newInvite);
    } catch (err) {
      console.error('Erro ao salvar convite no Firestore:', err);
    }
  }

  const existingIdx = all.findIndex((i) => i.id === id);
  if (existingIdx !== -1) {
    all[existingIdx] = newInvite;
  } else {
    all.push(newInvite);
  }
  setLS(LS_KEYS.INVITES, all);

  return newInvite;
}

export async function bulkImportInvites(
  rows: Array<{ head_name: string; phone: string; max_guests: number }>
): Promise<Invite[]> {
  const currentInvites = await getAllInvites();
  const createdInvites: Invite[] = [];

  for (const row of rows) {
    const token = generateInviteToken(row.head_name);
    const newInvite: Invite = {
      id: token,
      head_name: row.head_name,
      phone: row.phone,
      max_guests: row.max_guests || 1,
      status: 'pending',
      confirmed_count: 0,
      table_id: null,
      checked_in: false,
      updated_at: new Date().toISOString(),
      guests: [],
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'invites', token), newInvite);
      } catch (err) {
        console.error('Erro no import Firestore:', err);
      }
    }
    createdInvites.push(newInvite);
  }

  const updatedAll = [...currentInvites, ...createdInvites];
  setLS(LS_KEYS.INVITES, updatedAll);

  return createdInvites;
}

export async function deleteInvite(token: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'invites', token));
    } catch (err) {
      console.error('Erro ao deletar convite no Firestore:', err);
    }
  }
  const all = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
  const filtered = all.filter((i) => i.id !== token);
  setLS(LS_KEYS.INVITES, filtered);
}

export async function toggleCheckin(token: string, checkedIn: boolean): Promise<void> {
  const all = await getAllInvites();
  const invite = all.find((i) => i.id === token);
  if (!invite) return;

  invite.checked_in = checkedIn;
  invite.checked_in_at = checkedIn ? new Date().toISOString() : null;

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'invites', token), {
        checked_in: checkedIn,
        checked_in_at: invite.checked_in_at,
      });
    } catch (err) {
      console.error('Erro ao atualizar checkin no Firestore:', err);
    }
  }

  setLS(LS_KEYS.INVITES, all);
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
  return getLS(LS_KEYS.TABLES, INITIAL_TABLES);
}

export async function saveTable(tableData: Table): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'tables', tableData.id), tableData);
    } catch (err) {
      console.error('Erro ao salvar mesa no Firestore:', err);
    }
  }
  const tables = getLS<Table[]>(LS_KEYS.TABLES, INITIAL_TABLES);
  const idx = tables.findIndex((t) => t.id === tableData.id);
  if (idx !== -1) {
    tables[idx] = tableData;
  } else {
    tables.push(tableData);
  }
  setLS(LS_KEYS.TABLES, tables);
}

export async function deleteTable(id: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (err) {
      console.error('Erro ao deletar mesa no Firestore:', err);
    }
  }
  const tables = getLS<Table[]>(LS_KEYS.TABLES, INITIAL_TABLES);
  const filtered = tables.filter((t) => t.id !== id);
  setLS(LS_KEYS.TABLES, filtered);
}
