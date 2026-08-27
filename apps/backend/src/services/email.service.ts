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

export async function sendCustomerWelcomeEmail(customer: { name: string; email: string }) {
  try {
    const firstName = customer.name.split(' ')[0] || customer.name;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Hogar & Confort</p>
        </div>
        <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 12px;">¡Hola ${firstName}! Te damos la bienvenida 🎉</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Tu cuenta en <strong>Papes Confort</strong> ha sido creada exitosamente. A partir de ahora podrás realizar compras más rápido, seguir el estado de tus pedidos y gestionar tus datos de facturación y entrega.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://papesconfort.com/catalogo" style="background-color: #e41414; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
              Explorar Catálogo
            </a>
          </div>
        </div>
        <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 4px 0;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
          <p style="margin: 4px 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: customer.email,
      subject: '¡Te damos la bienvenida a Papes Confort!',
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] No se pudo enviar el correo de bienvenida a ${customer.email}:`, error.message);
  }
}

export async function sendPasswordChangedEmail(customer: { name: string; email: string }) {
  try {
    const firstName = customer.name.split(' ')[0] || customer.name;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        </div>
        <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
          <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hola ${firstName}, tu contraseña ha sido modificada</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Te confirmamos que la contraseña de tu cuenta en <strong>Papes Confort</strong> fue actualizada correctamente el ${new Date().toLocaleDateString('es-AR', { dateStyle: 'long' })}.
          </p>
          <p style="color: #e41414; font-size: 13px; font-weight: bold; margin-top: 16px;">
            ⚠️ Si no fuiste tú quien realizó este cambio, por favor contactanos de inmediato con nuestro soporte vía WhatsApp.
          </p>
        </div>
        <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 4px 0;">Papes Confort — Notificaciones de Seguridad</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: customer.email,
      subject: 'Aviso de seguridad: Tu contraseña fue modificada',
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] No se pudo enviar el correo de cambio de contraseña a ${customer.email}:`, error.message);
  }
}

export async function sendCustomerRegistrationCodeEmail(email: string, code: string, name?: string) {
  const firstName = name ? name.split(' ')[0] : 'Cliente';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Confirmación de Cuenta</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">¡Hola ${firstName}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Ingresá el siguiente código de confirmación de 6 dígitos para verificar tu correo y activar tu cuenta en <strong>Papes Confort</strong>:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #e41414;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 6px 0;">* Este código es válido por 10 minutos y es de uso único.</p>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">Si no solicitaste crear una cuenta, podés ignorar este correo.</p>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Tu código de confirmación es: ${code} - Papes Confort`,
    html,
  });
}

export async function sendCustomerPasswordChangeCodeEmail(email: string, code: string, name?: string) {
  const firstName = name ? name.split(' ')[0] : 'Cliente';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Seguridad de tu Cuenta</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hola ${firstName},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Se ha solicitado un cambio de contraseña para tu cuenta de cliente. Ingresá el siguiente código de confirmación en la web para autorizar la modificación:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 6px 0;">* Este código es válido por 10 minutos.</p>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">Si no solicitaste este cambio, no compartas este código con nadie y asegurate de tener acceso a tu correo.</p>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Notificaciones de Seguridad</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Código para cambio de contraseña: ${code} - Papes Confort`,
    html,
  });
}

export async function sendCustomerEmailChangeCodeEmail(email: string, code: string, newEmail: string, name?: string) {
  const firstName = name ? name.split(' ')[0] : 'Cliente';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Modificación de Correo Electrónico</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hola ${firstName},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Se solicitó modificar tu dirección de correo electrónico a: <strong>${newEmail}</strong>.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Ingresá el siguiente código de confirmación en tu panel para autorizar la actualización:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 6px 0;">* Este código es válido por 10 minutos.</p>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">Si no solicitaste este cambio, ignorá este mensaje.</p>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Notificaciones de Seguridad</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Código para cambio de correo electrónico: ${code} - Papes Confort`,
    html,
  });
}

