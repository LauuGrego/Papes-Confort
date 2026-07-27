import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';
import { requireSyncAuth } from '../../middleware/syncAuth';

const router = Router();
router.use(requireSyncAuth);

router.post('/', async (req, res, next) => {
  try {
    const { sku, filename, url, isPrimary } = req.body;

    if (!sku || !filename) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sku and filename',
      } as ApiResponse);
      return;
    }

    const product = await prisma.product.findUnique({
      where: { sku: String(sku) },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: `Product with SKU "${sku}" not found`,
      } as ApiResponse);
      return;
    }

    const imageUrl = url || `/images/products/${filename}`;

    const existingImage = await prisma.productImage.findFirst({
      where: {
        productId: product.id,
        gescomFilename: String(filename),
      },
    });

    let image;
    if (existingImage) {
      image = await prisma.productImage.update({
        where: { id: existingImage.id },
        data: {
          url: imageUrl,
          isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : existingImage.isPrimary,
        },
      });
    } else {
      const imageCount = await prisma.productImage.count({
        where: { productId: product.id },
      });

      image = await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          gescomFilename: String(filename),
          isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : imageCount === 0,
          sortOrder: imageCount,
        },
      });
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { lastImageSyncAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        imageId: image.id,
        productId: product.id,
        sku: product.sku,
        url: image.url,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
