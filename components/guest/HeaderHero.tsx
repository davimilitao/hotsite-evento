'use client';

import React, { useEffect, useState } from 'react';
import { EventConfig, Invite } from '@/types';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDateExtenso } from '@/lib/utils';

interface HeaderHeroProps {
  config: EventConfig;
  invite: Invite;
}

export function HeaderHero({ config, invite }: HeaderHeroProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(config.date_time).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.date_time]);

  const getStatusBadge = () => {
    switch (invite.status) {
      case 'confirmed':
        return (
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Presença Confirmada ({invite.confirmed_count} {invite.confirmed_count === 1 ? 'pessoa' : 'pessoas'})
          </div>
        );
      case 'declined':
        return (
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
            <XCircle className="w-4 h-4 text-rose-400" />
            Ausência Registrada
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Aguardando sua Confirmação
          </div>
        );
    }
  };

  return (
    <header className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900 text-white pt-10 pb-16 px-4 text-center overflow-hidden rounded-b-[2.5rem] shadow-2xl border-b border-indigo-500/20">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg mx-auto space-y-5">
        {/* Badge do Convidado */}
        <div>{getStatusBadge()}</div>

        <p className="text-purple-300 text-sm font-medium tracking-wide uppercase">
          Você está convidado(a) especial!
        </p>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200">
          {config.title}
        </h1>

        <p className="text-slate-300 text-sm sm:text-base font-light">
          Convite exclusivo para <strong className="font-semibold text-amber-300">{invite.head_name}</strong>
          {invite.max_guests > 1 && ` (até ${invite.max_guests} pessoas)`}
        </p>

        {/* Card Data & Hora */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 inline-block max-w-md w-full shadow-lg">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-sm mb-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDateExtenso(config.date_time)}</span>
          </div>
        </div>

        {/* Contagem Regressiva */}
        <div className="pt-2">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Faltam apenas
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs mx-auto">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 shadow-inner">
              <span className="block text-xl sm:text-2xl font-extrabold text-amber-400">{timeLeft.days}</span>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Dias</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 shadow-inner">
              <span className="block text-xl sm:text-2xl font-extrabold text-slate-200">{timeLeft.hours}</span>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Horas</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 shadow-inner">
              <span className="block text-xl sm:text-2xl font-extrabold text-slate-200">{timeLeft.minutes}</span>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Min</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 shadow-inner">
              <span className="block text-xl sm:text-2xl font-extrabold text-pink-400">{timeLeft.seconds}</span>
              <span className="text-[10px] uppercase text-slate-400 font-medium">Seg</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
