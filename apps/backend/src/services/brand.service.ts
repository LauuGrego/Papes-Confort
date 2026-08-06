import { prisma } from '@papes-confort/database';

export async function getBrandsList() {
  const safetyStock = 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real

  const brands = await prisma.brand.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              deletedAt: null,
              stock: { gt: safetyStock },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return brands
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      productCount: b._count.products,
    }))
    .filter((b) => b.productCount > 0);
}
