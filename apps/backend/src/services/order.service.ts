import { prisma } from '@papes-confort/database';
import {
  CreateOrderPayload,
  OrderDetailDto,
  OrderItemDetailDto,
  PaymentResult,
  AdminOrderFilters,
  PaginatedResponse,
  DEFAULT_SETTINGS,
  BankAccountDto,
  OrderStatus,
} from '@papes-confort/shared';
import { Customer, Order, OrderItem, Prisma } from '@prisma/client';
import { env } from '../config/env';
import { getOrCreateCart, getCartWithItems } from './cart.service';
import { createMobbexCheckout } from './mobbex.service';
import {
  sendCustomerOrderCreatedEmail,
  sendCustomerPaymentApprovedEmail,
  sendCustomerTransferPendingEmail,
  sendCustomerOrderCancelledEmail,
  sendAdminNewPaidOrderNotificationEmail,
} from './email.service';

/**
 * Mapea una orden de Prisma a OrderDetailDto
 */
export function mapOrderToDetailDto(
  order: any,
  items?: any[],
  bankAccount?: any
): OrderDetailDto {
  const rawItems = items || order.items || [];
  const itemDtos: OrderItemDetailDto[] = rawItems.map((item: any) => {
    let imageUrl: string | null = null;
    if (item.product?.images && item.product.images.length > 0) {
      const primary = item.product.images.find((img: any) => img.isPrimary) || item.product.images[0];
      imageUrl = primary?.url || null;
    }

    return {
      id: item.id,
      productId: item.productId,
      productName: item.productNameSnapshot || item.product?.name || 'Producto',
      sku: item.skuSnapshot || item.product?.sku || '',
      imageUrl,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      total: Number(item.total),
    };
  });

  const rawBankAccount = bankAccount || order.bankAccount;
  const bankAccountDto: BankAccountDto | null = rawBankAccount
    ? {
        id: rawBankAccount.id,
        alias: rawBankAccount.alias,
        cbu: rawBankAccount.cbu,
        bankName: rawBankAccount.bankName,
        accountHolder: rawBankAccount.accountHolder,
        isActive: rawBankAccount.isActive,
      }
    : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    shippingType: order.shippingType,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    bankDiscount: Number(order.bankDiscount),
    total: Number(order.total),
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone || '',
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    notes: order.notes,
    gatewayCheckoutId: order.gatewayCheckoutId,
    installmentsCount: order.installmentsCount,
    paymentStatus: order.paymentStatus,
    bankAccount: bankAccountDto,
    items: itemDtos,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
  };
}

/**
 * Genera un número de orden único con formato PC-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PC-${dateStr}-${randomSuffix}`;
}

/**
 * Obtiene el valor numérico de un setting de base de datos o el valor por defecto
 */
async function getSettingNumber(key: string, defaultValue: number): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (setting?.value) {
      const val = parseFloat(setting.value);
      if (!isNaN(val)) return val;
    }
  } catch {}
  return defaultValue;
}

/**
 * Obtiene el valor string de un setting de base de datos o el valor por defecto
 */
async function getSettingString(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (setting?.value) return setting.value;
  } catch {}
  return defaultValue;
}

/**
 * 1. Crear Orden desde el Carrito del Cliente
 */
export async function createOrderFromCart(
  customer: Customer,
  sessionId: string,
  payload: CreateOrderPayload,
  originUrl?: string
): Promise<{ order: OrderDetailDto; paymentUrl: string | null; bankAccount?: BankAccountDto }> {
  // 1. Obtener carrito activo del cliente o sesión
  const cart = await getOrCreateCart(sessionId, customer.id);
  const cartItems = await getCartWithItems(cart.id);

  if (!cartItems || cartItems.length === 0) {
    const error: any = new Error('El carrito de compras está vacío.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Revalidar precio y stock de cada ítem
  let calculatedSubtotal = 0;
  const verifiedItems: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    total: number;
    product: any;
  }> = [];

  for (const item of cartItems) {
    const product = item.product;
    if (!product || !product.isActive || product.deletedAt) {
      const error: any = new Error(`El producto "${product?.name || 'seleccionado'}" ya no se encuentra disponible.`);
      error.statusCode = 409;
      throw error;
    }

    if (item.quantity > product.stock) {
      const error: any = new Error(
        `Stock insuficiente para "${product.name}". Solicitadas: ${item.quantity}, disponibles: ${product.stock}.`
      );
      error.statusCode = 409;
      throw error;
    }

    const basePrice = Number(product.basePrice);
    const listPrice =
      product.listPrice !== null && product.listPrice !== undefined && Number(product.listPrice) > 0
        ? Number(product.listPrice)
        : basePrice > 0
        ? basePrice / 0.8
        : basePrice;
    const offerDiscount = Number(product.discountPercent);

    const unitPrice = offerDiscount > 0 ? listPrice * (1 - offerDiscount / 100) : basePrice;
    const itemTotal = unitPrice * item.quantity;
    calculatedSubtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice,
      discountPercent: offerDiscount,
      total: itemTotal,
      product,
    });
  }

  // 3. Costo de envío según shippingType
  let shippingCost = 0;
  if (payload.shippingType === 'LOCAL_PAID') {
    shippingCost = await getSettingNumber('local_shipping_cost', DEFAULT_SETTINGS.local_shipping_cost);
  }

  const calculatedTotal = calculatedSubtotal + shippingCost;

  // 4. Expiración de reserva según método de pago
  const now = new Date();
  let gatewayExpiresAt: Date;
  let reservationMinutes = 15;

  if (payload.paymentMethod === 'CARD') {
    reservationMinutes = await getSettingNumber(
      'gateway_reservation_minutes',
      env.MOBBEX_TIMEOUT_MINUTES || DEFAULT_SETTINGS.gateway_reservation_minutes
    );
    gatewayExpiresAt = new Date(now.getTime() + reservationMinutes * 60 * 1000);
  } else {
    const transferHours = await getSettingNumber(
      'transfer_expiration_hours',
      DEFAULT_SETTINGS.transfer_expiration_hours
    );
    gatewayExpiresAt = new Date(now.getTime() + transferHours * 60 * 60 * 1000);
  }

  // 5. Transacción atómica: descontar stock, crear Order y OrderItems, y cerrar carrito
  let createdOrder: Order;
  let createdOrderItems: OrderItem[];

  try {
    const result = await prisma.$transaction(async (tx) => {
      // a. Descontar stock atómicamente con condición gte
      for (const item of verifiedItems) {
        const updateRes = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updateRes.count === 0) {
          const err: any = new Error(
            `No hay suficiente stock para completar la compra de "${item.productName}".`
          );
          err.statusCode = 409;
          throw err;
        }
      }

      // b. Crear orden
      const initialStatus =
        payload.paymentMethod === 'CARD' ? OrderStatus.PENDING_GATEWAY : OrderStatus.PENDING_CONFIRMATION;

      const orderNumber = generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: initialStatus,
          paymentMethod: payload.paymentMethod,
          shippingType: payload.shippingType,
          subtotal: new Prisma.Decimal(calculatedSubtotal.toFixed(2)),
          shippingCost: new Prisma.Decimal(shippingCost.toFixed(2)),
          bankDiscount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(calculatedTotal.toFixed(2)),
          customerEmail: customer.email,
          customerName: customer.name,
          customerPhone: payload.customerPhone || customer.phone || '',
          shippingAddress: payload.shippingAddress,
          shippingCity: payload.shippingCity,
          shippingPostalCode: payload.shippingPostalCode,
          notes: payload.notes || null,
          gatewayExpiresAt,
        },
      });

      // c. Crear OrderItems con snapshots
      const itemsToCreate = verifiedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
        discount: new Prisma.Decimal(item.discountPercent.toFixed(2)),
        total: new Prisma.Decimal(item.total.toFixed(2)),
        productNameSnapshot: item.productName,
        skuSnapshot: item.sku,
      }));

      await tx.orderItem.createMany({
        data: itemsToCreate,
      });

      const orderItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });

      // d. Marcar carrito como ORDERED
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'ORDERED' },
      });

      return { order, orderItems };
    });

    createdOrder = result.order;
    createdOrderItems = result.orderItems;
  } catch (txError: any) {
    throw txError;
  }

  // 6. Si es con TARJETA (Mobbex): Crear Checkout en pasarela
  if (payload.paymentMethod === 'CARD') {
    const frontendBase = originUrl || env.CORS_ORIGIN || 'http://localhost:3000';
    const returnUrl = `${frontendBase}/pedido/resultado?orderNumber=${encodeURIComponent(createdOrder.orderNumber)}`;
    
    // Determinar URL de webhook
    const backendBase = env.MOBBEX_WEBHOOK_URL || `${frontendBase.replace(':3000', `:${env.PORT}`)}/api/webhooks/mobbex`;
    const webhookUrl = env.MOBBEX_WEBHOOK_URL || `${backendBase}`;

    try {
      const mobbexRes = await createMobbexCheckout({
        order: createdOrder,
        items: createdOrderItems,
        returnUrl,
        webhookUrl,
        customerIdentification: customer.cuilCuit,
        timeoutMinutes: reservationMinutes,
      });

      // Guardar gatewayCheckoutId y paymentUrl en la orden
      const updatedOrder = await prisma.order.update({
        where: { id: createdOrder.id },
        data: {
          gatewayCheckoutId: mobbexRes.checkoutId,
          paymentUrl: mobbexRes.url,
        },
      });

      // Enviar correo de confirmación de pedido generado
      sendCustomerOrderCreatedEmail({
        name: customer.name,
        email: customer.email,
        orderNumber: updatedOrder.orderNumber,
        total: Number(updatedOrder.total),
      }).catch(() => {});

      const itemsWithProduct = verifiedItems.map((vi, index) => ({
        ...createdOrderItems[index],
        product: vi.product,
      }));

      return {
        order: mapOrderToDetailDto(updatedOrder, itemsWithProduct),
        paymentUrl: mobbexRes.url,
        bankAccount: undefined,
      };
    } catch (mobbexErr: any) {
      // Si falla Mobbex, restaurar stock y cancelar inmediatamente
      await restoreStockAndCancel(createdOrder.id, `Fallo al iniciar checkout en pasarela Mobbex: ${mobbexErr.message}`);
      const err: any = new Error(`No se pudo iniciar la sesión de pago en Mobbex: ${mobbexErr.message}`);
      err.statusCode = 502;
      throw err;
    }
  }

  // 7. Si es TRANSFERENCIA: buscar cuenta bancaria activa
  let bankAccountDto: BankAccountDto | undefined;
  const activeBank = await prisma.bankAccount.findFirst({
    where: { isActive: true },
  });

  if (activeBank) {
    await prisma.order.update({
      where: { id: createdOrder.id },
      data: { bankAccountId: activeBank.id },
    });

    bankAccountDto = {
      id: activeBank.id,
      alias: activeBank.alias,
      cbu: activeBank.cbu,
      bankName: activeBank.bankName,
      accountHolder: activeBank.accountHolder,
      isActive: activeBank.isActive,
    };
  }

  const transferInstructions = await getSettingString(
    'bank_transfer_instructions',
    DEFAULT_SETTINGS.bank_transfer_instructions
  );

  // Enviar correo con los datos para la transferencia
  sendCustomerTransferPendingEmail({
    name: customer.name,
    email: customer.email,
    orderNumber: createdOrder.orderNumber,
    total: Number(createdOrder.total),
    bank: bankAccountDto,
    instructions: transferInstructions,
  }).catch(() => {});

  const itemsWithProduct = verifiedItems.map((vi, index) => ({
    ...createdOrderItems[index],
    product: vi.product,
  }));

  return {
    order: mapOrderToDetailDto(createdOrder, itemsWithProduct, bankAccountDto),
    paymentUrl: null,
    bankAccount: bankAccountDto,
  };
}

/**
 * 2. Restaurar Stock y Cancelar Orden (Transacción atómica)
 */
export async function restoreStockAndCancel(orderId: string, reason: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Orden con ID ${orderId} no encontrada`);
  }

  // Si ya estaba cancelada, no restaurar nuevamente
  if (order.status === OrderStatus.CANCELLED) {
    return order;
  }

  // Solo restaurar stock si la orden estaba en estados con stock reservado
  const hasReservedStock = [
    OrderStatus.PENDING_GATEWAY,
    OrderStatus.PENDING_CONFIRMATION,
    OrderStatus.PENDING_PAYMENT,
  ].includes(order.status as any);

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (hasReservedStock && order.items.length > 0) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }
    }

    const currentNotes = order.notes ? `${order.notes} | Cancelación: ${reason}` : `Cancelación: ${reason}`;

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        notes: currentNotes,
        gatewayExpiresAt: null,
      },
    });
  });

  // Notificar al cliente vía correo
  sendCustomerOrderCancelledEmail({
    name: order.customerName,
    email: order.customerEmail,
    orderNumber: order.orderNumber,
    reason,
  }).catch(() => {});

  return updatedOrder;
}

/**
 * 3. Aplicar Resultado de Pago (Mobbex Webhook / Status Polling) - Idempotente
 */
export async function applyPaymentResult(
  referenceOrOrderNumber: string,
  result: PaymentResult,
  meta?: {
    paymentId?: string;
    installments?: number;
    cardBrand?: string;
    paymentStatus?: string;
  }
): Promise<Order> {
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: referenceOrOrderNumber },
        { gatewayCheckoutId: referenceOrOrderNumber },
      ],
    },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Orden no encontrada con referencia: ${referenceOrOrderNumber}`);
  }

  // Idempotencia: Si ya está en PAID, no volver a procesar ni reenviar email
  if (order.status === OrderStatus.PAID) {
    return order;
  }

  // Si ya está cancelada y se rechaza de nuevo, no hacer nada
  if (order.status === OrderStatus.CANCELLED && result === PaymentResult.REJECTED) {
    return order;
  }

  if (result === PaymentResult.APPROVED) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        gatewayExpiresAt: null,
        gatewayPaymentId: meta?.paymentId || order.gatewayPaymentId,
        installmentsCount: meta?.installments ?? order.installmentsCount,
        paymentStatus: meta?.paymentStatus || '200',
      },
    });

    sendCustomerPaymentApprovedEmail({
      name: order.customerName,
      email: order.customerEmail,
      orderNumber: order.orderNumber,
      total: Number(order.total),
    }).catch(() => {});

    // Notificar a Ale con detalle completo del pedido para carga manual en GesCom
    notifyAdminOrderPaid(order.id).catch(() => {});

    return updated;
  }

  if (result === PaymentResult.REJECTED) {
    const cancelled = await restoreStockAndCancel(
      order.id,
      `Pago rechazado por Mobbex (código: ${meta?.paymentStatus || 'rechazado'})`
    );

    return prisma.order.update({
      where: { id: cancelled.id },
      data: {
        paymentStatus: meta?.paymentStatus || '400',
        gatewayPaymentId: meta?.paymentId || order.gatewayPaymentId,
      },
    });
  }

  // Si está PENDING (ej: 302 en Mobbex)
  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: meta?.paymentStatus || '302',
    },
  });
}

/**
 * 4. Confirmar Transferencia por Administrador
 */
export async function confirmTransfer(
  orderId: string,
  adminId: string,
  bankAccountId: string
): Promise<OrderDetailDto> {
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, isActive: true },
  });

  if (!bankAccount) {
    const err: any = new Error('La cuenta bancaria seleccionada no es válida o está inactiva.');
    err.statusCode = 400;
    throw err;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
    },
  });

  if (!order) {
    const err: any = new Error('Orden no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (order.status === OrderStatus.PAID) {
    return mapOrderToDetailDto(order, order.items, bankAccount);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PAID,
      bankAccountId: bankAccount.id,
      transferConfirmedAt: new Date(),
      transferConfirmedById: adminId,
      gatewayExpiresAt: null,
    },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
    },
  });

  sendCustomerPaymentApprovedEmail({
    name: order.customerName,
    email: order.customerEmail,
    orderNumber: order.orderNumber,
    total: Number(order.total),
  }).catch(() => {});

  // Notificar a Ale con detalle completo del pedido para carga manual en GesCom
  notifyAdminOrderPaid(order.id).catch(() => {});

  return mapOrderToDetailDto(updatedOrder, updatedOrder.items, bankAccount);
}

/**
 * 5. Obtener Detalle de Orden para Cliente (con validación de ownership)
 */
export async function getOrderForCustomer(
  orderNumber: string,
  customerId: string,
  customerEmail: string
): Promise<OrderDetailDto> {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      deletedAt: null,
      OR: [{ customerId }, { customerEmail }],
    },
    include: {
      bankAccount: true,
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    const err: any = new Error('Pedido no encontrado o no tiene permisos para visualizarlo.');
    err.statusCode = 404;
    throw err;
  }

  return mapOrderToDetailDto(order, order.items, order.bankAccount);
}

/**
 * 6. Listado de Órdenes para el Panel de Administrador con Filtros
 */
export async function getAdminOrders(
  filters: AdminOrderFilters
): Promise<PaginatedResponse<OrderDetailDto>> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: s, mode: 'insensitive' } },
      { customerName: { contains: s, mode: 'insensitive' } },
      { customerEmail: { contains: s, mode: 'insensitive' } },
      { customerPhone: { contains: s, mode: 'insensitive' } },
      { gatewayCheckoutId: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        bankAccount: true,
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const items = orders.map((o) => mapOrderToDetailDto(o, o.items, o.bankAccount));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 7. Actualizar Estado de la Orden por Administrador
 */
export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  _adminId: string
): Promise<OrderDetailDto> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      bankAccount: true,
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
    },
  });

  if (!order) {
    const err: any = new Error('Orden no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Si pasa a CANCELLED y tiene stock reservado, restaurar stock
  if (newStatus === OrderStatus.CANCELLED) {
    const cancelled = await restoreStockAndCancel(order.id, 'Cancelado manualmente por administración');
    return mapOrderToDetailDto(cancelled, order.items, order.bankAccount);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      ...(newStatus === OrderStatus.PAID ? { gatewayExpiresAt: null } : {}),
    },
    include: {
      bankAccount: true,
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
    },
  });

  if (newStatus === OrderStatus.PAID && order.status !== OrderStatus.PAID) {
    notifyAdminOrderPaid(order.id).catch(() => {});
  }

  return mapOrderToDetailDto(updated, updated.items, updated.bankAccount);
}

/**
 * Notifica al administrador (Ale) con el detalle completo del pedido para facturar manualmente en GesCom
 */
export async function notifyAdminOrderPaid(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) return;

    let adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      const adminUser = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
        select: { email: true },
        orderBy: { createdAt: 'asc' },
      });
      adminEmail = adminUser?.email || 'papesconfort@gmail.com.ar';
    }

    await sendAdminNewPaidOrderNotificationEmail({
      to: adminEmail,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerCuilCuit: order.customer?.cuilCuit,
      shippingType: order.shippingType,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingPostalCode: order.shippingPostalCode,
      paymentMethod: order.paymentMethod,
      installmentsCount: order.installmentsCount,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      bankDiscount: Number(order.bankDiscount),
      total: Number(order.total),
      notes: order.notes,
      items: order.items.map((i) => ({
        sku: i.skuSnapshot,
        name: i.productNameSnapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
    });

    if (!order.notificationSentAt) {
      await prisma.order.update({
        where: { id: order.id },
        data: { notificationSentAt: new Date() },
      });
    }
  } catch (err: any) {
    console.warn(`[order.service] No se pudo enviar notificación de nuevo pedido a administración:`, err?.message || err);
  }
}

