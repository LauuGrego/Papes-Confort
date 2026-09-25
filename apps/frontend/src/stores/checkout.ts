import { create } from 'zustand';
import { CheckoutStep, PaymentMethod, ShippingType } from '@papes-confort/shared';

export interface ShippingState {
  shippingType: ShippingType;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  notes: string;
}

interface CheckoutState {
  step: CheckoutStep;
  paymentMethod: PaymentMethod | null;
  shipping: ShippingState;
  setStep: (step: CheckoutStep) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setShipping: (shipping: Partial<ShippingState>) => void;
  reset: () => void;
}

const initialShipping: ShippingState = {
  shippingType: ShippingType.LOCAL_PAID,
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  notes: '',
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: CheckoutStep.SHIPPING,
  paymentMethod: null,
  shipping: initialShipping,
  setStep: (step) => set({ step }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setShipping: (shipping) =>
    set((state) => ({ shipping: { ...state.shipping, ...shipping } })),
  reset: () =>
    set({
      step: CheckoutStep.SHIPPING,
      paymentMethod: null,
      shipping: initialShipping,
    }),
}));
