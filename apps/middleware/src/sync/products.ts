import { RowDataPacket } from 'mysql2';
import { gescomPool } from '../db/gescom';
import { sendProductsSyncBatch, SyncProductItem } from '../api/client';
import { logger } from '../utils/logger';
import { config } from '../config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface GescomStockRow extends RowDataPacket {
  KeyID: number;
  ACod: string | number;
  ADes: string;
  AVenta: number | string;
  AExis: number | string;
  ABarra: string | null;
  AIVA: number | string | null;
  AUNI: string | null;
  ARub: string | number | null;
  ASub: string | number | null;
  AMar: string | number | null;
  ANOVENTA: number | null;
  ADESACT: number | null;
  RubroName?: string | null;
  SubrubroName?: string | null;
  BrandName?: string | null;
}

import { loadSyncState, saveSyncState } from './state';

function computeProductHash(row: GescomStockRow): string {
  const dataString = `${row.ACod}|${row.ADes || ''}|${row.AVenta}|${row.AExis}|${row.ABarra || ''}|${row.ARub || ''}|${row.ASub || ''}|${row.AMar || ''}|${row.RubroName || ''}|${row.SubrubroName || ''}|${row.BrandName || ''}|${row.ANOVENTA || ''}|${row.ADESACT || ''}`;
  return crypto.createHash('md5').update(dataString).digest('hex');
}


export async function syncProductsFromGescom() {
  const startTime = Date.now();
  logger.info('Starting products sync cycle from GesCom...');

  try {
    const [rows] = await gescomPool.query<GescomStockRow[]>(
      `SELECT 
        sa.KeyID, 
        sa.ACod, 
        sa.ADes, 
        sa.AVenta, 
        sa.AExis, 
        sa.ABarra, 
        sa.AIVA, 
        sa.AUNI, 
        sa.ARub, 
        sa.ASub, 
        sa.AMar, 
        sa.ANOVENTA, 
        sa.ADESACT,
        sr.RDes AS RubroName,
        ss.SDes AS SubrubroName,
        sm.MDes AS BrandName
      FROM Stock_Articulo sa
      LEFT JOIN Stock_Rubros sr ON sa.ARub = sr.RCod
      LEFT JOIN Stock_SubRubro ss ON sa.ASub = ss.SCod
      LEFT JOIN Stock_Marcas sm ON sa.AMar = sm.MCod`
    );

    if (!rows || rows.length === 0) {
      logger.warn('No products found in Stock_Articulo table');
      return;
    }

    logger.info(`Fetched ${rows.length} records from Stock_Articulo (with Rubro/SubRubro/Marca descriptions)`);

    const syncState = loadSyncState();
    const nextStateProducts: Record<string, string> = {};
    const changedProducts: SyncProductItem[] = [];

    for (const row of rows) {
      const sku = String(row.ACod).trim();
      const currentHash = computeProductHash(row);
      const savedHash = syncState.products[sku];

      if (savedHash === currentHash) {
        nextStateProducts[sku] = currentHash;
        continue;
      }

      const rawStock = Number(row.AExis) || 0;
      const name = String(row.ADes || '').trim();

      const barcode = row.ABarra && String(row.ABarra).trim() ? String(row.ABarra).trim() : undefined;
      const ivaPercent = row.AIVA !== null && row.AIVA !== undefined ? Number(row.AIVA) : undefined;
      const unit = row.AUNI && String(row.AUNI).trim() ? String(row.AUNI).trim() : undefined;

      // Extract descriptive names with fallbacks to code strings
      const rubro = row.RubroName && String(row.RubroName).trim() 
        ? String(row.RubroName).trim() 
        : (row.ARub !== null && row.ARub !== undefined ? String(row.ARub).trim() : undefined);

      const subrubro = row.SubrubroName && String(row.SubrubroName).trim() 
        ? String(row.SubrubroName).trim() 
        : (row.ASub !== null && row.ASub !== undefined ? String(row.ASub).trim() : undefined);

      const brandName = row.BrandName && String(row.BrandName).trim() 
        ? String(row.BrandName).trim() 
        : (row.AMar !== null && row.AMar !== undefined ? String(row.AMar).trim() : undefined);

      const isActive = Number(row.ANOVENTA) !== 1 && Number(row.ADESACT) !== 1;

      changedProducts.push({
        sku,
        gescomName: name,
        name,
        description: undefined,
        basePrice: Number(row.AVenta) || 0,
        stock: rawStock,
        gescomId: Number(row.KeyID),
        barcode,
        ivaPercent,
        unit,
        rubro,
        subrubro,
        brandName,
        isActive,
      });

      nextStateProducts[sku] = currentHash;
    }

    if (changedProducts.length === 0) {
      logger.info('No changes detected since last sync. Sincronización omitida.');
      return;
    }

    logger.info(`Detected ${changedProducts.length} changed or new products. Sending sync...`);

    // Send in batches of 250 to avoid payload issues
    const BATCH_SIZE = 250;
    let totalProcessed = 0;

    for (let i = 0; i < changedProducts.length; i += BATCH_SIZE) {
      const batch = changedProducts.slice(i, i + BATCH_SIZE);
      await sendProductsSyncBatch(batch);
      totalProcessed += batch.length;
      logger.info(`Sent batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalProcessed}/${changedProducts.length} products`);
    }

    // Save updated state on success
    syncState.products = nextStateProducts;
    syncState.lastSyncAt = new Date().toISOString();
    saveSyncState(syncState);

    const durationMs = Date.now() - startTime;
    logger.info(`Products sync completed successfully in ${durationMs}ms`, {
      totalProducts: rows.length,
      changedProducts: changedProducts.length,
    });
  } catch (error: any) {
    logger.error('Products sync failed', { error: error.message, stack: error.stack });
  }
}
