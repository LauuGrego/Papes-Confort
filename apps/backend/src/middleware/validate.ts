import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || (result.error as any).errors || [];
      const errorMsg = issues.length > 0
        ? issues.map((i: any) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')
        : result.error.message || 'Datos de entrada inválidos';

      res.status(400).json({
        success: false,
        error: errorMsg,
        details: issues,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
