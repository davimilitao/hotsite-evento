'use client';

import React, { useState, useEffect } from 'react';
import { Person, RelationshipType, Relationship } from '@/types';
import {
  savePersonFamilyAndRelationships,
  getAllPersons,
} from '@/lib/db';
import {
  Search,
  X,
  Users,
  Heart,
  Baby,
  Users2,
  Link2,
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

const RELATIONSHIP_OPTIONS: Array<{
  type: RelationshipType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    type: 'spouse',
    label: 'Cônjuge (Marido / Esposa)',
    description: 'Esposa, marido, noivo(a) ou parceiro(a)',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
  },
  {
    type: 'child',
    label: 'Filho / Filha',
    description: 'Dependente direto da pessoa',
    icon: <Baby className="w-4 h-4 text-amber-400" />,
  },
  {
    type: 'parent',
    label: 'Pai / Mãe',
    description: 'Mãe ou pai da pessoa',
    icon: <Users className="w-4 h-4 text-purple-400" />,
  },
  {
    type: 'sibling',
    label: 'Irmão / Irmã',
    description: 'Irmão ou irmã de mesmo grupo familiar',
    icon: <Users2 className="w-4 h-4 text-blue-400" />,
  },
  {
    type: 'relative',
    label: 'Pessoa da Família / Parente',
    description: 'Tio, sobrinho, primo ou parente próximo',
    icon: <Link2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    type: 'friend',
    label: 'Amigo / Amiga (Grupo)',
    description: 'Amigo acompanhante no mesmo grupo',
    icon: <UserPlus className="w-4 h-4 text-indigo-400" />,
  },
];

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
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>('spouse');

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

  // Adicionar um relacionamento na fila empilhada em memória
  const handleStageAdd = (targetPerson: Person) => {
    if (stagedPersonIds.has(targetPerson.id)) return;

    setStagedRelationships((prev) => [
      ...prev,
      { target_person_id: targetPerson.id, relationship_type: selectedRelType },
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

      setSuccessMessage('Todos os vínculos e o grupo familiar foram gravados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div className="bg-slate-900 rounded-3xl max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl border border-slate-800 text-slate-100 overflow-hidden">
        {/* HEADER DO MODAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-950/80 border border-purple-800 text-purple-300 rounded-2xl">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-950 text-purple-300 rounded-full text-[11px] font-bold border border-purple-800 mb-0.5">
                <Link2 className="w-3 h-3" /> Painel de Agrupamento Familiar & Vinculação
              </div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Convidado: <span className="text-purple-400">{currentPerson.name}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 text-xs font-black rounded-full flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" /> Alterações pendentes
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALERTA DE NOTIFICAÇÃO */}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-black rounded-2xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* CORPO MODAL COM DUAS COLUNAS */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* COLUNA 1 (ESQUERDA): INTEGRANTES E FAMÍLIA EMPILHADA (5 de 12 colunas) */}
          <div className="lg:col-span-5 p-6 border-r border-slate-800 bg-slate-900/60 flex flex-col space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                COLUNA 1: Fila do Grupo Familiar ({totalMembers})
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-800 text-purple-300 rounded-full border border-slate-700">
                {totalMembers} {totalMembers === 1 ? 'Pessoa' : 'Pessoas'}
              </span>
            </div>

            {/* EDICAO DO NOME DO GRUPO FAMILIAR */}
            <div className="p-4 bg-purple-950/30 border border-purple-900/60 rounded-2xl space-y-2">
              <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Sobrenome ou Nome do Grupo Familiar:</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder={`Ex: Família ${currentPerson.name.split(' ')[0]}`}
                value={stagedFamilyName}
                onChange={(e) => setStagedFamilyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-purple-800/80 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-500"
              />
              <p className="text-[10px] text-slate-400">
                Este nome será gravado para todos os membros da família ao clicar em &quot;Gravar Todos&quot;.
              </p>
            </div>

            {/* CARTÃO DA PESSOA TITULAR */}
            <div className="p-3.5 bg-slate-800/70 border border-purple-500/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                  {currentPerson.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-white">{currentPerson.name}</span>
                    <span className="px-2 py-0.5 bg-purple-950 text-purple-300 text-[9px] font-black rounded-full border border-purple-700">
                      Titular
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{currentPerson.phone || 'Sem telefone registrado'}</span>
                </div>
              </div>
            </div>

            {/* LISTA DE VÍNCULOS EMPILHADOS */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Vínculos na Fila ({stagedRelationships.length})
                </span>
                {hasRelsChanged && (
                  <span className="text-[10px] text-amber-400 font-bold">
                    (Vínculos alterados)
                  </span>
                )}
              </div>

              {stagedRelationships.length > 0 ? (
                <div className="space-y-2">
                  {stagedRelationships.map((rel) => {
                    const target = livePersonsList.find((p) => p.id === rel.target_person_id);
                    if (!target) return null;
                    const opt = RELATIONSHIP_OPTIONS.find((o) => o.type === rel.relationship_type);
                    const isNewInStage = !originalRels.some((r) => r.target_person_id === rel.target_person_id);

                    return (
                      <div
                        key={rel.target_person_id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                          isNewInStage
                            ? 'bg-purple-950/40 border-purple-500/70'
                            : 'bg-slate-800/60 border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700">
                            {opt?.icon || <Users className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-white block">
                                {target.name}
                              </span>
                              {isNewInStage && (
                                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 text-[9px] font-bold rounded border border-amber-800">
                                  Novo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-extrabold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/60">
                                {opt?.label || rel.relationship_type}
                              </span>
                              {target.child_category && target.child_category !== 'inteira' && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-800">
                                  {target.child_category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStageRemove(rel.target_person_id)}
                          className="p-2 text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-xl border border-transparent hover:border-rose-800 transition-all cursor-pointer"
                          title="Remover da fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl text-center space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 italic">
                    Nenhum parente empilhado ainda.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Selecione uma pessoa na coluna ao lado e clique em &quot;Adicionar&quot;.
                  </p>
                </div>
              )}
            </div>

            {/* BOTÃO PRINCIPAL DE GRAVAÇÃO DA FAMÍLIA NA COLUNA 1 */}
            <div className="pt-2">
              <button
                type="button"
                disabled={saving || (!isDirty && stagedRelationships.length === 0)}
                onClick={handleSaveAll}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isDirty
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 ring-2 ring-emerald-400/50'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? 'GRAVANDO BANCO DE DADOS...'
                    : isDirty
                    ? `GRAVAR TODOS OS VÍNCULOS (${stagedRelationships.length})`
                    : 'FAMÍLIA E VÍNCULOS GRAVADOS'}
                </span>
              </button>
            </div>

            {/* STATS DE BUFFET DO GRUPO */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Resumo da Família:</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded-lg text-[10px] font-extrabold">
                  {totalMembers - totalChildren} Adulto(s)
                </span>
                {totalChildren > 0 && (
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-lg text-[10px] font-extrabold">
                    {totalChildren} Criança(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA 2 (DIREITA): SELEÇÃO DE NOVAS PESSOAS (7 de 12 colunas) */}
          <div className="lg:col-span-7 p-6 bg-slate-900 flex flex-col space-y-5 overflow-y-auto">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                COLUNA 2: Relacionar Nova Pessoa (Empilhar)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha o grau de parentesco e clique em &quot;Adicionar&quot;. Depois, clique em &quot;Gravar Todos&quot;.
              </p>
            </div>

            {/* PASSO 1: SELEÇÃO DO GRAU DE PARENTESCO */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                1. Selecione o Grau de Relacionamento:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RELATIONSHIP_OPTIONS.map((opt) => {
                  const isSelected = selectedRelType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setSelectedRelType(opt.type)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/50'
                          : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-purple-500/60'
                      }`}
                    >
                      <div className={isSelected ? 'text-white' : ''}>{opt.icon}</div>
                      <div>
                        <span className="font-extrabold text-xs block leading-tight">{opt.label}</span>
                        <span className={`text-[10px] block opacity-80 ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                          {opt.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASSO 2: BUSCA E ADIÇÃO EMPILHADA */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                2. Buscar e Adicionar Pessoa à Fila:
              </label>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Digite o nome ou telefone (ex: Paula, Barreto, 1199)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-slate-500"
                />
              </div>

              {/* LISTA DE CONVIDADOS DISPONÍVEIS */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {eligiblePersons.length > 0 ? (
                  eligiblePersons.map((p) => {
                    const isAlreadyStaged = stagedPersonIds.has(p.id);

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                          isAlreadyStaged
                            ? 'bg-purple-950/30 border-purple-800/60'
                            : 'bg-slate-800/80 border-slate-700/80 hover:border-purple-500/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-white block">{p.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.phone && <span className="text-[10px] text-slate-400">{p.phone}</span>}
                              {p.family_name && (
                                <span className="text-[9px] font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                                  {p.family_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isAlreadyStaged ? (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-950 px-3 py-1.5 rounded-xl border border-purple-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-purple-400" /> Na Fila
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStageAdd(p)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800">
                    Nenhum convidado encontrado com esse nome ou telefone.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER DO MODAL */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isDirty ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Lembre-se de clicar em &quot;Gravar Todos&quot; para salvar no banco!
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-400" /> Todos os vínculos estão salvos no banco.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              disabled={saving || (!isDirty && stagedRelationships.length === 0)}
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'GRAVAR TODOS OS VÍNCULOS'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
