'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { Gift, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';

interface GiftSectionProps {
  config: EventConfig;
}

export function GiftSection({ config }: GiftSectionProps) {
  // Filtramos a vaquinha Pix caso exista na lista antiga para não exibir chave financeira
  const filteredSuggestions = (config.gift_suggestions || []).filter(
    (item) => item.category !== 'vaquinha' && !item.title.toLowerCase().includes('pix')
  );

  return (
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1e152d]">Sugestões de Presentes & Mimos</h2>
          <p className="text-xs text-slate-500">Sua presença é o nosso maior presente! Se quiser nos presentear:</p>
        </div>
      </div>

      {/* Aviso de Transparência e Isenção de Dados Financeiros (LGPD) */}
      <div className="bg-[#f7f4fc] p-4 rounded-2xl border border-purple-100/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-slate-600 font-medium">
          <p className="font-extrabold text-[#1e152d]">Sem Cobranças ou Solicitação de Dados de Pagamento</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            As sugestões abaixo servem apenas como inspiração de estilos e tamanhos. Este hotsite <strong>não solicita dados bancários, números de cartão de crédito ou pagamentos diretos</strong>.
          </p>
        </div>
      </div>

      {/* Lista de Sugestões de Presentes Físicos e Experiências */}
      {filteredSuggestions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-[#6d44e4]" />
            <span>Ideias & Tamanhos Preferidos</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSuggestions.map((item) => (
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
                    Ver Exemplo / Referência &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-slate-400 font-medium">
          Nenhuma sugestão cadastrada. A sua presença na festa é o único presente necessário!
        </div>
      )}
    </section>
  );
}
