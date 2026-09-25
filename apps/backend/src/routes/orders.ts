import { Router, Request, Response, NextFunction } from 'express';
import { requireCustomer } from '../middleware/auth';
import {
  ApiResponse,
  CreateOrderPayload,
  CreateOrderResponseDto,
  OrderDetailDto,
  PaymentMethod,
  PaymentResult,
  ShippingType,
  UserPayload,
} from '@papes-confort/shared';
import { prisma } from '@papes-confort/database';
import { createOrderFromCart, getOrderForCustomer } from '../services/order.service';

const router = Router();

// Todas las rutas de órdenes requieren que el cliente esté autenticado
router.use(requireCustomer);

// POST /api/orders
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as UserPayload;
    const body = req.body as CreateOrderPayload;

    // Validación básica de campos requeridos
    if (!body.shippingType || !Object.values(ShippingType).includes(body.shippingType)) {
      res.status(400).json({ success: false, error: 'Tipo de envío inválido o no especificado.' });
      return;
    }

    if (!body.paymentMethod || !Object.values(PaymentMethod).includes(body.paymentMethod)) {
      res.status(400).json({ success: false, error: 'Método de pago inválido o no especificado.' });
      return;
    }

    if (!body.shippingAddress || !body.shippingCity || !body.shippingPostalCode) {
      res.status(400).json({ success: false, error: 'Los datos de domicilio (dirección, ciudad, código postal) son obligatorios.' });
      return;
    }

    // Obtener entidad Customer completa
    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
    });

    if (!customer) {
      res.status(404).json({ success: false, error: 'Cliente no encontrado en la base de datos.' });
      return;
    }

    // Obtener sessionId desde cookies o cabecera
    const sessionId = (req.cookies && req.cookies['papes_cart']) || req.sessionId || '';
    const originUrl = req.get('origin') || req.get('referer');

    const result = await createOrderFromCart(customer, sessionId, body, originUrl);

    res.status(201).json({
      success: true,
      data: {
        order: result.order,
        paymentUrl: result.paymentUrl,
        bankAccount: result.bankAccount,
      },
    } as ApiResponse<CreateOrderResponseDto>);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/orders/:orderNumber
router.get('/:orderNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as UserPayload;
    const { orderNumber } = req.params;

    const order = await getOrderForCustomer(orderNumber, user.id, user.email);

    res.json({
      success: true,
      data: order,
    } as ApiResponse<OrderDetailDto>);
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/orders/:orderNumber/status (Polling para /pedido/resultado)
router.get('/:orderNumber/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as UserPayload;
    const { orderNumber } = req.params;

    const order = await getOrderForCustomer(orderNumber, user.id, user.email);

    let paymentResult: PaymentResult;
    if (order.status === 'PAID') {
      paymentResult = PaymentResult.APPROVED;
    } else if (order.status === 'CANCELLED') {
      paymentResult = PaymentResult.REJECTED;
    } else {
      paymentResult = PaymentResult.PENDING;
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentResult,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

export default router;
