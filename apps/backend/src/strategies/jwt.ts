import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from '../config/env';
import { UserPayload } from '@papes-confort/shared';

export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET,
  },
  async (payload: UserPayload, done) => {
    try {
      if (!payload.id || !payload.email || !payload.role) {
        return done(null, false);
      }
      return done(null, payload);
    } catch (error) {
      return done(error, false);
    }
  }
);
