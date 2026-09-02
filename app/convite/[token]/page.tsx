'use client';

import React, { useEffect, useState, use } from 'react';
import { getInviteByToken, getEventConfig, getAllTables } from '@/lib/db';
import { Invite, EventConfig, Table } from '@/types';
import { HeaderHero } from '@/components/guest/HeaderHero';
import { EventLocationCard } from '@/components/guest/EventLocationCard';
import { RSVPForm } from '@/components/guest/RSVPForm';
import { SeatCard } from '@/components/guest/SeatCard';
import { GiftSection } from '@/components/guest/GiftSection';
import { MobileBottomNav, ActiveTabType } from '@/components/guest/MobileBottomNav';
import { RSVPFeedbackModal } from '@/components/guest/RSVPFeedbackModal';
import { Sparkles, AlertCircle, RefreshCw, Navigation } from 'lucide-react';

interface ConvitePageProps {
  params: Promise<{ token: string }>;
}

export default function ConvitePage({ params }: ConvitePageProps) {
  const { token } = use(params);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-400">Carregando seu convite especial...</p>
      </div>
    );
  }

  if (!invite || !config) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="p-4 bg-rose-500/20 text-rose-400 rounded-full inline-block">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Convite Não Encontrado</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Não encontramos um convite válido para este link. Verifique se a URL foi copiada corretamente pelo WhatsApp.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Ir para a Página Inicial
          </a>
        </div>
      </div>
    );
  }

  const assignedTable = tables.find((t) => t.id === invite.table_id);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 sm:pb-16">
      {/* Container Principal Mobile Centralizado */}
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header Hero com Arte Floral & Contagem Regressiva */}
        <HeaderHero config={config} invite={invite} />

        {/* Visualização por Abas no Mobile / Visão Completa no Desktop */}
        <div className="px-4 space-y-6">
          {/* ABA 1: RSVP & Formulário */}
          <div className={`${activeTab === 'rsvp' ? 'block' : 'hidden sm:block'} space-y-6 transition-all duration-300`}>
            <RSVPForm
              invite={invite}
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

        {/* Rodapé Fofo */}
        <footer className="text-center text-xs text-slate-500 pt-8 pb-4 px-4">
          <p className="flex items-center justify-center gap-1">
            Feito com carinho para <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-slate-300">{config.birthday_person}</strong>
          </p>
        </footer>
      </div>

      {/* Barra de Navegação Flutuante Inferior para Mobile */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        hasAssignedTable={Boolean(invite.table_id && invite.status === 'confirmed')}
      />

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
