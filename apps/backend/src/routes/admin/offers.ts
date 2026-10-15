import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  listOffers,
  getOfferById,
} from '../../services/offer.service';
import { UserRole } from '@papes-confort/shared';

const router = Router();
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));


// GET /api/admin/offers - List all offers for admin (Read-only, synced from Gescom)
router.get('/', async (_req, res) => {
  try {
    const data = await listOffers(false);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/offers/:id - Get offer by ID with products (Read-only)
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

export default router;

