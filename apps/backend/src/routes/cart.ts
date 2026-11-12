import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { cartSession } from '../middleware/cartSession';
import {
  getCartDto,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} from '../services/cart.service';
import { ApiResponse, UserPayload } from '@papes-confort/shared';
import { validateBody } from '../middleware/validate';
import { addCartItemSchema, updateCartItemSchema } from '../schemas';

const router = Router();

function optionalCustomerAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  passport.authenticate('jwt', { session: false }, (_err: any, user: UserPayload | false) => {
    if (user && user.type === 'customer') {
      req.user = user;
    }
    next();
  })(req, res, next);
}

function getCustomerId(req: Request): string | null {
  const user = req.user as UserPayload | undefined;
  return user && user.type === 'customer' ? user.id : null;
}

// Todas las rutas del carrito usan el middleware para inicializar/recuperar sesión y cliente opcional
router.use(cartSession);
router.use(optionalCustomerAuth);

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const sessionId = req.sessionId!;
    const cart = await getCartDto(sessionId, getCustomerId(req));
    res.json({
      success: true,
      data: cart,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items
router.post('/items', validateBody(addCartItemSchema), async (req, res) => {
  try {
    const sessionId = req.sessionId!;
    const { productId, quantity } = req.body;

    const cart = await addItem(sessionId, productId, quantity, getCustomerId(req));
    res.json({
      success: true,
      data: cart,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al agregar item al carrito',
    } as ApiResponse);
  }
});

// PATCH /api/cart/items/:productId
router.patch('/items/:productId', validateBody(updateCartItemSchema), async (req, res) => {
  try {
    const sessionId = req.sessionId!;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await updateQuantity(sessionId, productId, quantity, getCustomerId(req));
    res.json({
      success: true,
      data: cart,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar cantidad del item',
    } as ApiResponse);
  }
});

// DELETE /api/cart
router.delete('/', async (req, res, next) => {
  try {
    const sessionId = req.sessionId!;
    const cart = await clearCart(sessionId, getCustomerId(req));
    res.json({
      success: true,
      data: cart,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', async (req, res, next) => {
  try {
    const sessionId = req.sessionId!;
    const { productId } = req.params;

    const cart = await removeItem(sessionId, productId, getCustomerId(req));
    res.json({
      success: true,
      data: cart,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
