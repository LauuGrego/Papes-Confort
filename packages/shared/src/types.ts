import {
  UserRole,
  OrderStatus,
  PaymentMethod,
  ShippingType,
  CartStatus,
  WarrantyStatus,
  SyncStatus,
  SettingKey
} from './enums';

// ==========================================
// 1. Tipos Base
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole | 'CUSTOMER';
  type: 'admin' | 'customer';
  name?: string;
}

// ==========================================
// 2. DTOs (Data Transfer Objects)
// ==========================================

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface ProductTypeDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductCategoryDto {
  id: string;
  name: string;
  slug: string;
  productTypeId: string;
}

export interface ProductImageDto {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDto {
  id: string;
  sku: string;
  gescomId?: number | null;
  barcode?: string | null;
  gescomName: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  listPrice: number;
  finalPrice: number;       // Campo computado: basePrice * (1 - discountPercent / 100)
  discountPercent: number;
  stock: number;
  stockVisible: number;     // Campo computado: max(0, stock - safetyStock)
  brand: BrandDto;
  productType: ProductTypeDto;
  productCategory: ProductCategoryDto;
  images: ProductImageDto[];
  isOutlet: boolean;
  isActive: boolean;
  warrantyMonths: number | null;
  weightKg: number | null;
  dimensions: string | null; // e.g. "120x80x40"
  specs: Record<string, any>; // Atributos flexibles guardados como JSON en BD
  createdAt: string;
  updatedAt: string;
}

export interface OfferDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discountPercent: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  products?: ProductDto[];
}

export interface CreateOfferDto {
  name: string;
  slug?: string;
  description?: string;
  discountPercent?: number;
  isActive?: boolean;
}

export interface UpdateOfferDto {
  name?: string;
  slug?: string;
  description?: string;
  discountPercent?: number;
  isActive?: boolean;
}

export interface BankAccountDto {
  id: string;
  alias: string;
  cbu: string;
  bankName: string;
  accountHolder: string;
  isActive: boolean;
}

export interface PromotionDto {
  id: string;
  bankName: string;
  cardType: string; // e.g. "VISA", "MASTERCARD"
  dayOfWeek: number; // 0 (Domingo) a 6 (Sábado)
  discountPercent: number;
  maxReimbursement: number | null;
  installmentsTotal: number;
  installmentsPaid: number; // e.g. 3 cuotas sin interés
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export interface CartDto {
  id: string;
  sessionId: string;
  customerId?: string | null;
  status: CartStatus;
  items: CartItemDto[];
  subtotal: number;       // Campo computado: sum(item.total)
  totalItems: number;
}

export interface CartItemDto {
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;      // Precio base del producto al agregarlo
  discount: number;       // Descuento al agregarlo
  total: number;          // Campo computado: (unitPrice * (1 - discount / 100)) * quantity
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingType: ShippingType;
  subtotal: number;
  shippingCost: number;
  bankDiscount: number;
  total: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  notes: string | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface OrderItemDetailDto extends OrderItemDto {
  imageUrl?: string | null;
}

export interface OrderDetailDto extends OrderDto {
  gatewayCheckoutId: string | null;
  installmentsCount: number | null;
  paymentStatus: string | null;
  bankAccount?: BankAccountDto | null;
  items: OrderItemDetailDto[];
}

export interface WarrantyDto {
  id: string;
  orderNumber: string;
  customerEmail: string;
  productName: string;
  status: WarrantyStatus;
  purchaseDate: string;
  warrantyMonths: number;
  expiryDate: string;
}

export interface SyncLogDto {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  productsUpdated: number;
  productsCreated: number;
  imagesUploaded: number;
  imagesSkipped: number;
  brandsCreated: number;
  status: SyncStatus;
  errors: string | null;
}

export type FlyerAspectRatio = 'ultrawide' | 'wide' | 'compact' | 'tall';
export type FlyerObjectFit = 'cover' | 'contain';
export type FlyerObjectPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface HomeFlyerDto {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  images?: string[];
  badge?: string;
  linkUrl?: string;
  buttonText?: string;
  isActive: boolean;
  sortOrder: number;
  aspectRatio?: FlyerAspectRatio;
  objectFit?: FlyerObjectFit;
  objectPosition?: string;
  objectPositionX?: number;
  objectPositionY?: number;
}

export interface PaymentFeatureCardDto {
  id: string;
  title: string;
  description: string;
  icon: 'credit-card' | 'percent' | 'qr-code' | 'truck' | 'shield';
  isActive: boolean;
  sortOrder: number;
}

export interface InstallmentsConfigDto {
  defaultInstallments: number; // Ej: 5
  bankPromoActive: boolean; // Ej: true
  bankPromoName: string; // Ej: 'Banco Nación'
  bankPromoInstallments: number; // Ej: 9
  bankPromoText?: string; // Ej: 'Hasta 9 cuotas sin interés con Banco Nación'
}

export const DEFAULT_INSTALLMENTS_CONFIG: InstallmentsConfigDto = {
  defaultInstallments: 5,
  bankPromoActive: true,
  bankPromoName: 'Banco Nación',
  bankPromoInstallments: 9,
  bankPromoText: 'Hasta 9 cuotas sin interés con Banco Nación',
};

export interface HomeHeroBannerDto {
  imageUrl: string;
  images?: string[];
  badgeText?: string;
  title?: string;
  subtitle?: string;
  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;
  searchTags?: string[];
  linkUrl?: string;
  showBadge?: boolean;
  objectFit?: 'cover' | 'contain';
  objectPositionX?: number;
  objectPositionY?: number;
}

export const DEFAULT_HERO_BANNER: HomeHeroBannerDto = {
  imageUrl: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184609/papes-confort/landing/hero_home_ambience.jpg',
  badgeText: 'Confort para todos los días',
  title: 'TODO PARA EQUIPAR TU HOGAR',
  subtitle: 'Electrodomésticos, climatización y confort para todos los días con la calidez y el respaldo de siempre.',
  primaryBtnText: 'Ver Catálogo',
  primaryBtnUrl: '/catalogo',
  secondaryBtnText: 'Ver Ofertas',
  secondaryBtnUrl: '#oferta-semanal',
  searchTags: ['Heladeras', 'Lavarropas', 'Smart TV', 'Colchones', 'Aires'],
  linkUrl: '',
  showBadge: true,
  objectFit: 'cover',
  objectPositionX: 50,
  objectPositionY: 50,
};

export interface HomeCategoryCardDto {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
  isActive: boolean;
  sortOrder: number;
}

export const DEFAULT_CATEGORY_CARDS: HomeCategoryCardDto[] = [
  {
    id: 'heladeras',
    name: 'Heladeras',
    description: 'No frost, inverter y frigobares',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184610/papes-confort/landing/cat_heladeras.jpg',
    href: '/catalogo?search=heladera',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'lavarropas',
    name: 'Lavarropas',
    description: 'Carga frontal, superior y secarropas',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184612/papes-confort/landing/cat_lavarropas.jpg',
    href: '/catalogo?search=lavarropas',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'television',
    name: 'Televisión',
    description: 'Smart TV 4K, audio y barras de sonido',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184613/papes-confort/landing/cat_television.jpg',
    href: '/catalogo?search=tv',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'climatizacion',
    name: 'Climatización',
    description: 'Aires acondicionados frío/calor',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184614/papes-confort/landing/cat_climatizacion.jpg',
    href: '/catalogo?search=aire',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'colchones',
    name: 'Colchones',
    description: 'Sommiers, 1 y 2 plazas, almohadas',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184615/papes-confort/landing/cat_colchones.jpg',
    href: '/catalogo?search=colchon',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'cocinas',
    name: 'Cocinas',
    description: 'Cocinas a gas, anafes y hornos empotrables',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184616/papes-confort/landing/cat_cocinas.jpg',
    href: '/catalogo?search=cocina',
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'pequenos',
    name: 'Pequeños Electro',
    description: 'Cafeteras, licuadoras, tostadoras y más',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184617/papes-confort/landing/cat_pequenos.jpg',
    href: '/catalogo?search=electro',
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'hogar',
    name: 'Hogar & Confort',
    description: 'Ventiladores, calefacción y bazar',
    image: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184618/papes-confort/landing/cat_hogar.jpg',
    href: '/catalogo?search=hogar',
    isActive: true,
    sortOrder: 8,
  },
];

export interface HomeWeeklyOfferDto {
  badge: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  tagCategory: string;
  productHeadline: string;
  cuotasText: string;
  cashDiscountText: string;
  warrantyText: string;
  linkText: string;
  linkUrl: string;
  mainCtaText: string;
  mainCtaUrl: string;
  isActive: boolean;
}

export const DEFAULT_WEEKLY_OFFER: HomeWeeklyOfferDto = {
  badge: 'Oportunidad de la semana',
  title: 'OFERTAS DE LA SEMANA',
  subtitle: 'Aprovechá precios especiales y planes de financiación exclusivos en productos seleccionados para renovar el confort de tu hogar.',
  imageUrl: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184614/papes-confort/landing/cat_climatizacion.jpg',
  tagCategory: 'Climatización y Confort',
  productHeadline: 'Equipá tu casa con la mejor tecnología en frío/calor',
  cuotasText: 'Hasta 12 cuotas fijas',
  cashDiscountText: 'Descuento al contado',
  warrantyText: 'Garantía oficial',
  linkText: 'Ver modelos',
  linkUrl: '/catalogo?search=aire',
  mainCtaText: 'Ver Todas las Ofertas',
  mainCtaUrl: '/catalogo',
  isActive: true,
};

export interface HomeTrustBarItemDto {
  id: string;
  icon: 'truck' | 'credit-card' | 'percent' | 'shield';
  title: string;
  description: string;
  href: string;
  isActive: boolean;
}

export const DEFAULT_TRUST_BAR: HomeTrustBarItemDto[] = [
  {
    id: 'envios',
    icon: 'truck',
    title: 'Envíos y Entregas',
    description: 'Sin cargo en radio urbano y a todo el país',
    href: '/catalogo',
    isActive: true,
  },
  {
    id: 'cuotas',
    icon: 'credit-card',
    title: 'Financiación a tu medida',
    description: 'Hasta 12 cuotas con tarjetas',
    href: '#medios-de-pago',
    isActive: true,
  },
  {
    id: 'ofertas',
    icon: 'percent',
    title: 'Precios especiales',
    description: 'Descuentos y promos de la semana',
    href: '#oferta-semanal',
    isActive: true,
  },
  {
    id: 'garantia',
    icon: 'shield',
    title: 'Garantía oficial',
    description: 'Respaldo directo de marcas líderes',
    href: '#sobre-nosotros',
    isActive: true,
  },
];

export interface HomeAboutDto {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  imageUrl: string;
  storeLocation: string;
  whatsappMessage: string;
  primaryBtnText: string;
  secondaryBtnText: string;
  secondaryBtnUrl: string;
  isActive: boolean;
}

export const DEFAULT_ABOUT_SECTION: HomeAboutDto = {
  badge: 'Nuestra Historia & Compromiso',
  title: 'Más que electrodomésticos,',
  titleHighlight: 'confort para tu vida',
  description: 'En Papes Confort creemos que comprar para tu casa debe ser una experiencia simple, transparente y cercana. Desde nuestro local en Basavilbaso, Entre Ríos, te acompañamos para elegir el producto que mejor se adapta a tus necesidades y a tu presupuesto.',
  imageUrl: 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184619/papes-confort/landing/edificio_central.webp',
  storeLocation: 'Basavilbaso, Entre Ríos • Atención personalizada',
  whatsappMessage: '¡Hola Papes Confort! Me gustaría hacerles una consulta sobre sus productos y envíos.',
  primaryBtnText: 'Contactar a un asesor por WhatsApp',
  secondaryBtnText: 'Ver catálogo completo',
  secondaryBtnUrl: '/catalogo',
  isActive: true,
};

export type SettingsMap = Record<SettingKey, string | number | boolean>;

// ==========================================
// 3. Payloads (Requests / Auth / ABMs)
// ==========================================

export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  hasPassword?: boolean;
  phone: string | null;
  cuilCuit: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Autenticación
export interface LoginPayload {
  email: string;
  password?: string; // opcional si se implementa login sin contraseña (magic links) o estándar
}

export interface GoogleAuthPayload {
  credential?: string;
  code?: string;
  password?: string;
}

export interface GoogleAuthResponseDto {
  user?: UserPayload;
  token?: string;
  customer?: CustomerDto;
  requiresPassword?: boolean;
  tempUser?: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cuilCuit?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  marketingOptIn?: boolean;
}

export interface RegisterConfirmPayload {
  email: string;
  code: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string | null;
  cuilCuit?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  marketingOptIn?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

export interface ChangePasswordConfirmPayload {
  code: string;
}

export interface ChangeEmailRequestPayload {
  newEmail: string;
  currentPassword: string;
}

export interface ChangeEmailConfirmPayload {
  code: string;
}

export interface LoginResponseDto {
  user: UserPayload;
  token: string;
  customer?: CustomerDto;
  requiresPassword?: boolean;
  tempUser?: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export type CustomerAuthResponseDto = LoginResponseDto;

// Checkout
export interface CreateOrderPayload {
  shippingType: ShippingType;
  paymentMethod: PaymentMethod;   // CARD | TRANSFER
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  customerPhone: string;
  notes?: string;
}

export interface CreateOrderResponseDto {
  order: OrderDetailDto;
  paymentUrl: string | null;      // null si TRANSFER (sin gateway)
  bankAccount?: BankAccountDto;   // datos para abonar transferencia
}

// Payload real hacia Mobbex (se arma en el backend)
export interface MobbexCheckoutPayload {
  total: number;
  currency: 'ARS';
  reference: string;                  // = order.orderNumber
  description: string;
  customer: {
    email: string;
    name: string;
    identification?: string | null;
  };
  items: Array<{
    image?: string;
    name: string;
    description: string;
    quantity: number;
    total: number;
    unit_price: number;
  }>;
  options: {
    card_brand?: {
      source: string[];
    };
  };   // solo tarjetas
  return_url: string;
  webhook: string;
  test: boolean;
  timeout: number;                    // minutos
  webhooksType: 'enabled';
}

// Shape REAL del webhook Mobbex
export interface MobbexWebhookPayload {
  type: 'checkout';
  checkout?: {
    id: string;
    reference: string;
  };
  operations: Array<{
    type: 'payment';
    payment: {
      id: string;
      reference: string;
      status: {
        code: number;
        message: string;
      };
    };
    card?: {
      brand: {
        name: string;
      };
    };
  }>;
}

// Tipos admin para órdenes
export interface AdminOrderFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ConfirmTransferPayload {
  bankAccountId: string;
}

// Sincronización desde Middleware (GesCom)
export interface GesComSyncProduct {
  sku: string;
  gescomName: string;
  basePrice: number;
  listPrice?: number;
  stock: number;
  brandName: string;
  gescomId?: string;
}

export interface GesComSyncImage {
  sku: string;
  filename: string;
  fileBuffer?: string; // codificado en Base64 o FormData según implementación final
}

// Payloads de creación/edición (Admin ABM)
export interface CreateProductPayload {
  sku: string;
  gescomName: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  listPrice?: number;
  discountPercent: number;
  stock: number;
  brandId: string;
  productTypeId: string;
  productCategoryId: string;
  isOutlet: boolean;
  warrantyMonths?: number | null;
  weightKg?: number;
  dimensions?: string;
  specs?: Record<string, any>;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface CreateBankAccountPayload {
  alias: string;
  cbu: string;
  bankName: string;
  accountHolder: string;
  isActive: boolean;
}

export type UpdateBankAccountPayload = Partial<CreateBankAccountPayload>;

export interface CreatePromotionPayload {
  bankName: string;
  cardType: string;
  dayOfWeek: number;
  discountPercent: number;
  maxReimbursement?: number | null;
  installmentsTotal: number;
  installmentsPaid: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;

export interface UpdateSettingsPayload {
  settings: Partial<SettingsMap>;
}

// Carrito
export interface AddCartItemPayload {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

