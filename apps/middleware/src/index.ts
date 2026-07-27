import cron from 'node-cron';
import { testGescomConnection } from './db/gescom';
import { syncProductsFromGescom } from './sync/products';
import { startImageWatcher } from './sync/images';
import { config } from './config';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('==========================================');
  logger.info('Starting Papes Confort Middleware GesCom');
  logger.info('==========================================');

  const isConnected = await testGescomConnection();
  if (!isConnected) {
    logger.warn('Initial GesCom connection failed. Will retry during scheduled sync jobs.');
  }

  // Initial Sync Run
  try {
    await syncProductsFromGescom();
  } catch (err: any) {
    logger.error('Error during initial product sync run', { error: err.message });
  }

  // Schedule Periodic Product Sync
  logger.info(`Scheduling product sync cron job with schedule: "${config.cronSchedule}"`);
  cron.schedule(config.cronSchedule, async () => {
    logger.info('Cron triggered product sync job');
    await syncProductsFromGescom();
  });

  // Start Realtime Image Sync Watcher
  startImageWatcher();
}

bootstrap().catch((error) => {
  logger.error('Fatal error bootstrapping middleware', { error: error.message, stack: error.stack });
  process.exit(1);
});
