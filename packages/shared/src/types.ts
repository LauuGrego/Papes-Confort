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
  role: UserRole;
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
  gescomName: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  finalPrice: number;       // Campo computado: basePrice * (1 - discountPercent / 100)
  discountPercent: number;
  stock: number;
  stockVisible: number;     // Campo computado: max(0, stock - safetyStock)
  brand: BrandDto;
  productType: ProductTypeDto;
  productCategory: ProductCategoryDto;
  images: ProductImageDto[];
  isOutlet: boolean;
  warrantyMonths: number;
  weightKg: number | null;
  dimensions: string | null; // e.g. "120x80x40"
  specs: Record<string, any>; // Atributos flexibles guardados como JSON en BD
  createdAt: string;
  updatedAt: string;
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

export type SettingsMap = Record<SettingKey, string | number | boolean>;

// ==========================================
// 3. Payloads (Requests / Auth / ABMs)
// ==========================================

// Autenticación
export interface LoginPayload {
  email: string;
  password?: string; // opcional si se implementa login sin contraseña (magic links) o estándar
}

export interface LoginResponseDto {
  user: UserPayload;
  token: string;
}

// Checkout
export interface CheckoutPayload {
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Webhooks de pago (e.g. Mobbex / Mercado Pago)
export interface MobbexWebhookPayload {
  checkoutId: string;
  reference: string;
  status: string; // e.g. "approved", "rejected"
  payment: {
    id: string;
    amount: number;
    currency: string;
    method: string;
    card?: {
      brand: string;
      type: string;
    };
  };
}

// Sincronización desde Middleware (GesCom)
export interface GesComSyncProduct {
  sku: string;
  gescomName: string;
  basePrice: number;
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
  discountPercent: number;
  stock: number;
  brandId: string;
  productTypeId: string;
  productCategoryId: string;
  isOutlet: boolean;
  warrantyMonths: number;
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
