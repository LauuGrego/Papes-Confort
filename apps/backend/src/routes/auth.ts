import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiResponse, LoginPayload, LoginResponseDto } from '@papes-confort/shared';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginPayload;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      } as ApiResponse);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse);
      return;
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse);
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      data: {
        user: payload,
        token,
      },
    } as ApiResponse<LoginResponseDto>);
  } catch (error) {
    next(error);
  }
});

export default router;
