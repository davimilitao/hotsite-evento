'use client';

import React, { useState } from 'react';
import { Invite, Guest, EventConfig } from '@/types';
import { updateInviteRSVP } from '@/lib/db';
import { isInviteExpired, formatDateShort } from '@/lib/utils';
import { UserPlus, Trash2, Utensils, Send, AlertTriangle, Sparkles, HeartHandshake, CalendarClock, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RSVPFormProps {
  invite: Invite;
  config: EventConfig;
  onUpdate: (updated: Invite) => void;
  onSubmittedFeedback?: () => void;
}

export function RSVPForm({ invite, config, onUpdate, onSubmittedFeedback }: RSVPFormProps) {
  const isExpired = isInviteExpired(invite, config.deadline_rsvp);

  const [responseMode, setResponseMode] = useState<'confirmed' | 'declined' | 'pending_date'>(() => {
    if (invite.status === 'declined') return 'declined';
    if (invite.status === 'pending_date') return 'pending_date';
    return 'confirmed';
  });

  const [requestedDate, setRequestedDate] = useState<string>(
    invite.requested_date ? invite.requested_date.slice(0, 10) : ''
  );

  const [guests, setGuests] = useState<Guest[]>(() => {
    if (invite.guests && invite.guests.length > 0) return invite.guests;
    return [{ name: invite.head_name, type: 'adult', dietary: '' }];
  });

  const [notes, setNotes] = useState<string>(invite.notes || '');
  const [loading, setLoading] = useState(false);

  const activeDeadline = invite.individual_deadline || config.deadline_rsvp;

  const handleAddGuest = () => {
    if (guests.length >= invite.max_guests) return;
    setGuests([...guests, { name: '', type: 'adult', dietary: '' }]);
  };

  const handleRemoveGuest = (index: number) => {
    if (guests.length <= 1) return;
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleGuestChange = (index: number, field: keyof Guest, value: any) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let status = responseMode;
      let validGuests = responseMode === 'confirmed'
        ? guests.filter((g) => g.name.trim().length > 0)
        : [];

      if (responseMode === 'confirmed' && validGuests.length === 0) {
        alert('Por favor, informe pelo menos o nome do titular.');
        setLoading(false);
        return;
      }

      if (responseMode === 'pending_date' && !requestedDate) {
        alert('Por favor, selecione até qual data você precisa para confirmar.');
        setLoading(false);
        return;
      }

      const updatedInvite = await updateInviteRSVP(invite.id, {
        status,
        guests: validGuests,
        notes,
        requested_date: responseMode === 'pending_date' ? requestedDate : undefined,
      });

      if (status === 'confirmed') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      onUpdate(updatedInvite);
      if (onSubmittedFeedback) {
        onSubmittedFeedback();
      }
    } catch (err) {
      console.error('Erro ao enviar RSVP:', err);
      alert('Ocorreu um erro ao salvar sua resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700/60 space-y-6">
      {/* Alerta Modo Urgência quando o SLA Expirou */}
      {isExpired && (
        <div className="bg-rose-500/15 border-2 border-rose-500/40 text-rose-300 p-4 rounded-2xl space-y-2 animate-pulse">
          <div className="flex items-center gap-2 font-extrabold text-sm text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>⚠️ URGENTE: O Prazo Inicial deste Convite Expirou</span>
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">
            O prazo limite era <strong>{formatDateShort(activeDeadline)}</strong>. Para garantirmos seu lugar antes de reatribuir a vaga para a lista de reserva do buffet, confirme urgentemente se <strong>SIM</strong> ou <strong>NÃO</strong>.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-2xl">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Confirmação de Presença (RSVP)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convite reservado para até <strong className="text-slate-700 dark:text-slate-200">{invite.max_guests} pessoas</strong>
            </p>
          </div>
        </div>

        {activeDeadline && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Até {formatDateShort(activeDeadline)}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opção de Presença (3 Opções) */}
        <div className={`grid ${isExpired ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
          <button
            type="button"
            onClick={() => setResponseMode('confirmed')}
            className={`p-3.5 rounded-2xl border-2 text-left font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
              responseMode === 'confirmed'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="text-xl">🎉</span>
            <span className="font-bold">Vou Comemorar!</span>
          </button>

          {!isExpired && (
            <button
              type="button"
              onClick={() => setResponseMode('pending_date')}
              className={`p-3.5 rounded-2xl border-2 text-left font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                responseMode === 'pending_date'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 shadow-md ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className="text-xl">🤔</span>
              <span className="font-bold">Preciso de Prazo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setResponseMode('declined')}
            className={`p-3.5 rounded-2xl border-2 text-left font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
              responseMode === 'declined'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 shadow-md ring-2 ring-rose-500/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="text-xl">😔</span>
            <span className="font-bold">Não Poderei Ir</span>
          </button>
        </div>

        {/* Módulo quando seleciona 'pending_date' (Preciso de Prazo) */}
        {responseMode === 'pending_date' && (
          <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-3">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
              <CalendarClock className="w-4 h-4 text-purple-500" />
              <span>Até qual data você terá certeza sobre sua presença?</span>
            </div>

            <input
              type="date"
              required
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="text-[11px] text-purple-600 dark:text-purple-300 italic">
              O anfitrião receberá essa data para guardar sua vaga até lá!
            </p>
          </div>
        )}

        {/* Formulário de Acompanhantes se Confirmou */}
        {responseMode === 'confirmed' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Lista de Confirmados ({guests.length}/{invite.max_guests})
              </label>
              {guests.length < invite.max_guests && (
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <UserPlus className="w-4 h-4" /> Adicionar Acompanhante
                </button>
              )}
            </div>

            <div className="space-y-3">
              {guests.map((guest, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {index === 0 ? 'Titular do Convite' : `Acompanhante #${index + 1}`}
                    </span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(index)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remover acompanhante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Nome Completo"
                        value={guest.name}
                        onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <select
                        value={guest.type}
                        onChange={(e) => handleGuestChange(index, 'type', e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                      >
                        <option value="adult">Adulto</option>
                        <option value="child">Criança</option>
                      </select>
                    </div>
                  </div>

                  {/* Restrições alimentares opcional */}
                  <div className="flex items-center gap-2 pt-1">
                    <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Restrição alimentar ou alergia (opcional, ex: Sem Glúten)"
                      value={guest.dietary || ''}
                      onChange={(e) => handleGuestChange(index, 'dietary', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recado para a Aniversariante */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Deixe uma mensagem para a aniversariante (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Escreva um recado carinhoso aqui..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {responseMode === 'declined' && (
          <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              Ao informar que não poderá ir, a vaga reservada para seu convite será disponibilizada para a lista de espera.
            </span>
          </div>
        )}

        {/* Botão de Enviar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Salvando sua resposta...</span>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>
                {responseMode === 'confirmed'
                  ? 'Confirmar Minha Resposta'
                  : responseMode === 'pending_date'
                  ? 'Registrar Pedido de Prazo'
                  : 'Registrar Ausência'}
              </span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
