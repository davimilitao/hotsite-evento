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
  admin_pin: '4040',
  birthday_person_pin: '1986',
  assessor_pin: '2026',
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

export const DEFAULT_TABLE_POSITIONS: Record<string, { x: number; y: number }> = {
  // Mesas da Esquerda (1 a 6) - Alinhadas a x: 17.0%
  'mesa-01': { x: 17.0, y: 17.5 },
  'mesa-02': { x: 17.0, y: 29.5 },
  'mesa-03': { x: 17.0, y: 41.5 },
  'mesa-04': { x: 17.0, y: 53.5 },
  'mesa-05': { x: 17.0, y: 65.5 },
  'mesa-06': { x: 17.0, y: 77.5 },
  // Mesas da Direita (7 a 11) - Alinhadas a x: 83.5%
  'mesa-07': { x: 83.5, y: 21.5 },
  'mesa-08': { x: 83.5, y: 35.0 },
  'mesa-09': { x: 83.5, y: 48.5 },
  'mesa-10': { x: 83.5, y: 62.0 },
  'mesa-11': { x: 83.5, y: 75.5 },
  'mesa-12': { x: 83.5, y: 86.5 },
};

export function getTablePosition(table: Table, index: number): { x: number; y: number } {
  const nameLower = (table.name || '').toLowerCase();

  // Mapeamento Inteligente por Nome da Mesa (ex: "01 á esquerda", "02 á direita")
  if (nameLower.includes('01') && (nameLower.includes('esq') || nameLower.includes('seppi'))) return { x: 17.0, y: 17.5 };
  if (nameLower.includes('02') && (nameLower.includes('esq') || nameLower.includes('infân'))) return { x: 17.0, y: 29.5 };
  if (nameLower.includes('03') && (nameLower.includes('esq') || nameLower.includes('trabalho'))) return { x: 17.0, y: 41.5 };
  if (nameLower.includes('04') && (nameLower.includes('esq') || nameLower.includes('expandida'))) return { x: 17.0, y: 53.5 };
  if (nameLower.includes('05') && (nameLower.includes('esq') || nameLower.includes('hóspedes'))) return { x: 17.0, y: 65.5 };
  if (nameLower.includes('06') && (nameLower.includes('esq') || nameLower.includes('primos'))) return { x: 17.0, y: 77.5 };

  if (nameLower.includes('01') && nameLower.includes('dir')) return { x: 83.5, y: 21.5 };
  if (nameLower.includes('02') && nameLower.includes('dir')) return { x: 83.5, y: 35.0 };
  if (nameLower.includes('03') && nameLower.includes('dir')) return { x: 83.5, y: 48.5 };
  if (nameLower.includes('04') && nameLower.includes('dir')) return { x: 83.5, y: 62.0 };
  if (nameLower.includes('05') && nameLower.includes('dir')) return { x: 83.5, y: 75.5 };

  // Mapeamento por ID padrão se existir
  if (DEFAULT_TABLE_POSITIONS[table.id]) {
    return DEFAULT_TABLE_POSITIONS[table.id];
  }

  // Fallback por índice se for uma mesa customizada nova
  const isLeft = nameLower.includes('esq') || index < 6;
  const row = isLeft ? index % 6 : (index - 6) % 6;

  return {
    x: isLeft ? 17.0 : 83.5,
    y: isLeft ? 17.5 + row * 12.0 : 21.5 + row * 13.5,
  };
}

export const INITIAL_TABLES: Table[] = [
  { id: 'mesa-01', name: 'Mesa 01 - Família Seppi', capacity: 8, shape: 'round', description: 'Esquerda (Topo - Próxima aos Banheiros)', position: { x: 17.0, y: 17.5 } },
  { id: 'mesa-02', name: 'Mesa 02 - Amigos de Infância', capacity: 8, shape: 'round', description: 'Esquerda (Superior)', position: { x: 17.0, y: 29.5 } },
  { id: 'mesa-03', name: 'Mesa 03 - Colegas de Trabalho', capacity: 8, shape: 'round', description: 'Esquerda (Centro-Alto)', position: { x: 17.0, y: 41.5 } },
  { id: 'mesa-04', name: 'Mesa 04 - Família Expandida', capacity: 8, shape: 'round', description: 'Esquerda (Centro-Baixo)', position: { x: 17.0, y: 53.5 } },
  { id: 'mesa-05', name: 'Mesa 05 - Hóspedes & Viagem', capacity: 8, shape: 'round', description: 'Esquerda (Inferior - Próxima Pista)', position: { x: 17.0, y: 65.5 } },
  { id: 'mesa-06', name: 'Mesa 06 - Primos & Família', capacity: 8, shape: 'round', description: 'Esquerda (Base - Próxima Escada)', position: { x: 17.0, y: 77.5 } },
  { id: 'mesa-07', name: 'Mesa 07 - Convidado Especial', capacity: 8, shape: 'round', description: 'Direita (Topo)', position: { x: 83.5, y: 21.5 } },
  { id: 'mesa-08', name: 'Mesa 08 - Amigos Próximos', capacity: 8, shape: 'round', description: 'Direita (Superior)', position: { x: 83.5, y: 35.0 } },
  { id: 'mesa-09', name: 'Mesa 09 - Família Amigos', capacity: 8, shape: 'round', description: 'Direita (Centro)', position: { x: 83.5, y: 48.5 } },
  { id: 'mesa-10', name: 'Mesa 10 - Amigos & Acompanhantes', capacity: 8, shape: 'round', description: 'Direita (Inferior)', position: { x: 83.5, y: 62.0 } },
  { id: 'mesa-11', name: 'Mesa 11 - Setor Recepção', capacity: 8, shape: 'round', description: 'Direita (Base)', position: { x: 83.5, y: 75.5 } },
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
        special_role: person.special_role || 'guest',
        counts_towards_buffet: person.counts_towards_buffet ?? (person.special_role ? person.special_role === 'guest' : true),
        special_arrival_time: person.special_arrival_time || '',
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
      special_role: person.special_role || 'guest',
      counts_towards_buffet: person.counts_towards_buffet ?? (person.special_role ? person.special_role === 'guest' : true),
      special_arrival_time: person.special_arrival_time || '',
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

  const invites = await getAllInvites();
  for (const inv of invites) {
    if (inv.head_person_id === id) {
      await deleteInvite(inv.id);
    } else if (inv.companion_person_ids?.includes(id)) {
      const updatedCompanions = inv.companion_person_ids.filter((cId) => cId !== id);
      await saveInvite({
        ...inv,
        companion_person_ids: updatedCompanions,
        max_guests: 1 + updatedCompanions.length,
      });
    }
  }

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
    } catch (err) {
      console.warn('Erro ao ler Firestore event_config, usando fallback:', err);
    }
  }

  const cached = getLS<EventConfig>(LS_KEYS.CONFIG, INITIAL_EVENT_CONFIG);
  if (cached) {
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

/**
 * Deduplica e limpa convites duplicados/órfãos globalmente.
 * Garante no máximo 1 convite ativo por pessoa (head_person_id ou head_name).
 */
export function deduplicateInvitesList(invites: Invite[]): Invite[] {
  if (!invites || invites.length === 0) return [];

  let persons: Person[] = [];
  if (typeof window !== 'undefined') {
    try {
      const cachedPersons = localStorage.getItem(LS_KEYS.PERSONS);
      if (cachedPersons) persons = JSON.parse(cachedPersons);
    } catch {}
  }
  if (!persons || persons.length === 0) {
    persons = INITIAL_PERSONS;
  }

  // Helper para resolver a pessoa física (Person.id) a partir do head_person_id ou head_name
  const resolvePersonId = (inv: Invite): string => {
    if (inv.head_person_id) {
      const p = persons.find((person) => person.id === inv.head_person_id);
      if (p) return p.id;
    }
    if (inv.head_name) {
      const norm = inv.head_name.trim().toLowerCase();
      const p = persons.find((person) => person.name.trim().toLowerCase() === norm);
      if (p) return p.id;
      return `name:${norm}`;
    }
    return `id:${inv.id}`;
  };

  // 1. Identifica IDs de pessoas que atuam como acompanhantes em algum convite de família
  const companionPersonIds = new Set<string>();
  for (const inv of invites) {
    if (inv.companion_person_ids && inv.companion_person_ids.length > 0) {
      inv.companion_person_ids.forEach((id) => companionPersonIds.add(id));
    }
  }

  // 2. Filtra convites cujos titulares sejam na verdade acompanhantes em outro convite ativo de família
  const activeInvites = invites.filter((inv) => {
    const pId = resolvePersonId(inv);
    if (pId && !pId.startsWith('name:') && !pId.startsWith('id:') && companionPersonIds.has(pId)) {
      return false;
    }
    return true;
  });

  // 3. Agrupa por Person.id resolvido
  const groupMap = new Map<string, Invite[]>();

  for (const inv of activeInvites) {
    const key = resolvePersonId(inv);
    const existing = groupMap.get(key) || [];
    existing.push(inv);
    groupMap.set(key, existing);
  }

  const result: Invite[] = [];

  for (const [, group] of groupMap.entries()) {
    if (group.length === 1) {
      const single = { ...group[0] };
      const pId = resolvePersonId(single);
      if (pId && !pId.startsWith('name:') && !pId.startsWith('id:')) {
        single.head_person_id = pId;
      }
      result.push(single);
    } else {
      const scored = group.map((inv) => {
        let score = 0;

        if (persons.some((p) => p.invite_id === inv.id)) {
          score += 100;
        }
        if (inv.sent_status === 'sent') {
          score += 50;
        }
        if (inv.status && inv.status !== 'pending') {
          score += 30;
        }
        if (inv.phone && inv.phone.trim().length >= 8) {
          score += 20;
        }
        if (inv.table_id) {
          score += 10;
        }
        if (inv.companion_person_ids && inv.companion_person_ids.length > 0) {
          score += 10;
        }
        const time = inv.updated_at ? new Date(inv.updated_at).getTime() : inv.created_at ? new Date(inv.created_at).getTime() : 0;

        return { inv, score, time };
      });

      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.time - a.time;
      });

      const bestInvite = { ...scored[0].inv };
      const pId = resolvePersonId(bestInvite);
      if (pId && !pId.startsWith('name:') && !pId.startsWith('id:')) {
        bestInvite.head_person_id = pId;
      }
      result.push(bestInvite);
    }
  }

  return result;
}

export async function getAllInvites(): Promise<Invite[]> {
  let rawInvites: Invite[] = [];
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'invites'));
      rawInvites = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invite));
    } catch (err) {
      console.warn('Erro ao buscar convites no Firestore:', err);
      rawInvites = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
    }
  } else {
    rawInvites = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
  }

  const deduplicated = deduplicateInvitesList(rawInvites);

  if (deduplicated.length < rawInvites.length) {
    const removedIds = rawInvites
      .filter((raw) => !deduplicated.some((d) => d.id === raw.id))
      .map((i) => i.id);

    setLS(LS_KEYS.INVITES, deduplicated);

    if (isFirebaseConfigured) {
      for (const remId of removedIds) {
        try {
          await deleteDoc(doc(db, 'invites', remId));
        } catch (e) {
          console.warn(`Erro ao deletar convite duplicado ${remId} do Firestore:`, e);
        }
      }
    }
  }

  return deduplicated;
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

  const invites = await getAllInvites();
  return invites.find((i) => i.id === token) || null;
}

function createFullInvite(id: string, invite: Partial<Invite>): Invite {
  return {
    id,
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
    special_role: invite.special_role || 'guest',
    counts_towards_buffet: invite.counts_towards_buffet ?? (invite.special_role ? invite.special_role === 'guest' : true),
    special_arrival_time: invite.special_arrival_time || '',
    custom_whatsapp_message: invite.custom_whatsapp_message || '',
  };
}

export async function saveInvite(invite: Partial<Invite> & { id?: string }): Promise<Invite> {
  let invites = await getAllInvites();
  let targetId = invite.id;

  // Se ID não foi fornecido, buscar se já existe convite para esta pessoa (head_person_id ou head_name)
  if (!targetId) {
    const persons = await getAllPersons();
    if (invite.head_person_id) {
      const personObj = persons.find((p) => p.id === invite.head_person_id);
      if (personObj && personObj.invite_id) {
        targetId = personObj.invite_id;
      }
      if (!targetId) {
        const existing = invites.find((i) => i.head_person_id === invite.head_person_id);
        if (existing) targetId = existing.id;
      }
    }
    if (!targetId && invite.head_name) {
      const normName = invite.head_name.trim().toLowerCase();
      const personObj = persons.find((p) => p.name.trim().toLowerCase() === normName);
      if (personObj && personObj.invite_id) {
        targetId = personObj.invite_id;
      }
      if (!targetId) {
        const existing = invites.find((i) => i.head_name.trim().toLowerCase() === normName);
        if (existing) targetId = existing.id;
      }
    }
  }

  // Tenta vincular head_person_id se não fornecido
  const persons = await getAllPersons();
  let headPersonId = invite.head_person_id;
  if (!headPersonId && invite.head_name) {
    const matchPerson = persons.find((p) => p.name.trim().toLowerCase() === invite.head_name?.trim().toLowerCase());
    if (matchPerson) {
      headPersonId = matchPerson.id;
    }
  }

  // Se acompanhantes foram definidos, remove convites individuais onde esses acompanhantes eram titulares
  if (invite.companion_person_ids && invite.companion_person_ids.length > 0) {
    const companionSet = new Set(invite.companion_person_ids);
    const obsoleteInvites = invites.filter((i) => i.head_person_id && companionSet.has(i.head_person_id));
    for (const obs of obsoleteInvites) {
      if (obs.id !== targetId) {
        invites = invites.filter((i) => i.id !== obs.id);
        if (isFirebaseConfigured) {
          try {
            await deleteDoc(doc(db, 'invites', obs.id));
          } catch (e) {}
        }
      }
    }
  }

  let fullInvite: Invite;

  if (targetId) {
    const existingIndex = invites.findIndex((i) => i.id === targetId);
    if (existingIndex >= 0) {
      const existing = invites[existingIndex];
      fullInvite = {
        ...existing,
        ...invite,
        id: targetId,
        head_person_id: headPersonId || existing.head_person_id,
        head_name: invite.head_name || existing.head_name,
        updated_at: new Date().toISOString(),
      };
      invites[existingIndex] = fullInvite;
    } else {
      fullInvite = createFullInvite(targetId, { ...invite, head_person_id: headPersonId });
      invites.push(fullInvite);
    }
  } else {
    const newToken = generateInviteToken(invite.head_name || 'Convidado');
    fullInvite = createFullInvite(newToken, { ...invite, head_person_id: headPersonId });
    invites.push(fullInvite);
  }

  // Sincroniza os objetos Person envolvidos
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
        special_role: fullInvite.special_role,
        counts_towards_buffet: fullInvite.counts_towards_buffet,
        special_arrival_time: fullInvite.special_arrival_time,
      });
    } else if (fullInvite.companion_person_ids?.includes(person.id)) {
      await savePerson({
        ...person,
        invite_id: fullInvite.id,
        role_in_invite: 'companion',
        special_role: fullInvite.special_role,
        counts_towards_buffet: fullInvite.counts_towards_buffet,
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
  const targetInvite = invites.find((i) => i.id === id);
  const filtered = invites.filter((i) => i.id !== id);

  // Desvincula as pessoas associadas a este convite
  const persons = await getAllPersons();
  for (const person of persons) {
    if (
      person.invite_id === id ||
      targetInvite?.head_person_id === person.id ||
      (targetInvite?.companion_person_ids && targetInvite.companion_person_ids.includes(person.id))
    ) {
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

/**
 * Zera todos os convites criados, envios de WhatsApp e presenças confirmadas de teste.
 * Mantém a lista máster de 119 pessoas e suas alocações nas mesas intactas.
 */
export async function resetAllInvitesData(): Promise<void> {
  const invites = await getAllInvites();
  if (isFirebaseConfigured) {
    for (const inv of invites) {
      try {
        await deleteDoc(doc(db, 'invites', inv.id));
      } catch (err) {
        console.warn(`Erro ao deletar convite ${inv.id} do Firestore:`, err);
      }
    }
  }
  setLS(LS_KEYS.INVITES, []);

  const persons = await getAllPersons();
  const resetPersons: Person[] = persons.map((p) => ({
    ...p,
    invite_id: null,
    role_in_invite: null,
  }));

  if (isFirebaseConfigured) {
    for (const person of resetPersons) {
      try {
        await setDoc(doc(db, 'persons', person.id), person);
      } catch (err) {
        console.warn(`Erro ao atualizar pessoa ${person.id} no Firestore:`, err);
      }
    }
  }

  setLS(LS_KEYS.PERSONS, resetPersons);
}



