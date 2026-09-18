'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { Gift, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';

interface GiftSectionProps {
  config: EventConfig;
}

export function GiftSection({ config }: GiftSectionProps) {
  return (
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-5">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl shrink-0">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1e152d]">Um Recadinho da Fê</h2>
          <p className="text-[11px] font-bold text-pink-500 uppercase tracking-widest">Sobre Presentes & Mimos</p>
        </div>
      </div>

      <div className="bg-[#fcf8fa] rounded-2xl p-5 border border-pink-100/60 shadow-sm relative overflow-hidden">
        {/* Background visual element */}
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <HeartHandshake className="w-32 h-32 text-pink-500" />
        </div>

        <div className="relative z-10 space-y-4 text-[13px] leading-relaxed text-slate-700 font-medium">
          <p>
            Ah, que legal que você clicou aqui! 🥰
          </p>
          <p>
            Falando bem sério: a sua presença e o seu abraço são os meus maiores e melhores presentes. Mas, como algumas pessoas me pediram um norte, deixo aqui algumas ideias se você quiser me fazer um mimo:
          </p>
          
          <ul className="space-y-3 py-2">
            <li className="flex items-start gap-2">
              <span className="text-pink-500 shrink-0 mt-0.5">•</span>
              <span><strong>Miniaturas de maquiagens e perfumes</strong> (sabe como sou apegada a essas coisinhas, né? Aquelas que parecem chaveiros estão super em alta!)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 shrink-0 mt-0.5">•</span>
              <span><strong>Body splashs</strong> (para me manter cheirosa sempre ✨).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 shrink-0 mt-0.5">•</span>
              <span><strong>Velas aromáticas, incensos e itens da linha zen</strong> (para criar aquele ambiente de paz e tranquilidade, muito bom pra recarregar as energias).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 shrink-0 mt-0.5">•</span>
              <span><strong>Tudo que tenha cachorro salsicha como tema!</strong> (é, eu amo as minhas meninas... mesmo que elas me tirem a paz de vez em quando. Na dúvida, me dá a vela zen junto para equilibrar! hahaha 🌭🐕).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 shrink-0 mt-0.5">•</span>
              <span><strong>Tênis (tamanho 37)</strong> ou <strong>Sandálias (tamanho 36)</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 shrink-0 mt-0.5">•</span>
              <span><strong>Vinhos e mais vinhos!</strong> (brincadeira... ou não 🍷), <strong>acessórios</strong> e <strong>sabonetes perfumados</strong>.</span>
            </li>
          </ul>

          <p className="pt-2">
            Bom, acho que já sugeri até demais! Mas o que importa mesmo é a sua presença para termos um dia maravilhoso juntos. Espero por você!
          </p>

          <p className="pt-4 font-black text-pink-600 text-sm italic">
            Com carinho,<br/>
            Fê 💖
          </p>
        </div>
      </div>
    </section>
  );
}
