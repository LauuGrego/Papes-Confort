import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

// GET /api/settings/public
router.get('/public', async (_req, res, next) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'whatsapp_number' },
    });

    res.json({
      success: true,
      data: {
        whatsapp_number: setting ? setting.value : '',
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
