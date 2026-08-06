import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from '@papes-confort/database';
import { compare } from 'bcryptjs';

export const localStrategy = new LocalStrategy(
  {
    usernameField: 'password',
    passwordField: 'password',
  },
  async (_usernamePlaceholder, password, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true, deletedAt: null },
      });

      if (!user) {
        return done(null, false, { message: 'Administrador no configurado en el sistema' });
      }

      const isMatch = await compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta' });
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
