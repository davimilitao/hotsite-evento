'use client';

import React, { useState, useEffect } from 'react';
import { Invite, Person, Table, EventConfig, SurpriseCampaign, CampaignType } from '@/types';
import { saveInvite, getAllSurpriseCampaigns, saveSurpriseCampaign, deleteSurpriseCampaign } from '@/lib/db';
import { buildSurprisePhotoLink, buildSurpriseVideoLink, buildSurpriseTextLink, exportContactsToVCF, formatPhoneE164 } from '@/lib/utils';
import {
  Gift,
  Camera,
  Video,
  MessageSquareText,
  Settings,
  Search,
  Lock,
  Sparkles,
  Send,
  Save,
  X,
  Plus,
  Trash2,
  Edit,
  Power,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  Zap,
  HelpCircle,
  ShieldAlert,
  Users,
  MessageCircle,
  UserCheck,
} from 'lucide-react';

interface SurpriseDashboardProps {
  invites: Invite[];
  persons?: Person[];
  tables?: Table[];
  config?: EventConfig;
  onRefresh: () => void;
}

export function SurpriseDashboard({ invites, persons = [], tables = [], config, onRefresh }: SurpriseDashboardProps) {
  // Lista de Campanhas Surpresa Dinâmicas
  const [campaigns, setCampaigns] = useState<SurpriseCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Estados dos Modais
  const [activeCampaignModal, setActiveCampaignModal] = useState<SurpriseCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<SurpriseCampaign | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Busca e Filtros dentro do Modal de Disparo
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'received'>('all');

  // Campos do Formulário de Criação/Edição de Campanha
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<CampaignType>('photo');
  const [formDescription, setFormDescription] = useState('');
  const [formMessageTemplate, setFormMessageTemplate] = useState('');
  const [formVideoOrientation, setFormVideoOrientation] = useState<'horizontal' | 'vertical' | 'selfie'>('horizontal');

  // Carrega as campanhas cadastradas
  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await getAllSurpriseCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Erro ao carregar campanhas surpresa:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // FILTRAGEM & CLASSIFICAÇÃO DOS CONVIDADOS EM 3 ESTADOS (Desbloqueados, Bloqueados/Spoiler, Ocultos)
  // Exclui completamente quem recusou o convite ('declined')
  const nonDeclinedInvites = invites.filter((i) => i.status !== 'declined');

  const getGuestEligibility = (invite: Invite) => {
    const isConfirmed = invite.status === 'confirmed';
    const isSeated = Boolean(invite.table_id);

    if (isConfirmed && isSeated) {
      return {
        status: 'unlocked' as const,
        label: 'Desbloqueado / Pronto',
        reason: 'Presença confirmada e mesa atribuída',
      };
    }

    let reason = 'Aguardando Confirmação de Presença';
    if (isConfirmed && !isSeated) {
      reason = 'Aguardando Atribuição de Mesa na Planta';
    } else if (invite.status === 'pending_date') {
      reason = 'Pediu Prazo (Reserva Temporária)';
    }

    return {
      status: 'locked' as const,
      label: 'Bloqueado (Spoiler)',
      reason,
    };
  };

  // Handlers do Formulário de Campanha (Criar / Editar)
  const handleOpenCreateForm = () => {
    setEditingCampaign(null);
    setFormTitle('');
    setFormType('photo');
    setFormDescription('');
    setFormMessageTemplate(
      'Segredo! 🤫 Shhh... Estamos preparando uma Homenagem Surpresa especial para os 40 Anos da Fernanda Seppi!\n\nPor favor, envie aqui neste WhatsApp uma foto marcante de vocês juntos para colocarmos no Mural/Telão da festa! 📸✨'
    );
    setFormVideoOrientation('horizontal');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (campaign: SurpriseCampaign) => {
    setEditingCampaign(campaign);
    setFormTitle(campaign.title);
    setFormType(campaign.type);
    setFormDescription(campaign.description || '');
    setFormMessageTemplate(campaign.message_template);
    setFormVideoOrientation(campaign.video_orientation || 'horizontal');
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessageTemplate.trim()) {
      alert('Por favor, preencha o título e o modelo de mensagem da campanha.');
      return;
    }

    const campaignToSave: SurpriseCampaign = {
      id: editingCampaign ? editingCampaign.id : `camp-${Date.now()}`,
      title: formTitle.trim(),
      type: formType,
      description: formDescription.trim(),
      message_template: formMessageTemplate.trim(),
      video_orientation: formType === 'video' ? formVideoOrientation : undefined,
      active: editingCampaign ? editingCampaign.active : true,
      created_at: editingCampaign ? editingCampaign.created_at : new Date().toISOString(),
    };

    await saveSurpriseCampaign(campaignToSave);
    setIsFormOpen(false);
    await loadCampaigns();
  };

  const handleDeleteCampaign = async (campaign: SurpriseCampaign) => {
    if (confirm(`Tem certeza que deseja excluir a campanha "${campaign.title}"? Essa ação não pode ser desfeita.`)) {
      await deleteSurpriseCampaign(campaign.id);
      await loadCampaigns();
    }
  };

  const handleToggleCampaignActive = async (campaign: SurpriseCampaign) => {
    await saveSurpriseCampaign({
      ...campaign,
      active: !campaign.active,
    });
    await loadCampaigns();
  };

  // Funções de Disparo por Campanha
  const getCampaignStatusForInvite = (invite: Invite, type: CampaignType) => {
    if (type === 'photo') return invite.surprise_photo_sent;
    if (type === 'video') return invite.surprise_video_sent;
    if (type === 'text') return invite.surprise_text_sent || !!invite.surprise_message;
    return false;
  };

  const handleDispatchSingle = (invite: Invite, campaign: SurpriseCampaign) => {
    let waUrl = '';
    const name = invite.head_name;
    const phone = invite.phone;
    const msg = campaign.message_template;

    if (campaign.type === 'photo') {
      waUrl = buildSurprisePhotoLink(name, phone, msg);
    } else if (campaign.type === 'video') {
      waUrl = buildSurpriseVideoLink(name, phone, campaign.video_orientation || 'horizontal', msg);
    } else if (campaign.type === 'text') {
      waUrl = buildSurpriseTextLink(name, phone, msg);
    }

    window.open(waUrl, '_blank');
  };

  // Disparo para o Grupo VIP do WhatsApp
  const handleDispatchToVipGroup = (campaign: SurpriseCampaign) => {
    if (config?.whatsapp_group_link) {
      window.open(config.whatsapp_group_link, '_blank');
    } else {
      alert('O link do Grupo VIP do WhatsApp ainda não foi cadastrado em Configurações.');
    }
  };

  // Disparo para o WhatsApp da Cerimonialista / Suporte
  const handleDispatchToCeremonialist = (campaign: SurpriseCampaign) => {
    const targetPhone = config?.location_phone || config?.support_phone || '11999998888';
    const cleanPhone = formatPhoneE164(targetPhone);
    const text = encodeURIComponent(
      `[TEMPLATE CERIMONIAL - ${campaign.title}]\n\n${campaign.message_template}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleToggleMediaStatus = async (invite: Invite, type: CampaignType) => {
    if (type === 'photo') {
      await saveInvite({ ...invite, surprise_photo_sent: !invite.surprise_photo_sent });
    } else if (type === 'video') {
      await saveInvite({ ...invite, surprise_video_sent: !invite.surprise_video_sent });
    } else if (type === 'text') {
      await saveInvite({ ...invite, surprise_text_sent: !invite.surprise_text_sent });
    }
    onRefresh();
  };

  // Filtragem no Modal de Disparo
  const modalFilteredInvites = activeCampaignModal
    ? nonDeclinedInvites.filter((inv) => {
        const matchesSearch =
          inv.head_name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
          inv.phone.includes(modalSearchTerm);

        if (!matchesSearch) return false;

        const eligibility = getGuestEligibility(inv);
        const isReceived = getCampaignStatusForInvite(inv, activeCampaignModal.type);

        if (modalStatusFilter === 'unlocked') return eligibility.status === 'unlocked' && !isReceived;
        if (modalStatusFilter === 'locked') return eligibility.status === 'locked';
        if (modalStatusFilter === 'received') return isReceived;

        return true;
      })
    : [];

  const nextPendingGuestInQueue = activeCampaignModal
    ? modalFilteredInvites.find((inv) => {
        const eligibility = getGuestEligibility(inv);
        const isReceived = getCampaignStatusForInvite(inv, activeCampaignModal.type);
        return eligibility.status === 'unlocked' && !isReceived;
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header Secreto da Homenagem Surpresa */}
      <div className="bg-gradient-to-r from-pink-950 via-purple-950 to-slate-900 border border-pink-500/40 p-5 sm:p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-extrabold border border-pink-500/30">
            <Lock className="w-3.5 h-3.5 text-pink-400" /> SEGREDO DA FESTA • Painel do Cerimonial & Assessoria
          </div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 font-serif">
            Hub de Campanhas Surpresa <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-pink-100 max-w-xl leading-relaxed">
            Visão unificada das campanhas com status de liberação automático (Elegíveis com mesa alocada vs Spoiler/Bloqueados).
          </p>
        </div>

        {/* Botão de Criar Nova Campanha & Baixar VCF */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportContactsToVCF(invites.filter((i) => i.status === 'confirmed'))}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            title="Exportar contatos dos confirmados para arquivo VCF"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span className="hidden xs:inline">Baixar Contatos (VCF)</span>
          </button>

          <button
            onClick={handleOpenCreateForm}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-pink-400/40"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Criar Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards das Campanhas Criadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((camp) => {
          const unlockedInvites = nonDeclinedInvites.filter((i) => getGuestEligibility(i).status === 'unlocked');
          const lockedInvites = nonDeclinedInvites.filter((i) => getGuestEligibility(i).status === 'locked');
          const receivedCount = nonDeclinedInvites.filter((i) => getCampaignStatusForInvite(i, camp.type)).length;
          const pendingUnlockedCount = unlockedInvites.filter((i) => !getCampaignStatusForInvite(i, camp.type)).length;

          let Icon = Camera;
          let badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
          let badgeLabel = 'Foto';

          if (camp.type === 'video') {
            Icon = Video;
            badgeColor = 'bg-pink-500/20 text-pink-300 border-pink-500/30';
            badgeLabel = 'Vídeo';
          } else if (camp.type === 'text') {
            Icon = MessageSquareText;
            badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            badgeLabel = 'Recado';
          }

          return (
            <div
              key={camp.id}
              className={`bg-slate-900 border rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                camp.active ? 'border-slate-800' : 'border-slate-800/40 opacity-70'
              }`}
            >
              {/* Faixa Superior: Badge do Tipo + Ações do Card (Editar, Pausar, Excluir) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                    {badgeLabel}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleCampaignActive(camp)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        camp.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
                      }`}
                      title={camp.active ? 'Pausar Campanha' : 'Ativar Campanha'}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditForm(camp)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Editar Campanha"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCampaign(camp)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Campanha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Icon className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>{camp.title}</span>
                  </h3>
                  {camp.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{camp.description}</p>}
                </div>
              </div>

              {/* Status de Liberação & Métricas */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Desbloqueados (Prontos):
                  </span>
                  <span className="font-black text-emerald-400">{unlockedInvites.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Bloqueados (Spoiler):
                  </span>
                  <span className="font-extrabold text-amber-400">{lockedInvites.length}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 font-bold">
                  <span className="text-slate-300">Respostas Coletadas:</span>
                  <span className="text-white font-black">
                    {receivedCount} <span className="text-slate-500">/ {unlockedInvites.length} libertos</span>
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-1">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                    style={{
                      width: `${unlockedInvites.length > 0 ? (receivedCount / unlockedInvites.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Botão Principal de Disparo / Gestão */}
              <button
                onClick={() => {
                  setActiveCampaignModal(camp);
                  setModalSearchTerm('');
                  setModalStatusFilter('all');
                }}
                className="w-full min-h-[42px] px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>Gerenciar Fila ({pendingUnlockedCount} Elegíveis)</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO E EDIÇÃO DE CAMPANHA (CRUD) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{editingCampaign ? 'Editar Campanha Surpresa' : 'Nova Campanha Surpresa'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">Título da Campanha *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Fotos para o Mural da Festa, Vídeo Depoimento..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Tipo da Campanha */}
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">Tipo de Mídia *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'photo', label: 'Foto', icon: Camera },
                    { id: 'video', label: 'Vídeo', icon: Video },
                    { id: 'text', label: 'Recado', icon: MessageSquareText },
                  ].map((t) => {
                    const isSelected = formType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormType(t.id as CampaignType)}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orientação do Vídeo (Apenas para Vídeos) */}
              {formType === 'video' && (
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">Orientação do Celular no Vídeo</label>
                  <select
                    value={formVideoOrientation}
                    onChange={(e) => setFormVideoOrientation(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="horizontal">🖥️ Celular na Horizontal (Deitado) - Recomendado</option>
                    <option value="vertical">📱 Celular na Vertical (Em Pé)</option>
                    <option value="selfie">🤳 Formato Selfie</option>
                  </select>
                </div>
              )}

              {/* Descrição Interna */}
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">Descrição / Instrução Interna</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Instruções para a assessoria e organização..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Modelo da Mensagem do WhatsApp */}
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">
                  Modelo da Mensagem do WhatsApp *
                </label>
                <textarea
                  rows={5}
                  value={formMessageTemplate}
                  onChange={(e) => setFormMessageTemplate(e.target.value)}
                  placeholder="Digite a mensagem personalizada a ser disparada..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono leading-relaxed"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Variáveis suportadas: <code className="text-amber-300 font-mono">{'{nome}'}</code>,{' '}
                  <code className="text-amber-300 font-mono">{'{orientacao}'}</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  {editingCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DISPARO & FILA DO CERIMONIAL */}
      {activeCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeCampaignModal.type.toUpperCase()}
                </span>
                <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1">
                  <span>{activeCampaignModal.title}</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveCampaignModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE CANAIS DE DISPARO (GRUPO VIP & CERIMONIAL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => handleDispatchToVipGroup(activeCampaignModal)}
                className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Disparar no Grupo VIP do WhatsApp</span>
              </button>

              <button
                onClick={() => handleDispatchToCeremonialist(activeCampaignModal)}
                className="px-3.5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Enviar Template para Celular da Assessora</span>
              </button>
            </div>

            {/* Fila Rápida de Disparo Individual */}
            {nextPendingGuestInQueue && (
              <div className="bg-gradient-to-r from-purple-950/60 to-pink-950/60 border border-purple-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" /> Próximo Desbloqueado da Fila:
                  </span>
                  <h4 className="text-sm font-black text-white">{nextPendingGuestInQueue.head_name}</h4>
                  <p className="text-[11px] text-slate-400">{nextPendingGuestInQueue.phone}</p>
                </div>

                <button
                  onClick={() => handleDispatchSingle(nextPendingGuestInQueue, activeCampaignModal)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>Enviar para {nextPendingGuestInQueue.head_name.split(' ')[0]} (1-Clique)</span>
                </button>
              </div>
            )}

            {/* Filtros da Tabela */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar convidado por nome ou telefone..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'unlocked', label: '🟢 Desbloqueados' },
                  { id: 'locked', label: '🔒 Spoiler (Bloqueados)' },
                  { id: 'received', label: '✓ Recebidos' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setModalStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all whitespace-nowrap ${
                      modalStatusFilter === f.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela de Convidados com Status de Liberação */}
            <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-800/80">
              {modalFilteredInvites.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhum convidado encontrado com os filtros aplicados.
                </div>
              ) : (
                modalFilteredInvites.map((inv) => {
                  const eligibility = getGuestEligibility(inv);
                  const isReceived = getCampaignStatusForInvite(inv, activeCampaignModal.type);
                  const isUnlocked = eligibility.status === 'unlocked';

                  return (
                    <div key={inv.id} className="p-3 hover:bg-slate-850 flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-white truncate">{inv.head_name}</h5>
                          {isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🟢 Elegível
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Spoiler
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate">
                          {inv.phone} {!isUnlocked && <span className="text-amber-400/90 font-medium">({eligibility.reason})</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleMediaStatus(inv, activeCampaignModal.type)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all border ${
                            isReceived
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {isReceived ? '✓ Recebido' : '⏳ Pendente'}
                        </button>

                        <button
                          disabled={!isUnlocked}
                          onClick={() => handleDispatchSingle(inv, activeCampaignModal)}
                          className={`p-2 rounded-xl transition-all ${
                            isUnlocked
                              ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 cursor-pointer'
                              : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                          }`}
                          title={isUnlocked ? 'Disparar Mensagem no WhatsApp' : `Bloqueado: ${eligibility.reason}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setActiveCampaignModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
