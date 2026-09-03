'use client';

import React, { useEffect, useState } from 'react';
import { getAllInvites, getAllTables, getEventConfig, seedFirestoreData } from '@/lib/db';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Invite, Table, EventConfig, UserRole } from '@/types';
import { GuestList } from '@/components/admin/GuestList';
import { TableManager } from '@/components/admin/TableManager';
import { SurpriseDashboard } from '@/components/admin/SurpriseDashboard';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { Users, Armchair, Settings, RefreshCw, Crown, Sparkles, Database, CheckCircle2, AlertTriangle, Gift, UserCheck, Lock } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'guests' | 'tables' | 'surprise' | 'settings'>('guests');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin'); // 'admin' | 'birthday_person' | 'assessor'
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
      if (isFirebaseConfigured) {
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 4000);
      } else {
        alert('As variáveis de ambiente foram atualizadas no seu LocalStorage.');
      }
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

  // Se a aniversariante estiver logada e estiver na aba surpresa, força redirecionamento para convidados
  useEffect(() => {
    if (currentRole === 'birthday_person' && activeTab === 'surprise') {
      setActiveTab('guests');
    }
  }, [currentRole, activeTab]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Banner de Aviso de Configuração do Firebase */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Modo Local (Demo):</strong> O banco Firestore ainda não foi detectado no navegador. Adicione o prefixo <code className="bg-amber-950 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_</code> nas variáveis de ambiente da Vercel.
          </span>
        </div>
      )}

      {/* Topo Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-xl shadow-lg">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                Painel de Gestão do Evento <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400">
                {config ? config.title : 'Fernanda Seppi - 40 Anos'}
              </p>
            </div>
          </div>

          {/* Seletor de Nível de Acesso / Perfil Logado */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 pl-2">Acesso Logado:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-slate-900 text-amber-300 font-extrabold text-xs px-2.5 py-1 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="admin">👑 Admin de Sistema</option>
                <option value="birthday_person">🌸 Aniversariante (Fernanda)</option>
                <option value="assessor">📋 Assessor de Festa</option>
              </select>
            </div>

            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Popula os dados reais com 1 clique"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{seeding ? 'Carregando...' : '⚡ Resetar Dados'}</span>
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

        {/* Notificação Toast de Seed */}
        {seedSuccess && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dados de Fernanda Seppi atualizados no Firestore!</span>
          </div>
        )}

        {/* Abas Principais com Regra de Ocultação Secreta para a Aniversariante */}
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
            <span>📋 Convidados & Disparos</span>
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

          {/* ABA HOMENAGEM SURPRESA - OCULTA PARA A ANIVERSARIANTE */}
          {currentRole !== 'birthday_person' ? (
            <button
              onClick={() => setActiveTab('surprise')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'surprise'
                  ? 'border-pink-500 text-pink-400 bg-pink-500/10'
                  : 'border-transparent text-pink-400/70 hover:text-pink-300'
              }`}
            >
              <Gift className="w-4 h-4 text-pink-400" />
              <span>🎁 Homenagem Surpresa (Secreto)</span>
            </button>
          ) : (
            <div className="px-4 py-3 text-xs text-slate-600 flex items-center gap-1 cursor-not-allowed opacity-40">
              <Lock className="w-3.5 h-3.5" /> <span className="italic">Recurso Restrito ao Cerimonial</span>
            </div>
          )}

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
            {activeTab === 'guests' && config && (
              <GuestList invites={invites} tables={tables} config={config} onRefresh={loadAll} />
            )}
            {activeTab === 'tables' && <TableManager tables={tables} invites={invites} onRefresh={loadAll} />}
            {activeTab === 'surprise' && currentRole !== 'birthday_person' && (
              <SurpriseDashboard invites={invites} onRefresh={loadAll} />
            )}
            {activeTab === 'settings' && config && <SettingsForm config={config} onRefresh={loadAll} />}
          </>
        )}
      </div>
    </main>
  );
}
