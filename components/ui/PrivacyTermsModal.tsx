'use client';

import React from 'react';
import { X, ShieldCheck, Lock, CheckCircle, HelpCircle, Scale, Server, Clock } from 'lucide-react';

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

          {/* Seção 1: Base Legal e Finalidade */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-500" />
              1. Bases Legais e Finalidade Específica
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              O tratamento dos seus dados (Nome, WhatsApp e Restrições Alimentares) é realizado sob a base legal do <strong>Consentimento</strong> (Art. 7º, I, LGPD) e <strong>Legítimo Interesse</strong> (Art. 7º, IX, LGPD) da Organização do Evento (Controladora). A plataforma atua apenas como Operadora de Dados, utilizando estas informações unicamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>Executar o RSVP (Confirmação de presença) e mapeamento de assentos.</li>
              <li>Disparo transacional de convites e credenciais de acesso ao evento via WhatsApp.</li>
            </ul>
          </div>

          {/* Seção 2: Subprocessadores */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              2. Operadores e Subprocessadores de Dados
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              A plataforma não vende ou compartilha seus dados para publicidade. O compartilhamento ocorre de forma criptografada exclusivamente com infraestruturas técnicas parceiras essenciais para o funcionamento do SaaS:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Google Cloud / Firebase:</strong> Para armazenamento seguro do banco de dados.</li>
              <li><strong>Vercel Cloud:</strong> Para hospedagem e processamento da aplicação web.</li>
              <li><strong>APIs de Mensageria (Meta/WhatsApp):</strong> Para entrega dos convites digitais.</li>
            </ul>
          </div>

          {/* Seção 3: Ciclo de Vida e Retenção */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              3. Ciclo de Vida, Retenção e Descarte Seguro
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Os dados possuem ciclo de vida restrito e obedecem aos seguintes prazos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Descarte Pós-Evento:</strong> Dados de convidados e RSVPs são anonimizados ou deletados compulsoriamente após 90 dias do término do evento, ou imediatamente a pedido do Organizador.</li>
              <li><strong>Logs de Sistema:</strong> Registros técnicos de conexão (IP e hora de acesso) são retidos por 6 meses, em estrito cumprimento ao Art. 15 do Marco Civil da Internet (Lei nº 12.965/14), sendo deletados após este prazo.</li>
            </ul>
          </div>

          {/* Seção 4: Segurança e Isenções */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              4. Zero SPAM e Isenção Financeira
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Não realizamos disparos comerciais. Nossa plataforma <strong>não armazena nem transaciona</strong> dados de cartão de crédito ou senhas bancárias. Sugestões de presentes no site são redirecionadas para plataformas externas.
            </p>
          </div>

          {/* Seção 5: Direitos do Titular (Art. 18 LGPD) */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              5. Seus Direitos (Art. 18 da Lei nº 13.709/2018)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Conforme a LGPD, você possui o direito de confirmar a existência de tratamento dos seus dados, acessar as informações cadastradas, solicitar a correção ou exigir a exclusão imediata do seu nome e telefone da base de dados contatando a anfitriã ou nosso suporte.
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

