'use client';

import React, { useState } from 'react';
import { Invite, Table, Person } from '@/types';
import { FloorplanModal } from './FloorplanModal';
import { Armchair, Sparkles, Compass, MapPin } from 'lucide-react';

interface SeatCardProps {
  invite: Invite;
  tables: Table[];
  persons?: Person[];
}

export function SeatCard({ invite, tables, persons }: SeatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const assignedTable = tables.find((t) => t.id === invite.table_id);

  if (invite.status !== 'confirmed') {
    return null; // Exibe o assento apenas após confirmação de presença
  }

  return (
    <>
      <section className="bg-[#6d44e4] text-white rounded-3xl p-6 shadow-xl space-y-4">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white text-[#6d44e4] rounded-2xl shadow-sm shrink-0">
            <Armchair className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-white/90 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> ASSENTO DA SUA FAMÍLIA
            </span>
            <h2 className="text-xl font-extrabold text-white">
              {assignedTable ? `Mesa: ${assignedTable.name}` : 'Mesa em Definição'}
            </h2>
          </div>
        </div>

        {/* Inner White Box */}
        {assignedTable ? (
          <div className="bg-white text-[#1e152d] p-4 sm:p-5 rounded-2xl shadow-sm space-y-2">
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
              Sua mesa reservada para este dia especial é{' '}
              <strong className="text-[#1e152d] font-black">{assignedTable.name}</strong>.
            </p>
            {assignedTable.description && (
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#6d44e4] shrink-0" />
                <span>Localização: {assignedTable.description}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white text-[#1e152d] p-4 rounded-2xl shadow-sm">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Sua presença está confirmada! O anfitrião está organizando as mesas e seu lugar aparecerá aqui em breve.
            </p>
          </div>
        )}

        {/* Botão Branco para abrir a Planta do Salão */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-[#1e152d] font-extrabold text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>Ver Localização na Planta do Salão</span>
        </button>
      </section>

      <FloorplanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignedTableId={invite.table_id}
        tables={tables}
        persons={persons}
      />
    </>
  );
}
