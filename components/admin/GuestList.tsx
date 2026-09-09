'use client';

import React, { useState } from 'react';
import { Invite, Table, EventConfig, InviteTier, Person, SpecialRole } from '@/types';
import { saveInvite, deleteInvite, markInviteAsSent, promoteInviteToMain, savePerson, deletePerson, unassignPersonSeat, resetAllInvitesData } from '@/lib/db';
import { buildWhatsAppLink, formatPhoneDisplay, getDeadlineInfo, formatDateShort, exportInvitesToCSV, downloadExcelTemplate, formatPhoneE164 } from '@/lib/utils';
import { BulkImporter } from './BulkImporter';
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
  Download,
  FileSpreadsheet,
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
} from 'lucide-react';

interface GuestListProps {
  invites: Invite[];
  tables: Table[];
  persons: Person[];
  config: EventConfig;
  onRefresh: () => void;
}

export function GuestList({ invites, tables, persons, config, onRefresh }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'main' | 'reserve' | 'sent' | 'not_sent' | 'confirmed' | 'pending' | 'pending_date' | 'expired' | 'declined'>('all');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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

  // Estados do Wizard Curto para Convites Especiais (Funções / Staff)
  const [isSpecialOpen, setIsSpecialOpen] = useState(false);
  const [specialStep, setSpecialStep] = useState<number>(1);
  const [specialRole, setSpecialRole] = useState<SpecialRole>('ceremonialist');
  const [specialHeadPersonId, setSpecialHeadPersonId] = useState('');
  const [specialHeadName, setSpecialHeadName] = useState('');
  const [specialPhone, setSpecialPhone] = useState('');
  const [specialArrivalTime, setSpecialArrivalTime] = useState('16:00');
  const [specialCustomMessage, setSpecialCustomMessage] = useState('');

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

  // Pessoas elegíveis para convite (Com mesa atribuída)
  const seatedPersonsEligibleForInvite = persons.filter(
    (p) => p.table_id && (!p.invite_id || p.invite_id === editingInvite?.id)
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
    if (statusFilter === 'main') return !invite?.tier || invite.tier === 'main';
    if (statusFilter === 'reserve') return invite?.tier === 'reserve' || !person.table_id;
    if (statusFilter === 'sent') return invite?.sent_status === 'sent';
    if (statusFilter === 'not_sent') return !invite?.sent_status || invite.sent_status === 'not_sent';

    const guestObj = invite?.guests?.find((g) => g.name.trim().toLowerCase() === person.name.trim().toLowerCase());
    const isConfirmed = (guestObj && guestObj.status === 'confirmed') || (invite && invite.status === 'confirmed');
    const isDeclined = (guestObj && guestObj.status === 'declined') || (invite && invite.status === 'declined');
    const isPendingDate = (guestObj && guestObj.status === 'pending_date') || (invite && invite.status === 'pending_date');

    if (statusFilter === 'confirmed') return isConfirmed;
    if (statusFilter === 'declined') return isDeclined;
    if (statusFilter === 'pending') return !isConfirmed && !isDeclined && !isPendingDate;
    if (statusFilter === 'pending_date') return isPendingDate;
    if (statusFilter === 'expired') {
      const deadlineInfo = invite ? getDeadlineInfo(invite, config.deadline_rsvp) : { expired: false, label: 'Pendente', color: '' };
      return deadlineInfo.expired;
    }

    return true;
  });

  const handleOpenAdd = () => {
    if (seatedPersonsEligibleForInvite.length === 0) {
      alert(
        'Nenhuma pessoa com assento livre encontrada! Regra do Sistema: Você precisa alocar pelo menos 1 pessoa em uma mesa na aba "Gestão de Mesas" antes de criar um convite.'
      );
      return;
    }

    setEditingInvite(null);
    setWizardStep(1);
    setInviteType('family');
    const firstEligible = seatedPersonsEligibleForInvite[0];
    setHeadPersonId(firstEligible ? firstEligible.id : '');
    setCompanionPersonIds([]);
    setFamilySlotsCount(2);
    setPhone(firstEligible ? firstEligible.phone || '' : '');
    setTier('main');
    setIndividualDeadline('');
    setSearchPersonQuery('');
    setIsAddOpen(true);
  };

  const handleOpenAddForPerson = (person: Person) => {
    setEditingInvite(null);
    setWizardStep(1);
    setInviteType('family');
    setHeadPersonId(person.id);
    setCompanionPersonIds([]);
    setFamilySlotsCount(2);
    setPhone(person.phone || '');
    setTier('main');
    setIndividualDeadline('');
    setSearchPersonQuery('');
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
    setIsAddOpen(true);
  };

  const handleSaveInviteForm = async (dispatchWhatsApp: boolean = false) => {
    if (!headPersonId) {
      alert('Selecione o Mandante (titular) do convite entre as pessoas com assento na mesa!');
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

  // Helper para gerar mensagem padrão para convites de função especial
  const getDefaultSpecialMessage = (role: SpecialRole, name: string, time: string, token: string) => {
    const siteUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
    const link = token ? `${siteUrl}/convite/${token}` : `${siteUrl}/convite/[link]`;

    if (role === 'ceremonialist') {
      return `Olá ${name || 'Cerimonialista'}! Você é a Cerimonialista/Assessora oficial da Festa de 40 Anos da Fernanda Seppi ✨.\n\nSeu horário recomendado de chegada é às ${time || '16:00'}.\n\nAcesse todos os detalhes do evento pelo link:\n👉 ${link}\n\nContamos com você!`;
    }
    if (role === 'musician') {
      return `Olá ${name || 'Músico'}! Confirmamos sua apresentação na Festa de 40 Anos da Fernanda Seppi ✨.\n\nO horário recomendado para montagem e passagem de som é às ${time || '15:30'}.\n\nAcesse o link exclusivo do evento:\n👉 ${link}\n\nNos vemos lá!`;
    }
    if (role === 'staff') {
      return `Olá ${name || 'Equipe'}! Convite de equipe/colaborador para a Festa de 40 Anos da Fernanda Seppi ✨.\n\nHorário de chegada: ${time || '16:00'}.\n\nAcesse os detalhes pelo link:\n👉 ${link}`;
    }
    if (role === 'birthday_person') {
      return `Fernanda! Seu convite oficial de Aniversariante para a sua Festa de 40 Anos ✨.\n\nAcesse seu hotsite e painel exclusivo:\n👉 ${link}`;
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

      {/* Regra de Ouro em Destaque */}
      <div className="bg-purple-900/30 border border-purple-500/40 p-4 rounded-2xl flex items-start gap-3 text-purple-200 text-xs font-semibold">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-black">Regra de Ouro da Festa:</strong>
          <span>
            {" "}Para enviar o convite no WhatsApp (Individual ou Família), a pessoa física <strong>deve ter um assento atribuído</strong> na mesa do salão. As pessoas sem mesa permanecem na lista de reserva.
          </span>
        </div>
      </div>

      {/* Barra de Busca & Ações */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mandante, acompanhante ou fone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => exportInvitesToCSV(invites, tables)}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> <span>Exportar Buffet</span>
            </button>

            <button
              onClick={downloadExcelTemplate}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-500" /> <span>Modelo Excel</span>
            </button>

            <button
              onClick={async () => {
                if (confirm('Atenção: Tem certeza que deseja zerar todos os convites de teste e presenças confirmadas?\n\nA lista máster de 119 pessoas e a alocação de mesas continuarão intactas.')) {
                  await resetAllInvitesData();
                  onRefresh();
                }
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 cursor-pointer"
              title="Zerar convites de teste e presenças sem apagar as pessoas e mesas"
            >
              <Trash2 className="w-4 h-4 text-rose-500" /> <span>Zerar Convites de Teste</span>
            </button>

            <button
              onClick={handleOpenSpecialModal}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Star className="w-4 h-4 text-amber-100" /> <span>Convite Especial (Função)</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="min-h-[44px] col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> <span>Novo Convite (Wizard)</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-700/60 pt-3 pb-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filtrar:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'main', label: 'Lista Principal' },
            { id: 'reserve', label: `Lista de Espera (${reserveInvites.length})` },
            { id: 'sent', label: 'Enviados' },
            { id: 'not_sent', label: 'Não Enviados' },
            { id: 'confirmed', label: 'Confirmados' },
            { id: 'pending_date', label: 'Pediram Prazo' },
            { id: 'expired', label: 'Prazo Vencido' },
            { id: 'declined', label: 'Não Poderão Ir' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
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

      {/* TABELA DE CONVITES CRIADOS (DATATABLE 360º) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4">Nome</th>
                <th className="py-3.5 px-4">Telefone</th>
                <th className="py-3.5 px-4">Tipo de Convite</th>
                <th className="py-3.5 px-4">Mesa</th>
                <th className="py-3.5 px-4">Status da Confirmação</th>
                <th className="py-3.5 px-4 text-center">Convidar</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Nenhum convidado encontrado na busca ou filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person) => {
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

                  // Status individual do convidado no RSVP
                  const guestObj = invite?.guests?.find((g) => g.name.trim().toLowerCase() === person.name.trim().toLowerCase());
                  const rsvpStatus = guestObj?.status || invite?.status || 'pending';

                  return (
                    <tr key={person.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      {/* COLUNA 1: NOME (Edição Inline por Pessoa Física 1:1) */}
                      <td className="py-3.5 px-4 min-w-[180px]">
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
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingCell({ inviteId: person.id, field: 'name', value: person.name })}
                            className="group flex items-center gap-1.5 cursor-pointer py-1"
                            title="Clique para editar o nome diretamente na tabela"
                          >
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                              {person.name}
                            </span>
                            <Edit className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {person.special_role === 'ceremonialist' && (
                              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-amber-500" /> Cerimonialista
                              </span>
                            )}
                            {person.special_role === 'musician' && (
                              <span className="bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-sky-500/30 flex items-center gap-0.5">
                                <Music className="w-3 h-3 text-sky-500" /> Músico
                              </span>
                            )}
                            {person.special_role === 'staff' && (
                              <span className="bg-slate-500/20 text-slate-600 dark:text-slate-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-500/30 flex items-center gap-0.5">
                                <Briefcase className="w-3 h-3 text-slate-500" /> Staff
                              </span>
                            )}
                            {person.special_role === 'birthday_person' && (
                              <span className="bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-0.5">
                                <Crown className="w-3 h-3 text-amber-400" /> Aniversariante
                              </span>
                            )}
                            {!person.table_id && (
                              <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                                Reserva
                              </span>
                            )}
                          </div>
                        )}
                        {invite && <div className="text-[10px] font-mono text-purple-500 mt-0.5">/convite/{invite.id}</div>}
                      </td>

                      {/* COLUNA 2: TELEFONE */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        {isEditingPhone ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="11999998888"
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePersonInlineCell(person);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-purple-500 rounded-lg text-xs font-medium focus:outline-none"
                            />
                            <button
                              onClick={() => handleSavePersonInlineCell(person)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                              title="Salvar Telefone"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingCell({ inviteId: person.id, field: 'phone', value: person.phone || invite?.phone || '' })}
                            className="group flex items-center gap-1.5 cursor-pointer py-1 text-slate-600 dark:text-slate-300 font-medium"
                            title="Clique para editar o telefone"
                          >
                            <span>
                              {formatPhoneDisplay(person.phone || invite?.phone || '') || (
                                <em className="text-amber-500 text-[11px]">Sem fone (adicionar)</em>
                              )}
                            </span>
                            <Edit className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* COLUNA 3: TIPO DE CONVITE */}
                      <td className="py-3.5 px-4 space-y-1">
                        {isHead && (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                            invite?.invite_type === 'family' || (invite?.companion_person_ids && invite.companion_person_ids.length > 0)
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                              : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          }`}>
                            {invite?.invite_type === 'family' || (invite?.companion_person_ids && invite.companion_person_ids.length > 0)
                              ? `Convite Família - Mandante (${1 + (invite?.companion_person_ids?.length || 0)} pes)`
                              : 'Convite Individual (Titular)'}
                          </span>
                        )}
                        {isCompanion && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800">
                            Convite Família - Acompanhante (Titular: {headPerson?.name || 'Titular'})
                          </span>
                        )}
                        {!invite && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-800">
                            Sem Convite (Não Convidado)
                          </span>
                        )}
                      </td>

                      {/* COLUNA 4: MESA (Seletor Inline 360º) */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <select
                          value={currentTableId}
                          onChange={(e) => handleTableChangeForPerson(person, e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none ${
                            currentTableId
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 italic'
                          }`}
                        >
                          <option value="">-- Sem Mesa --</option>
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* COLUNA 5: STATUS DA CONFIRMAÇÃO */}
                      <td className="py-3.5 px-4 space-y-1">
                        {invite ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {rsvpStatus === 'confirmed' ? (
                                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  🟢 Confirmado {isCompanion ? '(via Família)' : ''}
                                </span>
                              ) : rsvpStatus === 'declined' ? (
                                <span className="bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  🔴 Não Poderá Ir
                                </span>
                              ) : rsvpStatus === 'pending_date' ? (
                                <span className="bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  🟡 Pediu Prazo {guestObj?.requested_date ? `(${guestObj.requested_date})` : ''}
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${deadlineInfo?.color || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                  {deadlineInfo?.label || 'Pendente'}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              {isSent ? (
                                <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                                  <Send className="w-3 h-3" /> Enviado {invite?.sent_at ? `(${formatDateShort(invite.sent_at)})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Não enviado ainda
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 italic">
                            -- Sem Convite --
                          </span>
                        )}
                      </td>

                      {/* COLUNA 6: CONVIDAR (Ação de Convite) */}
                      <td className="py-3.5 px-4 text-center">
                        {invite ? (
                          rsvpStatus === 'confirmed' ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-extrabold text-xs cursor-not-allowed opacity-90"
                              title="Convite com presença confirmada. Não é permitido editar, apenas alterar a mesa."
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>🟢 Confirmado</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenEdit(invite)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>Editar Convite</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleOpenAddForPerson(person)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                            <span>Gerar Convite</span>
                          </button>
                        )}
                      </td>

                      {/* COLUNA 7: AÇÕES */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === person.id ? null : person.id)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ações</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </button>

                          {openDropdownId === person.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden py-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs animate-fade-in">
                              {invite && (
                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    handleOpenEdit(invite);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
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
                                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
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
                                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 block cursor-pointer"
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
                                  className="w-full text-left px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Armchair className="w-4 h-4 text-amber-500" />
                                  <span>Desalocar da Mesa</span>
                                </button>
                              )}

                              {invite && (
                                rsvpStatus === 'confirmed' ? (
                                  <div
                                    className="w-full text-left px-3.5 py-2 text-slate-400 font-medium flex items-center gap-2 cursor-not-allowed opacity-50"
                                    title="Presença confirmada — não é permitido excluir o convite (apenas trocar de mesa)"
                                  >
                                    <Trash2 className="w-4 h-4 text-slate-400" />
                                    <span>Excluir Convite (Bloqueado)</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      setOpenDropdownId(null);
                                      await handleDeleteInviteForPerson(person, invite);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    <span>Excluir Convite</span>
                                  </button>
                                )
                              )}
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
                <span className="text-slate-600">•</span>
                <span className={wizardStep >= 2 ? 'text-purple-500 font-black' : ''}>2. Responsável</span>
                <span className="text-slate-600">•</span>
                <span className={wizardStep >= 3 ? 'text-purple-500 font-black' : ''}>3. Contato</span>
                {inviteType === 'family' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className={wizardStep >= 4 ? 'text-purple-500 font-black' : ''}>4. Integrantes</span>
                  </>
                )}
                <span className="text-slate-600">•</span>
                <span className={wizardStep === (inviteType === 'family' ? 5 : 4) ? 'text-purple-500 font-black' : ''}>Final. Revisar</span>
              </div>
            </div>

            {/* CORPO DO PASSO ATUAL DO WIZARD */}

            {/* PASSO 1: Seleção do Tipo de Convite (Individual vs Família) */}
            {wizardStep === 1 && (
              <div className="space-y-4">
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
                              if (inviteType === 'family') {
                                setFamilySlotsCount((prev) => Math.max(2, prev));
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

                {/* Seleção Dinâmica de Mesa caso o Mandante escolhido não tenha mesa ainda */}
                {headPersonId && (() => {
                  const selectedHeadP = persons.find((p) => p.id === headPersonId);
                  const selectedHeadTable = tables.find((t) => t.id === selectedHeadP?.table_id);

                  if (!selectedHeadP?.table_id) {
                    return (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>⚠️ Este convidado não tem mesa atribuída. Selecione a mesa para continuar:</span>
                        </div>
                        <select
                          required
                          value=""
                          onChange={async (e) => {
                            const newTId = e.target.value;
                            if (newTId) {
                              await savePerson({ ...selectedHeadP, table_id: newTId });
                              onRefresh();
                            }
                          }}
                          className="w-full p-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Selecionar Mesa para {selectedHeadP?.name} --</option>
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.capacity} lugares)
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Mesa Atribuída: {selectedHeadTable?.name}</span>
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
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ✓ Completo
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
                          <span>✓ Lista da Família Completa! Todos os {familySlotsCount} integrantes foram definidos com sucesso.</span>
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
                  onClick={() => setWizardStep((wizardStep === 3 && inviteType === 'individual' && headPersonId) ? 1 : wizardStep - 1)}
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
                      (wizardStep === 2 && (!headPersonId || !persons.find((p) => p.id === headPersonId)?.table_id)) ||
                      (wizardStep === 3 && phone.replace(/\D/g, '').length < 8) ||
                      (wizardStep === 4 && inviteType === 'family' && companionPersonIds.filter(Boolean).length < (familySlotsCount - 1))
                    }
                    onClick={() => setWizardStep((wizardStep === 1 && inviteType === 'individual' && headPersonId) ? 3 : wizardStep + 1)}
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
    </div>
  );
}
