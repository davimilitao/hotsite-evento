'use client';

import React from 'react';
import { Table } from '@/types';
import { X, Map, Sparkles, UserCheck } from 'lucide-react';

interface FloorplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTableId: string | null;
  tables: Table[];
}

export function FloorplanModal({ isOpen, onClose, assignedTableId, tables }: FloorplanModalProps) {
  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === assignedTableId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Planta Baixa do Salão</h3>
              <p className="text-xs text-purple-200">Mapa de assentos do evento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo da Planta SVG */}
        <div className="p-6 overflow-y-auto space-y-4 text-center">
          {currentTable ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3.5 rounded-2xl flex items-center justify-between text-left">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sua Mesa Reservada
                </span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">{currentTable.name}</p>
                {currentTable.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentTable.description}</p>
                )}
              </div>
              <div className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm uppercase tracking-wide">
                Reservado
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-xs text-slate-500">
              Sua mesa será atribuída em breve pelo anfitrião.
            </div>
          )}

          {/* Desenho do Salão Interativo SVG */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative shadow-inner">
            <svg viewBox="0 0 400 300" className="w-full h-auto rounded-xl">
              {/* Fundo do Salão / Layout */}
              <rect x="10" y="10" width="380" height="280" rx="15" fill="#0f172a" stroke="#334155" strokeWidth="2" />

              {/* Palco Principal */}
              <rect x="120" y="20" width="160" height="35" rx="8" fill="#312e81" stroke="#4f46e5" strokeWidth="1.5" />
              <text x="200" y="42" fill="#c7d2fe" fontSize="12" fontWeight="bold" textAnchor="middle">
                🎤 PALCO & ANFITRIÃO
              </text>

              {/* Bar & Bebidas */}
              <rect x="25" y="60" width="45" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <text x="47" y="125" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle" transform="rotate(-90 47 125)">
                🍹 BAR DE DRINKS
              </text>

              {/* Pista de Dança */}
              <rect x="140" y="90" width="120" height="100" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 3" />
              <text x="200" y="145" fill="#a5b4fc" fontSize="11" fontWeight="bold" textAnchor="middle">
                💃 PISTA DE DANÇA 🕺
              </text>

              {/* Mesas Renderizadas */}
              {/* Mesa 01 (Família VIP) */}
              <g className="cursor-pointer">
                <circle
                  cx="100"
                  cy="235"
                  r="24"
                  fill={assignedTableId === 'mesa-01' ? '#f59e0b' : '#334155'}
                  stroke={assignedTableId === 'mesa-01' ? '#fbbf24' : '#64748b'}
                  strokeWidth={assignedTableId === 'mesa-01' ? '3' : '1.5'}
                  className={assignedTableId === 'mesa-01' ? 'animate-pulse' : ''}
                />
                <text x="100" y="239" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  M-01
                </text>
              </g>

              {/* Mesa 02 (Amigos) */}
              <g className="cursor-pointer">
                <circle
                  cx="200"
                  cy="235"
                  r="24"
                  fill={assignedTableId === 'mesa-02' ? '#f59e0b' : '#334155'}
                  stroke={assignedTableId === 'mesa-02' ? '#fbbf24' : '#64748b'}
                  strokeWidth={assignedTableId === 'mesa-02' ? '3' : '1.5'}
                  className={assignedTableId === 'mesa-02' ? 'animate-pulse' : ''}
                />
                <text x="200" y="239" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  M-02
                </text>
              </g>

              {/* Mesa 03 */}
              <g className="cursor-pointer">
                <circle
                  cx="300"
                  cy="235"
                  r="24"
                  fill={assignedTableId === 'mesa-03' ? '#f59e0b' : '#334155'}
                  stroke={assignedTableId === 'mesa-03' ? '#fbbf24' : '#64748b'}
                  strokeWidth={assignedTableId === 'mesa-03' ? '3' : '1.5'}
                  className={assignedTableId === 'mesa-03' ? 'animate-pulse' : ''}
                />
                <text x="300" y="239" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  M-03
                </text>
              </g>

              {/* Mesa 04 */}
              <g className="cursor-pointer">
                <circle
                  cx="300"
                  cy="140"
                  r="24"
                  fill={assignedTableId === 'mesa-04' ? '#f59e0b' : '#334155'}
                  stroke={assignedTableId === 'mesa-04' ? '#fbbf24' : '#64748b'}
                  strokeWidth={assignedTableId === 'mesa-04' ? '3' : '1.5'}
                  className={assignedTableId === 'mesa-04' ? 'animate-pulse' : ''}
                />
                <text x="300" y="144" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  M-04
                </text>
              </g>

              {/* Lounge Estofados */}
              <g className="cursor-pointer">
                <rect
                  x="20"
                  y="220"
                  width="45"
                  height="50"
                  rx="8"
                  fill={assignedTableId === 'lounge-01' ? '#f59e0b' : '#1e293b'}
                  stroke={assignedTableId === 'lounge-01' ? '#fbbf24' : '#475569'}
                  strokeWidth="1.5"
                />
                <text x="42" y="249" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  LOUNGE
                </text>
              </g>
            </svg>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 inline-block animate-pulse" />
              <span>Sua Mesa Reservada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500 inline-block" />
              <span>Outras Mesas</span>
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-700"
          >
            Fechar Mapa
          </button>
        </div>
      </div>
    </div>
  );
}
