import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cartService from './cart.service';
import { prisma } from '@papes-confort/database';

vi.mock('@papes-confort/database', () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}));

describe('CartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('debería retornar el carrito existente si ya existe', async () => {
      const mockCart = { id: 'cart-1', sessionId: 'session-123', status: 'ACTIVE' };
      vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);

      const result = await cartService.getOrCreateCart('session-123');

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({ where: { sessionId: 'session-123' } });
      expect(prisma.cart.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });

    it('debería crear y retornar un carrito nuevo si no existe', async () => {
      const mockCart = { id: 'cart-new', sessionId: 'session-456', status: 'ACTIVE' };
      vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue(mockCart as any);

      const result = await cartService.getOrCreateCart('session-456');

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({ where: { sessionId: 'session-456' } });
      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { sessionId: 'session-456', status: 'ACTIVE' },
      });
      expect(result).toEqual(mockCart);
    });
  });

  describe('addItem', () => {
    it('debería lanzar un error si la cantidad es menor o igual a cero', async () => {
      await expect(cartService.addItem('session-123', 'prod-1', 0)).rejects.toThrow(
        'La cantidad debe ser mayor a cero'
      );
    });

    it('debería lanzar un error si el producto no existe o está inactivo', async () => {
      const mockCart = { id: 'cart-1', sessionId: 'session-123' };
      vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(cartService.addItem('session-123', 'prod-1', 1)).rejects.toThrow(
        'Producto no encontrado o inactivo'
      );
    });

    it('debería lanzar un error si no hay stock visible suficiente', async () => {
      const mockCart = { id: 'cart-1', sessionId: 'session-123' };
      const mockProduct = {
        id: 'prod-1',
        stock: 5,
        isActive: true,
        deletedAt: null,
      };
      const mockSafetyStockSetting = { key: 'safety_stock', value: '2' }; // stock visible = 5 - 2 = 3

      vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(mockSafetyStockSetting as any);
      
      // Item ya existente en el carrito con cantidad 2. Sumado a la cantidad a agregar 2 = 4 (supera el stock visible de 3)
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue({ quantity: 2 } as any);

      await expect(cartService.addItem('session-123', 'prod-1', 2)).rejects.toThrow(
        'Stock insuficiente. Solo quedan 3 unidades disponibles.'
      );
    });

    it('debería hacer upsert del item en el carrito si hay suficiente stock disponible', async () => {
      const mockCart = { id: 'cart-1', sessionId: 'session-123' };
      const mockProduct = {
        id: 'prod-1',
        name: 'Papel Higiénico',
        sku: '123',
        basePrice: 100,
        discountPercent: 10,
        stock: 10,
        isActive: true,
        deletedAt: null,
        brand: { name: 'Papes' },
        images: [],
      };
      const mockSafetyStockSetting = { key: 'safety_stock', value: '1' }; // stock visible = 9

      vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(mockSafetyStockSetting as any);
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null); // No existía el item previamente
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue([]); // Mock de retorno para getCartDto

      await cartService.addItem('session-123', 'prod-1', 3);

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cartId_productId: {
            cartId: 'cart-1',
            productId: 'prod-1',
          },
        },
        update: {
          quantity: 3,
          unitPriceAtAdd: 100,
        },
        create: {
          cartId: 'cart-1',
          productId: 'prod-1',
          quantity: 3,
          unitPriceAtAdd: 100,
        },
      });
    });
  });

  describe('getCartDto', () => {
    it('debería retornar el DTO completo con los campos computados correctamente', async () => {
      const mockCart = { id: 'cart-1', sessionId: 'session-123', status: 'ACTIVE' };
      const mockCartItems = [
        {
          productId: 'prod-1',
          quantity: 2,
          unitPriceAtAdd: 1000,
          product: {
            id: 'prod-1',
            name: 'Papel Premium',
            sku: 'SKU1',
            discountPercent: 10, // precio con desc = 900
            brand: { name: 'Confort' },
            images: [{ isPrimary: true, url: 'http://img1' }],
          },
        },
        {
          productId: 'prod-2',
          quantity: 1,
          unitPriceAtAdd: 2000,
          product: {
            id: 'prod-2',
            name: 'Rollo Cocina',
            sku: 'SKU2',
            discountPercent: 0, // precio con desc = 2000
            brand: { name: 'Confort' },
            images: [],
          },
        },
      ];

      vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.cartItem.findMany).mockResolvedValue(mockCartItems as any);

      const result = await cartService.getCartDto('session-123');

      expect(result.subtotal).toBe(3800); // (900 * 2) + 2000 = 3800
      expect(result.totalItems).toBe(3);  // 2 + 1 = 3
      expect(result.items[0]).toEqual({
        productId: 'prod-1',
        productName: 'Papel Premium',
        brand: 'Confort',
        sku: 'SKU1',
        imageUrl: 'http://img1',
        quantity: 2,
        unitPrice: 1000,
        discount: 10,
        total: 1800,
      });
    });
  });
});
