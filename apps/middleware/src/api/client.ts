import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-Sync-Key': config.api.syncKey,
  },
  timeout: 30000,
});

export interface SyncProductItem {
  sku: string;
  gescomName: string;
  basePrice: number;
  stock: number;
  brandName?: string;
  gescomId?: number;
  barcode?: string;
  ivaPercent?: number;
  unit?: string;
  rubro?: string;
  subrubro?: string;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(`Retry ${attempt + 1}/${retries} in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable retry block');
}

export async function sendProductsSyncBatch(products: SyncProductItem[]) {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/sync/products', { products });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to send products sync batch to backend', {
        error: error.response?.data || error.message,
      });
      throw error;
    }
  });
}

export async function sendImageSyncNotification(sku: string, filename: string, url?: string, isPrimary?: boolean) {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/sync/images', {
        sku,
        filename,
        url,
        isPrimary,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to send image sync notification to backend', {
        sku,
        filename,
        url,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  });
}
