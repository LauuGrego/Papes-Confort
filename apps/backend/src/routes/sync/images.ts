import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';
import { requireSyncAuth } from '../../middleware/syncAuth';

const router = Router();
router.use(requireSyncAuth);

router.post('/', async (req, res, next) => {
  try {
    const { sku, filename, url, isPrimary, sortOrder } = req.body;

    if (!sku || !filename) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sku and filename',
      } as ApiResponse);
      return;
    }

    const targetSku = String(sku).trim();
    const targetSkuClean = targetSku.replace(/^0+/, '');

    let product = await prisma.product.findUnique({
      where: { sku: targetSku },
    });

    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          sku: {
            equals: targetSku,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          sku: {
            equals: targetSkuClean,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!product) {
      const potentialProducts = await prisma.product.findMany({
        where: {
          sku: {
            contains: targetSkuClean,
            mode: 'insensitive',
          },
        },
      });
      product = potentialProducts.find(
        (p) => p.sku.replace(/^0+/, '').toLowerCase() === targetSkuClean.toLowerCase()
      ) || null;
    }

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

    const imageCount = await prisma.productImage.count({
      where: { productId: product.id },
    });

    const isPrimaryBool = isPrimary !== undefined 
      ? Boolean(isPrimary) 
      : (existingImage ? existingImage.isPrimary : (imageCount === 0));

    if (isPrimaryBool) {
      // Reset isPrimary flag on other images of this product to ensure only one is primary
      await prisma.productImage.updateMany({
        where: {
          productId: product.id,
          NOT: existingImage ? { id: existingImage.id } : undefined,
        },
        data: { isPrimary: false },
      });
    }

    let image;
    if (existingImage) {
      image = await prisma.productImage.update({
        where: { id: existingImage.id },
        data: {
          url: imageUrl,
          isPrimary: isPrimaryBool,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : existingImage.sortOrder,
        },
      });
    } else {
      image = await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          gescomFilename: String(filename),
          isPrimary: isPrimaryBool,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : imageCount,
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
