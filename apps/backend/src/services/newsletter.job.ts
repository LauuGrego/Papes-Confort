import cron from 'node-cron';
import { getCampaigns, sendNewsletter } from './newsletter.service';

let isJobRunning = false;

/**
 * Revisa si una campaña debe ejecutarse en este momento según su frecuencia, días y horario
 */
export function shouldRunCampaign(
  campaign: {
    status: string;
    frequency: string;
    daysOfWeek: number[];
    time: string;
    lastSentAt?: string | null;
  },
  now: Date = new Date()
): boolean {
  if (campaign.status !== 'ACTIVE') {
    return false;
  }

  if (campaign.frequency === 'MANUAL') {
    return false;
  }

  // Parsear la hora programada "HH:mm"
  const [targetHourStr, targetMinStr] = (campaign.time || '10:00').split(':');
  const targetHour = parseInt(targetHourStr, 10);
  const targetMin = parseInt(targetMinStr, 10);

  // Obtener hora y minuto actual en zona horaria de Argentina
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value || String(now.getHours()), 10);
  const currentMin = parseInt(parts.find((p) => p.type === 'minute')?.value || String(now.getMinutes()), 10);
  const currentDayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.

  // Ventana de ejecución de 15 minutos (porque el cron corre cada 15 min)
  const currentTotalMin = currentHour * 60 + currentMin;
  const targetTotalMin = targetHour * 60 + targetMin;
  const diffMinutes = Math.abs(currentTotalMin - targetTotalMin);

  if (diffMinutes > 15) {
    return false;
  }

  // Verificar si ya se envió hoy para no duplicar el envío
  if (campaign.lastSentAt) {
    const lastSent = new Date(campaign.lastSentAt);
    const msSinceLastSend = now.getTime() - lastSent.getTime();
    const hoursSinceLastSend = msSinceLastSend / (1000 * 60 * 60);

    // Si ya se envió en las últimas 18 horas, no repetir hoy
    if (hoursSinceLastSend < 18) {
      return false;
    }
  }

  // Verificar según frecuencia
  if (campaign.frequency === 'DAILY') {
    return true;
  }

  if (campaign.frequency === 'WEEKLY') {
    const targetDays = Array.isArray(campaign.daysOfWeek) ? campaign.daysOfWeek : [1, 5];
    return targetDays.includes(currentDayOfWeek);
  }

  if (campaign.frequency === 'MONTHLY') {
    // Si es el primer día del mes o similar
    return now.getDate() === 1;
  }

  return false;
}

/**
 * Comprueba y dispara las campañas activas que correspondan al horario actual
 */
export async function checkAndDispatchScheduledCampaigns(): Promise<number> {
  if (isJobRunning) {
    return 0;
  }

  isJobRunning = true;
  let dispatchedCount = 0;

  try {
    const campaigns = await getCampaigns();
    const now = new Date();

    for (const campaign of campaigns) {
      if (shouldRunCampaign(campaign, now)) {
        console.log(`[newsletter.job] Despachando campaña programada "${campaign.title}" (${campaign.subject})...`);
        try {
          await sendNewsletter(
            {
              campaignId: campaign.id,
              subject: campaign.subject,
              content: campaign.content,
              previewText: campaign.previewText,
              ctaText: campaign.ctaText,
              ctaUrl: campaign.ctaUrl,
            },
            'Sistema (Programado)'
          );
          dispatchedCount++;
          console.log(`[newsletter.job] Campaña "${campaign.title}" enviada exitosamente.`);
        } catch (err: any) {
          console.error(`[newsletter.job] Error despachando campaña "${campaign.title}":`, err.message);
        }
      }
    }
  } catch (error: any) {
    console.error('[newsletter.job] Error en verificación de campañas programadas:', error.message);
  } finally {
    isJobRunning = false;
  }

  return dispatchedCount;
}

/**
 * Inicia el cron job de newsletter cada 15 minutos
 */
export function startNewsletterJob() {
  console.log('[newsletter.job] Inicializando cron job de novedades y newsletter (cada 15 minutos)...');

  // Ejecutar cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    await checkAndDispatchScheduledCampaigns();
  });
}
