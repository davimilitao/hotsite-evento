'use client';

import React, { useState } from 'react';
import { EventConfig, GiftItem } from '@/types';
import { saveEventConfig } from '@/lib/db';
import { Gift, Plus, Trash2, Save, Sparkles, CheckCircle2, RefreshCw, Eye, HeartHandshake } from 'lucide-react';

interface GiftManagerProps {
  config: EventConfig;
  onRefresh: () => void;
}

export function GiftManager({ config, onRefresh }: GiftManagerProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados dos campos de texto da mensagem
  const [title, setTitle] = useState(config.gift_message_title || 'Um Recadinho da Fê');
  const [subtitle, setSubtitle] = useState(config.gift_message_subtitle || 'Sobre Presentes & Mimos');
  const [intro, setIntro] = useState(
    config.gift_message_intro ||
      'Ah, que legal que você clicou aqui! 🥰\n\nFalando bem sério: a sua presença e o seu abraço são os meus maiores e melhores presentes. Mas, como algumas pessoas me pediram um norte, deixo aqui algumas ideias se você quiser me fazer um mimo:'
  );
  const [outro, setOutro] = useState(
    config.gift_message_outro ||
      'Bom, acho que já sugeri até demais! Mas o que importa mesmo é a sua presença para termos um dia maravilhoso juntos. Espero por você!'
  );
  const [signature, setSignature] = useState(config.gift_message_signature || 'Com carinho,\nFê 💖');

  // Estados dos itens da lista de presentes
  const defaultItems: GiftItem[] = [
    { id: 'item-1', title: 'Miniaturas de perfumes', description: '(sabe como sou apegada a essas coisinhas, né?)' },
    { id: 'item-2', title: 'Body splashs', description: '(para me manter cheirosa sempre ✨).' },
    { id: 'item-3', title: 'Velas aromáticas, incensos e itens da linha zen', description: '(para criar aquele ambiente de paz e tranquilidade, muito bom pra recarregar as energias).' },
    { id: 'item-4', title: 'Tudo que tenha cachorro salsicha como tema!', description: '(é, eu amo as minhas meninas... mesmo que elas me tirem a paz de vez em quando. Na dúvida, me dá a vela zen junto para equilibrar! hahaha 🌭🐕).' },
    { id: 'item-5', title: 'Tênis (tamanho 37) ou Sandálias (tamanho 36)', description: '' },
    { id: 'item-6', title: 'Vinhos e mais vinhos!', description: '(brincadeira... ou não 🍷), acessórios e sabonetes perfumados.' },
  ];

  const [items, setItems] = useState<GiftItem[]>(
    config.gift_items && config.gift_items.length > 0 ? config.gift_items : defaultItems
  );

  // Chave Pix
  const [pixKey, setPixKey] = useState(config.pix_key || '');
  const [pixName, setPixName] = useState(config.pix_name || '');

  // Sincroniza o formulário sempre que o config for recarregado (ex: por outra pessoa ou na troca de aba)
  React.useEffect(() => {
    setTitle(config.gift_message_title || 'Um Recadinho da Fê');
    setSubtitle(config.gift_message_subtitle || 'Sobre Presentes & Mimos');
    setIntro(
      config.gift_message_intro ||
        'Ah, que legal que você clicou aqui! 🥰\n\nFalando bem sério: a sua presença e o seu abraço são os meus maiores e melhores presentes. Mas, como algumas pessoas me pediram um norte, deixo aqui algumas ideias se você quiser me fazer um mimo:'
    );
    setOutro(
      config.gift_message_outro ||
        'Bom, acho que já sugeri até demais! Mas o que importa mesmo é a sua presença para termos um dia maravilhoso juntos. Espero por você!'
    );
    setSignature(config.gift_message_signature || 'Com carinho,\nFê 💖');
    setItems(
      config.gift_items && config.gift_items.length > 0 ? config.gift_items : defaultItems
    );
    setPixKey(config.pix_key || '');
    setPixName(config.pix_name || '');
  }, [config]);

  // Novo item temporário
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAddItem = () => {
    if (!newTitle.trim()) return;
    const newItem: GiftItem = {
      id: `gift-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
    };
    setItems([...items, newItem]);
    setNewTitle('');
    setNewDesc('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'title' | 'description', value: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const updatedConfig: EventConfig = {
        ...config,
        gift_message_title: title.trim(),
        gift_message_subtitle: subtitle.trim(),
        gift_message_intro: intro.trim(),
        gift_message_outro: outro.trim(),
        gift_message_signature: signature.trim(),
        gift_items: items,
        pix_key: pixKey.trim(),
        pix_name: pixName.trim(),
      };

      await saveEventConfig(updatedConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar lista de presentes:', err);
      alert('Ocorreu um erro ao salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header da Seção */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/20 text-pink-400 rounded-2xl border border-pink-500/30">
            <Gift className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Lista de Presentes & Mimos
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400">
              Personalize a mensagem carinhosa e os itens de mimos exibidos aos convidados no Hotsite.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-fade-in shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Alterações salvas com sucesso! A lista de presentes no Hotsite já foi atualizada.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* PARTE 1: MENSAGEM PESSOAL DA ANIVERSARIANTE */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" /> 1. Mensagem & Recadinho Pessoal
            </h3>
            <span className="text-[11px] text-slate-500">Editável pela Aniversariante</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Título do Card
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Um Recadinho da Fê"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Subtítulo / Categoria
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: SOBRE PRESENTES & MIMOS"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Introdução / Boas-vindas
            </label>
            <textarea
              rows={3}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="Mensagem carinhosa de abertura..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Encerramento
              </label>
              <textarea
                rows={2}
                value={outro}
                onChange={(e) => setOutro(e.target.value)}
                placeholder="Mensagem final..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Assinatura
              </label>
              <textarea
                rows={2}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Ex: Com carinho, Fê 💖"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* PARTE 2: LISTA DE PRESENTES / MIMOS */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <Gift className="w-4 h-4" /> 2. Ideias de Presentes & Mimos ({items.length} itens)
            </h3>
            <span className="text-[11px] text-slate-500">Adicione, edite ou exclua sugestões</span>
          </div>

          {/* Lista de itens existentes */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3 transition-all hover:border-slate-700"
              >
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-black flex items-center justify-center shrink-0 mt-1">
                  {idx + 1}
                </span>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                    placeholder="Título do presente (ex: Miniaturas de perfumes)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                    placeholder="Detalhe complementar (opcional)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Excluir item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Adicionar novo item */}
          <div className="bg-slate-950/60 border border-dashed border-slate-700 p-4 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-pink-400" /> Adicionar Nova Ideia de Mimo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nome do presente (ex: Body splashs)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Detalhes (ex: para me manter cheirosa ✨)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newTitle.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-pink-300 font-extrabold text-xs rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar à Lista
            </button>
          </div>
        </div>

        {/* PARTE 3: PIX / VAQUINHA OPCIONAL */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 3. Vaquinha ou Chave Pix (Opcional)
            </h3>
            <span className="text-[11px] text-slate-500">Para quem preferir presentear em dinheiro</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Chave Pix
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: fernanda.seppi40@email.com ou celular"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome do Beneficiário Pix
              </label>
              <input
                type="text"
                value={pixName}
                onChange={(e) => setPixName(e.target.value)}
                placeholder="Ex: Fernanda Seppi"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar Flutuante ou no Final */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{loading ? 'Salvando Alterações...' : 'Salvar Lista de Presentes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
