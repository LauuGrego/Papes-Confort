import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse, SyncStatus, sanitizeCorruptedSpanishText } from '@papes-confort/shared';
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

    // 1. In-memory caches to prevent thousands of duplicate DB roundtrips per batch
    const brandCache = new Map<string, string>();
    brandCache.set('papes confort', defaultBrand.id);
    brandCache.set('general', defaultBrand.id);

    const familyCache = new Map<string, string>();
    familyCache.set('general', defaultFamily.id);

    const categoryCache = new Map<string, string>();
    const offerCache = new Map<string, string>();

    // 2. Pre-resolve unique brands in this batch
    const uniqueBrandNames = Array.from(
      new Set(
        products
          .map((p: any) => p.brandName && String(p.brandName).trim())
          .filter(Boolean) as string[]
      )
    );

    for (const bName of uniqueBrandNames) {
      const brandSlug = slugify(bName);
      let brand = await prisma.brand.findFirst({
        where: { OR: [{ slug: brandSlug }, { gescomName: bName }] },
      });
      if (!brand) {
        brand = await prisma.brand.create({
          data: {
            name: bName,
            slug: brandSlug || `brand-${Date.now()}`,
            gescomName: bName,
          },
        });
        brandsCreated++;
      }
      brandCache.set(bName.toLowerCase(), brand.id);
      if (brandSlug) brandCache.set(brandSlug, brand.id);
    }

    // 3. Pre-resolve unique families (rubros) in this batch
    const uniqueRubros = Array.from(
      new Set(
        products
          .map((p: any) => p.rubro && String(p.rubro).trim())
          .filter(Boolean) as string[]
      )
    );

    for (const rName of uniqueRubros) {
      const familySlug = slugify(rName);
      let family = await prisma.productFamily.findUnique({
        where: { slug: familySlug },
      });
      if (!family) {
        family = await prisma.productFamily.create({
          data: {
            name: rName,
            slug: familySlug || `family-${Date.now()}`,
          },
        });
      }
      familyCache.set(rName.toLowerCase(), family.id);
      if (familySlug) familyCache.set(familySlug, family.id);
    }

    // 4. Pre-resolve unique categories (subrubros) in this batch
    for (const item of products) {
      if (item.rubro && String(item.rubro).trim() && item.subrubro && String(item.subrubro).trim()) {
        const rName = String(item.rubro).trim();
        const sName = String(item.subrubro).trim();
        const catKey = `${rName.toLowerCase()}:::${sName.toLowerCase()}`;
        if (!categoryCache.has(catKey)) {
          const categorySlug = slugify(`rubro-${rName}-subrubro-${sName}`);
          const familyId = familyCache.get(rName.toLowerCase()) || defaultFamily.id;
          let category = await prisma.productCategory.findUnique({
            where: { slug: categorySlug },
          });
          if (!category) {
            category = await prisma.productCategory.create({
              data: {
                name: sName,
                slug: categorySlug || `category-${Date.now()}-${sName}`,
                productFamilyId: familyId,
              },
            });
          }
          categoryCache.set(catKey, category.id);
        }
      }
    }

    // 5. Pre-resolve offers in this batch
    for (const item of products) {
      const offerTitle = item.offerName || item.listDescription || item.LDes || item.listName;
      if (offerTitle && String(offerTitle).trim()) {
        const trimmed = String(offerTitle).trim();
        const key = trimmed.toLowerCase();
        if (!offerCache.has(key)) {
          const offerSlug = slugify(trimmed) || `offer-${Date.now()}`;
          let offer = await prisma.offer.findFirst({
            where: { OR: [{ slug: offerSlug }, { name: trimmed }] },
          });
          if (!offer) {
            const rawDiscount = item.discountPercent !== undefined
              ? Number(item.discountPercent)
              : (item.LPorc !== undefined ? Math.abs(Number(item.LPorc)) : 0);
            offer = await prisma.offer.create({
              data: {
                name: trimmed,
                slug: offerSlug,
                description: `Lista de ofertas: ${trimmed}`,
                discountPercent: !isNaN(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0,
                isActive: true,
              },
            });
          }
          offerCache.set(key, offer.id);
        }
      }
    }

    // 6. Pre-fetch all existing products in ONE query
    const skus = products.map((p: any) => String(p.sku)).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { sku: { in: skus } },
    });
    const existingMap = new Map(existingProducts.map((p) => [p.sku, p]));

    // 7. Process products in parallel chunks of 15
    const CHUNK_SIZE = 15;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item: any) => {
          try {
            const {
              sku,
              gescomName,
              name,
              description,
              basePrice,
              listPrice,
              discountPercent,
              productType,
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

            const sanitizedDescription = description !== undefined ? sanitizeCorruptedSpanishText(String(description)) : undefined;

            if (!sku || gescomName === undefined || basePrice === undefined || stock === undefined) {
              errors++;
              errorDetails.push({ sku: sku || 'UNKNOWN', error: 'Missing required product fields (sku, gescomName, basePrice, stock)' });
              return;
            }

            // Resolve brand from cache
            let brandId = defaultBrand.id;
            if (brandName && String(brandName).trim()) {
              const trimmedBrand = String(brandName).trim().toLowerCase();
              brandId = brandCache.get(trimmedBrand) || defaultBrand.id;
            }

            // Resolve family & category from cache
            let productFamilyId = defaultFamily.id;
            let productCategoryId: string | null = null;
            if (rubro && String(rubro).trim()) {
              const rName = String(rubro).trim().toLowerCase();
              productFamilyId = familyCache.get(rName) || defaultFamily.id;

              if (subrubro && String(subrubro).trim()) {
                const sName = String(subrubro).trim().toLowerCase();
                productCategoryId = categoryCache.get(`${rName}:::${sName}`) || null;
              }
            }

            const numericPrice = Number(basePrice);
            const numericListPrice = listPrice !== undefined && listPrice !== null ? Number(listPrice) : numericPrice;
            const numericStock = Number(stock);

            const offerTitle = item.offerName || item.listDescription || item.LDes || item.listName;
            const lPorc = item.LPorc !== undefined ? Number(item.LPorc) : undefined;

            let computedDiscount = 0;
            if (discountPercent !== undefined && discountPercent !== null) {
              computedDiscount = Number(discountPercent);
            } else if (lPorc !== undefined && !isNaN(lPorc) && lPorc !== 0) {
              computedDiscount = Math.abs(Math.round(lPorc));
            } else if (numericListPrice > numericPrice && numericListPrice > 0) {
              computedDiscount = Math.round(((numericListPrice - numericPrice) / numericListPrice) * 100);
            }

            let finalProductType = productType;
            if (!finalProductType) {
              finalProductType = (computedDiscount > 0 || Boolean(offerTitle)) ? 'OFFER' : 'NORMAL';
            }

            const baseSlug = slugify(gescomName) || `prod-${sku}`;
            const finalSlug = `${baseSlug}-${String(sku).toLowerCase()}`;

            const existing = existingMap.get(String(sku));
            let targetProductId: string;

            if (existing) {
              const currentSpecs = (existing.specs as Record<string, any>) || {};
              const updatedSpecs = {
                ...currentSpecs,
                ...(ivaPercent !== undefined && { ivaPercent }),
                ...(unit !== undefined && { unit }),
                ...(rubro !== undefined && { rubro }),
                ...(subrubro !== undefined && { subrubro }),
              };

              const updatedProduct = await prisma.product.update({
                where: { id: existing.id },
                data: {
                  gescomName: String(gescomName),
                  name: name || String(gescomName),
                  ...(sanitizedDescription !== undefined && { description: sanitizedDescription }),
                  ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                  basePrice: numericPrice,
                  listPrice: numericListPrice,
                  discountPercent: computedDiscount,
                  productType: finalProductType as any,
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
              targetProductId = updatedProduct.id;
              productsUpdated++;
            } else {
              const newSpecs: Record<string, any> = {};
              if (ivaPercent !== undefined) newSpecs.ivaPercent = ivaPercent;
              if (unit !== undefined) newSpecs.unit = unit;
              if (rubro !== undefined) newSpecs.rubro = rubro;
              if (subrubro !== undefined) newSpecs.subrubro = subrubro;

              const createdProduct = await prisma.product.create({
                data: {
                  sku: String(sku),
                  gescomId: gescomId !== undefined ? Number(gescomId) : undefined,
                  barcode: barcode !== undefined ? barcode : undefined,
                  gescomName: String(gescomName),
                  name: name || String(gescomName),
                  slug: finalSlug,
                  description: sanitizedDescription,
                  isActive: isActive !== undefined ? Boolean(isActive) : true,
                  basePrice: numericPrice,
                  listPrice: numericListPrice,
                  discountPercent: computedDiscount,
                  productType: finalProductType as any,
                  stock: numericStock,
                  brandId,
                  productFamilyId,
                  productCategoryId: productCategoryId !== undefined ? productCategoryId : null,
                  specs: newSpecs,
                  lastSyncAt: new Date(),
                },
              });
              targetProductId = createdProduct.id;
              productsCreated++;
            }

            // If list description (LDes / offerName) is provided, link product to the corresponding Offer
            if (offerTitle && String(offerTitle).trim()) {
              const offerId = offerCache.get(String(offerTitle).trim().toLowerCase());
              if (offerId) {
                await prisma.offerProduct.upsert({
                  where: {
                    offerId_productId: {
                      offerId,
                      productId: targetProductId,
                    },
                  },
                  update: {},
                  create: {
                    offerId,
                    productId: targetProductId,
                  },
                });
              }
            }
          } catch (err: any) {
            errors++;
            errorDetails.push({ sku: item.sku, error: err.message || 'Error processing product' });
          }
        })
      );
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

    // Occasional cleanup (approx 2% chance per batch) to keep DB lean without adding latency to every request
    if (Math.random() < 0.02) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await prisma.syncLog.deleteMany({
          where: { startedAt: { lt: sevenDaysAgo } },
        });
        await prisma.productCategory.deleteMany({
          where: { products: { none: {} } },
        });
        await prisma.productFamily.deleteMany({
          where: {
            id: { not: defaultFamily.id },
            products: { none: {} },
            categories: { none: {} },
          },
        });
      } catch (cleanupErr) {
        console.error('Error during occasional cleanup:', cleanupErr);
      }
    }

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
