import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error caught by global handler:', err);

  const status = err.status || err.statusCode || 500;
  const rawMessage = typeof err.message === 'string' ? err.message : '';
  const isDatabaseOrInternalError =
    status >= 500 ||
    rawMessage.includes('prisma.') ||
    rawMessage.includes('EMAXCONNSESSION') ||
    rawMessage.includes('Error querying the database');

  const message = isDatabaseOrInternalError
    ? 'El servicio se encuentra procesando muchas solicitudes. Por favor, intentá nuevamente en unos instantes.'
    : rawMessage || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    error: message,
  });
}
