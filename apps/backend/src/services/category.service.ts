import { prisma } from '@papes-confort/database';

export async function getCategoriesHierarchy() {
  const safetyStock = 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real

  const families = await prisma.productFamily.findMany({
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
      categories: {
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
      },
    },
    orderBy: { name: 'asc' },
  });

  return families
    .map((fam) => {
      const categories = fam.categories
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productTypeId: cat.productFamilyId,
          productCount: cat._count.products,
        }))
        .filter((cat) => cat.productCount > 0);

      return {
        id: fam.id,
        name: fam.name,
        slug: fam.slug,
        categories,
        productCount: fam._count.products,
      };
    })
    .filter((fam) => fam.productCount > 0);
}
