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
import { Invite, Table, EventConfig, Guest, InviteStatus, InviteTier, Person } from '@/types';
import { generateInviteToken } from './utils';

// Dados Reais da Festa de Fernanda Seppi (40 Anos) com Tema Claro Aquarelado
export const INITIAL_EVENT_CONFIG: EventConfig = {
  title: 'Fernanda Seppi - 40 Anos 🌸✨',
  birthday_person: 'Fernanda Seppi',
  age_celebrating: 40,
  date_time: '2026-11-07T17:00:00.000Z',
  deadline_rsvp: '2026-10-25T23:59:59.000Z',
  buffet_capacity: 100, // Limite de 100 vagas no buffet
  child_free_max_age: 5, // Crianças de 0 a 5 anos são isentas no buffet
  child_half_max_age: 11, // Crianças de 6 a 11 anos pagam meia-entrada
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
  { id: 'mesa-06', name: 'Mesa 06 - Primos & Família', capacity: 8, shape: 'round', description: 'Setor VIP' },
  { id: 'mesa-07', name: 'Mesa 07 - Convidado Especial', capacity: 8, shape: 'round', description: 'Próxima ao palco' },
  { id: 'mesa-08', name: 'Mesa 08 - Amigos Próximos', capacity: 8, shape: 'round', description: 'Setor da varanda' },
];

const RAW_GUEST_NAMES = [
  'CARLOS BENEDICTO FRANQUI',
  'PAULO DANTAS BARRETO',
  'SANDRA CRISTINA FRANQUI BARRETO',
  'NATÁLIA FRANQUI BARRETO',
  'VINICIUS FRANQUI BARRETO',
  'CAROLINA PUGLIESI',
  'MARÍLIA ALEXANDRE',
  'EMILY FRANQUI FANTI',
  'LUCIA DOMINGOS',
  'PATRICIA DOMINGOS',
  'EDUARDO',
  'FLAVIO DOMINGOS',
  'ROSE',
  'LETÍCIA',
  'ANDERSON',
  'ANA',
  'JUNIOR',
  'MARIO VIDAL',
  'VERA VIDAL',
  'FELIPE VIDAL',
  'LUANA',
  'DANILO FERRAZ',
  'VANESSA ARAUJO VIDAL',
  'VERA',
  'CÍNTIA VIDAL',
  'NAMORADO',
  'DANIELE CORDEIRO DA LUZ',
  'FELIPE',
  'SERGIO BASSO',
  'MONIQUE BASSO',
  'ELIZABETH ALVES',
  'RONI',
  'ELOYSE MOTTA',
  'LETÍCIA',
  'MICHELI LUZ',
  'JUNIOR',
  'RITA LUZ',
  'ISABELLE',
  'IGOR',
  'FERNANDA',
  'NADINHO',
  'SARA',
  'NÁDIA',
  'MORANGUINHO',
  'TALITA',
  'RUAN',
  'BIRO',
  'PAULA',
  'LELEO',
  'LILIANE',
  'DANIELE CORDEIRO DA LUZ',
  'DANIEL',
  'JÉSSIKA',
  'GUSTAVO',
  'ESPOSA',
  'DAITON',
  'JULIA',
  'DÉLIO',
  'ANA',
  'DENIS',
  'SIMONE',
  'WILLIAM',
  'ARIANE',
  'MARCEL',
  'ALINE',
  'LUNA',
  'LARA',
  'RAMON',
  'FLÁVIA',
  'FABIO',
  'RAFA',
  'NAMORADO',
  'ELYANE',
  'ALEX',
  'BRUNA',
  'RODRIGO',
  'CAMILA',
  'WILLIAM',
  'LORENA',
  'NAMORADO',
  'LÉTICIA',
  'FERNANDO',
  'MELINA',
  'CAROL',
  'PATY',
  'MARIDO',
  'GUGA',
  'IZABEL',
  'FELIPE',
  'HENRIQUE',
  'BOLÃO',
  'MONICA',
  'NÊ',
  'TORELLI',
  'PAULA',
  'CLAUDIO',
  'JANILENE',
  'MILENA',
  'MAIRA',
  'RUAN',
  'ROSE',
  'MARIDO',
  'FABIANA',
  'LUNA',
  'VIVI',
  'MARIDO',
  'ELI',
  'CASA GRANDE',
  'FILHOS',
  'DAVI',
  'FE',
  'MARI',
  'TIA ERCILIA',
  'LIGIA',
  'LILIAN',
  'FABINHO',
  'VIVIAN',
  'DIEGO',
  'YASMIM',
];

// Lista Máster de 119 Pessoas Físicas (1:1 com os assentos)
export const INITIAL_PERSONS: Person[] = RAW_GUEST_NAMES.map((name, index) => ({
  id: `person-${index + 1}`,
  name: name,
  phone: '',
  type: 'adult',
  table_id: null,
  seat_number: null,
  invite_id: null,
  role_in_invite: null,
}));

export const INITIAL_INVITES: Invite[] = [];

// Chaves do LocalStorage v8 (1:1 Pessoas vs Assentos e Convites Agrupados)
const LS_KEYS = {
  CONFIG: 'festa_config_v8',
  TABLES: 'festa_tables_v8',
  PERSONS: 'festa_persons_v8_1to1',
  INVITES: 'festa_invites_v8_grouped',
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
 * Popula o banco de dados do Firestore com os dados de 119 pessoas reais de Fernanda Seppi
 */
export async function seedFirestoreData(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear();
    } catch {}
    setLS(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
    setLS(LS_KEYS.TABLES, INITIAL_TABLES);
    setLS(LS_KEYS.PERSONS, INITIAL_PERSONS);
    setLS(LS_KEYS.INVITES, INITIAL_INVITES);
  }

  if (!isFirebaseConfigured) {
    return;
  }

  await setDoc(doc(db, 'event_config', 'settings'), INITIAL_EVENT_CONFIG);

  for (const table of INITIAL_TABLES) {
    await setDoc(doc(db, 'tables', table.id), table);
  }

  for (const person of INITIAL_PERSONS) {
    await setDoc(doc(db, 'persons', person.id), person);
  }
}

// ---- API DO BANCO DE DADOS PARA PESSOAS (1:1) ----

export async function getAllPersons(): Promise<Person[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'persons'));
      if (!snap.empty && snap.docs.length >= 50) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
      } else {
        console.log('Populando Firestore com as 119 pessoas físicas...');
        for (const person of INITIAL_PERSONS) {
          await setDoc(doc(db, 'persons', person.id), person);
        }
        setLS(LS_KEYS.PERSONS, INITIAL_PERSONS);
        return INITIAL_PERSONS;
      }
    } catch (err) {
      console.warn('Erro ao buscar pessoas no Firestore:', err);
    }
  }

  const cached = getLS<Person[]>(LS_KEYS.PERSONS, INITIAL_PERSONS);
  if (!cached || cached.length < 50) {
    setLS(LS_KEYS.PERSONS, INITIAL_PERSONS);
    return INITIAL_PERSONS;
  }

  return cached;
}

export async function savePerson(person: Partial<Person> & { id?: string }): Promise<Person> {
  const persons = await getAllPersons();
  let fullPerson: Person;

  if (person.id) {
    const existingIndex = persons.findIndex((p) => p.id === person.id);
    if (existingIndex >= 0) {
      fullPerson = { ...persons[existingIndex], ...person };
      persons[existingIndex] = fullPerson;
    } else {
      fullPerson = {
        id: person.id,
        name: person.name || 'Sem nome',
        phone: person.phone || '',
        type: person.type || 'adult',
        table_id: person.table_id || null,
        seat_number: person.seat_number ?? null,
        invite_id: person.invite_id || null,
        role_in_invite: person.role_in_invite || null,
        notes: person.notes || '',
      };
      persons.push(fullPerson);
    }
  } else {
    const newId = `person-${Date.now()}`;
    fullPerson = {
      id: newId,
      name: person.name || 'Sem nome',
      phone: person.phone || '',
      type: person.type || 'adult',
      table_id: person.table_id || null,
      seat_number: person.seat_number ?? null,
      invite_id: person.invite_id || null,
      role_in_invite: person.role_in_invite || null,
      notes: person.notes || '',
    };
    persons.push(fullPerson);
  }

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'persons', fullPerson.id), fullPerson);
    } catch (err) {
      console.error('Erro ao salvar pessoa no Firestore:', err);
    }
  }

  setLS(LS_KEYS.PERSONS, persons);
  return fullPerson;
}

export async function deletePerson(id: string): Promise<void> {
  const persons = await getAllPersons();
  const filtered = persons.filter((p) => p.id !== id);

  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'persons', id));
    } catch (err) {
      console.error('Erro ao deletar pessoa no Firestore:', err);
    }
  }

  setLS(LS_KEYS.PERSONS, filtered);
}

export async function assignPersonToSeat(personId: string, tableId: string, seatNumber: number): Promise<Person | null> {
  const person = (await getAllPersons()).find((p) => p.id === personId);
  if (!person) return null;

  return savePerson({
    ...person,
    table_id: tableId,
    seat_number: seatNumber,
  });
}

export async function unassignPersonSeat(personId: string): Promise<Person | null> {
  const person = (await getAllPersons()).find((p) => p.id === personId);
  if (!person) return null;

  // Se a pessoa estiver associada a um convite, precisamos verificar o impacto
  return savePerson({
    ...person,
    table_id: null,
    seat_number: null,
  });
}

// ---- API DO BANCO DE DADOS (CONFIG, CONVITES E MESAS) ----

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
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invite));
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
        invite_type: invite.invite_type || 'family',
        head_person_id: invite.head_person_id,
        companion_person_ids: invite.companion_person_ids || [],
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
      invite_type: invite.invite_type || 'family',
      head_person_id: invite.head_person_id,
      companion_person_ids: invite.companion_person_ids || [],
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

  // Sincroniza os objetos Person envolvidos
  const persons = await getAllPersons();
  const allInvolvedIds = new Set<string>();
  if (fullInvite.head_person_id) allInvolvedIds.add(fullInvite.head_person_id);
  if (fullInvite.companion_person_ids) {
    fullInvite.companion_person_ids.forEach((cId) => allInvolvedIds.add(cId));
  }

  for (const person of persons) {
    if (person.id === fullInvite.head_person_id) {
      await savePerson({
        ...person,
        invite_id: fullInvite.id,
        role_in_invite: 'head',
        phone: fullInvite.phone || person.phone,
      });
    } else if (fullInvite.companion_person_ids?.includes(person.id)) {
      await savePerson({
        ...person,
        invite_id: fullInvite.id,
        role_in_invite: 'companion',
      });
    } else if (person.invite_id === fullInvite.id && !allInvolvedIds.has(person.id)) {
      // Pessoa foi removida deste convite
      await savePerson({
        ...person,
        invite_id: null,
        role_in_invite: null,
      });
    }
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

  // Desvincula as pessoas associadas a este convite
  const persons = await getAllPersons();
  for (const person of persons) {
    if (person.invite_id === id) {
      await savePerson({
        ...person,
        invite_id: null,
        role_in_invite: null,
      });
    }
  }

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

  // Pessoas na mesa excluída têm table_id e seat_number limpos
  const persons = await getAllPersons();
  for (const p of persons) {
    if (p.table_id === id) {
      await savePerson({
        ...p,
        table_id: null,
        seat_number: null,
      });
    }
  }

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

export async function bulkImportInvites(
  rawInvites: Array<{ head_name: string; phone?: string; max_guests?: number; tier?: InviteTier }>
): Promise<number> {
  let count = 0;
  for (const item of rawInvites) {
    const cleanName = item.head_name ? item.head_name.trim() : '';
    if (cleanName) {
      // Cria a pessoa se não existir
      const persons = await getAllPersons();
      let person = persons.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
      if (!person) {
        person = await savePerson({
          name: cleanName,
          phone: item.phone ? item.phone.trim() : '',
          type: 'adult',
        });
      }
      count++;
    }
  }
  return count;
}



