import nodemailer from 'nodemailer';

const SMTP_HOST = String(process.env.SMTP_HOST ?? '');
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 0);
const SMTP_USER = String(process.env.SMTP_USER ?? '');
const SMTP_PASS = String(process.env.SMTP_PASS ?? '').replace(/\s+/g, '');
const EMAIL_FROM = String(process.env.EMAIL_FROM ?? 'no-reply@agroecologia.local');

function createTransporter() {
  if (!SMTP_HOST || !SMTP_PORT) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export function formatPasswordResetEmail(code: string, name: string) {
  const subject = 'Código de recuperação de senha';
  const text = `Olá ${name},

Você pediu para redefinir a senha. Use o código abaixo para concluir o processo:

${code}

Esse código expira em 15 minutos.

Se você não solicitou essa alteração, ignore essa mensagem.`;

  const html = `
    <p>Olá <strong>${name}</strong>,</p>
    <p>Você solicitou a recuperação de senha. Use o código abaixo para concluir o processo:</p>
    <h2 style="font-family:monospace;">${code}</h2>
    <p>Esse código expira em <strong>15 minutos</strong>.</p>
    <p>Se você não solicitou essa alteração, ignore esta mensagem.</p>
  `;

  return { subject, text, html };
}

export async function sendPasswordResetEmail(to: string, code: string, name: string) {
  const transporter = createTransporter();
  const { subject, text, html } = formatPasswordResetEmail(code, name);

  if (!transporter) {
    console.warn('[email] SMTP não configurado; exibindo código no log');
    console.log(`Password reset code for ${to}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
