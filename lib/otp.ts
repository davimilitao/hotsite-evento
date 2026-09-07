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

export async function sendOTPEmail(email: string, otpCode: string): Promise<boolean> {
  console.log(`✉️ [OTP PROCESS] Disparando código de verificação ${otpCode} para ${email}`);

  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code: otpCode }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('⚠️ [OTP API WARNING] Resposta da API /api/send-otp:', errData);
    } else {
      const data = await res.json().catch(() => ({}));
      console.log('✅ [OTP SENT] Resposta da API:', data);
    }
  } catch (err) {
    console.error('❌ [OTP API ERROR] Erro na requisição para /api/send-otp:', err);
  }

  return true;
}
