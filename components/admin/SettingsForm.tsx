'use client';

import React, { useState } from 'react';
import { EventConfig, EventTheme } from '@/types';
import { saveEventConfig } from '@/lib/db';
import { Save, Palette, RefreshCcw, Sparkles, Image as ImageIcon, Type, Layout, Heart, Eye, EyeOff, Layers, ShieldCheck } from 'lucide-react';

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
            <Palette className="w-4 h-4 text-amber-400" /> Editor de Módulos & Tema
          </div>
          <h2 className="text-2xl font-black text-white">Configuração do Evento & Identidade Visual</h2>
          <p className="text-xs text-slate-400">
            Gerencie o chaveamento dos módulos da aplicação e ajuste o tom do hotsite!
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

      {/* FEATURE TOGGLE CARD: MÓDULO CONVITE DIGITAL (PLUS DO APLICATIVO) */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 border-2 border-purple-500/40 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-black uppercase mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Módulo Adicional (Plus)
              </div>
              <h3 className="text-lg font-black text-white">Módulo Convite Digital Interativo (Hotsite)</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                O produto principal da plataforma é a <strong>Confirmação de Presença (RSVP Inteligente)</strong>. Ative esta chave se o seu cliente também contratou a exibição da página de hotsite com Save the Date, fotos, mapas e presentes!
              </p>
            </div>
          </div>

          {/* BOTÃO DE INTERRUPTOR FEATURE TOGGLE */}
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                show_digital_invite: formData.show_digital_invite === false ? true : false,
              })
            }
            className={`px-5 py-3 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-lg transition-all active:scale-95 border ${
              formData.show_digital_invite !== false
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
            }`}
          >
            {formData.show_digital_invite !== false ? (
              <>
                <Eye className="w-4 h-4" />
                <span>🟢 Convite Digital ATIVADO (Completo)</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-rose-400" />
                <span>🔴 Convite DESATIVADO (Modo RSVP Direto)</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-purple-500/20 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {formData.show_digital_invite !== false
              ? 'Status Atual: O convidado acessa o link e vê o Hotsite completo com aquarela, cronômetro, mapas e o card de RSVP.'
              : 'Status Atual: Modo RSVP Rápido ativado. O convidado acessa o link e vai direto para a tela de confirmação de presença (velocidade máxima).'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1 e 2: Formulário do Customizer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção Categoria Câmeras e Capa */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" /> Imagem da Capa / Aquarela do Convite Impresso
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                URL da Imagem da Capa (Aquarela de Flores)
              </label>
              <input
                type="text"
                placeholder="Ex: https://seusite.com/arte-convite-fernanda.jpg"
                value={theme.banner_image_url || ''}
                onChange={(e) => handleColorChange('banner_image_url', e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Seção Seleção de Fonte */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" /> Tipografia Principal do Hotsite
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleColorChange('font_family', 'serif')}
                className={`p-4 rounded-2xl border text-left font-serif transition-all ${
                  theme.font_family === 'serif'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="block font-bold text-sm">Clássica (Serif)</span>
                <span className="text-[11px] opacity-80">Ideal para casamentos e bailes elegantes</span>
              </button>

              <button
                type="button"
                onClick={() => handleColorChange('font_family', 'sans')}
                className={`p-4 rounded-2xl border text-left font-sans transition-all ${
                  theme.font_family === 'sans'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="block font-bold text-sm">Moderna (Sans)</span>
                <span className="text-[11px] opacity-80">Ideal para eventos corporativos e jovens</span>
              </button>
            </div>
          </div>

          {/* Seção Color Pickers Elemento por Elemento */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layout className="w-4 h-4 text-pink-400" /> Paleta de Cores Elemento por Elemento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cor Primária */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white">Cor Primária (Botões/Destaques)</label>
                  <span className="text-[10px] text-slate-400 font-mono">{theme.primary_color}</span>
                </div>
                <input
                  type="color"
                  value={theme.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
              </div>

              {/* Cor Destaque / Dourado */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white">Cor de Destaque (Dourado/Bordas)</label>
                  <span className="text-[10px] text-slate-400 font-mono">{theme.accent_color}</span>
                </div>
                <input
                  type="color"
                  value={theme.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
              </div>

              {/* Fundo do Hotsite */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white">Fundo Geral do Hotsite</label>
                  <span className="text-[10px] text-slate-400 font-mono">{theme.bg_color}</span>
                </div>
                <input
                  type="color"
                  value={theme.bg_color}
                  onChange={(e) => handleColorChange('bg_color', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
              </div>

              {/* Fundo dos Cards */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white">Fundo dos Cards de Conteúdo</label>
                  <span className="text-[10px] text-slate-400 font-mono">{theme.card_bg_color}</span>
                </div>
                <input
                  type="color"
                  value={theme.card_bg_color}
                  onChange={(e) => handleColorChange('card_bg_color', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
              </div>

              {/* Cor dos Textos */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between sm:col-span-2">
                <div>
                  <label className="block text-xs font-bold text-white">Cor Principal dos Textos</label>
                  <span className="text-[10px] text-slate-400 font-mono">{theme.text_color}</span>
                </div>
                <input
                  type="color"
                  value={theme.text_color}
                  onChange={(e) => handleColorChange('text_color', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 3: Live Preview ao Vivo (Simulador de Celular) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Preview ao Vivo no Celular
              </span>
              <span className="text-[10px] text-purple-400 font-mono">100% em Tempo Real</span>
            </div>

            {/* Telinha de Celular Simulado com as Cores em Tempo Real */}
            <div
              className="rounded-3xl p-5 border-4 shadow-2xl space-y-4 text-center transition-all overflow-hidden"
              style={{
                backgroundColor: theme.bg_color,
                borderColor: theme.accent_color,
                color: theme.text_color,
                fontFamily: theme.font_family === 'serif' ? 'serif' : 'sans-serif',
              }}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: theme.primary_color }}>
                  Save the Date
                </span>
                <h4 className="text-xl font-extrabold tracking-tight">Fernanda Seppi</h4>
                <p className="text-xs font-semibold">40 Anos Inesquecíveis</p>
              </div>

              {/* Botão Simulado com a Cor Primária */}
              <div
                className="py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-md"
                style={{ backgroundColor: theme.primary_color }}
              >
                Confirmar Presença
              </div>

              {/* Card Simulado */}
              <div
                className="p-4 rounded-2xl shadow-sm text-xs space-y-1 border text-left"
                style={{
                  backgroundColor: theme.card_bg_color,
                  borderColor: `${theme.accent_color}40`,
                }}
              >
                <div className="font-bold" style={{ color: theme.primary_color }}>
                  📍 Buffet Espaço Estupendo
                </div>
                <div className="text-[11px] opacity-80">São Bernardo do Campo - SP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
