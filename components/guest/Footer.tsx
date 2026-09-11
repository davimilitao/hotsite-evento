'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { Mail, MessageCircle, Heart, ShieldCheck } from 'lucide-react';

interface FooterProps {
  config?: EventConfig;
}

export function Footer({ config }: FooterProps) {
  const supportEmail = config?.support_email || 'suporte@evento.com.br';
  const supportPhone = config?.support_phone || '';
  const developerCredits = config?.developer_credits || 'Desenvolvido com carinho para Fernanda Seppi';

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    return phone;
  };

  const whatsappUrl = supportPhone
    ? `https://wa.me/55${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Preciso de ajuda com meu convite da festa.')}`
    : null;

  return (
    <footer className="mt-16 pt-10 pb-24 border-t border-slate-200/60 dark:border-slate-800 text-center space-y-6 text-xs text-slate-500 font-sans">
      <div className="max-w-md mx-auto px-4 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Atendimento & Suporte ao Convidado</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-1.5 hover:text-purple-600 dark:hover:text-purple-400 transition-colors py-1 px-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-purple-500" />
              <span>{supportEmail}</span>
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1 px-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp: {formatPhone(supportPhone)}</span>
            </a>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/60 text-[11px] text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-1">
          <span>{developerCredits}</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500/30" />
        </p>
        <p className="text-[10px] text-slate-400/80">
          Fernanda Seppi - 40 Anos Inesquecíveis © 2026
        </p>
      </div>
    </footer>
  );
}
