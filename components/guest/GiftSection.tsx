'use client';

import React, { useState } from 'react';
import { EventConfig } from '@/types';
import { Gift, Copy, Check, QrCode, Sparkles } from 'lucide-react';

interface GiftSectionProps {
  config: EventConfig;
}

export function GiftSection({ config }: GiftSectionProps) {
  const [copiedPix, setCopiedPix] = useState(false);

  const handleCopyPix = () => {
    if (!config.pix_key) return;
    navigator.clipboard.writeText(config.pix_key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1e152d]">Guia de Presentes & Mimos</h2>
          <p className="text-xs text-slate-500">Sua presença é o maior presente! Mas se desejar agradar:</p>
        </div>
      </div>

      {/* Seção Pix / Vaquinha */}
      {config.pix_key && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-5 rounded-2xl shadow-md border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-300" />
              <span className="font-bold text-sm text-amber-300">Vaquinha Pix do Aniversariante</span>
            </div>
            <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
              Copia e Cola
            </span>
          </div>

          <p className="text-xs text-purple-100">
            {config.pix_name || 'Contribua com qualquer valor para a vaquinha do presente!'}
          </p>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-purple-400/30 flex items-center justify-between gap-2">
            <code className="text-xs font-mono text-amber-300 truncate select-all">{config.pix_key}</code>
            <button
              onClick={handleCopyPix}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold shrink-0 flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {copiedPix ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Pix</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Sugestões de Presentes */}
      {config.gift_suggestions && config.gift_suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600">
            Ideias & Tamanhos Preferidos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.gift_suggestions.map((item) => (
              <div
                key={item.id}
                className="bg-[#f9f7fd] p-4 rounded-2xl border border-purple-100 space-y-1.5 hover:border-purple-300 transition-colors shadow-sm"
              >
                <h4 className="font-extrabold text-sm text-[#1e152d] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#6d44e4]" />
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.description}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[11px] font-bold text-[#6d44e4] hover:underline pt-1"
                  >
                    Ver Exemplo no Site &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
