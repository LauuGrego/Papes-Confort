import { create } from 'zustand';
import { CartDto, CartItemDto } from '@papes-confort/shared';
import { fetchApi } from '../lib/api';

interface CartState {
  items: CartItemDto[];
  subtotal: number;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  subtotal: 0,
  totalItems: 0,
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    const res = await fetchApi<CartDto>('/api/cart');
    if (res.success && res.data) {
      set({
        items: res.data.items,
        subtotal: res.data.subtotal,
        totalItems: res.data.totalItems,
        isLoading: false,
      });
    } else {
      set({ error: res.error || 'Error al cargar el carrito', isLoading: false });
    }
  },

  addItem: async (productId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    const res = await fetchApi<CartDto>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.success && res.data) {
      set({
        items: res.data.items,
        subtotal: res.data.subtotal,
        totalItems: res.data.totalItems,
        isLoading: false,
      });
    } else {
      const errorMsg = res.error || 'Error al agregar item al carrito';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    const res = await fetchApi<CartDto>(`/api/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    if (res.success && res.data) {
      set({
        items: res.data.items,
        subtotal: res.data.subtotal,
        totalItems: res.data.totalItems,
        isLoading: false,
      });
    } else {
      const errorMsg = res.error || 'Error al actualizar cantidad';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  removeItem: async (productId: string) => {
    set({ isLoading: true, error: null });
    const res = await fetchApi<CartDto>(`/api/cart/items/${productId}`, {
      method: 'DELETE',
    });
    if (res.success && res.data) {
      set({
        items: res.data.items,
        subtotal: res.data.subtotal,
        totalItems: res.data.totalItems,
        isLoading: false,
      });
    } else {
      const errorMsg = res.error || 'Error al eliminar item';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  clear: async () => {
    set({ isLoading: true, error: null });
    const res = await fetchApi<CartDto>('/api/cart', {
      method: 'DELETE',
    });
    if (res.success && res.data) {
      set({
        items: res.data.items,
        subtotal: res.data.subtotal,
        totalItems: res.data.totalItems,
        isLoading: false,
      });
    } else {
      const errorMsg = res.error || 'Error al vaciar el carrito';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },
}));
