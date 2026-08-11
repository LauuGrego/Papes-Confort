import { Router } from 'express';
import { listOffers, getOfferBySlug } from '../services/offer.service';

const router = Router();

// GET /api/offers - List active offers
router.get('/', async (_req, res) => {
  try {
    const data = await listOffers(true);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/offers/:slug - Get offer details and products by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const data = await getOfferBySlug(slug);

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
