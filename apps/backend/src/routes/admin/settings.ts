import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';

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

export default router;
