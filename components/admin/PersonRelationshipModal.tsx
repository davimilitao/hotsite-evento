'use client';

import React, { useState, useEffect } from 'react';
import { Person, RelationshipType } from '@/types';
import {
  linkPeopleRelationship,
  unlinkPeopleRelationship,
  updatePersonFamilyName,
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
  const [customFamilyName, setCustomFamilyName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [savingGroupName, setSavingGroupName] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincronizar estado local quando a prop person ou allPersons alterar
  useEffect(() => {
    if (person) {
      setCurrentPerson(person);
      setCustomFamilyName(person.family_name || '');
    }
  }, [person]);

  useEffect(() => {
    setLivePersonsList(allPersons);
  }, [allPersons]);

  if (!isOpen || !currentPerson) return null;

  // IDs das pessoas já vinculadas à pessoa atual
  const linkedPersonIds = new Set(
    (currentPerson.relationships || []).map((r) => r.target_person_id)
  );

  // Pessoas elegíveis para vincular (exclui a própria pessoa e busca por termo)
  const eligiblePersons = livePersonsList.filter(
    (p) =>
      p.id !== currentPerson.id &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.phone && p.phone.includes(searchTerm.trim())))
  );

  // Recarregar pessoa atualizada do DB
  const refreshCurrentPersonState = async (updatedP1?: Person) => {
    if (updatedP1) {
      setCurrentPerson(updatedP1);
      setCustomFamilyName(updatedP1.family_name || '');
    } else {
      const freshPersons = await getAllPersons();
      setLivePersonsList(freshPersons);
      const found = freshPersons.find((p) => p.id === currentPerson.id);
      if (found) {
        setCurrentPerson(found);
        setCustomFamilyName(found.family_name || '');
      }
    }
  };

  const handleLink = async (targetId: string) => {
    if (!targetId || !currentPerson) return;
    setLoading(true);
    try {
      const res = await linkPeopleRelationship(
        currentPerson.id,
        targetId,
        selectedRelType,
        customFamilyName || undefined
      );
      setSuccessMessage('Parentesco e grupo familiar vinculados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3500);
      setSearchTerm('');

      await refreshCurrentPersonState(res.person1);
      onRefresh();
    } catch (err) {
      console.error('Erro ao vincular parentesco:', err);
      alert('Ocorreu um erro ao gravar o vínculo de parentesco.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (targetId: string) => {
    if (!currentPerson) return;
    if (!confirm('Deseja remover este vínculo de parentesco?')) return;
    setLoading(true);
    try {
      const res = await unlinkPeopleRelationship(currentPerson.id, targetId);
      if (res.person1) {
        await refreshCurrentPersonState(res.person1);
      } else {
        await refreshCurrentPersonState();
      }
      setSuccessMessage('Vínculo removido com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Erro ao desvincular:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!currentPerson) return;
    setSavingGroupName(true);
    try {
      const updated = await updatePersonFamilyName(
        currentPerson.id,
        customFamilyName.trim()
      );
      await refreshCurrentPersonState(updated);
      setSuccessMessage('Nome do grupo familiar gravado para todos os integrantes!');
      setTimeout(() => setSuccessMessage(null), 3500);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar nome do grupo:', err);
      alert('Erro ao salvar o nome do grupo familiar.');
    } finally {
      setSavingGroupName(false);
    }
  };

  // Estatísticas da Família Atual
  const relationships = currentPerson.relationships || [];
  const familyMembers = relationships
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

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE NOTIFICAÇÃO */}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* CORPO MODAL COM DUAS COLUNAS */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* COLUNA 1 (ESQUERDA): INTEGRANTES E FAMÍLIA ATUAL (5 de 12 colunas) */}
          <div className="lg:col-span-5 p-6 border-r border-slate-800 bg-slate-900/60 flex flex-col space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                COLUNA 1: Integrantes & Família Atual
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-800 text-purple-300 rounded-full border border-slate-700">
                {totalMembers} {totalMembers === 1 ? 'Pessoa' : 'Pessoas'}
              </span>
            </div>

            {/* EDICAO DO NOME DO GRUPO FAMILIAR */}
            <div className="p-4 bg-purple-950/30 border border-purple-900/60 rounded-2xl space-y-2">
              <label className="block text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                🏷️ Sobrenome ou Nome do Grupo Familiar:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Ex: Família ${currentPerson.name.split(' ')[0]}`}
                  value={customFamilyName}
                  onChange={(e) => setCustomFamilyName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-purple-800/80 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-slate-500"
                />
                <button
                  type="button"
                  disabled={savingGroupName}
                  onClick={handleSaveGroupName}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Salvar Nome do Grupo para todos da família"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingGroupName ? 'Salvando...' : 'Gravar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {currentPerson.family_name ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Grupo salvo: &quot;{currentPerson.family_name}&quot;
                  </span>
                ) : (
                  'Defina um nome para agrupar estes convidados no painel de convites.'
                )}
              </p>
            </div>

            {/* CARTÃO DA PESSOA TITULAR (REFERÊNCIA) */}
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
              {currentPerson.child_category && currentPerson.child_category !== 'inteira' && (
                <span className="px-2 py-1 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold rounded-lg">
                  Criança ({currentPerson.child_category})
                </span>
              )}
            </div>

            {/* LISTA DE VÍNCULOS ATUAIS */}
            <div className="space-y-2 flex-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Vínculos Diretos ({relationships.length})
              </span>

              {relationships.length > 0 ? (
                <div className="space-y-2">
                  {relationships.map((rel) => {
                    const target = livePersonsList.find((p) => p.id === rel.target_person_id);
                    if (!target) return null;
                    const opt = RELATIONSHIP_OPTIONS.find((o) => o.type === rel.relationship_type);

                    return (
                      <div
                        key={rel.target_person_id}
                        className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700">
                            {opt?.icon || <Users className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-white block">
                              {target.name}
                            </span>
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
                          onClick={() => handleUnlink(rel.target_person_id)}
                          disabled={loading}
                          className="p-2 text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-xl border border-transparent hover:border-rose-800 transition-all cursor-pointer"
                          title="Remover vínculo de parentesco"
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
                    Nenhum parente vinculado a este convidado.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Selecione uma pessoa na coluna ao lado para formar uma família.
                  </p>
                </div>
              )}
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

          {/* COLUNA 2 (DIREITA): RELACIONAR NOVA PESSOA (7 de 12 colunas) */}
          <div className="lg:col-span-7 p-6 bg-slate-900 flex flex-col space-y-5 overflow-y-auto">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                COLUNA 2: Relacionar Nova Pessoa
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha o grau de parentesco abaixo e clique em &quot;Vincular&quot; na pessoa desejada.
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

            {/* PASSO 2: BUSCA E LISTA DE PESSOAS ELEGÍVEIS */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                2. Buscar e Selecionar Convidado para Vincular:
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
                    const isAlreadyLinked = linkedPersonIds.has(p.id);

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                          isAlreadyLinked
                            ? 'bg-slate-950/60 border-slate-800 opacity-50'
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

                        {isAlreadyLinked ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                            Já Vinculado
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleLink(p.id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Vincular</span>
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
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            Concluir / Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
