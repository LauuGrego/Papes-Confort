import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { config } from '../config';
import { sendImageSyncNotification } from '../api/client';
import { logger } from '../utils/logger';

export function extractSkuFromFilename(filename: string): string {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  return nameWithoutExt.trim();
}

export function startImageWatcher() {
  const imagesDir = config.imagesPath;

  if (!fs.existsSync(imagesDir)) {
    logger.warn(`Images directory does not exist: ${imagesDir}. Image watcher skipped.`);
    return;
  }

  logger.info(`Starting real-time image watcher on: ${imagesDir}`);

  const watcher = chokidar.watch(imagesDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher.on('add', async (filePath) => {
    try {
      const filename = path.basename(filePath);
      const sku = extractSkuFromFilename(filename);

      if (!sku) return;

      logger.info(`New image detected for SKU "${sku}": ${filename}`);
      await sendImageSyncNotification(sku, filename);
    } catch (error: any) {
      logger.error(`Error processing added image: ${filePath}`, { error: error.message });
    }
  });

  watcher.on('change', async (filePath) => {
    try {
      const filename = path.basename(filePath);
      const sku = extractSkuFromFilename(filename);

      if (!sku) return;

      logger.info(`Image modified for SKU "${sku}": ${filename}`);
      await sendImageSyncNotification(sku, filename);
    } catch (error: any) {
      logger.error(`Error processing changed image: ${filePath}`, { error: error.message });
    }
  });
}
