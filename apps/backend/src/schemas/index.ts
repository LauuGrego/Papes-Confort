import { z } from 'zod';
import { PaymentMethod, ShippingType } from '@papes-confort/shared';

// 1. Order Creation
export const createOrderSchema = z.object({
  shippingType: z.enum([ShippingType.LOCAL_FREE, ShippingType.LOCAL_PAID, ShippingType.REMOTE], {
    message: 'Tipo de envío inválido o no especificado.',
  }),
  paymentMethod: z.enum([PaymentMethod.CARD, PaymentMethod.TRANSFER], {
    message: 'Método de pago inválido o no especificado.',
  }),
  shippingAddress: z.string().trim().min(1, 'La dirección de envío es obligatoria'),
  shippingCity: z.string().trim().min(1, 'La ciudad es obligatoria'),
  shippingPostalCode: z.string().trim().min(1, 'El código postal es obligatorio'),
  customerPhone: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional(),
});

// 2. Cart Items
export const addCartItemSchema = z.object({
  productId: z.string().min(1, 'productId es requerido'),
  quantity: z.number().int('quantity debe ser un entero').positive('quantity debe ser mayor a 0'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int('quantity debe ser un entero').min(0, 'quantity debe ser mayor o igual a 0'),
});

// 3. Admin Settings
export const updateAdminSettingsSchema = z
  .record(
    z.string().min(1, 'La clave no puede estar vacía').max(100),
    z.union([z.string(), z.number(), z.boolean()])
  )
  .refine((val) => Object.keys(val).length > 0, {
    message: 'El objeto de configuraciones no puede estar vacío',
  });

// 4. Sync Endpoints
export const syncProductItemSchema = z
  .object({
    sku: z.union([z.string(), z.number()]).transform(String),
    name: z.string().optional(),
    price: z.union([z.string(), z.number()]).optional(),
    stock: z.union([z.string(), z.number()]).optional(),
    rubro: z.string().optional(),
    subrubro: z.string().optional(),
    brandName: z.string().optional(),
    barcode: z.union([z.string(), z.number()]).optional(),
    description: z.string().optional(),
    weight: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const syncProductsSchema = z.object({
  products: z
    .array(syncProductItemSchema)
    .min(1, 'Se requiere al menos un producto para sincronizar'),
});

export const syncImageSchema = z.object({
  sku: z
    .union([z.string(), z.number()])
    .transform(String)
    .refine((val) => val.trim().length > 0, 'sku es requerido'),
  filename: z.string().min(1, 'filename es requerido'),
  url: z.string().url().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// 5. Mobbex Webhook
export const mobbexWebhookSchema = z
  .object({
    checkout: z
      .object({
        id: z.string().optional(),
        reference: z.string().optional(),
      })
      .optional(),
    data: z
      .object({
        checkout: z
          .object({
            id: z.string().optional(),
            reference: z.string().optional(),
          })
          .optional(),
        operations: z.array(z.any()).optional(),
      })
      .optional(),
    operations: z.array(z.any()).optional(),
    id: z.string().optional(),
  })
  .passthrough();
