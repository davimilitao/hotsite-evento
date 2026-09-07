/**
 * Utilitário de Autenticação OTP (One-Time Password) por E-mail
 * Gera um código temporário de 6 dígitos e gerencia a notificação para a caixa de entrada.
 */

export interface OTPRecord {
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

// Validade padrão do código OTP: 10 minutos em milissegundos
export const OTP_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Gera um código numérico aleatório único de 6 dígitos (ex: 839201)
 */
export function generateOTP(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Simula/Dispara o envio do e-mail com o código OTP de 6 dígitos
 */
export async function sendOTPEmail(email: string, otpCode: string): Promise<boolean> {
  console.log(`✉️ [OTP SENT] Código de verificação ${otpCode} enviado para ${email}`);
  
  // Em produção, isso se conecta com a API de Envio de E-mail (ex: SendGrid, Resend, Firebase Auth Mailer)
  return true;
}
