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
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
} as const;

