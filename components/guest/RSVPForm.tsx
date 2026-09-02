'use client';

import React, { useState } from 'react';
import { Invite, Guest } from '@/types';
import { updateInviteRSVP } from '@/lib/db';
import { Check, UserPlus, Trash2, Utensils, Send, AlertTriangle, Sparkles, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RSVPFormProps {
  invite: Invite;
  onUpdate: (updated: Invite) => void;
}

export function RSVPForm({ invite, onUpdate }: RSVPFormProps) {
  const [willAttend, setWillAttend] = useState<boolean>(invite.status !== 'declined');
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (invite.guests && invite.guests.length > 0) return invite.guests;
    return [{ name: invite.head_name, type: 'adult', dietary: '' }];
  });
  const [notes, setNotes] = useState<string>(invite.notes || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    setSuccessMsg(null);

    try {
      const status = willAttend ? 'confirmed' : 'declined';
      const validGuests = willAttend
        ? guests.filter((g) => g.name.trim().length > 0)
        : [];

      if (willAttend && validGuests.length === 0) {
        alert('Por favor, informe pelo menos o nome do titular.');
        setLoading(false);
        return;
      }

      const updatedInvite = await updateInviteRSVP(invite.id, {
        status,
        guests: validGuests,
        notes,
      });

      if (status === 'confirmed') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setSuccessMsg('🎉 Presença confirmada com sucesso! Mal podemos esperar por você!');
      } else {
        setSuccessMsg('Sua resposta foi registrada. Sentiremos sua falta na festa!');
      }

      onUpdate(updatedInvite);
    } catch (err) {
      console.error('Erro ao enviar RSVP:', err);
      alert('Ocorreu um erro ao salvar sua resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700/60 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-2xl">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Confirmação de Presença (RSVP)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Convite para até <strong className="text-slate-700 dark:text-slate-200">{invite.max_guests} vagas</strong>
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl text-sm font-medium animate-fade-in flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opção de Presença */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setWillAttend(true)}
            className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
              willAttend
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="text-2xl">🎉</span>
            <span>Vou Comemorar!</span>
          </button>

          <button
            type="button"
            onClick={() => setWillAttend(false)}
            className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all flex flex-col items-center justify-center gap-2 ${
              !willAttend
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 shadow-md ring-2 ring-rose-500/20'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="text-2xl">😔</span>
            <span>Não Poderei Ir</span>
          </button>
        </div>

        {/* Formulário de Acompanhantes se Confirmou */}
        {willAttend && (
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

            {/* Recado para o Anfitrião */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Deixe uma mensagem para o aniversariante (opcional):
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

        {!willAttend && (
          <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              Ao informar que não poderá ir, o convite será liberado. Se mudar de ideia, poderá alterar sua resposta antes do término do prazo.
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
            <span>Enviando resposta...</span>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Confirmar Minha Resposta</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
