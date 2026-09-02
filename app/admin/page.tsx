'use client';

import React, { useEffect, useState } from 'react';
import { getAllInvites, getAllTables, getEventConfig, seedFirestoreData } from '@/lib/db';
import { Invite, Table, EventConfig } from '@/types';
import { GuestList } from '@/components/admin/GuestList';
import { TableManager } from '@/components/admin/TableManager';
import { CheckinScanner } from '@/components/admin/CheckinScanner';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { Users, Armchair, DoorOpen, Settings, RefreshCw, Crown, Sparkles, Database, CheckCircle2 } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'guests' | 'tables' | 'checkin' | 'settings'>('guests');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [invitesData, tablesData, configData] = await Promise.all([
        getAllInvites(),
        getAllTables(),
        getEventConfig(),
      ]);

      setInvites(invitesData);
      setTables(tablesData);
      setConfig(configData);
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await seedFirestoreData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
      await loadAll();
    } catch (err) {
      console.error('Erro ao popular Firestore:', err);
      alert('Erro ao inicializar banco de dados.');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Topo Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-xl shadow-lg">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                Painel do Anfitrião <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400">
                {config ? config.title : 'Gestão de Convidados & Evento'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Popula o Firestore com coleções e dados de teste com 1 clique"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{seeding ? 'Populando...' : '⚡ Inicializar Firestore'}</span>
            </button>

            <button
              onClick={loadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Notificação Toast de Seed com Sucesso */}
        {seedSuccess && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Coleções `invites`, `tables` e `event_config` criadas com sucesso no seu Firestore!</span>
          </div>
        )}

        {/* Abas Principais de Navegação */}
        <div className="max-w-6xl mx-auto px-4 flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'guests'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>📋 Convidados & WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tables'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Armchair className="w-4 h-4" />
            <span>🪑 Gestão de Mesas</span>
          </button>

          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'checkin'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>🚪 Portaria / Check-in</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ Configurações</span>
          </button>
        </div>
      </header>

      {/* Conteúdo da Aba Ativa */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {loading && invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-400">Carregando painel de gestão...</p>
          </div>
        ) : (
          <>
            {activeTab === 'guests' && <GuestList invites={invites} onRefresh={loadAll} />}
            {activeTab === 'tables' && <TableManager tables={tables} invites={invites} onRefresh={loadAll} />}
            {activeTab === 'checkin' && <CheckinScanner invites={invites} onRefresh={loadAll} />}
            {activeTab === 'settings' && config && <SettingsForm config={config} onRefresh={loadAll} />}
          </>
        )}
      </div>
    </main>
  );
}
