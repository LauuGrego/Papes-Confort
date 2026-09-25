import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentResult } from '@papes-confort/shared';

vi.mock('../../config/env', () => ({
  env: {
    MOBBEX_API_KEY: 'test-api-key',
    MOBBEX_ACCESS_TOKEN: 'test-access-token',
    MOBBEX_TEST_MODE: true,
    MOBBEX_TIMEOUT_MINUTES: 15,
  },
}));

import { mapMobbexStatus, createMobbexCheckout, validateWebhook } from '../mobbex.service';

describe('Mobbex Service', () => {
  describe('mapMobbexStatus', () => {
    it('should map 200 and 201 to APPROVED', () => {
      expect(mapMobbexStatus(200)).toBe(PaymentResult.APPROVED);
      expect(mapMobbexStatus(201)).toBe(PaymentResult.APPROVED);
    });

    it('should map 302 to PENDING', () => {
      expect(mapMobbexStatus(302)).toBe(PaymentResult.PENDING);
    });

    it('should map 400, 401, 500 and other errors to REJECTED', () => {
      expect(mapMobbexStatus(400)).toBe(PaymentResult.REJECTED);
      expect(mapMobbexStatus(401)).toBe(PaymentResult.REJECTED);
      expect(mapMobbexStatus(500)).toBe(PaymentResult.REJECTED);
      expect(mapMobbexStatus(0)).toBe(PaymentResult.REJECTED);
      expect(mapMobbexStatus(999)).toBe(PaymentResult.REJECTED);
    });
  });

  describe('createMobbexCheckout with mocked fetch', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should successfully return checkoutId and url when Mobbex API responds ok', async () => {
      const mockResponse = {
        result: true,
        data: {
          id: 'checkout-12345',
          url: 'https://mobbex.com/p/checkout/12345',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const fakeOrder: any = {
        id: 'order-1',
        orderNumber: 'PC-20260924-1234',
        total: 15000,
        shippingCost: 0,
        customerEmail: 'test@example.com',
        customerName: 'Juan Perez',
      };

      const fakeItems: any[] = [
        {
          productNameSnapshot: 'Colchón King',
          skuSnapshot: 'COL-001',
          quantity: 1,
          unitPrice: 15000,
          total: 15000,
        },
      ];

      const res = await createMobbexCheckout({
        order: fakeOrder,
        items: fakeItems,
        returnUrl: 'https://papesconfort.com/resultado',
        webhookUrl: 'https://api.papesconfort.com/api/webhooks/mobbex',
      });

      expect(res.checkoutId).toBe('checkout-12345');
      expect(res.url).toBe('https://mobbex.com/p/checkout/12345');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when Mobbex returns result: false', async () => {
      const mockErrorResponse = {
        result: false,
        error: 'Invalid API Key',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      } as any);

      const fakeOrder: any = {
        id: 'order-2',
        orderNumber: 'PC-20260924-5678',
        total: 20000,
        shippingCost: 0,
        customerEmail: 'test2@example.com',
        customerName: 'Maria Lopez',
      };

      await expect(
        createMobbexCheckout({
          order: fakeOrder,
          items: [],
          returnUrl: 'https://papesconfort.com/resultado',
          webhookUrl: 'https://api.papesconfort.com/api/webhooks/mobbex',
        })
      ).rejects.toThrow('Error Mobbex (401): Invalid API Key');
    });
  });

  describe('validateWebhook', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should return true when status code is valid and reference matches', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: true,
          data: {
            status: { code: 200 },
            checkout: { reference: 'PC-20260924-1234' },
          },
        }),
      } as any);

      const isValid = await validateWebhook('checkout-123', 'PC-20260924-1234');
      expect(isValid).toBe(true);
    });

    it('should return false if reference does not match', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: true,
          data: {
            status: { code: 200 },
            checkout: { reference: 'PC-DIFFERENT-REF' },
          },
        }),
      } as any);

      const isValid = await validateWebhook('checkout-123', 'PC-20260924-1234');
      expect(isValid).toBe(false);
    });
  });
});
