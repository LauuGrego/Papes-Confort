import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { UserRole, ApiResponse } from '@papes-confort/shared';
import {
  getSubscribers,
  toggleSubscriberStatus,
  getCampaigns,
  saveCampaign,
  deleteCampaign,
  sendNewsletter,
  getSendLogs,
} from '../../services/newsletter.service';

const router = Router();

// Todas las rutas de administración de newsletter y suscriptores requieren rol de Administrador
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

/**
 * GET /api/admin/newsletter/subscribers
 * Lista paginada y filtrada de usuarios y suscriptores
 */
router.get('/subscribers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, page, pageSize } = req.query;

    const result = await getSubscribers({
      search: typeof search === 'string' ? search : undefined,
      status: (status as 'all' | 'subscribed' | 'unsubscribed') || 'subscribed',
      page: page ? parseInt(page as string, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
    });

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/newsletter/subscribers/:id
 * Modifica el estado de suscripción de un cliente
 */
router.patch('/subscribers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { marketingOptIn } = req.body;

    if (typeof marketingOptIn !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'El campo marketingOptIn debe ser un valor booleano.',
      } as ApiResponse);
      return;
    }

    const updated = await toggleSubscriberStatus(id, marketingOptIn);

    res.json({
      success: true,
      data: updated,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/newsletter/campaigns
 * Lista de todas las campañas configuradas
 */
router.get('/campaigns', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const campaigns = await getCampaigns();
    res.json({
      success: true,
      data: campaigns,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/newsletter/campaigns
 * Crea o actualiza una campaña de novedades
 */
router.post('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = await saveCampaign(req.body);
    res.json({
      success: true,
      data: saved,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/newsletter/campaigns/:id
 * Elimina una campaña
 */
router.delete('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await deleteCampaign(id);
    res.json({
      success: true,
      data: { id },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/newsletter/send
 * Envía una notificación por email (de prueba o a todos los suscriptores)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const sentBy = user?.email || user?.name || 'Administrador';

    const result = await sendNewsletter(req.body, sentBy);

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Error al enviar la notificación.',
    } as ApiResponse);
  }
});

/**
 * GET /api/admin/newsletter/logs
 * Obtiene el historial de envíos
 */
router.get('/logs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getSendLogs();
    res.json({
      success: true,
      data: logs,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
