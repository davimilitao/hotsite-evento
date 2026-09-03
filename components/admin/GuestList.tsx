'use client';

import React, { useState } from 'react';
import { Invite, Table, EventConfig } from '@/types';
import { saveInvite, deleteInvite, markInviteAsSent } from '@/lib/db';
import { buildWhatsAppLink, formatPhoneDisplay, getSLAInfo, formatDateShort } from '@/lib/utils';
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
  AlertTriangle,
  Armchair,
  Utensils,
  Edit,
  Send,
} from 'lucide-react';

interface GuestListProps {
  invites: Invite[];
  tables: Table[];
  config: EventConfig;
  onRefresh: () => void;
}

export function GuestList({ invites, tables, config, onRefresh }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'not_sent' | 'confirmed' | 'pending' | 'pending_date' | 'expired' | 'declined'>('all');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State Novo/Editar Convite
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [maxGuests, setMaxGuests] = useState(2);
  const [individualDeadline, setIndividualDeadline] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  // Métricas do Buffet & SLA
  const buffetCapacity = config.buffet_capacity || 100;
  const totalInvites = invites.length;
  
  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');
  const declinedInvites = invites.filter((i) => i.status === 'declined');
  const pendingInvites = invites.filter((i) => i.status === 'pending');
  const pendingDateInvites = invites.filter((i) => i.status === 'pending_date');
  const sentInvites = invites.filter((i) => i.sent_status === 'sent');

  const totalConfirmedGuests = confirmedInvites.reduce(
    (sum, i) => sum + (i.confirmed_count || i.guests.length || 1),
    0
  );

  const totalReleasedSeats = declinedInvites.reduce(
    (sum, i) => sum + (i.max_guests || 1),
    0
  );

  const buffetOccupancyPercent = Math.min(
    Math.round((totalConfirmedGuests / buffetCapacity) * 100),
    100
  );

  // Filtro Avançado
  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      invite.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.phone.includes(searchTerm) ||
      invite.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.guests.some((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'sent') return invite.sent_status === 'sent';
    if (statusFilter === 'not_sent') return !invite.sent_status || invite.sent_status === 'not_sent';
    if (statusFilter === 'confirmed') return invite.status === 'confirmed';
    if (statusFilter === 'declined') return invite.status === 'declined';
    if (statusFilter === 'pending') return invite.status === 'pending';
    if (statusFilter === 'pending_date') return invite.status === 'pending_date';
    if (statusFilter === 'expired') {
      const sla = getSLAInfo(invite, config.deadline_rsvp);
      return sla.expired;
    }

    return true;
  });

  const handleOpenAdd = () => {
    setEditingInvite(null);
    setHeadName('');
    setPhone('');
    setMaxGuests(2);
    setIndividualDeadline('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (invite: Invite) => {
    setEditingInvite(invite);
    setHeadName(invite.head_name);
    setPhone(invite.phone);
    setMaxGuests(invite.max_guests);
    setIndividualDeadline(invite.individual_deadline ? invite.individual_deadline.slice(0, 10) : '');
    setIsAddOpen(true);
  };

  const handleSaveInviteForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);

    try {
      await saveInvite({
        id: editingInvite ? editingInvite.id : undefined,
        head_name: headName,
        phone,
        max_guests: maxGuests,
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
    await markInviteAsSent(invite.id);
    onRefresh();
    const waUrl = buildWhatsAppLink(invite.head_name, invite.phone, invite.id);
    window.open(waUrl, '_blank');
  };

  const handleInlineTableChange = async (invite: Invite, tableId: string | null) => {
    await saveInvite({
      ...invite,
      table_id: tableId || null,
    });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este convite?')) return;
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
      {/* Dashboard de Métricas do Buffet & SLA */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacidade Buffet</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{buffetCapacity}</span>
            <span className="text-xs text-slate-400 ml-1">vagas pagas</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full" style={{ width: `${buffetOccupancyPercent}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmados</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalConfirmedGuests}</span>
            <span className="text-xs text-slate-400 ml-1">({buffetOccupancyPercent}%)</span>
          </div>
          <p className="text-[10px] text-slate-400">Restam {buffetCapacity - totalConfirmedGuests} vagas</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vagas Liberadas</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalReleasedSeats}</span>
            <span className="text-xs text-slate-400 ml-1">por recusa</span>
          </div>
          <p className="text-[10px] text-emerald-500 font-semibold">Liberadas p/ Lista Reserva</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aguardando Prazo</span>
            <CalendarClock className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-purple-500">{pendingDateInvites.length}</span>
            <span className="text-xs text-slate-400 ml-1">convites</span>
          </div>
          <p className="text-[10px] text-purple-400">Pediram prazo específico</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status de Envio</span>
            <Send className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-sky-500">{sentInvites.length}</span>
            <span className="text-xs text-slate-400 ml-1">/ {totalInvites} disparados</span>
          </div>
          <p className="text-[10px] text-slate-400">{totalInvites - sentInvites.length} ainda não disparados</p>
        </div>
      </div>

      {/* Barra de Busca, Filtros & Ações CRUD */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar convidado, acompanhante ou fone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <Upload className="w-4 h-4 text-purple-500" /> Importar em Lote (100)
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Convite
            </button>
          </div>
        </div>

        {/* Filtros Avançados de SLA */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-700/60 pt-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filtro SLA:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'sent', label: 'Enviados' },
            { id: 'not_sent', label: 'Não Enviados' },
            { id: 'confirmed', label: 'Confirmados' },
            { id: 'pending_date', label: 'Pediram Prazo' },
            { id: 'expired', label: 'SLA Expirado' },
            { id: 'declined', label: 'Recusados' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela CRUD Master Mestre com SLA */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4">Titular / WhatsApp</th>
                <th className="py-3.5 px-4">Status & SLA</th>
                <th className="py-3.5 px-4">Composição & Alergias</th>
                <th className="py-3.5 px-4">Mesa Atribuída</th>
                <th className="py-3.5 px-4 text-center">Disparo WhatsApp</th>
                <th className="py-3.5 px-4 text-right">Ações CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Nenhum convite encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredInvites.map((invite) => {
                  const sla = getSLAInfo(invite, config.deadline_rsvp);
                  const isSent = invite.sent_status === 'sent';

                  return (
                    <tr key={invite.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      {/* Coluna 1: Titular & Token */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{invite.head_name}</div>
                        <div className="text-[11px] text-slate-400">{formatPhoneDisplay(invite.phone)}</div>
                        <div className="text-[10px] font-mono text-purple-500 mt-0.5">/convite/{invite.id}</div>
                      </td>

                      {/* Coluna 2: Status & SLA */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sla.color}`}>
                            {sla.label}
                          </span>
                        </div>

                        {/* Status de Envio */}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          {isSent ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                              <Send className="w-3 h-3" /> Disparado {invite.sent_at ? `(${formatDateShort(invite.sent_at)})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Não disparado
                            </span>
                          )}
                        </div>

                        {invite.individual_deadline && (
                          <div className="text-[10px] text-purple-400 font-medium">
                            Lote Prazo: {formatDateShort(invite.individual_deadline)}
                          </div>
                        )}
                      </td>

                      {/* Coluna 3: Composição Familiar & Alergias */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {invite.status === 'confirmed' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {invite.confirmed_count} / {invite.max_guests} confirmados
                            </span>
                          ) : (
                            <span>Reserva até {invite.max_guests} vagas</span>
                          )}
                        </div>

                        {/* Lista resumida de acompanhantes e alergias */}
                        {invite.guests && invite.guests.length > 0 && (
                          <div className="space-y-0.5">
                            {invite.guests.map((g, idx) => (
                              <div key={idx} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span>• {g.name} ({g.type === 'child' ? `criança ${g.age ? `${g.age}a` : ''}` : 'adulto'})</span>
                                {g.dietary && (
                                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-300">
                                    <Utensils className="w-2.5 h-2.5 inline mr-0.5" />
                                    {g.dietary}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Coluna 4: Mesa Atribuída Inline Select */}
                      <td className="py-3.5 px-4">
                        <select
                          value={invite.table_id || ''}
                          onChange={(e) => handleInlineTableChange(invite, e.target.value || null)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="">-- Sem Mesa --</option>
                          {tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Coluna 5: Disparo WhatsApp com marcação automática */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleWhatsAppDispatch(invite)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 ${
                            isSent
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title="Disparar link via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isSent ? 'Re-enviar WhatsApp' : 'Disparar WhatsApp'}</span>
                        </button>
                      </td>

                      {/* Coluna 6: Ações CRUD */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(invite)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                          title="Editar convite completo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyLink(invite.id)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                          title="Copiar link do convite"
                        >
                          {copiedToken === invite.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <a
                          href={`/convite/${invite.id}`}
                          target="_blank"
                          className="p-1.5 inline-block text-slate-400 hover:text-blue-600 transition-colors"
                          title="Visualizar hotsite"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDelete(invite.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
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

      {/* Modal Criar / Editar Convite Completo */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editingInvite ? 'Editar Convite' : 'Novo Convite Individual'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInviteForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Titular *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Souza"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp (DDD + Número) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 11999998888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Limite de Vagas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo Limite (Lote)
                  </label>
                  <input
                    type="date"
                    value={individualDeadline}
                    onChange={(e) => setIndividualDeadline(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {loadingForm ? 'Salvando...' : editingInvite ? 'Salvar Alterações' : 'Criar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importador em Massa */}
      <BulkImporter isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} onSuccess={onRefresh} />
    </div>
  );
}
