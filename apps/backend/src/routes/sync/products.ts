import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse, SyncStatus } from '@papes-confort/shared';
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

router.post('/', async (req, res, next) => {
  const startedAt = new Date();
  let productsCreated = 0;
  let productsUpdated = 0;
  let brandsCreated = 0;
  let errors = 0;
  const errorDetails: Array<{ sku?: string; error: string }> = [];

  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      res.status(400).json({
        success: false,
        error: 'Invalid payload: "products" must be an array',
      } as ApiResponse);
      return;
    }

    // Ensure default ProductFamily exists
    let defaultFamily = await prisma.productFamily.findFirst();
    if (!defaultFamily) {
      defaultFamily = await prisma.productFamily.create({
        data: {
          name: 'General',
          slug: 'general',
        },
      });
    }

    // Ensure default Brand exists
    let defaultBrand = await prisma.brand.findFirst();
    if (!defaultBrand) {
      defaultBrand = await prisma.brand.create({
        data: {
          name: 'Papes Confort',
          slug: 'papes-confort',
          gescomName: 'PAPES CONFORT',
        },
      });
    }

    for (const item of products) {
      try {
        const {
          sku,
          gescomName,
          name,
          description,
          basePrice,
          stock,
          brandName,
          gescomId,
          barcode,
          ivaPercent,
          unit,
          rubro,
          subrubro,
          isActive,
        } = item;

        if (!sku || gescomName === undefined || basePrice === undefined || stock === undefined) {
          errors++;
          errorDetails.push({ sku: sku || 'UNKNOWN', error: 'Missing required product fields (sku, gescomName, basePrice, stock)' });
          continue;
        }

        // Handle brand if specified
        let brandId = defaultBrand.id;
        if (brandName && brandName.trim()) {
          const trimmedBrand = brandName.trim();
          const brandSlug = slugify(trimmedBrand);
          let brand = await prisma.brand.findFirst({
            where: { OR: [{ slug: brandSlug }, { gescomName: trimmedBrand }] },
          });

          if (!brand) {
            brand = await prisma.brand.create({
              data: {
                name: trimmedBrand,
                slug: brandSlug || `brand-${Date.now()}`,
                gescomName: trimmedBrand,
              },
            });
            brandsCreated++;
          }
          brandId = brand.id;
        }

        // Handle family and category (taxonomy)
        let productFamilyId = defaultFamily.id;
        let productCategoryId: string | undefined = undefined;

        if (rubro && String(rubro).trim()) {
          const trimmedRubro = String(rubro).trim();
          const familyName = trimmedRubro;
          const familySlug = slugify(familyName);
          let family = await prisma.productFamily.findUnique({
            where: { slug: familySlug },
          });

          if (!family) {
            family = await prisma.productFamily.create({
              data: {
                name: familyName,
                slug: familySlug || `family-${Date.now()}-${trimmedRubro}`,
              },
            });
          }
          productFamilyId = family.id;

          if (subrubro && String(subrubro).trim()) {
            const trimmedSubrubro = String(subrubro).trim();
            const categoryName = trimmedSubrubro;
            // Avoid collisions between identical subrubro codes belonging to different rubros
            const categorySlug = slugify(`rubro-${trimmedRubro}-subrubro-${trimmedSubrubro}`);
            let category = await prisma.productCategory.findUnique({
              where: { slug: categorySlug },
            });

            if (!category) {
              category = await prisma.productCategory.create({
                data: {
                  name: categoryName,
                  slug: categorySlug || `category-${Date.now()}-${trimmedSubrubro}`,
                  productFamilyId: family.id,
                },
              });
            }
            productCategoryId = category.id;
          }
        }

        const numericPrice = Number(basePrice);
        const numericStock = Number(stock);
        const baseSlug = slugify(gescomName) || `prod-${sku}`;
        const finalSlug = `${baseSlug}-${sku.toLowerCase()}`;

        const existing = await prisma.product.findUnique({
          where: { sku: String(sku) },
        });

        if (existing) {
          const currentSpecs = (existing.specs as Record<string, any>) || {};
          const updatedSpecs = {
            ...currentSpecs,
            ...(ivaPercent !== undefined && { ivaPercent }),
            ...(unit !== undefined && { unit }),
            ...(rubro !== undefined && { rubro }),
            ...(subrubro !== undefined && { subrubro }),
          };

          await prisma.product.update({
            where: { id: existing.id },
            data: {
              gescomName: String(gescomName),
              name: name || String(gescomName),
              ...(description !== undefined && { description: String(description) }),
              ...(isActive !== undefined && { isActive: Boolean(isActive) }),
              basePrice: numericPrice,
              stock: numericStock,
              brandId,
              productFamilyId,
              productCategoryId: productCategoryId !== undefined ? productCategoryId : null,
              gescomId: gescomId !== undefined ? Number(gescomId) : undefined,
              barcode: barcode !== undefined ? barcode : undefined,
              specs: updatedSpecs,
              lastSyncAt: new Date(),
            },
          });
          productsUpdated++;
        } else {
          const newSpecs: Record<string, any> = {};
          if (ivaPercent !== undefined) newSpecs.ivaPercent = ivaPercent;
          if (unit !== undefined) newSpecs.unit = unit;
          if (rubro !== undefined) newSpecs.rubro = rubro;
          if (subrubro !== undefined) newSpecs.subrubro = subrubro;

          await prisma.product.create({
            data: {
              sku: String(sku),
              gescomId: gescomId !== undefined ? Number(gescomId) : undefined,
              barcode: barcode !== undefined ? barcode : undefined,
              gescomName: String(gescomName),
              name: name || String(gescomName),
              slug: finalSlug,
              description: description !== undefined ? String(description) : undefined,
              isActive: isActive !== undefined ? Boolean(isActive) : true,
              basePrice: numericPrice,
              stock: numericStock,
              brandId,
              productFamilyId,
              productCategoryId: productCategoryId !== undefined ? productCategoryId : null,
              specs: newSpecs,
              lastSyncAt: new Date(),
            },
          });
          productsCreated++;
        }
      } catch (err: any) {
        errors++;
        errorDetails.push({ sku: item.sku, error: err.message || 'Error processing product' });
      }
    }

    // Clean up orphaned categories and families (those with 0 products or subcategories)
    try {
      await prisma.productCategory.deleteMany({
        where: {
          products: { none: {} }
        }
      });
      await prisma.productFamily.deleteMany({
        where: {
          id: { not: defaultFamily.id },
          products: { none: {} },
          categories: { none: {} }
        }
      });
    } catch (cleanupErr) {
      console.error('Error cleaning up orphaned categories/families:', cleanupErr);
    }

    const finishedAt = new Date();
    const syncStatus: SyncStatus = errors === 0 ? SyncStatus.SUCCESS : errors < products.length ? SyncStatus.PARTIAL : SyncStatus.FAILED;

    const syncLog = await prisma.syncLog.create({
      data: {
        startedAt,
        finishedAt,
        productsCreated,
        productsUpdated,
        brandsCreated,
        errors,
        status: syncStatus,
        errorDetails: errorDetails.length > 0 ? (errorDetails as any) : undefined,
      },
    });

    res.json({
      success: true,
      data: {
        syncLogId: syncLog.id,
        status: syncStatus,
        productsProcessed: products.length,
        productsCreated,
        productsUpdated,
        brandsCreated,
        errors,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
