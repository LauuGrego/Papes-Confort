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

    let isActive: boolean | undefined = undefined;
    if (req.query.isActive !== undefined) {
      if (req.query.isActive === 'true') isActive = true;
      if (req.query.isActive === 'false') isActive = false;
    }

    const data = await getAdminProducts({ page, limit, search, isActive });
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

export function filterProductUpdateFields(body: any): Record<string, any> {
  const allowedFields = [
    'description',
    'discountPercent',
    'warrantyMonths',
    'weightKg',
    'dimensions',
    'specs',
    'productType',
  ];
  const filtered: Record<string, any> = {};
  if (!body || typeof body !== 'object') return filtered;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      filtered[field] = body[field];
    }
  }
  return filtered;
}

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = filterProductUpdateFields(req.body);

    if (Object.keys(body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No se enviaron campos web-only válidos para actualizar',
      } as ApiResponse);
      return;
    }

    const data = await updateProduct(id, body);
    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      } as ApiResponse);
      return;
    }
    next(error);
  }
});

export default router;
