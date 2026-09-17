'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { LogOut, Clock, Crown, Sparkles, UserCheck, ShieldCheck, User, RefreshCw, Menu } from 'lucide-react';

interface AdminUserHeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onRefresh?: () => void;
  loading?: boolean;
  onOpenOnboarding?: () => void;
}

export function AdminUserHeader({
  currentRole,
  onRoleChange,
  onRefresh,
  loading,
  onOpenOnboarding,
}: AdminUserHeaderProps) {
  const { user, logout, sessionTimeLeft, switchRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (!user) return null;

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
    switchRole(role);
    setIsMenuOpen(false);
  };

  const roles = [
    { id: 'admin', label: 'Admin Geral', icon: Crown },
    { id: 'birthday_person', label: 'Aniversariante', icon: Sparkles },
    { id: 'assessor', label: 'Cerimonial / Assessora', icon: UserCheck },
  ].filter((role) => user.authenticatedRole === 'admin' || user.role === 'admin' || role.id === user.role);

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between relative w-full">
      {/* Perfil do Usuário */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover border border-amber-400/80 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" title="Sessão Ativa" />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-[300px]">
            {user.name}
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 uppercase tracking-wide truncate">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            {currentRole === 'admin'
              ? 'Admin Geral'
              : currentRole === 'birthday_person'
              ? (user.authenticatedRole === 'admin' ? 'Aniversariante (Impersonar)' : 'Aniversariante')
              : (user.authenticatedRole === 'admin' ? 'Assessoria (Impersonar)' : 'Assessoria')}
          </span>
        </div>
      </div>

      {/* Hamburger Toggle */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{sessionTimeLeft || '24h'}</span>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title="Menu de Opções"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-fade-in divide-y divide-slate-800">
            {/* Ações Primárias */}
            <div className="px-2 py-1 space-y-1">
              {(currentRole === 'birthday_person' || user.role === 'birthday_person') && onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> Revisar Dados da Festa
                </button>
              )}
              {onRefresh && (
                <button
                  onClick={() => {
                    onRefresh();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} /> Atualizar Dados
                </button>
              )}
            </div>

            {/* Alternar Perfil */}
            {roles.length > 1 && (
              <div className="px-2 py-2 space-y-1">
                <p className="px-3 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alternar Visão</p>
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = currentRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id as UserRole)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                        <span>{role.label}</span>
                      </div>
                      {isSelected && <div className="w-1.5 h-1.5 bg-amber-300 rounded-full" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sair */}
            <div className="px-2 py-1">
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sair do Sistema
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
