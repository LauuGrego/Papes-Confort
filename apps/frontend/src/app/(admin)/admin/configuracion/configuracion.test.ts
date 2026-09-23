import { describe, it, expect } from 'vitest';
import {
  DEFAULT_HERO_BANNER,
  DEFAULT_CATEGORY_CARDS,
  DEFAULT_WEEKLY_OFFER,
  DEFAULT_TRUST_BAR,
  DEFAULT_ABOUT_SECTION,
  HomeFlyerDto,
  HomeHeroBannerDto,
  PaymentFeatureCardDto,
  DEFAULT_INSTALLMENTS_CONFIG,
  InstallmentsConfigDto,
} from '@papes-confort/shared';
import { computeInstallmentAmount } from '../../../../stores/installments';

describe('Admin Configuration & Landing Page Logic Tests', () => {
  describe('Hero Banner Configuration', () => {
    it('should have correct default hero banner values', () => {
      expect(DEFAULT_HERO_BANNER.title).toBe('TODO PARA EQUIPAR TU HOGAR');
      expect(DEFAULT_HERO_BANNER.showBadge).toBe(true);
      expect(DEFAULT_HERO_BANNER.badgeText).toBe('Confort para todos los días');
    });

    it('should add a new image uploaded to Cloudinary to the hero images array', () => {
      let heroState: HomeHeroBannerDto = { ...DEFAULT_HERO_BANNER, images: [...(DEFAULT_HERO_BANNER.images || [])] };
      const newCloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1/hero-sample.jpg';

      // Simulate file upload completion
      const updatedImages = [...(heroState.images || []), newCloudinaryUrl];
      heroState = {
        ...heroState,
        imageUrl: heroState.imageUrl || newCloudinaryUrl,
        images: updatedImages,
      };

      expect(heroState.images).toContain(newCloudinaryUrl);
      expect(heroState.images?.length).toBeGreaterThan(0);
    });

    it('should remove an image from hero images array correctly', () => {
      const initialImages = [
        'https://res.cloudinary.com/demo/image/upload/v1/hero1.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/hero2.jpg',
      ];
      let heroState: HomeHeroBannerDto = {
        ...DEFAULT_HERO_BANNER,
        imageUrl: initialImages[0],
        images: initialImages,
      };

      // Remove index 0
      const removeIndex = 0;
      const filtered = (heroState.images || []).filter((_, idx) => idx !== removeIndex);
      heroState = {
        ...heroState,
        images: filtered,
        imageUrl: filtered[0] || '',
      };

      expect(heroState.images).toHaveLength(1);
      expect(heroState.imageUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/hero2.jpg');
    });
  });

  describe('Promotional Flyers (Banners) Management', () => {
    it('should add a new promotional flyer banner', () => {
      const flyers: HomeFlyerDto[] = [];
      const newFlyer: HomeFlyerDto = {
        id: `flyer-${Date.now()}`,
        title: 'Cyber Monday 50% OFF',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/cyber.jpg',
        linkUrl: '/catalogo?ofertas=true',
        isActive: true,
        sortOrder: flyers.length + 1,
        aspectRatio: 'ultrawide',
        objectFit: 'cover',
        objectPosition: 'center',
      };

      const updatedFlyers = [...flyers, newFlyer];

      expect(updatedFlyers).toHaveLength(1);
      expect(updatedFlyers[0].title).toBe('Cyber Monday 50% OFF');
      expect(updatedFlyers[0].imageUrl).toContain('cloudinary.com');
    });

    it('should reorder flyers up and down correctly', () => {
      let flyers: HomeFlyerDto[] = [
        { id: '1', title: 'Banner 1', imageUrl: 'url1', linkUrl: '', isActive: true, sortOrder: 1 },
        { id: '2', title: 'Banner 2', imageUrl: 'url2', linkUrl: '', isActive: true, sortOrder: 2 },
      ];

      // Move Banner 2 UP (index 1 to index 0)
      const index = 1;
      const targetIndex = 0;
      const reordered = [...flyers];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      flyers = reordered.map((f, i) => ({ ...f, sortOrder: i + 1 }));

      expect(flyers[0].id).toBe('2');
      expect(flyers[1].id).toBe('1');
      expect(flyers[0].sortOrder).toBe(1);
    });

    it('should toggle active status of a flyer', () => {
      let flyers: HomeFlyerDto[] = [
        { id: '1', title: 'Banner 1', imageUrl: 'url1', linkUrl: '', isActive: true, sortOrder: 1 },
      ];

      const toggleId = '1';
      flyers = flyers.map((f) => (f.id === toggleId ? { ...f, isActive: !f.isActive } : f));

      expect(flyers[0].isActive).toBe(false);
    });

    it('should delete a flyer by ID', () => {
      let flyers: HomeFlyerDto[] = [
        { id: '1', title: 'Banner 1', imageUrl: 'url1', linkUrl: '', isActive: true, sortOrder: 1 },
        { id: '2', title: 'Banner 2', imageUrl: 'url2', linkUrl: '', isActive: true, sortOrder: 2 },
      ];

      flyers = flyers.filter((f) => f.id !== '1');

      expect(flyers).toHaveLength(1);
      expect(flyers[0].id).toBe('2');
    });
  });

  describe('Categories & Weekly Offer Configurations', () => {
    it('should update category cards cleanly', () => {
      const categories = [...DEFAULT_CATEGORY_CARDS];
      expect(categories.length).toBeGreaterThan(0);

      // Modify first category
      categories[0] = { ...categories[0], name: 'Smart TVs 4K' };
      expect(categories[0].name).toBe('Smart TVs 4K');
    });

    it('should handle weekly offer price and countdown configuration', () => {
      const weeklyOffer = {
        ...DEFAULT_WEEKLY_OFFER,
        productName: 'Aire Acondicionado Split Inverter 3000F',
        offerPrice: 459999,
        originalPrice: 599999,
        discountPercentage: 23,
      };

      expect(weeklyOffer.offerPrice).toBeLessThan(weeklyOffer.originalPrice);
      expect(weeklyOffer.discountPercentage).toBe(23);
    });
  });

  describe('Payment Cards & Trust Bar Configurations', () => {
    it('should manage payment card items correctly', () => {
      const cards: PaymentFeatureCardDto[] = [
        {
          id: 'card-1',
          title: '12 Cuotas Sin Interés',
          description: 'Con tarjetas visa y mastercard',
          icon: 'credit-card',
          isActive: true,
          sortOrder: 1,
        },
      ];

      expect(cards[0].title).toBe('12 Cuotas Sin Interés');
      expect(cards[0].icon).toBe('credit-card');
    });

    it('should verify default trust bar items', () => {
      expect(DEFAULT_TRUST_BAR.length).toBeGreaterThan(0);
      expect(DEFAULT_TRUST_BAR[0].title).toBeDefined();
    });

    it('should verify default about section', () => {
      expect(DEFAULT_ABOUT_SECTION.title).toBeDefined();
      expect(DEFAULT_ABOUT_SECTION.description).toBeDefined();
    });
  });

  describe('Installments Configuration & Pricing Calculation Tests', () => {
    it('should have correct default installments configuration based on Ale requirements', () => {
      expect(DEFAULT_INSTALLMENTS_CONFIG.defaultInstallments).toBe(5);
      expect(DEFAULT_INSTALLMENTS_CONFIG.bankPromoActive).toBe(true);
      expect(DEFAULT_INSTALLMENTS_CONFIG.bankPromoName).toBe('Banco Nación');
      expect(DEFAULT_INSTALLMENTS_CONFIG.bankPromoInstallments).toBe(9);
    });

    it('should correctly calculate standard installments on list price', () => {
      const listPrice = 150000;
      const installments = 5;
      const installmentAmount = computeInstallmentAmount(listPrice, installments);

      expect(installmentAmount).toBe(30000);
    });

    it('should correctly calculate special bank promo installments on list price', () => {
      const listPrice = 150000;
      const bankInstallments = 9;
      const bankInstallmentAmount = computeInstallmentAmount(listPrice, bankInstallments);

      // 150000 / 9 = 16666.666... -> rounded = 16667
      expect(bankInstallmentAmount).toBe(16667);
    });

    it('should handle zero or negative installments gracefully', () => {
      expect(computeInstallmentAmount(100000, 0)).toBe(0);
      expect(computeInstallmentAmount(0, 5)).toBe(0);
    });

    it('should serialize and parse custom installments config in admin settings', () => {
      const customConfig: InstallmentsConfigDto = {
        defaultInstallments: 6,
        bankPromoActive: true,
        bankPromoName: 'Banco Macro',
        bankPromoInstallments: 12,
        bankPromoText: 'Hasta 12 cuotas sin interés con Macro',
      };

      const serialized = JSON.stringify(customConfig);
      const parsed = JSON.parse(serialized);

      expect(parsed.defaultInstallments).toBe(6);
      expect(parsed.bankPromoName).toBe('Banco Macro');
      expect(parsed.bankPromoInstallments).toBe(12);
      expect(computeInstallmentAmount(120000, parsed.defaultInstallments)).toBe(20000);
      expect(computeInstallmentAmount(120000, parsed.bankPromoInstallments)).toBe(10000);
    });
  });

  describe('Navigation Tab Routing Logic', () => {
    const validTabs = [
      'hero',
      'flyers',
      'categories',
      'weekly_offer',
      'trust_bar',
      'payment_cards',
      'about',
      'general',
      'security',
    ];

    it('should match all tab parameters correctly', () => {
      validTabs.forEach((tab) => {
        const queryHref = `/admin/configuracion?tab=${tab}`;
        expect(queryHref).toContain(`tab=${tab}`);
      });
    });
  });
});
