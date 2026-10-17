import { Router } from 'express';
import {
  getActivePromotions,
  getTodayPromotion,
  getArgentinaDayOfWeek,
} from '../services/bankPromotion.service';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

/**
 * GET /api/bank-promotions
 * Obtiene todas las promociones bancarias vigentes
 */
router.get('/', async (req, res, next) => {
  try {
    const dayOfWeek = req.query.dayOfWeek !== undefined ? Number(req.query.dayOfWeek) : undefined;
    const promotions = await getActivePromotions(dayOfWeek);
    const todayPromotion = await getTodayPromotion();
    const todayDayOfWeek = getArgentinaDayOfWeek();

    res.json({
      success: true,
      data: {
        promotions,
        todayPromotion,
        todayDayOfWeek,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bank-promotions/today
 * Obtiene la promoción bancaria destacada del día de hoy
 */
router.get('/today', async (_req, res, next) => {
  try {
    const promotion = await getTodayPromotion();
    const todayDayOfWeek = getArgentinaDayOfWeek();

    res.json({
      success: true,
      data: {
        promotion,
        todayDayOfWeek,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
