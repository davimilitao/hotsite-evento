'use client';

import React, { useState } from 'react';
import { EventConfig, Invite } from '@/types';
import {
  HelpCircle,
  CheckCircle2,
  Utensils,
  Sparkles,
  HeartHandshake,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';

interface HelpTabProps {
  config: EventConfig;
  invite?: Invite | null;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function HelpTab({ config, invite }: HelpTabProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const supportPhone = config.support_phone || '11999998888';
  const headName = invite?.head_name || 'Convidado';

  const whatsappMessage = encodeURIComponent(
    `Olá! Sou ${headName} e estou na página do convite (${config.title}). Preciso de ajuda com a confirmação de presença!`
  );
  const whatsappSupportUrl = `https://wa.me/55${supportPhone.replace(/\D/g, '')}?text=${whatsappMessage}`;

  const faqItems: FAQItem[] = [
    {
      question: 'Como confirmo a presença de toda a minha família?',
      answer:
        'Na aba "RSVP & Convite", selecione o status (Confirmado ou Não Poderá Ir) para você e para cada um dos acompanhantes listados. Em seguida, clique em "Confirmar Presença Agora".',
    },
    {
      question: 'E se eu precisar de mais tempo para saber se poderei ir?',
      answer:
        'Não tem problema! Basta clicar na opção "Pedir Prazo" ao responder e indicar até qual data você conseguirá nos dar uma resposta final.',
    },
    {
      question: 'Como descubro qual é a minha mesa no salão de festas?',
      answer:
        'Após confirmar sua presença, acesse a aba "Local & Mesa". Lá você verá o nome da sua mesa e poderá abrir a Planta Baixa Interativa do Salão para ver onde sua família estará sentada!',
    },
    {
      question: 'Posso alterar a minha resposta depois de salvar?',
      answer:
        'Sim! A qualquer momento você pode retornar a esta página e clicar no botão "[ Alterar ]" para atualizar os dados de presença da sua família.',
    },
    {
      question: 'Como faço para enviar um mimo ou contribuição via Pix?',
      answer:
        'Na aba "Presentes & Pix", você encontrará a Chave Pix "Copia e Cola" do aniversariante, além de sugestões de mimos e lembrancinhas.',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Header da Seção de Ajuda */}
      <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-[#6d44e4] rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1e152d]">Central de Ajuda</h2>
            <p className="text-xs text-slate-500 font-medium">
              Dúvidas sobre o convite, confirmação e localização do evento
            </p>
          </div>
        </div>
      </section>

      {/* Guia Rápido em 4 Passos */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 px-1">
          Guia de Navegação do Convidado
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-1.5 shadow-sm">
            <span className="font-extrabold text-xs text-[#6d44e4] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1. Confirmação (RSVP)
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirme quem irá à festa. Se precisar de mais tempo, use a função <strong>Pedir Prazo</strong>!
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-1.5 shadow-sm">
            <span className="font-extrabold text-xs text-[#6d44e4] flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-500 shrink-0" /> 2. Onde me Sentar & Mapa
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Na aba <strong>Local & Mesa</strong> você descobre sua mesa reservada e abre rotas no GPS (Google Maps / Waze).
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-1.5 shadow-sm">
            <span className="font-extrabold text-xs text-[#6d44e4] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500 shrink-0" /> 3. Mimos & Vaquinha Pix
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja presentear? Na aba <strong>Presentes & Pix</strong> há vaquinha e ideias de lembrancinhas.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-1.5 shadow-sm">
            <span className="font-extrabold text-xs text-[#6d44e4] flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0" /> 4. Cerimonial & Atração
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fique atento ao WhatsApp! Nossa equipe avisará sobre novidades e surpresas do evento.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ - Perguntas Frequentes */}
      <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-4">
        <h3 className="text-sm font-black text-[#1e152d]">Dúvidas Frequentes (FAQ)</h3>

        <div className="space-y-2 divide-y divide-purple-50">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="pt-2">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full py-2.5 flex items-center justify-between text-left text-xs font-bold text-[#1e152d] hover:text-[#6d44e4] transition-colors cursor-pointer gap-2"
                >
                  <span>{item.question}</span>
                  <div
                    className={`p-1 rounded-full text-purple-600 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 bg-purple-100' : ''
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <p className="text-xs text-slate-600 leading-relaxed font-medium pb-3 pt-1 animate-fade-in pl-1">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA para Falar no WhatsApp */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-2xl shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black">Ainda com dúvidas ou dificuldades?</h4>
            <p className="text-xs text-emerald-100 font-medium">
              Fale direto com a nossa Cerimonialista / Suporte do Evento!
            </p>
          </div>
        </div>

        <a
          href={whatsappSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Chamar Suporte no WhatsApp</span>
        </a>
      </section>
    </div>
  );
}
