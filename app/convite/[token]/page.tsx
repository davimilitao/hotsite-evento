'use client';

import React, { useEffect, useState, use } from 'react';
import { getInviteByToken, getEventConfig, getAllTables, getPersonsForInvite } from '@/lib/db';
import { Invite, EventConfig, Table, EventTheme, Person } from '@/types';
import { HeaderHero } from '@/components/guest/HeaderHero';
import { EventLocationCard } from '@/components/guest/EventLocationCard';
import { RSVPForm } from '@/components/guest/RSVPForm';
import { SeatCard } from '@/components/guest/SeatCard';
import { GiftSection } from '@/components/guest/GiftSection';
import { MobileBottomNav, ActiveTabType } from '@/components/guest/MobileBottomNav';
import { RSVPFeedbackModal } from '@/components/guest/RSVPFeedbackModal';
import { Footer } from '@/components/guest/Footer';
import { Sparkles, AlertCircle, RefreshCw, Crown, Calendar, CheckCircle2, MessageCircle } from 'lucide-react';

interface ConvitePageProps {
  params: Promise<{ token: string }>;
}

export default function ConvitePage({ params }: ConvitePageProps) {
  const { token } = use(params);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTabType>('rsvp');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inviteData, configData, tablesData] = await Promise.all([
        getInviteByToken(token),
        getEventConfig(),
        getAllTables(),
      ]);

      setInvite(inviteData);
      setConfig(configData);
      setTables(tablesData);

      if (inviteData) {
        const invitePersons = await getPersonsForInvite(inviteData);
        setAllPersons(invitePersons);
      }
    } catch (err) {
      console.error('Erro ao carregar convite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f0] text-[#2d2138] flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full space-y-4 animate-pulse">
          <div className="bg-white/80 h-52 rounded-3xl border border-[#c5a059]/30 flex flex-col items-center justify-center space-y-3 p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-[#6b4684] animate-spin" />
            </div>
            <div className="w-48 h-4 bg-purple-200/80 rounded-full" />
            <div className="w-32 h-3 bg-purple-100 rounded-full" />
          </div>
          <div className="bg-white/80 h-64 rounded-3xl border border-slate-200/60 p-6 space-y-4 shadow-sm">
            <div className="w-40 h-5 bg-slate-200 rounded-lg" />
            <div className="w-full h-12 bg-slate-100 rounded-xl" />
            <div className="w-full h-12 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!invite || !config) {
    const supportPhone = config?.support_phone || '11999998888';
    const whatsappSupportUrl = `https://wa.me/55${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tentei acessar meu convite pelo link "${token}", mas deu mensagem de convite não encontrado. Poderia me ajudar?`)}`;

    return (
      <div className="min-h-screen bg-[#faf6f0] text-[#2d2138] flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-[#c5a059]/40 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-full inline-block">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#6b4684]">Convite Não Encontrado</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Não encontramos um convite ativo correspondente a este link. Verifique se a URL no WhatsApp foi copiada por completo.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reportar Problema no WhatsApp</span>
            </a>

            <a
              href="/"
              className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Ir para a Página Inicial
            </a>
          </div>
        </div>
      </div>
    );
  }

  const assignedTable = tables.find((t) => t.id === invite.table_id);
  const theme: EventTheme = config.theme || {
    preset: 'custom',
    invite_mode: 'custom',
    primary_color: '#6b4684',
    accent_color: '#c5a059',
    bg_color: '#faf6f0',
    card_bg_color: '#ffffff',
    text_color: '#2d2138',
    font_family: 'sans',
  };

  // Verifica se o Card do Convite está Ativado (ON) ou Desativado (OFF)
  const isFullDigitalInviteEnabled = config.show_digital_invite !== false && theme.invite_mode !== 'off';

  return (
    <main
      className="min-h-screen font-sans pb-24 sm:pb-16 transition-colors duration-300"
      style={{
        backgroundColor: theme.bg_color || '#faf6f0',
        color: theme.text_color || '#2d2138',
        fontFamily: 'Plus Jakarta Sans, Montserrat, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Container Principal Mobile Centralizado */}
      <div className="max-w-lg mx-auto space-y-6">
        {/* CONDICIONAL: MÓDULO CONVITE DIGITAL ATIVADO (COMPLETO) VS MODO RSVP PURO (DESATIVADO) */}
        {isFullDigitalInviteEnabled ? (
          <>
            {/* Header Hero com Arte Impressa ou Card Customizado */}
            <HeaderHero config={config} invite={invite} />

            {/* Visualização por Abas no Mobile / Visão Completa no Desktop */}
            <div className="px-4 space-y-6">
              {/* ABA 1: RSVP & Formulário */}
              <div className={`${activeTab === 'rsvp' ? 'block' : 'hidden sm:block'} space-y-6 transition-all duration-300`}>
                <RSVPForm
                  invite={invite}
                  config={config}
                  allPersons={allPersons}
                  onUpdate={(updated) => setInvite(updated)}
                  onSubmittedFeedback={() => setShowFeedbackModal(true)}
                />
              </div>

              {/* ABA 2: Assento Reservado & Localização */}
              <div className={`${activeTab === 'location' ? 'block' : 'hidden sm:block'} space-y-6 transition-all duration-300`}>
                <SeatCard invite={invite} tables={tables} />
                <EventLocationCard config={config} />
              </div>

              {/* ABA 3: Guia de Presentes & Pix */}
              <div className={`${activeTab === 'gifts' ? 'block' : 'hidden sm:block'} space-y-6 transition-all duration-300`}>
                <GiftSection config={config} />
              </div>
            </div>
          </>
        ) : (
          /* MODO RSVP PURO (CONVITE DESATIVADO) - O CARD DO SAVE THE DATE DESAPARECE TOTALMENTE */
          <div className="px-4 pt-8 space-y-6 animate-fade-in">
            {/* Header Minimalista Direto */}
            <div className="text-center space-y-2 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-[#c5a059]/40 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#6b4684]/10 text-[#6b4684] rounded-full text-xs font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-[#c5a059]" /> Confirmação Direta de Presença
              </div>

              <h1 className="text-2xl font-black text-[#6b4684] tracking-tight">
                {config.title}
              </h1>

              <p className="text-xs text-slate-600 font-medium">
                Olá, <strong>{invite.head_name}</strong>! Por favor, informe abaixo se você e sua família poderão comparecer ao evento.
              </p>
            </div>

            {/* FORMULÁRIO DIRETO DE RSVP */}
            <RSVPForm
              invite={invite}
              config={config}
              allPersons={allPersons}
              onUpdate={(updated) => setInvite(updated)}
              onSubmittedFeedback={() => setShowFeedbackModal(true)}
            />

            {/* Assento Reservado se Já Confirmado */}
            {invite.status === 'confirmed' && (
              <SeatCard invite={invite} tables={tables} />
            )}
          </div>
        )}

        {/* Rodapé Configurável */}
        <Footer config={config} />
      </div>

      {/* Barra de Navegação Flutuante Inferior para Mobile (Apenas quando Convite estiver Ativado) */}
      {isFullDigitalInviteEnabled && (
        <MobileBottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          hasAssignedTable={Boolean(invite.table_id && invite.status === 'confirmed')}
        />
      )}

      {/* Modal Pop-up de Feedback Imediato Pós-RSVP */}
      <RSVPFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        invite={invite}
        assignedTable={assignedTable}
        onGoToLocation={() => setActiveTab('location')}
      />
    </main>
  );
}
