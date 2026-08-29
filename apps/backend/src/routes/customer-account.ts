import { Router } from 'express';
import { requireCustomer } from '../middleware/auth';
import { prisma } from '@papes-confort/database';
import { compare, hash } from 'bcryptjs';
import {
  getCustomerById,
  updateCustomer,
  getCustomerOrders,
  getCustomerOrderById,
} from '../services/customer.service';
import {
  ApiResponse,
  CustomerDto,
  OrderDto,
  UpdateCustomerPayload,
  UserPayload,
  ChangePasswordConfirmPayload,
  ChangeEmailRequestPayload,
  ChangeEmailConfirmPayload,
} from '@papes-confort/shared';
import { passwordSecurityService } from '../services/password-security.service';
import {
  sendCustomerPasswordChangeCodeEmail,
  sendCustomerEmailChangeCodeEmail,
  sendPasswordChangedEmail,
} from '../services/email.service';
import { env } from '../config/env';

const router = Router();

// Todas las rutas de "Mi Cuenta" requieren que el usuario sea un cliente autenticado
router.use(requireCustomer);

// GET /api/customer/account
router.get('/', async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const profile = await getCustomerById(user.id);
    res.json({
      success: true,
      data: profile,
    } as ApiResponse<CustomerDto>);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/customer/account (Actualizar datos de perfil/envío)
router.patch('/', async (req, res) => {
  try {
    const user = req.user as UserPayload;
    const data: UpdateCustomerPayload = req.body;
    const updated = await updateCustomer(user.id, data);
    res.json({
      success: true,
      data: updated,
    } as ApiResponse<CustomerDto>);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar los datos de la cuenta',
    } as ApiResponse);
  }
});

// POST /api/customer/account/change-password-request (Paso 1: Solicitar código para cambio de contraseña)
router.post('/change-password-request', async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Debes ingresar la contraseña actual y la nueva contraseña.',
      } as ApiResponse);
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres.',
      } as ApiResponse);
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
    });

    if (!customer) {
      res.status(404).json({ success: false, error: 'Cliente no encontrado.' } as ApiResponse);
      return;
    }

    if (customer.password) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          error: 'Por favor ingresa tu contraseña actual.',
        } as ApiResponse);
        return;
      }
      const isMatch = await compare(currentPassword, customer.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'La contraseña actual ingresada es incorrecta.',
        } as ApiResponse);
        return;
      }
    }

    const newPasswordHash = await hash(newPassword, 12);
    const reqResult = passwordSecurityService.createRequest(
      user.id,
      'CUSTOMER_PASSWORD_CHANGE',
      newPasswordHash
    );

    if (reqResult.status === 'LOCKED') {
      res.status(429).json({
        success: false,
        error: `Has superado el límite de intentos. Bloqueo temporal por ${reqResult.remainingSeconds} segundos.`,
        retryAfter: reqResult.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (reqResult.status === 'COOLDOWN') {
      res.status(429).json({
        success: false,
        error: `Debes esperar ${reqResult.remainingSeconds} segundos antes de solicitar un nuevo código.`,
        retryAfter: reqResult.remainingSeconds,
      } as ApiResponse);
      return;
    }

    const code = reqResult.code;

    try {
      await sendCustomerPasswordChangeCodeEmail(customer.email, code, customer.name);
    } catch (emailErr: any) {
      console.error('[EMAIL ERROR] Error al enviar código de cambio de contraseña:', emailErr);
      passwordSecurityService.cancelPendingRequest(user.id, 'CUSTOMER_PASSWORD_CHANGE');
      res.status(400).json({
        success: false,
        error: `No se pudo enviar el correo de verificación a ${customer.email}: ${emailErr.message || 'Error SMTP'}`,
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: `Código de confirmación enviado exitosamente a tu correo (${customer.email}).`,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/customer/account/change-password-confirm (Paso 2: Confirmar código y actualizar contraseña)
router.post('/change-password-confirm', async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const { code }: ChangePasswordConfirmPayload = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'El código de confirmación es requerido.',
      } as ApiResponse);
      return;
    }

    const verifyRes = passwordSecurityService.verifyCode(user.id, 'CUSTOMER_PASSWORD_CHANGE', code);

    if (verifyRes.status === 'LOCKED') {
      res.status(429).json({
        success: false,
        error: `Demasiados intentos fallidos. Bloqueo temporal por ${verifyRes.remainingSeconds} segundos.`,
        retryAfter: verifyRes.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'El código ha expirado o no existe solicitud pendiente. Por favor solicita uno nuevo.',
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'INVALID') {
      if (verifyRes.isLockedNow) {
        res.status(429).json({
          success: false,
          error: 'Has superado el límite de intentos. Tu cuenta ha sido bloqueada temporalmente por 30 minutos.',
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

    const newPasswordHash = verifyRes.data;

    const updatedCustomer = await prisma.customer.update({
      where: { id: user.id },
      data: {
        password: newPasswordHash,
        passwordChangedAt: new Date(),
      },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    sendPasswordChangedEmail({ name: updatedCustomer.name, email: updatedCustomer.email }).catch(() => {});

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente. Debes iniciar sesión con tu nueva contraseña.',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/customer/account/change-email-request (Paso 1: Solicitar código para cambio de correo electrónico)
router.post('/change-email-request', async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const { newEmail, currentPassword }: ChangeEmailRequestPayload = req.body;

    if (!newEmail || !currentPassword) {
      res.status(400).json({
        success: false,
        error: 'El nuevo correo electrónico y la contraseña actual son requeridos.',
      } as ApiResponse);
      return;
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({
        success: false,
        error: 'El formato del nuevo correo electrónico es inválido.',
      } as ApiResponse);
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
    });

    if (!customer || !customer.password) {
      res.status(404).json({ success: false, error: 'Cliente no encontrado.' } as ApiResponse);
      return;
    }

    const isMatch = await compare(currentPassword, customer.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'La contraseña actual ingresada es incorrecta.',
      } as ApiResponse);
      return;
    }

    // Verificar si el nuevo correo ya existe en clientes o admins
    const [existingCustomer, existingUser] = await Promise.all([
      prisma.customer.findUnique({ where: { email: cleanEmail } }),
      prisma.user.findUnique({ where: { email: cleanEmail } }),
    ]);

    if ((existingCustomer && existingCustomer.id !== user.id) || existingUser) {
      res.status(400).json({
        success: false,
        error: 'El correo electrónico ingresado ya está en uso por otra cuenta.',
      } as ApiResponse);
      return;
    }

    const reqResult = passwordSecurityService.createRequest(
      user.id,
      'CUSTOMER_EMAIL_CHANGE',
      cleanEmail
    );

    if (reqResult.status === 'LOCKED') {
      res.status(429).json({
        success: false,
        error: `Has superado el límite de intentos. Bloqueo temporal por ${reqResult.remainingSeconds} segundos.`,
        retryAfter: reqResult.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (reqResult.status === 'COOLDOWN') {
      res.status(429).json({
        success: false,
        error: `Debes esperar ${reqResult.remainingSeconds} segundos antes de solicitar otro código.`,
        retryAfter: reqResult.remainingSeconds,
      } as ApiResponse);
      return;
    }

    const code = reqResult.code;

    try {
      await sendCustomerEmailChangeCodeEmail(customer.email, code, cleanEmail, customer.name);
    } catch (emailErr: any) {
      console.error('[EMAIL ERROR] Error al enviar código de cambio de email:', emailErr);
      passwordSecurityService.cancelPendingRequest(user.id, 'CUSTOMER_EMAIL_CHANGE');
      res.status(400).json({
        success: false,
        error: `No se pudo enviar el correo de verificación a ${customer.email}: ${emailErr.message || 'Error SMTP'}`,
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: `Código de confirmación enviado a tu correo actual (${customer.email}).`,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/customer/account/change-email-confirm (Paso 2: Confirmar código y actualizar correo)
router.post('/change-email-confirm', async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const { code }: ChangeEmailConfirmPayload = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'El código de confirmación es requerido.',
      } as ApiResponse);
      return;
    }

    const verifyRes = passwordSecurityService.verifyCode(user.id, 'CUSTOMER_EMAIL_CHANGE', code);

    if (verifyRes.status === 'LOCKED') {
      res.status(429).json({
        success: false,
        error: `Demasiados intentos fallidos. Bloqueo temporal por ${verifyRes.remainingSeconds} segundos.`,
        retryAfter: verifyRes.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'El código ha expirado o no existe ninguna solicitud pendiente. Por favor solicita uno nuevo.',
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'INVALID') {
      if (verifyRes.isLockedNow) {
        res.status(429).json({
          success: false,
          error: 'Has superado el límite de intentos. Cuenta bloqueada por 30 minutos.',
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

    const newEmail = verifyRes.data;

    await prisma.customer.update({
      where: { id: user.id },
      data: {
        email: newEmail,
      },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Correo electrónico actualizado correctamente. Debes volver a iniciar sesión con tu nuevo correo.',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /api/customer/account/orders
router.get('/orders', async (req, res, next) => {
  try {
    const user = req.user as UserPayload;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const ordersData = await getCustomerOrders(user.id, user.email, { page, limit });

    res.json({
      success: true,
      data: ordersData,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /api/customer/account/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const user = req.user as UserPayload;
    const { id } = req.params;

    const order = await getCustomerOrderById(user.id, user.email, id);

    res.json({
      success: true,
      data: order,
    } as ApiResponse<OrderDto>);
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Pedido no encontrado',
    } as ApiResponse);
  }
});

export default router;
