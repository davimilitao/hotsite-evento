'use client';

import React, { useState, useEffect } from 'react';
import { Invite, Guest, EventConfig, Person } from '@/types';
import { saveInvite, savePerson } from '@/lib/db';
import { isInviteExpired, formatDateShort } from '@/lib/utils';
import { Utensils, Send, AlertTriangle, HeartHandshake, CalendarClock, Clock, Edit2, CheckCircle2, XCircle, RefreshCw, Crown, Sparkles, Calendar } from 'lucide-react';
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
  const [declinedMessage, setDeclinedMessage] = useState<string>(invite.declined_message || '');
  const [requestedDateReason, setRequestedDateReason] = useState<string>(invite.requested_date_reason || '');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(invite.status === 'pending');

  const isExpired = isInviteExpired(invite, config.deadline_rsvp);
  const activeDeadline = invite.individual_deadline || config.deadline_rsvp;
  const maxDeadlineDate = activeDeadline ? activeDeadline.slice(0, 10) : '';
  const isAlreadyResponded = invite.status !== 'pending';

  const headPerson = allPersons?.find((p) => p.id === invite.head_person_id || p.name.trim().toLowerCase() === invite.head_name.trim().toLowerCase());
  const familyName = headPerson?.family_name;
  const isFamilyInvite = invite.invite_type === 'family' || guests.length > 1;

  const displayGreeting = isFamilyInvite
    ? `Olá, ${invite.head_name}${familyName ? ` e ${familyName}` : ' e Família'}!`
    : `Olá, ${invite.head_name}!`;

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

      const firstRequestedDate = guests.find((g) => g.requested_date)?.requested_date || invite.requested_date || null;
      const now = new Date().toISOString();

      const updatedInvite = await saveInvite({
        ...invite,
        status: overallStatus,
        confirmed_count: confirmedCount,
        guests,
        notes,
        declined_message: overallStatus === 'declined' ? declinedMessage : (invite.declined_message || null),
        requested_date: overallStatus === 'pending_date' ? firstRequestedDate : (invite.requested_date || null),
        requested_date_reason: overallStatus === 'pending_date' ? requestedDateReason : (invite.requested_date_reason || null),
        requested_date_status: overallStatus === 'pending_date' ? 'pending' : (invite.requested_date_status || undefined),
        responded_at: now,
      });

      // Dispara e-mail de notificação para a aniversariante via Resend (em background)
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: overallStatus,
          token: invite.id,
          headName: invite.head_name,
          confirmedCount,
          guests,
          notes,
          declinedMessage: overallStatus === 'declined' ? declinedMessage : '',
          requestedDate: firstRequestedDate ? formatDateShort(firstRequestedDate) : '',
          requestedDateReason: overallStatus === 'pending_date' ? requestedDateReason : '',
          eventTitle: config.title,
          recipientEmail: config.support_email || 'militao46@gmail.com',
          ccEmail: config.admin_cc_email || '',
        }),
      }).catch((err) => console.warn('Erro ao disparar e-mail Resend:', err));

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
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-6">
      {isExpired && (
        <div className="bg-rose-500/10 border border-rose-300 text-rose-700 p-4 rounded-2xl space-y-2 animate-pulse">
          <div className="flex items-center gap-2 font-extrabold text-sm text-rose-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>URGENTE: O Prazo Inicial deste Convite Expirou</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            O prazo limite era <strong>{formatDateShort(activeDeadline)}</strong>. Para garantirmos seu lugar antes de reatribuir a vaga para a lista de reserva do buffet, confirme urgentemente se <strong>SIM</strong> ou <strong>NÃO</strong>.
          </p>
        </div>
      )}

      {/* Header do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1e152d]">Confirmação de Presença</h2>
            <p className="text-xs text-slate-500">
              Espaço exclusivo para <strong className="text-[#1e152d]">{guests.length} integrante(s)</strong>
            </p>
          </div>
        </div>

        {activeDeadline && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6d44e4] bg-[#f4effd] px-3 py-1.5 rounded-xl border border-purple-200/50 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Até {formatDateShort(activeDeadline)}</span>
          </div>
        )}
      </div>

      {/* MENSAGEM ACOLHEDORA DE BOAS-VINDAS & PRAZO DESTACADO */}
      <div className="space-y-3 pt-1 pb-1">
        <h3 className="text-sm sm:text-base font-black text-[#1e152d]">
          {displayGreeting}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          Que alegria ter você com a gente para celebrar os <strong>40 Anos de Fernanda Seppi</strong>! Por favor, informe abaixo se você e sua família poderão comparecer.
        </p>

        {activeDeadline && (
          <div className="bg-[#f4effd] border border-purple-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-[#1e152d] shadow-sm">
            <div className="p-2.5 bg-[#6d44e4] text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-[#6d44e4] flex items-center gap-2 flex-wrap">
                <span>Data Límite de Confirmação:</span>
                <span className="bg-[#6d44e4] text-white px-2.5 py-0.5 rounded-lg text-xs font-black">
                  Até {formatDateShort(activeDeadline)}
                </span>
              </p>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Como teremos uma comemoração inesquecível preparada com muito amor no buffet, pedimos gentilmente que confirme sua presença até o dia <strong>{formatDateShort(activeDeadline)}</strong> para garantirmos a sua vaga na lista oficial!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODO RESUMO: Exibição Fixa Flat em Linha */}
      {!isEditing && isAlreadyResponded ? (
        <div className="bg-[#f9f7fd] p-4 sm:p-5 rounded-2xl border border-purple-200/60 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
            <span className="font-black text-xs sm:text-sm text-[#1e152d]">
              Resposta Registrada ({invite.confirmed_count} confirmados):
            </span>

            {/* Trava: Convidado CONFIRMADO não pode alterar sozinho no hotsite (Apenas Admin/Aniversariante) */}
            {invite.status !== 'confirmed' ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-purple-100 text-[#6d44e4] hover:bg-purple-200/80 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" /> <span>Alterar</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Presença Confirmada
              </span>
            )}
          </div>

          <div className="divide-y divide-purple-100/80 text-xs">
            {guests.map((g, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <span className="font-extrabold text-[#1e152d] flex items-center gap-1.5 min-w-0 truncate">
                  {idx === 0 ? <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <span className="text-purple-300 font-normal">•</span>}
                  <span className="truncate">{g.name}</span>
                </span>

                <div className="shrink-0">
                  {(g.status || 'confirmed') === 'confirmed' ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Presença Confirmada
                    </span>
                  ) : g.status === 'pending_date' ? (
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-600 shrink-0" /> Pediu Prazo {g.requested_date ? `(${formatDateShort(g.requested_date)})` : ''}
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600 shrink-0" /> Não Poderá Ir
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Orientação para Confirmados */}
          {invite.status === 'confirmed' && (
            <div className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-sm flex items-start gap-2.5 mt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#1e152d] block">Presença Registrada com Sucesso!</span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Sua resposta está salva e contamos com você no evento! Caso ocorra algum imprevisto grave que impeça seu comparecimento, por favor entre em contato direto com a aniversariante ou cerimonial.
                </p>
              </div>
            </div>
          )}

          {/* Exibição do recado carinhoso enviado ao recusar */}
          {invite.declined_message && (
            <div className="text-xs text-rose-700 italic bg-rose-50/60 p-3 rounded-xl border border-rose-100 shadow-sm mt-2">
              &quot;{invite.declined_message}&quot;
            </div>
          )}

          {invite.notes && (
            <div className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-purple-100 shadow-sm mt-2">
              &quot;{invite.notes}&quot;
            </div>
          )}
        </div>
      ) : (
        /* MODO EDIÇÃO */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-[#1e152d] block">
              Confirme a presença individual de cada integrante da família:
            </label>

            <div className="space-y-4">
              {guests.map((guest, index) => (
                <div
                  key={guest.person_id || index}
                  className="bg-[#f9f7fd] border border-purple-100 p-4 rounded-2xl space-y-3 relative shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2">
                    <span className="text-xs font-black text-[#6d44e4] uppercase tracking-wider flex items-center gap-1.5">
                      {index === 0 ? (
                        <>
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Titular / Contato Principal</span>
                        </>
                      ) : (
                        `Integrante #${index + 1} da família`
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Assento Reservado</span>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nome Completo:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome Completo"
                      value={guest.name}
                      onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-purple-200/80 rounded-xl text-sm font-bold text-[#1e152d] focus:ring-2 focus:ring-[#6d44e4] focus:outline-none shadow-sm"
                    />
                  </div>

                  {/* Status Individual deste Integrante */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Status de Presença para {guest.name || 'este integrante'}:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGuestChange(index, 'status', 'confirmed')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border cursor-pointer active:scale-95 shadow-sm ${
                          (guest.status || 'confirmed') === 'confirmed'
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white text-emerald-800 border-emerald-200/80 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Vou</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGuestChange(index, 'status', 'pending_date')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border cursor-pointer active:scale-95 shadow-sm ${
                          guest.status === 'pending_date'
                            ? 'bg-[#6d44e4] text-white border-[#6d44e4] ring-2 ring-purple-500/20'
                            : 'bg-white text-[#6d44e4] border-purple-200/80 hover:bg-purple-50'
                        }`}
                      >
                        <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                        <span>Prazo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGuestChange(index, 'status', 'declined')}
                        className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border cursor-pointer active:scale-95 shadow-sm ${
                          guest.status === 'declined'
                            ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/20'
                            : 'bg-white text-rose-700 border-rose-200/80 hover:bg-rose-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Não vou</span>
                      </button>
                    </div>
                  </div>

                  {/* Campo de Data se Pediu Prazo */}
                  {guest.status === 'pending_date' && (
                    <div className="p-3.5 bg-[#f4effd] rounded-xl border border-purple-200/60 space-y-2 animate-fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-[#6d44e4] mb-1">
                          Até qual data precisa de prazo para {guest.name}?
                        </label>
                        <input
                          type="date"
                          required
                          max={maxDeadlineDate}
                          value={guest.requested_date ? guest.requested_date.slice(0, 10) : ''}
                          onChange={(e) => handleGuestChange(index, 'requested_date', e.target.value)}
                          className="w-full p-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-[#1e152d]"
                        />
                        {activeDeadline && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            * Data limite máxima contratada com o buffet: {formatDateShort(activeDeadline)}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#6d44e4] mb-1">
                          Motivo do pedido de prazo (opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Aguardando escala de trabalho no hospital"
                          value={requestedDateReason}
                          onChange={(e) => setRequestedDateReason(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-[#1e152d] focus:ring-1 focus:ring-[#6d44e4] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Restrições alimentares opcional */}
                  {(guest.status || 'confirmed') === 'confirmed' && (
                    <div className="flex items-center gap-2 pt-1">
                      <Utensils className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Restrição alimentar ou alergia (opcional, ex: Sem Glúten)"
                        value={guest.dietary || ''}
                        onChange={(e) => handleGuestChange(index, 'dietary', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-purple-100 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-[#6d44e4] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recado Carinhoso se Recusar */}
            {guests.every((g) => g.status === 'declined') && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 animate-fade-in">
                <label className="block text-xs font-extrabold text-rose-800">
                  Uma pena que não poderá vir! Quer deixar um recado carinhoso para a Fernanda?
                </label>
                <textarea
                  rows={2}
                  placeholder="Escreva sua mensagem de carinho e felicitações..."
                  value={declinedMessage}
                  onChange={(e) => setDeclinedMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-medium text-[#1e152d] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}

            {/* Recado para a Aniversariante */}
            <div>
              <label className="block text-xs font-bold text-[#1e152d] mb-1">
                Deixe um recado para a aniversariante (opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Escreva uma mensagem carinhosa para Fernanda Seppi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-purple-200/80 rounded-xl text-sm font-medium text-[#1e152d] focus:ring-2 focus:ring-[#6d44e4] focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Botão Único de Salvar Respostas no Final */}
          <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
            {isAlreadyResponded && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white shrink-0" />
                  <span>Enviando confirmação...</span>
                </>
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
