'use client';

import React from 'react';
import { Invite, Table } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { CheckCircle2, XCircle, Armchair, Navigation, X, CalendarClock } from 'lucide-react';

interface RSVPFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  invite: Invite;
  assignedTable?: Table;
  onGoToLocation: () => void;
}

export function RSVPFeedbackModal({
  isOpen,
  onClose,
  invite,
  assignedTable,
  onGoToLocation,
}: RSVPFeedbackModalProps) {
  if (!isOpen) return null;

  const isConfirmed = invite.status === 'confirmed';
  const isPendingDate = invite.status === 'pending_date';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-purple-500/30 text-center space-y-5 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-2">
          {isConfirmed && (
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          )}

          {isPendingDate && (
            <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-purple-500/10">
              <CalendarClock className="w-10 h-10" />
            </div>
          )}

          {!isConfirmed && !isPendingDate && (
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-rose-500/10">
              <XCircle className="w-10 h-10" />
            </div>
          )}

          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {isConfirmed
              ? 'Presença Confirmada! 🎉'
              : isPendingDate
              ? 'Pedido de Prazo Registrado ⏳'
              : 'Resposta Registrada 😔'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {isConfirmed
              ? `Que alegria! Registramos ${invite.confirmed_count} ${
                  invite.confirmed_count === 1 ? 'pessoa' : 'pessoas'
                } para comemorar essa data inesquecível.`
              : isPendingDate
              ? `Recebemos sua solicitação! Guardaremos a reserva até dia ${formatDateShort(
                  invite.requested_date
                )}.`
              : 'Sua resposta foi salva. Sentiremos sua falta no evento!'}
          </p>
        </div>

        {isConfirmed && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span>Acompanhantes Registrados:</span>
              <span className="text-purple-600 dark:text-purple-400">{invite.confirmed_count} vagas</span>
            </div>

            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-2 border-l-2 border-purple-500">
              {invite.guests.map((g, idx) => (
                <li key={idx} className="truncate">
                  • {g.name} {g.dietary ? `(${g.dietary})` : ''}
                </li>
              ))}
            </ul>

            {assignedTable ? (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Armchair className="w-3.5 h-3.5 text-amber-400" /> Mesa Atribuída:
                </span>
                <span className="text-xs font-bold text-amber-500">{assignedTable.name}</span>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 italic">
                Sua mesa será atribuída em breve pelo anfitrião.
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 pt-1">
          {isConfirmed && (
            <button
              onClick={() => {
                onClose();
                onGoToLocation();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>Ver Localização & Mapa da Mesa</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
