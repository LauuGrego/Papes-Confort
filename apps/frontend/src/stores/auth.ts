import { create } from 'zustand';
import { UserPayload } from '@papes-confort/shared';

interface AuthState {
  user: UserPayload | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserPayload | null, token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: !!token }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
