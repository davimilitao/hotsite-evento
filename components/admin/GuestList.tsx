'use client';

import React, { useState } from 'react';
import { Invite } from '@/types';
import { saveInvite, deleteInvite } from '@/lib/db';
import { buildWhatsAppLink, formatPhoneDisplay } from '@/lib/utils';
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
} from 'lucide-react';

interface GuestListProps {
  invites: Invite[];
  onRefresh: () => void;
}

export function GuestList({ invites, onRefresh }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Novo Convite Form State
  const [headName, setHeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [maxGuests, setMaxGuests] = useState(2);
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Métricas
  const totalInvites = invites.length;
  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');
  const declinedInvites = invites.filter((i) => i.status === 'declined');
  const pendingInvites = invites.filter((i) => i.status === 'pending');

  const totalConfirmedGuests = confirmedInvites.reduce(
    (sum, i) => sum + (i.confirmed_count || i.guests.length || 1),
    0
  );

  // Filtro
  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      invite.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.phone.includes(searchTerm) ||
      invite.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invite.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAdd(true);

    try {
      await saveInvite({
        head_name: headName,
        phone,
        max_guests: maxGuests,
      });

      setHeadName('');
      setPhone('');
      setMaxGuests(2);
      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao cadastrar convite:', err);
    } finally {
      setLoadingAdd(false);
    }
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
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalInvites}</span>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Convites Criados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalConfirmedGuests}</span>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pessoas Confirmadas</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingInvites.length}</span>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pendentes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{declinedInvites.length}</span>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Recusados</p>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Ações */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
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
              <Upload className="w-4 h-4 text-purple-500" /> Importar Lista
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Convite
            </button>
          </div>
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>
          {(['all', 'confirmed', 'pending', 'declined'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'all'
                ? 'Todos'
                : st === 'confirmed'
                ? 'Confirmados'
                : st === 'pending'
                ? 'Pendentes'
                : 'Recusados'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Convites */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4">Titular / WhatsApp</th>
                <th className="py-3.5 px-4">Vagas / Confirmados</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Disparo WhatsApp</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredInvites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    Nenhum convite encontrado.
                  </td>
                </tr>
              ) : (
                filteredInvites.map((invite) => {
                  const waUrl = buildWhatsAppLink(invite.head_name, invite.phone, invite.id);

                  return (
                    <tr key={invite.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{invite.head_name}</div>
                        <div className="text-[11px] text-slate-400">{formatPhoneDisplay(invite.phone)}</div>
                        <div className="text-[10px] font-mono text-purple-500 mt-0.5">/convite/{invite.id}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {invite.status === 'confirmed' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {invite.confirmed_count} / {invite.max_guests} pessoas
                          </span>
                        ) : (
                          <span>Até {invite.max_guests} vagas</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {invite.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            <UserCheck className="w-3 h-3" /> Confirmado
                          </span>
                        )}
                        {invite.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                        {invite.status === 'declined' && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            <UserX className="w-3 h-3" /> Recusado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
                          title="Disparar convite pelo WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Disparar WhatsApp
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
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

      {/* Modal Criar Convite Individual */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Novo Convite Individual</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Limite Máximo de Vagas Reservadas *
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
                  disabled={loadingAdd}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {loadingAdd ? 'Salvando...' : 'Criar Convite'}
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
