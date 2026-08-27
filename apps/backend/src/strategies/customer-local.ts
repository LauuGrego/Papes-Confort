import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from '@papes-confort/database';
import { compare } from 'bcryptjs';
import { UserPayload } from '@papes-confort/shared';

export const customerLocalStrategy = new LocalStrategy(
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
      const customer = await prisma.customer.findFirst({
        where: { email: cleanEmail, isActive: true, deletedAt: null },
      });

      if (!customer || !customer.password) {
        return done(null, false, { message: 'Correo electrónico no registrado o cuenta no configurada.' });
      }

      const isMatch = await compare(password, customer.password);
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta.' });
      }

      const payload: UserPayload = {
        id: customer.id,
        email: customer.email,
        role: 'CUSTOMER',
        type: 'customer',
        name: customer.name,
      };

      return done(null, payload);
    } catch (error) {
      return done(error);
    }
  }
);
