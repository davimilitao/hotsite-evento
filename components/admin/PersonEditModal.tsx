'use client';

import React, { useState, useEffect } from 'react';
import { Person, SpecialRole, ChildCategory, EventConfig } from '@/types';
import { savePerson, calculateChildCategory } from '@/lib/db';
import { X, User, Phone, Calendar, Sparkles, FileText, Check, Shield } from 'lucide-react';

interface PersonEditModalProps {
  person: Person | null;
  config: EventConfig;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function PersonEditModal({
  person,
  config,
  isOpen,
  onClose,
  onRefresh,
}: PersonEditModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<string>('');
  const [familyName, setFamilyName] = useState('');
  const [specialRole, setSpecialRole] = useState<SpecialRole>('guest');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name || '');
      setPhone(person.phone || '');
      setAge(person.age !== undefined && person.age !== null ? String(person.age) : '');
      setFamilyName(person.family_name || '');
      setSpecialRole(person.special_role || 'guest');
      setNotes(person.notes || '');
    } else {
      setName('');
      setPhone('');
      setAge('');
      setFamilyName('');
      setSpecialRole('guest');
      setNotes('');
    }
  }, [person, isOpen]);

  if (!isOpen) return null;

  const parsedAge = age !== '' ? parseInt(age, 10) : undefined;
  const calculatedCategory: ChildCategory = calculateChildCategory(parsedAge, config);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await savePerson({
        id: person ? person.id : undefined,
        name: name.trim(),
        phone: phone.trim(),
        age: parsedAge,
        child_category: calculatedCategory,
        family_name: familyName.trim(),
        special_role: specialRole,
        counts_towards_buffet: specialRole === 'guest',
        notes: notes.trim(),
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar pessoa:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {person ? 'Editar Cadastro de Convidado' : 'Novo Convidado na Lista'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ex: Édipo Barreto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Telefone & Idade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Telefone (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Idade (Anos)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Ex: 34 ou 4"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Selo Automático de Categoria Etária Buffet */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Categoria Buffet:</span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                calculatedCategory === 'isento'
                  ? 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                  : calculatedCategory === 'meia'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {calculatedCategory === 'isento' && `⚪ Isento (0 a ${config.child_free_max_age || 5} anos)`}
              {calculatedCategory === 'meia' && `🟡 Meia-Entrada (${(config.child_free_max_age || 5) + 1} a ${config.child_half_max_age || 11} anos)`}
              {calculatedCategory === 'inteira' && '🟢 Inteira / Adulto (100%)'}
            </span>
          </div>

          {/* Grupo Familiar / Nome da Família */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Grupo / Família
            </label>
            <input
              type="text"
              placeholder="Ex: Família Barreto"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Função Especial / Staff */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Função no Evento
            </label>
            <select
              value={specialRole}
              onChange={(e) => setSpecialRole(e.target.value as SpecialRole)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
            >
              <option value="guest">Convidado Normal (Consome Cota Buffet)</option>
              <option value="birthday_person">Aniversariante (Isento de Cota)</option>
              <option value="ceremonialist">Cerimonialista / Assessora (Isento de Cota)</option>
              <option value="musician">Músico / Banda (Isento de Cota)</option>
              <option value="staff">Staff / Equipe de Apoio (Isento de Cota)</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Restrição alimentar, alérgico a glúten..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loading ? 'Salvando...' : person ? 'Salvar Alterações' : 'Cadastrar Convidado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
