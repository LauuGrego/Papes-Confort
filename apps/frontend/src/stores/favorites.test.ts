import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoritesStore } from './favorites';
import { ProductDto } from '@papes-confort/shared';

const mockProduct: ProductDto = {
  id: 'prod-1',
  sku: 'SKU1',
  gescomName: 'COLCHON KING',
  name: 'Colchón King Size',
  slug: 'colchon-king-size',
  description: 'Colchón King Size alta densidad',
  basePrice: 100000,
  listPrice: 100000,
  finalPrice: 80000,
  discountPercent: 20,
  stock: 5,
  stockVisible: 5,
  brand: { id: 'b1', name: 'Piero', slug: 'piero' },
  productType: { id: 'pt1', name: 'Colchones', slug: 'colchones' },
  productCategory: { id: 'pc1', name: 'Resortes', slug: 'resortes', productTypeId: 'pt1' },
  images: [],
  isOutlet: false,
  isActive: true,
  warrantyMonths: 12,
  weightKg: 25,
  dimensions: '200x200x30',
  specs: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useFavoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favoritesByCustomer: {}, hasHydrated: true });
  });

  it('should toggle favorite for customer', () => {
    const customerId = 'cust-123';
    expect(useFavoritesStore.getState().getCount(customerId)).toBe(0);
    expect(useFavoritesStore.getState().isFavorite(mockProduct.id, customerId)).toBe(false);

    // Add
    const added = useFavoritesStore.getState().toggleFavorite(mockProduct, customerId);
    expect(added).toBe(true);
    expect(useFavoritesStore.getState().getCount(customerId)).toBe(1);
    expect(useFavoritesStore.getState().isFavorite(mockProduct.id, customerId)).toBe(true);
    expect(useFavoritesStore.getState().getItems(customerId)[0].id).toBe(mockProduct.id);

    // Remove
    const removed = useFavoritesStore.getState().toggleFavorite(mockProduct, customerId);
    expect(removed).toBe(false);
    expect(useFavoritesStore.getState().getCount(customerId)).toBe(0);
    expect(useFavoritesStore.getState().isFavorite(mockProduct.id, customerId)).toBe(false);
  });

  it('should isolate favorites between different customers', () => {
    const cust1 = 'cust-1';
    const cust2 = 'cust-2';

    useFavoritesStore.getState().toggleFavorite(mockProduct, cust1);
    expect(useFavoritesStore.getState().getCount(cust1)).toBe(1);
    expect(useFavoritesStore.getState().getCount(cust2)).toBe(0);
  });

  it('should clear favorites for a customer', () => {
    const customerId = 'cust-1';
    useFavoritesStore.getState().toggleFavorite(mockProduct, customerId);
    expect(useFavoritesStore.getState().getCount(customerId)).toBe(1);

    useFavoritesStore.getState().clearFavorites(customerId);
    expect(useFavoritesStore.getState().getCount(customerId)).toBe(0);
  });
});
