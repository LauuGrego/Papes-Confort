import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole, ApiResponse } from '@papes-confort/shared';
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  togglePromotionActive,
  deletePromotion,
} from '../../services/bankPromotion.service';

const router = Router();
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

/**
 * GET /api/admin/bank-promotions
 * Lista todas las promociones bancarias
 */
router.get('/', async (_req, res, next) => {
  try {
    const data = await getAllPromotions();
    res.json({ success: true, data } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/bank-promotions
 * Crea una nueva promoción bancaria
 */
router.post('/', async (req, res, next) => {
  try {
    const data = await createPromotion(req.body);
    res.status(201).json({ success: true, data } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/bank-promotions/:id
 * Actualiza una promoción bancaria
 */
router.put('/:id', async (req, res, next) => {
  try {
    const data = await updatePromotion(req.params.id, req.body);
    res.json({ success: true, data } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/bank-promotions/:id/toggle
 * Alterna el estado activo de una promoción
 */
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const data = await togglePromotionActive(req.params.id);
    res.json({ success: true, data } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/bank-promotions/:id
 * Elimina una promoción bancaria
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const data = await deletePromotion(req.params.id);
    res.json({ success: true, data } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
