'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Person, Invite, Table, EventConfig } from '@/types';
import { formatPhoneDisplay, formatDateShort, formatPhoneE164, getDeadlineInfo } from '@/lib/utils';
import {
  X,
  Send,
  Link2,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Armchair,
  Users,
  UserCheck,
  Phone,
  Edit,
  AlertTriangle,
  Sparkles,
  MessageCircle,
  Calendar,
  Split,
  ChevronDown,
  Crown,
} from 'lucide-react';

interface GuestActionDrawerProps {
  person: Person | null;
  invite: Invite | null;
  allPersons: Person[];
  tables: Table[];
  config: EventConfig;
  isOpen: boolean;
  onClose: () => void;
  onDispatchWhatsApp: (invite: Invite, person: Person) => void;
  onAcceptRequestedDate?: (invite: Invite) => void;
  onRejectRequestedDate?: (invite: Invite) => void;
  onEditInvite?: (invite: Invite) => void;
  onTableChange?: (person: Person, tableId: string) => void;
  onSavePhone?: (person: Person, newPhone: string) => Promise<void>;
  onSplitCompanion?: (person: Person, invite: Invite) => void;
  onManualConfirm?: (person: Person, invite: Invite, dietary?: string) => Promise<void> | void;
  onManualDecline?: (person: Person, invite: Invite) => Promise<void> | void;
  onManualReopen?: (person: Person, invite: Invite) => Promise<void> | void;
}

export function GuestActionDrawer({
  person,
  invite,
  allPersons,
  tables,
  config,
  isOpen,
  onClose,
  onDispatchWhatsApp,
  onAcceptRequestedDate,
  onRejectRequestedDate,
  onEditInvite,
  onTableChange,
  onSavePhone,
  onSplitCompanion,
  onManualConfirm,
  onManualDecline,
  onManualReopen,
}: GuestActionDrawerProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [manualDietary, setManualDietary] = useState('');
  const [showDietaryInput, setShowDietaryInput] = useState(false);
  const [isConfirmingManual, setIsConfirmingManual] = useState(false);

  // Controle de histórico para capturar o gesto "Swipe to go back" do mobile
  const isPushedToHistoryRef = useRef(false);

  const guestObj = invite?.guests?.find((g) => g.name.trim().toLowerCase() === person?.name.trim().toLowerCase());

  useEffect(() => {
    if (person) {
      setTempPhone(person.phone || '');
      setIsEditingPhone(false);
      setManualDietary(guestObj?.dietary || '');
      setShowDietaryInput(Boolean(guestObj?.dietary));
      setIsConfirmingManual(false);
    }
  }, [person, guestObj?.dietary]);

  // Intercepta gesto de deslizar para voltar no Safari/Android (Swipe Back)
  useEffect(() => {
    if (!isOpen) return;

    // Empurra um estado no histórico para capturar o swipe back sem sair do admin
    window.history.pushState({ guestDrawerOpen: true }, '');
    isPushedToHistoryRef.current = true;

    const handlePopState = (e: PopStateEvent) => {
      // O usuário deslizou para voltar no celular!
      // Em vez de ir para a index e deslogar, fechamos a gaveta
      isPushedToHistoryRef.current = false;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Fecha com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSafeClose = () => {
    if (isPushedToHistoryRef.current) {
      isPushedToHistoryRef.current = false;
      window.history.back();
    }
    onClose();
  };

  if (!isOpen || !person) return null;

  const headPerson = invite?.head_person_id
    ? allPersons.find((p) => p.id === invite.head_person_id)
    : null;

  const isHead = invite
    ? invite.head_person_id === person.id ||
      (!invite.head_person_id && invite.head_name.trim().toLowerCase() === person.name.trim().toLowerCase())
    : false;

  const isCompanion = !isHead && Boolean(invite?.companion_person_ids?.includes(person.id));

  // Acompanhantes do mesmo convite
  const companionPersons = invite?.companion_person_ids
    ? allPersons.filter((p) => invite.companion_person_ids?.includes(p.id) && p.id !== person.id)
    : [];

  const rsvpStatus = guestObj?.status || invite?.status || 'pending';
  const isConfirmedByHost =
    guestObj?.confirmed_by === 'birthday_person' ||
    (invite?.confirmed_by === 'birthday_person' && rsvpStatus === 'confirmed');
  const isSent = invite?.sent_status === 'sent';
  const deadlineInfo = invite ? getDeadlineInfo(invite, config.deadline_rsvp) : null;
  const currentTable = tables.find((t) => t.id === person.table_id);

  const hasOwnPhone = Boolean(person.phone && person.phone.replace(/\D/g, '').length >= 8);
  const headHasPhone = Boolean(invite?.phone && invite.phone.replace(/\D/g, '').length >= 8);

  const handleCopyLink = () => {
    if (!invite) return;
    const siteUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'https://seusite.com.br';
    const link = `${siteUrl}/convite/${invite.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSavePhoneClick = async () => {
    if (!onSavePhone) return;
    setSavingPhone(true);
    try {
      await onSavePhone(person, tempPhone);
      setIsEditingPhone(false);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      {/* Backdrop escurecido com blur */}
      <div
        onClick={handleSafeClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Conteúdo: Fundo BRANCO PURO de ALTO CONTRASTE para máxima legibilidade */}
      <aside className="relative w-full md:w-[470px] bg-white text-slate-900 border-t md:border-t-0 md:border-l border-slate-200 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl z-10 max-h-[92vh] md:max-h-full h-auto md:h-full flex flex-col animate-slide-up md:animate-slide-left">
        
        {/* Barra de puxador no mobile */}
        <div 
          onClick={handleSafeClose}
          className="py-2 flex items-center justify-center cursor-pointer md:hidden"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* HEADER DO DRAWER (Branco Limpo com Contraste Alto) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-500/20 shrink-0">
              {person.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {person.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {/* Badge Status RSVP */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs ${
                    rsvpStatus === 'confirmed'
                      ? isConfirmedByHost
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : rsvpStatus === 'declined'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : rsvpStatus === 'pending_date'
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {rsvpStatus === 'confirmed' && isConfirmedByHost && <Crown className="w-3 h-3 text-amber-600" />}
                  {rsvpStatus === 'confirmed' && !isConfirmedByHost && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                  {rsvpStatus === 'declined' && <XCircle className="w-3 h-3 text-rose-700" />}
                  {rsvpStatus === 'pending_date' && <Clock className="w-3 h-3 text-purple-700" />}
                  {rsvpStatus === 'pending' && <Clock className="w-3 h-3 text-amber-700" />}

                  {rsvpStatus === 'confirmed' && (isConfirmedByHost ? 'Confirmado p/ Aniversariante 👑' : 'Confirmado')}
                  {rsvpStatus === 'declined' && 'Ausente'}
                  {rsvpStatus === 'pending_date' && 'Pediu Prazo'}
                  {rsvpStatus === 'pending' && 'Aguardando'}
                </span>

                {/* Badge Categoria / Idade */}
                {person.child_category && person.child_category !== 'inteira' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                    {person.child_category === 'isento' ? 'Isento (Buffet)' : 'Meia Criança'}
                  </span>
                )}

                {/* Badge Envio */}
                {invite && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isSent
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isSent ? 'Disparado' : 'Não Enviado'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSafeClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Fechar (Esc ou Deslize para voltar)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO DRAWER (Fundo Claro em Contraste Alto) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs bg-slate-50/50">
          
          {/* BLOCO 1: QUEM CONFIRMA & COMPOSIÇÃO */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" /> Regra de Confirmação
              </span>
              {invite && onEditInvite && (
                <button
                  onClick={() => {
                    handleSafeClose();
                    onEditInvite(invite);
                  }}
                  className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Editar no Wizard
                </button>
              )}
            </div>

            {invite ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-900 font-bold">
                  <span>Responsável por responder:</span>
                  {isHead ? (
                    <span className="inline-flex items-center gap-1 text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Ele(a) mesmo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      <Link2 className="w-3.5 h-3.5 text-purple-600" /> {headPerson?.name || invite.head_name}
                    </span>
                  )}
                </div>

                {/* Se for acompanhante, opção de desmembrar */}
                {isCompanion && onSplitCompanion && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Deseja dar um convite próprio para {person.name.split(' ')[0]}?</span>
                    <button
                      onClick={() => {
                        handleSafeClose();
                        onSplitCompanion(person, invite);
                      }}
                      className="text-[10px] font-extrabold text-purple-700 hover:bg-purple-100 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Split className="w-3 h-3" /> Desmembrar
                    </button>
                  </div>
                )}

                {/* Se tiver acompanhantes no mesmo convite */}
                {companionPersons.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Outros integrantes neste mesmo convite ({companionPersons.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {companionPersons.map((comp) => (
                        <span
                          key={comp.id}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 flex items-center gap-1"
                        >
                          <Users className="w-3 h-3 text-slate-400" /> {comp.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 italic text-[11px]">
                Esta pessoa ainda não possui um convite gerado. Clique no botão verde abaixo para convidá-la.
              </p>
            )}
          </div>

          {/* BLOCO: PRESENÇA & CONFIRMAÇÃO DIRETA (ANIVERSARIANTE / HOST) */}
          {invite && (onManualConfirm || onManualDecline || onManualReopen) && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> Presença & Confirmação Direta
                </span>
                {isConfirmedByHost && (
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" /> Feito pelo Anfitrião
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {rsvpStatus !== 'confirmed' ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isConfirmingManual}
                      onClick={async () => {
                        if (!onManualConfirm) return;
                        setIsConfirmingManual(true);
                        try {
                          await onManualConfirm(person, invite, manualDietary);
                        } finally {
                          setIsConfirmingManual(false);
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span>{isConfirmingManual ? 'Confirmando...' : 'Confirmar Presença (pelo Aniversariante)'}</span>
                    </button>

                    {!showDietaryInput ? (
                      <button
                        type="button"
                        onClick={() => setShowDietaryInput(true)}
                        className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        + Adicionar restrição alimentar (opcional)
                      </button>
                    ) : (
                      <div className="pt-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Restrição alimentar (opcional):</label>
                        <input
                          type="text"
                          placeholder="Ex: Vegetariano, intolerância a glúten..."
                          value={manualDietary}
                          onChange={(e) => setManualDietary(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {isConfirmedByHost
                          ? 'Presença confirmada diretamente pelo Anfitrião!'
                          : 'Presença confirmada pelo convidado!'}
                      </span>
                    </div>
                    {guestObj?.dietary && (
                      <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-emerald-100">
                        Restrição alimentar: <strong className="text-slate-900">{guestObj.dietary}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Ações secundárias: Registrar Ausência / Reabrir */}
                <div className="flex items-center gap-2 pt-1">
                  {rsvpStatus !== 'declined' && onManualDecline && (
                    <button
                      type="button"
                      onClick={() => onManualDecline(person, invite)}
                      className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 hover:border-rose-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Registrar Ausência</span>
                    </button>
                  )}

                  {(rsvpStatus === 'confirmed' || rsvpStatus === 'declined') && onManualReopen && (
                    <button
                      type="button"
                      onClick={() => onManualReopen(person, invite)}
                      className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200 hover:border-amber-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reabrir / Desfazer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BLOCO 2: TELEFONE & CONTATO */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-600" /> Celular / WhatsApp
              </span>
              {!isEditingPhone && (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> {person.phone ? 'Alterar' : 'Adicionar número'}
                </button>
              )}
            </div>

            {isEditingPhone ? (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: 11999998888"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-purple-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
                <button
                  disabled={savingPhone}
                  onClick={handleSavePhoneClick}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar
                </button>
                <button
                  onClick={() => setIsEditingPhone(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-900 font-mono text-sm font-bold">
                  {person.phone ? (
                    formatPhoneDisplay(person.phone)
                  ) : isCompanion && headHasPhone ? (
                    <span className="text-slate-500 italic font-sans text-xs">
                      (Sem número próprio — usa do responsável)
                    </span>
                  ) : (
                    <span className="text-rose-600 font-sans text-xs font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Sem telefone cadastrado
                    </span>
                  )}
                </span>
                {person.phone && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                    Disparo Direto Habilitado
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BLOCO 3: PRAZOS, PEDIDO DE PRAZO & LEITURA */}
          {invite && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Prazos & Histórico
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block">Prazo de Resposta:</span>
                  <span className="font-extrabold text-slate-900 block">
                    {invite.individual_deadline
                      ? formatDateShort(invite.individual_deadline)
                      : config.deadline_rsvp
                      ? formatDateShort(config.deadline_rsvp)
                      : 'Não definido'}
                  </span>
                  {deadlineInfo && (
                    <span className={`text-[9px] font-black block ${deadlineInfo.expired ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {deadlineInfo.expired ? 'Prazo Vencido' : 'Dentro do Prazo'}
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block">Visualizações (Visto):</span>
                  <div className="flex items-center gap-1">
                    <Eye className={`w-3.5 h-3.5 ${invite.opened_count && invite.opened_count > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-extrabold text-slate-900">
                      {invite.opened_count && invite.opened_count > 0 ? `${invite.opened_count} vezes` : 'Não visualizou'}
                    </span>
                  </div>
                  {invite.opened_at && (
                    <span className="text-[9px] text-slate-500 block truncate">
                      Última: {formatDateShort(invite.opened_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* Se o convidado pediu prazo */}
              {invite.status === 'pending_date' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>Solicitou extensão de prazo até {invite.requested_date ? formatDateShort(invite.requested_date) : 'nova data'}:</span>
                  </div>
                  {invite.requested_date_reason && (
                    <p className="text-[11px] text-slate-700 italic bg-white p-2 rounded-lg border border-purple-100">
                      &quot;{invite.requested_date_reason}&quot;
                    </p>
                  )}
                  {(onAcceptRequestedDate || onRejectRequestedDate) && (
                    <div className="flex items-center gap-2 pt-1">
                      {onAcceptRequestedDate && (
                        <button
                          onClick={() => {
                            handleSafeClose();
                            onAcceptRequestedDate(invite);
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[11px] shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Aceitar Prazo
                        </button>
                      )}
                      {onRejectRequestedDate && (
                        <button
                          onClick={() => {
                            handleSafeClose();
                            onRejectRequestedDate(invite);
                          }}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[11px] shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Não Dá
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de Ausência */}
              {invite.status === 'declined' && invite.declined_message && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-900 block">
                    Recado deixado ao informar ausência:
                  </span>
                  <p className="text-[11px] text-slate-800 italic">
                    &quot;{invite.declined_message}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* BLOCO 4: MESA RESERVADA */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5 text-purple-600" /> Mesa Reservada no Salão
            </span>

            {onTableChange ? (
              <select
                value={person.table_id || ''}
                onChange={(e) => onTableChange(person, e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="">-- Sem Mesa Atribuída --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({allPersons.filter((p) => p.table_id === t.id).length}/{t.capacity} lugares)
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">
                  {currentTable ? currentTable.name : 'Sem Mesa Atribuída'}
                </span>
                {currentTable && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Capacidade: {currentTable.capacity} lugares
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER FIXO COM CTAs PRINCIPAIS (Branco Puro com Sombra) */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-2.5 shadow-lg">
          {/* Botão de Disparo WhatsApp Principal */}
          {invite ? (
            <button
              onClick={() => {
                onDispatchWhatsApp(invite, person);
              }}
              className="w-full min-h-[50px] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>
                {isSent
                  ? hasOwnPhone
                    ? `Reenviar Convite no WhatsApp de ${person.name.split(' ')[0]}`
                    : `Reenviar no WhatsApp do Responsável (${headPerson?.name?.split(' ')[0] || invite.head_name?.split(' ')[0]})`
                  : hasOwnPhone
                  ? `Convidar no WhatsApp de ${person.name.split(' ')[0]}`
                  : `Convidar no WhatsApp do Responsável (${headPerson?.name?.split(' ')[0] || invite.head_name?.split(' ')[0]})`}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                handleSafeClose();
                if (onEditInvite) {
                  onEditInvite({
                    id: '',
                    head_person_id: person.id,
                    head_name: person.name,
                    phone: person.phone || '',
                    max_guests: 1,
                    status: 'pending',
                    confirmed_count: 0,
                    table_id: person.table_id || null,
                    guests: [],
                    tier: 'main',
                    sent_status: 'not_sent',
                    checked_in: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }
              }}
              className="w-full min-h-[50px] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Gerar Convite para {person.name.split(' ')[0]}</span>
            </button>
          )}

          {/* Ações Secundárias em Linha */}
          {invite && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(`/convite/${invite.id}`, '_blank');
                }}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Ver Convite</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
