import { prisma } from '@papes-confort/database';
import { ProductDto, BrandDto, ProductTypeDto, ProductCategoryDto, ProductImageDto } from '@papes-confort/shared';

export async function mapProductToDto(product: any, safetyStock?: number): Promise<ProductDto> {
  safetyStock = 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real

  const basePriceNum = Number(product.basePrice); // AVenta (Contado desde GesCom)
  const listPriceNum = product.listPrice !== null && product.listPrice !== undefined && Number(product.listPrice) > 0
    ? Number(product.listPrice)
    : basePriceNum; // AValor (Lista desde GesCom, fallback a AVenta si aún no se cargó AValor)

  const offerDiscount = Number(product.discountPercent);

  const finalPriceNum = offerDiscount > 0
    ? listPriceNum * (1 - offerDiscount / 100)
    : basePriceNum;

  // discountPercent solo representa ofertas promocionales activas creadas explícitamente
  const discountPercentNum = offerDiscount > 0 ? offerDiscount : 0;

  const brandDto: BrandDto = {
    id: product.brand.id,
    name: product.brand.name,
    slug: product.brand.slug,
  };

  const productTypeDto: ProductTypeDto = {
    id: product.productFamily.id,
    name: product.productFamily.name,
    slug: product.productFamily.slug,
  };

  const productCategoryDto: ProductCategoryDto = product.productCategory ? {
    id: product.productCategory.id,
    name: product.productCategory.name,
    slug: product.productCategory.slug,
    productTypeId: product.productCategory.productFamilyId,
  } : {
    id: '',
    name: 'Sin Categoría',
    slug: 'sin-categoria',
    productTypeId: product.productFamily.id,
  };

  const imageDtos: ProductImageDto[] = (product.images || []).map((img: any) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  }));

  let dimensionsStr: string | null = null;
  if (product.dimensions && typeof product.dimensions === 'object') {
    const dims = product.dimensions as Record<string, any>;
    if (dims.alto || dims.ancho || dims.prof) {
      dimensionsStr = `${dims.alto || 0}x${dims.ancho || 0}x${dims.prof || 0}`;
    }
  }

  return {
    id: product.id,
    sku: product.sku,
    gescomId: product.gescomId,
    barcode: product.barcode,
    gescomName: product.gescomName,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: basePriceNum,
    listPrice: listPriceNum,
    finalPrice: finalPriceNum,
    discountPercent: discountPercentNum,
    stock: product.stock,
    stockVisible: Math.max(0, product.stock - safetyStock),
    brand: brandDto,
    productType: productTypeDto,
    productCategory: productCategoryDto,
    images: imageDtos,
    isOutlet: product.productType === 'OUTLET',
    isActive: product.isActive,
    warrantyMonths: product.warrantyMonths ?? null,
    weightKg: product.weightKg ? Number(product.weightKg) : null,
    dimensions: dimensionsStr,
    specs: (product.specs as Record<string, any>) || {},
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  categoryId?: string;
  typeSlug?: string;
  productType?: string;
  offerId?: string;
  offerSlug?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const skip = (page - 1) * limit;

  const safetyStock = 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real

  const where: any = {
    isActive: true,
    deletedAt: null,
    stock: { gt: safetyStock },
  };

  if (params.brandId) {
    where.brandId = params.brandId;
  }

  if (params.categoryId) {
    where.productCategoryId = params.categoryId;
  }

  if (params.typeSlug) {
    where.productFamily = {
      slug: params.typeSlug,
    };
  }

  if (params.productType) {
    where.productType = params.productType;
  }

  const andConditions: any[] = [];

  if (params.offerId) {
    where.offers = { some: { offerId: params.offerId } };
  } else if (params.offerSlug) {
    if (params.offerSlug === 'all' || params.offerSlug === 'todas') {
      andConditions.push({
        OR: [
          { offers: { some: { offer: { isActive: true } } } },
          { productType: 'OFFER' },
          { discountPercent: { gt: 0 } },
        ],
      });
    } else {
      where.offers = { some: { offer: { slug: params.offerSlug } } };
    }
  }

  if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
    where.basePrice = { ...(where.basePrice || {}), gte: params.minPrice };
  }

  if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
    where.basePrice = { ...(where.basePrice || {}), lte: params.maxPrice };
  }

  if (params.inStock) {
    where.stock = { gt: 0 };
  }

  if (params.search) {
    const searchTerm = params.search.toLowerCase();
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { productFamily: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { productCategory: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (params.sort === 'price_asc') {
    orderBy = { basePrice: 'asc' };
  } else if (params.sort === 'price_desc') {
    orderBy = { basePrice: 'desc' };
  } else if (params.sort === 'recent') {
    orderBy = { createdAt: 'desc' };
  } else if (params.sort === 'offers') {
    orderBy = { discountPercent: 'desc' };
  } else if (params.sort === 'name_asc') {
    orderBy = { name: 'asc' };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        productFamily: true,
        productCategory: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  const dtos = await Promise.all(items.map(item => mapProductToDto(item, safetyStock)));

  return {
    items: dtos,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDto | null> {
  const safetyStock = 0; // Se desactiva el stock de seguridad para mostrar siempre el stock real

  const product = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
      deletedAt: null,
      stock: { gt: safetyStock },
    },
    include: {
      brand: true,
      productFamily: true,
      productCategory: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!product) return null;
  return mapProductToDto(product, safetyStock);
}

export async function getAdminProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  const page = params.page || 1;
  const limit = params.limit || 15;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

  const andConditions: any[] = [];

  if (params.isActive !== undefined) {
    if (params.isActive) {
      andConditions.push({ isActive: true });
      andConditions.push({ stock: { gt: 0 } });
    } else {
      andConditions.push({
        OR: [
          { isActive: false },
          { stock: { lte: 0 } },
        ],
      });
    }
  }

  if (params.search) {
    const searchTerm = params.search.toLowerCase();
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { gescomName: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        productFamily: true,
        productCategory: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      skip,
      take: limit,
      orderBy: { sku: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  const dtos = await Promise.all(items.map(item => mapProductToDto(item)));

  return {
    items: dtos,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAdminProductById(id: string): Promise<ProductDto | null> {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      brand: true,
      productFamily: true,
      productCategory: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!product) return null;
  return mapProductToDto(product);
}

export async function updateProduct(id: string, data: {
  name?: string;
  description?: string;
  productCategoryId?: string;
  productType?: any;
  discountPercent?: number;
  warrantyMonths?: number | null;
  weightKg?: number;
  dimensions?: { alto?: number; ancho?: number; prof?: number; } | string;
  specs?: Record<string, any>;
  isActive?: boolean;
}): Promise<ProductDto> {
  // Convert dimensions to JSON if string "alto x ancho x prof" is passed in
  let dimensionsJson: any = undefined;
  if (data.dimensions === null) {
    dimensionsJson = null;
  } else if (data.dimensions) {
    if (typeof data.dimensions === 'string') {
      const parts = data.dimensions.split('x');
      if (parts.length === 3) {
        dimensionsJson = {
          alto: parseFloat(parts[0]) || 0,
          ancho: parseFloat(parts[1]) || 0,
          prof: parseFloat(parts[2]) || 0,
        };
      }
    } else {
      dimensionsJson = data.dimensions;
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      productCategoryId: data.productCategoryId || undefined,
      productType: data.productType,
      discountPercent: data.discountPercent !== undefined ? Number(data.discountPercent) : undefined,
      warrantyMonths: data.warrantyMonths,
      weightKg: data.weightKg === null ? null : (data.weightKg !== undefined ? Number(data.weightKg) : undefined),
      dimensions: dimensionsJson !== undefined ? dimensionsJson : undefined,
      specs: data.specs,
      isActive: data.isActive,
    },
    include: {
      brand: true,
      productFamily: true,
      productCategory: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return mapProductToDto(updated);
}
