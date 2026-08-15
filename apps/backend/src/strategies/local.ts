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
      if (!email || !password) {
        return done(null, false, { message: 'Debes ingresar correo y contraseña.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await prisma.user.findFirst({
        where: { email: cleanEmail, isActive: true, deletedAt: null },
      });

      if (!user) {
        return done(null, false, { message: 'Correo electrónico no registrado o inactivo.' });
      }

      const isMatch = await compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta.' });
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

