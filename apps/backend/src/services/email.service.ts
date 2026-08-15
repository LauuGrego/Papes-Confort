import nodemailer from 'nodemailer';
import { env } from '../config/env';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL SENDING] Destinatario: ${to}, Asunto: ${subject}`);
  
  // Obtenemos las credenciales SMTP de las variables de entorno centralizadas (env)
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.warn('[EMAIL WARNING] Faltan variables de entorno SMTP en el servidor (SMTP_HOST, SMTP_USER o SMTP_PASS).');
    throw new Error('Servidor de correo SMTP no configurado. Revisa las variables SMTP_HOST, SMTP_USER y SMTP_PASS en las variables de entorno del servidor.');
  }
  
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
    console.log(`[EMAIL SUCCESS] Correo enviado exitosamente a ${to}. ID: ${info.messageId}`);
    return info;
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Falló el envío de correo a ${to}:`, err);
    throw new Error(`Error en el servidor de correo: ${err.message || 'Error de autenticación o conexión SMTP'}`);
  }
}
