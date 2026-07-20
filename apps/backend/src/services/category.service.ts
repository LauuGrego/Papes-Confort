import { prisma } from '@papes-confort/database';

export async function getCategoriesHierarchy() {
  const families = await prisma.productFamily.findMany({
    include: {
      categories: {
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
      },
    },
    orderBy: { name: 'asc' },
  });

  return families.map((fam) => {
    const categories = fam.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productTypeId: cat.productFamilyId,
      productCount: cat._count.products,
    }));

    const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

    return {
      id: fam.id,
      name: fam.name,
      slug: fam.slug,
      categories,
      productCount: totalProducts,
    };
  });
}
