'use client';

import React, { useState } from 'react';
import { EventConfig, GiftSuggestion } from '@/types';
import { saveEventConfig } from '@/lib/db';
import { Settings, Save, Plus, Trash2, CheckCircle2, QrCode, MapPin, Gift } from 'lucide-react';

interface SettingsFormProps {
  config: EventConfig;
  onRefresh: () => void;
}

export function SettingsForm({ config: initialConfig, onRefresh }: SettingsFormProps) {
  const [config, setConfig] = useState<EventConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleChange = (field: keyof EventConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleAddGift = () => {
    const newGift: GiftSuggestion = {
      id: `gift-${Date.now()}`,
      title: 'Nova Ideia de Presente',
      description: 'Descrição do presente ou tamanho',
      category: 'other',
    };
    setConfig({
      ...config,
      gift_suggestions: [...(config.gift_suggestions || []), newGift],
    });
  };

  const handleRemoveGift = (id: string) => {
    setConfig({
      ...config,
      gift_suggestions: config.gift_suggestions.filter((g) => g.id !== id),
    });
  };

  const handleGiftChange = (index: number, field: keyof GiftSuggestion, value: string) => {
    const updated = [...config.gift_suggestions];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, gift_suggestions: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedMsg(false);

    try {
      await saveEventConfig(config);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {savedMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Seção Dados do Evento */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" /> Informações Gerais da Festa
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título da Festa</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Aniversariante</label>
            <input
              type="text"
              value={config.birthday_person}
              onChange={(e) => handleChange('birthday_person', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data e Hora da Festa</label>
            <input
              type="datetime-local"
              value={config.date_time ? config.date_time.slice(0, 16) : ''}
              onChange={(e) => handleChange('date_time', new Date(e.target.value).toISOString())}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prazo Limite RSVP</label>
            <input
              type="datetime-local"
              value={config.deadline_rsvp ? config.deadline_rsvp.slice(0, 16) : ''}
              onChange={(e) => handleChange('deadline_rsvp', new Date(e.target.value).toISOString())}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Seção Endereço & Localização */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" /> Localização & Endereço
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Salão / Buffet</label>
            <input
              type="text"
              value={config.location_name}
              onChange={(e) => handleChange('location_name', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Endereço Completo</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Link Google Maps</label>
              <input
                type="text"
                value={config.maps_url}
                onChange={(e) => handleChange('maps_url', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Link Waze</label>
              <input
                type="text"
                value={config.waze_url}
                onChange={(e) => handleChange('waze_url', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção Pix & Presentes */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-500" /> Dados do Pix & Lista de Presentes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chave Pix Copia-e-Cola / E-mail</label>
            <input
              type="text"
              value={config.pix_key}
              onChange={(e) => handleChange('pix_key', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome / Banco do Pix</label>
            <input
              type="text"
              value={config.pix_name || ''}
              onChange={(e) => handleChange('pix_name', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Sugestões de Presentes */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sugestões de Presentes</label>
            <button
              type="button"
              onClick={handleAddGift}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> Adicionar Sugestão
            </button>
          </div>

          <div className="space-y-2">
            {config.gift_suggestions.map((gift, idx) => (
              <div
                key={gift.id}
                className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={gift.title}
                  onChange={(e) => handleGiftChange(idx, 'title', e.target.value)}
                  className="w-1/3 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold"
                />
                <input
                  type="text"
                  value={gift.description}
                  onChange={(e) => handleGiftChange(idx, 'description', e.target.value)}
                  className="w-2/3 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGift(gift.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        <span>Salvar Todas as Configurações</span>
      </button>
    </form>
  );
}
