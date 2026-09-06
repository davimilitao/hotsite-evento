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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Dados do Usuário Autenticado */}
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="relative shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-base shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" title="Sessão Ativa" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white truncate">{user.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-[10px] font-extrabold uppercase">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              {user.role === 'admin' ? 'Admin Geral' : user.role === 'birthday_person' ? 'Aniversariante' : 'Assessoria'}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Indicador Visual da Expiração de 24 Horas & Seletor de Visão */}
      <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
        {/* Badge da Expiração dos 24 Horas */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold shadow-inner">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Sessão: {sessionTimeLeft || '24h'} restantes</span>
        </div>

        {/* Seletor Rápido de Papel (Role) */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          {[
            { id: 'admin', label: 'Admin', icon: Crown },
            { id: 'birthday_person', label: 'Aniversariante', icon: Sparkles },
            { id: 'assessor', label: 'Assessora', icon: UserCheck },
          ].map((role) => {
            const Icon = role.icon;
            const isSelected = currentRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id as UserRole)}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{role.label}</span>
              </button>
            );
          })}
        </div>

        {/* Botão Sair / Logout */}
        <button
          type="button"
          onClick={logout}
          className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          title="Encerrar Sessão"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
