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
const mockCartAddItem = vi.fn();

vi.mock('@papes-confort/database', () => ({
  prisma: {
    customer: {
      findUnique: (...args: any[]) => mockCustomerFindUnique(...args),
    },
    user: {
      findUnique: (...args: any[]) => mockUserFindUnique(...args),
    },
    setting: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn().mockImplementation((fns) => Promise.all(fns)),
  },
}));

vi.mock('../services/cart.service', () => ({
  getCartDto: vi.fn(),
  addItem: (...args: any[]) => mockCartAddItem(...args),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
}));

import app from '../app';

describe('Zod Validation Middleware on High-Risk Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. POST /api/cart/items rechaza quantity inválida o faltante con 400', async () => {
    // Missing quantity
    const res1 = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'prod-123' });
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    // Negative quantity
    const res2 = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'prod-123', quantity: -5 });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);

    // Floating quantity
    const res3 = await request(app)
      .post('/api/cart/items')
      .send({ productId: 'prod-123', quantity: 1.5 });
    expect(res3.status).toBe(400);
    expect(res3.body.success).toBe(false);
  });

  it('2. POST /api/orders rechaza datos incompletos con 400', async () => {
    mockCustomerFindUnique.mockResolvedValue({
      id: 'cust-123',
      email: 'customer@example.com',
      isActive: true,
      deletedAt: null,
      passwordChangedAt: null,
    });

    const customerToken = jwt.sign(
      { id: 'cust-123', email: 'customer@example.com', type: 'customer', role: 'CUSTOMER' },
      TEST_SECRET
    );

    // Missing required shipping address & invalid shipping type
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingType: 'INVALID_TYPE',
        paymentMethod: 'CARD',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('3. PUT /api/admin/settings rechaza objeto vacío con 400', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'admin-123',
      email: 'admin@papesconfort.com',
      role: 'ADMIN',
      isActive: true,
      deletedAt: null,
      passwordChangedAt: null,
    });

    const adminToken = jwt.sign(
      { id: 'admin-123', email: 'admin@papesconfort.com', type: 'admin', role: 'ADMIN' },
      TEST_SECRET
    );

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. POST /api/sync/products rechaza payload con products vacío con 400', async () => {
    const res = await request(app)
      .post('/api/sync/products')
      .set('x-sync-key', 'test-sync-key')
      .send({ products: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('5. POST /api/sync/images rechaza cuando falta filename o sku con 400', async () => {
    const res = await request(app)
      .post('/api/sync/images')
      .set('x-sync-key', 'test-sync-key')
      .send({ sku: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
