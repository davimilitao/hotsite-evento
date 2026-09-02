'use client';

import React, { useState } from 'react';
import { Invite } from '@/types';
import { toggleCheckin } from '@/lib/db';
import { Search, UserCheck, CheckCircle2, QrCode, ShieldCheck, DoorOpen, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckinScannerProps {
  invites: Invite[];
  onRefresh: () => void;
}

export function CheckinScanner({ invites, onRefresh }: CheckinScannerProps) {
  const [search, setSearch] = useState('');

  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');
  const checkedInInvites = confirmedInvites.filter((i) => i.checked_in);

  const totalGuestsInside = checkedInInvites.reduce((sum, i) => sum + i.confirmed_count, 0);
  const totalGuestsExpected = confirmedInvites.reduce((sum, i) => sum + i.confirmed_count, 0);

  const filtered = confirmedInvites.filter(
    (i) =>
      i.head_name.toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search) ||
      i.guests.some((g) => g.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggleCheckin = async (invite: Invite) => {
    const nextState = !invite.checked_in;
    await toggleCheckin(invite.id, nextState);

    if (nextState) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Portaria Mobile */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-emerald-500/30 text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <DoorOpen className="w-4 h-4 text-emerald-400" /> Modo Recepção / Portaria
        </div>

        <h3 className="text-2xl font-black text-white">Check-in na Entrada da Festa</h3>

        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-around">
          <div>
            <span className="block text-3xl font-black text-emerald-400">{totalGuestsInside}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Presentes no Salão</span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <span className="block text-3xl font-black text-slate-300">{totalGuestsExpected}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Confirmados Totais</span>
          </div>
        </div>
      </div>

      {/* Busca Rápida */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Digite o nome do convidado ou acompanhante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Lista de Convidados para Entrada */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
            Nenhum convidado confirmado encontrado com a busca "{search}".
          </div>
        ) : (
          filtered.map((invite) => (
            <div
              key={invite.id}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                invite.checked_in
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400/80 shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{invite.head_name}</h4>
                  <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded-full text-xs">
                    {invite.confirmed_count} {invite.confirmed_count === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                </div>

                {invite.table_id && (
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    📍 Assento: {invite.table_id}
                  </p>
                )}

                {/* Nomes dos acompanhantes */}
                {invite.guests && invite.guests.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {invite.guests.map((g, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                      >
                        {g.name} {g.dietary ? `(${g.dietary})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de 1 toque Check-in */}
              <button
                onClick={() => handleToggleCheckin(invite)}
                className={`py-3.5 px-6 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                  invite.checked_in
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700'
                }`}
              >
                {invite.checked_in ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>ENTRADA REGISTRADA</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>REGISTRAR ENTRADA</span>
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
