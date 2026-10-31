import { prisma } from '@papes-confort/database';
import {
  CustomerDto,
  UpdateCustomerPayload,
  OrderDetailDto,
  isValidCuilCuit,
  cleanCuilCuit,
} from '@papes-confort/shared';
import { mapOrderToDetailDto } from './order.service';

export function mapCustomerToDto(customer: any): CustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    googleId: customer.googleId || null,
    avatarUrl: customer.avatarUrl || null,
    hasPassword: Boolean(customer.password),
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
        bankAccount: true,
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

  const items: OrderDetailDto[] = orders.map((order) =>
    mapOrderToDetailDto(order, order.items, order.bankAccount)
  );

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
): Promise<OrderDetailDto> {
  const order = await prisma.order.findUnique({
    where: { id: orderId, deletedAt: null },
    include: {
      bankAccount: true,
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

  return mapOrderToDetailDto(order, order.items, order.bankAccount);
}
