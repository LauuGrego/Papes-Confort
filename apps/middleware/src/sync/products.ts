import { RowDataPacket } from 'mysql2';
import { gescomPool } from '../db/gescom';
import { sendProductsSyncBatch, SyncProductItem } from '../api/client';
import { logger } from '../utils/logger';
import { config } from '../config';

interface GescomStockRow extends RowDataPacket {
  ACod: string | number;
  ADes: string;
  AVenta: number | string;
  AExis: number | string;
}

export async function syncProductsFromGescom() {
  const startTime = Date.now();
  logger.info('Starting products sync cycle from GesCom...');

  try {
    const [rows] = await gescomPool.query<GescomStockRow[]>(
      'SELECT ACod, ADes, AVenta, AExis FROM Stock_Articulo'
    );

    if (!rows || rows.length === 0) {
      logger.warn('No products found in Stock_Articulo table');
      return;
    }

    logger.info(`Fetched ${rows.length} records from Stock_Articulo`);

    const mappedProducts: SyncProductItem[] = rows.map((row: GescomStockRow) => {
      const rawStock = Number(row.AExis) || 0;
      const effectiveStock = Math.max(0, rawStock - config.safetyStock);

      return {
        sku: String(row.ACod).trim(),
        gescomName: String(row.ADes || '').trim(),
        basePrice: Number(row.AVenta) || 0,
        stock: effectiveStock,
      };
    });

    // Send in batches of 250 to avoid payload issues
    const BATCH_SIZE = 250;
    let totalProcessed = 0;

    for (let i = 0; i < mappedProducts.length; i += BATCH_SIZE) {
      const batch = mappedProducts.slice(i, i + BATCH_SIZE);
      await sendProductsSyncBatch(batch);
      totalProcessed += batch.length;
      logger.info(`Sent batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalProcessed}/${mappedProducts.length} products`);
    }

    const durationMs = Date.now() - startTime;
    logger.info(`Products sync completed successfully in ${durationMs}ms`, {
      totalProducts: mappedProducts.length,
    });
  } catch (error: any) {
    logger.error('Products sync failed', { error: error.message, stack: error.stack });
  }
}
