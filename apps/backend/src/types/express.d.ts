import { UserPayload } from '@papes-confort/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      sessionId?: string;
    }
  }
}
