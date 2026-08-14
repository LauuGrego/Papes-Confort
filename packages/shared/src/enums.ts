// Usar as const objects (no enums de TS) para compatibilidad con JSON/DB y APIs
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
  PENDING_GATEWAY: 'PENDING_GATEWAY',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  PAID: 'PAID',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ProductType = {
  NORMAL: 'NORMAL',
  OUTLET: 'OUTLET',
  OFFER: 'OFFER',
  BANK_PROMO: 'BANK_PROMO',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ShippingType = {
  LOCAL_FREE: 'LOCAL_FREE',
  LOCAL_PAID: 'LOCAL_PAID',
  REMOTE: 'REMOTE',
} as const;
export type ShippingType = (typeof ShippingType)[keyof typeof ShippingType];

export const CartStatus = {
  ACTIVE: 'ACTIVE',
  ORDERED: 'ORDERED',
  ABANDONED: 'ABANDONED',
} as const;
export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus];

export const WarrantyStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CLAIMED: 'CLAIMED',
} as const;
export type WarrantyStatus = (typeof WarrantyStatus)[keyof typeof WarrantyStatus];

export const SyncStatus = {
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

// Reglas de métodos de pago según tipo de producto
export const PAYMENT_RULES: Record<ProductType, PaymentMethod[]> = {
  [ProductType.NORMAL]: [PaymentMethod.CARD, PaymentMethod.TRANSFER],
  [ProductType.OUTLET]: [PaymentMethod.TRANSFER], // solo efectivo/transferencia
  [ProductType.OFFER]: [PaymentMethod.CARD, PaymentMethod.TRANSFER], // WhatsApp para cuotas
  [ProductType.BANK_PROMO]: [PaymentMethod.CARD], // solo tarjeta según promo bancaria
};

// Configuración predeterminada (Settings)
export const DEFAULT_SETTINGS = {
  free_shipping_threshold: 50000,    // monto mínimo para envío gratis local (ARS)
  safety_stock: 1,                   // unidades de colchón de stock
  whatsapp_number: '',               // número para botón de consulta WhatsApp
  gescom_images_path: '',            // ruta de la carpeta de imágenes GesCom
  gateway_reservation_minutes: 15,   // minutos de reserva de stock en Mercado Pago
  home_flyers: JSON.stringify([
    {
      id: 'flyer-1',
      title: 'Banner Promocional Inicial',
      imageUrl: '',
      linkUrl: '/catalogo',
      isActive: true,
      sortOrder: 1,
    },
  ]),
  home_payment_cards: JSON.stringify([
    {
      id: 'card-1',
      title: 'Hasta 12 cuotas sin interés',
      description: 'Con tarjetas bancarias seleccionadas en toda la tienda.',
      icon: 'credit-card',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'card-2',
      title: '10% de descuento',
      description: 'Abonando mediante transferencia bancaria inmediata.',
      icon: 'percent',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'card-3',
      title: 'Pago con QR y MODO',
      description: 'Escaneá de forma rápida y segura desde la app de tu banco.',
      icon: 'qr-code',
      isActive: true,
      sortOrder: 3,
    },
  ]),
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
