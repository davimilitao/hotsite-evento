'use client';

import React, { useState, useEffect } from 'react';
import { Invite, Guest, EventConfig, Person } from '@/types';
import { saveInvite, savePerson } from '@/lib/db';
import { isInviteExpired, formatDateShort } from '@/lib/utils';
import { Utensils, Send, AlertTriangle, HeartHandshake, CalendarClock, Clock, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RSVPFormProps {
  invite: Invite;
  config: EventConfig;
  allPersons?: Person[];
  onUpdate: (updated: Invite) => void;
  onSubmittedFeedback?: () => void;
}

export function RSVPForm({ invite, config, allPersons, onUpdate, onSubmittedFeedback }: RSVPFormProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [notes, setNotes] = useState<string>(invite.notes || '');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(invite.status === 'pending');

  const isExpired = isInviteExpired(invite, config.deadline_rsvp);
  const activeDeadline = invite.individual_deadline || config.deadline_rsvp;
  const isAlreadyResponded = invite.status !== 'pending';

  useEffect(() => {
    const headP = allPersons?.find(
      (p) => p.id === invite.head_person_id || p.name.trim().toLowerCase() === invite.head_name.trim().toLowerCase()
    );

    const companionPersons = (invite.companion_person_ids || [])
      .map((cId) => allPersons?.find((p) => p.id === cId))
      .filter(Boolean) as Person[];

    const initialList: Guest[] = [];

    // 1. Titular
    const headName = headP ? headP.name : invite.head_name;
    const existingHeadGuest = invite.guests?.find(
      (g) => g.person_id === (headP?.id || invite.head_person_id) || g.name.trim().toLowerCase() === headName.trim().toLowerCase()
    );

    initialList.push({
      person_id: headP?.id || invite.head_person_id,
      name: existingHeadGuest?.name || headName,
      type: existingHeadGuest?.type || headP?.type || 'adult',
      dietary: existingHeadGuest?.dietary || '',
      status: existingHeadGuest?.status || (invite.status === 'declined' ? 'declined' : invite.status === 'pending_date' ? 'pending_date' : 'confirmed'),
      requested_date: existingHeadGuest?.requested_date || invite.requested_date || '',
    });

    // 2. Acompanhantes
    companionPersons.forEach((compP) => {
      const existingCompGuest = invite.guests?.find(
        (g) => g.person_id === compP.id || g.name.trim().toLowerCase() === compP.name.trim().toLowerCase()
      );

      initialList.push({
        person_id: compP.id,
        name: existingCompGuest?.name || compP.name,
        type: existingCompGuest?.type || compP.type || 'adult',
        dietary: existingCompGuest?.dietary || '',
        status: existingCompGuest?.status || (invite.status === 'declined' ? 'declined' : invite.status === 'pending_date' ? 'pending_date' : 'confirmed'),
        requested_date: existingCompGuest?.requested_date || invite.requested_date || '',
      });
    });

    if (initialList.length === 1 && invite.guests && invite.guests.length > 1) {
      setGuests(invite.guests);
    } else {
      setGuests(initialList);
    }
  }, [invite, allPersons]);

  const handleGuestChange = (index: number, field: keyof Guest, value: any) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      for (let i = 0; i < guests.length; i++) {
        if (!guests[i].name.trim()) {
          alert(`Por favor, preencha o nome completo do integrante #${i + 1}.`);
          setLoading(false);
          return;
        }
      }

      const confirmedCount = guests.filter((g) => (g.status || 'confirmed') === 'confirmed').length;
      const hasPendingDate = guests.some((g) => g.status === 'pending_date');
      const allDeclined = guests.every((g) => g.status === 'declined');

      let overallStatus: 'confirmed' | 'declined' | 'pending_date' = 'confirmed';
      if (hasPendingDate) {
        overallStatus = 'pending_date';
      } else if (allDeclined) {
        overallStatus = 'declined';
      } else if (confirmedCount > 0) {
        overallStatus = 'confirmed';
      }

      for (const g of guests) {
        if (g.person_id) {
          const targetP = allPersons?.find((p) => p.id === g.person_id);
          if (targetP && (targetP.name !== g.name.trim() || targetP.phone !== (invite.phone || ''))) {
            await savePerson({
              ...targetP,
              name: g.name.trim(),
              phone: invite.phone || targetP.phone,
            });
          }
        }
      }

      const updatedInvite = await saveInvite({
        ...invite,
        status: overallStatus,
        confirmed_count: confirmedCount,
        guests,
        notes,
      });

      if (confirmedCount > 0) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      onUpdate(updatedInvite);
      setIsEditing(false);
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

      {/* Header do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-2xl">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Confirmação de Presença (RSVP)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convite reservado para <strong className="text-slate-700 dark:text-slate-200">{guests.length} integrante(s) da família</strong>
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

      {/* MODO RESUMO: Exibição Fixa */}
      {!isEditing && isAlreadyResponded ? (
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border-2 border-purple-500/30 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              {invite.status === 'confirmed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {invite.status === 'pending_date' && <CalendarClock className="w-5 h-5 text-purple-500" />}
              {invite.status === 'declined' && <XCircle className="w-5 h-5 text-rose-500" />}
              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                Resposta da Família ({invite.confirmed_count} confirmados):
              </span>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> <span>✏️ Alterar Resposta</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <ul className="space-y-2">
              {guests.map((g, idx) => (
                <li key={idx} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {idx === 0 ? '👑 ' : '• '}{g.name}
                  </span>
                  {(g.status || 'confirmed') === 'confirmed' ? (
                    <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                      🎉 Presença Confirmada
                    </span>
                  ) : g.status === 'pending_date' ? (
                    <span className="bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                      🤔 Pediu Prazo {g.requested_date ? `(${formatDateShort(g.requested_date)})` : ''}
                    </span>
                  ) : (
                    <span className="bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                      😔 Não Poderá Ir
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {invite.notes && (
            <div className="text-xs text-slate-500 italic bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              &quot;{invite.notes}&quot;
            </div>
          )}
        </div>
      ) : (
        /* MODO EDIÇÃO */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200 block">
              Confirme a presença individual de cada integrante da família:
            </label>

            <div className="space-y-4">
              {guests.map((guest, index) => (
                <div
                  key={guest.person_id || index}
                  className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {index === 0 ? '👑 Titular / Contato Principal' : ` integrante #${index + 1} da família`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Assento Reservado</span>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Nome Completo:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome Completo"
                      value={guest.name}
                      onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Status Individual deste Integrante */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Status de Presença para {guest.name || 'este integrante'}:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGuestChange(index, 'status', 'confirmed')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          (guest.status || 'confirmed') === 'confirmed'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>🎉 Vou</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGuestChange(index, 'status', 'pending_date')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          guest.status === 'pending_date'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>🤔 Prazo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGuestChange(index, 'status', 'declined')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          guest.status === 'declined'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>😔 Não vou</span>
                      </button>
                    </div>
                  </div>

                  {/* Campo de Data se Pediu Prazo */}
                  {guest.status === 'pending_date' && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1.5 animate-fade-in">
                      <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-300">
                        Até qual data precisa de prazo para {guest.name}?
                      </label>
                      <input
                        type="date"
                        required
                        value={guest.requested_date ? guest.requested_date.slice(0, 10) : ''}
                        onChange={(e) => handleGuestChange(index, 'requested_date', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}

                  {/* Restrições alimentares opcional */}
                  {(guest.status || 'confirmed') === 'confirmed' && (
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
                  )}
                </div>
              ))}
            </div>

            {/* Recado para a Aniversariante */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Deixe um recado para a aniversariante (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Escreva uma mensagem carinhosa para Fernanda Seppi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Botão Único de Salvar Respostas no Final */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {isAlreadyResponded && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-4 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Salvando respostas...</span>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Confirmar e Enviar Resposta</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
