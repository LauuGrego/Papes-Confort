import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts } from '../product.service';
import { prisma } from '@papes-confort/database';

vi.mock('@papes-confort/database', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ProductService - getProducts sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.product.count).mockResolvedValue(0);
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
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
