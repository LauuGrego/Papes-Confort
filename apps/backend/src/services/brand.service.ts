import { prisma } from '@papes-confort/database';

export async function getBrandsList() {
  const brands = await prisma.brand.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    productCount: b._count.products,
  }));
}
