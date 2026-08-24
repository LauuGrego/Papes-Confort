import { prisma } from '@papes-confort/database';

async function main() {
  try {
    const total = await prisma.product.count();
    console.log(`Total productos en BD local/remota de PostgreSQL (Prisma): ${total}`);

    const products = await prisma.product.findMany({
      take: 20,
      select: {
        sku: true,
        name: true,
        basePrice: true,
        listPrice: true,
      },
    });

    console.log('--- Muestra de 20 productos ---');
    products.forEach((p) => {
      console.log(`SKU: ${p.sku} | ${p.name.substring(0, 30)}... | basePrice (AVenta): $${p.basePrice} | listPrice (AValor): $${p.listPrice}`);
    });

    const allProducts = await prisma.product.findMany({
      select: {
        basePrice: true,
        listPrice: true,
      },
    });

    let equals = 0;
    let different = 0;
    let listPriceNullOrZero = 0;

    allProducts.forEach((p) => {
      const base = Number(p.basePrice);
      const list = p.listPrice !== null && p.listPrice !== undefined ? Number(p.listPrice) : null;

      if (list === null || list === 0) {
        listPriceNullOrZero++;
      }
      if (base === list) {
        equals++;
      } else {
        different++;
      }
    });

    console.log('\n--- Estadísticas comparativas (PostgreSQL / Prisma) ---');
    console.log(`Total productos procesados: ${allProducts.length}`);
    console.log(`Productos donde basePrice == listPrice: ${equals}`);
    console.log(`Productos donde basePrice != listPrice: ${different}`);
    console.log(`Productos con listPrice nulo o 0: ${listPriceNullOrZero}`);

    const diffProducts = await prisma.product.findMany({
      where: {
        listPrice: { not: null },
      },
      take: 10,
      select: {
        sku: true,
        name: true,
        basePrice: true,
        listPrice: true,
      },
    });

    console.log('\n--- Muestra de productos con listPrice distinto o presente ---');
    diffProducts.forEach((p) => {
      console.log(`SKU: ${p.sku} | basePrice: $${p.basePrice} | listPrice: $${p.listPrice}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error al consultar la BD:', err);
    process.exit(1);
  }
}

main();
