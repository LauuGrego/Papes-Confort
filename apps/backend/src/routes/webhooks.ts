import { Router, Request, Response } from 'express';
import { MobbexWebhookPayload } from '@papes-confort/shared';
import { validateWebhook, mapMobbexStatus } from '../services/mobbex.service';
import { applyPaymentResult } from '../services/order.service';

const router = Router();

// POST /api/webhooks/mobbex (PÚBLICO)
router.post('/mobbex', (req: Request, res: Response) => {
  // 1. Responder inmediatamente a Mobbex con 200 { result: true } para ack
  res.status(200).json({ result: true });

  // 2. Procesar el webhook de forma asíncrona mediante setImmediate
  setImmediate(async () => {
    try {
      const payload = req.body as MobbexWebhookPayload & { data?: any; id?: string };
      console.log('[Mobbex Webhook] Payload recibido:', JSON.stringify(payload));

      const checkoutId =
        payload.checkout?.id ||
        payload.data?.checkout?.id ||
        payload.id;

      const reference =
        payload.checkout?.reference ||
        payload.data?.checkout?.reference ||
        payload.operations?.[0]?.payment?.reference;

      if (!checkoutId && !reference) {
        console.warn('[Mobbex Webhook] Webhook ignorado: no contiene checkoutId ni reference válidos.');
        return;
      }

      // Validar consulta real a la API de Mobbex para evitar falsificaciones
      if (checkoutId && reference) {
        const isValid = await validateWebhook(checkoutId, reference);
        if (!isValid) {
          console.warn(`[Mobbex Webhook] Validación de webhook falló para checkoutId: ${checkoutId}, reference: ${reference}`);
        }
      }

      // Extraer datos de la primera operación de pago
      const operations = payload.operations || payload.data?.operations || [];
      const primaryOp = operations[0];

      const statusCode = primaryOp?.payment?.status?.code ?? 0;
      const paymentId = primaryOp?.payment?.id;
      const cardBrand = primaryOp?.card?.brand?.name;
      const installments = (primaryOp as any)?.checkout?.installments;

      const paymentResult = mapMobbexStatus(statusCode);
      const targetReference = reference || checkoutId!;

      console.log(
        `[Mobbex Webhook] Aplicando resultado para ${targetReference}: status ${statusCode} -> ${paymentResult}`
      );

      await applyPaymentResult(targetReference, paymentResult, {
        paymentId,
        installments: typeof installments === 'number' ? installments : undefined,
        cardBrand,
        paymentStatus: String(statusCode),
      });

      console.log(`[Mobbex Webhook] Resultado aplicado exitosamente para orden ${targetReference}`);
    } catch (err: any) {
      console.error('[Mobbex Webhook] Error procesando webhook asíncrono:', err.message);
    }
  });
});

export default router;
