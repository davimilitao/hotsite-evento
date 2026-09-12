'use client';

import React from 'react';
import { X, ShieldCheck, Lock, Smartphone, CheckCircle, Mail, HelpCircle } from 'lucide-react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthdayPersonName?: string;
}

export function PrivacyTermsModal({ isOpen, onClose, birthdayPersonName = 'Fernanda Seppi' }: PrivacyTermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header do Modal */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                Termos de Uso & Política de Privacidade (LGPD)
              </h2>
              <p className="text-xs text-slate-500">
                Conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {/* Compromisso Principal */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-extrabold text-sm">
              <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Compromisso Fundamental de Privacidade</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Este hotsite foi criado exclusivamente para a organização da comemoração de <strong>{birthdayPersonName}</strong>. Garantimos que os seus dados não serão vendidos, compartilhados ou utilizados para fins publicitários.
            </p>
          </div>

          {/* Seção 1: Coleta e Uso de Dados */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" />
              1. Finalidade Exclusiva do Uso de Dados
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Os dados coletados (como nome completo, número de WhatsApp, quantidade de acompanhantes e restrições alimentares) são cadastrados e geridos diretamente pela anfitriã para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>Confirmação de presença (RSVP) e contagem oficial para o buffet.</li>
              <li>Alocação de mesas e assentos no salão de festas.</li>
              <li>Envio de lembretes e informações operacionais sobre o evento via WhatsApp.</li>
            </ul>
          </div>

          {/* Seção 2: Zero SPAM e Zero Propaganda */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              2. Política de Zero SPAM e Zero Propaganda
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Não realizamos disparos de propaganda, spams ou mensagens comerciais de qualquer natureza. O seu número de telefone é utilizado unicamente pela organização do evento para comunicações diretas da festa.
            </p>
          </div>

          {/* Seção 3: Isenção de Dados Financeiros */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              3. Ausência de Coleta de Dados Financeiros
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Nossa plataforma <strong>não armazena, não solicita e não transaciona</strong> dados de cartão de crédito, senhas bancárias ou dados de pagamento. As sugestões de presentes no site são meramente informativas.
            </p>
          </div>

          {/* Seção 4: Direitos do Titular (Art. 18 LGPD) */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              4. Seus Direitos (Art. 18 da Lei nº 13.709/2018)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Conforme a LGPD, você possui o direito de confirmar a existência de tratamento dos seus dados, acessar seus dados cadastrados ou solicitar a exclusão de seu nome e telefone da lista do evento a qualquer momento com a anfitriã ou através do canal de suporte da plataforma.
            </p>
          </div>
        </div>

        {/* Footer do Modal com Botão Entendi */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Entendi e Concordo
          </button>
        </div>
      </div>
    </div>
  );
}
