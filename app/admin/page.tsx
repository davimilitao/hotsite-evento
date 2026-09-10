'use client';

import React, { useEffect, useState } from 'react';
import { getAllInvites, getAllTables, getEventConfig, seedFirestoreData, getAllPersons, saveEventConfig } from '@/lib/db';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Invite, Table, EventConfig, UserRole, Person } from '@/types';
import { GuestList } from '@/components/admin/GuestList';
import { TableManager } from '@/components/admin/TableManager';
import { SurpriseDashboard } from '@/components/admin/SurpriseDashboard';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { BirthdayOnboardingModal } from '@/components/admin/BirthdayOnboardingModal';
import { Users, Armchair, Settings, RefreshCw, Crown, Sparkles, Database, CheckCircle2, AlertTriangle, Gift, Lock, Send } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { LoginCard } from '@/components/auth/LoginCard';
import { AdminUserHeader } from '@/components/admin/AdminUserHeader';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'guests' | 'invites' | 'tables' | 'surprise' | 'settings'>('guests');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [showBirthdayOnboarding, setShowBirthdayOnboarding] = useState(false);

  // Sincroniza a role do usuário logado
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  // Exibe o Onboarding automaticamente quando a aniversariante logar pela primeira vez
  useEffect(() => {
    if (user?.role === 'birthday_person' || currentRole === 'birthday_person') {
      const isDone = typeof window !== 'undefined' ? localStorage.getItem('birthday_onboarding_done_v1') : 'true';
      if (!isDone) {
        setShowBirthdayOnboarding(true);
      }
    }
  }, [user, currentRole]);

  const handleSaveOnboarding = async (updatedConfig: EventConfig) => {
    await saveEventConfig(updatedConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('birthday_onboarding_done_v1', 'true');
    }
    await loadAll();
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [invitesData, tablesData, configData, personsData] = await Promise.all([
        getAllInvites(),
        getAllTables(),
        getEventConfig(),
        getAllPersons(),
      ]);

      setInvites(invitesData);
      setTables(tablesData);
      setConfig(configData);
      setPersons(personsData);
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

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'birthday_person') {
      setShowBirthdayOnboarding(true);
    }
  };

  // Se a aniversariante estiver na aba surpresa ou um não-admin na aba de configurações, força redirecionamento para convidados
  useEffect(() => {
    if (currentRole === 'birthday_person' && activeTab === 'surprise') {
      setActiveTab('guests');
    }
    if (currentRole !== 'admin' && activeTab === 'settings') {
      setActiveTab('guests');
    }
  }, [currentRole, activeTab]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm font-bold text-slate-400">Verificando autenticação Google...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        {!isFirebaseConfigured && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Local (Demo):</strong> Variáveis do Firebase não detectadas. O login funcionará em Modo de Desenvolvimento com expiração de 24h.
            </span>
          </div>
        )}
        <LoginCard />
      </main>
    );
  }

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

      {/* Header Unificado Responsivo do Admin */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 pb-2 space-y-3">
          {/* Header do Usuário Logado & Ações do Sistema */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1">
              <AdminUserHeader currentRole={currentRole} onRoleChange={handleRoleChange} />
            </div>

            {/* Ações de Dados (Atualizar + Onboarding Aniversariante) */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              {(currentRole === 'birthday_person' || user?.role === 'birthday_person') && (
                <button
                  onClick={() => setShowBirthdayOnboarding(true)}
                  className="min-h-[40px] px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Revisar e alterar os dados da festa"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Revisar Dados da Festa</span>
                </button>
              )}

              <button
                onClick={loadAll}
                className="min-h-[40px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Atualizar Dados"
              >
                <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">Atualizar</span>
              </button>
            </div>
          </div>

          {/* Notificação Toast de Seed */}
          {seedSuccess && (
            <div className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl text-center text-xs font-black flex items-center justify-center gap-2 animate-fade-in shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dados de Fernanda Seppi atualizados no Firestore!</span>
            </div>
          )}

          {/* Abas Principais Responsivas em Pílulas com Scroll Suave */}
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pt-1 pb-1">
            <button
              onClick={() => setActiveTab('guests')}
              className={`min-h-[42px] px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'guests'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Lista de Convidados</span>
            </button>

            <button
              onClick={() => setActiveTab('invites')}
              className={`min-h-[42px] px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'invites'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Convites & Confirmações</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`min-h-[42px] px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/40'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Armchair className="w-4 h-4" />
              <span>Gestão de Mesas</span>
            </button>

            {/* ABA HOMENAGEM SURPRESA */}
            {currentRole !== 'birthday_person' ? (
              <button
                onClick={() => setActiveTab('surprise')}
                className={`min-h-[42px] px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'surprise'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40'
                    : 'bg-slate-950/80 text-pink-400/80 hover:text-pink-200 hover:bg-slate-800'
                }`}
              >
                <Gift className="w-4 h-4 text-pink-400" />
                <span>Homenagem Surpresa</span>
              </button>
            ) : (
              <div className="min-h-[42px] px-3.5 py-2 text-xs text-slate-600 flex items-center gap-1.5 cursor-not-allowed opacity-50 bg-slate-950/40 rounded-xl">
                <Lock className="w-3.5 h-3.5" /> <span className="italic">Homenagem (Restrito)</span>
              </div>
            )}

            {/* ABA CONFIGURAÇÕES (EXCLUSIVA ADMIN GERAL) */}
            {currentRole === 'admin' ? (
              <button
                onClick={() => setActiveTab('settings')}
                className={`min-h-[42px] px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </button>
            ) : (
              <div className="min-h-[42px] px-3.5 py-2 text-xs text-slate-600 flex items-center gap-1.5 cursor-not-allowed opacity-50 bg-slate-950/40 rounded-xl">
                <Lock className="w-3.5 h-3.5" /> <span className="italic">Configurações (Restrito)</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo da Aba Ativa */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {loading && persons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-400">Carregando painel de gestão...</p>
          </div>
        ) : (
          <>
            {(activeTab === 'guests' || activeTab === 'invites') && config && (
              <GuestList
                invites={invites}
                tables={tables}
                persons={persons}
                config={config}
                activeTab={activeTab === 'guests' ? 'persons' : 'invites'}
                setActiveTab={(tab) => setActiveTab(tab === 'persons' ? 'guests' : 'invites')}
                onRefresh={loadAll}
              />
            )}
            {activeTab === 'tables' && <TableManager tables={tables} invites={invites} persons={persons} onRefresh={loadAll} />}
            {activeTab === 'surprise' && currentRole !== 'birthday_person' && (
              <SurpriseDashboard invites={invites} onRefresh={loadAll} />
            )}
            {activeTab === 'settings' && currentRole === 'admin' && config && (
              <SettingsForm
                config={config}
                onRefresh={loadAll}
                onSeedDatabase={handleSeedDatabase}
                seeding={seeding}
              />
            )}
          </>
        )}
      </div>

      {/* Modal de Onboarding / Boas-Vindas da Aniversariante */}
      {config && (
        <BirthdayOnboardingModal
          isOpen={showBirthdayOnboarding}
          config={config}
          onClose={() => setShowBirthdayOnboarding(false)}
          onSave={handleSaveOnboarding}
        />
      )}
    </main>
  );
}

