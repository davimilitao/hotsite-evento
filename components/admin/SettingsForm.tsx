'use client';

import React, { useState } from 'react';
import { EventConfig, EventTheme } from '@/types';
import { saveEventConfig } from '@/lib/db';
import { Save, Palette, RefreshCcw, Sparkles, Image as ImageIcon, Type, Layout, Heart } from 'lucide-react';

interface SettingsFormProps {
  config: EventConfig;
  onRefresh: () => void;
}

export function SettingsForm({ config, onRefresh }: SettingsFormProps) {
  const [formData, setFormData] = useState<EventConfig>(config);
  const [loading, setLoading] = useState(false);

  const theme: EventTheme = formData.theme || {
    preset: 'custom',
    primary_color: '#6b4684',
    accent_color: '#c5a059',
    bg_color: '#faf6f0',
    card_bg_color: '#ffffff',
    text_color: '#2d2138',
    font_family: 'serif',
    banner_image_url: '',
  };

  const handleColorChange = (key: keyof EventTheme, value: string) => {
    setFormData({
      ...formData,
      theme: {
        ...theme,
        [key]: value,
      },
    });
  };

  const handleResetToFernandaTheme = () => {
    setFormData({
      ...formData,
      theme: {
        preset: 'lavender_floral',
        primary_color: '#6b4684',
        accent_color: '#c5a059',
        bg_color: '#faf6f0',
        card_bg_color: '#ffffff',
        text_color: '#2d2138',
        font_family: 'serif',
        banner_image_url: '',
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveEventConfig(formData);
      alert('Configurações e Tema Salvos com Sucesso!');
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      alert('Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      {/* Topo do Customizer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold mb-2">
            <Palette className="w-4 h-4 text-amber-400" /> Editor Estilo WordPress
          </div>
          <h2 className="text-2xl font-black text-white">Customizador de Tema & Identidade Visual</h2>
          <p className="text-xs text-slate-400">
            Ajuste cada cor, fonte e capa para combinar 100% com a arte do convite impresso!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToFernandaTheme}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all"
            title="Restaura as cores exatas da arte lavanda/dourada de Fernanda Seppi"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> ⚡ Cores da Arte Impressa
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Grid Principal: Controles do Customizer à Esquerda | Live Preview à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel de Controles do Customizer (8 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seção 1: Seletores de Cores */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" /> Paleta de Cores Elemento por Elemento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Cor Primária (Lavanda) */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Cor Primária (Títulos & Botões)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={theme.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Cor Destaque (Dourado Nobre) */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Cor Destaque (Dourado & Ícones)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={theme.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Fundo do Hotsite (Creme/Marfim) */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Fundo Geral do Hotsite
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.bg_color}
                    onChange={(e) => handleColorChange('bg_color', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={theme.bg_color}
                    onChange={(e) => handleColorChange('bg_color', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Fundo dos Cards */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Fundo dos Cards & Modais
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.card_bg_color}
                    onChange={(e) => handleColorChange('card_bg_color', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={theme.card_bg_color}
                    onChange={(e) => handleColorChange('card_bg_color', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Cor do Texto Principal */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300">
                  Cor do Texto Principal
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={theme.text_color}
                    onChange={(e) => handleColorChange('text_color', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Tipografia & Banner */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" /> Tipografia & Banner de Capa
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Estilo da Fonte Principal
                </label>
                <select
                  value={theme.font_family}
                  onChange={(e) => handleColorChange('font_family', e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="serif">Serif (Georgia / Clássico e Elegante)</option>
                  <option value="sans">Sans-Serif (Moderno e Limpo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL da Imagem da Capa (Arte do Convite Impresso)
                </label>
                <input
                  type="url"
                  placeholder="https://sua-imagem.com/arte-convite.jpg"
                  value={theme.banner_image_url || ''}
                  onChange={(e) => handleColorChange('banner_image_url', e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Dados Gerais do Evento & Pix */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Layout className="w-4 h-4 text-purple-400" /> Dados do Evento & Chave Pix
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Título da Festa</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Aniversariante</label>
                <input
                  type="text"
                  value={formData.birthday_person}
                  onChange={(e) => setFormData({ ...formData, birthday_person: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Chave Pix</label>
                <input
                  type="text"
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Conta Pix</label>
                <input
                  type="text"
                  value={formData.pix_name || ''}
                  onChange={(e) => setFormData({ ...formData, pix_name: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Simulado do Hotsite (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Pré-Visualização em Tempo Real (Celular)
              </span>
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono text-[10px]">
                LIVE PREVIEW
              </span>
            </div>

            {/* Telinha de Simulação do Celular */}
            <div
              className="rounded-3xl p-5 shadow-2xl border-4 border-slate-800 space-y-4 transition-all duration-300 overflow-hidden"
              style={{
                backgroundColor: theme.bg_color,
                color: theme.text_color,
                fontFamily: theme.font_family === 'serif' ? 'Georgia, serif' : 'sans-serif',
              }}
            >
              {/* Card Simulado do Header */}
              <div
                className="p-4 rounded-2xl border text-center space-y-2 shadow-sm"
                style={{
                  backgroundColor: theme.card_bg_color,
                  borderColor: theme.accent_color + '40',
                }}
              >
                <span
                  className="text-[10px] font-extrabold tracking-widest uppercase block"
                  style={{ color: theme.accent_color }}
                >
                  SAVE THE DATE
                </span>
                <h4 className="text-xl font-extrabold" style={{ color: theme.primary_color }}>
                  {formData.birthday_person}
                </h4>
                <span className="text-xs font-bold" style={{ color: theme.accent_color }}>
                  40 Anos 🌸✨
                </span>
              </div>

              {/* Card Simulado do RSVP */}
              <div
                className="p-4 rounded-2xl border space-y-3 shadow-sm"
                style={{
                  backgroundColor: theme.card_bg_color,
                  borderColor: theme.accent_color + '30',
                }}
              >
                <span className="text-xs font-bold block" style={{ color: theme.text_color }}>
                  Confirmação de Presença
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="p-2 rounded-xl text-center text-xs font-bold border"
                    style={{
                      borderColor: theme.primary_color,
                      backgroundColor: theme.primary_color + '15',
                      color: theme.primary_color,
                    }}
                  >
                    🎉 Vou Comemorar
                  </div>

                  <div
                    className="p-2 rounded-xl text-center text-xs font-bold border opacity-60"
                    style={{ borderColor: theme.text_color + '30', color: theme.text_color }}
                  >
                    😔 Não Poderei Ir
                  </div>
                </div>

                <div
                  className="w-full py-2.5 rounded-xl text-center text-xs font-extrabold text-white shadow"
                  style={{ backgroundColor: theme.primary_color }}
                >
                  Confirmar Resposta
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
