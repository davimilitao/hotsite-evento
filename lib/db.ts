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
import { Invite, Table, EventConfig, Guest, InviteStatus, InviteTier, Person, RelationshipType, Relationship, ChildCategory, SurpriseCampaign } from '@/types';
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
  location_name: 'Buffet Estupendo',
  address: 'Rua Giacinto Tognato, 87 - Baeta Neves, São Bernardo do Campo - SP',
  maps_url: 'https://maps.google.com/?q=Rua+Giacinto+Tognato+87+Baeta+Neves+Sao+Bernardo+do+Campo',
  waze_url: 'https://waze.com/ul?q=Rua+Giacinto+Tognato+87+Baeta+Neves+Sao+Bernardo+do+Campo',
  location_website: 'https://buffetestupendo.com.br/',
  location_phone: '11999998888',
  location_video_url: '',
  location_photos: [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80',
  ],
  location_about: 'Fundado com a missão de eternizar momentos únicos, o Buffet Estupendo oferece alta gastronomia artesanal e infraestrutura completa no ABC Paulista. Com salão climatizado, iluminação cênica, espaço lounge e equipe especializada, proporciona uma experiência inesquecível para todos os convidados.',
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
  support_email: 'militao46@gmail.com',
  admin_cc_email: 'militao46@gmail.com',
  support_phone: '11999998888',
  developer_credits: 'Desenvolvido com carinho para Fernanda Seppi',
  theme: {
    preset: 'lavender_floral',
    invite_mode: 'custom', // 'off' | 'upload' | 'custom'
    uploaded_invite_url: '',
    primary_color: '#6d44e4', // Violeta Vibrante do Tema Pinterest
    accent_color: '#c5a059',  // Dourado Elegante
    bg_color: '#f7f4fc',      // Lilás Marfim Suave Iluminado
    card_bg_color: '#ffffff', // Branco Puro para os Cards
    text_color: '#1e152d',    // Violeta Profundo Escuro Legível
    font_family: 'sans',
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
  // Fileira Superior (Topo: Mesas 5, 4, 3, 2, 1 da esquerda para a direita)
  'mesa-05': { x: 13.5, y: 17.0 },
  'mesa-04': { x: 27.5, y: 17.0 },
  'mesa-03': { x: 41.5, y: 17.0 },
  'mesa-02': { x: 55.5, y: 17.0 },
  'mesa-01': { x: 69.5, y: 17.0 },

  // Setor Central (Meio: Mesas 7 e 6)
  'mesa-07': { x: 26.5, y: 65.0 },
  'mesa-06': { x: 41.5, y: 65.0 },

  // Fileira Inferior (Base: Mesas 11, 10, 9, 8 da esquerda para a direita)
  'mesa-11': { x: 14.5, y: 83.0 },
  'mesa-10': { x: 30.5, y: 83.0 },
  'mesa-09': { x: 46.5, y: 83.0 },
  'mesa-08': { x: 62.5, y: 83.0 },
};

export function getTablePosition(table: Table, index: number): { x: number; y: number } {
  if (!table) return { x: 50, y: 50 };

  const nameLower = (table.name || '').toLowerCase();
  const idLower = (table.id || '').toLowerCase();

  // Coordenadas das 11 Mesas Físicas na Arte do Salão
  const POS_MESA_1  = { x: 69.5, y: 17.0 }; // Topo Direita
  const POS_MESA_2  = { x: 55.5, y: 17.0 }; // Topo Centro-Direita
  const POS_MESA_3  = { x: 41.5, y: 17.0 }; // Topo Centro
  const POS_MESA_4  = { x: 27.5, y: 17.0 }; // Topo Centro-Esquerda
  const POS_MESA_5  = { x: 13.5, y: 17.0 }; // Topo Esquerda
  const POS_MESA_6  = { x: 41.5, y: 65.0 }; // Centro Direita
  const POS_MESA_7  = { x: 26.5, y: 65.0 }; // Centro Esquerda
  const POS_MESA_8  = { x: 62.5, y: 83.0 }; // Base Direita
  const POS_MESA_9  = { x: 46.5, y: 83.0 }; // Base Centro-Direita
  const POS_MESA_10 = { x: 30.5, y: 83.0 }; // Base Centro-Esquerda
  const POS_MESA_11 = { x: 14.5, y: 83.0 }; // Base Esquerda

  // 1. Nomenclatura Histórica do Evento ("01 á esquerda", "01 á direita", etc.)
  if (nameLower.includes('dir') || nameLower.includes('direita')) {
    if (nameLower.includes('01') || nameLower.includes('1')) return POS_MESA_7;
    if (nameLower.includes('02') || nameLower.includes('2')) return POS_MESA_8;
    if (nameLower.includes('03') || nameLower.includes('3')) return POS_MESA_9;
    if (nameLower.includes('04') || nameLower.includes('4')) return POS_MESA_10;
    if (nameLower.includes('05') || nameLower.includes('5')) return POS_MESA_11;
  }

  if (nameLower.includes('esq') || nameLower.includes('esquerda')) {
    if (nameLower.includes('01') || nameLower.includes('1')) return POS_MESA_1;
    if (nameLower.includes('02') || nameLower.includes('2')) return POS_MESA_2;
    if (nameLower.includes('03') || nameLower.includes('3')) return POS_MESA_3;
    if (nameLower.includes('04') || nameLower.includes('4')) return POS_MESA_4;
    if (nameLower.includes('05') || nameLower.includes('5')) return POS_MESA_5;
    if (nameLower.includes('06') || nameLower.includes('6')) return POS_MESA_6;
  }

  // 2. Mapeamento Direto por ID (mesa-01 a mesa-11)
  if (idLower.includes('mesa-01') || idLower === 'mesa-1') return POS_MESA_1;
  if (idLower.includes('mesa-02') || idLower === 'mesa-2') return POS_MESA_2;
  if (idLower.includes('mesa-03') || idLower === 'mesa-3') return POS_MESA_3;
  if (idLower.includes('mesa-04') || idLower === 'mesa-4') return POS_MESA_4;
  if (idLower.includes('mesa-05') || idLower === 'mesa-5') return POS_MESA_5;
  if (idLower.includes('mesa-06') || idLower === 'mesa-6') return POS_MESA_6;
  if (idLower.includes('mesa-07') || idLower === 'mesa-7') return POS_MESA_7;
  if (idLower.includes('mesa-08') || idLower === 'mesa-8') return POS_MESA_8;
  if (idLower.includes('mesa-09') || idLower === 'mesa-9') return POS_MESA_9;
  if (idLower.includes('mesa-10')) return POS_MESA_10;
  if (idLower.includes('mesa-11')) return POS_MESA_11;

  // 3. Mapeamento por Número Absoluto no Nome (1 a 11)
  const numMatch = (table.name || '').match(/\d+/)?.[0];
  if (numMatch) {
    const num = parseInt(numMatch, 10);
    if (num === 1) return POS_MESA_1;
    if (num === 2) return POS_MESA_2;
    if (num === 3) return POS_MESA_3;
    if (num === 4) return POS_MESA_4;
    if (num === 5) return POS_MESA_5;
    if (num === 6) return POS_MESA_6;
    if (num === 7) return POS_MESA_7;
    if (num === 8) return POS_MESA_8;
    if (num === 9) return POS_MESA_9;
    if (num === 10) return POS_MESA_10;
    if (num === 11) return POS_MESA_11;
  }

  // 4. Fallback por Índice Cíclico
  const fallbackList = [
    POS_MESA_1,
    POS_MESA_2,
    POS_MESA_3,
    POS_MESA_4,
    POS_MESA_5,
    POS_MESA_6,
    POS_MESA_7,
    POS_MESA_8,
    POS_MESA_9,
    POS_MESA_10,
    POS_MESA_11,
  ];

  return fallbackList[index % fallbackList.length];
}

export const INITIAL_TABLES: Table[] = [
  { id: 'mesa-01', name: 'Mesa 01 - Família Seppi', capacity: 8, shape: 'round', description: 'Topo Direita (Próxima à Mesa do Bolo)', position: { x: 69.5, y: 17.0 } },
  { id: 'mesa-02', name: 'Mesa 02 - Amigos de Infância', capacity: 8, shape: 'round', description: 'Topo Centro-Direita', position: { x: 55.5, y: 17.0 } },
  { id: 'mesa-03', name: 'Mesa 03 - Colegas de Trabalho', capacity: 8, shape: 'round', description: 'Topo Centro', position: { x: 41.5, y: 17.0 } },
  { id: 'mesa-04', name: 'Mesa 04 - Família Expandida', capacity: 8, shape: 'round', description: 'Topo Centro-Esquerda', position: { x: 27.5, y: 17.0 } },
  { id: 'mesa-05', name: 'Mesa 05 - Hóspedes & Viagem', capacity: 8, shape: 'round', description: 'Topo Esquerda', position: { x: 13.5, y: 17.0 } },
  { id: 'mesa-06', name: 'Mesa 06 - Primos & Família', capacity: 8, shape: 'round', description: 'Centro-Direita', position: { x: 41.5, y: 65.0 } },
  { id: 'mesa-07', name: 'Mesa 07 - Convidado Especial', capacity: 8, shape: 'round', description: 'Centro-Esquerda', position: { x: 26.5, y: 65.0 } },
  { id: 'mesa-08', name: 'Mesa 08 - Amigos Próximos', capacity: 8, shape: 'round', description: 'Base Direita (Próxima à Mesa do Café)', position: { x: 62.5, y: 83.0 } },
  { id: 'mesa-09', name: 'Mesa 09 - Família Amigos', capacity: 8, shape: 'round', description: 'Base Centro-Direita', position: { x: 46.5, y: 83.0 } },
  { id: 'mesa-10', name: 'Mesa 10 - Amigos & Acompanhantes', capacity: 8, shape: 'round', description: 'Base Centro-Esquerda', position: { x: 30.5, y: 83.0 } },
  { id: 'mesa-11', name: 'Mesa 11 - Setor Recepção', capacity: 8, shape: 'round', description: 'Base Esquerda', position: { x: 14.5, y: 83.0 } },
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
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
      } else {
        console.log('Populando Firestore com as pessoas físicas iniciais...');
        for (const person of INITIAL_PERSONS) {
          await setDoc(doc(db, 'persons', person.id), cleanUndefinedForFirestore(person));
        }
        setLS(LS_KEYS.PERSONS, INITIAL_PERSONS);
        return INITIAL_PERSONS;
      }
    } catch (err) {
      console.warn('Erro ao buscar pessoas no Firestore:', err);
    }
  }

  const cached = getLS<Person[]>(LS_KEYS.PERSONS, INITIAL_PERSONS);
  if (cached && cached.length > 0) {
    return cached;
  }

  setLS(LS_KEYS.PERSONS, INITIAL_PERSONS);
  return INITIAL_PERSONS;
}

export function calculateChildCategory(age?: number, config?: EventConfig): ChildCategory {
  if (age === undefined || age === null || age >= 12) {
    return 'inteira';
  }
  const freeMax = config?.child_free_max_age ?? 5;
  const halfMax = config?.child_half_max_age ?? 11;
  if (age <= freeMax) return 'isento';
  if (age <= halfMax) return 'meia';
  return 'inteira';
}

export function getInverseRelationshipType(relType: RelationshipType): RelationshipType {
  switch (relType) {
    case 'spouse': return 'spouse';
    case 'child': return 'parent';
    case 'parent': return 'child';
    case 'sibling': return 'sibling';
    case 'relative': return 'relative';
    case 'friend': return 'friend';
    default: return 'relative';
  }
}

function cleanUndefinedForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean as T;
}

export async function savePerson(person: Partial<Person> & { id?: string }): Promise<Person> {
  const persons = await getAllPersons();
  let fullPerson: Person;

  if (person.id) {
    const existingIndex = persons.findIndex((p) => p.id === person.id);
    if (existingIndex >= 0) {
      const existing = persons[existingIndex];
      fullPerson = {
        ...existing,
        ...person,
        age: person.age !== undefined ? person.age : existing.age,
        child_category: person.child_category !== undefined ? person.child_category : existing.child_category,
        family_id: person.family_id !== undefined ? person.family_id : existing.family_id,
        family_name: person.family_name !== undefined ? person.family_name : existing.family_name,
        relationships: person.relationships !== undefined ? person.relationships : (existing.relationships || []),
        phone_responsible_person_id: person.phone_responsible_person_id !== undefined ? person.phone_responsible_person_id : existing.phone_responsible_person_id,
      };
      persons[existingIndex] = fullPerson;
    } else {
      fullPerson = {
        id: person.id,
        name: person.name || 'Sem nome',
        phone: person.phone || '',
        age: person.age,
        child_category: person.child_category,
        type: person.type || (person.age !== undefined && person.age < 12 ? 'child' : 'adult'),
        family_id: person.family_id || null,
        family_name: person.family_name || '',
        relationships: person.relationships || [],
        phone_responsible_person_id: person.phone_responsible_person_id || null,
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
      age: person.age,
      child_category: person.child_category,
      type: person.type || (person.age !== undefined && person.age < 12 ? 'child' : 'adult'),
      family_id: person.family_id || null,
      family_name: person.family_name || '',
      relationships: person.relationships || [],
      phone_responsible_person_id: person.phone_responsible_person_id || null,
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
      await setDoc(doc(db, 'persons', fullPerson.id), cleanUndefinedForFirestore(fullPerson));
    } catch (err) {
      console.error('Erro ao salvar pessoa no Firestore:', err);
    }
  }

  setLS(LS_KEYS.PERSONS, persons);
  return fullPerson;
}

export async function linkPersonPhoneResponsible(
  guestId: string,
  responsiblePersonId: string | null
): Promise<Person> {
  const persons = await getAllPersons();
  const guest = persons.find((p) => p.id === guestId);
  if (!guest) throw new Error('Pessoa não encontrada.');

  if (responsiblePersonId) {
    if (responsiblePersonId === guestId) {
      throw new Error('Uma pessoa não pode ser vinculada a ela mesma como responsável de telefone.');
    }
    const resp = persons.find((p) => p.id === responsiblePersonId);
    if (!resp) throw new Error('Responsável de telefone não encontrado.');
    const respPhone = (resp.phone || '').replace(/\D/g, '');
    if (respPhone.length < 8) {
      throw new Error('A pessoa responsável precisa ter um número de celular cadastrado com DDD.');
    }
  }

  return await savePerson({
    ...guest,
    phone_responsible_person_id: responsiblePersonId || null,
  });
}

export async function linkPeopleRelationship(
  person1Id: string,
  person2Id: string,
  relType1: RelationshipType,
  customFamilyName?: string
): Promise<{ person1: Person; person2: Person }> {
  const persons = await getAllPersons();
  const p1 = persons.find((p) => p.id === person1Id);
  const p2 = persons.find((p) => p.id === person2Id);

  if (!p1 || !p2) throw new Error('Pessoas não encontradas para vincular parentesco.');

  const sharedFamilyId = p1.family_id || p2.family_id || `fam-${Date.now()}`;
  const defaultFamilyName = customFamilyName || p1.family_name || p2.family_name || `Família ${p1.name.split(' ')[0]}`;
  const relType2 = getInverseRelationshipType(relType1);

  const p1Rels = (p1.relationships || []).filter((r) => r.target_person_id !== person2Id);
  p1Rels.push({ target_person_id: person2Id, relationship_type: relType1 });

  const p2Rels = (p2.relationships || []).filter((r) => r.target_person_id !== person1Id);
  p2Rels.push({ target_person_id: person1Id, relationship_type: relType2 });

  const updatedP1 = await savePerson({
    ...p1,
    family_id: sharedFamilyId,
    family_name: defaultFamilyName,
    relationships: p1Rels,
  });

  const updatedP2 = await savePerson({
    ...p2,
    family_id: sharedFamilyId,
    family_name: defaultFamilyName,
    relationships: p2Rels,
  });

  // Se outras pessoas pertenciam ao antigo family_id de P2 ou P1, unificar todas no mesmo family_id
  const oldFamilyIds = new Set<string>();
  if (p1.family_id && p1.family_id !== sharedFamilyId) oldFamilyIds.add(p1.family_id);
  if (p2.family_id && p2.family_id !== sharedFamilyId) oldFamilyIds.add(p2.family_id);

  if (oldFamilyIds.size > 0) {
    for (const member of persons) {
      if (member.id !== p1.id && member.id !== p2.id && member.family_id && oldFamilyIds.has(member.family_id)) {
        await savePerson({
          ...member,
          family_id: sharedFamilyId,
          family_name: defaultFamilyName,
        });
      }
    }
  }

  return { person1: updatedP1, person2: updatedP2 };
}

export async function unlinkPeopleRelationship(
  person1Id: string,
  person2Id: string
): Promise<{ person1: Person | null; person2: Person | null }> {
  const persons = await getAllPersons();
  const p1 = persons.find((p) => p.id === person1Id);
  const p2 = persons.find((p) => p.id === person2Id);

  let updatedP1: Person | null = null;
  let updatedP2: Person | null = null;

  if (p1) {
    const newRels = (p1.relationships || []).filter((r) => r.target_person_id !== person2Id);
    updatedP1 = await savePerson({
      ...p1,
      relationships: newRels,
    });
  }

  if (p2) {
    const newRels = (p2.relationships || []).filter((r) => r.target_person_id !== person1Id);
    updatedP2 = await savePerson({
      ...p2,
      relationships: newRels,
    });
  }

  return { person1: updatedP1, person2: updatedP2 };
}

export async function updateFamilyGroupName(familyId: string, newFamilyName: string): Promise<Person[]> {
  const persons = await getAllPersons();
  const updatedPersons: Person[] = [];
  for (const member of persons) {
    if (member.family_id === familyId) {
      const updated = await savePerson({
        ...member,
        family_name: newFamilyName,
      });
      updatedPersons.push(updated);
    }
  }
  return updatedPersons;
}

export async function updatePersonFamilyName(personId: string, newFamilyName: string): Promise<Person> {
  const persons = await getAllPersons();
  const target = persons.find((p) => p.id === personId);
  if (!target) throw new Error('Pessoa não encontrada.');

  const familyId = target.family_id || `fam-${Date.now()}`;

  if (target.family_id) {
    await updateFamilyGroupName(target.family_id, newFamilyName);
  }

  return await savePerson({
    ...target,
    family_id: familyId,
    family_name: newFamilyName,
  });
}

export async function savePersonFamilyAndRelationships(
  mainPersonId: string,
  familyName: string,
  stagedRelationships: Array<{ target_person_id: string; relationship_type: RelationshipType }>
): Promise<Person> {
  const persons = await getAllPersons();
  const mainP = persons.find((p) => p.id === mainPersonId);
  if (!mainP) throw new Error('Pessoa principal não encontrada.');

  const sharedFamilyId = mainP.family_id || `fam-${Date.now()}`;
  const finalFamilyName = familyName.trim() || mainP.family_name || `Família ${mainP.name.split(' ')[0]}`;

  // 1. Atualizar a pessoa principal com todos os relacionamentos empilhados
  const updatedMainP = await savePerson({
    ...mainP,
    family_id: sharedFamilyId,
    family_name: finalFamilyName,
    relationships: stagedRelationships,
  });

  // 2. Atualizar todas as pessoas que estão na lista empilhada (vínculos bilaterais)
  const targetIds = new Set(stagedRelationships.map((r) => r.target_person_id));

  for (const rel of stagedRelationships) {
    const target = persons.find((p) => p.id === rel.target_person_id);
    if (!target) continue;

    const inverseRelType = getInverseRelationshipType(rel.relationship_type);
    const existingTargetRels = (target.relationships || []).filter((r) => r.target_person_id !== mainPersonId);
    existingTargetRels.push({ target_person_id: mainPersonId, relationship_type: inverseRelType });

    await savePerson({
      ...target,
      family_id: sharedFamilyId,
      family_name: finalFamilyName,
      relationships: existingTargetRels,
    });
  }

  // 3. Limpar relacionamentos de pessoas que foram desvinculadas
  const oldTargetIds = (mainP.relationships || []).map((r) => r.target_person_id);
  const removedTargetIds = oldTargetIds.filter((id) => !targetIds.has(id));

  for (const removedId of removedTargetIds) {
    const target = persons.find((p) => p.id === removedId);
    if (!target) continue;

    const cleanTargetRels = (target.relationships || []).filter((r) => r.target_person_id !== mainPersonId);
    await savePerson({
      ...target,
      relationships: cleanTargetRels,
    });
  }

  // 4. Garantir que todos do grupo familiar recebam o novo nome de família
  await updateFamilyGroupName(sharedFamilyId, finalFamilyName);

  return updatedMainP;
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
    primary_color: '#6d44e4',
    accent_color: '#c5a059',
    bg_color: '#f7f4fc',
    card_bg_color: '#ffffff',
    text_color: '#1e152d',
    font_family: 'sans',
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

export async function trackInviteOpen(token: string): Promise<void> {
  try {
    const invite = await getInviteByToken(token);
    if (!invite) return;

    const now = new Date().toISOString();
    const openedAt = invite.opened_at || now;
    const openedCount = (invite.opened_count || 0) + 1;

    const updated: Invite = {
      ...invite,
      opened_at: openedAt,
      opened_count: openedCount,
      updated_at: now,
    };

    await saveInvite(updated);
  } catch (err) {
    console.warn(`Erro ao registrar abertura do token ${token}:`, err);
  }
}

export async function getPersonsForInvite(invite: Invite): Promise<Person[]> {
  const allPersons = await getAllPersons();
  const involvedIds = new Set<string>();
  if (invite.head_person_id) involvedIds.add(invite.head_person_id);
  if (invite.companion_person_ids) {
    invite.companion_person_ids.forEach((id) => involvedIds.add(id));
  }

  allPersons.forEach((p) => {
    if (p.phone_responsible_person_id && p.phone_responsible_person_id === invite.head_person_id) {
      involvedIds.add(p.id);
    }
  });

  return allPersons.filter((p) => involvedIds.has(p.id));
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

export async function splitCompanionToIndividualInvite(
  personId: string,
  parentInviteId: string
): Promise<Invite> {
  const persons = await getAllPersons();
  const targetPerson = persons.find((p) => p.id === personId);
  if (!targetPerson) throw new Error('Convidado não encontrado para desmembramento.');

  const parentInvite = (await getAllInvites()).find((i) => i.id === parentInviteId);
  if (!parentInvite) throw new Error('Convite de origem não encontrado.');

  // 1. Remover a pessoa da lista de acompanhantes do convite pai
  const updatedCompanions = (parentInvite.companion_person_ids || []).filter((id) => id !== personId);
  const updatedGuestsOfParent = (parentInvite.guests || []).filter(
    (g) => g.person_id !== personId && g.name.trim().toLowerCase() !== targetPerson.name.trim().toLowerCase()
  );
  const newParentMaxGuests = Math.max(1, 1 + updatedCompanions.length);
  const newParentConfirmedCount = updatedGuestsOfParent.filter((g) => g.status === 'confirmed').length;

  await saveInvite({
    ...parentInvite,
    companion_person_ids: updatedCompanions,
    guests: updatedGuestsOfParent,
    max_guests: newParentMaxGuests,
    confirmed_count: newParentConfirmedCount,
  });

  // 2. Criar um novo convite individual para a pessoa
  const newIndividualInvite = await saveInvite({
    invite_type: 'individual',
    head_person_id: targetPerson.id,
    head_name: targetPerson.name,
    phone: targetPerson.phone || parentInvite.phone || '',
    max_guests: 1,
    table_id: targetPerson.table_id || parentInvite.table_id || null,
    tier: parentInvite.tier || 'main',
    split_from_invite_id: parentInvite.id,
    status: 'pending',
    confirmed_count: 0,
    sent_status: 'not_sent',
    opened_at: null,
    opened_count: 0,
  });

  // 3. Atualizar o cadastro da pessoa para apontar para o novo convite individual como Head
  await savePerson({
    ...targetPerson,
    invite_id: newIndividualInvite.id,
    role_in_invite: 'head',
  });

  return newIndividualInvite;
}

export async function getAllTables(): Promise<Table[]> {
  let list: Table[] = [];
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'tables'));
      if (!snap.empty) {
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Table));
      }
    } catch (err) {
      console.warn('Erro ao buscar mesas no Firestore:', err);
    }
  }

  if (list.length === 0) {
    list = getLS<Table[]>(LS_KEYS.TABLES, INITIAL_TABLES);
  }

  return list.map((t, idx) => ({
    ...t,
    position: getTablePosition(t, idx),
  }));
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

export const LS_KEYS_EXT = {
  CAMPAIGNS: 'hotsite_surprise_campaigns_v1',
};

export async function getAllSurpriseCampaigns(): Promise<SurpriseCampaign[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'surprise_campaigns'));
      if (!snap.empty) {
        return snap.docs.map((docSnap) => docSnap.data() as SurpriseCampaign);
      }
    } catch (err) {
      console.warn('Erro ao ler campanhas do Firestore, usando fallback LS:', err);
    }
  }

  const local = getLS<SurpriseCampaign[]>(LS_KEYS_EXT.CAMPAIGNS, []);
  if (local && local.length > 0) return local;

  // Campanhas Padrão Iniciais
  const defaultCampaigns: SurpriseCampaign[] = [
    {
      id: 'camp-mural-fotos',
      title: 'Fotos para o Mural Surpresa da Festa 📸',
      type: 'photo',
      description: 'Fotos marcantes com a aniversariante para serem exibidas no Telão/Mural do buffet.',
      message_template: 'Segredo! 🤫 Shhh... Estamos preparando uma Homenagem Surpresa especial para os 40 Anos da Fernanda Seppi!\n\nPor favor, envie aqui neste WhatsApp uma foto marcante de vocês juntos para colocarmos no Mural/Telão da festa! 📸✨',
      target_tier: 'all',
      active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'camp-video-depoimento',
      title: 'Vídeos de Homenagem (15-30s) 🎥',
      type: 'video',
      description: 'Envio de vídeos curtos de carinho mandando um grande abraço.',
      message_template: 'Segredo! 🤫 Estamos preparando uma Homenagem Surpresa em Vídeo para os 40 Anos da Fernanda Seppi!\n\nEnvie um vídeo curto (15 a 30 segundos) mandando um abraço carinhoso para ela!\n\n{orientacao} 🎥✨',
      video_orientation: 'horizontal',
      target_tier: 'all',
      active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'camp-livro-ouro',
      title: 'Recados para o Livro de Ouro ✍️',
      type: 'text',
      description: 'Mensagens e depoimentos por escrito para guardar de recordação.',
      message_template: 'Segredo! 🤫 Estamos organizando um livro de depoimentos surpresa para os 40 Anos da Fernanda Seppi!\n\nPor favor, responda esta mensagem com um recado ou mensagem carinhosa de aniversário por escrito! ✍️❤️',
      target_tier: 'all',
      active: true,
      created_at: new Date().toISOString(),
    },
  ];

  setLS(LS_KEYS_EXT.CAMPAIGNS, defaultCampaigns);
  return defaultCampaigns;
}

export async function saveSurpriseCampaign(campaign: SurpriseCampaign): Promise<SurpriseCampaign> {
  const updatedCampaign = {
    ...campaign,
    updated_at: new Date().toISOString(),
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'surprise_campaigns', updatedCampaign.id), updatedCampaign);
    } catch (err) {
      console.warn('Erro ao salvar campanha no Firestore:', err);
    }
  }

  const campaigns = await getAllSurpriseCampaigns();
  const index = campaigns.findIndex((c) => c.id === updatedCampaign.id);
  let newCampaigns: SurpriseCampaign[];
  if (index >= 0) {
    newCampaigns = [...campaigns];
    newCampaigns[index] = updatedCampaign;
  } else {
    newCampaigns = [updatedCampaign, ...campaigns];
  }

  setLS(LS_KEYS_EXT.CAMPAIGNS, newCampaigns);
  return updatedCampaign;
}

export async function deleteSurpriseCampaign(campaignId: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'surprise_campaigns', campaignId));
    } catch (err) {
      console.warn('Erro ao deletar campanha no Firestore:', err);
    }
  }

  const campaigns = await getAllSurpriseCampaigns();
  const newCampaigns = campaigns.filter((c) => c.id !== campaignId);
  setLS(LS_KEYS_EXT.CAMPAIGNS, newCampaigns);
}



