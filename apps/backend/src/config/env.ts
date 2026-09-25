import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  DATABASE_URL: process.env.DATABASE_URL || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_SYNC_KEY: process.env.API_SYNC_KEY || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  MOBBEX_API_KEY: process.env.MOBBEX_API_KEY || '',
  MOBBEX_ACCESS_TOKEN: process.env.MOBBEX_ACCESS_TOKEN || '',
  MOBBEX_TEST_MODE: process.env.MOBBEX_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production',
  MOBBEX_WEBHOOK_URL: process.env.MOBBEX_WEBHOOK_URL || '',
  MOBBEX_TIMEOUT_MINUTES: parseInt(process.env.MOBBEX_TIMEOUT_MINUTES || '15', 10),
} as const;
