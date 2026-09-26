'use client';

import React from 'react';
import { EventConfig } from '@/types';
import { Gift, HeartHandshake, Sparkles, Copy, Check } from 'lucide-react';

interface GiftSectionProps {
  config: EventConfig;
}

export function GiftSection({ config }: GiftSectionProps) {
  const [copiedPix, setCopiedPix] = React.useState(false);

  const title = config.gift_message_title || 'Um Recadinho da Fê';
  const subtitle = config.gift_message_subtitle || 'Sobre Presentes & Mimos';
  const intro = config.gift_message_intro || 'Ah, que legal que você clicou aqui! 🥰\n\nFalando bem sério: a sua presença e o seu abraço são os meus maiores e melhores presentes. Mas, como algumas pessoas me pediram um norte, deixo aqui algumas ideias se você quiser me fazer um mimo:';
  const outro = config.gift_message_outro || 'Bom, acho que já sugeri até demais! Mas o que importa mesmo é a sua presença para termos um dia maravilhoso juntos. Espero por você!';
  const signature = config.gift_message_signature || 'Com carinho,\nFê 💖';

  const defaultItems = [
    { id: '1', title: 'Miniaturas de perfumes', description: '(sabe como sou apegada a essas coisinhas, né?)' },
    { id: '2', title: 'Body splashs', description: '(para me manter cheirosa sempre ✨).' },
    { id: '3', title: 'Velas aromáticas, incensos e itens da linha zen', description: '(para criar aquele ambiente de paz e tranquilidade, muito bom pra recarregar as energias).' },
    { id: '4', title: 'Tudo que tenha cachorro salsicha como tema!', description: '(é, eu amo as minhas meninas... mesmo que elas me tirem a paz de vez em quando. Na dúvida, me dá a vela zen junto para equilibrar! hahaha 🌭🐕).' },
    { id: '5', title: 'Tênis (tamanho 37) ou Sandálias (tamanho 36)', description: '' },
    { id: '6', title: 'Vinhos e mais vinhos!', description: '(brincadeira... ou não 🍷), acessórios e sabonetes perfumados.' },
  ];

  const items = config.gift_items && config.gift_items.length > 0 ? config.gift_items : defaultItems;

  const handleCopyPix = () => {
    if (config.pix_key) {
      navigator.clipboard.writeText(config.pix_key);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
        <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl shrink-0 shadow-sm">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1e152d]">{title}</h2>
          <p className="text-[11px] font-bold text-pink-500 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>

      <div className="bg-[#fcf8fa] rounded-2xl p-5 border border-pink-100/60 shadow-sm relative overflow-hidden">
        {/* Background visual element */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <HeartHandshake className="w-32 h-32 text-pink-500" />
        </div>

        <div className="relative z-10 space-y-4 text-[13px] leading-relaxed text-slate-700 font-medium">
          {intro.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}

          {items && items.length > 0 && (
            <ul className="space-y-3 py-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span className="text-pink-500 shrink-0 mt-0.5 font-bold">•</span>
                  <span>
                    <strong className="text-slate-900">{item.title}</strong>{' '}
                    {item.description && <span className="text-slate-600">{item.description}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {outro && (
            <p className="pt-2">
              {outro}
            </p>
          )}

          {signature && (
            <p className="pt-4 font-black text-pink-600 text-sm italic whitespace-pre-line">
              {signature}
            </p>
          )}
        </div>
      </div>

      {/* Opção Adicional de Mimo via Pix (Se cadastrado) */}
      {config.pix_key && (
        <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-black text-[#1e152d] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Mimo ou Vaquinha via Pix
            </span>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {config.pix_name ? `${config.pix_name} • ` : ''}Chave: {config.pix_key}
            </p>
          </div>
          <button
            onClick={handleCopyPix}
            className="px-3 py-1.5 bg-[#6d44e4] hover:bg-purple-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer"
          >
            {copiedPix ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
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
      )}
    </section>
  );
}

