import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '@papes-confort/database';
import { ApiResponse, UserPayload } from '@papes-confort/shared';
import { hash, compare } from 'bcryptjs';
import { sendEmail } from '../../services/email.service';
import { generateAccessToken, generateRefreshToken } from '../../utils/tokens';
import { env } from '../../config/env';

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

import { v2 as cloudinary } from 'cloudinary';

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

// Guardar solicitudes de cambio de contraseña pendientes en memoria
const pendingPasswordChanges = new Map<string, { code: string; hash: string; expiresAt: number }>();

// POST /api/admin/settings/change-password-request
router.post('/change-password-request', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    const user = req.user as UserPayload;
    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Solo los administradores pueden cambiar la contraseña.' });
      return;
    }

    // Buscar al usuario administrador en la base de datos para obtener su correo real actual
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      res.status(404).json({ success: false, error: 'Usuario administrador no encontrado.' });
      return;
    }

    const userEmail = dbUser.email;

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await hash(newPassword, 12);

    // Guardar en memoria por 10 minutos
    pendingPasswordChanges.set(user.id, {
      code,
      hash: hashedPassword,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

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

    await sendEmail({
      to: userEmail,
      subject: 'Código de Confirmación - Cambio de Contraseña de Administrador',
      html: emailHtml,
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
    if (!user) {
      res.status(401).json({ success: false, error: 'No autorizado.' });
      return;
    }

    const pending = pendingPasswordChanges.get(user.id);
    if (!pending) {
      res.status(400).json({ success: false, error: 'No hay ninguna solicitud de cambio de contraseña pendiente o ya expiró.' });
      return;
    }

    if (pending.expiresAt < Date.now()) {
      pendingPasswordChanges.delete(user.id);
      res.status(400).json({ success: false, error: 'El código de confirmación ha expirado. Por favor, solicita uno nuevo.' });
      return;
    }

    if (pending.code !== String(code).trim()) {
      res.status(400).json({ success: false, error: 'El código de confirmación ingresado es incorrecto.' });
      return;
    }

    // Actualizar la contraseña en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: { password: pending.hash },
    });

    // Eliminar la solicitud de la memoria
    pendingPasswordChanges.delete(user.id);

    res.json({
      success: true,
      message: 'Contraseña de administrador actualizada con éxito.',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/settings/change-email
router.post('/change-email', async (req, res, next) => {
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
    if (!user) {
      res.status(401).json({ success: false, error: 'No autorizado.' });
      return;
    }

    // Buscar usuario en base de datos para comparar contraseña
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado en la base de datos.' });
      return;
    }

    // Verificar contraseña actual
    const isMatch = await compare(currentPassword, dbUser.password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'La contraseña actual ingresada es incorrecta.' });
      return;
    }

    // Verificar si el correo ya pertenece a otro usuario registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser && existingUser.id !== user.id) {
      res.status(400).json({ success: false, error: 'El correo electrónico ingresado ya pertenece a otra cuenta.' });
      return;
    }

    // Actualizar correo directamente en la base de datos (Tabla User)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { email: cleanEmail },
    });

    // Generar nuevos tokens de sesión con el nuevo email
    const newPayload: UserPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role as any,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`[DB UPDATE] Correo del usuario ${updatedUser.id} actualizado exitosamente a: ${updatedUser.email}`);

    res.json({
      success: true,
      message: 'Correo electrónico de administrador actualizado con éxito en la base de datos.',
      data: {
        email: updatedUser.email,
        token: newAccessToken,
        user: newPayload,
      }
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});


export default router;
