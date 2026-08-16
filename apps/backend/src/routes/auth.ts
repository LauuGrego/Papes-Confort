import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import { ApiResponse, LoginResponseDto, UserPayload } from '@papes-confort/shared';
import { prisma } from '@papes-confort/database';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.status(401).json({
        success: false,
        error: info?.message || 'Invalid credentials',
      } as ApiResponse);
      return;
    }

    const payload: UserPayload = user;

    // Generate tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: payload,
        token: accessToken,
      },
    } as ApiResponse<LoginResponseDto>);
  })(req, res, next);
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

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
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
      role: dbUser.role,
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
