import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface ImageStateItem {
  mtime: number;
  size: number;
  url: string;
}

export interface SyncState {
  products: Record<string, string>;
  images: Record<string, ImageStateItem>;
  lastSyncAt: string | null;
}

const stateFilePath = path.resolve(__dirname, '../../sync-state.json');

export function loadSyncState(): SyncState {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        products: parsed.products || {},
        images: parsed.images || {},
        lastSyncAt: parsed.lastSyncAt || null,
      };
    }
  } catch (error: any) {
    logger.error('Failed to load sync state, returning default state', { error: error.message });
  }
  return { products: {}, images: {}, lastSyncAt: null };
}

export function saveSyncState(state: SyncState) {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error: any) {
    logger.error('Failed to save sync state', { error: error.message });
  }
}
