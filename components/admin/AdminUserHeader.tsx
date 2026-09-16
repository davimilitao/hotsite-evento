'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { LogOut, Clock, Crown, Sparkles, UserCheck, ShieldCheck, User, RefreshCw } from 'lucide-react';

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

  if (!user) return null;

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
    switchRole(role);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5 sm:space-y-3 w-full">
      {/* Linha Superior: Perfil + Ações de Gestão (Revisar, Atualizar, Sessão, Sair) */}
      <div className="flex items-center justify-between gap-2">
        {/* Perfil do Usuário */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-amber-400/80 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" title="Sessão Ativa" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[260px]">
              {user.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-amber-400 uppercase tracking-wide truncate">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              {currentRole === 'admin'
                ? 'Admin Geral'
                : currentRole === 'birthday_person'
                ? (user.authenticatedRole === 'admin' ? 'Aniversariante (Impersonar)' : 'Aniversariante')
                : (user.authenticatedRole === 'admin' ? 'Assessoria (Impersonar)' : 'Assessoria')}
            </span>
          </div>
        </div>

        {/* Ações de Gestão & Sessão Unificadas */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {(currentRole === 'birthday_person' || user.role === 'birthday_person') && onOpenOnboarding && (
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-[11px] sm:text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Revisar e alterar os dados da festa"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Revisar Dados</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold text-[11px] sm:text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 shrink-0 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Atualizar</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{sessionTimeLeft || '24h'}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-[11px] sm:text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Encerrar Sessão"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Linha Inferior: Seletor de Perfil Segmentado (Disponível Apenas para Admin Geral) */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs w-full overflow-x-auto scrollbar-none">
        {[
          { id: 'admin', label: 'Admin Geral', icon: Crown },
          { id: 'birthday_person', label: 'Aniversariante', icon: Sparkles },
          { id: 'assessor', label: 'Cerimonial / Assessora', icon: UserCheck },
        ]
          .filter((role) => user.authenticatedRole === 'admin' || user.role === 'admin' || role.id === user.role)
          .map((role) => {
            const Icon = role.icon;
            const isSelected = currentRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id as UserRole)}
                className={`flex-1 min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{role.label}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
