import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapOrderToDetailDto, applyPaymentResult } from '../order.service';
import { OrderStatus, PaymentMethod, PaymentResult, ShippingType } from '@papes-confort/shared';
import { prisma } from '@papes-confort/database';

vi.mock('@papes-confort/database', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    bankAccount: {
      findFirst: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../email.service', () => ({
  sendCustomerOrderCreatedEmail: vi.fn().mockResolvedValue(undefined),
  sendCustomerPaymentApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendCustomerTransferPendingEmail: vi.fn().mockResolvedValue(undefined),
  sendCustomerOrderCancelledEmail: vi.fn().mockResolvedValue(undefined),
  sendAdminNewPaidOrderNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Order Service', () => {
  describe('mapOrderToDetailDto', () => {
    it('should correctly transform Prisma Order and items into OrderDetailDto', () => {
      const rawOrder = {
        id: 'ord-123',
        orderNumber: 'PC-20260924-1111',
        status: OrderStatus.PENDING_GATEWAY,
        paymentMethod: PaymentMethod.CARD,
        shippingType: ShippingType.LOCAL_PAID,
        subtotal: 50000,
        shippingCost: 2500,
        bankDiscount: 0,
        total: 52500,
        customerEmail: 'cliente@test.com',
        customerName: 'Martin Gomez',
        customerPhone: '1122334455',
        shippingAddress: 'Av. Libertador 123',
        shippingCity: 'Basavilbaso',
        shippingPostalCode: '3170',
        notes: 'Dejar en recepción',
        gatewayCheckoutId: 'chk-abc',
        installmentsCount: 3,
        paymentStatus: '200',
        createdAt: new Date('2026-09-24T10:00:00Z'),
        updatedAt: new Date('2026-09-24T10:05:00Z'),
      };

      const rawItems = [
        {
          id: 'item-1',
          productId: 'prod-1',
          productNameSnapshot: 'Sommier Queen',
          skuSnapshot: 'SOM-001',
          quantity: 1,
          unitPrice: 50000,
          discount: 0,
          total: 50000,
          product: {
            images: [{ url: 'https://images.com/sommier.jpg', isPrimary: true }],
          },
        },
      ];

      const dto = mapOrderToDetailDto(rawOrder, rawItems);

      expect(dto.id).toBe('ord-123');
      expect(dto.orderNumber).toBe('PC-20260924-1111');
      expect(dto.total).toBe(52500);
      expect(dto.gatewayCheckoutId).toBe('chk-abc');
      expect(dto.installmentsCount).toBe(3);
      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].imageUrl).toBe('https://images.com/sommier.jpg');
      expect(dto.items[0].productName).toBe('Sommier Queen');
    });
  });

  describe('applyPaymentResult idempotency', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should ignore and return order immediately if order is already PAID', async () => {
      const existingPaidOrder: any = {
        id: 'ord-paid',
        orderNumber: 'PC-PAID-001',
        status: OrderStatus.PAID,
        gatewayPaymentId: 'pay-existing',
      };

      (prisma.order.findFirst as any).mockResolvedValue(existingPaidOrder);

      const res = await applyPaymentResult('PC-PAID-001', PaymentResult.APPROVED, {
        paymentId: 'pay-existing',
      });

      expect(res).toBe(existingPaidOrder);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should update status to PAID when payment is APPROVED', async () => {
      const pendingOrder: any = {
        id: 'ord-pending',
        orderNumber: 'PC-PENDING-001',
        status: OrderStatus.PENDING_GATEWAY,
        total: 10000,
        customerName: 'Laura',
        customerEmail: 'laura@test.com',
        items: [],
      };

      const updatedPaidOrder: any = {
        ...pendingOrder,
        status: OrderStatus.PAID,
        gatewayPaymentId: 'pay-new',
        paymentStatus: '200',
      };

      (prisma.order.findFirst as any).mockResolvedValue(pendingOrder);
      (prisma.order.update as any).mockResolvedValue(updatedPaidOrder);

      const res = await applyPaymentResult('PC-PENDING-001', PaymentResult.APPROVED, {
        paymentId: 'pay-new',
        paymentStatus: '200',
      });

      expect(res.status).toBe(OrderStatus.PAID);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-pending' },
          data: expect.objectContaining({
            status: OrderStatus.PAID,
            gatewayPaymentId: 'pay-new',
          }),
        })
      );
    });
  });
});
