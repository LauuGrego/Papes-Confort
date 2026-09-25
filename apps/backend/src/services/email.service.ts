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
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 12px;">¡Hola ${firstName}! Te damos la bienvenida</h2>
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
            Si no fuiste tú quien realizó este cambio, por favor contactanos de inmediato con nuestro soporte vía WhatsApp.
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

export async function sendCustomerOrderCreatedEmail(data: {
  name: string;
  email: string;
  orderNumber: string;
  total: number;
  trackingUrl?: string;
}) {
  const firstName = data.name.split(' ')[0] || data.name;
  const formattedTotal = Number(data.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const trackingLink = data.trackingUrl || `https://papesconfort.com/mi-cuenta/pedidos`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Confirmación de Pedido</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">¡Muchas gracias por tu compra, ${firstName}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Hemos recibido tu pedido <strong>#${data.orderNumber}</strong> con éxito. Estamos procesando los detalles para coordinar la entrega.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">Número de pedido: <strong style="color: #0f172a;">${data.orderNumber}</strong></p>
          <p style="margin: 0; color: #64748b; font-size: 13px;">Monto total: <strong style="color: #e41414; font-size: 16px;">$${formattedTotal}</strong></p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${trackingLink}" style="background-color: #e41414; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
            Ver Estado de mi Pedido
          </a>
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: data.email,
      subject: `Confirmación de pedido #${data.orderNumber} - Papes Confort`,
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] Error enviando correo de pedido creado a ${data.email}:`, error.message);
  }
}

export async function sendCustomerPaymentApprovedEmail(data: {
  name: string;
  email: string;
  orderNumber: string;
  total: number;
}) {
  const firstName = data.name.split(' ')[0] || data.name;
  const formattedTotal = Number(data.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #16a34a; font-size: 15px; font-weight: bold; margin-top: 4px;">✓ Pago Acreditado</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">¡Tu pago fue acreditado con éxito, ${firstName}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Confirmamos la recepción del pago por <strong>$${formattedTotal}</strong> para tu pedido <strong>#${data.orderNumber}</strong>.
          Ya comenzamos con el empaquetado y preparación para el despacho de tus productos.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://papesconfort.com/mi-cuenta/pedidos" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
            Seguir mi Pedido
          </a>
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: data.email,
      subject: `¡Pago acreditado con éxito! Pedido #${data.orderNumber} - Papes Confort`,
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] Error enviando correo de pago aprobado a ${data.email}:`, error.message);
  }
}

export async function sendCustomerTransferPendingEmail(data: {
  name: string;
  email: string;
  orderNumber: string;
  total: number;
  bank?: {
    bankName: string;
    cbu: string;
    alias: string;
    accountHolder: string;
  };
  instructions?: string;
}) {
  const firstName = data.name.split(' ')[0] || data.name;
  const formattedTotal = Number(data.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const instructions = data.instructions || 'Aboná por transferencia bancaria y envianos el comprobante por WhatsApp.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Pago por Transferencia Bancaria</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hola ${firstName}, tu pedido #${data.orderNumber} está registrado</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Para confirmar tu compra por el total de <strong style="color: #e41414;">$${formattedTotal}</strong>, por favor realizá la transferencia utilizando los siguientes datos bancarios:
        </p>
        ${
          data.bank
            ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.8;">
            <div><strong>Banco:</strong> ${data.bank.bankName}</div>
            <div><strong>Titular:</strong> ${data.bank.accountHolder}</div>
            <div><strong>CBU:</strong> <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${data.bank.cbu}</code></div>
            <div><strong>Alias:</strong> <strong style="color: #0f172a;">${data.bank.alias}</strong></div>
          </div>
        `
            : ''
        }
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; margin: 16px 0; color: #92400e; font-size: 13px; line-height: 1.5;">
          ℹ️ <strong>Instrucciones:</strong> ${instructions}
          <br />
          <em>Tu reserva de stock permanecerá activa durante 72 horas.</em>
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: data.email,
      subject: `Datos para tu transferencia bancaria - Pedido #${data.orderNumber} - Papes Confort`,
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] Error enviando correo de transferencia pendiente a ${data.email}:`, error.message);
  }
}

export async function sendCustomerOrderCancelledEmail(data: {
  name: string;
  email: string;
  orderNumber: string;
  reason?: string;
}) {
  const firstName = data.name.split(' ')[0] || data.name;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Aviso de Cancelación de Pedido</p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 12px;">Hola ${firstName},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Te informamos que tu pedido <strong>#${data.orderNumber}</strong> ha sido cancelado ${data.reason ? `(${data.reason})` : ''}.
        </p>
        <p style="color: #475569; font-size: 13px; line-height: 1.6;">
          Si tuviste algún inconveniente con el método de pago o deseas reintentar tu compra, podés comunicarte con nuestro equipo por WhatsApp o visitar nuevamente nuestra tienda.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://papesconfort.com/catalogo" style="background-color: #e41414; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
            Volver a la Tienda
          </a>
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 4px 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: data.email,
      subject: `Aviso: Pedido #${data.orderNumber} cancelado - Papes Confort`,
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] Error enviando correo de pedido cancelado a ${data.email}:`, error.message);
  }
}

export interface AdminOrderNotificationItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AdminOrderNotificationData {
  to?: string;
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCuilCuit?: string | null;
  shippingType: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: string;
  installmentsCount?: number | null;
  subtotal: number;
  shippingCost: number;
  bankDiscount: number;
  total: number;
  notes?: string | null;
  items: AdminOrderNotificationItem[];
}

export async function sendAdminNewPaidOrderNotificationEmail(data: AdminOrderNotificationData) {
  const recipient = data.to || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'papesconfort@gmail.com.ar';
  const formattedTotal = Number(data.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedSubtotal = Number(data.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedShippingCost = Number(data.shippingCost).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedDiscount = Number(data.bankDiscount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const paymentLabel = data.paymentMethod === 'CARD'
    ? `Tarjeta (Mobbex)${data.installmentsCount ? ` - ${data.installmentsCount} cuotas` : ''}`
    : 'Transferencia Bancaria';

  const shippingLabel = data.shippingType === 'LOCAL_PICKUP'
    ? 'Retiro en Sucursal'
    : data.shippingType === 'LOCAL_PAID'
    ? 'Envío Local (Basavilbaso)'
    : 'Envío a Convenir / Encomienda';

  const dateStr = new Date(data.createdAt).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a; vertical-align: top;">
          ${item.sku || 'S/SKU'}
        </td>
        <td style="padding: 10px; font-size: 13px; color: #1e293b; vertical-align: top;">
          ${item.name}
        </td>
        <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: bold; color: #0f172a; vertical-align: top;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; text-align: right; font-size: 13px; color: #475569; vertical-align: top;">
          $${Number(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 10px; text-align: right; font-size: 13px; font-weight: bold; color: #0f172a; vertical-align: top;">
          $${Number(item.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; border-bottom: 2px solid #e41414; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #e41414; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold;">Notificación Operativa de Venta</p>
      </div>

      <!-- ALERTA GESCOM -->
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 6px solid #e41414; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <h3 style="color: #991b1b; margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
          🚨 Pedido #${data.orderNumber} PAGADO — Cargar en GesCom
        </h3>
        <p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">
          El pago de este pedido fue <strong>confirmado exitosamente</strong>. Ingresá a GesCom para cargar el cliente, emitir la factura correspondiente y rebajar el stock.
        </p>
      </div>

      <!-- DETALLES DE LA VENTA -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
        <div>
          <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Resumen del Pedido</h4>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Nº Pedido:</strong> #${data.orderNumber}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Fecha:</strong> ${dateStr}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Medio de Pago:</strong> <span style="background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${paymentLabel}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Modalidad de Entrega:</strong> ${shippingLabel}</p>
        </div>
        <div>
          <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Datos del Cliente</h4>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${data.customerName}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>DNI / CUIL / CUIT:</strong> <strong style="color: #e41414;">${data.customerCuilCuit || 'No especificado'}</strong></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> ${data.customerEmail}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Teléfono:</strong> ${data.customerPhone || 'No informado'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Dirección:</strong> ${data.shippingAddress}, ${data.shippingCity} (CP ${data.shippingPostalCode})</p>
          ${data.notes ? `<p style="margin: 4px 0; font-size: 13px; color: #b45309;"><strong>Notas:</strong> ${data.notes}</p>` : ''}
        </div>
      </div>

      <!-- TABLA DE ARTÍCULOS -->
      <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Artículos a Facturar</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="padding: 10px; text-align: left; font-size: 12px; border-top-left-radius: 6px;">CÓDIGO / SKU</th>
            <th style="padding: 10px; text-align: left; font-size: 12px;">PRODUCTO</th>
            <th style="padding: 10px; text-align: center; font-size: 12px;">CANT.</th>
            <th style="padding: 10px; text-align: right; font-size: 12px;">P. UNIT</th>
            <th style="padding: 10px; text-align: right; font-size: 12px; border-top-right-radius: 6px;">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="padding: 8px 10px; text-align: right; font-size: 13px; color: #64748b;">Subtotal Artículos:</td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px; font-weight: bold; color: #0f172a;">$${formattedSubtotal}</td>
          </tr>
          ${
            Number(data.shippingCost) > 0
              ? `
          <tr>
            <td colspan="4" style="padding: 6px 10px; text-align: right; font-size: 13px; color: #64748b;">Costo de Envío:</td>
            <td style="padding: 6px 10px; text-align: right; font-size: 13px; font-weight: bold; color: #0f172a;">$${formattedShippingCost}</td>
          </tr>
          `
              : ''
          }
          ${
            Number(data.bankDiscount) > 0
              ? `
          <tr>
            <td colspan="4" style="padding: 6px 10px; text-align: right; font-size: 13px; color: #16a34a;">Descuento Transferencia:</td>
            <td style="padding: 6px 10px; text-align: right; font-size: 13px; font-weight: bold; color: #16a34a;">-$${formattedDiscount}</td>
          </tr>
          `
              : ''
          }
          <tr style="border-top: 2px solid #0f172a; background-color: #f8fafc;">
            <td colspan="4" style="padding: 12px 10px; text-align: right; font-size: 15px; font-weight: 800; color: #0f172a;">TOTAL FACTURADO:</td>
            <td style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: 800; color: #e41414;">$${formattedTotal}</td>
          </tr>
        </tfoot>
      </table>

      <!-- INSTRUCCIONES DE SINCRONIZACIÓN -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin-top: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
        <strong style="color: #0f172a;">📌 Flujo de Sincronización Automática:</strong>
        <ol style="margin: 6px 0 0 0; padding-left: 20px;">
          <li>Al facturar los productos en GesCom, el stock del sistema de gestión se descontará de manera definitiva.</li>
          <li>En el próximo minuto, el <strong>middleware de sincronización</strong> detectará el stock actualizado en GesCom y lo reflejará en la tienda web.</li>
          <li>Cuando despaches el pedido, podés ingresar al panel de control web y cambiar el estado a <strong>ENVIADO</strong>.</li>
        </ol>
      </div>

      <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 11px;">
        <p style="margin: 0;">Papes Confort — Notificaciones automáticas del sistema</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: recipient,
      subject: `🚨 [GesCom] Pedido Pagado #${data.orderNumber} - $${formattedTotal} (${data.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'})`,
      html,
    });
  } catch (error: any) {
    console.warn(`[email.service] Error enviando correo de nuevo pedido para GesCom a ${recipient}:`, error.message);
  }
}



