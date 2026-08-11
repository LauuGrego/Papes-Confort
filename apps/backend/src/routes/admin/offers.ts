import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  listOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  addProductsToOffer,
  removeProductsFromOffer,
  bulkApplyDiscount,
} from '../../services/offer.service';

const router = Router();
router.use(requireAuth);

// GET /api/admin/offers - List all offers for admin
router.get('/', async (_req, res) => {
  try {
    const data = await listOffers(false);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/offers/:id - Get offer by ID with products
router.get('/:id', async (req, res) => {
  try {
    const data = await getOfferById(req.params.id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Oferta no encontrada' });
      return;
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/offers - Create new offer
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, discountPercent, isActive } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, error: 'El nombre de la oferta es obligatorio' });
      return;
    }

    const data = await createOffer({
      name,
      slug,
      description,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Ya existe una oferta con ese slug' });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/offers/:id - Update offer
router.put('/:id', async (req, res) => {
  try {
    const { name, slug, description, discountPercent, isActive } = req.body;
    const data = await updateOffer(req.params.id, {
      name,
      slug,
      description,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Oferta no encontrada' });
      return;
    }
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Ya existe otra oferta con ese slug' });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/offers/:id - Delete offer
router.delete('/:id', async (req, res) => {
  try {
    await deleteOffer(req.params.id);
    res.json({ success: true, message: 'Oferta eliminada correctamente' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Oferta no encontrada' });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/offers/:id/products - Add product(s) to offer (supports single productId or array productIds)
router.post('/:id/products', async (req, res) => {
  try {
    const { productId, productIds } = req.body;
    let list: string[] = [];
    if (Array.isArray(productIds)) {
      list = productIds;
    } else if (typeof productId === 'string' && productId) {
      list = [productId];
    }

    if (list.length === 0) {
      res.status(400).json({ success: false, error: 'Selecciona al menos un producto' });
      return;
    }

    await addProductsToOffer(req.params.id, list);
    res.json({ success: true, message: `${list.length} productos agregados a la oferta` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/offers/:id/products/:productId - Remove product from offer
router.delete('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    await removeProductsFromOffer(id, [productId]);
    res.json({ success: true, message: 'Producto removido de la oferta' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/offers/:id/products/remove - Remove multiple products from offer
router.post('/:id/products/remove', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ success: false, error: 'Selecciona al menos un producto a remover' });
      return;
    }

    await removeProductsFromOffer(req.params.id, productIds);
    res.json({ success: true, message: `${productIds.length} productos removidos` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/offers/:id/apply-discount - Bulk apply discount to products with 0 discount
router.post('/:id/apply-discount', async (req, res) => {
  try {
    const { percent } = req.body;
    const discountNum = Number(percent);

    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      res.status(400).json({ success: false, error: 'Porcentaje de descuento inválido (0-100)' });
      return;
    }

    const updatedCount = await bulkApplyDiscount(req.params.id, discountNum);
    res.json({
      success: true,
      message: `Descuento del ${discountNum}% aplicado a ${updatedCount} productos`,
      updatedCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
