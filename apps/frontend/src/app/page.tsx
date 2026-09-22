'use client';

import React, { useState, useEffect } from 'react';
import TrustBar from '../components/TrustBar';
import EditorialHero from '../components/EditorialHero';
import FlyersCarousel from '../components/FlyersCarousel';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedProducts from '../components/FeaturedProducts';
import WeeklyOffer from '../components/WeeklyOffer';
import BrandWall from '../components/BrandWall';
import PaymentMethods from '../components/PaymentMethods';
import AboutSection from '../components/AboutSection';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import {
  HomeHeroBannerDto,
  DEFAULT_HERO_BANNER,
  HomeCategoryCardDto,
  DEFAULT_CATEGORY_CARDS,
  HomeWeeklyOfferDto,
  DEFAULT_WEEKLY_OFFER,
  HomeTrustBarItemDto,
  DEFAULT_TRUST_BAR,
  HomeAboutDto,
  DEFAULT_ABOUT_SECTION,
} from '@papes-confort/shared';
import { fetchApi } from '../lib/api';

export default function HomePage() {
  const [heroBanner, setHeroBanner] = useState<HomeHeroBannerDto>(DEFAULT_HERO_BANNER);
  const [categoryCards, setCategoryCards] = useState<HomeCategoryCardDto[]>(DEFAULT_CATEGORY_CARDS);
  const [weeklyOffer, setWeeklyOffer] = useState<HomeWeeklyOfferDto>(DEFAULT_WEEKLY_OFFER);
  const [trustBarItems, setTrustBarItems] = useState<HomeTrustBarItemDto[]>(DEFAULT_TRUST_BAR);
  const [aboutConfig, setAboutConfig] = useState<HomeAboutDto>(DEFAULT_ABOUT_SECTION);

  useEffect(() => {
    async function loadLandingSettings() {
      try {
        const res = await fetchApi<Record<string, string>>('/api/settings/public');
        if (res.success && res.data) {
          // 1. Hero Banner
          if (res.data.home_hero_banner) {
            try {
              const parsed = JSON.parse(res.data.home_hero_banner);
              if (parsed && typeof parsed === 'object') {
                setHeroBanner((prev) => ({ ...prev, ...parsed }));
              }
            } catch (e) {
              console.error('Error al parsear home_hero_banner:', e);
            }
          }

          // 2. Category Cards
          if (res.data.home_category_cards) {
            try {
              const parsed = JSON.parse(res.data.home_category_cards);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCategoryCards(parsed);
              }
            } catch (e) {
              console.error('Error al parsear home_category_cards:', e);
            }
          }

          // 3. Weekly Offer
          if (res.data.home_weekly_offer) {
            try {
              const parsed = JSON.parse(res.data.home_weekly_offer);
              if (parsed && typeof parsed === 'object') {
                setWeeklyOffer((prev) => ({ ...prev, ...parsed }));
              }
            } catch (e) {
              console.error('Error al parsear home_weekly_offer:', e);
            }
          }

          // 4. Trust Bar
          if (res.data.home_trust_bar) {
            try {
              const parsed = JSON.parse(res.data.home_trust_bar);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTrustBarItems(parsed);
              }
            } catch (e) {
              console.error('Error al parsear home_trust_bar:', e);
            }
          }

          // 5. About Section
          if (res.data.home_about) {
            try {
              const parsed = JSON.parse(res.data.home_about);
              if (parsed && typeof parsed === 'object') {
                setAboutConfig((prev) => ({ ...prev, ...parsed }));
              }
            } catch (e) {
              console.error('Error al parsear home_about:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar configuraciones de la landing:', err);
      }
    }
    loadLandingSettings();
  }, []);

  return (
    <div className="w-full bg-slate-50/50 pb-8">
      {/* 1. Barra de beneficios */}
      <TrustBar items={trustBarItems} />

      {/* 2. Hero Editorial */}
      <EditorialHero bannerConfig={heroBanner} />

      {/* 3. Carrusel de Banners Promocionales (Flyers) */}
      <FlyersCarousel />

      {/* 4. Comprá por categoría */}
      <CategoryGrid cards={categoryCards} />

      {/* 5. Productos destacados */}
      <FeaturedProducts />

      {/* 6. Bloque de Ofertas de la Semana */}
      <WeeklyOffer offerConfig={weeklyOffer} />

      {/* 7. Muro de Marcas Oficiales */}
      <BrandWall />

      {/* 8. Medios de pago y financiación */}
      <PaymentMethods />

      {/* 9. Bloque Institucional: Historia, Edificio y Confianza */}
      <AboutSection aboutConfig={aboutConfig} />

      {/* 10. Botón flotante de contacto rápido por WhatsApp */}
      <FloatingWhatsApp />
    </div>
  );
}
