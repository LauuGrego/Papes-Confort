import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getAdminProducts, getAdminProductById, updateProduct } from '../../services/product.service';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const search = req.query.search as string || undefined;

    const data = await getAdminProducts({ page, limit, search });
    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await getAdminProductById(id);

    if (!data) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateProduct(id, req.body);
    res.json({
      success: true,
      data: updated,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
