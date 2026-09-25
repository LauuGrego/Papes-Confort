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
  AValor: number | string;
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
  ANota: string | null;
  ListaLpor?: number | string | null;
  RubroName?: string | null;
  SubrubroName?: string | null;
  BrandName?: string | null;
}

import { loadSyncState, saveSyncState } from './state';
import { cleanGescomText } from '../utils/encoding';

function computeProductHash(row: GescomStockRow, listPrice: number): string {
  const name = cleanGescomText(row.ADes) || '';
  const note = cleanGescomText(row.ANota) || '';
  const rubroName = cleanGescomText(row.RubroName) || '';
  const subrubroName = cleanGescomText(row.SubrubroName) || '';
  const brandName = cleanGescomText(row.BrandName) || '';

  const dataString = `${row.ACod}|${name}|${row.AValor || ''}|${row.AVenta}|${listPrice}|${row.AExis}|${row.ABarra || ''}|${row.ARub || ''}|${row.ASub || ''}|${row.AMar || ''}|${rubroName}|${subrubroName}|${brandName}|${row.ANOVENTA || ''}|${row.ADESACT || ''}|${note}`;
  return crypto.createHash('md5').update(dataString).digest('hex');
}


let isSyncInProgress = false;

export async function syncProductsFromGescom() {
  if (isSyncInProgress) {
    logger.warn('A product sync cycle is already in progress. Skipping overlapping execution.');
    return;
  }
  isSyncInProgress = true;
  const startTime = Date.now();
  logger.info('Starting products sync cycle from GesCom...');

  try {
    const [rows] = await gescomPool.query<GescomStockRow[]>(
      `SELECT 
        sa.KeyID, 
        sa.ACod, 
        sa.ADes, 
        sa.AValor,
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
        san.ANota,
        vl.LPOR AS ListaLpor,
        sr.RDes AS RubroName,
        ss.SDes AS SubrubroName,
        sm.MDes AS BrandName
      FROM Stock_Articulo sa
      LEFT JOIN Stock_ArtiNota san ON sa.ACod = san.ACod
      LEFT JOIN Ventas_Listas vl ON vl.LCOD = '01'
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
      const basePrice = Number(row.AVenta) || 0;
      const listaLpor = row.ListaLpor !== null && row.ListaLpor !== undefined ? Number(row.ListaLpor) : 25;
      const listPrice = Math.round(basePrice * (1 + listaLpor / 100) * 100) / 100;

      const currentHash = computeProductHash(row, listPrice);
      const savedHash = syncState.products[sku];

      if (savedHash === currentHash) {
        nextStateProducts[sku] = currentHash;
        continue;
      }

      const rawStock = Number(row.AExis) || 0;
      const name = cleanGescomText(row.ADes) || '';
      const description = cleanGescomText(row.ANota);

      const barcode = row.ABarra && String(row.ABarra).trim() ? String(row.ABarra).trim() : undefined;
      const ivaPercent = row.AIVA !== null && row.AIVA !== undefined ? Number(row.AIVA) : undefined;
      const unit = cleanGescomText(row.AUNI);

      // Extract descriptive names with fallbacks to code strings
      const rubro = cleanGescomText(row.RubroName)
        || (row.ARub !== null && row.ARub !== undefined ? String(row.ARub).trim() : undefined);

      const subrubro = cleanGescomText(row.SubrubroName)
        || (row.ASub !== null && row.ASub !== undefined ? String(row.ASub).trim() : undefined);

      const brandName = cleanGescomText(row.BrandName)
        || (row.AMar !== null && row.AMar !== undefined ? String(row.AMar).trim() : undefined);

      const isActive = Number(row.ANOVENTA) !== 1 && Number(row.ADESACT) !== 1;

      changedProducts.push({
        sku,
        gescomName: name,
        name,
        description,
        basePrice,
        listPrice,
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

    // Send in batches of 100 to avoid payload issues and timeouts
    const BATCH_SIZE = 100;
    let totalProcessed = 0;

    for (let i = 0; i < changedProducts.length; i += BATCH_SIZE) {
      const batch = changedProducts.slice(i, i + BATCH_SIZE);
      await sendProductsSyncBatch(batch);
      totalProcessed += batch.length;

      // Update state incrementally per successful batch so progress isn't lost on interruption
      for (const p of batch) {
        if (nextStateProducts[p.sku]) {
          syncState.products[p.sku] = nextStateProducts[p.sku];
        }
      }
      syncState.lastSyncAt = new Date().toISOString();
      saveSyncState(syncState);

      logger.info(`Sent batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalProcessed}/${changedProducts.length} products`);
    }

    const durationMs = Date.now() - startTime;
    logger.info(`Products sync completed successfully in ${durationMs}ms`, {
      totalProducts: rows.length,
      changedProducts: changedProducts.length,
    });
  } catch (error: any) {
    logger.error('Products sync failed', { error: error.message, stack: error.stack });
  } finally {
    isSyncInProgress = false;
  }
}
