import { Router } from 'express';
import { getCategoriesHierarchy } from '../services/category.service';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

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
