import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    const body = await req.json();
    const {
      type,
      token,
      headName,
      confirmedCount = 0,
      guests = [],
      notes = '',
      declinedMessage = '',
      requestedDate = '',
      requestedDateReason = '',
      eventTitle = 'Fernanda Seppi - 40 Anos',
      recipientEmail = 'militao46@gmail.com',
      ccEmail = '',
      tributeMessage = '',
      photoBase64 = '',
      photoFileName = '',
    } = body;

    if (!apiKey) {
      console.log('⚠️ RESEND_API_KEY não configurada no ambiente (.env). E-mail simulado com sucesso:', {
        type,
        headName,
        recipientEmail,
        hasPhoto: Boolean(photoBase64),
      });
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'RESEND_API_KEY ausente. E-mail simulado no log.',
      });
    }

    const resend = new Resend(apiKey);

    // 1. Fluxo de Backup em Alta Resolução da Homenagem Surpresa (Foto + Mensagem no Telão)
    if (type === 'surprise_tribute') {
      const subject = `📸✨ [${eventTitle}] Homenagem no Telão de ${headName}${photoBase64 ? ' (Foto Original em Anexo)' : ''}`;

      const attachments: Array<{ filename: string; content: Buffer }> = [];
      if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image')) {
        const matches = photoBase64.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const ext = matches[1] === 'png' ? 'png' : matches[1] === 'webp' ? 'webp' : 'jpg';
          const cleanName = (headName || 'convidado')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .toLowerCase();
          attachments.push({
            filename: photoFileName || `foto-telao-${cleanName}.${ext}`,
            content: Buffer.from(matches[2], 'base64'),
          });
        }
      }

      const tributeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf4ff; margin: 0; padding: 20px; color: #1e152d; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #f5d0fe; overflow: hidden; box-shadow: 0 10px 25px rgba(219,39,119,0.08); }
            .header { background: linear-gradient(135deg, #db2777, #7e22ce); padding: 28px 24px; text-align: center; color: #ffffff; }
            .badge { display: inline-block; padding: 6px 14px; background: rgba(255,255,255,0.22); color: #ffffff; border-radius: 20px; font-size: 11px; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.8px; }
            .content { padding: 28px 24px; }
            .msg-box { background: #fdf2f8; border-left: 4px solid #db2777; border-radius: 0 14px 14px 0; padding: 16px 20px; margin: 18px 0; }
            .att-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 14px 18px; color: #065f46; font-size: 13px; margin-top: 16px; }
            .footer { padding: 18px 24px; background: #f8fafc; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">🤫 Segredo • Homenagem do Telão</div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${eventTitle}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Backup Oficial de Foto em Alta Resolução & Depoimento</p>
            </div>
            <div class="content">
              <h2 style="font-size: 18px; margin: 0 0 6px 0; color: #1e152d;">
                Enviado por: <strong style="color: #db2777;">${headName}</strong>
              </h2>
              <p style="font-size: 12px; color: #64748b; margin: 0 0 18px 0;">
                Convite: <strong>#${token || 'avulso'}</strong> &bull; Horário: ${new Date().toLocaleString('pt-BR')}
              </p>

              ${
                tributeMessage
                  ? `
                <div class="msg-box">
                  <div style="font-size: 11px; font-weight: 800; color: #be185d; text-transform: uppercase; margin-bottom: 6px;">
                    💬 Mensagem / Depoimento para o Telão:
                  </div>
                  <div style="font-size: 15px; font-style: italic; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">&ldquo;${tributeMessage}&rdquo;</div>
                </div>
              `
                  : `<p style="font-size: 13px; color: #64748b; font-style: italic;">(Enviou foto sem texto adicional)</p>`
              }

              ${
                attachments.length > 0
                  ? `
                <div class="att-box">
                  📎 <strong>Foto em Alta Resolução Anexada (${attachments[0].filename})!</strong><br/>
                  A foto original está anexada neste e-mail para você guardar ou baixar em qualidade máxima, enquanto uma versão otimizada e super leve foi salva automaticamente no site e no Telão da festa.
                </div>
              `
                  : `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 12px; color: #475569;">
                  📝 Depoimento em texto salvo automaticamente na Galeria e no Telão da festa.
                </div>
              `
              }
            </div>
            <div class="footer">
              Backup automático via <strong>Resend</strong> &bull; Hotsite ${eventTitle}
            </div>
          </div>
        </body>
        </html>
      `;

      const tributeEmailOptions: any = {
        from: 'Fernanda Seppi 40 Anos <notificacoes@cachorrosalsicha.com.br>',
        to: [recipientEmail],
        subject,
        html: tributeHtml,
      };

      if (ccEmail && ccEmail.trim() && ccEmail.trim().toLowerCase() !== recipientEmail.trim().toLowerCase()) {
        tributeEmailOptions.cc = [ccEmail.trim()];
      }
      if (attachments.length > 0) {
        tributeEmailOptions.attachments = attachments;
      }

      const data = await resend.emails.send(tributeEmailOptions);
      return NextResponse.json({ success: true, data });
    }

    let subject = `[${eventTitle}] Nova atualização de convite`;
    let badgeBg = '#6d44e4';
    let badgeText = 'Atualização de RSVP';

    if (type === 'confirmed') {
      subject = `🎉 [${eventTitle}] ${headName} CONFIRMOU presença (${confirmedCount} pessoas)!`;
      badgeBg = '#10b981';
      badgeText = 'Presença Confirmada 🎉';
    } else if (type === 'declined') {
      subject = `💌 [${eventTitle}] ${headName} informou que NÃO poderá ir`;
      badgeBg = '#f43f5e';
      badgeText = 'Não Poderá Comparecer 💌';
    } else if (type === 'pending_date') {
      subject = `⏳ [${eventTitle}] ${headName} solicitou PRAZO até ${requestedDate || 'data futura'}`;
      badgeBg = '#f59e0b';
      badgeText = 'Solicitação de Prazo ⏳';
    }

    const guestsListHtml = (guests as Array<{ name: string; status?: string }>)
      .map(
        (g) =>
          `<li style="margin-bottom: 6px; font-size: 14px; color: #1e152d;">
            <strong>${g.name}</strong> 
            <span style="font-size: 12px; color: #64748b;">(${
              g.status === 'confirmed'
                ? 'Confirmado'
                : g.status === 'declined'
                ? 'Não irá'
                : g.status === 'pending_date'
                ? 'Pediu prazo'
                : 'Pendente'
            })</span>
          </li>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f4fc; margin: 0; padding: 20px; color: #1e152d; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e9d5ff; overflow: hidden; box-shadow: 0 10px 25px rgba(109,68,228,0.08); }
          .header { background: linear-gradient(135deg, #6d44e4, #4c1d95); padding: 30px 24px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; padding: 6px 14px; background: ${badgeBg}; color: #ffffff; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; }
          .content { padding: 30px 24px; }
          .guest-box { background: #f9f7fd; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .quote { background: #fffdf5; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 15px 0; font-style: italic; color: #475569; border-radius: 0 12px 12px 0; }
          .button { display: inline-block; padding: 14px 28px; background: #6d44e4; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 14px; text-align: center; margin-top: 15px; }
          .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${badgeText}</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${eventTitle}</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Notificação Automática do Hotsite de Convidados</p>
          </div>

          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #1e152d;">
              Nova resposta recebida de <strong>${headName}</strong>
            </h2>

            <div class="guest-box">
              <h3 style="font-size: 14px; margin-top: 0; color: #6d44e4; border-bottom: 1px solid #e9d5ff; padding-bottom: 8px;">
                Integrantes da Família/Grupo (${guests.length}):
              </h3>
              <ul style="padding-left: 20px; margin: 10px 0 0 0;">
                ${guestsListHtml}
              </ul>
            </div>

            ${
              type === 'declined' && declinedMessage
                ? `
              <div style="margin-top: 20px;">
                <strong style="font-size: 13px; color: #64748b;">Recado carinhoso deixado pelo convidado:</strong>
                <div class="quote">&ldquo;${declinedMessage}&rdquo;</div>
              </div>
            `
                : ''
            }

            ${
              type === 'pending_date'
                ? `
              <div style="margin-top: 20px; background: #fffbeb; border: 1px solid #fde68a; p-4 rounded-xl; padding: 16px; border-radius: 16px;">
                <strong style="font-size: 13px; color: #b45309;">Prazo Solicitado:</strong> At&eacute; <strong>${requestedDate}</strong><br/>
                ${
                  requestedDateReason
                    ? `<strong style="font-size: 13px; color: #b45309; margin-top: 6px; display: inline-block;">Motivo informado:</strong> &ldquo;${requestedDateReason}&rdquo;`
                    : ''
                }
              </div>
            `
                : ''
            }

            ${
              notes
                ? `
              <p style="font-size: 13px; color: #475569; margin-top: 15px;">
                <strong>Observações do RSVP:</strong> &ldquo;${notes}&rdquo;
              </p>
            `
                : ''
            }

            <div style="text-align: center; margin-top: 25px;">
              <a href="https://hotsite-evento-pink.vercel.app/admin" class="button">
                Acessar Painel de Controle da Festa
              </a>
            </div>
          </div>

          <div class="footer">
            Enviado com carinho via <strong>Resend</strong> &bull; Hotsite de Gestão de Eventos
          </div>
        </div>
      </body>
      </html>
    `;

    const emailOptions: any = {
      from: 'Fernanda Seppi 40 Anos <notificacoes@cachorrosalsicha.com.br>',
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    };

    if (ccEmail && ccEmail.trim() && ccEmail.trim().toLowerCase() !== recipientEmail.trim().toLowerCase()) {
      emailOptions.cc = [ccEmail.trim()];
    }

    const data = await resend.emails.send(emailOptions);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro na API /api/send-email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao enviar e-mail' },
      { status: 500 }
    );
  }
}
