'use client';

import React, { useState } from 'react';
import { EventConfig, EventTheme, FontOption } from '@/types';
import { saveEventConfig } from '@/lib/db';
import {
  Save,
  Palette,
  RefreshCcw,
  Sparkles,
  Image as ImageIcon,
  Type,
  Layout,
  Eye,
  EyeOff,
  Layers,
  ShieldCheck,
  Upload,
  FileImage,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface SettingsFormProps {
  config: EventConfig;
  onRefresh: () => void;
}

export function SettingsForm({ config, onRefresh }: SettingsFormProps) {
  const [formData, setFormData] = useState<EventConfig>(config);
  const [loading, setLoading] = useState(false);

  const theme: EventTheme = formData.theme || {
    preset: 'custom',
    invite_mode: 'custom',
    uploaded_invite_url: '',
    primary_color: '#6b4684',
    accent_color: '#c5a059',
    bg_color: '#faf6f0',
    card_bg_color: '#ffffff',
    text_color: '#2d2138',
    font_family: 'serif',
    banner_image_url: '',
  };

  const handleColorChange = (key: keyof EventTheme, value: any) => {
    setFormData({
      ...formData,
      theme: {
        ...theme,
        [key]: value,
      },
    });
  };

  // Upload de Imagem via FileReader (Leitura de Arquivo Local)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleColorChange('uploaded_invite_url', result);
        handleColorChange('invite_mode', 'upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToFernandaTheme = () => {
    setFormData({
      ...formData,
      theme: {
        preset: 'lavender_floral',
        invite_mode: 'custom',
        uploaded_invite_url: '',
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
            Gerencie o chaveamento dos módulos da aplicação e suba a arte impressa da sua festa!
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
                O produto principal da plataforma é a <strong>Confirmação de Presença (RSVP Inteligente)</strong>. Ative esta chave se o seu cliente também contratou a exibição do hotsite visual com Save the Date, fotos e mapas!
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
              ? 'Status Atual: O convidado acessa o link e vê o Hotsite completo com a arte do convite, cronômetro, mapas e RSVP.'
              : 'Status Atual: Modo RSVP Rápido ativado. O convidado acessa o link e vai DIRETO para a tela de confirmação de presença (velocidade máxima).'}
          </span>
        </div>
      </div>

      {/* QUANDO O CONVITE DIGITAL ESTIVER ATIVADO: SELEÇÃO DOS 2 MODOS DE EXIBIÇÃO */}
      {formData.show_digital_invite !== false && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileImage className="w-5 h-5 text-amber-400" /> Escolha o Modo de Exibição do Convite Digital
            </h3>
            <p className="text-xs text-slate-400">
              Você pode subir a foto do seu convite de papel físico ou criar a página visual no editor abaixo.
            </p>
          </div>

          {/* CHAVE SELETORA DOS 2 MODOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MODO A: UPLOAD DA ARTE IMPRESSA */}
            <button
              type="button"
              onClick={() => handleColorChange('invite_mode', 'upload')}
              className={`p-5 rounded-3xl border-2 text-left space-y-2 transition-all ${
                theme.invite_mode === 'upload'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-xl'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-amber-300">Modo A: Subir Arte Impressa</span>
                {theme.invite_mode === 'upload' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
              </div>
              <p className="text-xs leading-relaxed opacity-80">
                Sua foto/arte do convite físico será exibida como um convite real em destaque no topo da página.
              </p>
            </button>

            {/* MODO B: EDITAR NO HOTSITE */}
            <button
              type="button"
              onClick={() => handleColorChange('invite_mode', 'custom')}
              className={`p-5 rounded-3xl border-2 text-left space-y-2 transition-all ${
                theme.invite_mode !== 'upload'
                  ? 'bg-purple-500/10 border-purple-500 text-white shadow-xl'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-purple-300">Modo B: Editor Customizável</span>
                {theme.invite_mode !== 'upload' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
              </div>
              <p className="text-xs leading-relaxed opacity-80">
                Personalize as cores, flores e fontes do hotsite diretamente nos seletores da aplicação.
              </p>
            </button>
          </div>

          {/* ÁREA DE UPLOAD DE ARQUIVO (QUANDO MODO A FOR SELECIONADO) */}
          {theme.invite_mode === 'upload' && (
            <div className="bg-slate-950 p-6 rounded-3xl border border-amber-500/30 space-y-4 animate-fade-in">
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload de Imagem do Convite Físico (PNG, JPG, WEBP)
              </h4>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="flex-1 w-full p-4 bg-slate-900 border-2 border-dashed border-amber-500/50 hover:border-amber-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center gap-2 transition-all">
                  <Upload className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Clique para selecionar o arquivo da Arte</span>
                  <span className="text-[10px] text-slate-400">Suporta imagens de até 4MB (.jpg, .png, .webp)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                {theme.uploaded_invite_url && (
                  <div className="relative group shrink-0">
                    <img
                      src={theme.uploaded_invite_url}
                      alt="Arte do Convite Impresso"
                      className="w-32 h-40 object-cover rounded-2xl border-2 border-amber-400 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleColorChange('uploaded_invite_url', '')}
                      className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md transition-colors"
                      title="Remover imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO DE CUSTOMIZAÇÃO VISUAL E NOVAS FONTES ELEGANTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1 e 2: Formulário do Customizer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção Seleção de 5 Fontes Elegantes de Eventos */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" /> Tipografia Elegante do Hotsite (Google Fonts)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'playfair', name: 'Playfair Display', desc: 'Serif Luxuosa Editorial' },
                { id: 'cinzel', name: 'Cinzel', desc: 'Serif Romana (Gala)' },
                { id: 'script', name: 'Great Vibes', desc: 'Caligrafia / Cursiva' },
                { id: 'serif', name: 'Georgia', desc: 'Serif Clássica' },
                { id: 'sans', name: 'Montserrat', desc: 'Sans Moderna Minimal' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleColorChange('font_family', f.id as FontOption)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    theme.font_family === f.id
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block font-bold text-xs">{f.name}</span>
                  <span className="text-[10px] opacity-80">{f.desc}</span>
                </button>
              ))}
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
              }}
            >
              {theme.invite_mode === 'upload' && theme.uploaded_invite_url ? (
                <div className="space-y-2">
                  <img
                    src={theme.uploaded_invite_url}
                    alt="Preview Arte Impressa"
                    className="w-full h-48 object-cover rounded-2xl border-2 border-amber-400 shadow-md"
                  />
                  <span className="text-[10px] font-bold text-amber-600 block">Arte Impressa Carregada</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: theme.primary_color }}>
                    Save the Date
                  </span>
                  <h4 className="text-xl font-extrabold tracking-tight">Fernanda Seppi</h4>
                  <p className="text-xs font-semibold">40 Anos Inesquecíveis</p>
                </div>
              )}

              {/* Botão Simulado com a Cor Primária */}
              <div
                className="py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-md"
                style={{ backgroundColor: theme.primary_color }}
              >
                Confirmar Presença
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
