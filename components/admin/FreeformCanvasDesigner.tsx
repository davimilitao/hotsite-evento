'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Table, Person } from '@/types';
import { saveTable, getTablePosition, DEFAULT_TABLE_POSITIONS } from '@/lib/db';
import { Move, RefreshCw, Sparkles, Check, Info } from 'lucide-react';

interface FreeformCanvasDesignerProps {
  tables: Table[];
  persons: Person[];
  activeTable: Table | null;
  onSelectTable: (table: Table) => void;
  onRefresh: () => void;
}

export function FreeformCanvasDesigner({
  tables,
  persons,
  activeTable,
  onSelectTable,
  onRefresh,
}: FreeformCanvasDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [positionsMap, setPositionsMap] = useState<Record<string, { x: number; y: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inicializa mapa de posições com base nas mesas fornecidas
  useEffect(() => {
    const initialMap: Record<string, { x: number; y: number }> = {};
    tables.forEach((t, idx) => {
      initialMap[t.id] = getTablePosition(t, idx);
    });
    setPositionsMap(initialMap);
  }, [tables]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // HANDLER: Inicia o arraste via Pointer Event (suporta Mouse e Touch Screen)
  const handlePointerDown = (e: React.PointerEvent, table: Table) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingTableId(table.id);
    onSelectTable(table);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // HANDLER: Movimenta o elemento em tempo real mantendo dentro dos limites do container
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTableId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Limites de segurança (Padding das paredes do salão)
    newX = Math.max(10, Math.min(90, newX));
    newY = Math.max(8, Math.min(92, newY));

    // Arredonda para 1 casa decimal para suavidade
    const roundedX = Math.round(newX * 10) / 10;
    const roundedY = Math.round(newY * 10) / 10;

    setPositionsMap((prev) => ({
      ...prev,
      [draggingTableId]: { x: roundedX, y: roundedY },
    }));
  };

  // HANDLER: Finaliza o arraste e salva a posição no banco
  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!draggingTableId) return;

    const tableId = draggingTableId;
    setDraggingTableId(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}

    const table = tables.find((t) => t.id === tableId);
    const pos = positionsMap[tableId];

    if (table && pos) {
      setIsSaving(true);
      try {
        await saveTable({
          ...table,
          position: pos,
        });
        onRefresh();
        showToast(`Posição da "${table.name}" salva!`);
      } catch (err) {
        console.error('Erro ao salvar posição da mesa:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // HANDLER: Restaura o layout padrão para as 11 posições calculadas
  const handleResetLayout = async () => {
    if (!confirm('Deseja restaurar a disposição inicial padrão das mesas no salão?')) return;
    setIsSaving(true);
    try {
      for (let i = 0; i < tables.length; i++) {
        const t = tables[i];
        const defaultPos = DEFAULT_TABLE_POSITIONS[t.id] || getTablePosition(t, i);
        await saveTable({
          ...t,
          position: defaultPos,
        });
      }
      onRefresh();
      showToast('Layout padrão do salão restaurado com sucesso!');
    } catch (err) {
      console.error('Erro ao restaurar layout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header do Canvas Designer */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 rounded-3xl border border-purple-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold mb-1 border border-amber-400/30">
            <Move className="w-3.5 h-3.5" /> Canvas 2D - Arraste Livre por Pointer/Touch
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-amber-300">
            Designer de Leiaute do Salão
          </h3>
          <p className="text-xs text-slate-300">
            Clique e arraste qualquer mesa livremente pelo salão para reposicioná-la em tempo real.
          </p>
        </div>

        <button
          onClick={handleResetLayout}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          <span>Restaurar Alinhamento Padrão</span>
        </button>
      </div>

      {/* Toast Notificador */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce border border-emerald-400">
          <Check className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CONTAINER DO SALÃO VAZIO + ELEMENTOS DE MESA MÓVEIS */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full rounded-3xl border-2 border-slate-700/80 overflow-hidden shadow-2xl bg-slate-950 select-none touch-none"
      >
        {/* Imagem de Fundo do Salão Vazio Sem Mesas Pré-desenhadas */}
        <img
          src="/salao-vazio-planta.jpg"
          alt="Planta Baixa do Salão Vazio"
          className="w-full h-auto object-cover pointer-events-none"
        />

        {/* ELEMENTOS GRÁFICOS MÓVEIS DE MESA */}
        {tables.map((table, idx) => {
          const tablePersons = persons.filter((p) => p.table_id === table.id);
          const isSelected = activeTable?.id === table.id;
          const isDragging = draggingTableId === table.id;
          const pos = positionsMap[table.id] || getTablePosition(table, idx);

          return (
            <div
              key={table.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ${
                isDragging ? 'z-40 scale-110' : isSelected ? 'z-30 scale-105' : 'z-10 hover:scale-105'
              }`}
            >
              <div
                onPointerDown={(e) => handlePointerDown(e, table)}
                onPointerUp={handlePointerUp}
                className="relative cursor-grab active:cursor-grabbing flex flex-col items-center group"
              >
                {/* Efeito de Destaque Selecionado */}
                {isSelected && (
                  <span className="absolute -inset-3 rounded-full border-2 border-purple-400 animate-pulse pointer-events-none" />
                )}

                {isDragging && (
                  <span className="absolute -inset-4 rounded-full border-2 border-amber-400 bg-amber-400/20 animate-ping pointer-events-none" />
                )}

                {/* Imagem do Elemento Gráfico de Mesa 3D com Moldura Circular */}
                <div
                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 shadow-2xl bg-slate-900/90 transition-all ${
                    isDragging
                      ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-amber-500/50 scale-110'
                      : isSelected
                      ? 'border-purple-400 ring-4 ring-purple-500/50'
                      : 'border-amber-500/60 group-hover:border-amber-400'
                  }`}
                >
                  <img
                    src="/elemento-mesa-redonda.jpg"
                    alt={table.name}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                </div>

                {/* BADGE DE IDENTIFICAÇÃO DO GRUPO / FAMÍLIA EM CIMA DA MESA */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black whitespace-nowrap shadow-xl border backdrop-blur-md ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-300'
                        : 'bg-slate-950/90 text-amber-300 border-amber-500/60'
                    }`}
                  >
                    {(() => {
                      const n = table.name.toLowerCase();
                      const num = table.name.match(/\d+/)?.[0] || '';
                      if (n.includes('esquerda')) return `E-${num}`;
                      if (n.includes('direita')) return `D-${num}`;
                      if (n.includes('mesa')) return `M-${num}`;
                      return table.name.length > 8 ? table.name.substring(0, 7) + '..' : table.name;
                    })()}
                  </span>
                  <span className="mt-0.5 px-1.5 py-0.2 bg-slate-950/80 text-white font-extrabold text-[8px] sm:text-[9px] rounded-full border border-slate-700">
                    {tablePersons.length}/{table.capacity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
