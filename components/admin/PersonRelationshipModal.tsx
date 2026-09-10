'use client';

import React, { useState } from 'react';
import { Person, RelationshipType } from '@/types';
import { linkPeopleRelationship, unlinkPeopleRelationship } from '@/lib/db';
import { Search, X, Users, Heart, Baby, Users2, Link2, Trash2, Check, UserPlus } from 'lucide-react';

interface PersonRelationshipModalProps {
  person: Person | null;
  allPersons: Person[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const RELATIONSHIP_OPTIONS: Array<{
  type: RelationshipType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { type: 'spouse', label: 'Cônjuge (Marido / Esposa)', description: 'Esposa, marido, noivo(a) ou parceiro(a)', icon: <Heart className="w-4 h-4 text-rose-500" /> },
  { type: 'child', label: 'Filho / Filha', description: 'Dependente direto da pessoa', icon: <Baby className="w-4 h-4 text-amber-500" /> },
  { type: 'parent', label: 'Pai / Mãe', description: 'Mãe ou pai da pessoa', icon: <Users className="w-4 h-4 text-purple-500" /> },
  { type: 'sibling', label: 'Irmão / Irmã', description: 'Irmão ou irmã de mesmo grupo familiar', icon: <Users2 className="w-4 h-4 text-blue-500" /> },
  { type: 'relative', label: 'Pessoa da Família / Parente', description: 'Tio, sobrinho, primo ou parente próximo', icon: <Link2 className="w-4 h-4 text-emerald-500" /> },
  { type: 'friend', label: 'Amigo / Amiga (Grupo)', description: 'Amigo acompanhante no mesmo grupo', icon: <UserPlus className="w-4 h-4 text-indigo-500" /> },
];

export function PersonRelationshipModal({
  person,
  allPersons,
  isOpen,
  onClose,
  onRefresh,
}: PersonRelationshipModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>('spouse');
  const [targetPersonId, setTargetPersonId] = useState<string>('');
  const [customFamilyName, setCustomFamilyName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !person) return null;

  // Pessoas já vinculadas
  const linkedPersonIds = new Set((person.relationships || []).map((r) => r.target_person_id));

  // Pessoas elegíveis para vincular (Exclui a própria pessoa)
  const eligiblePersons = allPersons.filter(
    (p) => p.id !== person.id && p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleLink = async () => {
    if (!targetPersonId) return;
    setLoading(true);
    try {
      await linkPeopleRelationship(person.id, targetPersonId, selectedRelType, customFamilyName || undefined);
      setSuccessMessage('Parentesco e grupo familiar vinculados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setTargetPersonId('');
      setSearchTerm('');
      onRefresh();
    } catch (err) {
      console.error('Erro ao vincular parentesco:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (targetId: string) => {
    if (!confirm('Deseja remover este vínculo de parentesco?')) return;
    setLoading(true);
    try {
      await unlinkPeopleRelationship(person.id, targetId);
      onRefresh();
    } catch (err) {
      console.error('Erro ao desvincular:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold mb-1 border border-purple-300 dark:border-purple-800">
              <Link2 className="w-3.5 h-3.5" /> Vinculação de Parentesco & Família
            </div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
              Relacionar: <span className="text-purple-600 dark:text-purple-400">{person.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conecte esta pessoa a outro convidado para agrupar convites familiares e calcular presenças.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação de Sucesso */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LISTA DE VÍNCULOS ATUAIS */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Parentescos & Vínculos Atuais ({person.relationships?.length || 0})
          </span>

          {person.relationships && person.relationships.length > 0 ? (
            <div className="space-y-2">
              {person.relationships.map((rel) => {
                const target = allPersons.find((p) => p.id === rel.target_person_id);
                if (!target) return null;
                const opt = RELATIONSHIP_OPTIONS.find((o) => o.type === rel.relationship_type);

                return (
                  <div
                    key={rel.target_person_id}
                    className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                        {opt?.icon || <Users className="w-4 h-4 text-purple-500" />}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                          {target.name}
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                          {opt?.label || rel.relationship_type}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnlink(rel.target_person_id)}
                      disabled={loading}
                      className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                      title="Remover parentesco"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              Nenhuma pessoa vinculada ainda. Selecione uma pessoa abaixo para formar uma família.
            </p>
          )}
        </div>

        {/* ADICIONAR NOVO PARENTESCO */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            + Adicionar Novo Parentesco / Acompanhante
          </span>

          {/* Seleção do Grau de Parentesco */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              1. Qual o grau de relacionamento com {person.name.split(' ')[0]}?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const isSelected = selectedRelType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedRelType(opt.type)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                    }`}
                  >
                    <div className={isSelected ? 'text-white' : ''}>{opt.icon}</div>
                    <div>
                      <span className="font-extrabold text-xs block leading-tight">{opt.label}</span>
                      <span className={`text-[9px] block opacity-80 ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Busca e Seleção da Pessoa Relacionada */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Buscar pessoa a ser vinculada:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Digite o nome (ex: Paula, Carlos, Barreto)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Lista de Pessoas Encontradas */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {eligiblePersons.length > 0 ? (
                eligiblePersons.map((p) => {
                  const isSelected = targetPersonId === p.id;
                  const isAlreadyLinked = linkedPersonIds.has(p.id);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isAlreadyLinked}
                      onClick={() => setTargetPersonId(p.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isAlreadyLinked
                          ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-100 dark:bg-purple-950/80 border-purple-400 font-extrabold text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{p.name}</span>
                        {p.phone && <span className="text-[10px] text-slate-400">({p.phone})</span>}
                      </div>

                      {isAlreadyLinked ? (
                        <span className="text-[10px] text-slate-400 font-bold">Já Vinculado</span>
                      ) : isSelected ? (
                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-300 uppercase">
                          ✓ Selecionado
                        </span>
                      ) : (
                        <span className="text-[10px] text-purple-500 font-extrabold uppercase">
                          + Selecionar
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  Nenhuma pessoa encontrada com esse nome.
                </p>
              )}
            </div>
          </div>

          {/* Nome da Família / Grupo (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              3. Nome do Grupo Familiar (opcional):
            </label>
            <input
              type="text"
              placeholder={`Ex: Família ${person.name.split(' ')[0]}`}
              value={customFamilyName}
              onChange={(e) => setCustomFamilyName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Botão de Ação */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={!targetPersonId || loading}
              onClick={handleLink}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Link2 className="w-4 h-4" />
              <span>{loading ? 'Vinculando...' : 'Vincular Parentesco'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
