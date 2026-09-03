'use client';

import React, { useState } from 'react';
import { Invite } from '@/types';
import { saveInvite } from '@/lib/db';
import { buildSurpriseWhatsAppLink } from '@/lib/utils';
import { Sparkles, MessageCircle, CheckCircle2, Image as ImageIcon, Search, ShieldCheck, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SurpriseDashboardProps {
  invites: Invite[];
  onRefresh: () => void;
}

export function SurpriseDashboard({ invites, onRefresh }: SurpriseDashboardProps) {
  const [search, setSearch] = useState('');
  const [messageNote, setMessageNote] = useState<{ [id: string]: string }>({});

  const confirmedInvites = invites.filter((i) => i.status === 'confirmed');
  const photosReceivedCount = confirmedInvites.filter((i) => i.surprise_sent).length;

  const filtered = confirmedInvites.filter(
    (i) =>
      i.head_name.toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search)
  );

  const handleToggleSurpriseSent = async (invite: Invite) => {
    const nextState = !invite.surprise_sent;
    await saveInvite({
      ...invite,
      surprise_sent: nextState,
    });

    if (nextState) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    onRefresh();
  };

  const handleSaveMessage = async (invite: Invite) => {
    const note = messageNote[invite.id] || invite.surprise_message || '';
    await saveInvite({
      ...invite,
      surprise_message: note,
      surprise_sent: true,
    });
    alert('Recuso salvo para o telão surpresa!');
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner Secreto de Campanha */}
      <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-amber-900 text-white p-6 rounded-3xl shadow-xl border border-pink-500/30 space-y-3 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold">
          <Sparkles className="w-4 h-4 text-amber-300" /> SEGREDO DA FESTA • Visível apenas para Assessor & Admin
        </div>

        <h2 className="text-2xl font-black text-white">🎁 Coleta de Fotos & Homenagem Surpresa</h2>
        <p className="text-xs text-pink-100 max-w-2xl leading-relaxed">
          Dispare mensagens secretas no WhatsApp dos convidados solicitando <strong>fotos marcantes com a Fernanda Seppi</strong> e recados carinhosos para a exibição no mural do telão!
        </p>

        {/* Contador de Fotos Recebidas */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-pink-500/30 flex items-center justify-around max-w-md">
          <div className="text-center">
            <span className="block text-3xl font-black text-amber-400">{photosReceivedCount}</span>
            <span className="text-[10px] font-bold text-pink-200 uppercase">Fotos/Recados Recebidos</span>
          </div>

          <div className="h-8 w-px bg-pink-500/30" />

          <div className="text-center">
            <span className="block text-3xl font-black text-slate-200">{confirmedInvites.length}</span>
            <span className="text-[10px] font-bold text-pink-200 uppercase">Convidados Confirmados</span>
          </div>
        </div>
      </div>

      {/* Busca Rápida */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar convidado para coletar foto surpresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Lista de Convidados para Campanha Surpresa */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
            Nenhum convidado confirmado encontrado.
          </div>
        ) : (
          filtered.map((invite) => {
            const waSurpriseUrl = buildSurpriseWhatsAppLink(invite.head_name, invite.phone, invite.id);

            return (
              <div
                key={invite.id}
                className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${
                  invite.surprise_sent
                    ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-400/60 shadow-md'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{invite.head_name}</h4>
                      {invite.surprise_sent && (
                        <span className="bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> Foto/Recado Recebido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Telefone: {invite.phone}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão de Disparo Secreto no WhatsApp */}
                    <a
                      href={waSurpriseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                      title="Pedir foto surpresa pelo WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Pedir Foto Surpresa</span>
                    </a>

                    {/* Check de Recebido */}
                    <button
                      onClick={() => handleToggleSurpriseSent(invite)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        invite.surprise_sent
                          ? 'bg-pink-600 text-white border-pink-500'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {invite.surprise_sent ? '✔ Foto Marcada' : 'Marcar Foto Recebida'}
                    </button>
                  </div>
                </div>

                {/* Recado / Descrição da Foto para o Telão */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <ImageIcon className="w-4 h-4 text-pink-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cole a mensagem/descrição da foto que o convidado enviou para o telão..."
                    value={messageNote[invite.id] ?? (invite.surprise_message || '')}
                    onChange={(e) => setMessageNote({ ...messageNote, [invite.id]: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <button
                    onClick={() => handleSaveMessage(invite)}
                    className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shrink-0 hover:bg-purple-700"
                  >
                    Salvar Recado
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
