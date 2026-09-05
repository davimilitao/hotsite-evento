'use client';

import React, { useState } from 'react';
import { Invite } from '@/types';
import { saveInvite } from '@/lib/db';
import { buildSurprisePhotoLink, buildSurpriseVideoLink, buildSurpriseTextLink } from '@/lib/utils';
import {
  Gift,
  Camera,
  Video,
  MessageSquareText,
  Settings,
  Search,
  CheckCircle2,
  Lock,
  Sparkles,
  Send,
  Save,
  X,
  Smartphone,
  Tv,
  UserCheck,
} from 'lucide-react';

interface SurpriseDashboardProps {
  invites: Invite[];
  onRefresh: () => void;
}

export function SurpriseDashboard({ invites, onRefresh }: SurpriseDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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

  const filteredInvites = confirmedInvites.filter((i) =>
    i.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.phone.includes(searchTerm)
  );

  const totalPhotoReceived = confirmedInvites.filter((i) => i.surprise_photo_sent).length;
  const totalVideoReceived = confirmedInvites.filter((i) => i.surprise_video_sent).length;
  const totalTextReceived = confirmedInvites.filter((i) => i.surprise_text_sent || i.surprise_message).length;

  const handleDispatchPhoto = (invite: Invite) => {
    const waUrl = buildSurprisePhotoLink(invite.head_name, invite.phone, photoMsg);
    window.open(waUrl, '_blank');
  };

  const handleDispatchVideo = (invite: Invite) => {
    const waUrl = buildSurpriseVideoLink(invite.head_name, invite.phone, videoOrientation, videoMsg);
    window.open(waUrl, '_blank');
  };

  const handleDispatchText = (invite: Invite) => {
    const waUrl = buildSurpriseTextLink(invite.head_name, invite.phone, textMsg);
    window.open(waUrl, '_blank');
  };

  const handleTogglePhotoStatus = async (invite: Invite) => {
    await saveInvite({
      ...invite,
      surprise_photo_sent: !invite.surprise_photo_sent,
    });
    onRefresh();
  };

  const handleToggleVideoStatus = async (invite: Invite) => {
    await saveInvite({
      ...invite,
      surprise_video_sent: !invite.surprise_video_sent,
    });
    onRefresh();
  };

  const handleToggleTextStatus = async (invite: Invite) => {
    await saveInvite({
      ...invite,
      surprise_text_sent: !invite.surprise_text_sent,
    });
    onRefresh();
  };

  const handleSaveSurpriseMessage = async (invite: Invite, messageText: string) => {
    await saveInvite({
      ...invite,
      surprise_message: messageText,
      surprise_text_sent: !!messageText,
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Banner de Destaque Secreto com Botão de Engrenagem */}
      <div className="bg-gradient-to-r from-pink-900 via-purple-900 to-slate-900 border border-pink-500/40 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-extrabold border border-pink-500/30">
              <Lock className="w-3.5 h-3.5 text-pink-400" /> SEGREDO DA FESTA • Visível apenas para Assessor & Admin
            </div>
            <h2 className="text-2xl font-black flex items-center gap-2 font-serif">
              Coleta de Mídias & Homenagem Surpresa <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-pink-100 max-w-2xl leading-relaxed">
              Dispare mensagens secretas no WhatsApp dos convidados solicitando <strong>Fotos</strong>, <strong>Vídeos</strong> ou <strong>Recados</strong> para o telão e mural da festa.
            </p>
          </div>

          {/* Botão de Engrenagem para Editar as Mensagens da Campanha */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-4 py-2.5 bg-pink-500 hover:bg-pink-400 text-slate-950 rounded-2xl text-xs font-black shrink-0 flex items-center gap-2 shadow-lg transition-all active:scale-95 border border-pink-300"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Textos das Campanhas</span>
          </button>
        </div>

        {/* Métricas de Fotos, Vídeos e Recados Recebidos */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-pink-500/30 text-center">
            <span className="text-xl font-black text-pink-400">{totalPhotoReceived}</span>
            <span className="block text-[10px] text-pink-200 font-bold uppercase">Fotos Recebidas</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-purple-500/30 text-center">
            <span className="text-xl font-black text-purple-400">{totalVideoReceived}</span>
            <span className="block text-[10px] text-purple-200 font-bold uppercase">Vídeos Recebidos</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-amber-500/30 text-center">
            <span className="text-xl font-black text-amber-400">{totalTextReceived}</span>
            <span className="block text-[10px] text-amber-200 font-bold uppercase">Recados Recebidos</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca de Convidados */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar convidado para pedir homenagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none text-slate-800 dark:text-slate-100"
          />
        </div>

        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
          Mostrando {filteredInvites.length} convidados confirmados
        </span>
      </div>

      {/* LISTA DE CONVIDADOS COM 3 CARDS/BOTÕES GRANDES DE AÇÃO */}
      <div className="space-y-4">
        {filteredInvites.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">
            Nenhum convidado confirmado encontrado para solicitar homenagem surpresa.
          </div>
        ) : (
          filteredInvites.map((invite) => {
            return (
              <div
                key={invite.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-md space-y-4 hover:border-pink-400 transition-all"
              >
                {/* Header do Convidado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      {invite.head_name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      WhatsApp: {invite.phone} • {invite.confirmed_count} confirmados
                    </p>
                  </div>

                  {/* Badges de Status de Mídias Recebidas */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleTogglePhotoStatus(invite)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all ${
                        invite.surprise_photo_sent
                          ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border-pink-400'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      📸 {invite.surprise_photo_sent ? 'Foto Recebida' : 'Marcar Foto'}
                    </button>

                    <button
                      onClick={() => handleToggleVideoStatus(invite)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all ${
                        invite.surprise_video_sent
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-400'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      🎥 {invite.surprise_video_sent ? 'Vídeo Recebido' : 'Marcar Vídeo'}
                    </button>

                    <button
                      onClick={() => handleToggleTextStatus(invite)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all ${
                        invite.surprise_text_sent
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-400'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      ✍️ {invite.surprise_text_sent ? 'Recado Recebido' : 'Marcar Recado'}
                    </button>
                  </div>
                </div>

                {/* PAINEL DE 3 BOTÕES GRANDES DE DISPARO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Botão 1: Pedir Foto */}
                  <button
                    onClick={() => handleDispatchPhoto(invite)}
                    className="p-3.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-2 border-pink-500/40 rounded-2xl flex items-center justify-between font-extrabold text-xs transition-all active:scale-95 shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-pink-500 text-slate-950 rounded-xl">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block text-slate-900 dark:text-white font-black">Pedir Foto</span>
                        <span className="text-[10px] text-pink-600 dark:text-pink-300/80 font-semibold">Foto com a Aniversariante</span>
                      </div>
                    </div>
                    <Send className="w-4 h-4 text-pink-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Botão 2: Pedir Vídeo */}
                  <button
                    onClick={() => handleDispatchVideo(invite)}
                    className="p-3.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-2 border-purple-500/40 rounded-2xl flex items-center justify-between font-extrabold text-xs transition-all active:scale-95 shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-600 text-white rounded-xl">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block text-slate-900 dark:text-white font-black">Pedir Vídeo</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-300/80 font-semibold">
                          Vídeo ({videoOrientation === 'horizontal' ? 'Deitado' : videoOrientation === 'vertical' ? 'Em Pé' : 'Selfie'})
                        </span>
                      </div>
                    </div>
                    <Send className="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Botão 3: Pedir Recado */}
                  <button
                    onClick={() => handleDispatchText(invite)}
                    className="p-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between font-extrabold text-xs transition-all active:scale-95 shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                        <MessageSquareText className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block text-slate-900 dark:text-white font-black">Pedir Recado</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-300/80 font-semibold">Depoimento por Escrito</span>
                      </div>
                    </div>
                    <Send className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Campo de Salvar Recado / Descrição do Envio */}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Cole aqui o recado por escrito ou link do vídeo que o convidado enviou..."
                      defaultValue={invite.surprise_message || ''}
                      onBlur={(e) => handleSaveSurpriseMessage(invite, e.target.value)}
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold italic shrink-0">
                      {invite.surprise_message ? '✓ Recado Salvo' : 'Salva ao sair'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CONFIGURAR MENSAGENS DA CAMPANHA SECRETA (ÍCONE DE ENGRENAGEM) */}
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
              <p className="text-[10px] text-purple-400 italic">
                Use a tag <code className="font-mono bg-purple-900/50 px-1 py-0.5 rounded text-purple-200 font-bold">{'{orientacao}'}</code> para incluir a instrução selecionada acima.
              </p>
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
