import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from '../config/env';
import { UserPayload } from '@papes-confort/shared';
import { prisma } from '@papes-confort/database';

export const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET,
  },
  async (payload: UserPayload & { iat?: number }, done) => {
    try {
      if (!payload.id || !payload.email) {
        return done(null, false);
      }

      if (payload.type === 'customer') {
        const customer = await prisma.customer.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            email: true,
            isActive: true,
            deletedAt: true,
            passwordChangedAt: true,
          },
        });

        if (!customer || !customer.isActive || customer.deletedAt !== null) {
          return done(null, false);
        }

        if (customer.passwordChangedAt && payload.iat) {
          const passwordChangedTime = customer.passwordChangedAt.getTime();
          const tokenIssuedTime = payload.iat * 1000;
          if (tokenIssuedTime < passwordChangedTime - 1000) {
            return done(null, false);
          }
        }

        return done(null, { ...payload, type: 'customer', role: 'CUSTOMER' });
      } else {
        // Admin / Super Admin
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            deletedAt: true,
            passwordChangedAt: true,
          },
        });

        if (!dbUser || !dbUser.isActive || dbUser.deletedAt !== null) {
          return done(null, false);
        }

        if (dbUser.passwordChangedAt && payload.iat) {
          const passwordChangedTime = dbUser.passwordChangedAt.getTime();
          const tokenIssuedTime = payload.iat * 1000;
          if (tokenIssuedTime < passwordChangedTime - 1000) {
            return done(null, false);
          }
        }

        return done(null, { ...payload, type: 'admin', role: dbUser.role });
      }
    } catch (error) {
      return done(error, false);
    }
  }
);
