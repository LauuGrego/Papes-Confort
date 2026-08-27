import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomerDto, UserPayload } from '@papes-confort/shared';

interface AuthState {
  user: UserPayload | null;
  customer: CustomerDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setAuth: (user: UserPayload | null, token: string | null, customer?: CustomerDto | null) => void;
  setCustomer: (customer: CustomerDto | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      customer: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),
      setAuth: (user, token, customer = null) =>
        set({ user, accessToken: token, customer, isAuthenticated: !!token }),
      setCustomer: (customer) => set({ customer }),
      clearAuth: () => set({ user: null, customer: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'papes-confort-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
