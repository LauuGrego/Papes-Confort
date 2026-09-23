import { create } from 'zustand';
import { InstallmentsConfigDto, DEFAULT_INSTALLMENTS_CONFIG } from '@papes-confort/shared';
import { fetchApi } from '../lib/api';

interface InstallmentsState {
  config: InstallmentsConfigDto;
  isLoaded: boolean;
  isLoading: boolean;
  load: (force?: boolean) => Promise<void>;
  updateConfigLocally: (config: Partial<InstallmentsConfigDto>) => void;
  calculateInstallment: (listPrice: number, customInstallments?: number) => number;
}

export const useInstallmentsStore = create<InstallmentsState>((set, get) => ({
  config: DEFAULT_INSTALLMENTS_CONFIG,
  isLoaded: false,
  isLoading: false,

  load: async (force = false) => {
    if (get().isLoaded && !force) return;
    set({ isLoading: true });

    try {
      const res = await fetchApi<{ installments_config?: string }>('/api/settings/public');
      if (res.success && res.data?.installments_config) {
        try {
          const parsed = JSON.parse(res.data.installments_config);
          if (parsed && typeof parsed === 'object') {
            set({
              config: {
                defaultInstallments:
                  typeof parsed.defaultInstallments === 'number' && parsed.defaultInstallments > 0
                    ? parsed.defaultInstallments
                    : DEFAULT_INSTALLMENTS_CONFIG.defaultInstallments,
                bankPromoActive:
                  typeof parsed.bankPromoActive === 'boolean'
                    ? parsed.bankPromoActive
                    : DEFAULT_INSTALLMENTS_CONFIG.bankPromoActive,
                bankPromoName:
                  typeof parsed.bankPromoName === 'string' && parsed.bankPromoName.trim().length > 0
                    ? parsed.bankPromoName
                    : DEFAULT_INSTALLMENTS_CONFIG.bankPromoName,
                bankPromoInstallments:
                  typeof parsed.bankPromoInstallments === 'number' && parsed.bankPromoInstallments > 0
                    ? parsed.bankPromoInstallments
                    : DEFAULT_INSTALLMENTS_CONFIG.bankPromoInstallments,
                bankPromoText:
                  typeof parsed.bankPromoText === 'string'
                    ? parsed.bankPromoText
                    : DEFAULT_INSTALLMENTS_CONFIG.bankPromoText,
              },
              isLoaded: true,
              isLoading: false,
            });
            return;
          }
        } catch (e) {
          console.error('Error parseando installments_config:', e);
        }
      }
      set({ isLoaded: true, isLoading: false });
    } catch (err) {
      console.error('Error cargando installments_config:', err);
      set({ isLoaded: true, isLoading: false });
    }
  },

  updateConfigLocally: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));
  },

  calculateInstallment: (listPrice: number, customInstallments?: number) => {
    const installments = customInstallments && customInstallments > 0
      ? customInstallments
      : get().config.defaultInstallments || 1;
    if (installments <= 0 || !listPrice || listPrice <= 0) return 0;
    return Math.round(listPrice / installments);
  },
}));

/**
 * Helper standalone para calcular cuota dada una configuración y un precio de lista
 */
export function computeInstallmentAmount(listPrice: number, installmentsCount: number): number {
  if (installmentsCount <= 0 || !listPrice || listPrice <= 0) return 0;
  return Math.round(listPrice / installmentsCount);
}
