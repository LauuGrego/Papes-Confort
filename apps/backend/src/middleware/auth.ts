import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UserPayload, UserRole } from '@papes-confort/shared';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as UserPayload | undefined;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
}
