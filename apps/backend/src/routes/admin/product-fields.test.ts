import { describe, it, expect } from 'vitest';
import { filterProductUpdateFields } from './products';

describe('filterProductUpdateFields (helper de sanitización)', () => {
  it('debería conservar únicamente los campos web-only permitidos', () => {
    const rawBody = {
      description: 'Una excelente descripción del producto',
      discountPercent: 15,
      warrantyMonths: 24,
      weightKg: 2.5,
      dimensions: '120x60x60',
      specs: { capacidad: '350L' },
      productType: 'NORMAL',
    };

    const result = filterProductUpdateFields(rawBody);

    expect(result).toEqual(rawBody);
  });

  it('debería filtrar y eliminar los campos maestros gobernados por GesCom', () => {
    const rawBody = {
      name: 'Nombre modificado ilegalmente',
      isActive: false,
      productCategoryId: 'cat-new-id',
      basePrice: 50000,
      stock: 999,
      // web-only
      description: 'Descripción permitida',
    };

    const result = filterProductUpdateFields(rawBody);

    expect(result).toEqual({
      description: 'Descripción permitida',
    });
    expect(result.name).toBeUndefined();
    expect(result.isActive).toBeUndefined();
    expect(result.productCategoryId).toBeUndefined();
    expect(result.basePrice).toBeUndefined();
    expect(result.stock).toBeUndefined();
  });

  it('debería retornar un objeto vacío si no se pasan campos permitidos', () => {
    const rawBody = {
      name: 'Solo campos GesCom',
      isActive: true,
      stock: 10,
    };

    const result = filterProductUpdateFields(rawBody);

    expect(result).toEqual({});
  });

  it('debería retornar un objeto vacío si el body no es un objeto válido', () => {
    expect(filterProductUpdateFields(null)).toEqual({});
    expect(filterProductUpdateFields(undefined)).toEqual({});
    expect(filterProductUpdateFields('string')).toEqual({});
  });
});
