import { Router } from 'express';
import { getCategoriesHierarchy, getTopCategories } from '../services/category.service';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

router.get('/top', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
    const data = await getTopCategories(limit);
    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const data = await getCategoriesHierarchy();
    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
