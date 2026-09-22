import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '@papes-confort/database';
import { ApiResponse, UserPayload } from '@papes-confort/shared';
import { hash, compare } from 'bcryptjs';
import { sendEmail } from '../../services/email.service';
import { env } from '../../config/env';
import { passwordSecurityService } from '../../services/password-security.service';
import { auditSecurityEvent } from '../../utils/audit';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

router.use(requireAuth);

// GET /api/admin/settings
router.get('/', async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    res.json({
      success: true,
      data: settingsMap,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/settings
router.put('/', async (req, res, next) => {
  try {
    const body = req.body as Record<string, string>;

    await prisma.$transaction(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsMap,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// POST /api/admin/settings/upload-flyer (Sube imagen a Cloudinary)
router.post('/upload-flyer', async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ success: false, error: 'No se envió ninguna imagen.' });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({
        success: false,
        error: 'Las credenciales de Cloudinary no están configuradas en el servidor.',
      });
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: 'papes-confort/flyers',
    });

    res.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error al subir flyer a Cloudinary:', error);
    next(error);
  }
});

// POST /api/admin/settings/upload-image (Sube cualquier imagen a Cloudinary)
router.post('/upload-image', async (req, res, next) => {
  try {
    const { image, folder } = req.body;
    if (!image) {
      res.status(400).json({ success: false, error: 'No se envió ninguna imagen.' });
      return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({
        success: false,
        error: 'Las credenciales de Cloudinary no están configuradas en el servidor.',
      });
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: folder || 'papes-confort/landing',
    });

    res.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error al subir imagen a Cloudinary:', error);
    next(error);
  }
});

// POST /api/admin/settings/change-password-request
router.post('/change-password-request', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    const user = req.user as UserPayload;
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      res.status(403).json({ success: false, error: 'Solo los administradores pueden cambiar la contraseña.' });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      res.status(404).json({ success: false, error: 'Usuario administrador no encontrado.' });
      return;
    }

    const hashedPassword = await hash(newPassword, 12);
    const reqResult = passwordSecurityService.createRequest(user.id, 'PASSWORD_CHANGE', hashedPassword);

    if (reqResult.status === 'LOCKED') {
      auditSecurityEvent('PASSWORD_CHANGE_LOCKED', {
        userId: user.id,
        email: dbUser.email,
        ip: req.ip,
        result: 'LOCKED',
        detail: 'Solicitud bloqueada por exceso de intentos fallidos previo.',
      });
      res.status(429).json({
        success: false,
        error: `Cuenta bloqueada temporalmente. Por favor reintenta en ${reqResult.remainingSeconds} segundos.`,
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
    const userEmail = dbUser.email;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #e41414; margin: 0; font-size: 24px; font-weight: 800;">Papes Confort</h2>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Acceso Administrativo</p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">Hola Administrador,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 24px 0;">Se ha solicitado un cambio de contraseña para el acceso al panel. Introduce el siguiente código de confirmación en el formulario para completar la operación:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">* Este código es válido por 10 minutos y es de uso único.</p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">Si tú no iniciaste esta solicitud, puedes ignorar este correo de forma segura.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: userEmail,
        subject: 'Código de Confirmación - Cambio de Contraseña de Administrador',
        html: emailHtml,
      });
    } catch (emailErr: any) {
      console.error('[EMAIL ERROR] Error al enviar correo de contraseña:', emailErr);
      passwordSecurityService.cancelPendingRequest(user.id, 'PASSWORD_CHANGE');
      res.status(400).json({
        success: false,
        error: `No se pudo enviar el correo a ${userEmail}: ${emailErr.message || 'Error en el servidor de correo SMTP'}`,
      });
      return;
    }

    auditSecurityEvent('PASSWORD_CHANGE_REQUESTED', {
      userId: user.id,
      email: userEmail,
      ip: req.ip,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: `Código de confirmación enviado con éxito a ${userEmail}.`,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/settings/confirm-password-change
router.post('/confirm-password-change', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: 'El código de confirmación es requerido.' });
      return;
    }

    const user = req.user as UserPayload;
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      res.status(401).json({ success: false, error: 'No autorizado.' });
      return;
    }

    const verifyRes = passwordSecurityService.verifyCode(user.id, 'PASSWORD_CHANGE', String(code).trim());

    if (verifyRes.status === 'LOCKED') {
      auditSecurityEvent('PASSWORD_CHANGE_LOCKED', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        result: 'LOCKED',
        detail: 'Intento de confirmación rechazado por bloqueo temporal.',
      });
      res.status(429).json({
        success: false,
        error: `Demasiados intentos fallidos. Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${verifyRes.remainingSeconds} segundos.`,
        retryAfter: verifyRes.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'El código de confirmación ha expirado o no existe ninguna solicitud pendiente. Solicita uno nuevo.',
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'INVALID') {
      if (verifyRes.isLockedNow) {
        auditSecurityEvent('PASSWORD_CHANGE_LOCKED', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          result: 'LOCKED',
          attempts: verifyRes.attempts,
          detail: 'Cuenta bloqueada tras alcanzar 5 intentos fallidos en cambio de contraseña.',
        });
        res.status(429).json({
          success: false,
          error: 'Has superado el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 30 minutos.',
          retryAfter: verifyRes.remainingLockoutSeconds,
        } as ApiResponse);
        return;
      }

      auditSecurityEvent('PASSWORD_CHANGE_ATTEMPT_FAILED', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        result: 'FAILED',
        attempts: verifyRes.attempts,
      });

      res.status(400).json({
        success: false,
        error: `El código ingresado es incorrecto. Te quedan ${verifyRes.remainingAttempts} intento(s).`,
        remainingAttempts: verifyRes.remainingAttempts,
      } as ApiResponse);
      return;
    }

    // Success -> verifyRes.data contains newPasswordHash
    const newPasswordHash = verifyRes.data;

    await prisma.user.update({
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

    auditSecurityEvent('PASSWORD_CHANGE_CONFIRMED', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Contraseña de administrador actualizada con éxito. Debe iniciar sesión nuevamente.',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/settings/change-email-request
router.post('/change-email-request', async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      res.status(400).json({ success: false, error: 'El nuevo correo y la contraseña actual son requeridos.' });
      return;
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, error: 'El formato del correo electrónico ingresado no es válido.' });
      return;
    }

    const user = req.user as UserPayload;
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      res.status(401).json({ success: false, error: 'No autorizado.' });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado en la base de datos.' });
      return;
    }

    const isMatch = await compare(currentPassword, dbUser.password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'La contraseña actual ingresada es incorrecta.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser && existingUser.id !== user.id) {
      res.status(400).json({ success: false, error: 'El correo electrónico ingresado ya pertenece a otra cuenta.' });
      return;
    }

    const reqResult = passwordSecurityService.createRequest(user.id, 'EMAIL_CHANGE', cleanEmail);

    if (reqResult.status === 'LOCKED') {
      auditSecurityEvent('EMAIL_CHANGE_LOCKED', {
        userId: user.id,
        email: dbUser.email,
        ip: req.ip,
        result: 'LOCKED',
        detail: 'Solicitud de cambio de email bloqueada.',
      });
      res.status(429).json({
        success: false,
        error: `Cuenta bloqueada temporalmente. Por favor reintenta en ${reqResult.remainingSeconds} segundos.`,
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
    const currentEmail = dbUser.email;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #e41414; margin: 0; font-size: 24px; font-weight: 800;">Papes Confort</h2>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Acceso Administrativo</p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">Hola Administrador,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">Se ha solicitado modificar tu dirección de correo de administrador a: <strong>${cleanEmail}</strong>.</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 24px 0;">Introduce el siguiente código de confirmación en el panel para autorizar esta modificación:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">* Este código es válido por 10 minutos y es de uso único.</p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">Si tú no iniciaste esta solicitud, puedes ignorar este correo de forma segura.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: currentEmail,
        subject: 'Código de Confirmación - Cambio de Correo Electrónico',
        html: emailHtml,
      });
    } catch (emailErr: any) {
      console.error('[EMAIL ERROR] Error al enviar correo de cambio de email:', emailErr);
      passwordSecurityService.cancelPendingRequest(user.id, 'EMAIL_CHANGE');
      res.status(400).json({
        success: false,
        error: `No se pudo enviar el correo a ${currentEmail}: ${emailErr.message || 'Error en el servidor de correo SMTP'}`,
      });
      return;
    }

    auditSecurityEvent('EMAIL_CHANGE_REQUESTED', {
      userId: user.id,
      email: currentEmail,
      ip: req.ip,
      result: 'SUCCESS',
      detail: `Nuevo correo solicitado: ${cleanEmail}`,
    });

    res.json({
      success: true,
      message: `Código de confirmación enviado con éxito a tu correo actual (${currentEmail}).`,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/settings/confirm-email-change
router.post('/confirm-email-change', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: 'El código de confirmación es requerido.' });
      return;
    }

    const user = req.user as UserPayload;
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      res.status(401).json({ success: false, error: 'No autorizado.' });
      return;
    }

    const verifyRes = passwordSecurityService.verifyCode(user.id, 'EMAIL_CHANGE', String(code).trim());

    if (verifyRes.status === 'LOCKED') {
      auditSecurityEvent('EMAIL_CHANGE_LOCKED', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        result: 'LOCKED',
      });
      res.status(429).json({
        success: false,
        error: `Demasiados intentos fallidos. Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${verifyRes.remainingSeconds} segundos.`,
        retryAfter: verifyRes.remainingSeconds,
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'El código de confirmación ha expirado o no existe ninguna solicitud pendiente. Solicita uno nuevo.',
      } as ApiResponse);
      return;
    }

    if (verifyRes.status === 'INVALID') {
      if (verifyRes.isLockedNow) {
        auditSecurityEvent('EMAIL_CHANGE_LOCKED', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          result: 'LOCKED',
          attempts: verifyRes.attempts,
        });
        res.status(429).json({
          success: false,
          error: 'Has superado el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 30 minutos.',
          retryAfter: verifyRes.remainingLockoutSeconds,
        } as ApiResponse);
        return;
      }

      auditSecurityEvent('EMAIL_CHANGE_ATTEMPT_FAILED', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        result: 'FAILED',
        attempts: verifyRes.attempts,
      });

      res.status(400).json({
        success: false,
        error: `El código ingresado es incorrecto. Te quedan ${verifyRes.remainingAttempts} intento(s).`,
        remainingAttempts: verifyRes.remainingAttempts,
      } as ApiResponse);
      return;
    }

    // Success -> verifyRes.data contains newEmail
    const newEmail = verifyRes.data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    auditSecurityEvent('EMAIL_CHANGE_CONFIRMED', {
      userId: user.id,
      email: updatedUser.email,
      ip: req.ip,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Correo electrónico de administrador actualizado con éxito. Debe iniciar sesión nuevamente.',
      data: { email: updatedUser.email },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
