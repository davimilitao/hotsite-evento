import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Invite, Table, EventConfig, Guest, InviteTier, Person, RelationshipType, ChildCategory, SurpriseCampaign, SurpriseSubmission, PresentationPlaylist, PresentationSlide } from '@/types';
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
  gift_message_title: 'Um Recadinho da Fê',
  gift_message_subtitle: 'Sobre Presentes & Mimos',
  gift_message_intro: 'Ah, que legal que você clicou aqui! 🥰\n\nFalando bem sério: a sua presença e o seu abraço são os meus maiores e melhores presentes. Mas, como algumas pessoas me pediram um norte, deixo aqui algumas ideias se você quiser me fazer um mimo:',
  gift_message_outro: 'Bom, acho que já sugeri até demais! Mas o que importa mesmo é a sua presença para termos um dia maravilhoso juntos. Espero por você!',
  gift_message_signature: 'Com carinho,\nFê 💖',
  gift_items: [
    { id: 'item-1', title: 'Miniaturas de perfumes', description: '(sabe como sou apegada a essas coisinhas, né?)' },
    { id: 'item-2', title: 'Body splashs', description: '(para me manter cheirosa sempre ✨).' },
    { id: 'item-3', title: 'Velas aromáticas, incensos e itens da linha zen', description: '(para criar aquele ambiente de paz e tranquilidade, muito bom pra recarregar as energias).' },
    { id: 'item-4', title: 'Tudo que tenha cachorro salsicha como tema!', description: '(é, eu amo as minhas meninas... mesmo que elas me tirem a paz de vez em quando. Na dúvida, me dá a vela zen junto para equilibrar! hahaha 🌭🐕).' },
    { id: 'item-5', title: 'Tênis (tamanho 37) ou Sandálias (tamanho 36)', description: '' },
    { id: 'item-6', title: 'Vinhos e mais vinhos!', description: '(brincadeira... ou não 🍷), acessórios e sabonetes perfumados.' },
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
  const POS_MESA_1  = { x: 70.2, y: 17.0 }; // Topo Direita
  const POS_MESA_2  = { x: 55.5, y: 17.0 }; // Topo Centro-Direita
  const POS_MESA_3  = { x: 41.5, y: 17.0 }; // Topo Centro
  const POS_MESA_4  = { x: 27.5, y: 17.0 }; // Topo Centro-Esquerda
  const POS_MESA_5  = { x: 13.5, y: 17.0 }; // Topo Esquerda
  const POS_MESA_6  = { x: 41.5, y: 65.0 }; // Centro Direita
  const POS_MESA_7  = { x: 26.5, y: 65.0 }; // Centro Esquerda
  const POS_MESA_8  = { x: 63.5, y: 83.0 }; // Base Direita
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
  { id: 'mesa-01', name: 'Mesa 01 - Família Seppi', capacity: 8, shape: 'round', description: 'Topo Direita (Próxima à Mesa do Bolo)', position: { x: 70.2, y: 17.0 } },
  { id: 'mesa-02', name: 'Mesa 02 - Amigos de Infância', capacity: 8, shape: 'round', description: 'Topo Centro-Direita', position: { x: 55.5, y: 17.0 } },
  { id: 'mesa-03', name: 'Mesa 03 - Colegas de Trabalho', capacity: 8, shape: 'round', description: 'Topo Centro', position: { x: 41.5, y: 17.0 } },
  { id: 'mesa-04', name: 'Mesa 04 - Família Expandida', capacity: 8, shape: 'round', description: 'Topo Centro-Esquerda', position: { x: 27.5, y: 17.0 } },
  { id: 'mesa-05', name: 'Mesa 05 - Hóspedes & Viagem', capacity: 8, shape: 'round', description: 'Topo Esquerda', position: { x: 13.5, y: 17.0 } },
  { id: 'mesa-06', name: 'Mesa 06 - Primos & Família', capacity: 8, shape: 'round', description: 'Centro-Direita', position: { x: 41.5, y: 65.0 } },
  { id: 'mesa-07', name: 'Mesa 07 - Convidado Especial', capacity: 8, shape: 'round', description: 'Centro-Esquerda', position: { x: 26.5, y: 65.0 } },
  { id: 'mesa-08', name: 'Mesa 08 - Amigos Próximos', capacity: 8, shape: 'round', description: 'Base Direita (Próxima à Mesa do Café)', position: { x: 63.5, y: 83.0 } },
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
  } catch {
    // Em caso de QuotaExceededError, limpa caches secundários que possam conter fotos Base64 antigas
    try {
      localStorage.removeItem('hotsite_surprise_submissions_v1');
      if (key !== 'festa_presentation_playlists_v1') {
        localStorage.removeItem('festa_presentation_playlists_v1');
      }
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      if (key === LS_KEYS.INVITES && Array.isArray(data)) {
        try {
          const lightInvites = data.map((inv: Record<string, unknown>) => ({
            ...inv,
            surprise_photo_url:
              typeof inv.surprise_photo_url === 'string' && inv.surprise_photo_url.startsWith('data:')
                ? ''
                : inv.surprise_photo_url,
          }));
          localStorage.setItem(key, JSON.stringify(lightInvites));
        } catch {
          // Dados permanecem sincronizados via Firestore
        }
      }
    }
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

  await setDoc(doc(db, 'event_config', 'settings'), cleanUndefinedForFirestore(INITIAL_EVENT_CONFIG));

  await Promise.all(
    INITIAL_TABLES.map((table) => setDoc(doc(db, 'tables', table.id), cleanUndefinedForFirestore(table)))
  );

  await Promise.all(
    INITIAL_PERSONS.map((person) => setDoc(doc(db, 'persons', person.id), cleanUndefinedForFirestore(person)))
  );
}

// ---- API DO BANCO DE DADOS PARA PESSOAS (1:1) ----

export async function getAllPersons(): Promise<Person[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'persons'));
      if (!snap.empty) {
        const personsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
        const cleanedList = personsList.map((p) => {
          if (p.name.toLowerCase().includes('tester') || p.phone === '110000000') {
            const restored: Person = {
              ...p,
              name: 'LEONARDO DAVI DA SILVA',
              phone: '11996895496',
            };
            setDoc(doc(db, 'persons', p.id), cleanUndefinedForFirestore(restored)).catch(() => {});
            return restored;
          }
          return p;
        });
        setLS(LS_KEYS.PERSONS, cleanedList);
        return cleanedList;
      } else {
        console.log('Populando Firestore com as pessoas físicas iniciais...');
        await Promise.all(
          INITIAL_PERSONS.map((person) =>
            setDoc(doc(db, 'persons', person.id), cleanUndefinedForFirestore(person))
          )
        );
        setLS(LS_KEYS.PERSONS, INITIAL_PERSONS);
        return INITIAL_PERSONS;
      }
    } catch (err) {
      console.warn('Erro ao buscar pessoas no Firestore:', err);
    }
  }

  const cached = getLS<Person[]>(LS_KEYS.PERSONS, INITIAL_PERSONS);
  if (cached && cached.length > 0) {
    const cleaned = cached.map((p) => {
      if (p.name.toLowerCase().includes('tester') || p.phone === '110000000') {
        return {
          ...p,
          name: 'LEONARDO DAVI DA SILVA',
          phone: '11996895496',
        };
      }
      return p;
    });
    setLS(LS_KEYS.PERSONS, cleaned);
    return cleaned;
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

function cleanUndefinedForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanUndefinedForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>).forEach((key) => {
      const val = (obj as Record<string, unknown>)[key];
      if (val !== undefined) {
        clean[key] = cleanUndefinedForFirestore(val);
      }
    });
    return clean as T;
  }
  return obj;
}

function buildFullPerson(person: Partial<Person> & { id?: string }, existing?: Person): Person {
  if (existing) {
    return {
      ...existing,
      ...person,
      id: existing.id,
      age: person.age !== undefined ? person.age : existing.age,
      child_category: person.child_category !== undefined ? person.child_category : existing.child_category,
      family_id: person.family_id !== undefined ? person.family_id : existing.family_id,
      family_name: person.family_name !== undefined ? person.family_name : existing.family_name,
      relationships: person.relationships !== undefined ? person.relationships : (existing.relationships || []),
      phone_responsible_person_id:
        person.phone_responsible_person_id !== undefined
          ? person.phone_responsible_person_id
          : existing.phone_responsible_person_id,
    };
  }
  const newId = person.id || `person-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
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
    counts_towards_buffet:
      person.counts_towards_buffet ?? (person.special_role ? person.special_role === 'guest' : true),
    special_arrival_time: person.special_arrival_time || '',
    notes: person.notes || '',
  };
}

async function savePersonsBatch(
  updates: Array<Partial<Person> & { id?: string }>,
  existingList?: Person[]
): Promise<{ updated: Person[]; allPersons: Person[] }> {
  const persons = existingList ? [...existingList] : await getAllPersons();
  const updatedList: Person[] = [];

  for (const item of updates) {
    if (item.id) {
      const idx = persons.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const full = buildFullPerson(item, persons[idx]);
        persons[idx] = full;
        updatedList.push(full);
      } else {
        const full = buildFullPerson(item);
        persons.push(full);
        updatedList.push(full);
      }
    } else {
      const full = buildFullPerson(item);
      persons.push(full);
      updatedList.push(full);
    }
  }

  if (isFirebaseConfigured && updatedList.length > 0) {
    try {
      await Promise.all(
        updatedList.map((p) => setDoc(doc(db, 'persons', p.id), cleanUndefinedForFirestore(p)))
      );
    } catch (err) {
      console.error('Erro ao salvar lote de pessoas no Firestore:', err);
    }
  }

  setLS(LS_KEYS.PERSONS, persons);
  return { updated: updatedList, allPersons: persons };
}

export async function savePerson(
  person: Partial<Person> & { id?: string },
  options?: { skipInviteSync?: boolean; existingPersons?: Person[] }
): Promise<Person> {
  const { updated } = await savePersonsBatch([person], options?.existingPersons);
  const fullPerson = updated[0];

  // Sincroniza automaticamente alterações de telefone, nome, mesa e categoria com o Convite (Invite) vinculado
  if (!options?.skipInviteSync && fullPerson) {
    try {
      const invites = getLS<Invite[]>(LS_KEYS.INVITES, INITIAL_INVITES);
      const linkedInviteIdx = invites.findIndex(
        (inv) =>
          inv.id === fullPerson.invite_id ||
          inv.head_person_id === fullPerson.id ||
          inv.companion_person_ids?.includes(fullPerson.id)
      );

      if (linkedInviteIdx >= 0) {
        const inv = invites[linkedInviteIdx];
        const isHead = inv.head_person_id === fullPerson.id || fullPerson.role_in_invite === 'head';

        const updatedGuests = (inv.guests || []).map((g) => {
          if (g.person_id === fullPerson.id || (isHead && !g.person_id && g.name === inv.head_name)) {
            return {
              ...g,
              person_id: fullPerson.id,
              name: fullPerson.name,
              type: fullPerson.type || 'adult',
              age: fullPerson.age,
              child_category: fullPerson.child_category || 'inteira',
            };
          }
          return g;
        });

        const syncedInvite: Invite = {
          ...inv,
          head_name: isHead ? fullPerson.name : inv.head_name,
          phone: isHead ? (fullPerson.phone || inv.phone) : inv.phone,
          table_id: isHead ? (fullPerson.table_id ?? null) : (inv.table_id ?? null),
          special_role: isHead ? fullPerson.special_role : inv.special_role,
          counts_towards_buffet: isHead ? fullPerson.counts_towards_buffet : inv.counts_towards_buffet,
          special_arrival_time: isHead ? fullPerson.special_arrival_time : inv.special_arrival_time,
          guests: updatedGuests,
          updated_at: new Date().toISOString(),
        };

        invites[linkedInviteIdx] = syncedInvite;
        setLS(LS_KEYS.INVITES, invites);
        if (isFirebaseConfigured) {
          await setDoc(doc(db, 'invites', syncedInvite.id), cleanUndefinedForFirestore(syncedInvite));
        }
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar pessoa com convite:', err);
    }
  }

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

  return await savePerson(
    {
      ...guest,
      phone_responsible_person_id: responsiblePersonId || null,
    },
    { existingPersons: persons }
  );
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

  const batchUpdates: Array<Partial<Person> & { id?: string }> = [
    {
      ...p1,
      family_id: sharedFamilyId,
      family_name: defaultFamilyName,
      relationships: p1Rels,
    },
    {
      ...p2,
      family_id: sharedFamilyId,
      family_name: defaultFamilyName,
      relationships: p2Rels,
    },
  ];

  const oldFamilyIds = new Set<string>();
  if (p1.family_id && p1.family_id !== sharedFamilyId) oldFamilyIds.add(p1.family_id);
  if (p2.family_id && p2.family_id !== sharedFamilyId) oldFamilyIds.add(p2.family_id);

  if (oldFamilyIds.size > 0) {
    for (const member of persons) {
      if (member.id !== p1.id && member.id !== p2.id && member.family_id && oldFamilyIds.has(member.family_id)) {
        batchUpdates.push({
          ...member,
          family_id: sharedFamilyId,
          family_name: defaultFamilyName,
        });
      }
    }
  }

  const { updated } = await savePersonsBatch(batchUpdates, persons);
  return { person1: updated[0], person2: updated[1] };
}

export async function unlinkPeopleRelationship(
  person1Id: string,
  person2Id: string
): Promise<{ person1: Person | null; person2: Person | null }> {
  const persons = await getAllPersons();
  const p1 = persons.find((p) => p.id === person1Id);
  const p2 = persons.find((p) => p.id === person2Id);

  const batchUpdates: Array<Partial<Person> & { id?: string }> = [];

  if (p1) {
    const newRels = (p1.relationships || []).filter((r) => r.target_person_id !== person2Id);
    batchUpdates.push({
      ...p1,
      relationships: newRels,
    });
  }

  if (p2) {
    const newRels = (p2.relationships || []).filter((r) => r.target_person_id !== person1Id);
    batchUpdates.push({
      ...p2,
      relationships: newRels,
    });
  }

  const { updated } = await savePersonsBatch(batchUpdates, persons);
  return {
    person1: updated.find((u) => u.id === person1Id) || null,
    person2: updated.find((u) => u.id === person2Id) || null,
  };
}

export async function updateFamilyGroupName(familyId: string, newFamilyName: string): Promise<Person[]> {
  const persons = await getAllPersons();
  const batchUpdates = persons
    .filter((member) => member.family_id === familyId)
    .map((member) => ({
      ...member,
      family_name: newFamilyName,
    }));

  const { updated } = await savePersonsBatch(batchUpdates, persons);
  return updated;
}

export async function updatePersonFamilyName(personId: string, newFamilyName: string): Promise<Person> {
  const persons = await getAllPersons();
  const target = persons.find((p) => p.id === personId);
  if (!target) throw new Error('Pessoa não encontrada.');

  const familyId = target.family_id || `fam-${Date.now()}`;
  const batchUpdates: Array<Partial<Person> & { id?: string }> = [];

  if (target.family_id) {
    persons
      .filter((m) => m.family_id === target.family_id && m.id !== target.id)
      .forEach((m) => {
        batchUpdates.push({ ...m, family_name: newFamilyName });
      });
  }

  batchUpdates.push({
    ...target,
    family_id: familyId,
    family_name: newFamilyName,
  });

  const { updated } = await savePersonsBatch(batchUpdates, persons);
  return updated.find((u) => u.id === personId) || updated[0];
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

  const updatesMap = new Map<string, Partial<Person> & { id: string }>();

  // 1. Pessoa principal
  updatesMap.set(mainP.id, {
    ...mainP,
    family_id: sharedFamilyId,
    family_name: finalFamilyName,
    relationships: stagedRelationships,
  });

  // 2. Pessoas na lista empilhada (vínculos bilaterais)
  const targetIds = new Set(stagedRelationships.map((r) => r.target_person_id));

  for (const rel of stagedRelationships) {
    const target = persons.find((p) => p.id === rel.target_person_id);
    if (!target) continue;

    const inverseRelType = getInverseRelationshipType(rel.relationship_type);
    const existingTargetRels = (target.relationships || []).filter((r) => r.target_person_id !== mainPersonId);
    existingTargetRels.push({ target_person_id: mainPersonId, relationship_type: inverseRelType });

    updatesMap.set(target.id, {
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
    const cleanFamily = cleanTargetRels.length === 0 && target.family_id === sharedFamilyId;
    updatesMap.set(target.id, {
      ...target,
      family_id: cleanFamily ? null : target.family_id,
      family_name: cleanFamily ? '' : target.family_name,
      relationships: cleanTargetRels,
    });
  }

  // 4. Garantir que outros integrantes do mesmo grupo familiar recebam o novo nome de família
  for (const member of persons) {
    if (member.family_id === sharedFamilyId && !updatesMap.has(member.id) && !removedTargetIds.includes(member.id)) {
      updatesMap.set(member.id, {
        ...member,
        family_name: finalFamilyName,
      });
    }
  }

  const { updated } = await savePersonsBatch(Array.from(updatesMap.values()), persons);
  return updated.find((u) => u.id === mainPersonId) || updated[0];
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
  const persons = await getAllPersons();
  const person = persons.find((p) => p.id === personId);
  if (!person) return null;

  return savePerson(
    {
      ...person,
      table_id: tableId,
      seat_number: seatNumber,
    },
    { existingPersons: persons }
  );
}

export async function unassignPersonSeat(personId: string): Promise<Person | null> {
  const persons = await getAllPersons();
  const person = persons.find((p) => p.id === personId);
  if (!person) return null;

  return savePerson(
    {
      ...person,
      table_id: null,
      seat_number: null,
    },
    { existingPersons: persons }
  );
}

export async function assignPersonToTableWithAutoSeat(
  personId: string,
  tableId: string | null,
  syncFamily = false
): Promise<Person | null> {
  const [persons, tables] = await Promise.all([getAllPersons(), getAllTables()]);
  const target = persons.find((p) => p.id === personId);
  if (!target) return null;

  const targetGroup: Person[] = [target];
  if (syncFamily) {
    const relIds = new Set((target.relationships || []).map((r) => r.target_person_id));
    persons.forEach((p) => {
      if (
        p.id !== target.id &&
        ((target.family_id && p.family_id === target.family_id) ||
          relIds.has(p.id) ||
          (target.invite_id && p.invite_id === target.invite_id))
      ) {
        targetGroup.push(p);
      }
    });
  }

  if (!tableId) {
    const updates = targetGroup.map((p) => ({
      ...p,
      table_id: null,
      seat_number: null,
    }));
    const { updated } = await savePersonsBatch(updates, persons);
    // Sync invite table_id = null
    await savePerson(updated[0], { existingPersons: persons });
    return updated[0];
  }

  const tableObj = tables.find((t) => t.id === tableId);
  const capacity = tableObj?.capacity || 10;
  const groupIds = new Set(targetGroup.map((p) => p.id));

  // Assentos já ocupados por outras pessoas nesta mesa
  const occupiedSeats = new Set<number>(
    persons
      .filter((p) => p.table_id === tableId && !groupIds.has(p.id) && p.seat_number !== null && p.seat_number !== undefined)
      .map((p) => Number(p.seat_number))
  );

  let nextSeat = 1;
  const getNextFreeSeat = (): number => {
    while (occupiedSeats.has(nextSeat) && nextSeat <= capacity * 2) {
      nextSeat++;
    }
    occupiedSeats.add(nextSeat);
    return nextSeat;
  };

  const updates = targetGroup.map((p) => {
    const keepSeat =
      p.table_id === tableId &&
      p.seat_number !== null &&
      p.seat_number !== undefined &&
      !occupiedSeats.has(Number(p.seat_number));
    const seat = keepSeat ? Number(p.seat_number) : getNextFreeSeat();
    if (keepSeat) occupiedSeats.add(seat);
    return {
      ...p,
      table_id: tableId,
      seat_number: seat,
    };
  });

  const { updated, allPersons } = await savePersonsBatch(updates, persons);
  await savePerson(updated[0], { existingPersons: allPersons });
  return updated[0];
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
          gift_items: Array.isArray(data.gift_items) ? data.gift_items : INITIAL_EVENT_CONFIG.gift_items,
          gift_message_title: data.gift_message_title ?? INITIAL_EVENT_CONFIG.gift_message_title,
          gift_message_subtitle: data.gift_message_subtitle ?? INITIAL_EVENT_CONFIG.gift_message_subtitle,
          gift_message_intro: data.gift_message_intro ?? INITIAL_EVENT_CONFIG.gift_message_intro,
          gift_message_outro: data.gift_message_outro ?? INITIAL_EVENT_CONFIG.gift_message_outro,
          gift_message_signature: data.gift_message_signature ?? INITIAL_EVENT_CONFIG.gift_message_signature,
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
      gift_items: Array.isArray(cached.gift_items) ? cached.gift_items : INITIAL_EVENT_CONFIG.gift_items,
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
  const enrichedConfig: EventConfig = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'event_config', 'settings'), cleanUndefinedForFirestore(enrichedConfig));
    } catch (err) {
      console.error('Erro ao salvar event_config no Firestore:', err);
    }
  }
  setLS(LS_KEYS.CONFIG, enrichedConfig);
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

  const cleanedRaw = rawInvites.map((i) => {
    if (i.head_name.toLowerCase().includes('tester') || i.phone === '110000000') {
      const restored: Invite = {
        ...i,
        head_name: 'LEONARDO DAVI DA SILVA',
        phone: '11996895496',
        guests: (i.guests || []).map((g) =>
          g.name.toLowerCase().includes('tester')
            ? { ...g, name: 'LEONARDO DAVI DA SILVA' }
            : g
        ),
      };
      if (isFirebaseConfigured) {
        setDoc(doc(db, 'invites', i.id), cleanUndefinedForFirestore(restored)).catch(() => {});
      }
      return restored;
    }
    return i;
  });

  const deduplicated = deduplicateInvitesList(cleanedRaw);
  setLS(LS_KEYS.INVITES, deduplicated);

  if (deduplicated.length < cleanedRaw.length) {
    const removedIds = cleanedRaw
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
  const [invitesList, persons] = await Promise.all([getAllInvites(), getAllPersons()]);
  let invites = [...invitesList];
  let targetId = invite.id;

  // Se ID não foi fornecido, buscar se já existe convite para esta pessoa (head_person_id ou head_name)
  if (!targetId) {
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
          } catch {}
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

  // Sincroniza os objetos Person envolvidos em lote (1 única gravação em vez de N loops lentos)
  const allInvolvedIds = new Set<string>();
  if (fullInvite.head_person_id) allInvolvedIds.add(fullInvite.head_person_id);
  if (fullInvite.companion_person_ids) {
    fullInvite.companion_person_ids.forEach((cId) => allInvolvedIds.add(cId));
  }

  const personBatchUpdates: Array<Partial<Person> & { id: string }> = [];

  for (const person of persons) {
    if (person.id === fullInvite.head_person_id) {
      personBatchUpdates.push({
        ...person,
        invite_id: fullInvite.id,
        role_in_invite: 'head',
        phone: fullInvite.phone || person.phone,
        table_id: fullInvite.table_id !== undefined ? fullInvite.table_id : person.table_id,
        special_role: fullInvite.special_role,
        counts_towards_buffet: fullInvite.counts_towards_buffet,
        special_arrival_time: fullInvite.special_arrival_time,
      });
    } else if (fullInvite.companion_person_ids?.includes(person.id)) {
      personBatchUpdates.push({
        ...person,
        invite_id: fullInvite.id,
        role_in_invite: 'companion',
        table_id: person.table_id || fullInvite.table_id || null,
        special_role: fullInvite.special_role,
        counts_towards_buffet: fullInvite.counts_towards_buffet,
      });
    } else if (person.invite_id === fullInvite.id && !allInvolvedIds.has(person.id)) {
      personBatchUpdates.push({
        ...person,
        invite_id: null,
        role_in_invite: null,
      });
    }
  }

  if (personBatchUpdates.length > 0) {
    await savePersonsBatch(personBatchUpdates, persons);
  }

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'invites', fullInvite.id), cleanUndefinedForFirestore(fullInvite));
    } catch (err) {
      console.error('Erro ao salvar convite no Firestore:', err);
    }
  }

  setLS(LS_KEYS.INVITES, invites);
  return fullInvite;
}

export async function quickSetPersonOrInviteStatus(
  personOrInviteId: string,
  newStatus: 'confirmed' | 'pending' | 'declined' | 'pending_date',
  options?: { isInviteId?: boolean; singlePersonOnly?: boolean }
): Promise<Invite | null> {
  const [invites, persons] = await Promise.all([getAllInvites(), getAllPersons()]);

  let targetInvite: Invite | undefined;
  let targetPerson: Person | undefined;

  if (options?.isInviteId) {
    targetInvite = invites.find((i) => i.id === personOrInviteId);
    if (targetInvite?.head_person_id) {
      targetPerson = persons.find((p) => p.id === targetInvite?.head_person_id);
    }
  } else {
    targetPerson = persons.find((p) => p.id === personOrInviteId);
    if (targetPerson) {
      const tpId = targetPerson.id;
      const tpInvId = targetPerson.invite_id;
      targetInvite = invites.find(
        (i) =>
          i.id === tpInvId ||
          i.head_person_id === tpId ||
          i.companion_person_ids?.includes(tpId)
      );
    }
  }

  // Caso já exista um convite vinculado
  if (targetInvite) {
    const existingGuests =
      targetInvite.guests && targetInvite.guests.length > 0
        ? targetInvite.guests
        : [
            {
              person_id: targetInvite.head_person_id,
              name: targetInvite.head_name,
              type: 'adult' as const,
              child_category: 'inteira' as const,
              status: targetInvite.status,
              dietary: '',
            },
          ];

    let updatedGuests: Guest[];
    let finalInviteStatus = newStatus;

    if (options?.singlePersonOnly && targetPerson && existingGuests.length > 1) {
      updatedGuests = existingGuests.map((g) => {
        if (
          g.person_id === targetPerson?.id ||
          g.name.trim().toLowerCase() === targetPerson?.name.trim().toLowerCase()
        ) {
          return { ...g, status: newStatus };
        }
        return g;
      });
      const anyConfirmed = updatedGuests.some((g) => g.status === 'confirmed');
      const allDeclined = updatedGuests.every((g) => g.status === 'declined');
      const anyPendingDate = updatedGuests.some((g) => g.status === 'pending_date');
      finalInviteStatus = anyConfirmed
        ? 'confirmed'
        : allDeclined
        ? 'declined'
        : anyPendingDate
        ? 'pending_date'
        : 'pending';
    } else {
      updatedGuests = existingGuests.map((g) => ({
        ...g,
        status: newStatus,
      }));
    }

    const confirmedCount = updatedGuests.filter((g) => g.status === 'confirmed').length;

    return saveInvite({
      ...targetInvite,
      status: finalInviteStatus,
      confirmed_count: confirmedCount,
      guests: updatedGuests,
    });
  }

  // Caso a pessoa ainda não tenha um objeto Invite criado, cria automaticamente!
  if (!targetPerson) return null;

  const familyCompanions: Person[] = [];
  if (!options?.singlePersonOnly) {
    const relIds = new Set((targetPerson.relationships || []).map((r) => r.target_person_id));
    persons.forEach((p) => {
      if (
        p.id !== targetPerson!.id &&
        !p.invite_id &&
        ((targetPerson!.family_id && p.family_id === targetPerson!.family_id) ||
          relIds.has(p.id) ||
          p.phone_responsible_person_id === targetPerson!.id)
      ) {
        familyCompanions.push(p);
      }
    });
  }

  const allMembers = [targetPerson, ...familyCompanions];
  const initialGuests: Guest[] = allMembers.map((m) => ({
    person_id: m.id,
    name: m.name,
    type: m.child_category && m.child_category !== 'inteira' ? 'child' : 'adult',
    age: m.age,
    child_category: m.child_category || 'inteira',
    status: newStatus,
    dietary: '',
  }));

  const confirmedCount = newStatus === 'confirmed' ? initialGuests.length : 0;

  return saveInvite({
    invite_type: familyCompanions.length > 0 ? 'family' : 'individual',
    head_person_id: targetPerson.id,
    companion_person_ids: familyCompanions.map((c) => c.id),
    head_name: targetPerson.name,
    phone: targetPerson.phone || '',
    max_guests: initialGuests.length,
    status: newStatus,
    confirmed_count: confirmedCount,
    table_id: targetPerson.table_id || null,
    tier: 'main',
    sent_status: 'not_sent',
    guests: initialGuests,
    special_role: targetPerson.special_role || 'guest',
    counts_towards_buffet: targetPerson.counts_towards_buffet ?? true,
    special_arrival_time: targetPerson.special_arrival_time || '',
  });
}

export async function deleteInvite(id: string): Promise<void> {
  const [invites, persons] = await Promise.all([getAllInvites(), getAllPersons()]);
  const targetInvite = invites.find((i) => i.id === id);
  const filtered = invites.filter((i) => i.id !== id);

  // Desvincula as pessoas associadas a este convite em lote
  const updates: Array<Partial<Person> & { id: string }> = [];
  for (const person of persons) {
    if (
      person.invite_id === id ||
      targetInvite?.head_person_id === person.id ||
      (targetInvite?.companion_person_ids && targetInvite.companion_person_ids.includes(person.id))
    ) {
      updates.push({
        ...person,
        invite_id: null,
        role_in_invite: null,
      });
    }
  }

  if (updates.length > 0) {
    await savePersonsBatch(updates, persons);
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
      await setDoc(doc(db, 'tables', fullTable.id), cleanUndefinedForFirestore(fullTable));
    } catch (err) {
      console.error('Erro ao salvar mesa no Firestore:', err);
    }
  }

  setLS(LS_KEYS.TABLES, tables);
  return fullTable;
}

export async function deleteTable(id: string): Promise<void> {
  const [tables, persons] = await Promise.all([getAllTables(), getAllPersons()]);
  const filtered = tables.filter((t) => t.id !== id);

  // Pessoas na mesa excluída têm table_id e seat_number limpos em lote
  const updates = persons
    .filter((p) => p.table_id === id)
    .map((p) => ({
      ...p,
      table_id: null,
      seat_number: null,
    }));

  if (updates.length > 0) {
    await savePersonsBatch(updates, persons);
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
  const persons = await getAllPersons();
  const toCreate: Array<Partial<Person> & { id?: string }> = [];
  let count = 0;

  for (const item of rawInvites) {
    const cleanName = item.head_name ? item.head_name.trim() : '';
    if (cleanName) {
      const exists =
        persons.some((p) => p.name.toLowerCase() === cleanName.toLowerCase()) ||
        toCreate.some((p) => p.name?.toLowerCase() === cleanName.toLowerCase());
      if (!exists) {
        toCreate.push({
          id: `person-${Date.now()}-${count}`,
          name: cleanName,
          phone: item.phone ? item.phone.trim() : '',
          type: 'adult',
        });
      }
      count++;
    }
  }

  if (toCreate.length > 0) {
    await savePersonsBatch(toCreate, persons);
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
    await Promise.all(
      invites.map((inv) =>
        deleteDoc(doc(db, 'invites', inv.id)).catch((err) =>
          console.warn(`Erro ao deletar convite ${inv.id} do Firestore:`, err)
        )
      )
    );
  }
  setLS(LS_KEYS.INVITES, []);

  const persons = await getAllPersons();
  const resetPersons: Person[] = persons.map((p) => ({
    ...p,
    invite_id: null,
    role_in_invite: null,
  }));

  await savePersonsBatch(resetPersons, persons);
}

export const LS_KEYS_EXT = {
  CAMPAIGNS: 'hotsite_surprise_campaigns_v1',
  SLIDE_PHOTOS: 'festa_slide_photos_v1',
};

const DEFAULT_SURPRISE_CAMPAIGNS: SurpriseCampaign[] = [
  {
    id: 'camp-mural-fotos',
    title: 'Fotos para o Mural Surpresa da Festa 📸',
    type: 'photo',
    description: 'Fotos marcantes com a aniversariante para serem exibidas no Telão/Mural do buffet.',
    message_template:
      'Segredo! 🤫 Shhh... Estamos preparando uma Homenagem Surpresa especial para os 40 Anos da Fernanda Seppi!\n\nPor favor, envie aqui neste WhatsApp uma foto marcante de vocês juntos para colocarmos no Mural/Telão da festa! 📸✨',
    target_tier: 'all',
    active: true,
    created_at: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'camp-video-depoimento',
    title: 'Vídeos de Homenagem (15-30s) 🎥',
    type: 'video',
    description: 'Envio de vídeos curtos de carinho mandando um grande abraço.',
    message_template:
      'Segredo! 🤫 Estamos preparando uma Homenagem Surpresa em Vídeo para os 40 Anos da Fernanda Seppi!\n\nEnvie um vídeo curto (15 a 30 segundos) mandando um abraço carinhoso para ela!\n\n{orientacao} 🎥✨',
    video_orientation: 'horizontal',
    target_tier: 'all',
    active: true,
    created_at: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'camp-livro-ouro',
    title: 'Recados para o Livro de Ouro ✍️',
    type: 'text',
    description: 'Mensagens e depoimentos por escrito para guardar de recordação.',
    message_template:
      'Segredo! 🤫 Estamos organizando um livro de depoimentos surpresa para os 40 Anos da Fernanda Seppi!\n\nPor favor, responda esta mensagem com um recado ou mensagem carinhosa de aniversário por escrito! ✍️❤️',
    target_tier: 'all',
    active: true,
    created_at: '2026-01-01T12:00:00.000Z',
  },
];

export async function getAllSurpriseCampaigns(): Promise<SurpriseCampaign[]> {
  if (isFirebaseConfigured) {
    try {
      // Armazenado em event_config/surprise_campaigns_store para garantir permissão total no Firestore
      const snap = await getDoc(doc(db, 'event_config', 'surprise_campaigns_store'));
      if (snap.exists()) {
        const data = snap.data() as { items?: SurpriseCampaign[] };
        if (Array.isArray(data.items) && data.items.length > 0) {
          setLS(LS_KEYS_EXT.CAMPAIGNS, data.items);
          return data.items;
        }
      }
    } catch (err) {
      console.warn('Aviso ao ler campanhas do Firestore, usando fallback LS:', err);
    }
  }

  const local = getLS<SurpriseCampaign[]>(LS_KEYS_EXT.CAMPAIGNS, []);
  if (local && local.length > 0) return local;

  setLS(LS_KEYS_EXT.CAMPAIGNS, DEFAULT_SURPRISE_CAMPAIGNS);
  return DEFAULT_SURPRISE_CAMPAIGNS;
}

export async function saveSurpriseCampaign(campaign: SurpriseCampaign): Promise<SurpriseCampaign> {
  const updatedCampaign = {
    ...campaign,
    updated_at: new Date().toISOString(),
  };

  const campaigns = await getAllSurpriseCampaigns();
  const index = campaigns.findIndex((c) => c.id === updatedCampaign.id);
  let newCampaigns: SurpriseCampaign[];
  if (index >= 0) {
    newCampaigns = [...campaigns];
    newCampaigns[index] = updatedCampaign;
  } else {
    newCampaigns = [updatedCampaign, ...campaigns];
  }

  if (isFirebaseConfigured) {
    try {
      await setDoc(
        doc(db, 'event_config', 'surprise_campaigns_store'),
        cleanUndefinedForFirestore({ items: newCampaigns, updated_at: new Date().toISOString() })
      );
    } catch (err) {
      console.warn('Aviso ao salvar campanha no Firestore:', err);
    }
  }

  setLS(LS_KEYS_EXT.CAMPAIGNS, newCampaigns);
  return updatedCampaign;
}

export async function deleteSurpriseCampaign(campaignId: string): Promise<void> {
  const campaigns = await getAllSurpriseCampaigns();
  const newCampaigns = campaigns.filter((c) => c.id !== campaignId);

  if (isFirebaseConfigured) {
    try {
      await setDoc(
        doc(db, 'event_config', 'surprise_campaigns_store'),
        cleanUndefinedForFirestore({ items: newCampaigns, updated_at: new Date().toISOString() })
      );
    } catch (err) {
      console.warn('Aviso ao deletar campanha no Firestore:', err);
    }
  }

  setLS(LS_KEYS_EXT.CAMPAIGNS, newCampaigns);
}

// ---- HOMENAGEM SURPRESA: SUBMISSÃO DE FOTOS & MENSAGENS PARA O TELÃO ----

export async function saveSurpriseSubmission(
  inviteId: string,
  submission: {
    photo_url?: string;
    message?: string;
    guest_name?: string;
  }
): Promise<SurpriseSubmission> {
  const now = new Date().toISOString();
  const fullSubmission: SurpriseSubmission = {
    id: inviteId,
    invite_id: inviteId,
    guest_name: submission.guest_name || 'Convidado',
    photo_url: submission.photo_url || '',
    message: submission.message || '',
    submitted_at: now,
  };

  // Atualiza o convite correspondente no Firestore (coleção 'invites' possui permissão total e comporta 1 foto comprimida por doc)
  const invites = await getAllInvites();
  const invite = invites.find((i) => i.id === inviteId);
  if (invite) {
    const updatedInvite: Invite = {
      ...invite,
      surprise_sent: true,
      surprise_photo_sent: Boolean(submission.photo_url || invite.surprise_photo_url),
      surprise_text_sent: Boolean(submission.message || invite.surprise_message),
      surprise_photo_url: submission.photo_url !== undefined ? submission.photo_url : (invite.surprise_photo_url || ''),
      surprise_message: submission.message !== undefined ? submission.message : (invite.surprise_message || ''),
      surprise_submitted_at: now,
    };
    await saveInvite(updatedInvite);
  } else if (isFirebaseConfigured) {
    // Caso seja uma submissão avulsa sem convite na lista, salva em event_config/surprise_sub_<id>
    try {
      await setDoc(
        doc(db, 'event_config', `surprise_sub_${inviteId}`),
        cleanUndefinedForFirestore(fullSubmission)
      );
    } catch (err) {
      console.warn('Aviso ao salvar submissão avulsa no Firestore:', err);
    }
  }

  // No LocalStorage, não duplicamos a foto Base64 se ela já está salva no objeto Invite
  const cachedSubmissions = getLS<Record<string, SurpriseSubmission>>('hotsite_surprise_submissions_v1', {});
  cachedSubmissions[inviteId] = {
    ...fullSubmission,
    photo_url: invite ? '' : fullSubmission.photo_url,
  };
  setLS('hotsite_surprise_submissions_v1', cachedSubmissions);

  return fullSubmission;
}

export async function getAllSurpriseSubmissions(): Promise<SurpriseSubmission[]> {
  // 1. Extrai diretamente dos convites sincronizados no Firestore (coleção 'invites')
  const invites = await getAllInvites();
  const fromInvites: SurpriseSubmission[] = invites
    .filter((inv) => inv.surprise_photo_url || inv.surprise_message || inv.surprise_sent)
    .map((inv) => ({
      id: inv.id,
      invite_id: inv.id,
      guest_name: inv.head_name,
      photo_url: inv.surprise_photo_url || '',
      message: inv.surprise_message || '',
      submitted_at: inv.surprise_submitted_at || inv.updated_at || new Date().toISOString(),
    }));

  const cached = getLS<Record<string, SurpriseSubmission>>('hotsite_surprise_submissions_v1', {});
  const mergedMap = new Map<string, SurpriseSubmission>();

  Object.values(cached).forEach((s) => {
    if (s && s.id) mergedMap.set(s.id, s);
  });

  // 2. Recupera também eventuais slides salvos nas playlists locais para garantir que nenhum envio anterior seja perdido
  const cachedPlaylists = getLS<PresentationPlaylist[]>('festa_presentation_playlists_v1', []);
  const slidePhotosCache = getLS<Record<string, string>>(LS_KEYS_EXT.SLIDE_PHOTOS, {});
  cachedPlaylists.forEach((pl) => {
    (pl.slides || []).forEach((sl) => {
      const subId = sl.submission_id || (sl.source === 'surprise_submission' ? sl.id : '');
      if (!subId) return;
      const resolvedPhoto =
        sl.photo_url && sl.photo_url.startsWith('ref:slide_photo:')
          ? slidePhotosCache[sl.photo_url.replace('ref:slide_photo:', '')] || ''
          : sl.photo_url || slidePhotosCache[sl.id] || '';
      const existing = mergedMap.get(subId);
      if (!existing || (!existing.photo_url && resolvedPhoto) || (!existing.message && sl.caption)) {
        mergedMap.set(subId, {
          id: subId,
          invite_id: subId,
          guest_name: existing?.guest_name || sl.author_name || 'Convidado',
          photo_url: existing?.photo_url || resolvedPhoto || '',
          message: existing?.message || sl.caption || '',
          submitted_at: existing?.submitted_at || pl.updated_at || new Date().toISOString(),
        });
      }
    });
  });

  // 3. Dados vindos dos Invites têm prioridade máxima pois contêm o photo_url e message oficiais do Firestore
  fromInvites.forEach((s) => {
    const existing = mergedMap.get(s.id);
    mergedMap.set(s.id, {
      ...s,
      photo_url: s.photo_url || existing?.photo_url || '',
      message: s.message || existing?.message || '',
    });
  });

  return Array.from(mergedMap.values()).filter((s) => Boolean(s.photo_url || s.message));
}

// ==========================================
// MÓDULO TELÃO FULL-SCREEN & APRESENTAÇÕES
// ==========================================

/**
 * Desidrata as fotos em Base64 dos slides antes de gravar no documento da playlist,
 * evitando estourar o limite de 1MB do Firestore (1.048.576 bytes) e os 5MB do LocalStorage,
 * MAS garantindo que todo slide com imagem tenha backup individual em `event_config/slide_photo_<id>`.
 */
async function dehydratePlaylistForStorage(playlist: PresentationPlaylist): Promise<PresentationPlaylist> {
  const customPhotosCache = getLS<Record<string, string>>(LS_KEYS_EXT.SLIDE_PHOTOS, {});
  let customPhotosChanged = false;

  const dehydratedSlides: PresentationSlide[] = await Promise.all(
    (playlist.slides || []).map(async (slide) => {
      // Salva qualquer imagem Base64 em um documento dedicado por slide (`slide_photo_<id>`) + cache local
      // Assim, mesmo que venha de submissão ou do PC, a imagem NUNCA fica órfã nem vazia!
      if (slide.photo_url && slide.photo_url.startsWith('data:')) {
        const photoDocId = `slide_photo_${slide.id}`;
        customPhotosCache[slide.id] = slide.photo_url;
        customPhotosChanged = true;

        if (isFirebaseConfigured) {
          try {
            await setDoc(doc(db, 'event_config', photoDocId), {
              id: slide.id,
              photo_url: slide.photo_url,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn(`Aviso ao salvar foto individual do slide ${slide.id}:`, err);
          }
        }

        return {
          ...slide,
          photo_url: `ref:slide_photo:${slide.id}`,
        };
      }

      return slide;
    })
  );

  if (customPhotosChanged) {
    setLS(LS_KEYS_EXT.SLIDE_PHOTOS, customPhotosCache);
  }

  return {
    ...playlist,
    slides: dehydratedSlides,
  };
}

/**
 * Reidrata as fotos e legendas dos slides em memória buscando das homenagens (Invites)
 * ou dos documentos individuais de foto (`event_config/slide_photo_<id>`).
 * Preserva também slides somente de texto (depoimentos sem foto) para exibição no Telão!
 */
async function hydratePlaylistsPhotos(playlists: PresentationPlaylist[]): Promise<PresentationPlaylist[]> {
  const submissions = await getAllSurpriseSubmissions();
  const subById = new Map<string, SurpriseSubmission>();
  const subByAuthor = new Map<string, SurpriseSubmission>();

  submissions.forEach((s) => {
    subById.set(s.id, s);
    if (s.guest_name) {
      subByAuthor.set(s.guest_name.trim().toLowerCase(), s);
    }
  });

  const customPhotosCache = getLS<Record<string, string>>(LS_KEYS_EXT.SLIDE_PHOTOS, {});

  return Promise.all(
    playlists.map(async (pl) => {
      const hydratedSlides = await Promise.all(
        (pl.slides || []).map(async (slide) => {
          let resolvedPhoto = slide.photo_url || '';
          let resolvedCaption = slide.caption || '';
          let resolvedAuthor = slide.author_name || '';

          // 1. Tenta resolver referência `ref:slide_photo:<id>` no cache local ou no Firestore
          if (resolvedPhoto.startsWith('ref:slide_photo:')) {
            const slideId = resolvedPhoto.replace('ref:slide_photo:', '');
            if (customPhotosCache[slideId]) {
              resolvedPhoto = customPhotosCache[slideId];
            } else if (isFirebaseConfigured) {
              try {
                const snap = await getDoc(doc(db, 'event_config', `slide_photo_${slideId}`));
                if (snap.exists()) {
                  const data = snap.data() as { photo_url?: string };
                  if (data.photo_url) {
                    customPhotosCache[slideId] = data.photo_url;
                    setLS(LS_KEYS_EXT.SLIDE_PHOTOS, customPhotosCache);
                    resolvedPhoto = data.photo_url;
                  }
                }
              } catch {}
            }
            if (resolvedPhoto.startsWith('ref:')) {
              resolvedPhoto = '';
            }
          }

          // 2. Se ainda estiver sem foto (ou se veio de submissão de convidado), busca na lista de submissões/convites
          const matchedSub =
            (slide.submission_id ? subById.get(slide.submission_id) : undefined) ||
            (slide.author_name ? subByAuthor.get(slide.author_name.trim().toLowerCase()) : undefined);

          if (matchedSub) {
            if (!resolvedPhoto && matchedSub.photo_url) {
              resolvedPhoto = matchedSub.photo_url;
            }
            if (!resolvedCaption && matchedSub.message) {
              resolvedCaption = matchedSub.message;
            }
            if (!resolvedAuthor && matchedSub.guest_name) {
              resolvedAuthor = matchedSub.guest_name;
            }
          }

          // 3. Fallback adicional pelo próprio slide.id no cache de fotos
          if (!resolvedPhoto && customPhotosCache[slide.id]) {
            resolvedPhoto = customPhotosCache[slide.id];
          }

          return {
            ...slide,
            photo_url: resolvedPhoto,
            caption: resolvedCaption,
            author_name: resolvedAuthor,
          };
        })
      );

      // Mantém qualquer slide que tenha foto válida OU que tenha mensagem/depoimento em texto!
      return {
        ...pl,
        slides: hydratedSlides.filter((s) =>
          Boolean((s.photo_url && !s.photo_url.startsWith('ref:')) || (s.caption && s.caption.trim()))
        ),
      };
    })
  );
}

export async function getAllPresentationPlaylists(): Promise<PresentationPlaylist[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, 'event_config', 'presentation_playlists_store'));
      if (snap.exists()) {
        const data = snap.data() as { items?: PresentationPlaylist[] };
        if (Array.isArray(data.items) && data.items.length > 0) {
          setLS('festa_presentation_playlists_v1', data.items);
          return hydratePlaylistsPhotos(data.items);
        }
      }
    } catch (err) {
      console.warn('Aviso ao carregar playlists do Firestore:', err);
    }
  }

  const cached = getLS<PresentationPlaylist[]>('festa_presentation_playlists_v1', []);
  if (cached && cached.length > 0) {
    const hasBloatedBase64 = cached.some((pl) =>
      (pl.slides || []).some((s) => s.photo_url?.startsWith('data:'))
    );
    if (hasBloatedBase64) {
      const slimmed = await Promise.all(cached.map((pl) => dehydratePlaylistForStorage(pl)));
      setLS('festa_presentation_playlists_v1', slimmed);
      return hydratePlaylistsPhotos(slimmed);
    }
    return hydratePlaylistsPhotos(cached);
  }

  return seedDefaultPlaylists();
}

export async function getPresentationPlaylistById(id: string): Promise<PresentationPlaylist | null> {
  const playlists = await getAllPresentationPlaylists();
  return playlists.find((p) => p.id === id) || null;
}

export async function savePresentationPlaylist(playlist: PresentationPlaylist): Promise<PresentationPlaylist> {
  const currentPlaylists = await getAllPresentationPlaylists();
  const index = currentPlaylists.findIndex((p) => p.id === playlist.id);

  const updatedPlaylist: PresentationPlaylist = {
    ...playlist,
    updated_at: new Date().toISOString(),
  };

  if (index >= 0) {
    currentPlaylists[index] = updatedPlaylist;
  } else {
    currentPlaylists.push(updatedPlaylist);
  }

  // Desidrata as fotos antes de persistir no Firestore e no LocalStorage (mantém o documento < 5KB!)
  const dehydratedList = await Promise.all(currentPlaylists.map((pl) => dehydratePlaylistForStorage(pl)));

  if (isFirebaseConfigured) {
    try {
      await setDoc(
        doc(db, 'event_config', 'presentation_playlists_store'),
        cleanUndefinedForFirestore({
          items: dehydratedList,
          updated_at: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error('Erro ao salvar playlist no Firestore:', err);
    }
  }

  setLS('festa_presentation_playlists_v1', dehydratedList);
  return updatedPlaylist;
}

export async function deletePresentationPlaylist(id: string): Promise<void> {
  let playlists = await getAllPresentationPlaylists();
  playlists = playlists.filter((p) => p.id !== id);

  const dehydratedList = await Promise.all(playlists.map((pl) => dehydratePlaylistForStorage(pl)));

  if (isFirebaseConfigured) {
    try {
      await setDoc(
        doc(db, 'event_config', 'presentation_playlists_store'),
        cleanUndefinedForFirestore({
          items: dehydratedList,
          updated_at: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error('Erro ao deletar playlist no Firestore:', err);
    }
  }

  setLS('festa_presentation_playlists_v1', dehydratedList);
}

export async function seedDefaultPlaylists(): Promise<PresentationPlaylist[]> {
  const submissions = await getAllSurpriseSubmissions();
  const validSubmissions = submissions.filter((s) => s.photo_url || s.message);

  const initialSlides: PresentationSlide[] = validSubmissions.map((s, idx) => ({
    id: `slide-${idx + 1}`,
    photo_url: s.photo_url || '',
    caption: s.message || 'Com todo meu amor para a Fernanda! ✨',
    author_name: s.guest_name || 'Convidado Especial',
    duration_seconds: 8,
    order: idx + 1,
    source: 'surprise_submission',
    submission_id: s.id,
    ken_burns_effect: idx % 2 === 0 ? 'zoom-in' : 'pan-left',
  }));

  const defaultPlaylists: PresentationPlaylist[] = [
    {
      id: 'homenagem-principal',
      title: 'Homenagem Principal (Momento Solene)',
      description: 'Apresentação com música, fotos e depoimentos marcantes para emocionar a aniversariante e todos os convidados.',
      mode: 'presentation',
      default_slide_duration: 8,
      audio_url: '',
      audio_title: 'Trilha Emocional Especial 40 Anos',
      is_active: true,
      slides: initialSlides,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'looping-festa',
      title: 'Looping da Festa (Fotos com Convidados)',
      description: 'Exibição contínua sem som para rodar ao fundo no telão durante a festa com a trilha do DJ.',
      mode: 'looping',
      default_slide_duration: 7,
      is_active: false,
      slides: initialSlides,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const dehydratedList = await Promise.all(defaultPlaylists.map((pl) => dehydratePlaylistForStorage(pl)));

  if (isFirebaseConfigured) {
    try {
      await setDoc(
        doc(db, 'event_config', 'presentation_playlists_store'),
        cleanUndefinedForFirestore({
          items: dehydratedList,
          updated_at: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn('Aviso ao semear playlists no Firestore:', err);
    }
  }

  setLS('festa_presentation_playlists_v1', dehydratedList);
  return defaultPlaylists;
}





