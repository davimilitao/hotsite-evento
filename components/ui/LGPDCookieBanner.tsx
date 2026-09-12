'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

interface LGPDCookieBannerProps {
  onOpenTerms: () => void;
}

export function LGPDCookieBanner({ onOpenTerms }: LGPDCookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lgpd_consent_accepted');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lgpd_consent_accepted', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-900/95 text-slate-100 backdrop-blur-lg border-t border-purple-500/30 shadow-2xl animate-fade-in">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs leading-relaxed">
            <p className="font-extrabold text-white flex items-center gap-1.5">
              <span>Privacidade & LGPD</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full text-[10px]">Zero SPAM</span>
            </p>
            <p className="text-slate-300">
              Usamos cookies essenciais para oferecer a melhor experiência ao confirmar sua presença. Seus dados são utilizados <strong>exclusivamente para a gestão desta festa</strong> e não são compartilhados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenTerms}
            className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Termos</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={handleAccept}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            ACEITAR & CONTINUAR
          </button>
        </div>
      </div>
    </div>
  );
}
