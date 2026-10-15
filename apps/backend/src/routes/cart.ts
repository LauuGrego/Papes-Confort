import { Router } from 'express';
import { cartSession } from '../middleware/cartSession';
import {
  getCartDto,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} from '../services/cart.service';
import { ApiResponse } from '@papes-confort/shared';
import { validateBody } from '../middleware/validate';
import { addCartItemSchema, updateCartItemSchema } from '../schemas';

const router = Router();

// Todas las rutas del carrito usan el middleware para inicializar/recuperar sesión
router.use(cartSession);

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const sessionId = req.sessionId!;
    const cart = await getCartDto(sessionId);
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

    const cart = await addItem(sessionId, productId, quantity);
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

    const cart = await updateQuantity(sessionId, productId, quantity);
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
    const cart = await clearCart(sessionId);
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

    const cart = await removeItem(sessionId, productId);
    res.json({
      success: true,
      data: cart,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
