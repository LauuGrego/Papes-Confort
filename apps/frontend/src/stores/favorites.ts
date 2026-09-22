import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductDto } from '@papes-confort/shared';

interface FavoritesState {
  favoritesByCustomer: Record<string, ProductDto[]>;
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  getItems: (customerId?: string | null) => ProductDto[];
  getCount: (customerId?: string | null) => number;
  isFavorite: (productId: string, customerId?: string | null) => boolean;
  toggleFavorite: (product: ProductDto, customerId: string) => boolean;
  removeFavorite: (productId: string, customerId: string) => void;
  clearFavorites: (customerId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritesByCustomer: {},
      hasHydrated: false,

      setHasHydrated: (val: boolean) => set({ hasHydrated: val }),

      getItems: (customerId?: string | null) => {
        if (!customerId) return [];
        return get().favoritesByCustomer[customerId] || [];
      },

      getCount: (customerId?: string | null) => {
        if (!customerId) return 0;
        return (get().favoritesByCustomer[customerId] || []).length;
      },

      isFavorite: (productId: string, customerId?: string | null) => {
        if (!customerId) return false;
        const list = get().favoritesByCustomer[customerId] || [];
        return list.some((item) => item.id === productId);
      },

      toggleFavorite: (product: ProductDto, customerId: string) => {
        if (!customerId) return false;
        const currentList = get().favoritesByCustomer[customerId] || [];
        const exists = currentList.some((item) => item.id === product.id);

        let updatedList: ProductDto[];
        let isNowFavorite: boolean;

        if (exists) {
          updatedList = currentList.filter((item) => item.id !== product.id);
          isNowFavorite = false;
        } else {
          updatedList = [product, ...currentList];
          isNowFavorite = true;
        }

        set((state) => ({
          favoritesByCustomer: {
            ...state.favoritesByCustomer,
            [customerId]: updatedList,
          },
        }));

        return isNowFavorite;
      },

      removeFavorite: (productId: string, customerId: string) => {
        if (!customerId) return;
        set((state) => {
          const currentList = state.favoritesByCustomer[customerId] || [];
          return {
            favoritesByCustomer: {
              ...state.favoritesByCustomer,
              [customerId]: currentList.filter((item) => item.id !== productId),
            },
          };
        });
      },

      clearFavorites: (customerId: string) => {
        if (!customerId) return;
        set((state) => ({
          favoritesByCustomer: {
            ...state.favoritesByCustomer,
            [customerId]: [],
          },
        }));
      },
    }),
    {
      name: 'papes-confort-favorites',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
