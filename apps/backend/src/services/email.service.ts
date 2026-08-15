import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || 'notificaciones@papesconfort.com';
  const from = `"Papes Confort" <${fromEmail}>`;

  // 1. Usar API HTTP de Resend si existe una clave de API (empieza con "re_")
  // Esto utiliza HTTPS (Puerto 443) y evita bloqueos de puertos SMTP en servidores como Railway/Vercel.
  if (apiKey && apiKey.startsWith('re_')) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(`Error en Resend API: ${error.message}`);
    }

    return;
  }

  // 2. Fallback a Nodemailer SMTP tradicional
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    throw new Error('Servidor de correo no configurado. Falta la clave RESEND_API_KEY o las credenciales SMTP.');
  }
  
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
