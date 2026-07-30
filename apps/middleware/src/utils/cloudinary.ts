import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { logger } from './logger';

const isConfigured = !!(
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  logger.info('Cloudinary initialized successfully.');
} else {
  logger.warn('Cloudinary is not configured. Image uploads will fall back to local URLs.');
}

/**
 * Uploads a local file to Cloudinary and returns the secure URL.
 * Returns null if Cloudinary is not configured.
 */
export async function uploadToCloudinary(filePath: string, publicId?: string): Promise<string | null> {
  if (!isConfigured) {
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: 'papes-confort/products',
    });
    return result.secure_url;
  } catch (error: any) {
    logger.error(`Failed to upload file to Cloudinary: ${filePath}`, { error: error.message });
    throw error;
  }
}

export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}
