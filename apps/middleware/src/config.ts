import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Intentar cargar .env desde el directorio actual (cwd) o el directorio del ejecutable (.exe)
const cwdEnv = path.resolve(process.cwd(), '.env');
const exeDirEnv = process.execPath ? path.resolve(path.dirname(process.execPath), '.env') : '';

if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv, override: true });
} else if (exeDirEnv && fs.existsSync(exeDirEnv)) {
  dotenv.config({ path: exeDirEnv, override: true });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

export const config = {
  gescomDb: {
    host: process.env.GESCOM_DB_HOST || 'localhost',
    port: parseInt(process.env.GESCOM_DB_PORT || '3306', 10),
    database: process.env.GESCOM_DB_NAME || 'agc_sql_datosges',
    user: process.env.GESCOM_DB_USER || 'agc_guest',
    password: process.env.GESCOM_DB_PASS || 'guest',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://backend-production-6b2b.up.railway.app',
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

