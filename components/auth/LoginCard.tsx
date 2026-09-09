'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { getEventConfig } from '@/lib/db';
import { Crown, Clock, Sparkles, Loader2, Lock, UserCheck, Key, ArrowRight, Delete } from 'lucide-react';

export function LoginCard() {
  const { loginWithPin, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [pinDigits, setPinDigits] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [eventConfigPins, setEventConfigPins] = useState<{
    admin_pin?: string;
    birthday_person_pin?: string;
    assessor_pin?: string;
  }>({});

  useEffect(() => {
    getEventConfig().then((cfg) => {
      setEventConfigPins({
        admin_pin: cfg.admin_pin || '4040',
        birthday_person_pin: cfg.birthday_person_pin || '1986',
        assessor_pin: cfg.assessor_pin || '2026',
      });
    });
  }, []);

  const handleDigitChange = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    setPinDigits(clean);
    setErrorMsg(null);

    if (clean.length === 4) {
      executePinLogin(clean);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pinDigits.length < 4) {
      const nextPin = pinDigits + num;
      setPinDigits(nextPin);
      setErrorMsg(null);
      if (nextPin.length === 4) {
        executePinLogin(nextPin);
      }
    }
  };

  const executePinLogin = async (codeToSubmit: string) => {
    setErrorMsg(null);
    try {
      await loginWithPin(codeToSubmit, selectedRole, eventConfigPins);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao autenticar com PIN. Verifique os 4 dígitos.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinDigits.length < 4) {
      setErrorMsg('Informe os 4 dígitos do seu PIN de acesso.');
      return;
    }
    executePinLogin(pinDigits);
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
              Digite seu <strong className="text-amber-300">PIN de 4 dígitos</strong> para acessar o painel da festa.
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
                  onClick={() => {
                    setSelectedRole(role.id as UserRole);
                    setErrorMsg(null);
                    setPinDigits('');
                  }}
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

        {/* Formulário do PIN com Entrada Direta + Teclado Onscreen */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-3 text-center">
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
              PIN de Acesso (4 Dígitos)
            </label>

            {/* Campo Visível & Totalmente Digitável */}
            <div className="relative max-w-[240px] mx-auto">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                autoFocus
                value={pinDigits}
                onChange={(e) => handleDigitChange(e.target.value)}
                className="w-full text-center text-3xl font-black font-mono tracking-[0.6em] pl-4 py-3 bg-slate-950 border-2 border-purple-500/80 focus:border-purple-400 rounded-2xl text-amber-300 shadow-inner focus:outline-none focus:ring-4 focus:ring-purple-500/30 transition-all placeholder:text-slate-700"
              />
            </div>

            {/* Teclado Numérico Visual para Cliques Rápidos */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 text-white font-extrabold text-base transition-all active:scale-95 active:bg-purple-900/50 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPinDigits('');
                  setErrorMsg(null);
                }}
                className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-rose-400 font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500 text-white font-extrabold text-base transition-all active:scale-95 active:bg-purple-900/50 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  setPinDigits((prev) => prev.slice(0, -1));
                  setErrorMsg(null);
                }}
                className="h-11 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-amber-400 font-extrabold text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Apagar dígito"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-bold animate-fade-in">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pinDigits.length < 4}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Key className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span>{loading ? 'Validando PIN...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </form>

        {/* Aviso da Regra de Expiração de 24 Horas */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2.5 text-slate-400 text-xs">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[11px] leading-tight">
            <strong className="text-slate-300">Sessão Segura de 24 Horas:</strong> Acesso direto via PIN liberado com expiração em 24h.
          </p>
        </div>
      </div>
    </div>
  );
}
