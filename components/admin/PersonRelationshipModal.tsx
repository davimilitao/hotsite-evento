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
  const [mobileTab, setMobileTab] = useState<'members' | 'add'>('members');

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

  // Pessoas elegíveis para vincular na busca (exclui titular e pessoas já empilhadas)
  const eligiblePersons = livePersonsList.filter(
    (p) =>
      p.id !== currentPerson.id &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.phone && p.phone.includes(searchTerm.trim())))
  );

  // Adicionar um relacionamento na fila empilhada em memória como vínculo familiar
  const handleStageAdd = (targetPerson: Person) => {
    if (stagedPersonIds.has(targetPerson.id)) return;

    setStagedRelationships((prev) => [
      ...prev,
      { target_person_id: targetPerson.id, relationship_type: 'relative' },
    ]);
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

      setSuccessMessage('Vínculos da família gravados com sucesso!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[95vh] sm:h-[88vh] flex flex-col shadow-2xl border border-slate-800 text-slate-100 overflow-hidden">
        {/* HEADER COMPACTO E RESPONSIVO */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 bg-purple-950/80 border border-purple-800/80 text-purple-300 rounded-xl shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {currentPerson.name}
                </h2>
                {isDirty && (
                  <span className="px-2 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-800 text-[10px] font-black rounded-full animate-pulse shrink-0">
                    Pendente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-300/80 truncate font-medium">
                Agrupamento Familiar ({totalMembers} {totalMembers === 1 ? 'membro' : 'membros'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS NO MOBILE */}
        <div className="lg:hidden flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('members')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'members'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Grupo ({totalMembers})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('add')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'add'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Buscar Convidado</span>
          </button>
        </div>

        {/* ALERTA DE NOTIFICAÇÃO */}
        {successMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* CORPO MODAL (DUAS COLUNAS NO DESKTOP / ABAS NO MOBILE) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
          {/* COLUNA 1: INTEGRANTES E GRUPO FAMILIAR */}
          <div
            className={`lg:col-span-5 p-4 sm:p-5 border-r border-slate-800 bg-slate-900/60 flex flex-col space-y-4 overflow-y-auto ${
              mobileTab === 'members' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Integrantes do Grupo ({totalMembers})
              </h3>
            </div>

            {/* NOME DO GRUPO FAMILIAR */}
            <div className="p-3 bg-purple-950/30 border border-purple-900/60 rounded-xl space-y-1.5">
              <label className="block text-[11px] font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Nome do Grupo Familiar:</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder={`Ex: Família ${currentPerson.name.split(' ')[0]}`}
                value={stagedFamilyName}
                onChange={(e) => setStagedFamilyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-purple-800/80 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-500"
              />
            </div>

            {/* CARTÃO DA PESSOA TITULAR */}
            <div className="p-3 bg-slate-800/70 border border-purple-500/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  {currentPerson.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-white truncate">{currentPerson.name}</span>
                    <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 text-[9px] font-black rounded-md border border-purple-700 shrink-0">
                      Titular
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{currentPerson.phone || 'Sem telefone'}</span>
                </div>
              </div>
            </div>

            {/* LISTA DE VÍNCULOS NA FILA */}
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Acompanhantes ({stagedRelationships.length})
              </span>

              {stagedRelationships.length > 0 ? (
                <div className="space-y-2">
                  {stagedRelationships.map((rel) => {
                    const target = livePersonsList.find((p) => p.id === rel.target_person_id);
                    if (!target) return null;
                    const isNewInStage = !originalRels.some((r) => r.target_person_id === rel.target_person_id);

                    return (
                      <div
                        key={rel.target_person_id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isNewInStage
                            ? 'bg-purple-950/40 border-purple-500/70'
                            : 'bg-slate-800/60 border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-slate-900 rounded-lg border border-slate-700 shrink-0">
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-white truncate">
                                {target.name}
                              </span>
                              {isNewInStage && (
                                <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 text-[8px] font-bold rounded border border-amber-800 shrink-0">
                                  Novo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] font-extrabold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/60">
                                Convidado
                              </span>
                              {target.child_category && target.child_category !== 'inteira' && (
                                <span className="text-[8px] font-bold text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-800">
                                  {target.child_category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStageRemove(rel.target_person_id)}
                          className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-lg border border-transparent hover:border-rose-800 transition-all cursor-pointer shrink-0 ml-1"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl text-center">
                  <p className="text-xs text-slate-400">Nenhum acompanhante adicionado.</p>
                </div>
              )}
            </div>

            {/* BOTÃO PRINCIPAL DE GRAVAÇÃO */}
            <button
              type="button"
              disabled={saving || (!isDirty && stagedRelationships.length === 0)}
              onClick={handleSaveAll}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDirty
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? 'GRAVANDO...'
                  : isDirty
                  ? `GRAVAR VÍNCULOS (${stagedRelationships.length})`
                  : 'VÍNCULOS GRAVADOS'}
              </span>
            </button>

            {/* RESUMO DE BUFFET */}
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resumo:</span>
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded-md text-[10px] font-extrabold">
                  {totalMembers - totalChildren} Adulto(s)
                </span>
                {totalChildren > 0 && (
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md text-[10px] font-extrabold">
                    {totalChildren} Criança(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA 2: BUSCA E VINCULAÇÃO DE CONVIDADOS */}
          <div
            className={`lg:col-span-7 p-4 sm:p-5 bg-slate-900 flex flex-col space-y-3 min-h-0 ${
              mobileTab === 'add' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="border-b border-slate-800/80 pb-2.5 flex items-center justify-between">
              <h3 className="font-extrabold text-xs sm:text-sm text-purple-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Buscar & Vincular Convidado
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {eligiblePersons.length} disponíveis
              </span>
            </div>

            {/* CAMPO DE BUSCA */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Digite nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-slate-500"
              />
            </div>

            {/* LISTA DE CONVIDADOS ELEGÍVEIS */}
            <div className="flex-1 min-h-[220px] overflow-y-auto space-y-2 pr-1 border border-slate-800/80 p-2 sm:p-3 rounded-xl bg-slate-950/40">
              {eligiblePersons.length > 0 ? (
                eligiblePersons.map((p) => {
                  const isAlreadyStaged = stagedPersonIds.has(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isAlreadyStaged
                          ? 'bg-purple-950/30 border-purple-800/60'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-purple-500/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-white block truncate">{p.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.phone && <span className="text-[10px] text-slate-400 truncate">{p.phone}</span>}
                            {p.family_name && (
                              <span className="text-[9px] font-bold text-purple-300 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800 truncate">
                                {p.family_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isAlreadyStaged ? (
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800 flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5 text-purple-400" /> Na Fila
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleStageAdd(p);
                            if (window.innerWidth < 1024) {
                              setMobileTab('members');
                            }
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-lg shadow transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  Nenhum convidado encontrado.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER DO MODAL */}
        <div className="px-4 py-3 sm:px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 min-w-0 pr-2">
            {isDirty ? (
              <span className="text-amber-400 font-bold flex items-center gap-1 truncate">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Alterações pendentes de gravação</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1 truncate">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Vínculos salvos no banco</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              disabled={saving || (!isDirty && stagedRelationships.length === 0)}
              onClick={handleSaveAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'Gravar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

