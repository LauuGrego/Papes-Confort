import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL SENDING] Destinatario: ${to}, Asunto: ${subject}`);
  
  // SMTP credentials from environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.warn(`
======================================================================
[EMAIL SIMULATION] VARIABLES DE SMTP NO CONFIGURADAS.
[EMAIL SIMULATION] CORREO SIMULADO CON ÉXITO:
[EMAIL SIMULATION] Destinatario: ${to}
[EMAIL SIMULATION] Asunto: ${subject}
[EMAIL SIMULATION] Contenido:
${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
======================================================================
    `);
    return;
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

