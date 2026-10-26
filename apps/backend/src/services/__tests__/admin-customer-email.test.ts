import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendAdminNewCustomerNotificationEmail } from '../email.service';
import { prisma } from '@papes-confort/database';

vi.mock('@papes-confort/database', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: vi.fn().mockResolvedValue({ error: null }),
    };
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(true),
    }),
  },
}));

describe('sendAdminNewCustomerNotificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_mock_test_key';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@papesconfort.com';
  });

  it('no arroja error y envía el correo con los datos del nuevo cliente', async () => {
    await expect(
      sendAdminNewCustomerNotificationEmail({
        name: 'Camila Rossi',
        email: 'camila@gmail.com',
        phone: '3445998877',
        city: 'Basavilbaso',
        province: 'Entre Ríos',
        marketingOptIn: true,
        source: 'Formulario Web',
      })
    ).resolves.not.toThrow();
  });

  it('resuelve el email del usuario admin si no hay variable de entorno', async () => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    delete process.env.ADMIN_EMAIL;

    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      email: 'admin-db@papesconfort.com',
    } as any);

    await expect(
      sendAdminNewCustomerNotificationEmail({
        name: 'Carlos Gardel',
        email: 'carlos@tango.com',
        marketingOptIn: false,
        source: 'Google Auth',
      })
    ).resolves.not.toThrow();

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      })
    );
  });
});
