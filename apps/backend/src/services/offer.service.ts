import { prisma } from '@papes-confort/database';
import { OfferDto, CreateOfferDto, UpdateOfferDto } from '@papes-confort/shared';
import { mapProductToDto } from './product.service';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listOffers(onlyActive = false): Promise<OfferDto[]> {
  const where: any = {};
  if (onlyActive) {
    where.isActive = true;
  }

  const offers = await prisma.offer.findMany({
    where,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return offers.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    description: o.description,
    discountPercent: Number(o.discountPercent),
    isActive: o.isActive,
    productCount: o._count.products,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));
}

export async function getOfferBySlug(slug: string): Promise<OfferDto | null> {
  const offer = await prisma.offer.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: true } },
      products: {
        include: {
          product: {
            include: {
              brand: true,
              productFamily: true,
              productCategory: true,
              images: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!offer) return null;

  const productDtos = await Promise.all(
    offer.products
      .filter((op) => op.product.isActive && !op.product.deletedAt)
      .map((op) => mapProductToDto(op.product))
  );

  return {
    id: offer.id,
    name: offer.name,
    slug: offer.slug,
    description: offer.description,
    discountPercent: Number(offer.discountPercent),
    isActive: offer.isActive,
    productCount: offer._count.products,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    products: productDtos,
  };
}

export async function getOfferById(id: string): Promise<OfferDto | null> {
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
      products: {
        include: {
          product: {
            include: {
              brand: true,
              productFamily: true,
              productCategory: true,
              images: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!offer) return null;

  const productDtos = await Promise.all(
    offer.products
      .filter((op) => op.product.isActive && !op.product.deletedAt)
      .map((op) => mapProductToDto(op.product))
  );

  return {
    id: offer.id,
    name: offer.name,
    slug: offer.slug,
    description: offer.description,
    discountPercent: Number(offer.discountPercent),
    isActive: offer.isActive,
    productCount: offer._count.products,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    products: productDtos,
  };
}

export async function createOffer(data: CreateOfferDto): Promise<OfferDto> {
  const baseSlug = slugify(data.name);
  let finalSlug = baseSlug;
  let count = 1;

  while (await prisma.offer.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${count}`;
    count++;
  }

  const offer = await prisma.offer.create({
    data: {
      name: data.name,
      slug: finalSlug,
      description: data.description || null,
      discountPercent: data.discountPercent || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: {
      _count: { select: { products: true } },
    },
  });

  return {
    id: offer.id,
    name: offer.name,
    slug: offer.slug,
    description: offer.description,
    discountPercent: Number(offer.discountPercent),
    isActive: offer.isActive,
    productCount: offer._count.products,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

export async function updateOffer(id: string, data: UpdateOfferDto): Promise<OfferDto> {
  const updateData: any = {};
  if (data.name !== undefined) {
    updateData.name = data.name;
    const baseSlug = slugify(data.name);
    let finalSlug = baseSlug;
    let count = 1;

    while (
      await prisma.offer.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      })
    ) {
      finalSlug = `${baseSlug}-${count}`;
      count++;
    }
    updateData.slug = finalSlug;
  }

  if (data.description !== undefined) updateData.description = data.description;
  if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const offer = await prisma.offer.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { products: true } },
    },
  });

  return {
    id: offer.id,
    name: offer.name,
    slug: offer.slug,
    description: offer.description,
    discountPercent: Number(offer.discountPercent),
    isActive: offer.isActive,
    productCount: offer._count.products,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

export async function deleteOffer(id: string): Promise<void> {
  const offerProducts = await prisma.offerProduct.findMany({
    where: { offerId: id },
    select: { productId: true },
  });

  const productIds = offerProducts.map((op) => op.productId);

  if (productIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { discountPercent: 0 },
    });
  }

  await prisma.offer.delete({
    where: { id },
  });
}

export async function addProductsToOffer(offerId: string, productIds: string[]): Promise<void> {
  if (!productIds || productIds.length === 0) return;
  const records = productIds.map((productId) => ({
    offerId,
    productId,
  }));

  await prisma.offerProduct.createMany({
    data: records,
    skipDuplicates: true,
  });
}

export async function removeProductsFromOffer(offerId: string, productIds: string[]): Promise<void> {
  if (!productIds || productIds.length === 0) return;

  await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { discountPercent: 0 },
  });

  await prisma.offerProduct.deleteMany({
    where: {
      offerId,
      productId: { in: productIds },
    },
  });
}

export async function bulkApplyDiscount(offerId: string, percent: number): Promise<number> {
  const offerProducts = await prisma.offerProduct.findMany({
    where: { offerId },
    select: { productId: true },
  });

  const productIds = offerProducts.map((op) => op.productId);
  if (productIds.length === 0) return 0;

  const result = await prisma.product.updateMany({
    where: {
      id: { in: productIds },
      discountPercent: 0,
    },
    data: {
      discountPercent: percent,
    },
  });

  return result.count;
}
