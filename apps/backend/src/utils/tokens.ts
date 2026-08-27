import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserPayload } from '@papes-confort/shared';

export function generateAccessToken(user: UserPayload): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: user.type, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(user: UserPayload): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: user.type, name: user.name },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );
}
