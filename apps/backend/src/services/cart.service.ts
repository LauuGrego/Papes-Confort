import { prisma } from '@papes-confort/database';
import { CartDto, CartItemDto } from '@papes-confort/shared';

async function getSafetyStock(): Promise<number> {
  return 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real
}

export async function getOrCreateCart(sessionId: string) {
  let cart = await prisma.cart.findUnique({
    where: { sessionId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        sessionId,
        status: 'ACTIVE',
      },
    });
  }

  return cart;
}

export async function getCartDto(sessionId: string): Promise<CartDto> {
  const cart = await getOrCreateCart(sessionId);

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
    status: cart.status,
    items: itemDtos,
    subtotal,
    totalItems,
  };
}

export async function addItem(sessionId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a cero');
  }

  const cart = await getOrCreateCart(sessionId);

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

  return getCartDto(sessionId);
}

export async function updateQuantity(sessionId: string, productId: string, quantity: number) {
  const cart = await getOrCreateCart(sessionId);

  if (quantity <= 0) {
    return removeItem(sessionId, productId);
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

  return getCartDto(sessionId);
}

export async function removeItem(sessionId: string, productId: string) {
  const cart = await getOrCreateCart(sessionId);

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

  return getCartDto(sessionId);
}

export async function clearCart(sessionId: string) {
  const cart = await getOrCreateCart(sessionId);
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
  return getCartDto(sessionId);
}
