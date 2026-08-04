import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { config } from '../config';
import { sendImageSyncNotification } from '../api/client';
import { uploadToCloudinary } from '../utils/cloudinary';
import { logger } from '../utils/logger';

export function extractSkuFromFilename(filename: string): string {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext).trim();

  // Si empieza con "Art_" o "art_"
  if (nameWithoutExt.toLowerCase().startsWith('art_')) {
    const rest = nameWithoutExt.substring(4);
    // Si tiene un sufijo como "_01", tomamos la parte del SKU
    if (rest.includes('_')) {
      return rest.split('_')[0].trim();
    }
    return rest.trim();
  }

  // Si no empieza con "Art_" pero tiene un sufijo como "_01" (ej: "01500301_01")
  if (nameWithoutExt.includes('_')) {
    return nameWithoutExt.split('_')[0].trim();
  }

  return nameWithoutExt;
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
    ignoreInitial: true,
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
      
      const ext = path.extname(filename);
      const publicId = path.basename(filename, ext).trim();
      const cloudinaryUrl = await uploadToCloudinary(filePath, publicId);

      await sendImageSyncNotification(sku, filename, cloudinaryUrl || undefined);
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
      
      const ext = path.extname(filename);
      const publicId = path.basename(filename, ext).trim();
      const cloudinaryUrl = await uploadToCloudinary(filePath, publicId);

      await sendImageSyncNotification(sku, filename, cloudinaryUrl || undefined);
    } catch (error: any) {
      logger.error(`Error processing changed image: ${filePath}`, { error: error.message });
    }
  });
}
