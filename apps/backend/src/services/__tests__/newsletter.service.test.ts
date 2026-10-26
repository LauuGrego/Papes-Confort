import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSubscribers,
  toggleSubscriberStatus,
  renderNewsletterHtml,
} from '../newsletter.service';
import { shouldRunCampaign } from '../newsletter.job';
import { prisma } from '@papes-confort/database';

vi.mock('@papes-confort/database', () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Newsletter Service & Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscribers', () => {
    it('debería retornar suscriptores con estadísticas', async () => {
      const mockCustomer = {
        id: 'cust-1',
        name: 'Martín Fierro',
        email: 'martin@ejemplo.com',
        phone: '1122334455',
        city: 'Gualeguaychú',
        province: 'Entre Ríos',
        cuilCuit: '20123456789',
        marketingOptIn: true,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        _count: { orders: 2 },
      };

      vi.mocked(prisma.customer.findMany).mockResolvedValue([mockCustomer as any]);
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(1); // total filtered
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(10); // total customers
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(8); // total subscribed
      vi.mocked(prisma.customer.count).mockResolvedValueOnce(2); // total unsubscribed

      const result = await getSubscribers({ status: 'subscribed' });

      expect(result.subscribers.length).toBe(1);
      expect(result.subscribers[0].name).toBe('Martín Fierro');
      expect(result.subscribers[0].marketingOptIn).toBe(true);
      expect(result.totalSubscribed).toBe(8);
      expect(result.totalUnsubscribed).toBe(2);
      expect(result.totalCustomers).toBe(10);
    });
  });

  describe('toggleSubscriberStatus', () => {
    it('debería actualizar el opt-in del cliente', async () => {
      const updatedMock = {
        id: 'cust-1',
        name: 'Martín Fierro',
        email: 'martin@ejemplo.com',
        phone: null,
        city: null,
        province: null,
        cuilCuit: null,
        marketingOptIn: false,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        _count: { orders: 0 },
      };

      vi.mocked(prisma.customer.update).mockResolvedValue(updatedMock as any);

      const res = await toggleSubscriberStatus('cust-1', false);

      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1' },
          data: { marketingOptIn: false },
        })
      );
      expect(res.marketingOptIn).toBe(false);
    });
  });

  describe('renderNewsletterHtml', () => {
    it('debería reemplazar la variable {{nombre}} por el primer nombre', () => {
      const html = renderNewsletterHtml({
        subject: 'Grandes ofertas en colchones',
        content: 'Estimado {{nombre}}, tenemos ofertas especiales para vos.',
        customerName: 'Lautaro Gregorio',
        customerEmail: 'lautaro@test.com',
      });

      expect(html).toContain('¡Hola Lautaro!');
      expect(html).toContain('Estimado Lautaro, tenemos ofertas especiales para vos.');
      expect(html).toContain('PAPES CONFORT');
    });

    it('debería renderizar el botón CTA si está configurado', () => {
      const html = renderNewsletterHtml({
        subject: 'Outlet imperdible',
        content: 'Mirá nuestros productos con hasta 40% OFF.',
        ctaText: 'Ver Outlet Ahora',
        ctaUrl: 'https://papesconfort.com/catalogo?type=outlet',
        customerName: 'Ana María',
      });

      expect(html).toContain('Ver Outlet Ahora');
      expect(html).toContain('https://papesconfort.com/catalogo?type=outlet');
    });
  });

  describe('shouldRunCampaign (Scheduler)', () => {
    it('no debe ejecutar si el estado es PAUSED o DRAFT', () => {
      const shouldRun = shouldRunCampaign({
        status: 'PAUSED',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5],
        time: '10:00',
      });
      expect(shouldRun).toBe(false);
    });

    it('no debe ejecutar si es MANUAL', () => {
      const shouldRun = shouldRunCampaign({
        status: 'ACTIVE',
        frequency: 'MANUAL',
        daysOfWeek: [],
        time: '10:00',
      });
      expect(shouldRun).toBe(false);
    });

    it('no debe ejecutar si ya se envió en las últimas horas', () => {
      const now = new Date('2026-10-26T10:05:00Z');
      const recentSend = new Date('2026-10-26T09:00:00Z').toISOString();

      const shouldRun = shouldRunCampaign(
        {
          status: 'ACTIVE',
          frequency: 'DAILY',
          daysOfWeek: [1, 2, 3, 4, 5],
          time: '10:00',
          lastSentAt: recentSend,
        },
        now
      );
      expect(shouldRun).toBe(false);
    });
  });
});
