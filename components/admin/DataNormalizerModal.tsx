'use client';

import React, { useState, useEffect } from 'react';
import { Person, Table, EventConfig, ChildCategory } from '@/types';
import { savePerson, calculateChildCategory, linkPersonPhoneResponsible } from '@/lib/db';
import { formatPhoneDisplay } from '@/lib/utils';
import {
  Sparkles,
  X,
  User,
  MessageCircle,
  Link2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Phone,
  Check,
} from 'lucide-react';

interface DataNormalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  tables: Table[];
  config: EventConfig;
  onRefresh: () => void;
}

export function DataNormalizerModal({
  isOpen,
  onClose,
  persons,
  tables,
  config,
  onRefresh,
}: DataNormalizerModalProps) {
  // Lista de pessoas que não possuem telefone próprio E não possuem responsável vinculado
  const incompletePersons = persons.filter((p) => {
    const hasOwnPhone = (p.phone || '').replace(/\D/g, '').length >= 8;
    const hasResponsible = Boolean(p.phone_responsible_person_id);
    return !hasOwnPhone && !hasResponsible;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Campos do formulário para o convidado atual
  const [name, setName] = useState('');
  const [contactMode, setContactMode] = useState<'phone' | 'responsible'>('phone');
  const [phone, setPhone] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [childCategory, setChildCategory] = useState<ChildCategory>('inteira');
  const [loading, setLoading] = useState(false);

  const currentPerson = incompletePersons[currentIndex] || null;

  // Atualiza os campos do formulário sempre que mudar de pessoa na fila
  useEffect(() => {
    if (currentPerson) {
      setName(currentPerson.name || '');
      setPhone(currentPerson.phone || '');
      setResponsibleId(currentPerson.phone_responsible_person_id || '');
      setContactMode(currentPerson.phone_responsible_person_id ? 'responsible' : 'phone');
      setChildCategory(calculateChildCategory(currentPerson.age, config));
    }
  }, [currentPerson?.id, currentIndex, isOpen]);

  // Garante que o índice atual seja válido se a lista diminuir
  useEffect(() => {
    if (currentIndex >= incompletePersons.length && incompletePersons.length > 0) {
      setCurrentIndex(incompletePersons.length - 1);
    }
  }, [incompletePersons.length]);

  if (!isOpen) return null;

  const totalIncomplete = incompletePersons.length;

  const handleSaveCurrent = async () => {
    if (!currentPerson) return;
    if (!name.trim()) {
      alert('Por favor, informe o Nome do Convidado.');
      return;
    }

    setLoading(true);

    try {
      let targetAge = currentPerson.age;
      if (childCategory === 'isento') targetAge = config.child_free_max_age || 3;
      else if (childCategory === 'meia') targetAge = config.child_half_max_age || 8;
      else if (childCategory === 'inteira') targetAge = currentPerson.age && currentPerson.age >= 12 ? currentPerson.age : 30;

      if (contactMode === 'phone') {
        const cleanPhone = phone.trim();
        await savePerson({
          ...currentPerson,
          name: name.trim(),
          phone: cleanPhone,
          phone_responsible_person_id: null,
          child_category: childCategory,
          age: targetAge,
          type: childCategory === 'inteira' ? 'adult' : 'child',
        });
      } else {
        if (!responsibleId) {
          alert('Selecione uma pessoa com WhatsApp cadastrado para responder por este convidado.');
          setLoading(false);
          return;
        }

        // Salva o nome e categoria da pessoa
        await savePerson({
          ...currentPerson,
          name: name.trim(),
          phone: '',
          child_category: childCategory,
          age: targetAge,
          type: childCategory === 'inteira' ? 'adult' : 'child',
        });

        // Vincula a pessoa ao responsável de telefone
        await linkPersonPhoneResponsible(currentPerson.id, responsibleId);
      }

      onRefresh();

      // Se houver mais pessoas pendentes, o índice atual cairá na próxima pessoa automaticamente
      // Caso estivéssemos na última posição da lista, ajusta para manter dentro dos limites
      if (currentIndex >= totalIncomplete - 1 && totalIncomplete > 1) {
        setCurrentIndex(totalIncomplete - 2);
      }
    } catch (err: any) {
      console.error('Erro ao normalizar convidado:', err);
      alert(err.message || 'Erro ao salvar informações.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalIncomplete - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Normalizador de Cadastros</span>
                {totalIncomplete > 0 && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-extrabold border border-amber-500/30">
                    {totalIncomplete} {totalIncomplete === 1 ? 'pendente' : 'pendentes'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Preencha rapidamente os dados para liberar o envio do WhatsApp</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado 1: Caso Não haja mais nenhum cadastro incompleto (Fila Limpa 100%) */}
        {totalIncomplete === 0 ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                Base 100% Normalizada!
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Parabéns! Todos os convidados da lista já possuem telefone celular ou um responsável vinculado para a confirmação.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Voltar para a Lista
            </button>
          </div>
        ) : (
          /* Estado 2: Fila de Convidados Incompletos para Edição Focada */
          <div className="space-y-5">
            {/* Barra de Progresso e Contador da Fila */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-purple-400">
                  Convidado {currentIndex + 1} de {totalIncomplete} pendentes
                </span>
                <span className="text-slate-400 text-[11px]">
                  Faltam {totalIncomplete} para zerar
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / totalIncomplete) * 100}%` }}
                />
              </div>
            </div>

            {/* Form de Edição Rápida (com autoComplete="off" para bloquear popup de senha do Chrome) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCurrent();
              }}
              autoComplete="off"
              className="space-y-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              {/* CAMPO 1: Nome do Convidado */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Nome Completo do Convidado *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* CAMPO 2: Contato WhatsApp (Celular Próprio vs Vínculo a Responsável) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Contato / Responsável pelo WhatsApp *
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContactMode('phone')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      contactMode === 'phone'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Celular Próprio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContactMode('responsible')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      contactMode === 'responsible'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Vincular a Responsável</span>
                  </button>
                </div>

                {contactMode === 'phone' ? (
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 absolute left-3 top-3 text-emerald-500" />
                    <input
                      type="text"
                      placeholder="Ex: 11999998888 (com DDD)"
                      autoComplete="off"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                ) : (
                  <select
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Selecionar Convidado que tem WhatsApp --</option>
                    {persons
                      .filter((p) => p.id !== currentPerson.id && (p.phone || '').replace(/\D/g, '').length >= 8)
                      .map((p) => {
                        const table = tables.find((t) => t.id === p.table_id);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatPhoneDisplay(p.phone || '')} {table ? `(Mesa: ${table.name})` : ''}
                          </option>
                        );
                      })}
                  </select>
                )}
              </div>

              {/* CAMPO 3: Faixa Etária do Buffet */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  3. Faixa Etária (Categoria Buffet) *
                </label>
                <select
                  value={childCategory}
                  onChange={(e) => setChildCategory(e.target.value as ChildCategory)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="isento">Isento (0-{config.child_free_max_age || 5} anos)</option>
                  <option value="meia">Meia-Entrada ({(config.child_free_max_age || 5) + 1}-{config.child_half_max_age || 11} anos)</option>
                  <option value="inteira">Inteira / Adulto (12+ anos)</option>
                </select>
              </div>

              <input type="submit" hidden />
            </form>

            {/* NAVEGAÇÃO SUPER RÁPIDA & BOTÃO SALVAR */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex >= totalIncomplete - 1}
                  onClick={handleNext}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={loading || !name.trim()}
                onClick={handleSaveCurrent}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar e Normalizar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
