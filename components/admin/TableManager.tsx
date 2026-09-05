'use client';

import React, { useState } from 'react';
import { Table, Invite } from '@/types';
import { saveTable, deleteTable, saveInvite } from '@/lib/db';
import { Plus, Trash2, Edit, Users, Armchair, UserPlus, X } from 'lucide-react';

interface TableManagerProps {
  tables: Table[];
  invites: Invite[];
  onRefresh: () => void;
}

export function TableManager({ tables, invites, onRefresh }: TableManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(8); // Padrão 8 lugares
  const [shape, setShape] = useState<'round' | 'square' | 'lounge'>('round');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal para alocar convidado visualmente na mesa
  const [selectedTableForAssignment, setSelectedTableForAssignment] = useState<Table | null>(null);

  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');
  const unassignedInvites = confirmedInvites.filter((i) => !i.table_id);

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
    if (!confirm('Tem certeza que deseja excluir esta mesa? Os convidados atrelados a ela ficarão sem mesa atribuída.')) return;
    await deleteTable(id);
    onRefresh();
  };

  const handleAssignInviteToTable = async (invite: Invite, tableId: string | null) => {
    await saveInvite({
      ...invite,
      table_id: tableId,
    });
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Topo da Gestão de Mesas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold mb-2 border border-amber-300 dark:border-amber-800">
            <Armchair className="w-4 h-4 text-amber-500" /> Croqui Visual de Mesas
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Organização do Salão & Assentos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aloque visualmente as famílias nas mesas de 8 lugares para organizar a recepção da festa.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova Mesa de Convidados
        </button>
      </div>

      {/* Alerta de Convidados Sem Mesa */}
      {unassignedInvites.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-xs font-bold">
            <Users className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              Você possui <strong>{unassignedInvites.length} família(s) confirmada(s)</strong> ainda sem mesa atribuída no salão.
            </span>
          </div>
        </div>
      )}

      {/* GRID DO CROQUI VISUAL DE MESAS (SEATING CHART) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => {
          // Convites atrelados a esta mesa
          const tableInvites = confirmedInvites.filter((i) => i.table_id === table.id);
          const allocatedSeats = tableInvites.reduce(
            (sum, i) => sum + (i.confirmed_count || i.guests.length || 1),
            0
          );
          const availableSeats = table.capacity - allocatedSeats;
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
                    className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    title="Editar mesa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Excluir mesa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DESENHO GRÁFICO DO CROQUI DE MESAS (8 CADEIRAS REDONDAS) */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Ocupação dos Assentos:</span>
                  <span className={availableSeats < 0 ? 'text-rose-500 font-black' : 'text-amber-600 dark:text-amber-400'}>
                    {allocatedSeats} / {table.capacity} lugares ({occupancyPercent}%)
                  </span>
                </div>

                {/* Barra de Progresso de Ocupação */}
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

                {/* Croqui Gráfico em Anel das Cadeirinhas da Mesa */}
                <div className="pt-2">
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: table.capacity }).map((_, chairIdx) => {
                      // Descobre qual convidado/acompanhante ocupa esta cadeira
                      let assignedName = null;
                      let currentSeatCounter = 0;

                      for (const inv of tableInvites) {
                        const count = inv.confirmed_count || inv.guests.length || 1;
                        if (chairIdx >= currentSeatCounter && chairIdx < currentSeatCounter + count) {
                          const guestIndex = chairIdx - currentSeatCounter;
                          assignedName = inv.guests[guestIndex]?.name || inv.head_name;
                          break;
                        }
                        currentSeatCounter += count;
                      }

                      return (
                        <div
                          key={chairIdx}
                          className={`p-2 rounded-xl text-center border text-[10px] font-bold truncate transition-all ${
                            assignedName
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                          }`}
                          title={assignedName || `Cadeira ${chairIdx + 1} Livre`}
                        >
                          <Armchair className="w-3 h-3 mx-auto mb-0.5" />
                          <span className="block truncate">{assignedName ? assignedName.split(' ')[0] : 'Vago'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lista das Famílias Alocadas Nesta Mesa */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Famílias Atribuídas ({tableInvites.length}):
                </span>

                {tableInvites.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum convidado atribuído ainda.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {tableInvites.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {inv.head_name} ({inv.confirmed_count} pes)
                        </span>

                        <button
                          onClick={() => handleAssignInviteToTable(inv, null)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] font-semibold"
                          title="Remover família da mesa"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Botão de Atribuir Convidado nesta Mesa com ALTO CONTRASTE no Hover */}
              <button
                onClick={() => setSelectedTableForAssignment(table)}
                className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-xl border border-amber-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>Atribuir Família a esta Mesa</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal para Atribuir Convidados Sem Mesa */}
      {selectedTableForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                Atribuir a {selectedTableForAssignment.name}
              </h3>
              <button
                onClick={() => setSelectedTableForAssignment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione uma das famílias confirmadas para sentar nesta mesa:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {unassignedInvites.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Todas as famílias confirmadas já possuem mesa atribuída!
                </div>
              ) : (
                unassignedInvites.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={async () => {
                      await handleAssignInviteToTable(inv, selectedTableForAssignment.id);
                      setSelectedTableForAssignment(null);
                    }}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 transition-all"
                  >
                    <span>{inv.head_name}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold">{inv.confirmed_count} vagas</span>
                  </button>
                ))
              )}
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
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md"
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
