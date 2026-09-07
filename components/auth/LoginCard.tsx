'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { OTPVerifyCard } from './OTPVerifyCard';
import { Crown, Clock, Sparkles, Loader2, Lock, UserCheck, Zap } from 'lucide-react';

export function LoginCard() {
  const { loginWithGoogle, loginWithDemo, pendingUser, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (pendingUser) {
    return <OTPVerifyCard />;
  }

  const handleLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle(selectedRole);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar autenticação com o Google.');
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithDemo(selectedRole);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar sessão de teste.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
        {/* Glow de fundo sutil */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center space-y-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Painel Administrativo</h2>
            <p className="text-xs font-medium text-slate-400">
              Faça login com a sua Conta Google. Você receberá um <strong className="text-amber-300">Código de Verificação de 6 dígitos (OTP)</strong> no seu e-mail.
            </p>
          </div>
        </div>

        {/* Seleção do Nível / Perfil de Usuário */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Selecione o Perfil de Acesso
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'admin', name: 'Admin', icon: Crown, label: 'Geral' },
              { id: 'birthday_person', name: 'Dona Festa', icon: Sparkles, label: 'Aniversariante' },
              { id: 'assessor', name: 'Assessoria', icon: UserCheck, label: 'Cerimonial' },
            ].map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id as UserRole)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{role.name}</span>
                  <span className="text-[9px] opacity-70 block">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center font-medium leading-relaxed space-y-2 animate-fade-in">
            <p>{errorMsg}</p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl border border-rose-500/40 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Usar Acesso Rápido / Demo (Sem Popup)</span>
            </button>
          </div>
        )}

        {/* Botão Oficial de Login com Google & Botão Fallback */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            ) : (
              /* Logo Oficial do Google em SVG */
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Autenticando...' : 'Entrar com o Google'}</span>
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Acesso Rápido / Demo (Sem Popup do Navegador)</span>
          </button>
        </div>

        {/* Aviso da Regra de Expiração de 24 Horas & 2FA */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2.5 text-slate-400 text-xs">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[11px] leading-tight">
            <strong className="text-slate-300">Segurança 2FA & Sessão 24h:</strong> Autenticação por e-mail com código temporário de 6 dígitos.
          </p>
        </div>
      </div>
    </div>
  );
}
