import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from '@papes-confort/database';
import { compare } from 'bcryptjs';

export const localStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive || user.deletedAt) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const isMatch = await compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return done(null, payload);
    } catch (error) {
      return done(error);
    }
  }
);
