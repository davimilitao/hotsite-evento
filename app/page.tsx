'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DemoModal } from '@/components/landing/DemoModal';
import {
  Crown,
  Sparkles,
  ArrowRight,
  Calendar,
  MessageCircle,
  Smartphone,
  Clock,
  Armchair,
  Gift,
  FileSpreadsheet,
  Paintbrush,
  ShieldCheck,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header Comercial Profissional */}
      <header className="border-b border-slate-800/80 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo da Marca Festify */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-xl shadow-lg group-hover:scale-105 transition-transform">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1 font-serif">
                Festify <Sparkles className="w-4 h-4 text-amber-400" />
              </span>
              <span className="text-[10px] text-purple-400 font-mono tracking-widest uppercase -mt-1">
                Hotsites & Eventos
              </span>
            </div>
          </Link>

          {/* Links de Navegação */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#recursos" className="hover:text-purple-400 transition-colors">
              Recursos
            </a>
            <a href="#como-funciona" className="hover:text-purple-400 transition-colors">
              Como Funciona
            </a>
            <a href="#diferenciais" className="hover:text-purple-400 transition-colors">
              Diferenciais
            </a>
          </nav>

          {/* CTAs do Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Agendar uma Apresentação</span>
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Acessar Painel do Anfitrião</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Glows de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 text-purple-300 rounded-full text-xs font-extrabold border border-purple-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" /> A Plataforma Inteligente de Hotsites & Confirmação de Presença
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] font-serif">
            Transforme a Confirmação da sua Festa em uma{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Experiência Inesquecível
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
            Hotsites elegantes no tom do seu convite, confirmações simples e diretas pelo WhatsApp sem necessidade de aplicativo, controle de mesas e homenagens surpresa para encantar seus convidados.
          </p>

          {/* CTAs Principais da Hero */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/admin"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Crown className="w-5 h-5" />
              <span>Acessar Painel do Anfitrião</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-sm rounded-2xl border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>Agendar uma Apresentação</span>
            </button>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona em 3 Passos */}
      <section id="como-funciona" className="py-16 px-4 sm:px-6 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              COMO FUNCIONA A JORNADA
            </h2>
            <h3 className="text-3xl font-black text-white font-serif">Simplicidade para você, encanto para o convidado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Paintbrush className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">1. Personalize o Site com o Estilo da Festa</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ajuste as cores, fotos e detalhes do site em um painel simples e intuitivo para combinar perfeitamente com o convite e a decoração do seu evento.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">2. Envie Convites Direto pelo WhatsApp</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seu convidado abre o link e confirma a presença no celular em segundos, de forma leve e sem precisar baixar aplicativo nem criar senha.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Armchair className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">3. Organize Mesas e Gere a Lista Oficial</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tenha o controle total de quem confirmou, defina onde cada família vai sentar e gere a lista oficial para o buffet com apenas um clique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Recursos Premium */}
      <section id="recursos" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              DIFERENCIAIS EXCLUSIVOS
            </h2>
            <h3 className="text-3xl font-black text-white font-serif">Tudo o que sua festa precisa em um só lugar</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Smartphone className="w-6 h-6 text-purple-400" />
              <h4 className="font-extrabold text-base text-white">Confirmação Rápida no Celular</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seus convidados respondem com um toque no celular, informando acompanhantes e restrições alimentares de forma simples.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Clock className="w-6 h-6 text-amber-400" />
              <h4 className="font-extrabold text-base text-white">Prazos & Lista de Espera Inteligente</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina datas limites para respostas e libere vagas automaticamente para novos convidados caso alguém não possa ir.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Armchair className="w-6 h-6 text-pink-400" />
              <h4 className="font-extrabold text-base text-white">Organização Visual de Mesas</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina onde cada família vai sentar no salão e mostre a mesa reservada direto no convite digital do convidado.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Gift className="w-6 h-6 text-purple-400" />
              <h4 className="font-extrabold text-base text-white">Mural Secreto de Homenagens</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Colete fotos e recados carinhosos dos convidados em segredo para emocionar a aniversariante no telão da festa.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <h4 className="font-extrabold text-base text-white">Relatórios Prontos para o Buffet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Baixe a lista completa de confirmados com a contagem de adultos, crianças e alergias com apenas um clique.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Lock className="w-6 h-6 text-sky-400" />
              <h4 className="font-extrabold text-base text-white">Painel Seguro para Toda a Equipe</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acessos simplificados para anfitriões, assessores e cerimonialistas acompanharem a organização da festa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Profissional */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <Crown className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm font-serif">Festify</span>
            <span>• Hotsites & Gestão Inteligente de Festas</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsDemoModalOpen(true)} className="hover:text-white transition-colors">
              Agendar Apresentação
            </button>
            <Link href="/admin" className="hover:text-white transition-colors">
              Painel do Anfitrião
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>© {new Date().getFullYear()} Festify. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

      {/* Modal de Agendamento Comercial */}
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}
