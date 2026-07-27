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
}

export async function sendProductsSyncBatch(products: SyncProductItem[]) {
  try {
    const response = await apiClient.post('/api/sync/products', { products });
    return response.data;
  } catch (error: any) {
    logger.error('Failed to send products sync batch to backend', {
      error: error.response?.data || error.message,
    });
    throw error;
  }
}

export async function sendImageSyncNotification(sku: string, filename: string, isPrimary?: boolean) {
  try {
    const response = await apiClient.post('/api/sync/images', {
      sku,
      filename,
      isPrimary,
    });
    return response.data;
  } catch (error: any) {
    logger.error('Failed to send image sync notification to backend', {
      sku,
      filename,
      error: error.response?.data || error.message,
    });
    throw error;
  }
}
