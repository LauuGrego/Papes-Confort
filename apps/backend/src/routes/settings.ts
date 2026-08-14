import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

// GET /api/settings/public
router.get('/public', async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['whatsapp_number', 'home_flyers', 'home_payment_cards'],
        },
      },
    });

    const settingsMap: Record<string, string> = {
      whatsapp_number: '',
      home_flyers: '',
      home_payment_cards: '',
    };

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
