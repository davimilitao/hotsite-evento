'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, MessageCircle, Armchair, DoorOpen, ExternalLink, QrCode } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-8 pt-8 text-center">
        {/* Badge Hero */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-purple-500/30 px-4 py-2 rounded-full text-xs font-bold text-amber-300 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" /> Sistema de Hotsite & Gestão de Festa de Aniversário
        </div>

        {/* Título Principal */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 tracking-tight">
            Aniversário do Lucas (30 Anos) 🎂
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            100 convidados, confirmação de presença sem atrito via WhatsApp, alocação de mesas e modo portaria em tempo real.
          </p>
        </div>

        {/* Ações Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
          <Link
            href="/admin"
            className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-3xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Crown className="w-5 h-5 text-amber-300" />
            <span>Acessar Painel do Anfitrião</span>
          </Link>

          <Link
            href="/convite/carlos-silva-8a2"
            className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 rounded-3xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
          >
            <ExternalLink className="w-5 h-5 text-amber-400" />
            <span>Demonstração de Convite</span>
          </Link>
        </div>

        {/* Caixas de Destaques da Solução */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Links WhatsApp Sem Atrito</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Links com token único `/convite/[token]`. O Convidado não precisa baixar app nem fazer login.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl w-fit">
              <Armchair className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Planta Baixa & Mesas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atribuição visual das famílias às mesas com mapa interativo do salão destacado para o convidado.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl w-fit">
              <DoorOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Modo Portaria (Check-in)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recepção rápida no celular no dia do evento com botão de 1 toque e contagem em tempo real.
            </p>
          </div>
        </div>

        {/* Tokens de Exemplo */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-left space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
            Tokens de Demonstração Rápidos:
          </h4>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <Link
              href="/convite/carlos-silva-8a2"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors"
            >
              /convite/carlos-silva-8a2 (Carlos Silva - 4 Vagas)
            </Link>
            <Link
              href="/convite/fernanda-lima-3k9"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors"
            >
              /convite/fernanda-lima-3k9 (Fernanda Lima - 2 Vagas)
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-600 pt-8">
        Hotsite de Aniversário • Next.js + Tailwind CSS + Firebase + Vercel
      </footer>
    </main>
  );
}
