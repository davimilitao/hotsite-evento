'use client';

import React, { useState, useEffect } from 'react';
import { Table, Person } from '@/types';
import { getAllPersons } from '@/lib/db';
import { X, Map, Sparkles, Users, Armchair, UserCheck, Info } from 'lucide-react';

interface FloorplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTableId: string | null;
  tables: Table[];
  persons?: Person[];
}

export function FloorplanModal({
  isOpen,
  onClose,
  assignedTableId,
  tables,
  persons: initialPersons,
}: FloorplanModalProps) {
  const [persons, setPersons] = useState<Person[]>(initialPersons || []);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Carrega lista de pessoas se não tiver sido fornecida via props
  useEffect(() => {
    if (isOpen) {
      if (initialPersons && initialPersons.length > 0) {
        setPersons(initialPersons);
      } else {
        getAllPersons().then(setPersons).catch(console.error);
      }
    }
  }, [isOpen, initialPersons]);

  // Define a mesa reservada do convidado como selecionada por padrão ao abrir
  useEffect(() => {
    if (isOpen && assignedTableId) {
      const assigned = tables.find((t) => t.id === assignedTableId);
      if (assigned) {
        setSelectedTable(assigned);
      }
    } else if (isOpen && tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0]);
    }
  }, [isOpen, assignedTableId, tables]);

  if (!isOpen) return null;

  const currentAssignedTable = tables.find((t) => t.id === assignedTableId);
  const activeTable = selectedTable || currentAssignedTable || tables[0];
  const tablePersons = activeTable ? persons.filter((p) => p.table_id === activeTable.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-300 flex items-center gap-2">
                Planta Baixa Interativa do Salão
              </h3>
              <p className="text-xs text-slate-400">
                Toque em qualquer mesa no mapa para ver quem sentará nela
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal do Modal (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Banner de Reserva do Convidado */}
          {currentAssignedTable ? (
            <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping absolute opacity-75" />
                  <span className="w-3 h-3 bg-amber-400 rounded-full relative" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sua Mesa Reservada
                  </span>
                  <h4 className="text-base font-extrabold text-white">{currentAssignedTable.name}</h4>
                  {currentAssignedTable.description && (
                    <p className="text-xs text-amber-200/80">{currentAssignedTable.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTable(currentAssignedTable)}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                Ver no Mapa
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-2 text-xs text-slate-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Sua mesa será atribuída em breve pelo anfitrião do evento. Explore o mapa abaixo!</span>
            </div>
          )}

          {/* CONTAINER DA PLANTA BAIXA COM IMAGEM DO GPT + HOTSPOTS INTERATIVOS */}
          <div className="relative w-full rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl bg-slate-950 group">
            {/* Imagem de Fundo da Planta Baixa Real do Salão */}
            <img
              src="/salao-planta-baixa.jpg"
              alt="Planta Baixa Interativa do Salão - Buffet Espaço Estupendo"
              className="w-full h-auto object-cover select-none"
            />

            {/* HOTSPOTS SOBREPOSTOS DAS MESAS */}
            {tables.map((table) => {
              const isAssigned = table.id === assignedTableId;
              const isSelected = activeTable?.id === table.id;

              // Usa posição percentual configurada em db.ts
              const posX = table.position?.x ?? 50;
              const posY = table.position?.y ?? 50;

              return (
                <div
                  key={table.id}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <button
                    onClick={() => setSelectedTable(table)}
                    className={`relative group/btn flex items-center justify-center transition-all cursor-pointer ${
                      isAssigned
                        ? 'w-10 h-10 sm:w-12 sm:h-12 text-xs font-black'
                        : isSelected
                        ? 'w-9 h-9 sm:w-11 sm:h-11 text-xs font-bold'
                        : 'w-8 h-8 sm:w-10 sm:h-10 text-[11px] font-semibold hover:scale-110'
                    }`}
                    title={table.name}
                  >
                    {/* Efeito Halo / Anel Pulsante Dourado para a Mesa Reservada do Convidado */}
                    {isAssigned && (
                      <>
                        <span className="absolute -inset-2.5 rounded-full bg-amber-400/40 animate-ping" />
                        <span className="absolute -inset-1.5 rounded-full border-2 border-amber-400 animate-pulse" />
                      </>
                    )}

                    {/* Botão Hotspot da Mesa */}
                    <span
                      className={`w-full h-full rounded-full flex items-center justify-center border-2 transition-all shadow-lg backdrop-blur-xs ${
                        isAssigned
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black ring-4 ring-amber-400/50 shadow-amber-500/50'
                          : isSelected
                          ? 'bg-purple-600 text-white border-purple-300 ring-4 ring-purple-500/50 font-black'
                          : 'bg-slate-900/80 text-amber-300 border-amber-500/60 hover:bg-amber-500 hover:text-slate-950'
                      }`}
                    >
                      {table.name.replace(/Mesa\s*/i, 'M')}
                    </span>

                    {/* Tooltip com Nome da Mesa no Hover */}
                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/btn:block bg-slate-950 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-500/40 whitespace-nowrap z-20 pointer-events-none shadow-xl">
                      {table.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legenda Explicativa do Mapa */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="font-bold text-amber-300">Sua Mesa Reservada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-300" />
              <span className="text-slate-300">Mesa Selecionada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-900 border border-amber-500/60" />
              <span>Outras Mesas do Salão</span>
            </div>
          </div>

          {/* CARD POPUP DE DETALHES DA MESA SELECIONADA */}
          {activeTable && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-extrabold text-white">{activeTable.name}</h4>
                    {activeTable.id === assignedTableId && (
                      <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded-full tracking-wider">
                        Sua Mesa
                      </span>
                    )}
                  </div>
                  {activeTable.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{activeTable.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700/80 self-start sm:self-auto">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300">Capacidade:</span>
                  <span className="text-amber-400 font-extrabold">
                    {tablePersons.length} / {activeTable.capacity} pessoas
                  </span>
                </div>
              </div>

              {/* LISTA DE CONVIDADOS DA MESA */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Armchair className="w-3.5 h-3.5 text-amber-400" /> Pessoas Alocadas nesta Mesa ({tablePersons.length})
                </span>

                {tablePersons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {tablePersons.map((person) => (
                      <div
                        key={person.id}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                          person.table_id === assignedTableId
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">{person.name}</span>
                        </div>
                        {person.role_in_invite === 'head' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0 ml-1">
                            Mandante
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    Nenhum convidado alocado nesta mesa até o momento.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            Planta oficial do Buffet Espaço Estupendo (São Bernardo do Campo - SP)
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer ml-auto"
          >
            Fechar Mapa
          </button>
        </div>
      </div>
    </div>
  );
}
