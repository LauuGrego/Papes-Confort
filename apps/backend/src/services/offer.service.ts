import { prisma } from '@papes-confort/database';
import { OfferDto } from '@papes-confort/shared';
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
