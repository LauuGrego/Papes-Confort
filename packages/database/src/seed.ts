import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Admin user
  const passwordHash = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@papesconfort.com' },
    update: {},
    create: {
      email: 'admin@papesconfort.com',
      password: passwordHash,
      name: 'Alejandro',
      role: 'ADMIN',
    },
  });
  console.log(`  ` + `Admin user: ${admin.email}`);

  // 2. Product families (CORREGIDO: usa prisma.productFamily)
  const productFamiliesData = [
    { name: 'Línea Blanca', slug: 'linea-blanca' },
    { name: 'Pequeños Electrodomésticos', slug: 'pequenos-electrodomesticos' },
    { name: 'Climatización', slug: 'climatizacion' },
    { name: 'TV/Audio', slug: 'tv-audio' },
  ];

  for (const pf of productFamiliesData) {
    const created = await prisma.productFamily.upsert({
      where: { slug: pf.slug },
      update: {},
      create: pf,
    });
    console.log(`  ` + `Product family: ${created.name}`);
  }

  // 3. Default settings
  const settingsData = [
    { key: 'free_shipping_threshold', value: '50000' },
    { key: 'safety_stock', value: '1' },
    { key: 'whatsapp_number', value: '5493445454261' },
    { key: 'gescom_images_path', value: '' },
    { key: 'gateway_reservation_minutes', value: '15' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
    console.log(`  ` + `Setting: ${s.key} = ${s.value}`);
  }

  // 4. Placeholder bank account
  const existingAccount = await prisma.bankAccount.findFirst({
    where: { alias: 'PAPESCONFORT' },
  });

  if (!existingAccount) {
    await prisma.bankAccount.create({
      data: {
        alias: 'PAPESCONFORT',
        cbu: '0000000000000000000000',
        bankName: 'A definir',
        accountHolder: 'Alejandro',
        isActive: true,
      },
    });
    console.log('  ' + 'Bank account: PAPESCONFORT (placeholder)');
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
