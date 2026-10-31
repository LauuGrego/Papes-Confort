import { prisma } from '@papes-confort/database';
import {
  SubscriberDto,
  SubscriberFilters,
  SubscriberListResponse,
  NewsletterCampaignDto,
  NewsletterSendLogDto,
  SendNewsletterPayload,
} from '@papes-confort/shared';
import { sendEmail } from './email.service';

const SETTING_CAMPAIGNS_KEY = 'newsletter_campaigns';
const SETTING_LOGS_KEY = 'newsletter_send_logs';

/**
 * Obtiene la lista paginada y filtrada de suscriptores y clientes
 */
export async function getSubscribers(filters: SubscriberFilters): Promise<SubscriberListResponse> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: any = {
    deletedAt: null,
  };

  if (filters.status === 'subscribed') {
    where.marketingOptIn = true;
  } else if (filters.status === 'unsubscribed') {
    where.marketingOptIn = false;
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { city: { contains: s, mode: 'insensitive' } },
      { cuilCuit: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [customers, total, totalCustomers, totalSubscribed, totalUnsubscribed] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        province: true,
        cuilCuit: true,
        marketingOptIn: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, marketingOptIn: true } }),
    prisma.customer.count({ where: { deletedAt: null, marketingOptIn: false } }),
  ]);

  const subscribers: SubscriberDto[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    city: c.city,
    province: c.province,
    cuilCuit: c.cuilCuit,
    marketingOptIn: Boolean(c.marketingOptIn),
    isActive: Boolean(c.isActive),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt?.toISOString(),
    ordersCount: c._count.orders,
  }));

  return {
    subscribers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    totalCustomers,
    totalSubscribed,
    totalUnsubscribed,
  };
}

/**
 * Modifica el estado de suscripción de un cliente
 */
export async function toggleSubscriberStatus(customerId: string, marketingOptIn: boolean): Promise<SubscriberDto> {
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { marketingOptIn },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      province: true,
      cuilCuit: true,
      marketingOptIn: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { orders: true },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    city: updated.city,
    province: updated.province,
    cuilCuit: updated.cuilCuit,
    marketingOptIn: Boolean(updated.marketingOptIn),
    isActive: Boolean(updated.isActive),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt?.toISOString(),
    ordersCount: updated._count.orders,
  };
}

/**
 * Obtiene todas las campañas de newsletter configuradas
 */
export async function getCampaigns(): Promise<NewsletterCampaignDto[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_CAMPAIGNS_KEY },
  });

  if (!setting || !setting.value) {
    return [];
  }

  try {
    const list = JSON.parse(setting.value);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('[newsletter.service] Error parseando campañas:', e);
    return [];
  }
}

/**
 * Guarda o actualiza una campaña de newsletter
 */
export async function saveCampaign(campaign: Partial<NewsletterCampaignDto>): Promise<NewsletterCampaignDto> {
  const campaigns = await getCampaigns();
  const now = new Date().toISOString();

  let target: NewsletterCampaignDto;

  if (campaign.id) {
    const index = campaigns.findIndex((c) => c.id === campaign.id);
    if (index >= 0) {
      target = {
        ...campaigns[index],
        ...campaign,
        updatedAt: now,
      } as NewsletterCampaignDto;
      campaigns[index] = target;
    } else {
      target = {
        id: campaign.id,
        title: campaign.title || 'Nueva Campaña',
        subject: campaign.subject || 'Novedades de Papes Confort',
        previewText: campaign.previewText || '',
        content: campaign.content || '',
        ctaText: campaign.ctaText || '',
        ctaUrl: campaign.ctaUrl?.trim() || 'https://papesconfort.com.ar/catalogo',
        frequency: campaign.frequency || 'WEEKLY',
        daysOfWeek: Array.isArray(campaign.daysOfWeek) ? campaign.daysOfWeek : [1, 5],
        time: campaign.time || '10:00',
        status: campaign.status || 'ACTIVE',
        lastSentAt: campaign.lastSentAt || null,
        lastSentCount: campaign.lastSentCount || 0,
        createdAt: now,
        updatedAt: now,
      };
      campaigns.push(target);
    }
  } else {
    target = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: campaign.title || 'Nueva Campaña',
      subject: campaign.subject || 'Novedades de Papes Confort',
      previewText: campaign.previewText || '',
      content: campaign.content || '',
      ctaText: campaign.ctaText || '',
      ctaUrl: campaign.ctaUrl?.trim() || 'https://papesconfort.com.ar/catalogo',
      frequency: campaign.frequency || 'WEEKLY',
      daysOfWeek: Array.isArray(campaign.daysOfWeek) ? campaign.daysOfWeek : [1, 5],
      time: campaign.time || '10:00',
      status: campaign.status || 'ACTIVE',
      lastSentAt: null,
      lastSentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    campaigns.push(target);
  }

  await prisma.setting.upsert({
    where: { key: SETTING_CAMPAIGNS_KEY },
    update: { value: JSON.stringify(campaigns) },
    create: { key: SETTING_CAMPAIGNS_KEY, value: JSON.stringify(campaigns) },
  });

  return target;
}

/**
 * Elimina una campaña de newsletter
 */
export async function deleteCampaign(campaignId: string): Promise<boolean> {
  const campaigns = await getCampaigns();
  const filtered = campaigns.filter((c) => c.id !== campaignId);

  await prisma.setting.upsert({
    where: { key: SETTING_CAMPAIGNS_KEY },
    update: { value: JSON.stringify(filtered) },
    create: { key: SETTING_CAMPAIGNS_KEY, value: JSON.stringify(filtered) },
  });

  return true;
}

/**
 * Obtiene el historial de envíos de newsletter
 */
export async function getSendLogs(): Promise<NewsletterSendLogDto[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_LOGS_KEY },
  });

  if (!setting || !setting.value) {
    return [];
  }

  try {
    const list = JSON.parse(setting.value);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('[newsletter.service] Error parseando logs de newsletter:', e);
    return [];
  }
}

/**
 * Agrega un registro al historial de envíos
 */
async function addSendLog(log: NewsletterSendLogDto) {
  try {
    const logs = await getSendLogs();
    logs.unshift(log); // Lo más reciente primero
    const trimmed = logs.slice(0, 50); // Guardar los últimos 50 envíos

    await prisma.setting.upsert({
      where: { key: SETTING_LOGS_KEY },
      update: { value: JSON.stringify(trimmed) },
      create: { key: SETTING_LOGS_KEY, value: JSON.stringify(trimmed) },
    });
  } catch (e) {
    console.error('[newsletter.service] Error guardando log de envío:', e);
  }
}

/**
 * Construye la plantilla HTML del correo para la campaña
 */
export function renderNewsletterHtml(params: {
  subject: string;
  content: string;
  previewText?: string;
  ctaText?: string;
  ctaUrl?: string;
  customerName?: string;
  customerEmail?: string;
}): string {
  const firstName = params.customerName ? params.customerName.split(' ')[0] : 'Cliente';
  
  // Reemplazar variables dinámicas
  let formattedContent = params.content
    .replace(/\{\{nombre\}\}/gi, firstName)
    .replace(/\{\{email\}\}/gi, params.customerEmail || '');

  // Si no contiene tags HTML, convertir saltos de línea a párrafos
  if (!/<[a-z][\s\S]*>/i.test(formattedContent)) {
    formattedContent = formattedContent
      .split('\n\n')
      .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155; font-size: 15px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  const ctaButton = params.ctaText && params.ctaUrl
    ? `
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${params.ctaUrl}" style="background-color: #e41414; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(228, 20, 20, 0.25);">
          ${params.ctaText}
        </a>
      </div>
    `
    : '';

  const preheaderSnippet = params.previewText
    ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${params.previewText}</div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${params.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${preheaderSnippet}
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 28px 32px; background: linear-gradient(135deg, #ffffff 0%, #fff5f5 100%); border-bottom: 2px solid #fee2e2; text-align: center;">
                  <h1 style="color: #e41414; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PAPES CONFORT</h1>
                  <p style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0 0 0;">Hogar & Confort</p>
                </td>
              </tr>

              <!-- Greeting & Content -->
              <tr>
                <td style="padding: 32px 32px 24px 32px;">
                  <div style="margin-bottom: 20px;">
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">¡Hola ${firstName}!</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Tenemos novedades y promociones preparadas para vos:</p>
                  </div>

                  <div style="background-color: #ffffff; padding: 4px 0;">
                    ${formattedContent}
                  </div>

                  ${ctaButton}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
                    Recibís este correo porque te suscribiste a novedades y ofertas exclusivas de <strong>Papes Confort</strong>.
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 12px 0;">
                    Podés administrar tus preferencias de suscripción en cualquier momento desde tu perfil en nuestra web.
                  </p>
                  <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 8px;">
                    <p style="color: #64748b; font-size: 12px; font-weight: 600; margin: 0;">Papes Confort — Basavilbaso, Entre Ríos</p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">© ${new Date().getFullYear()} Papes Confort. Todos los derechos reservados.</p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Envía el newsletter de forma inmediata (a prueba o a todos los clientes suscritos)
 */
export async function sendNewsletter(payload: SendNewsletterPayload, sentBy: string = 'Administrador') {
  const { subject, content, previewText, ctaText, ctaUrl, testEmail, campaignId } = payload;

  if (!subject || !subject.trim()) {
    throw new Error('El asunto del correo es obligatorio.');
  }
  if (!content || !content.trim()) {
    throw new Error('El contenido del mensaje no puede estar vacío.');
  }

  // 1. Envío de Prueba a un email específico
  if (testEmail && testEmail.trim()) {
    const html = renderNewsletterHtml({
      subject,
      content,
      previewText,
      ctaText,
      ctaUrl,
      customerName: 'Admin (Prueba)',
      customerEmail: testEmail.trim(),
    });

    await sendEmail({
      to: testEmail.trim(),
      subject: `[PRUEBA] ${subject}`,
      html,
    });

    return {
      success: true,
      isTest: true,
      recipientCount: 1,
      successCount: 1,
      errorCount: 0,
      message: `Correo de prueba enviado con éxito a ${testEmail.trim()}`,
    };
  }

  // 2. Envío real a todos los clientes con marketingOptIn = true
  const recipients = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      marketingOptIn: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (recipients.length === 0) {
    throw new Error('No hay usuarios suscriptos activos para recibir el correo.');
  }

  let successCount = 0;
  let errorCount = 0;

  // Enviar en tandas pequeñas (batch de 5) con un breve delay de 300ms para evitar rate limiting
  const BATCH_SIZE = 5;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (customer) => {
        try {
          const html = renderNewsletterHtml({
            subject,
            content,
            previewText,
            ctaText,
            ctaUrl,
            customerName: customer.name,
            customerEmail: customer.email,
          });

          await sendEmail({
            to: customer.email,
            subject,
            html,
          });
          successCount++;
        } catch (err: any) {
          console.warn(`[newsletter.service] Error enviando a ${customer.email}:`, err.message);
          errorCount++;
        }
      })
    );

    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  const sendLog: NewsletterSendLogDto = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    campaignId: campaignId || undefined,
    campaignTitle: payload.subject,
    subject,
    sentAt: new Date().toISOString(),
    recipientCount: recipients.length,
    successCount,
    errorCount,
    sentBy,
  };

  await addSendLog(sendLog);

  // Si está vinculado a una campaña, actualizar última fecha y cantidad enviada
  if (campaignId) {
    try {
      const campaigns = await getCampaigns();
      const campIndex = campaigns.findIndex((c) => c.id === campaignId);
      if (campIndex >= 0) {
        campaigns[campIndex].lastSentAt = new Date().toISOString();
        campaigns[campIndex].lastSentCount = successCount;
        await prisma.setting.upsert({
          where: { key: SETTING_CAMPAIGNS_KEY },
          update: { value: JSON.stringify(campaigns) },
          create: { key: SETTING_CAMPAIGNS_KEY, value: JSON.stringify(campaigns) },
        });
      }
    } catch (e) {
      console.error('[newsletter.service] Error actualizando última ejecución de campaña:', e);
    }
  }

  return {
    success: true,
    isTest: false,
    recipientCount: recipients.length,
    successCount,
    errorCount,
    message: `Notificación enviada a ${successCount} de ${recipients.length} suscriptores (${errorCount} errores).`,
  };
}
