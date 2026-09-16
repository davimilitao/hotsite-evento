'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { LogOut, Clock, Crown, Sparkles, UserCheck, ShieldCheck, User } from 'lucide-react';

interface AdminUserHeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function AdminUserHeader({ currentRole, onRoleChange }: AdminUserHeaderProps) {
  const { user, logout, sessionTimeLeft, switchRole } = useAuth();

  if (!user) return null;

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
    switchRole(role);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-2 sm:p-3.5 shadow-xl space-y-2 sm:space-y-3">
      {/* Linha Superior: Perfil + Expiração 24h + Botão Sair */}
      <div className="flex items-center justify-between gap-2">
        {/* Perfil do Usuário */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-amber-400/80 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-slate-900" title="Sessão Ativa" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[220px]">
              {user.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-amber-400 uppercase tracking-wide truncate">
              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              {currentRole === 'admin'
                ? 'Admin Geral'
                : currentRole === 'birthday_person'
                ? (user.authenticatedRole === 'admin' ? 'Aniversariante (Impersonar)' : 'Aniversariante')
                : (user.authenticatedRole === 'admin' ? 'Assessoria (Impersonar)' : 'Assessoria')}
            </span>
          </div>
        </div>

        {/* Badge da Expiração dos 24 Horas & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden xs:flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-slate-950 border border-amber-500/30 rounded-xl text-amber-300 text-[10px] sm:text-[11px] font-bold">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span>{sessionTimeLeft || '24h'}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="min-h-[32px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-[11px] sm:text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            title="Encerrar Sessão"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
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
                className={`flex-1 min-h-[32px] sm:min-h-[38px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-extrabold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
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
