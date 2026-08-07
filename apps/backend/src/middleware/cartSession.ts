import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

export function cartSession(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies['papes_cart'];

  if (!sessionId) {
    sessionId = randomUUID();
    const isProduction = env.NODE_ENV === 'production';
    
    res.cookie('papes_cart', sessionId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
  }

  req.sessionId = sessionId;
  next();
}
