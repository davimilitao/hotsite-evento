import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-mail e código OTP são obrigatórios.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Festa Evento <onboarding@resend.dev>';

    if (!apiKey) {
      console.warn('⚠️ [RESEND] RESEND_API_KEY não configurada no .env. Modo de desenvolvimento ativo.');
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Código gerado localmente (defina RESEND_API_KEY no .env.local para envio real por e-mail).',
      });
    }

    const resend = new Resend(apiKey);

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificação 2FA</title>
      </head>
      <body style="margin:0; padding:0; background-color:#020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#020617; padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width:500px; background-color:#0f172a; border:1px solid #1e293b; border-radius:24px; padding:32px; color:#f8fafc; text-align:center;">
                <tr>
                  <td>
                    <!-- Ícone / Título -->
                    <div style="margin-bottom:20px;">
                      <span style="font-size:36px; background-color:#1e1b4b; padding:12px 18px; border-radius:16px; border:1px solid #4338ca; display:inline-block;">🔐</span>
                    </div>

                    <h1 style="font-size:22px; font-weight:800; color:#ffffff; margin:0 0 8px 0; letter-spacing:-0.5px;">
                      Autenticação de Segurança (2FA)
                    </h1>
                    <p style="font-size:14px; color:#94a3b8; margin:0 0 24px 0; line-height:1.5;">
                      Utilize o código numérico de 6 dígitos abaixo para confirmar o seu login no Painel do Evento:
                    </p>

                    <!-- Caixa do Código OTP -->
                    <div style="background-color:#020617; border:2px dashed #6366f1; border-radius:16px; padding:20px; margin-bottom:24px;">
                      <span style="font-family: monospace; font-size:36px; font-weight:900; letter-spacing:10px; color:#f59e0b; display:block;">
                        ${code}
                      </span>
                    </div>

                    <p style="font-size:12px; color:#e2e8f0; margin:0 0 20px 0; background-color:#1e293b; padding:10px 14px; border-radius:10px; display:inline-block;">
                      ⏱️ Este código expira em <strong>10 minutos</strong>. Nunca compartilhe este código com ninguém.
                    </p>

                    <hr style="border:0; border-top:1px solid #1e293b; margin:24px 0;" />

                    <p style="font-size:11px; color:#64748b; margin:0;">
                      Se você não solicitou este acesso, por favor ignore este e-mail.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `🔑 Seu Código de Verificação 2FA: ${code}`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ [RESEND ERROR]', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao enviar e-mail via Resend.' },
        { status: 400 }
      );
    }

    console.log(`✅ [RESEND] E-mail OTP enviado com sucesso para ${email}. ID:`, data?.id);

    return NextResponse.json({
      success: true,
      data,
      message: `Código enviado com sucesso para ${email}`,
    });
  } catch (error: any) {
    console.error('❌ [RESEND SERVER ERROR] Erro ao enviar e-mail OTP via Resend:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha no servidor ao enviar e-mail via Resend.' },
      { status: 500 }
    );
  }
}
