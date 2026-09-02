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

  const defaultMessage = `Olá ${headName}! 🎉 Você está convidado(a) para a minha festa de aniversário!\n\nPor favor, confirme sua presença pelo link exclusivo abaixo:\n👉 ${inviteUrl}\n\nEspero por você! ❤️`;
  
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
