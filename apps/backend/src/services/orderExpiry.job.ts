import cron from 'node-cron';
import { prisma } from '@papes-confort/database';
import { OrderStatus } from '@papes-confort/shared';
import { restoreStockAndCancel } from './order.service';

let isRunning = false;

/**
 * Tarea periódica para expirar órdenes pendientes cuyo tiempo de reserva ha vencido.
 * Se ejecuta cada 5 minutos.
 */
export async function checkExpiredOrders(): Promise<number> {
  if (isRunning) {
    return 0;
  }

  isRunning = true;
  let expiredCount = 0;

  try {
    const now = new Date();

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PENDING_GATEWAY, OrderStatus.PENDING_CONFIRMATION],
        },
        gatewayExpiresAt: {
          lte: now,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        orderNumber: true,
        paymentMethod: true,
        gatewayExpiresAt: true,
      },
    });

    if (expiredOrders.length > 0) {
      console.log(`[orderExpiry.job] Encontradas ${expiredOrders.length} orden(es) vencida(s). Procesando cancelación y restauración de stock...`);

      for (const order of expiredOrders) {
        try {
          const reason =
            order.paymentMethod === 'CARD'
              ? 'Expiración automática por límite de tiempo en pasarela de pago'
              : 'Expiración automática por cumplirse el plazo límite de transferencia bancaria (72 h)';

          await restoreStockAndCancel(order.id, reason);
          expiredCount++;
          console.log(`[orderExpiry.job] Orden #${order.orderNumber} cancelada exitosamente.`);
        } catch (err: any) {
          console.error(`[orderExpiry.job] Error cancelando orden #${order.orderNumber}:`, err.message);
        }
      }
    }
  } catch (error: any) {
    console.error('[orderExpiry.job] Error durante la comprobación de órdenes expiradas:', error.message);
  } finally {
    isRunning = false;
  }

  return expiredCount;
}

/**
 * Inicia el cron job cada 5 minutos
 */
export function startOrderExpiryJob() {
  console.log('[orderExpiry.job] Inicializando cron job de expiración de stock (cada 5 minutos)...');
  
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    await checkExpiredOrders();
  });
}
