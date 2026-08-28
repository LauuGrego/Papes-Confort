import { prisma } from '@papes-confort/database';
import { CartDto, CartItemDto } from '@papes-confort/shared';

async function getSafetyStock(): Promise<number> {
  return 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real
}

export async function getOrCreateCart(sessionId: string, customerId?: string | null) {
  // Si viene customerId, buscar carrito activo por Id
  if (customerId) {
    let customerCart = await prisma.cart.findFirst({
      where: { customerId, status: 'ACTIVE' },
    });

    if (customerCart) {
      return customerCart;
    }
  }

  // Buscar por sessionId
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        sessionId,
        customerId: customerId || null,
        status: 'ACTIVE',
      },
    });
  } else if (customerId && !cart.customerId) {
    // Si el carrito de sesión no tenía customerId, asignárselo
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { customerId },
    });
  }

  return cart;
}

export async function getCartDto(sessionId: string, customerId?: string | null): Promise<CartDto> {
  const cart = await getOrCreateCart(sessionId, customerId);

  const cartItems = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: {
        include: {
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });

  const itemDtos: CartItemDto[] = cartItems.map((item) => {
    const product = item.product;
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
    const imageUrl = primaryImage ? primaryImage.url : null;
    const unitPrice = Number(item.unitPriceAtAdd);
    const discount = Number(product.discountPercent);
    const total = unitPrice * item.quantity;

    return {
      productId: item.productId,
      productName: product.name,
      brand: product.brand.name,
      sku: product.sku,
      imageUrl,
      quantity: item.quantity,
      unitPrice,
      discount,
      total,
    };
  });

  const subtotal = itemDtos.reduce((acc, item) => acc + item.total, 0);
  const totalItems = itemDtos.reduce((acc, item) => acc + item.quantity, 0);

  return {
    id: cart.id,
    sessionId: cart.sessionId,
    customerId: cart.customerId,
    status: cart.status,
    items: itemDtos,
    subtotal,
    totalItems,
  };
}

export async function addItem(sessionId: string, productId: string, quantity: number, customerId?: string | null) {
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a cero');
  }

  const cart = await getOrCreateCart(sessionId, customerId);

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true, deletedAt: null },
  });

  if (!product) {
    throw new Error('Producto no encontrado o inactivo');
  }

  const safetyStock = await getSafetyStock();
  const stockVisible = Math.max(0, product.stock - safetyStock);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  const currentQty = existingItem ? existingItem.quantity : 0;
  const newQty = currentQty + quantity;

  if (newQty > stockVisible) {
    throw new Error(`Stock insuficiente. Solo quedan ${stockVisible} unidades disponibles.`);
  }

  const basePrice = Number(product.basePrice);
  const listPrice = product.listPrice !== null && product.listPrice !== undefined && Number(product.listPrice) > 0
    ? Number(product.listPrice)
    : (basePrice > 0 ? basePrice / 0.8 : basePrice);
  const offerDiscount = Number(product.discountPercent);

  const unitPrice = offerDiscount > 0
    ? listPrice * (1 - offerDiscount / 100)
    : basePrice;

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    update: {
      quantity: newQty,
      unitPriceAtAdd: unitPrice,
    },
    create: {
      cartId: cart.id,
      productId,
      quantity: newQty,
      unitPriceAtAdd: unitPrice,
    },
  });

  return getCartDto(cart.sessionId, cart.customerId);
}

export async function updateQuantity(sessionId: string, productId: string, quantity: number, customerId?: string | null) {
  const cart = await getOrCreateCart(sessionId, customerId);

  if (quantity <= 0) {
    return removeItem(sessionId, productId, customerId);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true, deletedAt: null },
  });

  if (!product) {
    throw new Error('Producto no encontrado o inactivo');
  }

  const safetyStock = await getSafetyStock();
  const stockVisible = Math.max(0, product.stock - safetyStock);

  if (quantity > stockVisible) {
    throw new Error(`Stock insuficiente. Solo quedan ${stockVisible} unidades disponibles.`);
  }

  const unitPrice = Number(product.basePrice);

  await prisma.cartItem.update({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    data: {
      quantity,
      unitPriceAtAdd: unitPrice,
    },
  });

  return getCartDto(cart.sessionId, cart.customerId);
}

export async function removeItem(sessionId: string, productId: string, customerId?: string | null) {
  const cart = await getOrCreateCart(sessionId, customerId);

  try {
    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });
  } catch (error) {
    // Si no existía, ignoramos el error
  }

  return getCartDto(cart.sessionId, cart.customerId);
}

export async function clearCart(sessionId: string, customerId?: string | null) {
  const cart = await getOrCreateCart(sessionId, customerId);
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
  return getCartDto(cart.sessionId, cart.customerId);
}

/**
 * Fusiona los items de un carrito de sesión anónimo con el carrito persistente del cliente.
 */
export async function mergeCart(sessionId: string, customerId: string): Promise<CartDto> {
  // Carrito de la sesión anónima
  const sessionCart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: { include: { product: true } } },
  });

  // Carrito propio del cliente
  let customerCart = await prisma.cart.findFirst({
    where: { customerId, status: 'ACTIVE' },
    include: { items: true },
  });

  // Si no hay carrito anónimo o no tiene items, devolver el del cliente
  if (!sessionCart || sessionCart.items.length === 0) {
    if (!customerCart) {
      customerCart = await prisma.cart.create({
        data: {
          sessionId,
          customerId,
          status: 'ACTIVE',
        },
        include: { items: true },
      });
    }
    return getCartDto(customerCart.sessionId, customerId);
  }

  // Si no existe carrito del cliente, asociar el carrito de sesión directamente al cliente
  if (!customerCart) {
    await prisma.cart.update({
      where: { id: sessionCart.id },
      data: { customerId },
    });
    return getCartDto(sessionCart.sessionId, customerId);
  }

  // Si ambos existen y son carritos distintos, fusionar los items
  if (sessionCart.id !== customerCart.id) {
    const safetyStock = await getSafetyStock();

    for (const sessionItem of sessionCart.items) {
      const existingCustomerItem = customerCart.items.find(
        (ci) => ci.productId === sessionItem.productId
      );

      const targetQty = (existingCustomerItem?.quantity || 0) + sessionItem.quantity;
      const stockVisible = Math.max(0, sessionItem.product.stock - safetyStock);
      const finalQty = Math.min(targetQty, stockVisible);

      if (finalQty > 0) {
        await prisma.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: customerCart.id,
              productId: sessionItem.productId,
            },
          },
          update: {
            quantity: finalQty,
          },
          create: {
            cartId: customerCart.id,
            productId: sessionItem.productId,
            quantity: finalQty,
            unitPriceAtAdd: sessionItem.unitPriceAtAdd,
          },
        });
      }
    }

    // Limpiar o marcar como abandonado el carrito de sesión
    await prisma.cart.delete({
      where: { id: sessionCart.id },
    }).catch(async () => {
      await prisma.cart.update({
        where: { id: sessionCart.id },
        data: { status: 'ABANDONED' },
      }).catch(() => {});
    });
  }

  return getCartDto(customerCart.sessionId, customerId);
}
