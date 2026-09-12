'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { Mail, MessageCircle, Heart, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  config?: EventConfig;
  onOpenTerms?: () => void;
}

export function Footer({ config, onOpenTerms }: FooterProps) {
  const supportEmail = config?.support_email || 'militao46@gmail.com';
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
    <footer className="mt-16 pt-10 pb-24 border-t border-purple-200/60 text-center space-y-6 text-xs text-slate-500 font-sans">
      <div className="max-w-md mx-auto px-4 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-[#6d44e4] rounded-full text-[11px] font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6d44e4]" />
          <span>Atendimento & Suporte ao Convidado</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-semibold">
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-1.5 hover:text-[#6d44e4] transition-colors py-1.5 px-3.5 rounded-xl bg-white border border-purple-100 shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-[#6d44e4]" />
              <span>{supportEmail}</span>
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors py-1.5 px-3.5 rounded-xl bg-white border border-purple-100 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp: {formatPhone(supportPhone)}</span>
            </a>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-purple-100 text-[11px] text-slate-400 space-y-1.5">
        <p className="flex items-center justify-center gap-1">
          <span>{developerCredits}</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500/30" />
        </p>

        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-medium">
          <span>Fernanda Seppi - 40 Anos © 2026</span>
          <span>•</span>
          {onOpenTerms && (
            <button
              onClick={onOpenTerms}
              className="hover:text-purple-600 underline transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Termos de Uso & LGPD</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
