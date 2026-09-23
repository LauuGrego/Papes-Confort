import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';
import { requireSyncAuth } from '../../middleware/syncAuth';

const router = Router();
router.use(requireSyncAuth);

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * POST /api/sync/offers
 * Sincroniza listas de precios/ofertas desde Gescom ERP (Ventas_Listas).
 * Cada oferta puede especificar su nombre (LDes), porcentaje de descuento (LPorc)
 * y la lista de SKUs de productos asociados.
 */
router.post('/', async (req, res) => {
  try {
    const { offers } = req.body;

    if (!Array.isArray(offers)) {
      res.status(400).json({
        success: false,
        error: 'Invalid payload: "offers" must be an array',
      } as ApiResponse);
      return;
    }

    let offersProcessed = 0;
    let productsLinked = 0;

    for (const item of offers) {
      const offerName = String(item.LDes || item.name || item.title || '').trim();
      if (!offerName) continue;

      const rawDiscount = item.LPorc !== undefined ? item.LPorc : item.discountPercent;
      const discountPercent = rawDiscount !== undefined ? Math.abs(Number(rawDiscount)) : 0;
      const offerSlug = slugify(offerName) || `offer-${Date.now()}`;
      const isActive = item.isActive !== undefined ? Boolean(item.isActive) : true;

      // Buscar o crear la oferta
      let offer = await prisma.offer.findFirst({
        where: { OR: [{ slug: offerSlug }, { name: offerName }] },
      });

      if (offer) {
        offer = await prisma.offer.update({
          where: { id: offer.id },
          data: {
            name: offerName,
            discountPercent,
            isActive,
            updatedAt: new Date(),
          },
        });
      } else {
        offer = await prisma.offer.create({
          data: {
            name: offerName,
            slug: offerSlug,
            description: `Lista de ofertas: ${offerName}`,
            discountPercent,
            isActive,
          },
        });
      }
      offersProcessed++;

      // Vincular productos por SKU si se proporcionan
      const productSkus = Array.isArray(item.productSkus)
        ? item.productSkus
        : Array.isArray(item.skus)
        ? item.skus
        : [];

      if (productSkus.length > 0) {
        const products = await prisma.product.findMany({
          where: { sku: { in: productSkus.map(String) } },
          select: { id: true },
        });

        for (const p of products) {
          await prisma.offerProduct.upsert({
            where: {
              offerId_productId: {
                offerId: offer.id,
                productId: p.id,
              },
            },
            update: {},
            create: {
              offerId: offer.id,
              productId: p.id,
            },
          });

          // Actualizar producto a tipo OFFER
          await prisma.product.update({
            where: { id: p.id },
            data: {
              productType: 'OFFER',
              ...(discountPercent > 0 && { discountPercent }),
            },
          });

          productsLinked++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        offersProcessed,
        productsLinked,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error syncing offers',
    } as ApiResponse);
  }
});

export default router;
