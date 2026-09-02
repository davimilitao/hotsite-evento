'use client';

import React, { useState } from 'react';
import { Invite, Table } from '@/types';
import { FloorplanModal } from './FloorplanModal';
import { Armchair, MapPin, Sparkles, Compass } from 'lucide-react';

interface SeatCardProps {
  invite: Invite;
  tables: Table[];
}

export function SeatCard({ invite, tables }: SeatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const assignedTable = tables.find((t) => t.id === invite.table_id);

  if (invite.status !== 'confirmed') {
    return null; // Exibe o assento apenas após confirmação de presença
  }

  return (
    <>
      <section className="bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-slate-900/40 dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-2xl">
              <Armchair className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Assento da Sua Família
              </span>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {assignedTable ? assignedTable.name : 'Mesa em Definição'}
              </h2>
            </div>
          </div>
        </div>

        {assignedTable ? (
          <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Sua mesa reservada para este dia especial é{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-bold">{assignedTable.name}</strong>.
            </p>
            {assignedTable.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Localização: {assignedTable.description}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40 p-3 rounded-xl">
            Sua presença está confirmada! O anfitrião está organizando as mesas e seu lugar aparecerá aqui em breve.
          </p>
        )}

        {/* Botão para abrir o Mapa / Planta Baixa */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-sm rounded-2xl shadow-md border border-amber-500/40 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Ver Localização na Planta do Salão</span>
        </button>
      </section>

      <FloorplanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignedTableId={invite.table_id}
        tables={tables}
      />
    </>
  );
}
