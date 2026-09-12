'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DemoModal } from '@/components/landing/DemoModal';
import { PrivacyTermsModal } from '@/components/ui/PrivacyTermsModal';
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
  Eye,
  Mail,
  Building2,
  Users,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

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
                Plataforma SaaS de Hotsites & Eventos
              </span>
            </div>
          </Link>

          {/* Links de Navegação */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#recursos" className="hover:text-purple-400 transition-colors">
              Recursos Premium
            </a>
            <a href="#como-funciona" className="hover:text-purple-400 transition-colors">
              Como Funciona
            </a>
            <a href="#lgpd-seguranca" className="hover:text-purple-400 transition-colors">
              LGPD & Segurança
            </a>
          </nav>

          {/* CTAs do Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Agendar Apresentação</span>
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Acessar Painel Admin</span>
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
            <Sparkles className="w-4 h-4 text-amber-400" /> Hotsites Personalizados + RSVP Inteligente pelo WhatsApp
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] font-serif">
            A Plataforma Completa de Gestão de Convidados que{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Valoriza o Seu Evento
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
            Aumente a taxa de confirmação com disparo direto no WhatsApp, rastreamento de leitura em tempo real 👁️, gestão de mesas 1:1, e-mails automáticos de notificação e vitrine do buffet integrada.
          </p>

          {/* CTAs Principais da Hero */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/admin"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Crown className="w-5 h-5" />
              <span>Experimentar o Painel de Controle</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-sm rounded-2xl border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>Contratar para seu Evento</span>
            </button>
          </div>

          {/* Badges de Confiança */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Em Conformidade com a LGPD
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" /> Alertas Automáticos via Resend
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Sem Instalação de Apps
            </div>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona em 3 Passos */}
      <section id="como-funciona" className="py-16 px-4 sm:px-6 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              JORNADA DO EVENTO
            </h2>
            <h3 className="text-3xl font-black text-white font-serif">Controle absoluto em 3 etapas simples</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Paintbrush className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">1. Crie o Hotsite e Vitrine do Buffet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Personalize cores, fontes, fotos do espaço, mapa e vídeos do YouTube em minutos no painel admin intuitivo.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">2. Disparo Direto pelo WhatsApp</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Envie o link exclusivo de cada família ou desmembre integrantes individualmente com mensagens personalizadas.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-4 relative">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                <Armchair className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">3. Aloque Mesas e Baixe o Relatório</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina os assentos reservas, acompanhe aberturas em tempo real e exporte a lista oficial de presença para o buffet.
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
              RECURSOS DE NÍVEL EMPRESARIAL
            </h2>
            <h3 className="text-3xl font-black text-white font-serif">Ferramentas desenhadas para Anfitriões, Assessores e Produtores</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: WhatsApp Inteligente */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Smartphone className="w-6 h-6 text-purple-400" />
              <h4 className="font-extrabold text-base text-white">Disparo Inteligente & Desmembramento</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispare para famílias ou envie convites diretos individualizados para integrantes mantendo a mesma mesa e grupo.
              </p>
            </div>

            {/* Card 2: Tracking de Acessos */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Eye className="w-6 h-6 text-amber-400" />
              <h4 className="font-extrabold text-base text-white">Rastreamento de Visualizações 👁️</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Saiba exatamente quando o convidado abriu o convite e quantas vezes acessou o hotsite antes de responder.
              </p>
            </div>

            {/* Card 3: Notificações Resend */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Mail className="w-6 h-6 text-pink-400" />
              <h4 className="font-extrabold text-base text-white">Notificações por E-mail (Host + Admin CC)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receba alertas instantâneos de confirmações (SIM), recusas com mensagens carinhosas (NÃO) e pedidos de prazo.
              </p>
            </div>

            {/* Card 4: Organização de Mesas */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Armchair className="w-6 h-6 text-emerald-400" />
              <h4 className="font-extrabold text-base text-white">Gestão 1:1 de Mesas e Assentos</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina o número exato de assentos por mesa e mostre o lugar reservado no convite digital do convidado.
              </p>
            </div>

            {/* Card 5: Vitrine do Buffet */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Building2 className="w-6 h-6 text-sky-400" />
              <h4 className="font-extrabold text-base text-white">Vitrine do Buffet ("Hotsite no Hotsite")</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apresente fotos em alta definição do salão, vídeo de tour no YouTube, mapa Waze/Google e detalhes de estacionamento.
              </p>
            </div>

            {/* Card 6: Filtros de Inércia */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
              <Clock className="w-6 h-6 text-rose-400" />
              <h4 className="font-extrabold text-base text-white">Filtros de Inércia & Follow-up</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filtros automáticos no painel para convites ⚠️ 48h Sem Abrir e 👁️ Aberto +24h Sem Resposta para cobrança rápida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção LGPD & Segurança */}
      <section id="lgpd-seguranca" className="py-16 px-4 sm:px-6 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-purple-950/60 to-slate-900 p-8 sm:p-10 rounded-3xl border border-purple-500/30 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white font-serif">Conformidade LGPD & Zero SPAM</h3>
              <p className="text-xs text-slate-400">Tranquilidade jurídica e segurança de dados para seu evento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Propaganda
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Os telefones dos convidados são utilizados estritamente pela anfitriã para gestão de presença da festa.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Dados Financeiros
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Não solicitamos nem armazenamos números de cartão de crédito ou dados bancários de convidados.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Art. 18 LGPD
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Transparência total e direito de solicitação de exclusão de dados a qualquer momento.
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
            <span>• Hotsites & Gestão Inteligente de Eventos</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsDemoModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
              Agendar Apresentação
            </button>
            <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
              Termos de Uso & LGPD
            </button>
            <Link href="/admin" className="hover:text-white transition-colors">
              Painel Admin
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>© {new Date().getFullYear()} Festify SaaS. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

      {/* Modal de Agendamento Comercial */}
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* Modal de Termos de Uso e Privacidade LGPD */}
      <PrivacyTermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
    </div>
  );
}
