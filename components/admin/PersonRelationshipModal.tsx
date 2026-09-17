'use client';

import React, { useState, useEffect } from 'react';
import { Person, Relationship } from '@/types';
import { savePersonFamilyAndRelationships } from '@/lib/db';
import {
  Search,
  X,
  Users,
  Users2,
  Trash2,
  Check,
  UserPlus,
  Save,
  ShieldCheck,
  Plus,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface PersonRelationshipModalProps {
  person: Person | null;
  allPersons: Person[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function PersonRelationshipModal({
  person,
  allPersons,
  isOpen,
  onClose,
  onRefresh,
}: PersonRelationshipModalProps) {
  const [currentPerson, setCurrentPerson] = useState<Person | null>(person);
  const [livePersonsList, setLivePersonsList] = useState<Person[]>(allPersons);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado empilhado (Staged) em memória
  const [stagedFamilyName, setStagedFamilyName] = useState<string>('');
  const [stagedRelationships, setStagedRelationships] = useState<Relationship[]>([]);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincronizar estado empilhado quando a modal abre ou a pessoa altera
  useEffect(() => {
    if (person) {
      setCurrentPerson(person);
      setStagedFamilyName(person.family_name || `Família ${person.name.split(' ')[0]}`);
      setStagedRelationships(person.relationships || []);
    }
  }, [person, isOpen]);

  useEffect(() => {
    setLivePersonsList(allPersons);
  }, [allPersons]);

  if (!isOpen || !currentPerson) return null;

  // IDs das pessoas atualmente empilhadas (staged)
  const stagedPersonIds = new Set(stagedRelationships.map((r) => r.target_person_id));

  // Pessoas elegíveis para vincular na busca (exclui titular e pessoas já empilhadas ou de outras famílias)
  const eligiblePersons = livePersonsList.filter(
    (p) => {
      if (p.id === currentPerson.id) return false;

      const belongsToAnotherFamily = p.family_id && p.family_id !== currentPerson.family_id;
      const hasRelationships = (p.relationships || []).length > 0;
      const isRelatedToCurrent = (p.relationships || []).some(r => r.target_person_id === currentPerson.id);

      // Bloquear se já pertence a outra família ou tem relações que não incluem a pessoa atual
      if (belongsToAnotherFamily || (hasRelationships && !isRelatedToCurrent && !stagedPersonIds.has(p.id))) {
        return false;
      }

      const searchLower = searchTerm.toLowerCase().trim();
      if (!searchLower) return true;

      return p.name.toLowerCase().includes(searchLower) || (p.phone && p.phone.includes(searchTerm.trim()));
    }
  ).slice(0, 20); // Limita a 20 para não poluir a tela

  // Adicionar um relacionamento na fila empilhada em memória como vínculo familiar
  const handleStageAdd = (targetPerson: Person) => {
    if (stagedPersonIds.has(targetPerson.id)) return;

    setStagedRelationships((prev) => [
      ...prev,
      { target_person_id: targetPerson.id, relationship_type: 'relative' },
    ]);
    setSearchTerm(''); // Limpa a busca ao adicionar
  };

  // Remover um relacionamento da fila empilhada em memória
  const handleStageRemove = (targetPersonId: string) => {
    setStagedRelationships((prev) =>
      prev.filter((r) => r.target_person_id !== targetPersonId)
    );
  };

  // Gravar TODOS os vínculos empilhados e o nome da família no banco de dados de uma vez
  const handleSaveAll = async () => {
    if (!currentPerson) return;
    setSaving(true);
    try {
      const updatedPerson = await savePersonFamilyAndRelationships(
        currentPerson.id,
        stagedFamilyName,
        stagedRelationships
      );

      setCurrentPerson(updatedPerson);
      setStagedFamilyName(updatedPerson.family_name || '');
      setStagedRelationships(updatedPerson.relationships || []);

      setSuccessMessage('Vínculos do grupo familiar salvos no banco de dados!');
      setTimeout(() => setSuccessMessage(null), 3500);

      onRefresh();
    } catch (err) {
      console.error('Erro ao gravar vínculos da família:', err);
      alert('Ocorreu um erro ao gravar as alterações no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  // Identificar se há alterações não salvas (Dirty state)
  const originalRels = currentPerson.relationships || [];
  const hasRelsChanged =
    JSON.stringify(originalRels) !== JSON.stringify(stagedRelationships);
  const hasNameChanged =
    stagedFamilyName.trim() !== (currentPerson.family_name || '').trim();
  const isDirty = hasRelsChanged || hasNameChanged;

  // Estatísticas da Família Empilhada
  const familyMembers = stagedRelationships
    .map((r) => livePersonsList.find((p) => p.id === r.target_person_id))
    .filter((p): p is Person => p !== undefined);

  const totalMembers = familyMembers.length + 1; // + Titular
  const totalChildren =
    (currentPerson.child_category && currentPerson.child_category !== 'inteira' ? 1 : 0) +
    familyMembers.filter((m) => m.child_category && m.child_category !== 'inteira').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-sm transition-all">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full h-[92vh] sm:h-[85vh] max-w-3xl flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:shadow-2xl border-t sm:border border-slate-700 sm:border-slate-800 text-slate-100 overflow-hidden relative">
        
        {/* HEADER MODAL */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl shrink-0 shadow-inner">
              <Users2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                  Agrupamento Familiar
                </h2>
                {isDirty && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black rounded-full animate-pulse shrink-0">
                    Pendente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate font-medium">
                Vincule acompanhantes a {currentPerson.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE SUCESSO (FLUTUANTE) */}
        {successMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-3 bg-emerald-900/95 border border-emerald-500 shadow-xl shadow-emerald-900/20 text-emerald-100 text-xs font-bold rounded-2xl flex items-center gap-2 z-20">
            <div className="p-1 bg-emerald-500 rounded-full shrink-0 text-emerald-950">
               <Check className="w-3 h-3" />
            </div>
            <span>{successMessage}</span>
          </div>
        )}

        {/* CORPO DA MODAL: ROLAGEM ÚNICA SEM NESTING SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-900/50">
          
          {/* SEÇÃO 1: GRUPO FAMILIAR ATUAL */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 sm:p-5 shadow-inner space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Membros do Grupo ({totalMembers})
              </h3>
              
              <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/50">
                 <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                 <span className="text-[10px] font-bold text-slate-300">
                    {totalMembers - totalChildren} Adultos {totalChildren > 0 && `· ${totalChildren} Crianças`}
                 </span>
              </div>
            </div>

            {/* NOME DO GRUPO FAMILIAR */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Nome da Família / Grupo:</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder={`Ex: Família ${currentPerson.name.split(' ')[0]}`}
                value={stagedFamilyName}
                onChange={(e) => setStagedFamilyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none placeholder-slate-500 shadow-inner"
              />
            </div>

            {/* LISTA DE MEMBROS (GRID) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* TITULAR */}
              <div className="p-3 bg-purple-900/20 border border-purple-500/40 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                    {currentPerson.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white truncate block">{currentPerson.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block mt-0.5">
                      Titular do Grupo
                    </span>
                  </div>
                </div>
              </div>

              {/* ACOMPANHANTES EMPILHADOS */}
              {stagedRelationships.map((rel) => {
                const target = livePersonsList.find((p) => p.id === rel.target_person_id);
                if (!target) return null;
                const isNewInStage = !originalRels.some((r) => r.target_person_id === rel.target_person_id);

                return (
                  <div
                    key={rel.target_person_id}
                    className={`p-3 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${
                      isNewInStage
                        ? 'bg-emerald-900/20 border-emerald-500/40'
                        : 'bg-slate-800/80 border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        {target.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-white truncate block">
                            {target.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                          Convidado {target.child_category && target.child_category !== 'inteira' ? `(${target.child_category})` : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStageRemove(rel.target_person_id)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-rose-600 rounded-lg border border-slate-700 hover:border-rose-500 transition-all cursor-pointer shrink-0 ml-2"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 2: BUSCA DE NOVOS ACOMPANHANTES */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Adicionar Acompanhante
            </h3>
            
            {/* CAMPO DE BUSCA */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Busque pelo nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-white placeholder-slate-500 shadow-inner"
              />
            </div>

            {/* LISTA DE CONVIDADOS ELEGÍVEIS (SE BUSCANDO) */}
            <div className="space-y-2 mt-2">
              {eligiblePersons.length > 0 ? (
                eligiblePersons.map((p) => {
                  const isAlreadyStaged = stagedPersonIds.has(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isAlreadyStaged
                          ? 'bg-purple-900/20 border-purple-500/30'
                          : 'bg-slate-800 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-white block truncate">{p.name}</span>
                          {p.phone && <span className="text-[11px] text-slate-400 block truncate">{p.phone}</span>}
                        </div>
                      </div>

                      {isAlreadyStaged ? (
                        <span className="text-[10px] font-black text-purple-300 bg-purple-950 px-3 py-1.5 rounded-lg border border-purple-800 flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5" /> Adicionado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStageAdd(p)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Vincular</span>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-700/50">
                  <p className="text-sm text-slate-400 font-medium">Nenhum convidado disponível encontrado.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Se a pessoa já está em outra família, ela não aparecerá aqui.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER MODAL */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10 gap-3 sm:gap-0">
          <div className="text-[12px] w-full sm:w-auto text-center sm:text-left">
            {isDirty ? (
              <span className="text-amber-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Existem alterações não salvas</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>Todos os vínculos estão salvos</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={saving || (!isDirty && stagedRelationships.length === 0)}
              onClick={handleSaveAll}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'Gravar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

