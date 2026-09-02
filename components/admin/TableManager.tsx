'use client';

import React, { useState } from 'react';
import { Table, Invite } from '@/types';
import { saveTable, deleteTable, saveInvite } from '@/lib/db';
import { Armchair, Plus, Trash2, Users, CheckCircle2, AlertCircle, Compass } from 'lucide-react';

interface TableManagerProps {
  tables: Table[];
  invites: Invite[];
  onRefresh: () => void;
}

export function TableManager({ tables, invites, onRefresh }: TableManagerProps) {
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [newTableDesc, setNewTableDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const id = `mesa-${Date.now().toString(36)}`;
      await saveTable({
        id,
        name: newTableName,
        capacity: newTableCapacity,
        allocated_count: 0,
        description: newTableDesc,
        shape: 'round',
      });

      setNewTableName('');
      setNewTableDesc('');
      setNewTableCapacity(8);
      onRefresh();
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignInvite = async (inviteId: string, tableId: string | null) => {
    const targetInvite = invites.find((i) => i.id === inviteId);
    if (!targetInvite) return;

    await saveInvite({
      ...targetInvite,
      table_id: tableId || null,
    });
    onRefresh();
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Deseja excluir esta mesa? Os convidados vinculados ficarão sem mesa atribuída.')) return;
    await deleteTable(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Form Criar Mesa */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-600" /> Cadastrar Nova Mesa / Setor
        </h3>

        <form onSubmit={handleCreateTable} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Nome da Mesa (Ex: Mesa 05 - Bar)"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />

          <input
            type="number"
            min={1}
            max={30}
            required
            placeholder="Capacidade (Cadeiras)"
            value={newTableCapacity}
            onChange={(e) => setNewTableCapacity(parseInt(e.target.value, 10) || 1)}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />

          <input
            type="text"
            placeholder="Descrição da localização (opcional)"
            value={newTableDesc}
            onChange={(e) => setNewTableDesc(e.target.value)}
            className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            Adicionar Mesa
          </button>
        </form>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map((table) => {
          // Calcula a ocupação atual baseada nos convites confirmados vinculados
          const tableInvites = confirmedInvites.filter((i) => i.table_id === table.id);
          const occupiedCount = tableInvites.reduce(
            (sum, i) => sum + (i.confirmed_count || i.guests.length || 1),
            0
          );
          const percentage = Math.min(Math.round((occupiedCount / table.capacity) * 100), 100);

          return (
            <div
              key={table.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-xl">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{table.name}</h4>
                    {table.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{table.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                  title="Excluir mesa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de Ocupação */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Ocupação Atual:</span>
                  <span className={occupiedCount > table.capacity ? 'text-rose-500 font-extrabold' : 'text-purple-600 dark:text-purple-400'}>
                    {occupiedCount} / {table.capacity} assentos ({percentage}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      occupiedCount > table.capacity
                        ? 'bg-rose-500'
                        : percentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Lista de Famílias Alocadas nesta Mesa */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Convites Alocados:</span>

                {tableInvites.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum convite alocado nesta mesa.</p>
                ) : (
                  <div className="space-y-1.5">
                    {tableInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl text-xs"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {inv.head_name} ({inv.confirmed_count} pes)
                        </span>
                        <button
                          onClick={() => handleAssignInvite(inv.id, null)}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vincular Convites Pendentes de Mesa */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" /> Alocar Convites Confirmados às Mesas
        </h4>

        <div className="space-y-2">
          {confirmedInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100">{inv.head_name}</span>
                <span className="text-slate-400 ml-2">({inv.confirmed_count} pessoas confirmadas)</span>
              </div>

              <select
                value={inv.table_id || ''}
                onChange={(e) => handleAssignInvite(inv.id, e.target.value || null)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">-- Sem Mesa Atribuída --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Cap: {t.capacity})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
