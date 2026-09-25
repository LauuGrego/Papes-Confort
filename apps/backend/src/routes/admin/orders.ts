import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  ApiResponse,
  AdminOrderFilters,
  ConfirmTransferPayload,
  OrderDetailDto,
  OrderStatus,
  PaymentMethod,
  UserPayload,
  UserRole,
} from '@papes-confort/shared';
import { prisma } from '@papes-confort/database';
import {
  getAdminOrders,
  confirmTransfer,
  updateAdminOrderStatus,
  mapOrderToDetailDto,
} from '../../services/order.service';

const router = Router();

// Todas las rutas de administración de órdenes requieren rol de Administrador
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

// GET /api/admin/orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, paymentMethod, search, page, pageSize } = req.query;

    const filters: AdminOrderFilters = {
      status: status ? (status as OrderStatus) : undefined,
      paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : 10,
    };

    const result = await getAdminOrders(filters);

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        confirmedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              include: {
                brand: true,
                images: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Orden no encontrada' });
      return;
    }

    res.json({
      success: true,
      data: mapOrderToDetailDto(order, order.items, order.bankAccount),
    } as ApiResponse<OrderDetailDto>);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as UserPayload;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ success: false, error: 'Estado de orden inválido.' });
      return;
    }

    const updated = await updateAdminOrderStatus(id, status as OrderStatus, user.id);

    res.json({
      success: true,
      data: updated,
    } as ApiResponse<OrderDetailDto>);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/admin/orders/:id/confirm-transfer
router.post('/:id/confirm-transfer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as UserPayload;
    const { id } = req.params;
    const { bankAccountId } = req.body as ConfirmTransferPayload;

    if (!bankAccountId) {
      res.status(400).json({ success: false, error: 'Debe especificar el bankAccountId de la cuenta donde se recibió el pago.' });
      return;
    }

    const updated = await confirmTransfer(id, user.id, bankAccountId);

    res.json({
      success: true,
      data: updated,
      message: 'Transferencia confirmada y orden marcada como PAGADA con éxito.',
    } as ApiResponse<OrderDetailDto>);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
