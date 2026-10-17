import { Router } from 'express';
import { prisma } from '@papes-confort/database';
import { ApiResponse, DEFAULT_SETTINGS } from '@papes-confort/shared';

const router = Router();

// GET /api/settings/public
router.get('/public', async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'whatsapp_number',
            'business_hours',
            'home_flyers',
            'home_payment_cards',
            'home_hero_banner',
            'home_category_cards',
            'home_weekly_offer',
            'home_trust_bar',
            'home_about',
            'home_outlet_section',
            'installments_config',
            'local_shipping_cost',
            'remote_shipping_note',
            'bank_transfer_instructions',
            'transfer_expiration_hours',
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {
      whatsapp_number: '',
      business_hours: DEFAULT_SETTINGS.business_hours,
      home_flyers: '',
      home_payment_cards: '',
      home_hero_banner: '',
      home_category_cards: '',
      home_weekly_offer: '',
      home_trust_bar: '',
      home_about: '',
      home_outlet_section: '',
      installments_config: '',
      local_shipping_cost: String(DEFAULT_SETTINGS.local_shipping_cost),
      remote_shipping_note: DEFAULT_SETTINGS.remote_shipping_note,
      bank_transfer_instructions: DEFAULT_SETTINGS.bank_transfer_instructions,
      transfer_expiration_hours: String(DEFAULT_SETTINGS.transfer_expiration_hours),
    };

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsMap,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
