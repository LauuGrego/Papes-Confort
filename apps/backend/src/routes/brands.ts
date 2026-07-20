import { Router } from 'express';
import { getBrandsList } from '../services/brand.service';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await getBrandsList();
    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
