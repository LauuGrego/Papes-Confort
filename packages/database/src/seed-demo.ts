import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  console.log('Seeding demo products...');

  // 1. Ensure product families exist (matching those from base seed)
  const familyLB = await prisma.productFamily.upsert({
    where: { slug: 'linea-blanca' },
    update: {},
    create: { name: 'Línea Blanca', slug: 'linea-blanca' },
  });

  const familyPE = await prisma.productFamily.upsert({
    where: { slug: 'pequenos-electrodomesticos' },
    update: {},
    create: { name: 'Pequeños Electrodomésticos', slug: 'pequenos-electrodomesticos' },
  });

  const familyCL = await prisma.productFamily.upsert({
    where: { slug: 'climatizacion' },
    update: {},
    create: { name: 'Climatización', slug: 'climatizacion' },
  });

  const familyTV = await prisma.productFamily.upsert({
    where: { slug: 'tv-audio' },
    update: {},
    create: { name: 'TV/Audio', slug: 'tv-audio' },
  });

  // 2. Create demo brands
  const brandsData = [
    { name: 'Samsung', slug: 'samsung' },
    { name: 'LG', slug: 'lg' },
    { name: 'Whirlpool', slug: 'whirlpool' },
    { name: 'Philips', slug: 'philips' },
    { name: 'Siam', slug: 'siam' },
    { name: 'Noblex', slug: 'noblex' },
  ];

  const brandsMap: Record<string, string> = {};
  for (const b of brandsData) {
    const created = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        name: b.name,
        slug: b.slug,
        gescomName: b.name.toUpperCase(),
      },
    });
    brandsMap[b.name] = created.id;
    console.log(`  Brand: ${created.name}`);
  }

  // 3. Demo products data
  const demoProducts = [
    {
      sku: 'DEMO-001',
      name: 'Samsung Heladera 300L No Frost',
      gescomName: 'SAMSUNG HELADERA 300L NO FROST',
      brand: 'Samsung',
      familyId: familyLB.id,
      basePrice: 850000.0,
      discountPercent: 15.0,
      productType: ProductType.NORMAL,
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1571175432247-59b3252069e2?w=800&auto=format&fit=crop&q=80',
      description: 'Heladera Samsung No Frost de 300 litros con freezer superior. Panel de control digital y sistema de enfriamiento envolvente All-around Cooling.',
      specs: {
        color: 'Inoxidable',
        capacidad: '300 litros',
        tecnologia: 'No Frost',
        eficiencia_energetica: 'A+',
        ivaPercent: 21,
        unit: 'U',
        rubro: '01',
        subrubro: '001',
      },
    },
    {
      sku: 'DEMO-002',
      name: 'LG Lavarropas 7kg',
      gescomName: 'LG LAVARROPAS 7KG AUTOMATICO',
      brand: 'LG',
      familyId: familyLB.id,
      basePrice: 620000.0,
      discountPercent: 0.0,
      productType: ProductType.NORMAL,
      stock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
      description: 'Lavarropas LG automático de carga frontal. Capacidad de 7kg con tecnología 6 Motion DD que simula el lavado a mano para el máximo cuidado de tus prendas.',
      specs: {
        capacidad: '7 kg',
        velocidad_centrifugado: '1200 RPM',
        motor: 'Direct Drive (Inverter)',
        ivaPercent: 21,
        unit: 'U',
        rubro: '01',
        subrubro: '002',
      },
    },
    {
      sku: 'DEMO-003',
      name: 'Whirlpool Cocina 5 Hornallas',
      gescomName: 'WHIRLPOOL COCINA 5 HORNALLAS MULTIGAS',
      brand: 'Whirlpool',
      familyId: familyLB.id,
      basePrice: 540000.0,
      discountPercent: 0.0,
      productType: ProductType.NORMAL,
      stock: 5,
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
      description: 'Cocina Whirlpool de 5 hornallas multigas. Cuenta con encendido eléctrico a una mano, timer digital y horno con visor panorámico autolimpiante.',
      specs: {
        color: 'Acero Inoxidable',
        cantidad_hornallas: '5',
        tipo_conexion: 'Multigas',
        ivaPercent: 21,
        unit: 'U',
        rubro: '01',
        subrubro: '003',
      },
    },
    {
      sku: 'DEMO-004',
      name: 'Philips Microondas 25L',
      gescomName: 'PHILIPS MICROONDAS 25L CON GRILL',
      brand: 'Philips',
      familyId: familyPE.id,
      basePrice: 185000.0,
      discountPercent: 20.0,
      productType: ProductType.OFFER,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80',
      description: 'Microondas Philips con Grill y capacidad de 25 litros. 10 niveles de potencia, programas de cocción automáticos y función descongelar por peso.',
      specs: {
        capacidad: '25 litros',
        potencia: '900 W',
        grill: 'Sí (1000 W)',
        ivaPercent: 21,
        unit: 'U',
        rubro: '02',
        subrubro: '015',
      },
    },
    {
      sku: 'DEMO-005',
      name: 'Siam Aire Split 3000F',
      gescomName: 'SIAM AIRE SPLIT 3000F FRIO CALOR INVERTER',
      brand: 'Siam',
      familyId: familyCL.id,
      basePrice: 780000.0,
      discountPercent: 0.0,
      productType: ProductType.NORMAL,
      stock: 4,
      imageUrl: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=800&auto=format&fit=crop&q=80',
      description: 'Acondicionador de aire Split Siam de 3000 frigorías Frío/Calor. Tecnología Inverter que reduce el consumo de energía hasta un 35% manteniendo la temperatura estable.',
      specs: {
        frigorias: '3000 F',
        tecnologia: 'Inverter',
        modo: 'Frío / Calor',
        gas_refrigerante: 'R410A',
        ivaPercent: 10.5,
        unit: 'U',
        rubro: '03',
        subrubro: '030',
      },
    },
    {
      sku: 'DEMO-006',
      name: 'Noblex Smart TV 50" 4K',
      gescomName: 'NOBLEX SMART TV 50 PULGADAS 4K UHD',
      brand: 'Noblex',
      familyId: familyTV.id,
      basePrice: 420000.0,
      discountPercent: 10.0,
      productType: ProductType.BANK_PROMO,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&auto=format&fit=crop&q=80',
      description: 'Televisor Smart TV Noblex de 50 pulgadas con resolución 4K Ultra HD. Sistema operativo Google TV, wifi integrado, bluetooth y puertos HDMI/USB.',
      specs: {
        pantalla: '50 pulgadas',
        resolucion: '4K Ultra HD (3840x2160)',
        sistema_operativo: 'Google TV',
        ivaPercent: 21,
        unit: 'U',
        rubro: '04',
        subrubro: '045',
      },
    },
  ];

  // 4. Upsert products
  for (const p of demoProducts) {
    const slug = slugify(p.name) + '-' + p.sku.toLowerCase();
    const brandId = brandsMap[p.brand];

    const created = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        gescomName: p.gescomName,
        slug,
        basePrice: p.basePrice,
        discountPercent: p.discountPercent,
        productType: p.productType,
        stock: p.stock,
        brandId,
        productFamilyId: p.familyId,
        description: p.description,
        specs: p.specs,
        isActive: true,
      },
      create: {
        sku: p.sku,
        name: p.name,
        gescomName: p.gescomName,
        slug,
        basePrice: p.basePrice,
        discountPercent: p.discountPercent,
        productType: p.productType,
        stock: p.stock,
        brandId,
        productFamilyId: p.familyId,
        description: p.description,
        specs: p.specs,
        isActive: true,
      },
    });

    // Sync product image
    await prisma.productImage.deleteMany({
      where: { productId: created.id },
    });

    await prisma.productImage.create({
      data: {
        productId: created.id,
        url: p.imageUrl,
        alt: p.name,
        isPrimary: true,
        sortOrder: 0,
      },
    });

    console.log(`  Product: ${created.name} (${created.sku})`);
  }

  console.log('Demo products seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
