import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'super-secret-jwt-key-for-rbac-testing-min-32-chars';

vi.mock('../config/env', () => ({
  env: {
    PORT: 3001,
    JWT_SECRET: 'super-secret-jwt-key-for-rbac-testing-min-32-chars',
    JWT_REFRESH_SECRET: 'super-secret-jwt-key-for-rbac-testing-min-32-chars',
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    DATABASE_URL: 'postgresql://localhost:5432/mock',
    CORS_ORIGIN: 'http://localhost:3000',
    NODE_ENV: 'test',
    API_SYNC_KEY: 'test-sync-key',
    GOOGLE_CLIENT_ID: '',
    MOBBEX_API_KEY: '',
    MOBBEX_ACCESS_TOKEN: '',
    MOBBEX_TEST_MODE: true,
    MOBBEX_WEBHOOK_URL: '',
    MOBBEX_TIMEOUT_MINUTES: 15,
  },
}));

const mockCustomerFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockSettingFindMany = vi.fn();

vi.mock('@papes-confort/database', () => ({
  prisma: {
    customer: {
      findUnique: (...args: any[]) => mockCustomerFindUnique(...args),
    },
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
    setting: {
      findMany: (...args: any[]) => mockSettingFindMany(...args),
    },
  },
}));

// Import app after mocks are in place
import app from '../app';

describe('RBAC & Auth Middleware Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Reclama 403 Forbidden cuando un JWT de cliente intenta acceder a GET /api/admin/settings', async () => {
    // Mock customer exists and is active
    mockCustomerFindUnique.mockResolvedValue({
      id: 'cust-id-123',
      email: 'cliente@example.com',
      isActive: true,
      deletedAt: null,
      passwordChangedAt: null,
    });

    const customerToken = jwt.sign(
      {
        id: 'cust-id-123',
        email: 'cliente@example.com',
        type: 'customer',
        role: 'CUSTOMER',
      },
      TEST_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  it('2. Reclama 401 Unauthorized cuando la petición a GET /api/admin/settings no tiene token', async () => {
    const res = await request(app).get('/api/admin/settings');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it('3. Reclama 401 Unauthorized cuando el token está vencido o es inválido', async () => {
    const expiredToken = jwt.sign(
      {
        id: 'cust-id-123',
        email: 'cliente@example.com',
        type: 'customer',
      },
      TEST_SECRET,
      { expiresIn: '-1s' } // Expired in the past
    );

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('4. Permite acceso 200 OK a GET /api/admin/settings para un JWT de ADMIN válido', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'admin-user-789',
      email: 'admin@papesconfort.com',
      role: 'ADMIN',
      isActive: true,
      deletedAt: null,
      passwordChangedAt: null,
    });

    mockSettingFindMany.mockResolvedValue([
      { key: 'BUSINESS_HOURS', value: 'Lunes a Viernes' },
    ]);

    const adminToken = jwt.sign(
      {
        id: 'admin-user-789',
        email: 'admin@papesconfort.com',
        type: 'admin',
        role: 'ADMIN',
      },
      TEST_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.BUSINESS_HOURS).toBe('Lunes a Viernes');
  });
});
