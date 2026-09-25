import { env } from '../config/env';
import { PaymentResult, MobbexCheckoutPayload } from '@papes-confort/shared';
import { Order, OrderItem } from '@prisma/client';

const MOBBEX_API = 'https://api.mobbex.com/p';

const cardsOnly = {
  card_brand: {
    source: [
      'cmr',
      'diners',
      'master',
      'naranja',
      'nevada',
      'visa',
      'cabal',
      'argencard',
      'tarshop',
      'mercadopago',
      'american',
    ],
  },
};

export interface CreateMobbexCheckoutArgs {
  order: Order;
  items: OrderItem[];
  returnUrl: string;
  webhookUrl: string;
  customerIdentification?: string | null;
  timeoutMinutes?: number;
}

export async function createMobbexCheckout(
  args: CreateMobbexCheckoutArgs
): Promise<{ checkoutId: string; url: string }> {
  const { order, items, returnUrl, webhookUrl, customerIdentification, timeoutMinutes } = args;

  if (!env.MOBBEX_API_KEY || !env.MOBBEX_ACCESS_TOKEN) {
    throw new Error('Credenciales de Mobbex (API Key / Access Token) no configuradas en el servidor.');
  }

  const timeout = timeoutMinutes || env.MOBBEX_TIMEOUT_MINUTES || 15;

  const checkoutItems = items.map((item) => ({
    name: item.productNameSnapshot,
    description: `SKU: ${item.skuSnapshot} x ${item.quantity}`,
    quantity: item.quantity,
    unit_price: Number(item.unitPrice),
    total: Number(item.total),
  }));

  // Si hay costo de envío, agregarlo como ítem de checkout si corresponde
  if (Number(order.shippingCost) > 0) {
    checkoutItems.push({
      name: 'Costo de Envío',
      description: 'Envío local a domicilio',
      quantity: 1,
      unit_price: Number(order.shippingCost),
      total: Number(order.shippingCost),
    });
  }

  const payload: MobbexCheckoutPayload = {
    total: Number(order.total),
    currency: 'ARS',
    reference: order.orderNumber,
    description: `Pedido ${order.orderNumber} - Papes Confort`,
    customer: {
      email: order.customerEmail,
      name: order.customerName,
      identification: customerIdentification || null,
    },
    items: checkoutItems,
    options: cardsOnly,
    return_url: returnUrl,
    webhook: webhookUrl,
    test: env.MOBBEX_TEST_MODE,
    timeout,
    webhooksType: 'enabled',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${MOBBEX_API}/checkout`, {
      method: 'POST',
      headers: {
        'x-api-key': env.MOBBEX_API_KEY,
        'x-access-token': env.MOBBEX_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json() as any;

    if (!response.ok || !data || data.result === false) {
      const errorMsg = data?.error || data?.status?.message || data?.message || 'Error desconocido al crear checkout en Mobbex';
      throw new Error(`Error Mobbex (${response.status}): ${errorMsg}`);
    }

    const checkoutData = data.data;
    if (!checkoutData?.id || !checkoutData?.url) {
      throw new Error('Mobbex no retornó un checkoutId o URL válido');
    }

    return {
      checkoutId: checkoutData.id,
      url: checkoutData.url,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout al comunicarse con Mobbex API (15s excedidos)');
    }
    throw error;
  }
}

export async function getCheckoutStatus(
  checkoutId: string
): Promise<{ statusCode: number; approved: boolean; reference?: string; rawData?: any }> {
  if (!env.MOBBEX_API_KEY || !env.MOBBEX_ACCESS_TOKEN) {
    throw new Error('Credenciales de Mobbex no configuradas');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${MOBBEX_API}/checkout/status?id=${encodeURIComponent(checkoutId)}`, {
      method: 'GET',
      headers: {
        'x-api-key': env.MOBBEX_API_KEY,
        'x-access-token': env.MOBBEX_ACCESS_TOKEN,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json() as any;

    if (!response.ok || !data) {
      throw new Error(`Error consultando estado en Mobbex (${response.status})`);
    }

    const statusCode = Number(data?.data?.status?.code ?? 0);
    const approved = statusCode === 200 || statusCode === 201;
    const reference = data?.data?.checkout?.reference || data?.data?.reference;

    return {
      statusCode,
      approved,
      reference,
      rawData: data?.data,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout consultando estado de Mobbex');
    }
    throw error;
  }
}

export function mapMobbexStatus(code: number): PaymentResult {
  if (code === 200 || code === 201) {
    return PaymentResult.APPROVED;
  }
  if (code === 302) {
    return PaymentResult.PENDING;
  }
  return PaymentResult.REJECTED;
}

export async function validateWebhook(checkoutId: string, reference: string): Promise<boolean> {
  try {
    const status = await getCheckoutStatus(checkoutId);
    // Si viene reference en el status de Mobbex, debe coincidir con la orden
    if (status.reference && status.reference !== reference) {
      return false;
    }
    // Si respondió status code válido
    return status.statusCode > 0;
  } catch (error) {
    console.error(`[Mobbex] Error validando webhook para checkoutId ${checkoutId}:`, error);
    return false;
  }
}
