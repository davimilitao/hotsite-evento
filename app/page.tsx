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
  CheckCircle2,
  Users,
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
            <Sparkles className="w-4 h-4 text-amber-400" /> A Plataforma Premium de Hotsites & RSVP Inteligente
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] font-serif">
            Transforme a Confirmação da sua Festa em uma{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Experiência Inesquecível
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
            Hotsites elegantes no tom exato do seu convite impresso, links de confirmação sem atrito no WhatsApp sem necessidade de app ou login, gestão por lotes de convites, mapa de mesas interativo e homenagens surpresa.
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

          {/* Links Rápidos de Demonstração do Hotsite de Convidado */}
          <div className="pt-8 border-t border-slate-800/80 max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Experimentar Hotsite do Convidado (Exemplo Real):
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/convite/carlos-silva-8a2"
                target="_blank"
                className="flex-1 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left text-xs font-bold text-slate-200 flex items-center justify-between transition-all group"
              >
                <span>/convite/carlos-silva-8a2 (Carlos Silva)</span>
                <ExternalLink className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/convite/fernanda-lima-3k9"
                target="_blank"
                className="flex-1 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-2xl text-left text-xs font-bold text-slate-200 flex items-center justify-between transition-all group"
              >
                <span>/convite/fernanda-lima-3k9 (Fernanda Lima)</span>
                <ExternalLink className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
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
              <h4 className="text-lg font-bold text-white">1. Crie & Personalize o Tema</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilize nosso customizador estilo WordPress para configurar as cores exatas do seu convite de papel (lavanda, marfim, dourado) e inserir a aquarela floral do evento.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">2. Dispare Links pelo WhatsApp</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Envie o link exclusivo de 1-clique para cada família pelo WhatsApp. O convidado clica e responde instantaneamente pelo celular, sem precisar criar conta ou baixar app.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Armchair className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">3. Gerencie Mesas & Exportação</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acompanhe confirmações em tempo real, gerencie a alocação visual de mesas e exporte a lista pronta em Excel/CSV diretamente para a equipe do buffet.
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
              RECURSOS EXCLUSIVOS
            </h2>
            <h3 className="text-3xl font-black text-white font-serif">Tudo o que sua festa precisa em um só lugar</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Smartphone className="w-6 h-6 text-purple-400" />
              <h4 className="font-extrabold text-base text-white">RSVP Sem Atrito</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirmação de presencia simples e rápida com suporte a restrições alimentares e acompanhantes.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Clock className="w-6 h-6 text-amber-400" />
              <h4 className="font-extrabold text-base text-white">Gestão por Lotes & Prazos</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina prazos por lotes de convidados. Se a vaga expirar, promova a lista de espera em 1-clique.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Armchair className="w-6 h-6 text-pink-400" />
              <h4 className="font-extrabold text-base text-white">Mapa de Mesas Interativo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atribuição visual das famílias às mesas com mapa interativo destacado no celular do convidado.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Gift className="w-6 h-6 text-purple-400" />
              <h4 className="font-extrabold text-base text-white">Homenagem Surpresa</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dashboard secreto para cerimonialistas coletarem fotos e depoimentos para o telão (oculto da aniversariante).
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <h4 className="font-extrabold text-base text-white">Exportação para o Buffet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere planilhas em Excel/CSV em 1-clique com contagem de adultos, crianças e alergias.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Lock className="w-6 h-6 text-sky-400" />
              <h4 className="font-extrabold text-base text-white">Níveis de Acesso (RBAC)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permissões separadas para o Admin de Sistema, Aniversariante e Assessor de Festa.
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
