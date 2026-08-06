import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from './cart';
import { fetchApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  fetchApi: vi.fn(),
}));

describe('CartStore (Zustand)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({
      items: [],
      subtotal: 0,
      totalItems: 0,
      isLoading: false,
      error: null,
    });
  });

  it('debería cargar el carrito exitosamente mediante la API', async () => {
    const mockCart = {
      id: 'cart-123',
      sessionId: 'session-123',
      status: 'ACTIVE',
      items: [
        {
          productId: 'prod-1',
          productName: 'Papel',
          brand: 'Confort',
          sku: '123',
          imageUrl: 'url',
          quantity: 2,
          unitPrice: 100,
          discount: 0,
          total: 200,
        },
      ],
      subtotal: 200,
      totalItems: 2,
    };

    vi.mocked(fetchApi).mockResolvedValue({
      success: true,
      data: mockCart,
    });

    await useCartStore.getState().load();

    expect(fetchApi).toHaveBeenCalledWith('/api/cart');
    expect(useCartStore.getState().items).toEqual(mockCart.items);
    expect(useCartStore.getState().subtotal).toBe(200);
    expect(useCartStore.getState().totalItems).toBe(2);
    expect(useCartStore.getState().isLoading).toBe(false);
  });

  it('debería manejar errores si falla la carga del carrito', async () => {
    vi.mocked(fetchApi).mockResolvedValue({
      success: false,
      error: 'Error de conexión',
    });

    await useCartStore.getState().load();

    expect(useCartStore.getState().error).toBe('Error de conexión');
    expect(useCartStore.getState().isLoading).toBe(false);
  });

  it('debería agregar un producto llamando a POST /api/cart/items', async () => {
    const mockCartResponse = {
      id: 'cart-123',
      sessionId: 'session-123',
      status: 'ACTIVE',
      items: [
        {
          productId: 'prod-1',
          productName: 'Papel',
          brand: 'Confort',
          sku: '123',
          imageUrl: 'url',
          quantity: 1,
          unitPrice: 100,
          discount: 0,
          total: 100,
        },
      ],
      subtotal: 100,
      totalItems: 1,
    };

    vi.mocked(fetchApi).mockResolvedValue({
      success: true,
      data: mockCartResponse,
    });

    await useCartStore.getState().addItem('prod-1', 1);

    expect(fetchApi).toHaveBeenCalledWith('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: 'prod-1', quantity: 1 }),
    });
    expect(useCartStore.getState().items).toEqual(mockCartResponse.items);
    expect(useCartStore.getState().totalItems).toBe(1);
  });
});
