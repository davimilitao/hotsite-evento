'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, ShieldCheck, ArrowLeft, RefreshCw, Loader2, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

export function OTPVerifyCard() {
  const { pendingUser, pendingOtp, otpExpiresAt, verifyOTP, resendOTP, cancelOTP } = useAuth();
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('10:00');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Atualiza o contador de expiração do OTP (10 minutos)
  useEffect(() => {
    if (!otpExpiresAt) return;

    const interval = setInterval(() => {
      const diff = otpExpiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('Expirado');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  if (!pendingUser) return null;

  // Lógica de digitação automática entre os 6 inputs
  const handleChangeDigit = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue.slice(-1);
    setOtpDigits(newDigits);

    // Move o foco automaticamente para a próxima caixa
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Suporte a colar (paste) um código de 6 dígitos de uma vez
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setOtpDigits(newDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Por favor, informe os 6 dígitos do código de verificação enviado por e-mail.');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(fullCode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar código OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const newCode = await resendOTP();
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setSuccessMsg(`Novo código enviado para ${pendingUser.email}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao reenviar código por e-mail.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
        {/* Glow de fundo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center space-y-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Mail className="w-7 h-7 text-white animate-bounce-short" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Verificação de Segurança (2FA)</h2>
            <p className="text-xs font-medium text-slate-300">
              Enviamos um código de verificação de <strong className="text-amber-300">6 dígitos</strong> para a caixa de entrada do seu e-mail:
            </p>
            <div className="inline-block px-3 py-1 bg-slate-950 border border-purple-500/30 rounded-xl text-amber-300 font-mono text-xs font-bold mt-1">
              {pendingUser.email}
            </div>
          </div>
        </div>

        {/* Notificação de envio para a caixa de entrada */}
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-300 text-xs text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Código enviado! Confira a caixa de entrada (ou pasta de Spam) do e-mail <strong>{pendingUser.email}</strong>.
          </span>
        </div>

        {/* Formulário dos 6 Caixinhas do OTP */}
        <form onSubmit={handleSubmitOTP} className="space-y-6">
          <div className="flex justify-between items-center gap-2" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChangeDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-black text-xl rounded-2xl border transition-all focus:outline-none ${
                  digit
                    ? 'bg-purple-600/20 border-purple-500 text-amber-300 shadow-md scale-[1.03]'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center font-medium animate-fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botão Principal Confirmar OTP */}
          <button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6}
            className="w-full min-h-[48px] py-3 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validando Código...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span>Confirmar & Entrar no Painel</span>
              </>
            )}
          </button>
        </form>

        {/* Rodapé: Contador & Reenvio de Código */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Validade: <strong className="text-amber-300 font-mono">{timeLeftStr}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>Reenviar Código</span>
            </button>

            <button
              type="button"
              onClick={cancelOTP}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
