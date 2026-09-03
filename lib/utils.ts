import { Invite } from '@/types';

/**
 * Normaliza o nome e gera um token único amigável (ex: "Carlos Silva" -> "carlos-silva-k89x")
 */
export function generateInviteToken(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const randomHash = Math.random().toString(36).substring(2, 6);
  return `${normalized || 'convidado'}-${randomHash}`;
}

/**
 * Formata telefone para o padrão E.164 (ex: 11999998888 -> 5511999998888)
 */
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return `55${digits}`;
}

/**
 * Formata número de telefone para exibição (ex: 5511999998888 -> (11) 99999-8888)
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits.slice(2) : digits;
  
  if (number.length === 11) {
    return `(${number.slice(0, 2)}) ${number.slice(2, 7)}-${number.slice(7)}`;
  } else if (number.length === 10) {
    return `(${number.slice(0, 2)}) ${number.slice(2, 6)}-${number.slice(6)}`;
  }
  return phone;
}

/**
 * Monta o link wa.me com mensagem codificada para o WhatsApp
 */
export function buildWhatsAppLink(
  headName: string,
  phone: string,
  token: string,
  customTemplate?: string
): string {
  const cleanPhone = formatPhoneE164(phone);
  
  const siteUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://seusite.com.br';

  const inviteUrl = `${siteUrl}/convite/${token}`;

  const defaultMessage = `Olá ${headName}! 🎉 Você está convidado(a) para a festa de aniversário de 40 Anos da Fernanda Seppi!\n\nPor favor, confirme sua presença pelo link exclusivo abaixo:\n👉 ${inviteUrl}\n\nEspero por você! ❤️`;
  
  const message = customTemplate
    ? customTemplate.replace('{nome}', headName).replace('{link}', inviteUrl)
    : defaultMessage;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Helper para formatação de data por extenso
 */
export function formatDateExtenso(dateIso: string): string {
  try {
    const date = new Date(dateIso);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateIso;
  }
}

/**
 * Formata data curta pt-BR (ex: 25/10/2026)
 */
export function formatDateShort(dateIso?: string | null): string {
  if (!dateIso) return '';
  try {
    const date = new Date(dateIso);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateIso;
  }
}

/**
 * Verifica se o prazo do convite expirou
 */
export function isInviteExpired(invite: Invite, globalDeadline: string): boolean {
  if (invite.status === 'confirmed' || invite.status === 'declined') return false;
  
  const deadlineStr = invite.individual_deadline || globalDeadline;
  if (!deadlineStr) return false;

  const deadline = new Date(deadlineStr).getTime();
  const now = new Date().getTime();
  return now > deadline;
}

/**
 * Retorna o status de prazo amigável em texto limpo em português (sem siglas técnicas)
 */
export function getDeadlineInfo(invite: Invite, globalDeadline: string): { label: string; color: string; expired: boolean } {
  if (invite.status === 'confirmed') {
    return { label: 'Confirmado', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', expired: false };
  }
  if (invite.status === 'declined') {
    return { label: 'Recusado', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30', expired: false };
  }
  if (invite.status === 'pending_date') {
    return {
      label: `Pediu prazo até ${formatDateShort(invite.requested_date)}`,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      expired: false,
    };
  }

  const deadlineStr = invite.individual_deadline || globalDeadline;
  const deadline = new Date(deadlineStr).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Prazo Vencido há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`,
      color: 'text-rose-400 bg-rose-500/20 border-rose-500/40 font-black animate-pulse',
      expired: true,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Prazo Vence Hoje!',
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/40 font-extrabold',
      expired: false,
    };
  } else {
    return {
      label: `Faltam ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
      color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
      expired: false,
    };
  }
}
