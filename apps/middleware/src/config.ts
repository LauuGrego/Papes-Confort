import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  gescomDb: {
    host: process.env.GESCOM_DB_HOST || 'localhost',
    port: parseInt(process.env.GESCOM_DB_PORT || '3306', 10),
    database: process.env.GESCOM_DB_NAME || '',
    user: process.env.GESCOM_DB_USER || '',
    password: process.env.GESCOM_DB_PASS || '',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    syncKey: process.env.API_SYNC_KEY || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  imagesPath: process.env.IMAGES_PATH || '',
  cronSchedule: process.env.PRODUCTS_SYNC_CRON || '',
};
