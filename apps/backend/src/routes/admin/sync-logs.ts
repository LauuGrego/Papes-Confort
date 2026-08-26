import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '@papes-confort/database';
import { ApiResponse } from '@papes-confort/shared';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.syncLog.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.syncLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deleted = await prisma.syncLog.deleteMany({
      where: {
        startedAt: {
          lt: cutoffDate,
        },
      },
    });

    res.json({
      success: true,
      data: {
        deletedCount: deleted.count,
        cutoffDate,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
