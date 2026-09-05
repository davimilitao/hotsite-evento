'use client';

import React, { useState } from 'react';
import { Invite } from '@/types';
import { saveInvite } from '@/lib/db';
import { buildSurprisePhotoLink, buildSurpriseVideoLink, buildSurpriseTextLink, exportContactsToVCF } from '@/lib/utils';
import {
  Gift,
  Camera,
  Video,
  MessageSquareText,
  Settings,
  Search,
  Lock,
  Sparkles,
  Send,
  Save,
  X,
  Smartphone,
  Tv,
  UserCheck,
  Download,
  ArrowRight,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface SurpriseDashboardProps {
  invites: Invite[];
  onRefresh: () => void;
}

type CampaignType = 'photo' | 'video' | 'text';

export function SurpriseDashboard({ invites, onRefresh }: SurpriseDashboardProps) {
  // Modal de Disparo da Campanha Selecionada
  const [activeCampaignModal, setActiveCampaignModal] = useState<CampaignType | null>(null);
  
  // Modal de Configuração com Engrenagem
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Busca e Filtros dentro do Modal
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState<'all' | 'pending' | 'received'>('all');

  // Mensagens e Orientações da Campanha
  const [photoMsg, setPhotoMsg] = useState(
    'Segredo! 🤫 Shhh... Estamos preparando uma Homenagem Surpresa especial para os 40 Anos da Fernanda Seppi!\n\nPor favor, envie aqui neste WhatsApp uma foto marcante de vocês juntos para colocarmos no Mural/Telão da festa! 📸✨'
  );
  const [videoMsg, setVideoMsg] = useState(
    'Segredo! 🤫 Estamos preparando uma Homenagem Surpresa em Vídeo para os 40 Anos da Fernanda Seppi!\n\nEnvie um vídeo curto (15 a 30 segundos) mandando um abraço carinhoso para ela!\n\n{orientacao} 🎥✨'
  );
  const [textMsg, setTextMsg] = useState(
    'Segredo! 🤫 Estamos organizando um livro de depoimentos surpresa para os 40 Anos da Fernanda Seppi!\n\nPor favor, responda esta mensagem com um recado ou mensagem carinhosa de aniversário por escrito! ✍️❤️'
  );
  const [videoOrientation, setVideoOrientation] = useState<'horizontal' | 'vertical' | 'selfie'>('horizontal');

  // Convites confirmados
  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');

  const totalPhotoReceived = confirmedInvites.filter((i) => i.surprise_photo_sent).length;
  const totalVideoReceived = confirmedInvites.filter((i) => i.surprise_video_sent).length;
  const totalTextReceived = confirmedInvites.filter((i) => i.surprise_text_sent || i.surprise_message).length;

  // Filtragem dos convidados dentro do Modal Ativo
  const modalFilteredInvites = confirmedInvites.filter((inv) => {
    const matchesSearch =
      inv.head_name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      inv.phone.includes(modalSearchTerm);

    if (!matchesSearch) return false;

    if (activeCampaignModal === 'photo') {
      if (modalStatusFilter === 'pending') return !inv.surprise_photo_sent;
      if (modalStatusFilter === 'received') return inv.surprise_photo_sent;
    } else if (activeCampaignModal === 'video') {
      if (modalStatusFilter === 'pending') return !inv.surprise_video_sent;
      if (modalStatusFilter === 'received') return inv.surprise_video_sent;
    } else if (activeCampaignModal === 'text') {
      if (modalStatusFilter === 'pending') return !inv.surprise_text_sent && !inv.surprise_message;
      if (modalStatusFilter === 'received') return inv.surprise_text_sent || !!inv.surprise_message;
    }

    return true;
  });

  // Próximo convidado pendente para a Fila Rápida
  const nextPendingGuestInQueue = modalFilteredInvites.find((inv) => {
    if (activeCampaignModal === 'photo') return !inv.surprise_photo_sent;
    if (activeCampaignModal === 'video') return !inv.surprise_video_sent;
    if (activeCampaignModal === 'text') return !inv.surprise_text_sent && !inv.surprise_message;
    return true;
  });

  const handleDispatchSingle = (invite: Invite, type: CampaignType) => {
    let waUrl = '';
    if (type === 'photo') {
      waUrl = buildSurprisePhotoLink(invite.head_name, invite.phone, photoMsg);
    } else if (type === 'video') {
      waUrl = buildSurpriseVideoLink(invite.head_name, invite.phone, videoOrientation, videoMsg);
    } else if (type === 'text') {
      waUrl = buildSurpriseTextLink(invite.head_name, invite.phone, textMsg);
    }
    window.open(waUrl, '_blank');
  };

  const handleToggleMediaStatus = async (invite: Invite, type: CampaignType) => {
    if (type === 'photo') {
      await saveInvite({ ...invite, surprise_photo_sent: !invite.surprise_photo_sent });
    } else if (type === 'video') {
      await saveInvite({ ...invite, surprise_video_sent: !invite.surprise_video_sent });
    } else if (type === 'text') {
      await saveInvite({ ...invite, surprise_text_sent: !invite.surprise_text_sent });
    }
    onRefresh();
  };

  const handleSaveSurpriseTextNote = async (invite: Invite, textNote: string) => {
    await saveInvite({
      ...invite,
      surprise_message: textNote,
      surprise_text_sent: !!textNote,
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header Secreto da Homenagem Surpresa */}
      <div className="bg-gradient-to-r from-pink-950 via-purple-950 to-slate-900 border border-pink-500/40 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-extrabold border border-pink-500/30">
            <Lock className="w-3.5 h-3.5 text-pink-400" /> SEGREDO DA FESTA • Visível apenas para Assessor & Admin
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2 font-serif">
            Hub de Campanhas da Homenagem Surpresa <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-pink-100 max-w-xl leading-relaxed">
            Selecione uma das 3 campanhas abaixo para gerenciar os disparos e coletar as mídias dos convidados.
          </p>
        </div>

        {/* Botão de Engrenagem para Configurar Textos das Campanhas */}
        <button
          onClick={() => setIsConfigOpen(true)}
          className="px-4 py-2.5 bg-pink-500 hover:bg-pink-400 text-slate-950 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-pink-300"
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Textos das Campanhas</span>
        </button>
      </div>

      {/* GUIA DE INTEGRATION WHATSAPP BUSINESS & DOWNLOAD DE CONTATOS VCF */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm">Disparo em Massa pelo WhatsApp Business?</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              O WhatsApp só entrega Listas de Transmissão para quem tem seu número salvo na agenda. Baixe a agenda de contatos em VCF para importar os {confirmedInvites.length} convidados no seu celular com 1 clique!
            </p>
          </div>
        </div>

        <button
          onClick={() => exportContactsToVCF(confirmedInvites)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Agenda de Contatos (VCF)</span>
        </button>
      </div>

      {/* OS 3 CARDS MESTRE DE CAMPANHA NO TOPO (INVERSÃO DE UX) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD MESTRE 1: CAMPANHA DE FOTOS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-md space-y-5 flex flex-col justify-between hover:border-pink-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-pink-500 text-slate-950 rounded-2xl shadow-md">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950 px-3 py-1 rounded-full border border-pink-400">
                {totalPhotoReceived} / {confirmedInvites.length} Recebidas
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">1. Campanha de Fotos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Solicite aos convidados fotos marcantes e recordações antigas com a Fernanda Seppi para exibir no Mural/Telão.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveCampaignModal('photo')}
            className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>Gerenciar & Disparar Fotos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* CARD MESTRE 2: CAMPANHA DE VÍDEOS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-md space-y-5 flex flex-col justify-between hover:border-purple-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md">
                <Video className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-400">
                {totalVideoReceived} / {confirmedInvites.length} Recebidos
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">2. Campanha de Vídeos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Solicite pequenos depoimentos em vídeo selfie ({videoOrientation === 'horizontal' ? 'Celular Deitado' : videoOrientation === 'vertical' ? 'Celular em Pé' : 'Selfie'}).
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveCampaignModal('video')}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>Gerenciar & Disparar Vídeos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* CARD MESTRE 3: CAMPANHA DE RECADOS POR ESCRITO */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-md space-y-5 flex flex-col justify-between hover:border-amber-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-400">
                {totalTextReceived} / {confirmedInvites.length} Recebidos
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">3. Campanha de Recados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Colete homenagens e frases carinhosas por escrito para montar o Livro de Ouro e frases no telão.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveCampaignModal('text')}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>Gerenciar & Disparar Recados</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL DE DISPARO DE CAMPANHA DEDICADO (FILA RÁPIDA) */}
      {activeCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl text-slate-950 font-black ${
                    activeCampaignModal === 'photo'
                      ? 'bg-pink-500'
                      : activeCampaignModal === 'video'
                      ? 'bg-purple-600 text-white'
                      : 'bg-amber-500'
                  }`}
                >
                  {activeCampaignModal === 'photo' ? (
                    <Camera className="w-6 h-6" />
                  ) : activeCampaignModal === 'video' ? (
                    <Video className="w-6 h-6" />
                  ) : (
                    <MessageSquareText className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                    {activeCampaignModal === 'photo'
                      ? 'Campanha de Coleta de Fotos'
                      : activeCampaignModal === 'video'
                      ? 'Campanha de Coleta de Vídeos'
                      : 'Campanha de Recados por Escrito'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Disparos individuais para os {confirmedInvites.length} convidados confirmados
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCampaignModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* BOTÃO DE FILA RÁPIDA (1-CLICK DISPATCH NEXT) */}
            {nextPendingGuestInQueue && (
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-4 rounded-2xl border border-purple-500/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" /> Próximo da Fila de Disparo:
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    {nextPendingGuestInQueue.head_name} ({nextPendingGuestInQueue.phone})
                  </h4>
                </div>

                <button
                  onClick={() => handleDispatchSingle(nextPendingGuestInQueue, activeCampaignModal)}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>⚡ Disparar Próximo no WhatsApp</span>
                </button>
              </div>
            )}

            {/* BARRA DE BUSCA E FILTROS DO MODAL */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar convidado nesta campanha..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: 'Aguardando Mídia' },
                  { id: 'received', label: 'Mídia Recebida' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setModalStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      modalStatusFilter === f.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TABELA DE CONVIDADOS DENTRO DO MODAL */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Convidado</th>
                    <th className="py-3 px-4 text-center">Status Mídia</th>
                    <th className="py-3 px-4 text-center">Disparar WhatsApp</th>
                    <th className="py-3 px-4 text-right">Recado / Anotação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {modalFilteredInvites.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Nenhum convidado encontrado para os filtros.
                      </td>
                    </tr>
                  ) : (
                    modalFilteredInvites.map((inv) => {
                      let isMediaReceived = false;
                      if (activeCampaignModal === 'photo') isMediaReceived = !!inv.surprise_photo_sent;
                      if (activeCampaignModal === 'video') isMediaReceived = !!inv.surprise_video_sent;
                      if (activeCampaignModal === 'text') isMediaReceived = !!inv.surprise_text_sent || !!inv.surprise_message;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              {inv.head_name}
                            </span>
                            <span className="text-[11px] text-slate-400">{inv.phone}</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleMediaStatus(inv, activeCampaignModal)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-extrabold border transition-all ${
                                isMediaReceived
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {isMediaReceived ? '✓ Recebido' : 'Marcar Recebido'}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDispatchSingle(inv, activeCampaignModal)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar no WhatsApp</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <input
                              type="text"
                              placeholder="Recado ou link..."
                              defaultValue={inv.surprise_message || ''}
                              onBlur={(e) => handleSaveSurpriseTextNote(inv, e.target.value)}
                              className="w-48 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR MENSAGENS DA CAMPANHA SECRETA (ENGRENAGEM) */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-500 text-slate-950 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                    Configurar Textos das Campanhas Secretas
                  </h3>
                  <p className="text-xs text-slate-400">Edite as mensagens padrão enviadas no WhatsApp</p>
                </div>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Configuração 1: Pedir Foto */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-pink-500" /> Mensagem Padrão para Pedir Foto
              </label>
              <textarea
                rows={3}
                value={photoMsg}
                onChange={(e) => setPhotoMsg(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>

            {/* Configuração 2: Pedir Vídeo com Seletor de Orientação de Celular */}
            <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-purple-500" /> Mensagem Padrão para Pedir Vídeo
                </span>
                <span className="text-[10px] text-purple-500 font-extrabold uppercase">Recomendação de Gravação</span>
              </label>

              {/* Seletor de Orientação de Gravação do Celular */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVideoOrientation('horizontal')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                    videoOrientation === 'horizontal'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Celular Deitado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoOrientation('vertical')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                    videoOrientation === 'vertical'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Celular em Pé</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoOrientation('selfie')}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                    videoOrientation === 'selfie'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Formato Selfie</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={videoMsg}
                onChange={(e) => setVideoMsg(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Configuração 3: Pedir Recado */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <MessageSquareText className="w-4 h-4 text-amber-500" /> Mensagem Padrão para Pedir Recado
              </label>
              <textarea
                rows={3}
                value={textMsg}
                onChange={(e) => setTextMsg(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações da Campanha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
