'use client';

import React, { useState } from 'react';
import { Invite, Table, EventConfig, InviteTier, Person, SpecialRole, ChildCategory } from '@/types';
import { saveInvite, deleteInvite, markInviteAsSent, promoteInviteToMain, savePerson, deletePerson, unassignPersonSeat, calculateChildCategory, linkPersonPhoneResponsible } from '@/lib/db';
import { buildWhatsAppLink, formatPhoneDisplay, getDeadlineInfo, formatDateShort, formatPhoneE164 } from '@/lib/utils';
import { BulkImporter } from './BulkImporter';
import { PersonRelationshipModal } from './PersonRelationshipModal';
import { PersonEditModal } from './PersonEditModal';
import { DataNormalizerModal } from './DataNormalizerModal';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MessageCircle,
  Plus,
  Upload,
  Search,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  X,
  CalendarClock,
  Utensils,
  Edit,
  Send,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  Armchair,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ChevronDown,
  Star,
  Music,
  Crown,
  Briefcase,
  ShieldCheck,
  Download,
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home,
  Heart,
  Baby,
  Link2,
  Shield,
  Tag,
} from 'lucide-react';

interface GuestListProps {
  invites: Invite[];
  tables: Table[];
  persons: Person[];
  config: EventConfig;
  activeTab?: 'persons' | 'invites';
  setActiveTab?: (tab: 'persons' | 'invites') => void;
  onRefresh: () => void;
}

export function GuestList({
  invites,
  tables,
  persons,
  config,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  onRefresh,
}: GuestListProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'persons' | 'invites'>('persons');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = externalSetActiveTab || setInternalActiveTab;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'uninvited' | 'confirmed' | 'pending_date' | 'expired' | 'declined'>('all');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Estados dos Modais de Cadastro / Edição de Pessoa e Parentesco
  const [relationshipModalPerson, setRelationshipModalPerson] = useState<Person | null>(null);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState<boolean>(false);
  const [editModalPerson, setEditModalPerson] = useState<Person | null>(null);
  const [isPersonEditOpen, setIsPersonEditOpen] = useState<boolean>(false);

  // Estado do Modal de Vínculo de Telefone Responsável & Normalizador
  const [phoneLinkModalPerson, setPhoneLinkModalPerson] = useState<Person | null>(null);
  const [isPhoneLinkModalOpen, setIsPhoneLinkModalOpen] = useState<boolean>(false);
  const [selectedPhoneRespId, setSelectedPhoneRespId] = useState<string>('');
  const [isNormalizerOpen, setIsNormalizerOpen] = useState<boolean>(false);

  // Estados de Edição Inline & Menu Dropdown na DataTable
  const [editingCell, setEditingCell] = useState<{ inviteId: string; field: 'name' | 'phone'; value: string } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Estados do Wizard Step-by-Step
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [inviteType, setInviteType] = useState<'individual' | 'family'>('family');
  const [headPersonId, setHeadPersonId] = useState('');
  const [companionPersonIds, setCompanionPersonIds] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<InviteTier>('main');
  const [individualDeadline, setIndividualDeadline] = useState('');
  const [familySlotsCount, setFamilySlotsCount] = useState<number>(2);
  const [searchPersonQuery, setSearchPersonQuery] = useState<string>('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [isDirectPersonInvite, setIsDirectPersonInvite] = useState<boolean>(false);

  // Estados do Wizard Curto para Convites Especiais (Funções / Staff)
  const [isSpecialOpen, setIsSpecialOpen] = useState(false);
  const [specialStep, setSpecialStep] = useState<number>(1);
  const [specialRole, setSpecialRole] = useState<SpecialRole>('ceremonialist');
  const [specialHeadPersonId, setSpecialHeadPersonId] = useState('');
  const [specialHeadName, setSpecialHeadName] = useState('');
  const [specialPhone, setSpecialPhone] = useState('');
  const [specialArrivalTime, setSpecialArrivalTime] = useState('16:00');
  const [specialCustomMessage, setSpecialCustomMessage] = useState('');

  // Estados do Modal Rápido: Adicionar Nome à Lista
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  // Estados de Ordenação por Coluna
  const [sortField, setSortField] = useState<'name' | 'invite_type' | 'table' | 'status' | 'family'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Estado de Edição Inline de Telefone na Lista de Convidados
  const [editingPhonePersonId, setEditingPhonePersonId] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState<string>('');

  // Métricas 1:1 de Pessoas & Assentos
  const buffetCapacity = config.buffet_capacity || 100;
  const totalPersons = persons.length;
  // Pessoas alocadas em assentos
  const seatedPersons = persons.filter((p) => p.table_id);
  // Apenas pessoas que consomem cota do buffet (exclui convidados especiais isentos: Cerimonialista, Músicos, Staff, Aniversariante)
  const seatedBuffetPersons = persons.filter(
    (p) => p.table_id && p.counts_towards_buffet !== false && (p.special_role === 'guest' || !p.special_role)
  );
  const unseatedPersons = persons.filter((p) => !p.table_id);

  // Métricas para os 3 Cards Matemáticos Sincronizados
  const sentInvitesPersonsCount = persons.filter((p) => {
    const inv = invites.find((i) => i.id === p.invite_id || i.head_person_id === p.id || i.companion_person_ids?.includes(p.id));
    return inv?.sent_status === 'sent';
  }).length;

  const uninvitedSeatedCount = persons.filter((p) => {
    if (!p.table_id) return false;
    const inv = invites.find((i) => i.id === p.invite_id || i.head_person_id === p.id || i.companion_person_ids?.includes(p.id));
    return !inv;
  }).length;

  const unseatedPersonsCount = unseatedPersons.length;

  const confirmedPersonsCount = persons.filter((p) => {
    const inv = invites.find((i) => i.id === p.invite_id || i.head_person_id === p.id || i.companion_person_ids?.includes(p.id));
    if (!inv) return false;
    const guestObj = inv.guests?.find((g) => g.name.trim().toLowerCase() === p.name.trim().toLowerCase());
    return (guestObj && guestObj.status === 'confirmed') || inv.status === 'confirmed';
  }).length;

  const declinedPersonsCount = persons.filter((p) => {
    const inv = invites.find((i) => i.id === p.invite_id || i.head_person_id === p.id || i.companion_person_ids?.includes(p.id));
    if (!inv) return false;
    const guestObj = inv.guests?.find((g) => g.name.trim().toLowerCase() === p.name.trim().toLowerCase());
    return (guestObj && guestObj.status === 'declined') || inv.status === 'declined';
  }).length;

  const pendingRsvpCount = persons.filter((p) => {
    const inv = invites.find((i) => i.id === p.invite_id || i.head_person_id === p.id || i.companion_person_ids?.includes(p.id));
    if (!inv) return false;
    const guestObj = inv.guests?.find((g) => g.name.trim().toLowerCase() === p.name.trim().toLowerCase());
    const isConf = (guestObj && guestObj.status === 'confirmed') || inv.status === 'confirmed';
    const isDecl = (guestObj && guestObj.status === 'declined') || inv.status === 'declined';
    return !isConf && !isDecl;
  }).length;

  const mainInvites = invites.filter((i) => !i.tier || i.tier === 'main');
  const reserveInvites = invites.filter((i) => i.tier === 'reserve');
  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');
  const declinedInvites = invites.filter((i) => i.status === 'declined');
  const sentInvites = invites.filter((i) => i.sent_status === 'sent');

  // Pessoas elegíveis para convite (Qualquer pessoa sem convite ou em edição)
  const eligiblePersonsForInvite = persons.filter(
    (p) => (!p.invite_id || p.invite_id === editingInvite?.id)
  );

  const buffetOccupancyPercent = Math.min(
    Math.round((seatedBuffetPersons.length / buffetCapacity) * 100),
    100
  );

  // Filtro de Pessoas Físicas (1:1 com a Master List de 119 Convidados)
  const filteredPersons = persons.filter((person) => {
    const invite = invites.find(
      (i) => i.id === person.invite_id || i.head_person_id === person.id || i.companion_person_ids?.includes(person.id)
    );
    const headPerson = invite?.head_person_id ? persons.find((p) => p.id === invite.head_person_id) : null;

    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.phone || '').includes(searchTerm) ||
      person.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invite && invite.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (headPerson && headPerson.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'uninvited') return !invite;

    const guestObj = invite?.guests?.find((g) => g.name.trim().toLowerCase() === person.name.trim().toLowerCase());
    const isConfirmed = (guestObj && guestObj.status === 'confirmed') || (invite && invite.status === 'confirmed');
    const isDeclined = (guestObj && guestObj.status === 'declined') || (invite && invite.status === 'declined');
    const isPendingDate = (guestObj && guestObj.status === 'pending_date') || (invite && invite.status === 'pending_date');

    if (statusFilter === 'confirmed') return isConfirmed;
    if (statusFilter === 'declined') return isDeclined;
    if (statusFilter === 'pending_date') return isPendingDate;
    if (statusFilter === 'expired') {
      const deadlineInfo = invite ? getDeadlineInfo(invite, config.deadline_rsvp) : { expired: false, label: 'Pendente', color: '' };
      return deadlineInfo.expired;
    }

    return true;
  });

  const handleSort = (field: 'name' | 'invite_type' | 'table' | 'status' | 'family') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPersons = [...filteredPersons].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === 'family') {
      valA = (a.family_name || 'z_sem_familia').toLowerCase();
      valB = (b.family_name || 'z_sem_familia').toLowerCase();
    } else if (sortField === 'invite_type') {
      const invA = invites.find((i) => i.id === a.invite_id || i.head_person_id === a.id || i.companion_person_ids?.includes(a.id));
      const invB = invites.find((i) => i.id === b.invite_id || i.head_person_id === b.id || i.companion_person_ids?.includes(b.id));
      valA = invA ? (invA.invite_type || 'família') : 'z_sem_convite';
      valB = invB ? (invB.invite_type || 'família') : 'z_sem_convite';
    } else if (sortField === 'table') {
      const tableA = tables.find((t) => t.id === a.table_id);
      const tableB = tables.find((t) => t.id === b.table_id);
      valA = tableA ? tableA.name.toLowerCase() : 'z_sem_mesa';
      valB = tableB ? tableB.name.toLowerCase() : 'z_sem_mesa';
    } else if (sortField === 'status') {
      const invA = invites.find((i) => i.id === a.invite_id || i.head_person_id === a.id || i.companion_person_ids?.includes(a.id));
      const invB = invites.find((i) => i.id === b.invite_id || i.head_person_id === b.id || i.companion_person_ids?.includes(b.id));
      const guestObjA = invA?.guests?.find((g) => g.name.trim().toLowerCase() === a.name.trim().toLowerCase());
      const guestObjB = invB?.guests?.find((g) => g.name.trim().toLowerCase() === b.name.trim().toLowerCase());
      valA = guestObjA?.status || invA?.status || 'z_sem_convite';
      valB = guestObjB?.status || invB?.status || 'z_sem_convite';
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleQuickAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      alert('O Nome Completo é obrigatório para cadastrar um novo convidado.');
      return;
    }
    setQuickLoading(true);
    try {
      await savePerson({
        name: quickName.trim(),
        phone: quickPhone.trim(),
      });
      setQuickName('');
      setQuickPhone('');
      setIsQuickAddOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao cadastrar pessoa:', err);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleDeletePerson = async (person: Person) => {
    if (!confirm(`Tem certeza que deseja excluir "${person.name}" da lista de convidados? Essa pessoa será permanentemente removida do evento.`)) return;
    await deletePerson(person.id);
    onRefresh();
  };

  // Função utilitária para capturar todos os integrantes vinculados a uma pessoa (via relationships, family_id e vínculo de telefone)
  const getPersonFamilyMemberIds = (person: Person, allPersons: Person[]): string[] => {
    const familySet = new Set<string>();

    if (person.relationships && person.relationships.length > 0) {
      person.relationships.forEach((r) => {
        if (allPersons.some((p) => p.id === r.target_person_id)) {
          familySet.add(r.target_person_id);
        }
      });
    }

    if (person.family_id) {
      allPersons.forEach((p) => {
        if (p.family_id === person.family_id && p.id !== person.id) {
          familySet.add(p.id);
        }
      });
    }

    allPersons.forEach((p) => {
      if (p.phone_responsible_person_id === person.id && p.id !== person.id) {
        familySet.add(p.id);
      }
    });

    return Array.from(familySet);
  };

  const handleOpenAdd = () => {
    setEditingInvite(null);
    setWizardStep(1);
    setHeadPersonId('');
    setPhone('');
    setInviteType('family');
    setCompanionPersonIds([]);
    setFamilySlotsCount(2);
    setTier('main');
    setIndividualDeadline('');
    setSearchPersonQuery('');
    setIsDirectPersonInvite(false);
    setIsAddOpen(true);
  };

  const handleOpenAddForPerson = (person: Person) => {
    const familyMemberIds = getPersonFamilyMemberIds(person, persons);
    const hasFamily = familyMemberIds.length > 0 || Boolean(person.family_id || person.family_name);

    setEditingInvite(null);
    setWizardStep(1);
    setHeadPersonId(person.id);
    setPhone(person.phone || '');
    setTier('main');
    setIndividualDeadline('');
    setSearchPersonQuery('');
    setIsDirectPersonInvite(true);

    if (hasFamily && familyMemberIds.length > 0) {
      setInviteType('family');
      setCompanionPersonIds(familyMemberIds);
      setFamilySlotsCount(1 + familyMemberIds.length);
    } else if (hasFamily) {
      setInviteType('family');
      setCompanionPersonIds([]);
      setFamilySlotsCount(2);
    } else {
      setInviteType('individual');
      setCompanionPersonIds([]);
      setFamilySlotsCount(1);
    }

    setIsAddOpen(true);
  };

  const handleOpenEdit = (invite: Invite) => {
    setEditingInvite(invite);
    setWizardStep(1);
    setInviteType(invite.invite_type || (invite.companion_person_ids && invite.companion_person_ids.length > 0 ? 'family' : 'individual'));
    setHeadPersonId(invite.head_person_id || '');
    setCompanionPersonIds(invite.companion_person_ids || []);
    setFamilySlotsCount(1 + (invite.companion_person_ids?.length || 0));
    setPhone(invite.phone || '');
    setTier(invite.tier || 'main');
    setIndividualDeadline(invite.individual_deadline ? invite.individual_deadline.slice(0, 10) : '');
    setSearchPersonQuery('');
    setIsDirectPersonInvite(true);
    setIsAddOpen(true);
  };

  const handleSaveInviteForm = async (dispatchWhatsApp: boolean = false) => {
    if (!headPersonId) {
      alert('Selecione o Mandante (titular) do convite para continuar!');
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      alert('O número de telefone com DDD é obrigatório para salvar e enviar o convite pelo WhatsApp.');
      return;
    }

    setLoadingForm(true);

    const headPerson = persons.find((p) => p.id === headPersonId);
    const companions = inviteType === 'individual' ? [] : companionPersonIds;
    const maxGuests = 1 + companions.length;

    try {
      const saved = await saveInvite({
        id: editingInvite ? editingInvite.id : undefined,
        invite_type: inviteType,
        head_person_id: headPersonId,
        companion_person_ids: companions,
        head_name: headPerson ? headPerson.name : 'Convidado',
        phone,
        max_guests: maxGuests,
        table_id: headPerson?.table_id || null,
        tier,
        individual_deadline: individualDeadline ? new Date(individualDeadline).toISOString() : null,
      });

      setIsAddOpen(false);
      onRefresh();

      if (dispatchWhatsApp && saved) {
        await markInviteAsSent(saved.id);
        onRefresh();
        const waUrl = buildWhatsAppLink(saved.head_name, saved.phone, saved.id);
        window.open(waUrl, '_blank');
      }
    } catch (err) {
      console.error('Erro ao salvar convite:', err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handlePromoteToMain = async (invite: Invite) => {
    await promoteInviteToMain(invite.id);
    onRefresh();
  };

  const handleWhatsAppDispatch = async (invite: Invite) => {
    const cleanDigits = invite.phone ? invite.phone.replace(/\D/g, '') : '';
    if (!cleanDigits || cleanDigits.length < 8) {
      alert(
        `O telefone de "${invite.head_name}" está em branco ou incompleto. Informe o número com DDD para realizar o disparo.`
      );
      handleOpenEdit(invite);
      return;
    }

    await markInviteAsSent(invite.id);
    onRefresh();
    const waUrl = buildWhatsAppLink(invite.head_name, invite.phone, invite.id);
    window.open(waUrl, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este convite? As pessoas vinculadas retornarão ao estado de assento sem convite.')) return;
    await deleteInvite(id);
    onRefresh();
  };

  const handleDeleteInviteForPerson = async (person: Person, invite: Invite) => {
    const isHead = invite.head_person_id === person.id || (!invite.head_person_id && invite.head_name.trim().toLowerCase() === person.name.trim().toLowerCase());
    const isCompanion = !isHead && (invite.companion_person_ids?.includes(person.id) || false);

    if (isCompanion) {
      if (!confirm(`Tem certeza que deseja excluir o convite de "${person.name}"? Ela será removida da família e retornará ao status sem convite (mantendo sua mesa).`)) return;

      const newCompanions = (invite.companion_person_ids || []).filter((id) => id !== person.id);
      const newMaxGuests = Math.max(1, 1 + newCompanions.length);

      await saveInvite({
        ...invite,
        companion_person_ids: newCompanions,
        max_guests: newMaxGuests,
      });

      await savePerson({
        ...person,
        invite_id: null,
        role_in_invite: null,
      });

      onRefresh();
    } else {
      if (!confirm(`Tem certeza que deseja excluir o convite de "${person.name}"? As pessoas associadas voltarão ao status sem convite gerado e manterão suas mesas.`)) return;
      await deleteInvite(invite.id);
      onRefresh();
    }
  };

  const handleCopyLink = (token: string) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${siteUrl}/convite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Handlers para Edição Inline (DataTable por Pessoa Física 1:1)
  const handleSavePersonInlineCell = async (person: Person) => {
    if (!editingCell) return;
    const { field, value } = editingCell;

    if (field === 'name') {
      const cleanName = value.trim();
      if (!cleanName) {
        setEditingCell(null);
        return;
      }
      await savePerson({
        ...person,
        name: cleanName,
      });
      if (person.invite_id) {
        const invite = invites.find((i) => i.id === person.invite_id);
        if (invite && invite.head_person_id === person.id) {
          await saveInvite({
            ...invite,
            head_name: cleanName,
          });
        }
      }
    } else if (field === 'phone') {
      await savePerson({
        ...person,
        phone: value,
      });
      if (person.invite_id) {
        const invite = invites.find((i) => i.id === person.invite_id);
        if (invite && invite.head_person_id === person.id) {
          await saveInvite({
            ...invite,
            phone: value,
          });
        }
      }
    }

    setEditingCell(null);
    onRefresh();
  };

  const handleTableChangeForPerson = async (person: Person, newTableId: string) => {
    const tableIdToSave = newTableId === '' ? null : newTableId;
    await savePerson({
      ...person,
      table_id: tableIdToSave,
      seat_number: tableIdToSave ? person.seat_number : null,
    });
    if (person.invite_id) {
      const invite = invites.find((i) => i.id === person.invite_id);
      if (invite && invite.head_person_id === person.id) {
        await saveInvite({
          ...invite,
          table_id: tableIdToSave,
        });
      }
    }
    onRefresh();
  };

  // Helper para gerar mensagem padrão para convites de função especial com PIN de 4 dígitos
  const getDefaultSpecialMessage = (role: SpecialRole, name: string, time: string, token: string) => {
    const siteUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
    const link = token ? `${siteUrl}/convite/${token}` : `${siteUrl}/convite/[link]`;
    const adminUrl = `${siteUrl}/admin`;

    const birthdayPin = config.birthday_person_pin || '1986';
    const assessorPin = config.assessor_pin || '2026';

    if (role === 'ceremonialist') {
      return `Olá ${name || 'Cerimonialista'}! Você é a Cerimonialista/Assessora oficial da Festa de 40 Anos da Fernanda Seppi ✨.\n\nHorário de chegada: ${time || '16:00'}.\n\n👉 Painel de Gestão (Assessoria):\n${adminUrl}\n🔑 Seu PIN de Acesso (4 dígitos): ${assessorPin}\n\n👉 Link Hotsite do Evento:\n${link}\n\nContamos com você!`;
    }
    if (role === 'musician') {
      return `Olá ${name || 'Músico'}! Confirmamos sua apresentação na Festa de 40 Anos da Fernanda Seppi ✨.\n\nO horário recomendado para montagem e passagem de som é às ${time || '15:30'}.\n\nAcesse o link exclusivo do evento:\n👉 ${link}\n\nNos vemos lá!`;
    }
    if (role === 'staff') {
      return `Olá ${name || 'Equipe'}! Convite de equipe/colaborador para a Festa de 40 Anos da Fernanda Seppi ✨.\n\nHorário de chegada: ${time || '16:00'}.\n\nAcesse os detalhes pelo link:\n👉 ${link}`;
    }
    if (role === 'birthday_person') {
      return `Fernanda! Seu convite oficial e acesso exclusivo ao Painel da Festa de 40 Anos ✨.\n\n👉 Painel de Aniversariante:\n${adminUrl}\n🔑 Seu PIN de Acesso (4 dígitos): ${birthdayPin}\n\n👉 Hotsite do Evento:\n${link}`;
    }
    return `Olá ${name}! Você tem um convite especial para a Festa de 40 Anos da Fernanda Seppi ✨.\n\nAcesse: ${link}`;
  };

  const handleOpenSpecialModal = () => {
    setIsSpecialOpen(true);
    setSpecialStep(1);
    setSpecialRole('ceremonialist');
    setSpecialHeadPersonId('');
    setSpecialHeadName('');
    setSpecialPhone('');
    setSpecialArrivalTime('16:00');
    setSpecialCustomMessage(getDefaultSpecialMessage('ceremonialist', 'Cerimonialista', '16:00', ''));
  };

  const handleSaveSpecialForm = async (dispatchWhatsApp: boolean = false) => {
    if (!specialHeadName.trim()) {
      alert('Informe o nome da pessoa ou selecione na lista!');
      return;
    }

    const cleanDigits = specialPhone.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      alert('Informe o telefone WhatsApp com DDD para continuar.');
      return;
    }

    setLoadingForm(true);

    try {
      const targetPerson = persons.find(
        (p) => (specialHeadPersonId && p.id === specialHeadPersonId) || p.name.trim().toLowerCase() === specialHeadName.trim().toLowerCase()
      );

      const saved = await saveInvite({
        id: targetPerson?.invite_id || undefined,
        invite_type: 'individual',
        head_person_id: targetPerson?.id || specialHeadPersonId || undefined,
        head_name: specialHeadName.trim(),
        phone: specialPhone,
        max_guests: 1,
        tier: 'main',
        special_role: specialRole,
        counts_towards_buffet: false, // ISENTO DO BUFFET (Não consome as 100 vagas)
        special_arrival_time: specialArrivalTime,
        custom_whatsapp_message: specialCustomMessage,
      });

      setIsSpecialOpen(false);
      onRefresh();

      if (dispatchWhatsApp && saved) {
        await markInviteAsSent(saved.id);
        onRefresh();
        const siteUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
        const inviteUrl = `${siteUrl}/convite/${saved.id}`;
        const finalMsg = specialCustomMessage.replace('{link}', inviteUrl).replace('[link]', inviteUrl);
        const cleanPhone = formatPhoneE164(saved.phone);
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;
        window.open(waUrl, '_blank');
      }
    } catch (err) {
      console.error('Erro ao salvar convite especial:', err);
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard de Métricas Solicitado (3 Cards Perfeitamente Sincronizados) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CARD 1: LISTA TOTAL DE CONVIDADOS */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              LISTA TOTAL DE CONVIDADOS
            </span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{totalPersons}</span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">pessoas</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" /> WhatsApp Enviado:
              </span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">{sentInvitesPersonsCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Armchair className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Na mesa, a enviar convite:
              </span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{uninvitedSeatedCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Sem mesa (reserva):
              </span>
              <span className="font-extrabold text-slate-500">{unseatedPersonsCount}</span>
            </div>
          </div>
        </div>

        {/* CARD 2: CAPACIDADE DO BUFFET */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              CAPACIDADE DO BUFFET
            </span>
            <Armchair className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{seatedBuffetPersons.length}</span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">/ {buffetCapacity} lugares</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${buffetOccupancyPercent}%` }} />
            </div>
          </div>
          <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Lugares ocupados:
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{seatedBuffetPersons.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Lugares vagos buffet:
              </span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">
                {Math.max(0, buffetCapacity - seatedBuffetPersons.length)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: CONFIRMAÇÕES DE PRESENÇA */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              CONFIRMAÇÕES DE PRESENÇA
            </span>
            <CheckCircle2 className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-sky-600 dark:text-sky-400">{confirmedPersonsCount}</span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">presenças confirmadas</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" /> Disparados no WhatsApp:
              </span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">{sentInvitesPersonsCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Pendentes / Pediram prazo:
              </span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{pendingRsvpCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Não poderão comparecer:
              </span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">{declinedPersonsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SELETOR DE ABAS PRINCIPAIS: LISTA DE CONVIDADOS vs GESTÃO DE CONVITES */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex items-center border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('persons')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'persons'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lista de Convidados ({persons.length} Pessoas Físicas)</span>
        </button>

        <button
          onClick={() => setActiveTab('invites')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'invites'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Convites & Disparos WhatsApp ({invites.length} Convites Ativos)</span>
        </button>
      </div>

      {/* CARD 1: PAINEL SUPERIOR DE AÇÕES E CRIAÇÃO (CTAs) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>{activeTab === 'persons' ? 'Gestão da Lista de Convidados' : 'Gestão de Convites & Disparos WhatsApp'}</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {activeTab === 'persons'
              ? 'Cadastre convidados, informe idades e vincule grupos familiares de parentesco'
              : 'Gere tokens de convite, selecione celulares elegíveis e dispare pelo WhatsApp'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'persons' ? (
            <>
              {(() => {
                const incompleteCount = persons.filter((p) => {
                  const hasOwnPhone = (p.phone || '').replace(/\D/g, '').length >= 8;
                  const hasResp = Boolean(p.phone_responsible_person_id);
                  return !hasOwnPhone && !hasResp;
                }).length;

                return (
                  <button
                    onClick={() => setIsNormalizerOpen(true)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                      incompleteCount > 0
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                        : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-900 dark:text-purple-300" />
                    <span>🧹 Normalizar Base</span>
                    {incompleteCount > 0 ? (
                      <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                        {incompleteCount}
                      </span>
                    ) : (
                      <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                        100%
                      </span>
                    )}
                  </button>
                );
              })()}

              <button
                onClick={() => {
                  setEditModalPerson(null);
                  setIsPersonEditOpen(true);
                }}
                className="min-h-[42px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4 text-emerald-100" /> <span>+ Cadastrar Convidado</span>
              </button>

              <button
                onClick={() => setIsBulkOpen(true)}
                className="min-h-[42px] px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-purple-100" /> <span>Importar em Massa</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleOpenAdd}
                className="min-h-[42px] px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> <span>Novo Convite (Wizard)</span>
              </button>

              <button
                onClick={handleOpenSpecialModal}
                className="min-h-[42px] px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 text-amber-900" /> <span>Convite Especial</span>
              </button>
            </>
          )}

          <a
            href="/og-save-the-date.jpg"
            download="save-the-date-fernanda-seppi.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-600 shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-purple-500" /> <span>Save The Date</span>
          </a>
        </div>
      </div>

      {/* CARD 2: FAIXA DEDICADA DE BUSCA E FILTROS */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Lado Esquerdo: Campo de Busca */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100 min-h-[42px]"
          />
        </div>

        {/* Lado Direito: Filtros de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filtrar:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'uninvited', label: 'Sem Convite' },
            { id: 'confirmed', label: 'Confirmados' },
            { id: 'pending_date', label: 'Pediram Prazo' },
            { id: 'expired', label: 'Prazo Vencido' },
            { id: 'declined', label: 'Não Poderão Ir' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA PRINCIPAL CONFORME A ABA ATIVA */}
      {activeTab === 'persons' ? (
        /* TAB 1: GESTÃO DA LISTA DE CONVIDADOS (PESSOAS FÍSICAS, IDADES & PARENTESCOS) */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[350px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  <th onClick={() => handleSort('name')} className="py-3 px-3 cursor-pointer hover:text-purple-500">
                    Convidado(a) {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-2.5">Telefone (WhatsApp)</th>
                  <th className="py-3 px-2.5">Faixa Etária</th>
                  <th onClick={() => handleSort('family')} className="py-3 px-2.5 cursor-pointer hover:text-purple-500">
                    Família & Parentescos {sortField === 'family' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {(() => {
                  const familyIndexMap = new Map<string, number>();
                  let familyCounter = 0;
                  sortedPersons.forEach((p) => {
                    const famKey = p.family_id || p.family_name || (p.relationships && p.relationships.length > 0 ? `fam-rel-${p.id}` : null);
                    if (famKey && !familyIndexMap.has(famKey)) {
                      familyIndexMap.set(famKey, familyCounter++);
                    }
                  });

                  if (sortedPersons.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          Nenhum convidado encontrado na busca ou filtro selecionado.
                        </td>
                      </tr>
                    );
                  }

                  return sortedPersons.map((person) => {
                    const childCat = calculateChildCategory(person.age, config);
                    const hasFamily = Boolean(person.family_name || person.family_id || (person.relationships && person.relationships.length > 0));
                    const famKey = person.family_id || person.family_name || (person.relationships && person.relationships.length > 0 ? `fam-rel-${person.id}` : null);
                    const famIndex = famKey !== null ? familyIndexMap.get(famKey) : null;
                    const isZebraEven = famIndex !== undefined && famIndex !== null && famIndex % 2 === 0;

                    const rowBgClass = sortField === 'family' && famIndex !== null && famIndex !== undefined
                      ? isZebraEven
                        ? 'bg-purple-950/25 dark:bg-purple-950/35 hover:bg-purple-900/40 border-l-4 border-l-purple-500/60'
                        : 'bg-slate-900/50 dark:bg-slate-900/60 hover:bg-slate-800/70 border-l-4 border-l-slate-700/60'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30';

                    return (
                      <tr key={person.id} className={`transition-colors ${rowBgClass}`}>
                        {/* Nome */}
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <span>{person.name}</span>
                            {person.special_role && person.special_role !== 'guest' && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300">
                                {person.special_role}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Telefone (Editável Inline ou Vinculado a Responsável) */}
                        <td className="py-3 px-2.5 font-medium text-slate-600 dark:text-slate-300">
                          {(() => {
                            if (editingPhonePersonId === person.id) {
                              return (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={tempPhone}
                                    onChange={(e) => setTempPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="w-32 px-2 py-1 bg-slate-900 border border-purple-500 rounded text-[11px] font-mono text-white focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={async () => {
                                      await savePerson({ ...person, phone: tempPhone });
                                      setEditingPhonePersonId(null);
                                      onRefresh();
                                    }}
                                    className="p-1 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                                    title="Salvar Telefone"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingPhonePersonId(null)}
                                    className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            }

                            const hasOwnPhone = (person.phone || '').replace(/\D/g, '').length >= 8;
                            const respPerson = person.phone_responsible_person_id
                              ? persons.find((p) => p.id === person.phone_responsible_person_id)
                              : null;

                            if (hasOwnPhone) {
                              return (
                                <div
                                  onClick={() => {
                                    setEditingPhonePersonId(person.id);
                                    setTempPhone(person.phone || '');
                                  }}
                                  className="inline-flex items-center gap-1.5 font-mono text-[11px] cursor-pointer hover:text-purple-400 transition-colors group"
                                  title="Clique para editar o telefone"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{formatPhoneDisplay(person.phone || '')}</span>
                                  <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              );
                            }

                            if (respPerson) {
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-bold border border-purple-500/30 flex items-center gap-1">
                                    <Link2 className="w-3 h-3 text-purple-400" />
                                    <span>Resp: {respPerson.name.split(' ')[0]}</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setPhoneLinkModalPerson(person);
                                      setSelectedPhoneRespId(person.phone_responsible_person_id || '');
                                      setIsPhoneLinkModalOpen(true);
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-purple-400 underline cursor-pointer"
                                    title="Alterar pessoa responsável pelo WhatsApp"
                                  >
                                    Alterar
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingPhonePersonId(person.id);
                                    setTempPhone('');
                                  }}
                                  className="text-[10px] bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" /> Celular
                                </button>

                                <button
                                  onClick={() => {
                                    setPhoneLinkModalPerson(person);
                                    setSelectedPhoneRespId('');
                                    setIsPhoneLinkModalOpen(true);
                                  }}
                                  className="text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-2 py-1 rounded font-bold border border-purple-500/30 flex items-center gap-1 cursor-pointer"
                                  title="Vincular a uma pessoa que possui celular cadastrado"
                                >
                                  <Link2 className="w-3 h-3" /> Vincular Wpp
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Faixa Etária (Select Inline) */}
                        <td className="py-3 px-2.5">
                          <select
                            value={childCat}
                            onChange={async (e) => {
                              const newCat = e.target.value as ChildCategory;
                              let targetAge = person.age;
                              if (newCat === 'isento') targetAge = config.child_free_max_age || 3;
                              else if (newCat === 'meia') targetAge = config.child_half_max_age || 8;
                              else if (newCat === 'inteira') targetAge = person.age && person.age >= 12 ? person.age : 30;

                              await savePerson({
                                ...person,
                                child_category: newCat,
                                age: targetAge,
                                type: newCat === 'inteira' ? 'adult' : 'child',
                              });
                              onRefresh();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none transition-all ${
                              childCat === 'isento'
                                ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                : childCat === 'meia'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            <option value="isento">Isento (0-{config.child_free_max_age || 5} anos)</option>
                            <option value="meia">Meia-Entrada ({(config.child_free_max_age || 5) + 1}-{config.child_half_max_age || 11} anos)</option>
                            <option value="inteira">Inteira / Adulto (12+ anos)</option>
                          </select>
                        </td>

                        {/* Família & Parentescos (Clean Badge) */}
                        <td className="py-3 px-2.5">
                          {hasFamily ? (
                            <button
                              onClick={() => {
                                setRelationshipModalPerson(person);
                                setIsRelationshipOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-lg font-extrabold text-[11px] border border-purple-300 dark:border-purple-800 shadow-sm transition-all cursor-pointer group"
                              title="Clique para gerenciar a família e parentescos"
                            >
                              <Home className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                              <span>{person.family_name || 'Grupo Familiar'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setRelationshipModalPerson(person);
                                setIsRelationshipOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 text-purple-700 dark:bg-slate-800 dark:hover:bg-purple-950 text-[10px] font-extrabold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Link2 className="w-3 h-3 text-purple-500" />
                              <span>+ Relacionar</span>
                            </button>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditModalPerson(person);
                                setIsPersonEditOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                              title="Editar Convidado"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setRelationshipModalPerson(person);
                                setIsRelationshipOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                              title="Vincular Parentesco"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePerson(person)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Excluir Convidado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: TABELA DE GESTÃO DE CONVITES & DISPAROS WHATSAPP (DATATABLE 360º) */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[350px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-3 cursor-pointer hover:text-purple-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Nome</span>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2.5">Telefone</th>
                  <th
                    onClick={() => handleSort('invite_type')}
                    className="py-3 px-2.5 cursor-pointer hover:text-purple-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tipo</span>
                      {sortField === 'invite_type' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('table')}
                    className="py-3 px-2.5 cursor-pointer hover:text-purple-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Mesa</span>
                      {sortField === 'table' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center">Convite</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-2.5 cursor-pointer hover:text-purple-600 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {sortedPersons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Nenhum convidado encontrado na busca ou filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  sortedPersons.map((person, index) => {
                    const invite = invites.find(
                      (i) => i.id === person.invite_id || i.head_person_id === person.id || i.companion_person_ids?.includes(person.id)
                    );
                    const headPerson = invite?.head_person_id ? persons.find((p) => p.id === invite.head_person_id) : null;
                    const isHead = invite ? (invite.head_person_id === person.id || (!invite.head_person_id && invite.head_name.trim().toLowerCase() === person.name.trim().toLowerCase())) : false;
                    const isCompanion = !isHead && invite?.companion_person_ids?.includes(person.id);

                    const deadlineInfo = invite ? getDeadlineInfo(invite, config.deadline_rsvp) : { expired: false, label: 'Pendente', color: 'bg-slate-100 text-slate-700 border-slate-300' };
                    const isSent = invite?.sent_status === 'sent';
                    const currentTableId = person.table_id || '';

                    const isEditingName = editingCell?.inviteId === person.id && editingCell?.field === 'name';
                    const isEditingPhone = editingCell?.inviteId === person.id && editingCell?.field === 'phone';

                    const guestObj = invite?.guests?.find((g) => g.name.trim().toLowerCase() === person.name.trim().toLowerCase());
                    const rsvpStatus = guestObj?.status || invite?.status || 'pending';
                    const openUpwards = index >= sortedPersons.length - 3 && sortedPersons.length > 2;

                    return (
                      <tr key={person.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 px-3 min-w-[150px]">
                          {isEditingName ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSavePersonInlineCell(person);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-purple-500 rounded-lg text-xs font-bold focus:outline-none"
                              />
                              <button
                                onClick={() => handleSavePersonInlineCell(person)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                title="Salvar Nome"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="group flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                  {person.name}
                                </span>
                                {invite && isHead && invite.invite_type === 'family' && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                    Titular
                                  </span>
                                )}
                                {invite && isCompanion && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-slate-500">
                                    Família
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setEditingCell({ inviteId: person.id, field: 'name', value: person.name })}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-purple-600 transition-opacity cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-2.5 min-w-[130px]">
                          {isEditingPhone ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSavePersonInlineCell(person);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-purple-500 rounded-lg text-xs font-bold focus:outline-none"
                              />
                              <button
                                onClick={() => handleSavePersonInlineCell(person)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                title="Salvar Telefone"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="group flex items-center justify-between gap-1">
                              <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                {person.phone ? formatPhoneDisplay(person.phone) : <span className="text-slate-400 italic font-sans text-[10px]">Sem número</span>}
                              </span>
                              <button
                                onClick={() => setEditingCell({ inviteId: person.id, field: 'phone', value: person.phone || '' })}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-purple-600 transition-opacity cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-2.5">
                          {invite ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                              {invite.invite_type === 'individual' ? 'Individual' : `Família (${1 + (invite.companion_person_ids?.length || 0)})`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Individual</span>
                          )}
                        </td>

                        <td className="py-2.5 px-2.5 min-w-[140px]">
                          <select
                            value={currentTableId}
                            onChange={(e) => handleTableChangeForPerson(person, e.target.value)}
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                          >
                            <option value="">-- Sem Mesa --</option>
                            {tables.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({persons.filter((p) => p.table_id === t.id).length}/{t.capacity})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          {invite ? (
                            <button
                              onClick={() => handleWhatsAppDispatch(invite)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center ${
                                isSent
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300'
                                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300'
                              }`}
                              title={isSent ? 'Convite já enviado no WhatsApp (Clique para re-enviar)' : 'Enviar convite no WhatsApp'}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAddForPerson(person)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-black cursor-pointer shadow-sm transition-all"
                            >
                              + Convite
                            </button>
                          )}
                        </td>

                        <td className="py-2.5 px-2.5">
                          {invite ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                rsvpStatus === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : rsvpStatus === 'declined'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                  : rsvpStatus === 'pending_date'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {rsvpStatus === 'confirmed' && '🎉 Confirmado'}
                              {rsvpStatus === 'declined' && '😔 Não Vai'}
                              {rsvpStatus === 'pending_date' && '🤔 Pediu Prazo'}
                              {rsvpStatus === 'pending' && '⏳ Pendente'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sem Convite</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === person.id ? null : person.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                            >
                              <span>Ações</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {openDropdownId === person.id && (
                              <div className={`absolute right-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs animate-fade-in ${
                                openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
                              }`}>
                                {invite && (
                                  <button
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      handleOpenEdit(invite);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 text-purple-500" />
                                    <span>Editar Convite (Wizard)</span>
                                  </button>
                                )}

                                {invite && (
                                  <button
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      handleCopyLink(invite.id);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    {copiedToken === invite.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
                                    <span>{copiedToken === invite.id ? 'Link Copiado!' : 'Copiar Link Hotsite'}</span>
                                  </button>
                                )}

                                {invite && (
                                  <a
                                    href={`/convite/${invite.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setOpenDropdownId(null)}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 block cursor-pointer"
                                  >
                                    <ExternalLink className="w-4 h-4 text-blue-500" />
                                    <span>Acessar Hotsite</span>
                                  </a>
                                )}

                                {person.table_id && (
                                  <button
                                    onClick={async () => {
                                      setOpenDropdownId(null);
                                      await unassignPersonSeat(person.id);
                                      onRefresh();
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <Armchair className="w-4 h-4 text-amber-500" />
                                    <span>Desalocar da Mesa</span>
                                  </button>
                                )}

                                <button
                                  onClick={async () => {
                                    setOpenDropdownId(null);
                                    await handleDeletePerson(person);
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                  <span>Excluir Convidado da Lista</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINT 5: MODAL WIZARD STEP-BY-STEP PARA NOVO / EDITAR CONVITE */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
            {/* Header do Wizard com Barra de Progresso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-xs">
                    {wizardStep}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    {(() => {
                      const selP = persons.find((p) => p.id === headPersonId);
                      const isSent = editingInvite && editingInvite.sent_status === 'sent';
                      const prefix = isSent ? 'Editar Convite' : 'Gerar Convite';
                      return selP ? `${prefix} - ${selP.name}` : prefix;
                    })()}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Indicador de Passos */}
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-slate-400">
                <span className={wizardStep >= 1 ? 'text-purple-500 font-black' : ''}>1. Tipo</span>
                {(!isDirectPersonInvite || !headPersonId) && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className={wizardStep >= 2 ? 'text-purple-500 font-black' : ''}>2. Responsável</span>
                  </>
                )}
                <span className="text-slate-600">•</span>
                <span className={wizardStep >= 3 ? 'text-purple-500 font-black' : ''}>
                  {isDirectPersonInvite && headPersonId ? '2.' : '3.'} Contato
                </span>
                {inviteType === 'family' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className={wizardStep >= 4 ? 'text-purple-500 font-black' : ''}>
                      {isDirectPersonInvite && headPersonId ? '3.' : '4.'} Integrantes
                    </span>
                  </>
                )}
                <span className="text-slate-600">•</span>
                <span className={wizardStep === (inviteType === 'family' ? 5 : 4) ? 'text-purple-500 font-black' : ''}>
                  Final. Revisar
                </span>
              </div>
            </div>

            {/* CORPO DO PASSO ATUAL DO WIZARD */}

            {/* PASSO 1: Seleção do Tipo de Convite (Individual vs Família) */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                {headPersonId && (() => {
                  const headP = persons.find((p) => p.id === headPersonId);
                  const headTable = headP ? tables.find((t) => t.id === headP.table_id) : null;
                  return (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-purple-400 uppercase font-black tracking-wider">Convidado Titular / Responsável</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>{headP?.name || 'Titular'}</span>
                            {headTable ? (
                              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                {headTable.name}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDirectPersonInvite(false);
                          setWizardStep(2);
                        }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                      >
                        Trocar titular
                      </button>
                    </div>
                  );
                })()}

                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selecione o tipo de experiência para este disparo:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteType('individual')}
                    className={`p-4 rounded-2xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                      inviteType === 'individual'
                        ? 'border-purple-600 bg-purple-500/10 text-purple-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <User className="w-6 h-6 text-purple-500" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Convite Individual</h4>
                      <p className="text-[10px] text-slate-400">1 convidado (1:1 com assento)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteType('family')}
                    className={`p-4 rounded-2xl border-2 text-left space-y-2 transition-all cursor-pointer ${
                      inviteType === 'family'
                        ? 'border-purple-600 bg-purple-500/10 text-purple-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Users className="w-6 h-6 text-purple-500" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Convite Família</h4>
                      <p className="text-[10px] text-slate-400">Responsável + acompanhantes</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: Buscar Convidado ou Responsável da Família por Digitação */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {inviteType === 'individual'
                    ? 'Selecione o convidado na lista:'
                    : 'Quem irá confirmar a presença dos outros convidados? (Responsável/Mandante):'}
                </label>

                {/* Campo de Busca por Caractere Digitado */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Digite para buscar nome (ex: Ana, Carlos, Barreto)..."
                    value={searchPersonQuery}
                    onChange={(e) => setSearchPersonQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(() => {
                    const availablePersons = persons.filter(
                      (p) => p.role_in_invite !== 'companion'
                    );
                    const filtered = availablePersons.filter((p) =>
                      p.name.toLowerCase().includes(searchPersonQuery.toLowerCase().trim())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-6 text-xs text-slate-400">
                          Nenhum convidado encontrado para &quot;<strong className="text-white">{searchPersonQuery}</strong>&quot;.
                        </div>
                      );
                    }

                    return filtered.map((p) => {
                      const table = tables.find((t) => t.id === p.table_id);
                      const hasExistingInvite = invites.some((inv) => inv.id === p.invite_id || inv.head_person_id === p.id);

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setHeadPersonId(p.id);
                            const existingInvite = invites.find(
                              (inv) => inv.id === p.invite_id || inv.head_person_id === p.id
                            );
                            if (existingInvite) {
                              setEditingInvite(existingInvite);
                              if (inviteType !== 'family') {
                                setInviteType(
                                  existingInvite.invite_type ||
                                    (existingInvite.companion_person_ids && existingInvite.companion_person_ids.length > 0 ? 'family' : 'individual')
                                );
                              }
                              setCompanionPersonIds(existingInvite.companion_person_ids || []);
                              setFamilySlotsCount(Math.max(2, 1 + (existingInvite.companion_person_ids?.length || 0)));
                              setPhone(existingInvite.phone || p.phone || '');
                              setTier(existingInvite.tier || 'main');
                              setIndividualDeadline(existingInvite.individual_deadline ? existingInvite.individual_deadline.slice(0, 10) : '');
                            } else {
                              setEditingInvite(null);
                              setPhone(p.phone || '');
                              const familyMemberIds = getPersonFamilyMemberIds(p, persons);
                              const hasFamily = familyMemberIds.length > 0 || Boolean(p.family_id || p.family_name);

                              if (hasFamily && familyMemberIds.length > 0) {
                                setInviteType('family');
                                setCompanionPersonIds(familyMemberIds);
                                setFamilySlotsCount(1 + familyMemberIds.length);
                              } else if (hasFamily) {
                                setInviteType('family');
                                setCompanionPersonIds([]);
                                setFamilySlotsCount(2);
                              } else {
                                setInviteType('individual');
                                setCompanionPersonIds([]);
                                setFamilySlotsCount(1);
                              }
                            }
                          }}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            headPersonId === p.id
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {table ? (
                              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-medium">
                                {table.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-medium">-- Sem Mesa --</span>
                            )}
                            {hasExistingInvite && (
                              <span className="text-[9px] bg-purple-400/20 text-purple-300 px-1.5 py-0.5 rounded font-black border border-purple-400/30">
                                Convite Gerado
                              </span>
                            )}
                          </div>
                          {headPersonId === p.id && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Atribuição Opcional de Mesa no Wizard */}
                {headPersonId && (() => {
                  const selectedHeadP = persons.find((p) => p.id === headPersonId);
                  const selectedHeadTable = tables.find((t) => t.id === selectedHeadP?.table_id);

                  return (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Armchair className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Mesa do Convidado (Opcional):</span>
                        </span>
                        {selectedHeadTable ? (
                          <span className="text-emerald-500 font-extrabold">{selectedHeadTable.name}</span>
                        ) : (
                          <span className="text-amber-400 font-medium italic">Sem Mesa (Reserva)</span>
                        )}
                      </div>
                      <select
                        value={selectedHeadP?.table_id || ''}
                        onChange={async (e) => {
                          const newTId = e.target.value;
                          await savePerson({ ...selectedHeadP, table_id: newTId || null });
                          onRefresh();
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Sem Mesa (Reserva) --</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.capacity} lugares)
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* PASSO 3: Confirmar Contato / Telefone WhatsApp com DDD */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirme o número de contato WhatsApp (com DDD) *
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Exibe o número cadastrado ou em branco. <strong>Só permite seguir se houver número válido com DDD.</strong>
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11999998888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                {phone.replace(/\D/g, '').length < 8 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Por favor, digite um telefone com DDD válido para avançar no disparo do WhatsApp.</span>
                  </div>
                )}
              </div>
            )}

            {/* PASSO 4 (Família): SLOTS EM BRANCO PARA CADA ACOMPANHANTE & VALIDAÇÃO LISTA COMPLETA */}
            {wizardStep === 4 && inviteType === 'family' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selecione quantos convites a família terá:
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={familySlotsCount}
                    onChange={(e) => {
                      const newCount = Math.max(2, parseInt(e.target.value, 10) || 2);
                      setFamilySlotsCount(newCount);
                      // Ajusta array de acompanhantes
                      const reqCompanions = newCount - 1;
                      if (companionPersonIds.length > reqCompanions) {
                        setCompanionPersonIds(companionPersonIds.slice(0, reqCompanions));
                      }
                    }}
                    className="w-20 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-center text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Slots Individuais para Acompanhantes */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Selecione os outros {familySlotsCount - 1} convidado(s) para os slots da família:
                  </label>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {Array.from({ length: familySlotsCount - 1 }).map((_, slotIndex) => {
                      const currentSelectedId = companionPersonIds[slotIndex] || '';
                      const selectedPerson = persons.find((p) => p.id === currentSelectedId);

                      // Lista de pessoas disponíveis para esta vaga (exclui o mandante e acompanhantes já escolhidos em outros slots)
                      const availableForThisSlot = persons.filter((p) => {
                        if (p.id === headPersonId) return false;
                        if (p.id === currentSelectedId) return true;
                        if (companionPersonIds.includes(p.id)) return false;
                        return p.role_in_invite !== 'companion' || p.invite_id === editingInvite?.id;
                      });

                      return (
                        <div
                          key={slotIndex}
                          className={`p-3 rounded-2xl border transition-all space-y-2 ${
                            selectedPerson
                              ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400 uppercase text-[10px]">
                              Acompanhante #{slotIndex + 1} da Família
                            </span>
                            {selectedPerson ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-extrabold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completo
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[10px] italic">Em branco (pendente)</span>
                            )}
                          </div>

                          <select
                            value={currentSelectedId}
                            onChange={async (e) => {
                              const chosenId = e.target.value;
                              const updatedCompanions = [...companionPersonIds];
                              updatedCompanions[slotIndex] = chosenId;
                              setCompanionPersonIds(updatedCompanions);

                              // Se a pessoa escolhida não tiver mesa, herda a mesa do mandante
                              if (chosenId) {
                                const chosenP = persons.find((p) => p.id === chosenId);
                                const headP = persons.find((p) => p.id === headPersonId);
                                if (chosenP && headP?.table_id && !chosenP.table_id) {
                                  await savePerson({ ...chosenP, table_id: headP.table_id });
                                  onRefresh();
                                }
                              }
                            }}
                            className={`w-full p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none ${
                              selectedPerson
                                ? 'bg-purple-900/60 text-white border-purple-400'
                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <option value="">-- Selecionar Convidado para o Slot #{slotIndex + 1} --</option>
                            {availableForThisSlot.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.table_id ? `(Mesa: ${tables.find((t) => t.id === p.table_id)?.name})` : '(Sem Mesa)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  {/* Banner de Validação da Lista Completa */}
                  {(() => {
                    const reqCompanions = familySlotsCount - 1;
                    const filledCount = companionPersonIds.filter(Boolean).length;
                    const isFullyComplete = filledCount === reqCompanions;

                    if (isFullyComplete) {
                      return (
                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Lista da Família Completa! Todos os {familySlotsCount} integrantes foram definidos com sucesso.</span>
                        </div>
                      );
                    }

                    return (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Preencha os {reqCompanions - filledCount} slot(s) em branco restantes para avançar.</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* PASSO FINAL: Definição de Prazo Limite & Revisão de Mensagem */}
            {((wizardStep === 4 && inviteType === 'individual') || (wizardStep === 5 && inviteType === 'family')) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Defina a data limite de resposta (opcional):
                  </label>
                  <input
                    type="date"
                    value={individualDeadline}
                    onChange={(e) => setIndividualDeadline(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Prévia da Mensagem do WhatsApp:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {inviteType === 'individual' ? (
                      <>
                        &quot;Olá <strong>{(persons.find((p) => p.id === headPersonId)?.name) || 'Convidado'}</strong>! Você foi convidado(a) para a Festa de 40 Anos da Fernanda Seppi ✨. Confirme sua presença pelo link:&quot;
                      </>
                    ) : (
                      <>
                        &quot;Olá <strong>{(persons.find((p) => p.id === headPersonId)?.name) || 'Responsável'}</strong>! Você e sua família foram convidados para a Festa de 40 Anos da Fernanda Seppi ✨. Acesse o link para confirmar a presença de todos:&quot;
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* NAVEGAÇÃO DOS BOTÕES DO WIZARD (ANTERIOR / PRÓXIMO / SALVAR) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setWizardStep(
                      wizardStep === 3 && headPersonId && isDirectPersonInvite ? 1 : wizardStep - 1
                    )
                  }
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {wizardStep < (inviteType === 'family' ? 5 : 4) ? (
                  <button
                    type="button"
                    disabled={
                      (wizardStep === 1 && !headPersonId && isDirectPersonInvite) ||
                      (wizardStep === 2 && !headPersonId) ||
                      (wizardStep === 3 && phone.replace(/\D/g, '').length < 8) ||
                      (wizardStep === 4 && inviteType === 'family' && companionPersonIds.filter(Boolean).length < (familySlotsCount - 1))
                    }
                    onClick={() =>
                      setWizardStep(
                        wizardStep === 1 && headPersonId && isDirectPersonInvite ? 3 : wizardStep + 1
                      )
                    }
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>Avançar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={loadingForm}
                      onClick={() => handleSaveInviteForm(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Salvar Apenas
                    </button>

                    <button
                      type="button"
                      disabled={loadingForm}
                      onClick={() => handleSaveInviteForm(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-amber-300" />
                      <span>Salvar & Enviar WhatsApp</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importador em Massa */}
      <BulkImporter isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} onSuccess={onRefresh} />

      {/* MODAL WIZARD CURTO DE CONVITES ESPECIAIS (FUNÇÃO / STAFF) */}
      {isSpecialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-amber-500/30 transition-all">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center font-black text-xs">
                    {specialStep}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>Convite Especial (Função / Staff)</span>
                  </h3>
                </div>
                <button
                  onClick={() => setIsSpecialOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Indicador de Passos */}
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-slate-400">
                <span className={specialStep >= 1 ? 'text-amber-500 font-black' : ''}>1. Função</span>
                <span className="text-slate-600">•</span>
                <span className={specialStep >= 2 ? 'text-amber-500 font-black' : ''}>2. Nome & Contato</span>
                <span className="text-slate-600">•</span>
                <span className={specialStep === 3 ? 'text-amber-500 font-black' : ''}>3. Horário & Mensagem</span>
              </div>
            </div>

            {/* CORPO DOS PASSOS */}

            {/* PASSO 1: Seleção da Função Especial */}
            {specialStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selecione o papel especial (Convites de função não consomem cota do buffet):
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSpecialRole('ceremonialist');
                      setSpecialCustomMessage(getDefaultSpecialMessage('ceremonialist', specialHeadName, specialArrivalTime, ''));
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left space-y-1.5 transition-all cursor-pointer ${
                      specialRole === 'ceremonialist'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Star className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Cerimonialista / Assessora</h4>
                      <p className="text-[10px] text-slate-400">Organização da festa (ex: Irmã)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpecialRole('musician');
                      setSpecialCustomMessage(getDefaultSpecialMessage('musician', specialHeadName, '15:30', ''));
                      setSpecialArrivalTime('15:30');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left space-y-1.5 transition-all cursor-pointer ${
                      specialRole === 'musician'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Music className="w-5 h-5 text-sky-500" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Músico / Banda</h4>
                      <p className="text-[10px] text-slate-400">Passagem de som e show</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpecialRole('staff');
                      setSpecialCustomMessage(getDefaultSpecialMessage('staff', specialHeadName, specialArrivalTime, ''));
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left space-y-1.5 transition-all cursor-pointer ${
                      specialRole === 'staff'
                        ? 'border-slate-500 bg-slate-500/10 text-slate-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 text-slate-400" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Equipe / Staff</h4>
                      <p className="text-[10px] text-slate-400">Fotografia, DJ ou apoio</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpecialRole('birthday_person');
                      setSpecialCustomMessage(getDefaultSpecialMessage('birthday_person', 'Fernanda Seppi', specialArrivalTime, ''));
                      setSpecialHeadName('Fernanda Seppi');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left space-y-1.5 transition-all cursor-pointer ${
                      specialRole === 'birthday_person'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Crown className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Aniversariante</h4>
                      <p className="text-[10px] text-slate-400">Fernanda Seppi (Anfitriã)</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: Nome e Telefone WhatsApp */}
            {specialStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo do Profissional / Convidado Especial:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Patricia Domingos ou Músico Roberto"
                    value={specialHeadName}
                    onChange={(e) => {
                      setSpecialHeadName(e.target.value);
                      setSpecialCustomMessage(getDefaultSpecialMessage(specialRole, e.target.value, specialArrivalTime, ''));
                    }}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone WhatsApp (com DDD): *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11999998888"
                    value={specialPhone}
                    onChange={(e) => setSpecialPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* PASSO 3: Horário Especial & Mensagem Editável */}
            {specialStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário Recomendado de Chegada:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 15:30 para passagem de som"
                    value={specialArrivalTime}
                    onChange={(e) => {
                      setSpecialArrivalTime(e.target.value);
                      setSpecialCustomMessage(getDefaultSpecialMessage(specialRole, specialHeadName, e.target.value, ''));
                    }}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mensagem do WhatsApp (Totalmente Editável):
                    </label>
                    <span className="text-[10px] text-amber-500 font-bold">Editável</span>
                  </div>
                  <textarea
                    rows={5}
                    value={specialCustomMessage}
                    onChange={(e) => setSpecialCustomMessage(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* NAVEGAÇÃO DO WIZARD ESPECIAIS */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {specialStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setSpecialStep(specialStep - 1)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {specialStep < 3 ? (
                  <button
                    type="button"
                    disabled={specialStep === 2 && (!specialHeadName.trim() || specialPhone.replace(/\D/g, '').length < 8)}
                    onClick={() => setSpecialStep(specialStep + 1)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>Avançar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={loadingForm}
                      onClick={() => handleSaveSpecialForm(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Salvar Apenas
                    </button>

                    <button
                      type="button"
                      disabled={loadingForm}
                      onClick={() => handleSaveSpecialForm(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-amber-300" />
                      <span>Salvar & Enviar WhatsApp</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rápido: Adicionar Nome à Lista */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    Adicionar Nome à Lista
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre um novo convidado na lista de presença do evento
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddPerson} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Silva"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone WhatsApp <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 11999998888"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickLoading || !quickName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-100" />
                  <span>Adicionar à Lista</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VÍNCULO DE TELEFONE RESPONSÁVEL (PARA QUEM NÃO TEM CELULAR) */}
      {isPhoneLinkModalOpen && phoneLinkModalPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    Vincular Responsável pelo WhatsApp
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Para: <strong className="text-purple-400">{phoneLinkModalPerson.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPhoneLinkModalOpen(false);
                  setPhoneLinkModalPerson(null);
                }}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Esta pessoa não possui celular próprio (ex: idoso, criança). Selecione abaixo qual convidado da lista que <strong>possua celular cadastrado</strong> será responsável por receber o convite no WhatsApp e confirmar a presença por ela:
              </p>

              <select
                value={selectedPhoneRespId}
                onChange={(e) => setSelectedPhoneRespId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Selecionar Convidado com Celular --</option>
                {persons
                  .filter((p) => p.id !== phoneLinkModalPerson.id && (p.phone || '').replace(/\D/g, '').length >= 8)
                  .map((p) => {
                    const table = tables.find((t) => t.id === p.table_id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatPhoneDisplay(p.phone || '')} {table ? `(Mesa: ${table.name})` : ''}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {phoneLinkModalPerson.phone_responsible_person_id ? (
                <button
                  type="button"
                  onClick={async () => {
                    await linkPersonPhoneResponsible(phoneLinkModalPerson.id, null);
                    setIsPhoneLinkModalOpen(false);
                    setPhoneLinkModalPerson(null);
                    onRefresh();
                  }}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Desvincular
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneLinkModalOpen(false);
                    setPhoneLinkModalPerson(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!selectedPhoneRespId}
                  onClick={async () => {
                    try {
                      await linkPersonPhoneResponsible(phoneLinkModalPerson.id, selectedPhoneRespId);
                      setIsPhoneLinkModalOpen(false);
                      setPhoneLinkModalPerson(null);
                      onRefresh();
                    } catch (err: any) {
                      alert(err.message || 'Erro ao vincular responsável.');
                    }
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Vínculo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VÍNCULO DE PARENTESCO & GRUPO FAMILIAR */}
      <PersonRelationshipModal
        person={relationshipModalPerson}
        allPersons={persons}
        isOpen={isRelationshipOpen}
        onClose={() => setIsRelationshipOpen(false)}
        onRefresh={onRefresh}
      />

      {/* MODAL DE CADASTRO / EDIÇÃO COMPLETA DE CONVIDADO */}
      <PersonEditModal
        person={editModalPerson}
        config={config}
        isOpen={isPersonEditOpen}
        onClose={() => setIsPersonEditOpen(false)}
        onRefresh={onRefresh}
      />

      {/* MODAL NORMALIZADOR DE DADOS CADASTRAIS (PRODUTIVIDADE EM LOTE) */}
      <DataNormalizerModal
        isOpen={isNormalizerOpen}
        onClose={() => setIsNormalizerOpen(false)}
        persons={persons}
        tables={tables}
        config={config}
        onRefresh={onRefresh}
      />
    </div>
  );
}
