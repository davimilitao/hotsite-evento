'use client';

import React, { useState } from 'react';
import { Invite, Table, EventConfig, InviteTier, Person } from '@/types';
import { saveInvite, deleteInvite, markInviteAsSent, promoteInviteToMain } from '@/lib/db';
import { buildWhatsAppLink, formatPhoneDisplay, getDeadlineInfo, formatDateShort, exportInvitesToCSV, downloadExcelTemplate } from '@/lib/utils';
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

  // Form State para Criar/Editar Convite Agrupado
  const [headPersonId, setHeadPersonId] = useState('');
  const [companionPersonIds, setCompanionPersonIds] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<InviteTier>('main');
  const [individualDeadline, setIndividualDeadline] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  // Métricas 1:1 de Pessoas & Assentos
  const buffetCapacity = config.buffet_capacity || 100;
  const totalPersons = persons.length;
  const seatedPersons = persons.filter((p) => p.table_id);
  const unseatedPersons = persons.filter((p) => !p.table_id);

  const mainInvites = invites.filter((i) => !i.tier || i.tier === 'main');
  const reserveInvites = invites.filter((i) => i.tier === 'reserve');
  const sentInvites = invites.filter((i) => i.sent_status === 'sent');

  // Pessoas elegíveis para convite (Devam POSSUIR mesa atribuída)
  const seatedPersonsEligibleForInvite = persons.filter(
    (p) => p.table_id && (!p.invite_id || p.invite_id === editingInvite?.id)
  );

  const buffetOccupancyPercent = Math.min(
    Math.round((seatedPersons.length / buffetCapacity) * 100),
    100
  );

  // Filtro de Convites
  const filteredInvites = invites.filter((invite) => {
    const headPerson = persons.find((p) => p.id === invite.head_person_id);
    const companionPersons = persons.filter((p) => invite.companion_person_ids?.includes(p.id));

    const matchesSearch =
      invite.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.phone.includes(searchTerm) ||
      invite.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (headPerson && headPerson.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      companionPersons.some((cp) => cp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'main') return !invite.tier || invite.tier === 'main';
    if (statusFilter === 'reserve') return invite.tier === 'reserve';
    if (statusFilter === 'sent') return invite.sent_status === 'sent';
    if (statusFilter === 'not_sent') return !invite.sent_status || invite.sent_status === 'not_sent';
    if (statusFilter === 'confirmed') return invite.status === 'confirmed';
    if (statusFilter === 'declined') return invite.status === 'declined';
    if (statusFilter === 'pending') return invite.status === 'pending';
    if (statusFilter === 'pending_date') return invite.status === 'pending_date';
    if (statusFilter === 'expired') {
      const deadlineInfo = getDeadlineInfo(invite, config.deadline_rsvp);
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
    const firstEligible = seatedPersonsEligibleForInvite[0];
    setHeadPersonId(firstEligible ? firstEligible.id : '');
    setCompanionPersonIds([]);
    setPhone(firstEligible ? firstEligible.phone || '' : '');
    setTier('main');
    setIndividualDeadline('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (invite: Invite) => {
    setEditingInvite(invite);
    setHeadPersonId(invite.head_person_id || '');
    setCompanionPersonIds(invite.companion_person_ids || []);
    setPhone(invite.phone || '');
    setTier(invite.tier || 'main');
    setIndividualDeadline(invite.individual_deadline ? invite.individual_deadline.slice(0, 10) : '');
    setIsAddOpen(true);
  };

  const handleSaveInviteForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headPersonId) {
      alert('Selecione o Mandante (titular) do convite entre as pessoas com assento na mesa!');
      return;
    }

    setLoadingForm(true);

    const headPerson = persons.find((p) => p.id === headPersonId);
    const maxGuests = 1 + companionPersonIds.length;

    try {
      await saveInvite({
        id: editingInvite ? editingInvite.id : undefined,
        head_person_id: headPersonId,
        companion_person_ids: companionPersonIds,
        head_name: headPerson ? headPerson.name : 'Convidado',
        phone,
        max_guests: maxGuests,
        table_id: headPerson?.table_id || null,
        tier,
        individual_deadline: individualDeadline ? new Date(individualDeadline).toISOString() : null,
      });

      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar convite:', err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleWhatsAppDispatch = async (invite: Invite) => {
    const cleanDigits = invite.phone ? invite.phone.replace(/\D/g, '') : '';
    if (!cleanDigits || cleanDigits.length < 8) {
      alert(
        `O telefone do Mandante "${invite.head_name}" está em branco ou incompleto. Informe o DDD e o número para realizar o disparo.`
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

  const handleCopyLink = (token: string) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${siteUrl}/convite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard de Métricas 1:1 do Buffet & Convites */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lista Máster (1:1)</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalPersons}</span>
            <span className="text-xs text-slate-400 ml-1">pessoas</span>
          </div>
          <p className="text-[10px] text-slate-400">119 nomes cadastrados</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Com Assento (Mesas)</span>
            <Armchair className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{seatedPersons.length}</span>
            <span className="text-xs text-slate-400 ml-1">/ {buffetCapacity} buffet</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${buffetOccupancyPercent}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sem Mesa (Reserva)</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-amber-500">{unseatedPersons.length}</span>
            <span className="text-xs text-slate-400 ml-1">pessoas</span>
          </div>
          <p className="text-[10px] text-amber-400 font-semibold">Fila de Espera</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Convites Agrupados</span>
            <Send className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-sky-500">{invites.length}</span>
            <span className="text-xs text-slate-400 ml-1">grupos ({sentInvites.length} env)</span>
          </div>
          <p className="text-[10px] text-slate-400">Disparos pelo WhatsApp</p>
        </div>
      </div>

      {/* Regra de Ouro em Destaque */}
      <div className="bg-purple-900/30 border border-purple-500/40 p-4 rounded-2xl flex items-start gap-3 text-purple-200 text-xs font-semibold">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-black">Regra de Ouro da Festa:</strong>
          <span>
            {" "}Para criar um convite e enviar no WhatsApp, a pessoa física <strong>deve primeiramente ter um assento atribuído</strong> em uma mesa no salão! As pessoas sem mesa permanecem na lista de reserva.
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
              onClick={handleOpenAdd}
              className="min-h-[44px] col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> <span>Criar Convite (Mandante + Acompanhantes)</span>
            </button>
          </div>
        </div>

        {/* Filtros Limpos */}
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

      {/* LISTA / TABELA DE CONVITES AGRUPADOS */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4">Mandante (Titular) & WhatsApp</th>
                <th className="py-3.5 px-4">Acompanhantes da Família (1:1)</th>
                <th className="py-3.5 px-4">Mesa Atribuída</th>
                <th className="py-3.5 px-4">Status & Prazos</th>
                <th className="py-3.5 px-4 text-center">Disparo WhatsApp</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Nenhum convite cadastrado ainda. Selecione pessoas com assento definido para criar convites!
                  </td>
                </tr>
              ) : (
                filteredInvites.map((invite) => {
                  const deadlineInfo = getDeadlineInfo(invite, config.deadline_rsvp);
                  const isSent = invite.sent_status === 'sent';
                  const isReserve = invite.tier === 'reserve';

                  const headPerson = persons.find((p) => p.id === invite.head_person_id);
                  const companionPersons = persons.filter((p) => invite.companion_person_ids?.includes(p.id));
                  const assignedTable = tables.find((t) => t.id === invite.table_id || t.id === headPerson?.table_id);

                  return (
                    <tr key={invite.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      {/* Mandante */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">{invite.head_name}</span>
                          {isReserve && (
                            <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/30">
                              Reserva
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{formatPhoneDisplay(invite.phone) || 'Sem telefone'}</div>
                        <div className="text-[10px] font-mono text-purple-500 mt-0.5">/convite/{invite.id}</div>
                      </td>

                      {/* Acompanhantes */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {1 + companionPersons.length} pessoa(s) no convite
                        </div>
                        {companionPersons.length > 0 ? (
                          <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {companionPersons.map((cp) => (
                              <div key={cp.id}>• {cp.name}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">Convite individual (sem acompanhantes)</div>
                        )}
                      </td>

                      {/* Mesa Atribuída */}
                      <td className="py-3.5 px-4">
                        {assignedTable ? (
                          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                            <Armchair className="w-3.5 h-3.5 text-amber-500" />
                            {assignedTable.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-- Sem Mesa --</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${deadlineInfo.color}`}>
                          {deadlineInfo.label}
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          {isSent ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                              <Send className="w-3 h-3" /> Enviado {invite.sent_at ? `(${formatDateShort(invite.sent_at)})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Não enviado ainda
                            </span>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleWhatsAppDispatch(invite)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer ${
                            !invite.phone
                              ? 'bg-slate-900 text-amber-300 border border-amber-500/40 hover:bg-slate-800'
                              : isSent
                              ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{!invite.phone ? '+ Adicionar Fone' : isSent ? 'Re-enviar WhatsApp' : 'Enviar no WhatsApp'}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(invite)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                          title="Editar convite completo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyLink(invite.id)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                          title="Copiar link do convite"
                        >
                          {copiedToken === invite.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <a
                          href={`/convite/${invite.id}`}
                          target="_blank"
                          className="p-1.5 inline-block text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Visualizar hotsite"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDelete(invite.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir convite"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Convite Agrupado */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                {editingInvite ? 'Editar Convite Agrupado' : 'Novo Convite Agrupado (WhatsApp)'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInviteForm} className="space-y-4">
              {/* Etapa 1: Mandante (Titular) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Mandante (Titular do Disparo com Assento em Mesa) *
                </label>
                <select
                  required
                  value={headPersonId}
                  onChange={(e) => {
                    setHeadPersonId(e.target.value);
                    const selectedP = persons.find((p) => p.id === e.target.value);
                    if (selectedP?.phone) setPhone(selectedP.phone);
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Selecione o Mandante --</option>
                  {seatedPersonsEligibleForInvite.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Mesa atribuída)
                    </option>
                  ))}
                </select>
              </div>

              {/* Etapa 2: Telefone com DDD para WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Telefone WhatsApp do Mandante (com DDD) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 11999998888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Etapa 3: Seleção dos Acompanhantes da Família */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Acompanhantes da Família (Pessoas da Lista com Mesa)
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  {seatedPersonsEligibleForInvite
                    .filter((p) => p.id !== headPersonId)
                    .map((p) => {
                      const isSelected = companionPersonIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-200/50 p-1.5 rounded-lg"
                        >
                          <span>{p.name}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCompanionPersonIds([...companionPersonIds, p.id]);
                              } else {
                                setCompanionPersonIds(companionPersonIds.filter((id) => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                        </label>
                      );
                    })}

                  {seatedPersonsEligibleForInvite.filter((p) => p.id !== headPersonId).length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">
                      Nenhuma outra pessoa com assento livre para adicionar como acompanhante.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Lista *
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="main">Lista Principal (Oficial)</option>
                    <option value="reserve">Lista de Espera (Reserva)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo Limite (opcional)
                  </label>
                  <input
                    type="date"
                    value={individualDeadline}
                    onChange={(e) => setIndividualDeadline(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {loadingForm ? 'Salvando...' : editingInvite ? 'Salvar Alterações' : 'Criar Convite Agrupado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BulkImporter isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} onSuccess={onRefresh} />
    </div>
  );
}
