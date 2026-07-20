import { Router } from 'express';
import { getProducts, getProductBySlug } from '../services/product.service';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const search = req.query.search as string || undefined;
    const brandId = req.query.brandId as string || undefined;
    const categoryId = req.query.categoryId as string || undefined;
    const typeSlug = req.query.type as string || undefined;
    const productType = req.query.productType as string || undefined;

    const data = await getProducts({
      page,
      limit,
      search,
      brandId,
      categoryId,
      typeSlug,
      productType,
    });

    res.json({
      success: true,
      data,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await getProductBySlug(slug);

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

export default router;
