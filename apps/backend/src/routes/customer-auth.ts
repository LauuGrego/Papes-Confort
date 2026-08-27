import { Router } from 'express';
import passport from 'passport';
import { prisma } from '@papes-confort/database';
import { hash } from 'bcryptjs';
import {
  ApiResponse,
  CustomerAuthResponseDto,
  CustomerDto,
  RegisterCustomerPayload,
  RegisterConfirmPayload,
  UserPayload,
  isValidCuilCuit,
  cleanCuilCuit,
} from '@papes-confort/shared';
import { env } from '../config/env';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import { sendCustomerWelcomeEmail, sendCustomerRegistrationCodeEmail } from '../services/email.service';
import { mergeCart } from '../services/cart.service';
import { mapCustomerToDto } from '../services/customer.service';
import { requireCustomer } from '../middleware/auth';
import { passwordSecurityService } from '../services/password-security.service';

const router = Router();

// POST /api/customer/auth/register-request (Paso 1: Valida datos y envía código al email)
router.post('/register-request', async (req, res, next) => {
  try {
    const body: RegisterCustomerPayload = req.body;
    const { name, email, password, phone, cuilCuit, address, city, province, postalCode, marketingOptIn } = body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'El nombre y apellido son requeridos.' } as ApiResponse);
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({ success: false, error: 'El correo electrónico es requerido.' } as ApiResponse);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, error: 'El formato de correo electrónico es inválido.' } as ApiResponse);
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' } as ApiResponse);
      return;
    }

    let cleanedCuil: string | null = null;
    if (cuilCuit && cuilCuit.trim()) {
      if (!isValidCuilCuit(cuilCuit)) {
        res.status(400).json({
          success: false,
          error: 'El CUIL/CUIT ingresado no es válido (debe tener 11 dígitos y dígito verificador correcto de AFIP).',
        } as ApiResponse);
        return;
      }
      cleanedCuil = cleanCuilCuit(cuilCuit);
    }

    // Verificar si ya existe una cuenta de cliente activa con contraseña
    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.password) {
      res.status(409).json({
        success: false,
        error: 'Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.',
      } as ApiResponse);
      return;
    }

    const hashedPassword = await hash(password, 12);

    const pendingData = {
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashedPassword,
      phone: phone ? phone.trim() : null,
      cuilCuit: cleanedCuil,
      address: address ? address.trim() : null,
      city: city ? city.trim() : null,
      province: province ? province.trim() : null,
      postalCode: postalCode ? postalCode.trim() : null,
      marketingOptIn: Boolean(marketingOptIn),
    };

    const reqResult = passwordSecurityService.createRequest(
      cleanEmail,
      'CUSTOMER_REGISTRATION',
      JSON.stringify(pendingData)
    );

    if (reqResult.status === 'LOCKED') {
      res.status(429).json({
        success: false,
        error: `Has superado el límite de intentos. Por favor espera ${reqResult.remainingSeconds} segundos antes de reintentar.`,
        retryAfter: reqResult.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (reqResult.status === 'COOLDOWN') {
      res.status(429).json({
        success: false,
        error: `Debes esperar ${reqResult.remainingSeconds} segundos antes de solicitar otro código de confirmación.`,
        retryAfter: reqResult.remainingSeconds,
      } as ApiResponse);
      return;
    }

    const code = reqResult.code;

    try {
      await sendCustomerRegistrationCodeEmail(cleanEmail, code, name.trim());
    } catch (emailErr: any) {
      console.error('[EMAIL ERROR] Error al enviar código de registro:', emailErr);
      passwordSecurityService.cancelPendingRequest(cleanEmail, 'CUSTOMER_REGISTRATION');
      res.status(400).json({
        success: false,
        error: `No se pudo enviar el correo de confirmación a ${cleanEmail}: ${emailErr.message || 'Error en servidor de correo'}`,
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: `Código de confirmación enviado exitosamente a ${cleanEmail}.`,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/customer/auth/register-confirm (Paso 2: Verifica código y crea/activa la cuenta)
router.post('/register-confirm', async (req, res, next) => {
  try {
    const { email, code }: RegisterConfirmPayload = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        error: 'El correo electrónico y el código de confirmación son requeridos.',
      } as ApiResponse);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const verifyRes = passwordSecurityService.verifyCode(cleanEmail, 'CUSTOMER_REGISTRATION', code);

    if (verifyRes.status === 'LOCKED') {
      res.status(429).json({
        success: false,
        error: `Demasiados intentos fallidos. Intenta nuevamente en ${verifyRes.remainingSeconds} segundos.`,
        retryAfter: verifyRes.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'El código de confirmación ha expirado o no existe ninguna solicitud pendiente. Por favor solicita uno nuevo.',
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'INVALID') {
      if (verifyRes.isLockedNow) {
        res.status(429).json({
          success: false,
          error: 'Has superado el límite de intentos. Bloqueo temporal por 30 minutos.',
          retryAfter: verifyRes.remainingLockoutSeconds,
        } as ApiResponse);
        return;
      }

      res.status(400).json({
        success: false,
        error: `El código ingresado es incorrecto. Te quedan ${verifyRes.remainingAttempts} intento(s).`,
        remainingAttempts: verifyRes.remainingAttempts,
      } as ApiResponse);
      return;
    }

    // Código válido -> extraer datos
    const payload = JSON.parse(verifyRes.data);

    // Verificar si ya existía sin contraseña
    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    let customer;
    if (existing) {
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: payload.name,
          password: payload.passwordHash,
          phone: payload.phone || existing.phone,
          cuilCuit: payload.cuilCuit || existing.cuilCuit,
          address: payload.address || existing.address,
          city: payload.city || existing.city,
          province: payload.province || existing.province,
          postalCode: payload.postalCode || existing.postalCode,
          marketingOptIn: payload.marketingOptIn,
          isActive: true,
          deletedAt: null,
          passwordChangedAt: new Date(),
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: payload.name,
          email: cleanEmail,
          password: payload.passwordHash,
          phone: payload.phone,
          cuilCuit: payload.cuilCuit,
          address: payload.address,
          city: payload.city,
          province: payload.province,
          postalCode: payload.postalCode,
          marketingOptIn: payload.marketingOptIn,
          isActive: true,
        },
      });
    }

    const customerDto = mapCustomerToDto(customer);
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

    // Merge carrito de sesión anónima
    const sessionId = req.cookies?.papes_cart;
    if (sessionId) {
      await mergeCart(sessionId, customer.id).catch(() => {});
    }

    // Email de bienvenida
    sendCustomerWelcomeEmail({ name: customer.name, email: customer.email }).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        token: accessToken,
        user: userPayload,
        customer: customerDto,
      },
    } as ApiResponse<CustomerAuthResponseDto>);
  } catch (error) {
    next(error);
  }
});

// POST /api/customer/auth/register (Fallback directo)
router.post('/register', async (req, res, next) => {
  try {
    const body: RegisterCustomerPayload = req.body;
    const { name, email, password, phone, cuilCuit, address, city, province, postalCode, marketingOptIn } = body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'El nombre y apellido son requeridos.' } as ApiResponse);
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({ success: false, error: 'El correo electrónico es requerido.' } as ApiResponse);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, error: 'El formato de correo electrónico es inválido.' } as ApiResponse);
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' } as ApiResponse);
      return;
    }

    let cleanedCuil: string | null = null;
    if (cuilCuit && cuilCuit.trim()) {
      if (!isValidCuilCuit(cuilCuit)) {
        res.status(400).json({
          success: false,
          error: 'El CUIL/CUIT ingresado no es válido.',
        } as ApiResponse);
        return;
      }
      cleanedCuil = cleanCuilCuit(cuilCuit);
    }

    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.password) {
      res.status(409).json({
        success: false,
        error: 'Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.',
      } as ApiResponse);
      return;
    }

    const hashedPassword = await hash(password, 12);

    let customer;
    if (existing) {
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          password: hashedPassword,
          phone: phone ? phone.trim() : existing.phone,
          cuilCuit: cleanedCuil || existing.cuilCuit,
          address: address ? address.trim() : existing.address,
          city: city ? city.trim() : existing.city,
          province: province ? province.trim() : existing.province,
          postalCode: postalCode ? postalCode.trim() : existing.postalCode,
          marketingOptIn: Boolean(marketingOptIn),
          isActive: true,
          deletedAt: null,
          passwordChangedAt: new Date(),
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          phone: phone ? phone.trim() : null,
          cuilCuit: cleanedCuil,
          address: address ? address.trim() : null,
          city: city ? city.trim() : null,
          province: province ? province.trim() : null,
          postalCode: postalCode ? postalCode.trim() : null,
          marketingOptIn: Boolean(marketingOptIn),
          isActive: true,
        },
      });
    }

    const customerDto = mapCustomerToDto(customer);
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

    sendCustomerWelcomeEmail({ name: customer.name, email: customer.email }).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        token: accessToken,
        user: userPayload,
        customer: customerDto,
      },
    } as ApiResponse<CustomerAuthResponseDto>);
  } catch (error) {
    next(error);
  }
});

// POST /api/customer/auth/login
router.post('/login', (req, res, next) => {
  passport.authenticate('customer-local', { session: false }, async (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.status(401).json({
        success: false,
        error: info?.message || 'Correo o contraseña incorrectos',
      } as ApiResponse);
      return;
    }

    try {
      const userPayload: UserPayload = user;

      const customer = await prisma.customer.findUnique({
        where: { id: userPayload.id },
      });

      if (!customer) {
        res.status(404).json({ success: false, error: 'Cliente no encontrado' } as ApiResponse);
        return;
      }

      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken(userPayload);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Merge carrito si existe
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
      } as ApiResponse<CustomerAuthResponseDto>);
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

// POST /api/customer/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  } as ApiResponse);
});

// GET /api/customer/auth/me
router.get('/me', requireCustomer, async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const customer = await prisma.customer.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!customer) {
      res.status(404).json({ success: false, error: 'Cliente no encontrado' } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: mapCustomerToDto(customer),
    } as ApiResponse<CustomerDto>);
  } catch (error) {
    next(error);
  }
});

export default router;
