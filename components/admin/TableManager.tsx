'use client';

import React, { useState } from 'react';
import { Table, Invite, Person } from '@/types';
import { saveTable, deleteTable, assignPersonToSeat, unassignPersonSeat, getTablePosition } from '@/lib/db';
import { FreeformCanvasDesigner } from '@/components/admin/FreeformCanvasDesigner';
import {
  Plus,
  Trash2,
  Edit,
  Users,
  Armchair,
  UserPlus,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Map,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

interface TableManagerProps {
  tables: Table[];
  invites: Invite[];
  persons: Person[];
  onRefresh: () => void;
}

export function TableManager({ tables, invites, persons, onRefresh }: TableManagerProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'floorplan' | 'canvas'>('cards');
  const [activeFloorplanTable, setActiveFloorplanTable] = useState<Table | null>(tables[0] || null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(8); // Padrão 8 lugares
  const [shape, setShape] = useState<'round' | 'square' | 'lounge'>('round');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal para alocar pessoa 1:1 no assento específico
  const [selectedAssignment, setSelectedAssignment] = useState<{
    table: Table;
    seatNumber: number;
  } | null>(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  // Pessoas sem assento (Lista de Reserva / Aguardando Mesa)
  const unassignedPersons = persons.filter((p) => !p.table_id);
  const seatedPersons = persons.filter((p) => p.table_id);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableName(`Mesa ${tables.length + 1}`);
    setCapacity(8);
    setShape('round');
    setDescription('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (table: Table) => {
    setEditingTable(table);
    setTableName(table.name);
    setCapacity(table.capacity);
    setShape(table.shape || 'round');
    setDescription(table.description || '');
    setIsAddOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveTable({
        id: editingTable ? editingTable.id : `mesa-${Date.now()}`,
        name: tableName,
        capacity,
        shape,
        description,
      });
      setIsAddOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar mesa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa? As pessoas alocadas nela voltarão para a lista sem mesa.')) return;
    await deleteTable(id);
    if (activeFloorplanTable?.id === id) {
      setActiveFloorplanTable(tables.find((t) => t.id !== id) || null);
    }
    onRefresh();
  };

  const handleAssignPerson = async (personId: string, tableId: string, seatNumber: number) => {
    await assignPersonToSeat(personId, tableId, seatNumber);
    setSelectedAssignment(null);
    onRefresh();
  };

  const handleUnassignPerson = async (personId: string) => {
    await unassignPersonSeat(personId);
    onRefresh();
  };

  const inspectorTable = activeFloorplanTable || tables[0];

  return (
    <div className="space-y-8">
      {/* Topo da Gestão de Mesas & Visual Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold mb-2 border border-amber-300 dark:border-amber-800">
            <Armchair className="w-4 h-4 text-amber-500" /> Gestão 1:1 de Assentos por Pessoa
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Organização do Salão & Cadeiras
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cada pessoa da lista ({persons.length} nomes) ocupa exatamente 1 assento físico. Aloque pessoa por pessoa em cada cadeira.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Visual Switcher */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards & Cadeiras</span>
            </button>
            <button
              onClick={() => {
                setViewMode('floorplan');
                if (tables.length > 0 && !activeFloorplanTable) {
                  setActiveFloorplanTable(tables[0]);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'floorplan'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Planta Baixa Oficial</span>
            </button>
            <button
              onClick={() => {
                setViewMode('canvas');
                if (tables.length > 0 && !activeFloorplanTable) {
                  setActiveFloorplanTable(tables[0]);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Canvas 2D (Livre)</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Mesa
          </button>
        </div>
      </div>

      {/* Contadores 1:1 de Assentos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lista Máster Total</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{persons.length}</span>
            <span className="text-xs text-slate-400 ml-1">pessoas reais</span>
          </div>
          <Users className="w-8 h-8 text-purple-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assentos Ocupados (1:1)</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{seatedPersons.length}</span>
            <span className="text-xs text-slate-400 ml-1">/ 100 buffet</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sem Mesa (Reserva)</span>
            <span className="text-2xl font-black text-amber-500">{unassignedPersons.length}</span>
            <span className="text-xs text-slate-400 ml-1">aguardando mesa</span>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Alerta de Convidados Sem Mesa */}
      {unassignedPersons.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-xs font-bold">
            <Users className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              Existem <strong>{unassignedPersons.length} pessoa(s)</strong> sem mesa atribuída. Somente pessoas com assento definido podem ser convidadas via WhatsApp!
            </span>
          </div>
        </div>
      )}

      {/* MODO PLANTA BAIXA OFICIAL OU CANVAS 2D LIVRE */}
      {(viewMode === 'floorplan' || viewMode === 'canvas') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Lado Esquerdo: Canvas Designer (Livre) ou Planta Baixa Oficial */}
          <div className="lg:col-span-7">
            {viewMode === 'canvas' ? (
              <FreeformCanvasDesigner
                tables={tables}
                persons={persons}
                activeTable={activeFloorplanTable}
                onSelectTable={(table) => setActiveFloorplanTable(table)}
                onRefresh={onRefresh}
              />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-purple-500" />
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                      Planta Baixa Oficial do Salão
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Clique nas mesas para gerenciar cadeiras
                  </span>
                </div>

                {/* Imagem do Salão com Overlays das Mesas */}
                <div className="relative w-full rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl bg-slate-950">
                  <img
                    src="/salao-planta-baixa.jpg"
                    alt="Planta Baixa Interativa do Salão"
                    className="w-full h-auto object-cover select-none"
                  />

                  {tables.map((table, idx) => {
                    const tablePersons = persons.filter((p) => p.table_id === table.id);
                    const isSelected = inspectorTable?.id === table.id;
                    const isFull = tablePersons.length >= table.capacity;
                    const isHalf = tablePersons.length > 0 && tablePersons.length < table.capacity;

                    const pos = getTablePosition(table, idx);

                    return (
                      <div
                        key={table.id}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                      >
                        <button
                          onClick={() => setActiveFloorplanTable(table)}
                          className={`relative flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'w-9 h-9 sm:w-11 sm:h-11 scale-110'
                              : 'w-7 h-7 sm:w-9 sm:h-9 hover:scale-115'
                          }`}
                          title={`${table.name} (${tablePersons.length}/${table.capacity})`}
                        >
                          {isSelected && (
                            <span className="absolute -inset-2 rounded-full border-2 border-purple-400 animate-pulse" />
                          )}

                          <span
                            className={`w-full h-full rounded-full flex flex-col items-center justify-center border-2 shadow-lg backdrop-blur-md text-[9px] sm:text-[10px] font-black leading-none ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-300 ring-4 ring-purple-500/50'
                                : isFull
                                ? 'bg-emerald-600 text-white border-emerald-300'
                                : isHalf
                                ? 'bg-amber-500 text-slate-950 border-amber-300'
                                : 'bg-slate-950/85 text-amber-300 border-amber-500/70'
                            }`}
                          >
                            <span>
                              {(() => {
                                const n = table.name.toLowerCase();
                                const num = table.name.match(/\d+/)?.[0] || '';
                                if (n.includes('esquerda')) return `E-${num}`;
                                if (n.includes('direita')) return `D-${num}`;
                                if (n.includes('mesa')) return `M-${num}`;
                                return table.name.substring(0, 5);
                              })()}
                            </span>
                            <span className="text-[8px] opacity-90 mt-0.5 font-bold">
                              {tablePersons.length}/{table.capacity}
                            </span>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Legenda do Administrador */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-300" />
                    <span className="font-bold text-purple-600 dark:text-purple-400">Mesa Selecionada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-300" />
                    <span>Completa (8/8)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300" />
                    <span>Parcial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-900 border border-amber-500/70" />
                    <span>Vazia</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lado Direito: Inspector da Mesa Selecionada com Cadeiras 1:1 */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-purple-500/40 shadow-xl space-y-5">
            {inspectorTable ? (
              (() => {
                const tablePersons = persons.filter((p) => p.table_id === inspectorTable.id);
                const occupancyPercent = Math.min(
                  Math.round((tablePersons.length / inspectorTable.capacity) * 100),
                  100
                );

                return (
                  <div className="space-y-5">
                    {/* Header da Mesa no Inspector */}
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Gestão da Mesa Selecionada
                        </span>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                          {inspectorTable.name}
                        </h3>
                        <p className="text-xs text-slate-400">{inspectorTable.description || 'Mesa do Salão'}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(inspectorTable)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                          title="Editar mesa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(inspectorTable.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir mesa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                          Ocupação de Assentos:
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                          {tablePersons.length} / {inspectorTable.capacity} cadeiras ({occupancyPercent}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Lista de Cadeiras 1:1 */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Assentos da Mesa ({inspectorTable.capacity} cadeiras)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Array.from({ length: inspectorTable.capacity }).map((_, chairIdx) => {
                          const seatNum = chairIdx + 1;
                          const occupiedPerson =
                            tablePersons.find((p) => p.seat_number === seatNum) || tablePersons[chairIdx];

                          return (
                            <div
                              key={seatNum}
                              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col justify-between space-y-1.5 ${
                                occupiedPerson
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                                  : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 uppercase tracking-wider font-extrabold">
                                  Cadeira {seatNum}
                                </span>
                                <Armchair
                                  className={`w-3.5 h-3.5 ${
                                    occupiedPerson ? 'text-emerald-500' : 'text-slate-400'
                                  }`}
                                />
                              </div>

                              {occupiedPerson ? (
                                <div>
                                  <span className="block font-black truncate text-xs">{occupiedPerson.name}</span>
                                  {occupiedPerson.role_in_invite && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 inline-block mt-0.5">
                                      {occupiedPerson.role_in_invite === 'head' ? 'Mandante' : 'Acompanhante'}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleUnassignPerson(occupiedPerson.id)}
                                    className="w-full mt-2 py-1 px-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Liberar Cadeira
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAssignSearchTerm('');
                                    setSelectedAssignment({ table: inspectorTable, seatNumber: seatNum });
                                  }}
                                  className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <UserPlus className="w-3 h-3 text-amber-500" />
                                  <span>+ Ocupar Cadeira</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-xs text-slate-400">Nenhuma mesa selecionada.</p>
            )}
          </div>
        </div>
      )}

      {/* MODO CARDS & ALOCAÇÃO 1:1 (CROQUI PADRÃO) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => {
            const tablePersons = persons.filter((p) => p.table_id === table.id);
            const allocatedSeats = tablePersons.length;
            const occupancyPercent = Math.min(Math.round((allocatedSeats / table.capacity) * 100), 100);

            return (
              <div
                key={table.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700 shadow-md space-y-5 relative flex flex-col justify-between hover:border-amber-400 transition-all"
              >
                {/* Header da Mesa */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      {table.name}
                    </h3>
                    <p className="text-xs text-slate-400">{table.description || 'Mesa do Salão'}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                      title="Editar mesa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir mesa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO DA CAPACIDADE */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                      Assentos Ocupados:
                    </span>
                    <span
                      className={
                        allocatedSeats > table.capacity
                          ? 'text-rose-500 font-black'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {allocatedSeats} / {table.capacity} cadeiras ({occupancyPercent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        allocatedSeats > table.capacity
                          ? 'bg-rose-500'
                          : allocatedSeats === table.capacity
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>

                  {/* CROQUI DE CADEIRAS INDIVIDUAIS (1:1) */}
                  <div className="pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: table.capacity }).map((_, chairIdx) => {
                        const seatNum = chairIdx + 1;
                        const occupiedPerson =
                          tablePersons.find((p) => p.seat_number === seatNum) || tablePersons[chairIdx];

                        return (
                          <div
                            key={seatNum}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col justify-between space-y-1.5 ${
                              occupiedPerson
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                                : 'bg-white dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 uppercase tracking-wider font-extrabold">
                                Cadeira {seatNum}
                              </span>
                              <Armchair
                                className={`w-3.5 h-3.5 ${occupiedPerson ? 'text-emerald-500' : 'text-slate-400'}`}
                              />
                            </div>

                            {occupiedPerson ? (
                              <div>
                                <span className="block font-black truncate text-xs">{occupiedPerson.name}</span>
                                {occupiedPerson.role_in_invite && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 inline-block mt-0.5">
                                    {occupiedPerson.role_in_invite === 'head' ? 'Mandante' : 'Acompanhante'}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleUnassignPerson(occupiedPerson.id)}
                                  className="w-full mt-1.5 py-1 px-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Liberar Cadeira
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssignSearchTerm('');
                                  setSelectedAssignment({ table, seatNumber: seatNum });
                                }}
                                className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3 text-amber-500" />
                                <span>+ Ocupar</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Selecionar Pessoa e Ocupar Cadeira (Com Busca por Digitação) */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  Ocupar Cadeira {selectedAssignment.seatNumber}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {selectedAssignment.table.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite o nome da pessoa física ({persons.length} da lista) para alocar nesta cadeira:
            </p>

            {/* Campo de Busca com resposta instantânea por digitação */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Digite para buscar nome (ex: Ana, Carlos, Barreto)..."
                value={assignSearchTerm}
                onChange={(e) => setAssignSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(() => {
                const filtered = unassignedPersons.filter((p) =>
                  p.name.toLowerCase().includes(assignSearchTerm.toLowerCase().trim())
                );

                if (unassignedPersons.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Todas as pessoas da lista já possuem assento atribuído!
                    </div>
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Nenhuma pessoa encontrada para &quot;<strong className="text-white">{assignSearchTerm}</strong>&quot;.
                    </div>
                  );
                }

                return filtered.map((person) => (
                  <button
                    key={person.id}
                    onClick={() =>
                      handleAssignPerson(
                        person.id,
                        selectedAssignment.table.id,
                        selectedAssignment.seatNumber
                      )
                    }
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                  >
                    <span>{person.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase">
                      + Selecionar
                    </span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Mesa */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editingTable ? 'Editar Mesa' : 'Nova Mesa do Salão'}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mesa 01 - Família Seppi"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Capacidade de Assentos *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 8)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Formato no Salão
                  </label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="round">Redonda (Padrão)</option>
                    <option value="square">Quadrada / Retangular</option>
                    <option value="lounge">Lounge Estofados</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Localização no Salão (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Próxima ao palco principal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md cursor-pointer"
                >
                  {loading ? 'Salvando...' : editingTable ? 'Salvar Alterações' : 'Criar Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
