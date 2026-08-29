import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import { ApiResponse, LoginResponseDto, UserPayload, GoogleAuthPayload } from '@papes-confort/shared';
import { prisma } from '@papes-confort/database';
import { compare, hash } from 'bcryptjs';
import { mergeCart } from '../services/cart.service';
import { mapCustomerToDto } from '../services/customer.service';
import { sendCustomerWelcomeEmail } from '../services/email.service';

const router = Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);

async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID ? [env.GOOGLE_CLIENT_ID] : undefined,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('No se pudo obtener la información de la cuenta de Google.');
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    picture: payload.picture || null,
    emailVerified: payload.email_verified,
  };
}

// POST /api/auth/login (Unified Login for Admin and Customer)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'El correo electrónico y la contraseña son requeridos.',
      } as ApiResponse);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificar si es Administrador (prisma.user)
    const adminUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (adminUser && adminUser.isActive && adminUser.deletedAt === null) {
      const isMatch = await compare(password, adminUser.password);
      if (isMatch) {
        const payload: UserPayload = {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          type: 'admin',
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        });

        res.json({
          success: true,
          data: {
            user: payload,
            token: accessToken,
          },
        } as ApiResponse<LoginResponseDto>);
        return;
      }
    }

    // 2. Verificar si es Cliente (prisma.customer)
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (customer && customer.isActive && customer.deletedAt === null && customer.password) {
      const isMatch = await compare(password, customer.password);
      if (isMatch) {
        const payload: UserPayload = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          role: 'CUSTOMER',
          type: 'customer',
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Merge carrito anónimo
        const sessionId = req.cookies?.papes_cart;
        if (sessionId) {
          await mergeCart(sessionId, customer.id).catch(() => {});
        }

        const customerDto = mapCustomerToDto(customer);

        res.json({
          success: true,
          data: {
            user: payload,
            token: accessToken,
            customer: customerDto,
          },
        } as ApiResponse<LoginResponseDto>);
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: 'Correo electrónico o contraseña incorrectos.',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google (Unified / Admin & Customer Google Auth)
router.post('/google', async (req, res) => {
  try {
    const { credential, password } = req.body as GoogleAuthPayload;
    if (!credential || !credential.trim()) {
      res.status(400).json({ success: false, error: 'El token de Google es requerido.' } as ApiResponse);
      return;
    }

    const googleUser = await verifyGoogleToken(credential);
    const cleanEmail = googleUser.email.toLowerCase().trim();

    // 1. Si es Administrador (prisma.user), loguear directamente como Admin
    const adminUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (adminUser) {
      if (!adminUser.isActive || adminUser.deletedAt !== null) {
        res.status(403).json({
          success: false,
          error: 'Tu cuenta de administrador se encuentra inhabilitada.',
        } as ApiResponse);
        return;
      }

      const payload: UserPayload = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        type: 'admin',
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: payload,
          token: accessToken,
        },
      } as ApiResponse<LoginResponseDto>);
      return;
    }

    // 2. Si es Cliente, buscar si ya existe
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: cleanEmail },
        ],
      },
    });

    const needsPassword = !customer || !customer.password;

    // Si el usuario no tiene contraseña y no la envió, solicitarla
    if (needsPassword && !password) {
      res.json({
        success: true,
        data: {
          requiresPassword: true,
          tempUser: {
            name: googleUser.name,
            email: cleanEmail,
            avatarUrl: googleUser.picture,
          },
        } as any,
      } as ApiResponse<LoginResponseDto>);
      return;
    }

    let hashedPassword: string | null = null;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres.',
        } as ApiResponse);
        return;
      }
      hashedPassword = await hash(password, 12);
    }

    if (customer) {
      if (!customer.isActive || customer.deletedAt !== null) {
        res.status(403).json({
          success: false,
          error: 'Tu cuenta se encuentra inhabilitada. Comunícate con atención al cliente.',
        } as ApiResponse);
        return;
      }

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          googleId: customer.googleId || googleUser.googleId,
          avatarUrl: customer.avatarUrl || googleUser.picture,
          password: customer.password || hashedPassword || undefined,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: googleUser.name,
          email: cleanEmail,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.picture,
          password: hashedPassword,
          isActive: true,
          marketingOptIn: true,
        },
      });

      sendCustomerWelcomeEmail({
        name: customer.name,
        email: customer.email,
      }).catch(() => {});
    }

    const userPayload: UserPayload = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'CUSTOMER',
      type: 'customer',
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const sessionId = req.cookies?.papes_cart;
    if (sessionId) {
      await mergeCart(sessionId, customer.id).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        token: accessToken,
        user: userPayload,
        customer: mapCustomerToDto(customer),
      },
    } as ApiResponse<LoginResponseDto>);
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(401).json({
      success: false,
      error: error?.message || 'Error al autenticar con Google. Inténtalo nuevamente.',
    } as ApiResponse);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: 'Refresh token missing',
    } as ApiResponse);
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as UserPayload & { iat?: number };

    if (decoded.type === 'customer') {
      const customer = await prisma.customer.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          deletedAt: true,
          passwordChangedAt: true,
        },
      });

      if (!customer || !customer.isActive || customer.deletedAt !== null) {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        res.status(401).json({
          success: false,
          error: 'Usuario inactivo o no autorizado',
        } as ApiResponse);
        return;
      }

      if (customer.passwordChangedAt && decoded.iat) {
        const passwordChangedTime = customer.passwordChangedAt.getTime();
        const tokenIssuedTime = decoded.iat * 1000;
        if (tokenIssuedTime < passwordChangedTime - 1000) {
          res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
          res.status(401).json({
            success: false,
            error: 'La sesión ha expirado por cambio de contraseña. Por favor inicia sesión nuevamente.',
          } as ApiResponse);
          return;
        }
      }

      const payload: UserPayload = {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: 'CUSTOMER',
        type: 'customer',
      };

      const newAccessToken = generateAccessToken(payload);

      res.json({
        success: true,
        data: {
          token: newAccessToken,
          user: payload,
        },
      });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        deletedAt: true,
        passwordChangedAt: true,
      },
    });

    if (!dbUser || !dbUser.isActive || dbUser.deletedAt !== null) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      res.status(401).json({
        success: false,
        error: 'Usuario inactivo o no autorizado',
      } as ApiResponse);
      return;
    }

    if (dbUser.passwordChangedAt && decoded.iat) {
      const passwordChangedTime = dbUser.passwordChangedAt.getTime();
      const tokenIssuedTime = decoded.iat * 1000;
      if (tokenIssuedTime < passwordChangedTime - 1000) {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        res.status(401).json({
          success: false,
          error: 'La sesión ha expirado por cambio de contraseña. Por favor inicia sesión nuevamente.',
        } as ApiResponse);
        return;
      }
    }

    const payload: UserPayload = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      type: 'admin',
    };

    const newAccessToken = generateAccessToken(payload);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        user: payload,
      },
    });
  } catch (error) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token',
    } as ApiResponse);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
  } as ApiResponse);
});

export default router;
