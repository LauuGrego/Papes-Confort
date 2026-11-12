import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

export function cartSession(req: Request, res: Response, next: NextFunction) {
  const rawHeader = req.headers['x-cart-session'];
  const headerSessionId =
    typeof rawHeader === 'string' && rawHeader.trim().length > 0 && rawHeader.trim().length <= 128
      ? rawHeader.trim()
      : null;

  const cookieSessionId =
    req.cookies && typeof req.cookies['papes_cart'] === 'string' && req.cookies['papes_cart'].trim().length > 0
      ? req.cookies['papes_cart'].trim()
      : null;

  const sessionId = headerSessionId || cookieSessionId || randomUUID();

  if (cookieSessionId !== sessionId) {
    const isSecure =
      env.NODE_ENV === 'production' ||
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https';

    res.cookie('papes_cart', sessionId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
    });
  }

  res.setHeader('X-Cart-Session', sessionId);
  req.sessionId = sessionId;
  next();
}
