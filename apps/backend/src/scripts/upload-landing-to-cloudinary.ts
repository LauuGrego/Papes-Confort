import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@papes-confort/database';

// Load env from apps/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Error: Credenciales de Cloudinary faltantes en .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const IMAGES_TO_UPLOAD = [
  {
    key: 'hero',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/hero_home_ambience.jpg'),
    publicId: 'hero_home_ambience',
  },
  {
    key: 'cat_heladeras',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/heladeras.jpg'),
    publicId: 'cat_heladeras',
  },
  {
    key: 'cat_lavarropas',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/lavarropas.jpg'),
    publicId: 'cat_lavarropas',
  },
  {
    key: 'cat_television',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/television.jpg'),
    publicId: 'cat_television',
  },
  {
    key: 'cat_climatizacion',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/climatizacion.jpg'),
    publicId: 'cat_climatizacion',
  },
  {
    key: 'cat_colchones',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/colchones.jpg'),
    publicId: 'cat_colchones',
  },
  {
    key: 'cat_cocinas',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/cocinas.jpg'),
    publicId: 'cat_cocinas',
  },
  {
    key: 'cat_pequenos',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/pequenos.jpg'),
    publicId: 'cat_pequenos',
  },
  {
    key: 'cat_hogar',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/categories/hogar.jpg'),
    publicId: 'cat_hogar',
  },
  {
    key: 'edificio',
    localPath: path.resolve(__dirname, '../../../frontend/public/images/edificio.webp'),
    publicId: 'edificio_central',
  },
];

async function main() {
  console.log('Iniciando subida de imágenes de la landing a Cloudinary...');
  const uploadedUrls: Record<string, string> = {};

  for (const item of IMAGES_TO_UPLOAD) {
    if (!fs.existsSync(item.localPath)) {
      console.warn(`Archivo no encontrado: ${item.localPath}`);
      continue;
    }

    try {
      console.log(`Subiendo ${item.publicId}...`);
      const res = await cloudinary.uploader.upload(item.localPath, {
        folder: 'papes-confort/landing',
        public_id: item.publicId,
        overwrite: true,
      });
      console.log(`Subido exitosamente: ${res.secure_url}`);
      uploadedUrls[item.key] = res.secure_url;
    } catch (err: any) {
      console.error(`Error subiendo ${item.publicId}:`, err.message);
    }
  }

  console.log('\n--- URLs subidas a Cloudinary ---');
  console.log(JSON.stringify(uploadedUrls, null, 2));

  // Preparar configuraciones predeterminadas con las URLs de Cloudinary
  const heroBannerConfig = {
    imageUrl: uploadedUrls['hero'] || '/images/hero_home_ambience.jpg',
    badgeText: 'Confort para todos los días',
    title: 'TODO PARA EQUIPAR TU HOGAR',
    subtitle: 'Electrodomésticos, climatización y confort para todos los días con la calidez y el respaldo de siempre.',
    primaryBtnText: 'Ver Catálogo',
    primaryBtnUrl: '/catalogo',
    secondaryBtnText: 'Ver Ofertas',
    secondaryBtnUrl: '#oferta-semanal',
    searchTags: ['Heladeras', 'Lavarropas', 'Smart TV', 'Colchones', 'Aires'],
    objectFit: 'cover',
    objectPositionX: 50,
    objectPositionY: 50,
  };

  const categoryCardsConfig = [
    {
      id: 'heladeras',
      name: 'Heladeras',
      description: 'No frost, inverter y frigobares',
      image: uploadedUrls['cat_heladeras'] || '/images/categories/heladeras.jpg',
      href: '/catalogo?search=heladera',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'lavarropas',
      name: 'Lavarropas',
      description: 'Carga frontal, superior y secarropas',
      image: uploadedUrls['cat_lavarropas'] || '/images/categories/lavarropas.jpg',
      href: '/catalogo?search=lavarropas',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'television',
      name: 'Televisión',
      description: 'Smart TV 4K, audio y barras de sonido',
      image: uploadedUrls['cat_television'] || '/images/categories/television.jpg',
      href: '/catalogo?search=tv',
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'climatizacion',
      name: 'Climatización',
      description: 'Aires acondicionados frío/calor',
      image: uploadedUrls['cat_climatizacion'] || '/images/categories/climatizacion.jpg',
      href: '/catalogo?search=aire',
      isActive: true,
      sortOrder: 4,
    },
    {
      id: 'colchones',
      name: 'Colchones',
      description: 'Sommiers, 1 y 2 plazas, almohadas',
      image: uploadedUrls['cat_colchones'] || '/images/categories/colchones.jpg',
      href: '/catalogo?search=colchon',
      isActive: true,
      sortOrder: 5,
    },
    {
      id: 'cocinas',
      name: 'Cocinas',
      description: 'Cocinas a gas, anafes y hornos empotrables',
      image: uploadedUrls['cat_cocinas'] || '/images/categories/cocinas.jpg',
      href: '/catalogo?search=cocina',
      isActive: true,
      sortOrder: 6,
    },
    {
      id: 'pequenos',
      name: 'Pequeños Electro',
      description: 'Cafeteras, licuadoras, tostadoras y más',
      image: uploadedUrls['cat_pequenos'] || '/images/categories/pequenos.jpg',
      href: '/catalogo?search=electro',
      isActive: true,
      sortOrder: 7,
    },
    {
      id: 'hogar',
      name: 'Hogar & Confort',
      description: 'Ventiladores, calefacción y bazar',
      image: uploadedUrls['cat_hogar'] || '/images/categories/hogar.jpg',
      href: '/catalogo?search=hogar',
      isActive: true,
      sortOrder: 8,
    },
  ];

  const weeklyOfferConfig = {
    badge: 'Oportunidad de la semana',
    title: 'OFERTAS DE LA SEMANA',
    subtitle: 'Aprovechá precios especiales y planes de financiación exclusivos en productos seleccionados para renovar el confort de tu hogar.',
    imageUrl: uploadedUrls['cat_climatizacion'] || '/images/categories/climatizacion.jpg',
    tagCategory: 'Climatización y Confort',
    productHeadline: 'Equipá tu casa con la mejor tecnología en frío/calor',
    cuotasText: 'Hasta 12 cuotas fijas',
    cashDiscountText: 'Descuento al contado',
    warrantyText: 'Garantía oficial',
    linkText: 'Ver modelos',
    linkUrl: '/catalogo?search=aire',
    mainCtaText: 'Ver Todas las Ofertas',
    mainCtaUrl: '/catalogo',
    isActive: true,
  };

  const trustBarConfig = [
    {
      id: 'envios',
      icon: 'truck',
      title: 'Envíos a todo el país',
      description: 'Entregas seguras y seguimiento',
      href: '/catalogo',
      isActive: true,
    },
    {
      id: 'cuotas',
      icon: 'credit-card',
      title: 'Financiación a tu medida',
      description: 'Hasta 12 cuotas con tarjetas',
      href: '#medios-de-pago',
      isActive: true,
    },
    {
      id: 'ofertas',
      icon: 'percent',
      title: 'Precios especiales',
      description: 'Descuentos y promos de la semana',
      href: '#oferta-semanal',
      isActive: true,
    },
    {
      id: 'garantia',
      icon: 'shield',
      title: 'Garantía oficial',
      description: 'Respaldo directo de marcas líderes',
      href: '#sobre-nosotros',
      isActive: true,
    },
  ];

  const aboutConfig = {
    badge: 'Nuestra Historia & Compromiso',
    title: 'Más que electrodomésticos,',
    titleHighlight: 'confort para tu vida',
    description: 'En Papes Confort creemos que comprar para tu casa debe ser una experiencia simple, transparente y cercana. Desde nuestro local en Basavilbaso, Entre Ríos, te acompañamos para elegir el producto que mejor se adapta a tus necesidades y a tu presupuesto.',
    imageUrl: uploadedUrls['edificio'] || '/images/edificio.webp',
    storeLocation: 'Basavilbaso, Entre Ríos • Atención personalizada',
    whatsappMessage: '¡Hola Papes Confort! Me gustaría hacerles una consulta sobre sus productos y envíos.',
    primaryBtnText: 'Contactar a un asesor por WhatsApp',
    secondaryBtnText: 'Ver catálogo completo',
    secondaryBtnUrl: '/catalogo',
    isActive: true,
  };

  // Guardar en la base de datos a través de Prisma
  console.log('\nGuardando configuraciones con URLs de Cloudinary en la base de datos...');
  await prisma.setting.upsert({
    where: { key: 'home_hero_banner' },
    update: { value: JSON.stringify(heroBannerConfig) },
    create: { key: 'home_hero_banner', value: JSON.stringify(heroBannerConfig) },
  });

  await prisma.setting.upsert({
    where: { key: 'home_category_cards' },
    update: { value: JSON.stringify(categoryCardsConfig) },
    create: { key: 'home_category_cards', value: JSON.stringify(categoryCardsConfig) },
  });

  await prisma.setting.upsert({
    where: { key: 'home_weekly_offer' },
    update: { value: JSON.stringify(weeklyOfferConfig) },
    create: { key: 'home_weekly_offer', value: JSON.stringify(weeklyOfferConfig) },
  });

  await prisma.setting.upsert({
    where: { key: 'home_trust_bar' },
    update: { value: JSON.stringify(trustBarConfig) },
    create: { key: 'home_trust_bar', value: JSON.stringify(trustBarConfig) },
  });

  await prisma.setting.upsert({
    where: { key: 'home_about' },
    update: { value: JSON.stringify(aboutConfig) },
    create: { key: 'home_about', value: JSON.stringify(aboutConfig) },
  });

  console.log('Todas las configuraciones y URLs de Cloudinary han sido guardadas exitosamente en la base de datos.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error durante la ejecución:', err);
  process.exit(1);
});
