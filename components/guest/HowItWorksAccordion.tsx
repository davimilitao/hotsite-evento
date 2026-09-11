'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles, CheckCircle2, Utensils, HeartHandshake, HelpCircle } from 'lucide-react';

export function HowItWorksAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden transition-all duration-300">
      {/* Botão de Cabeçalho da Sanfona */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between text-left bg-gradient-to-r from-purple-50/60 via-white to-purple-50/40 hover:bg-purple-50/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-[#6d44e4] rounded-2xl shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#1e152d]">Como funciona a página do convidado?</h3>
            <p className="text-xs text-slate-500 font-medium"> Clique para ver dicas rápidas sobre confirmação, mesas e presentes</p>
          </div>
        </div>

        <div className={`p-2 text-purple-600 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-purple-100' : ''}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {/* Conteúdo Expansível (Sanfona) */}
      {isOpen && (
        <div className="p-5 border-t border-purple-100 bg-[#f9f7fd]/60 space-y-3 text-xs animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-purple-100/80 space-y-1 shadow-sm">
              <span className="font-extrabold text-[#6d44e4] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1. Confirmação de Presença
              </span>
              <p className="text-slate-600 leading-relaxed">
                Confirme você e os membros de sua família. Caso precise de mais alguns dias para decidir, basta clicar na opção <strong>&apos;Pedir Prazo&apos;</strong> e indicar até qual data pode responder!
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-purple-100/80 space-y-1 shadow-sm">
              <span className="font-extrabold text-[#6d44e4] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-500 shrink-0" /> 2. Local & Sua Mesa
              </span>
              <p className="text-slate-600 leading-relaxed">
                No menu inferior, você encontra as rotas direto no Google Maps e Waze, além de visualizar a <strong>mesa reservada</strong> para a sua família na planta do salão.
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-purple-100/80 space-y-1 shadow-sm">
              <span className="font-extrabold text-[#6d44e4] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0" /> 3. Mimos & Presentes
              </span>
              <p className="text-slate-600 leading-relaxed">
                Sua presença é nosso maior presente! Se quiser nos agradar, na aba de presentes a Fernanda deixou sugestões de estilos e a vaquinha Pix.
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-purple-100/80 space-y-1 shadow-sm">
              <span className="font-extrabold text-[#6d44e4] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" /> 4. Recados do Cerimonial
              </span>
              <p className="text-slate-600 leading-relaxed">
                Acompanhe o WhatsApp, pois nossa equipe de Cerimonial enviará recados especiais para te deixar por dentro de todas as atrações e surpresas da festa!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
