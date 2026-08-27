import { prisma } from '@papes-confort/database';
import {
  CustomerDto,
  UpdateCustomerPayload,
  OrderDto,
  OrderItemDto,
  isValidCuilCuit,
  cleanCuilCuit,
} from '@papes-confort/shared';
import { hash, compare } from 'bcryptjs';
import { sendPasswordChangedEmail } from './email.service';

export function mapCustomerToDto(customer: any): CustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || null,
    cuilCuit: customer.cuilCuit || null,
    address: customer.address || null,
    city: customer.city || null,
    province: customer.province || null,
    postalCode: customer.postalCode || null,
    marketingOptIn: Boolean(customer.marketingOptIn),
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt ? customer.updatedAt.toISOString() : undefined,
  };
}

export async function getCustomerById(id: string): Promise<CustomerDto> {
  const customer = await prisma.customer.findUnique({
    where: { id, deletedAt: null },
  });

  if (!customer) {
    throw new Error('Cliente no encontrado');
  }

  return mapCustomerToDto(customer);
}

export async function updateCustomer(id: string, data: UpdateCustomerPayload): Promise<CustomerDto> {
  const existing = await prisma.customer.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new Error('Cliente no encontrado');
  }

  let cleanedCuil: string | null | undefined = undefined;
  if (data.cuilCuit !== undefined) {
    if (data.cuilCuit && data.cuilCuit.trim() !== '') {
      if (!isValidCuilCuit(data.cuilCuit)) {
        throw new Error('El CUIL/CUIT ingresado no es válido (debe tener 11 dígitos y dígito verificador correcto de AFIP).');
      }
      cleanedCuil = cleanCuilCuit(data.cuilCuit);
    } else {
      cleanedCuil = null;
    }
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      phone: data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : undefined,
      cuilCuit: cleanedCuil,
      address: data.address !== undefined ? (data.address ? data.address.trim() : null) : undefined,
      city: data.city !== undefined ? (data.city ? data.city.trim() : null) : undefined,
      province: data.province !== undefined ? (data.province ? data.province.trim() : null) : undefined,
      postalCode: data.postalCode !== undefined ? (data.postalCode ? data.postalCode.trim() : null) : undefined,
      marketingOptIn: data.marketingOptIn !== undefined ? Boolean(data.marketingOptIn) : undefined,
    },
  });

  return mapCustomerToDto(updated);
}

export async function changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
  }

  const customer = await prisma.customer.findUnique({
    where: { id, deletedAt: null },
  });

  if (!customer || !customer.password) {
    throw new Error('Cliente no encontrado');
  }

  const isMatch = await compare(currentPassword, customer.password);
  if (!isMatch) {
    throw new Error('La contraseña actual es incorrecta');
  }

  const newHash = await hash(newPassword, 12);

  await prisma.customer.update({
    where: { id },
    data: {
      password: newHash,
      passwordChangedAt: new Date(),
    },
  });

  // Notificar por email en segundo plano
  sendPasswordChangedEmail({
    name: customer.name,
    email: customer.email,
  }).catch(() => {});
}

export async function getCustomerOrders(
  customerId: string,
  customerEmail: string,
  pagination: { page?: number; limit?: number } = {}
) {
  const page = Math.max(1, pagination.page || 1);
  const limit = Math.max(1, Math.min(50, pagination.limit || 10));
  const skip = (page - 1) * limit;

  // Filtrar órdenes por customerId o por el customerEmail
  const where = {
    deletedAt: null,
    OR: [
      { customerId },
      { customerEmail: customerEmail.trim().toLowerCase() },
    ],
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                images: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const items: OrderDto[] = orders.map((order) => {
    const itemDtos: OrderItemDto[] = order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productNameSnapshot || item.product?.name || 'Producto',
      sku: item.skuSnapshot || item.product?.sku || '',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      total: Number(item.total),
    }));

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
      items: itemDtos,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  });

  return {
    items,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCustomerOrderById(
  customerId: string,
  customerEmail: string,
  orderId: string
): Promise<OrderDto> {
  const order = await prisma.order.findUnique({
    where: { id: orderId, deletedAt: null },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              images: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  // Validación estricta de Ownership
  const isOwner =
    order.customerId === customerId ||
    order.customerEmail.trim().toLowerCase() === customerEmail.trim().toLowerCase();

  if (!isOwner) {
    throw new Error('Pedido no encontrado');
  }

  const itemDtos: OrderItemDto[] = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productNameSnapshot || item.product?.name || 'Producto',
    sku: item.skuSnapshot || item.product?.sku || '',
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    total: Number(item.total),
  }));

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
    items: itemDtos,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
