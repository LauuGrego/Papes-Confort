import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function requireSyncAuth(req: Request, res: Response, next: NextFunction): void {
  const syncKey = req.headers['x-sync-key'];

  if (!syncKey || syncKey !== env.API_SYNC_KEY) {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing X-Sync-Key' });
    return;
  }

  next();
}
