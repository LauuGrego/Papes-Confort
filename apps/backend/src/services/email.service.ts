import nodemailer from 'nodemailer';
import { env } from '../config/env';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL SENDING] Destinatario: ${to}, Asunto: ${subject}`);
  
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.warn('[EMAIL WARNING] Faltan variables de entorno SMTP (SMTP_HOST, SMTP_USER o SMTP_PASS).');
    throw new Error('Servidor de correo no configurado. Revisa las variables SMTP_HOST, SMTP_USER y SMTP_PASS en el servidor.');
  }

  // 1. Si es Brevo (host incluye 'brevo' o pass empieza con 'xsmtpsib'), enviamos por la API REST HTTPS (Puerto 443).
  // Esto garantiza envío en subsegundos y evita bloqueos de puertos SMTP (587/465) en hosting como Railway.
  if (host.includes('brevo') || pass.startsWith('xsmtpsib') || pass.startsWith('keysib')) {
    try {
      console.log('[EMAIL SERVICE] Enviando vía API HTTPS de Brevo (Puerto 443)...');
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': pass,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Papes Confort', email: user },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      const resData = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(resData?.message || resData?.code || 'Error en API de Brevo');
      }

      console.log(`[EMAIL SUCCESS] Correo enviado exitosamente a ${to} vía API Brevo. ID: ${resData.messageId || 'OK'}`);
      return resData;
    } catch (apiErr: any) {
      console.warn('[EMAIL API FALLBACK] Falló la API de Brevo, intentando transporte SMTP clásico:', apiErr.message);
    }
  }

  // 2. Transporte SMTP Clásico (Nodemailer)
  const isGmail = host.includes('gmail');

  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
  );

  try {
    const info = await transporter.sendMail({
      from: `"Papes Confort" <${user}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SUCCESS] Correo enviado exitosamente a ${to} vía SMTP. ID: ${info.messageId}`);
    return info;
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Falló el envío de correo a ${to}:`, err);
    throw new Error(`Error en el servidor de correo: ${err.message || 'Error de autenticación o conexión SMTP'}`);
  }
}
