import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { config } from '../config';
import { sendImageSyncNotification } from '../api/client';
import { uploadToCloudinary } from '../utils/cloudinary';
import { logger } from '../utils/logger';
import { loadSyncState, saveSyncState } from './state';

export function extractSkuFromFilename(filename: string): string {
  const ext = path.extname(filename);
  let name = path.basename(filename, ext).trim();

  // Strip "art_" or "Art_" prefix
  if (name.toLowerCase().startsWith('art_')) {
    name = name.substring(4).trim();
  }

  // Strip trailing suffixes like _01, _1, -1, -02,  01, etc.
  name = name.replace(/[-_\s]+0*[1-9]\d*$/, '').trim();

  // Also fallback split if there is any other underscore left
  if (name.includes('_')) {
    name = name.split('_')[0].trim();
  }
  
  return name;
}

export function isPrimaryImage(filename: string): boolean {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext).trim();

  // If filename ends with any suffix ending with a number >= 2 (e.g. _02, _2, -2, etc.), it is not primary.
  const nonPrimarySuffixRegex = /[-_\s]+0*[2-9]\d*$/;
  return !nonPrimarySuffixRegex.test(nameWithoutExt);
}

export function extractSuffixNumber(filename: string): number {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext).trim();

  // Match a trailing number preceded by - or _ or space
  const match = nameWithoutExt.match(/[-_\s]+(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Default to 1 if no suffix is found
  return 1;
}

export async function startImageWatcher() {
  const imagesDir = config.imagesPath;

  if (!fs.existsSync(imagesDir)) {
    logger.warn(`Images directory does not exist: ${imagesDir}. Image watcher skipped.`);
    return;
  }

  logger.info(`Scanning and starting real-time image watcher on: ${imagesDir}`);

  // 1. Initial scan & synchronization (Self-Healing)
  try {
    const files = fs.readdirSync(imagesDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    if (imageFiles.length > 0) {
      logger.info(`Found ${imageFiles.length} image files locally. Verifying database and Cloudinary sync...`);
      const state = loadSyncState();
      let stateChanged = false;

      for (const filename of imageFiles) {
        const filePath = path.join(imagesDir, filename);
        const stats = fs.statSync(filePath);
        const sku = extractSkuFromFilename(filename);

        if (!sku) {
          logger.warn(`[Startup Sync] Skipped "${filename}" because SKU could not be extracted.`);
          continue;
        }

        const size = stats.size;
        const mtime = stats.mtimeMs;
        const existing = state.images[filename];
        const isPrimary = isPrimaryImage(filename);
        const sortOrder = extractSuffixNumber(filename);

        if (existing && existing.size === size && existing.mtime === mtime && existing.url) {
          // Already uploaded to Cloudinary, but send backend notification to heal the database link just in case
          logger.info(`[Startup Sync] "${filename}" already in local state. Healing/notifying backend...`);
          try {
            await sendImageSyncNotification(sku, filename, existing.url, isPrimary, sortOrder);
          } catch (backendErr: any) {
            logger.warn(`[Startup Sync] Backend notification failed for "${filename}" (SKU: ${sku}): ${backendErr.message}`);
          }
        } else {
          // Upload or re-upload
          logger.info(`[Startup Sync] Uploading "${filename}" (SKU: "${sku}") to Cloudinary...`);
          try {
            const ext = path.extname(filename);
            const publicId = path.basename(filename, ext).trim();
            const cloudinaryUrl = await uploadToCloudinary(filePath, publicId);

            if (cloudinaryUrl) {
              logger.info(`[Startup Sync] Uploaded. Notifying backend...`);
              await sendImageSyncNotification(sku, filename, cloudinaryUrl, isPrimary, sortOrder);
              state.images[filename] = { mtime, size, url: cloudinaryUrl };
              stateChanged = true;
            }
          } catch (uploadErr: any) {
            logger.error(`[Startup Sync] Failed to sync "${filename}": ${uploadErr.message}`);
          }
        }
      }

      if (stateChanged) {
        saveSyncState(state);
      }
    }
  } catch (scanError: any) {
    logger.error('Error during initial image folder scan:', { error: scanError.message });
  }

  // 2. Start realtime watcher for new additions/changes
  const watcher = chokidar.watch(imagesDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // We already scanned initially
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

      const stats = fs.statSync(filePath);
      const isPrimary = isPrimaryImage(filename);
      const sortOrder = extractSuffixNumber(filename);
      logger.info(`[Realtime Watcher] New image detected for SKU "${sku}": ${filename}`);
      
      const ext = path.extname(filename);
      const publicId = path.basename(filename, ext).trim();
      const cloudinaryUrl = await uploadToCloudinary(filePath, publicId);

      if (cloudinaryUrl) {
        await sendImageSyncNotification(sku, filename, cloudinaryUrl, isPrimary, sortOrder);
        const state = loadSyncState();
        state.images[filename] = { mtime: stats.mtimeMs, size: stats.size, url: cloudinaryUrl };
        saveSyncState(state);
        logger.info(`[Realtime Watcher] Successfully synced and saved "${filename}"`);
      }
    } catch (error: any) {
      logger.error(`[Realtime Watcher] Error processing added image: ${filePath}`, { error: error.message });
    }
  });

  watcher.on('change', async (filePath) => {
    try {
      const filename = path.basename(filePath);
      const sku = extractSkuFromFilename(filename);

      if (!sku) return;

      const stats = fs.statSync(filePath);
      const isPrimary = isPrimaryImage(filename);
      const sortOrder = extractSuffixNumber(filename);
      logger.info(`[Realtime Watcher] Image modified for SKU "${sku}": ${filename}`);
      
      const ext = path.extname(filename);
      const publicId = path.basename(filename, ext).trim();
      const cloudinaryUrl = await uploadToCloudinary(filePath, publicId);

      if (cloudinaryUrl) {
        await sendImageSyncNotification(sku, filename, cloudinaryUrl, isPrimary, sortOrder);
        const state = loadSyncState();
        state.images[filename] = { mtime: stats.mtimeMs, size: stats.size, url: cloudinaryUrl };
        saveSyncState(state);
        logger.info(`[Realtime Watcher] Successfully updated and saved "${filename}"`);
      }
    } catch (error: any) {
      logger.error(`[Realtime Watcher] Error processing changed image: ${filePath}`, { error: error.message });
    }
  });
}
