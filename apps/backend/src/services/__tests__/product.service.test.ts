import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, isProductOfferActive } from '../product.service';
import { prisma } from '@papes-confort/database';

vi.mock('@papes-confort/database', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ProductService - isProductOfferActive', () => {
  it('retorna false si el producto es nulo o indefinido', () => {
    expect(isProductOfferActive(null as any)).toBe(false);
    expect(isProductOfferActive(undefined as any)).toBe(false);
  });

  it('retorna false si el producto es de tipo OUTLET o rubro outlet', () => {
    expect(isProductOfferActive({
      productType: 'OUTLET',
      discountPercent: 20,
      specs: { offerEndDate: '2099-12-31' },
    })).toBe(false);

    expect(isProductOfferActive({
      productType: 'OFFER',
      isOutlet: true,
      discountPercent: 20,
      specs: { offerEndDate: '2099-12-31' },
    })).toBe(false);

    expect(isProductOfferActive({
      productType: 'OFFER',
      productFamily: { slug: 'outlet' },
      discountPercent: 20,
      specs: { offerEndDate: '2099-12-31' },
    })).toBe(false);
  });

  it('retorna false si productType no es OFFER', () => {
    expect(isProductOfferActive({
      productType: 'NORMAL',
      discountPercent: 30,
      specs: { offerEndDate: '2099-12-31' },
    })).toBe(false);
  });

  it('retorna false si discountPercent es 0 o negativo', () => {
    expect(isProductOfferActive({
      productType: 'OFFER',
      discountPercent: 0,
      specs: { offerEndDate: '2099-12-31' },
    })).toBe(false);
  });

  it('retorna false si offerEndDate no está presente o expiró', () => {
    // Sin offerEndDate
    expect(isProductOfferActive({
      productType: 'OFFER',
      discountPercent: 25,
      specs: {},
    })).toBe(false);

    // Fecha expirada en el pasado
    expect(isProductOfferActive({
      productType: 'OFFER',
      discountPercent: 25,
      specs: { offerEndDate: '2020-01-01' },
    })).toBe(false);
  });

  it('retorna true cuando el producto cumple estrictamente todas las condiciones de stock_prexsuc', () => {
    expect(isProductOfferActive({
      productType: 'OFFER',
      discountPercent: 25,
      specs: { offerEndDate: '2099-12-31' },
    })).toBe(true);
  });
});

describe('ProductService - getProducts sorting and offer filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.product.count).mockResolvedValue(0);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
  });

  it('filtra estrictamente por ofertas vigentes de stock_prexsuc cuando se solicita offer=all o productType=OFFER', async () => {
    await getProducts({ offerSlug: 'all' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              productType: 'OFFER',
              discountPercent: { gt: 0 },
              specs: expect.objectContaining({
                path: ['offerEndDate'],
              }),
            }),
          ]),
        }),
      })
    );
  });

  it('debería ordenar por defecto alfabéticamente A-Z (name: asc) cuando no se pasa sort', async () => {
    await getProducts({});

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    );
  });

  it('debería ordenar alfabéticamente A-Z cuando sort es name_asc o relevance', async () => {
    await getProducts({ sort: 'name_asc' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    );

    await getProducts({ sort: 'relevance' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    );
  });

  it('debería ordenar alfabéticamente Z-A cuando sort es name_desc', async () => {
    await getProducts({ sort: 'name_desc' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'desc' },
      })
    );
  });

  it('debería mantener los demás ordenamientos cuando se solicitan explícitamente', async () => {
    await getProducts({ sort: 'price_asc' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { basePrice: 'asc' },
      })
    );

    await getProducts({ sort: 'price_desc' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { basePrice: 'desc' },
      })
    );

    await getProducts({ sort: 'recent' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );

    await getProducts({ sort: 'offers' });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { discountPercent: 'desc' },
      })
    );
  });
});
