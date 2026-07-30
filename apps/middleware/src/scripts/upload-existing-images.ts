import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { sendImageSyncNotification } from '../api/client';
import { uploadToCloudinary, isCloudinaryConfigured } from '../utils/cloudinary';
import { logger } from '../utils/logger';
import { extractSkuFromFilename } from '../sync/images';

async function uploadExistingImages() {
  logger.info('Starting batch upload of existing local images to Cloudinary...');

  if (!isCloudinaryConfigured()) {
    logger.error('Cloudinary is not configured.');
    process.exit(1);
  }

  const imagesDir = config.imagesPath;
  if (!fs.existsSync(imagesDir)) {
    logger.error(`Images directory does not exist: "${imagesDir}"`);
    process.exit(1);
  }

  try {
    const files = fs.readdirSync(imagesDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    const total = imageFiles.length;
    logger.info(`Found ${total} image files to process in "${imagesDir}"`);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < total; i++) {
      const filename = imageFiles[i];
      const filePath = path.join(imagesDir, filename);
      const sku = extractSkuFromFilename(filename);

      if (!sku) {
        logger.warn(`[${i + 1}/${total}] Skipped "${filename}" because SKU could not be extracted.`);
        continue;
      }

      logger.info(`[${i + 1}/${total}] Processing "${filename}" (SKU: "${sku}")...`);

      try {
        const ext = path.extname(filename);
        const publicId = path.basename(filename, ext).trim();
        
        logger.info(`  Uploading to Cloudinary...`);
        const cloudinaryUrl = await uploadToCloudinary(filePath, publicId);

        if (cloudinaryUrl) {
          logger.info(`  Uploaded. URL: ${cloudinaryUrl}`);
          logger.info(`  Notifying backend...`);
          await sendImageSyncNotification(sku, filename, cloudinaryUrl);
          logger.info(`  Successfully synced ${filename}`);
          succeeded++;
        } else {
          logger.warn(`  Cloudinary returned no URL for ${filename}`);
          failed++;
        }
      } catch (err: any) {
        logger.error(`  Error processing ${filename}:`, { error: err.message });
        failed++;
      }
    }

    logger.info(`\n Batch upload finished.`);
    logger.info(`Total processed: ${total}`);
    logger.info(`Successfully synced: ${succeeded}`);
    logger.info(`Failed: ${failed}`);

  } catch (error: any) {
    logger.error('Critical error during batch upload:', { error: error.message });
  }
}

uploadExistingImages();
