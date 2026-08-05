import { prisma } from '@papes-confort/database';

export async function getBrandsList() {
  const setting = await prisma.setting.findUnique({ where: { key: 'safety_stock' } });
  const safetyStock = setting ? parseInt(setting.value, 10) : 1;

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
