'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin } from 'lucide-react';
import PaymentMethods from '../components/PaymentMethods';
import FlyersCarousel from '../components/FlyersCarousel';
import { HomeHeroBannerDto, DEFAULT_HERO_BANNER } from '@papes-confort/shared';
import { fetchApi } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [heroBanner, setHeroBanner] = useState<HomeHeroBannerDto>(DEFAULT_HERO_BANNER);

  useEffect(() => {
    async function loadHeroBanner() {
      try {
        const res = await fetchApi<{ home_hero_banner?: string }>('/api/settings/public');
        if (res.success && res.data?.home_hero_banner) {
          try {
            const parsed = JSON.parse(res.data.home_hero_banner);
            if (parsed && typeof parsed === 'object') {
              setHeroBanner((prev: HomeHeroBannerDto) => ({ ...prev, ...parsed }));
            }
          } catch (e) {
            console.error('Error al parsear home_hero_banner:', e);
          }
        }
      } catch (err) {
        console.error('Error al cargar banner de portada:', err);
      }
    }
    loadHeroBanner();
  }, []);

  const handleQuickSearch = (term: string) => {
    router.push(`/catalogo?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="w-full bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 text-brand-black pt-6 sm:pt-8 pb-12 md:pb-20 border-b border-slate-200">
        {/* Promotional Flyers Rotative Carousel */}
        <FlyersCarousel />

        <div className="mx-auto max-w-7xl px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mt-6 md:mt-8">
          {/* Hero left content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-4 py-1.5 text-xs font-semibold text-brand-red uppercase tracking-wider">
              Servicio y calidad asegurados
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-brand-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-red-dark">Llevamos el confort</span> que tu hogar merece
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              El asesoramiento personalizado y el servicio posventa que nos caracteriza
            </p>

            {/* Popular search terms tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="font-semibold text-slate-400">Búsquedas populares:</span>
              {['Colchones', 'Heladeras', 'Televisores', 'Lavarropas', 'Aires'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickSearch(term)}
                  className="bg-white/80 border border-slate-200/80 hover:border-brand-red/30 hover:bg-brand-red/5 hover:text-brand-red px-3 py-1 rounded-xl transition-all cursor-pointer text-slate-600 font-medium shadow-2xs"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="pt-3 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-semibold text-white hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.25)] hover:shadow-[0_6px_25px_rgba(228,20,20,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 group"
              >
                Explorar catálogo completo
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero right content (Main Hero Banner) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Soft ambient glow behind building image */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-red/10 via-slate-200/50 to-transparent blur-2xl rounded-full opacity-70" />

              {/* Integrated building image with smooth blend */}
              <div className="relative overflow-hidden rounded-3xl shadow-lg border border-slate-200/60 bg-gradient-to-b from-slate-100 to-white">
                {heroBanner.linkUrl ? (
                  <Link href={heroBanner.linkUrl} className="block w-full h-full group">
                    <img
                      src={heroBanner.imageUrl || '/images/edificio.webp'}
                      alt={heroBanner.title || 'Edificio Papes Confort en Basavilbaso'}
                      style={{
                        objectFit: heroBanner.objectFit || 'cover',
                        objectPosition: `${heroBanner.objectPositionX ?? 50}% ${heroBanner.objectPositionY ?? 50}%`,
                      }}
                      className="w-full h-auto max-h-[460px] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </Link>
                ) : (
                  <img
                    src={heroBanner.imageUrl || '/images/edificio.webp'}
                    alt={heroBanner.title || 'Edificio Papes Confort en Basavilbaso'}
                    style={{
                      objectFit: heroBanner.objectFit || 'cover',
                      objectPosition: `${heroBanner.objectPositionX ?? 50}% ${heroBanner.objectPositionY ?? 50}%`,
                    }}
                    className="w-full h-auto max-h-[460px] transition-transform duration-700 ease-out hover:scale-[1.02]"
                  />
                )}
                
                {/* Soft bottom gradient overlay for seamless background transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 via-transparent to-transparent pointer-events-none" />

                {/* Floating subtle location pill */}
                {heroBanner.showBadge !== false && (
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-2 pointer-events-none">
                    <MapPin className="h-4 w-4 text-brand-red shrink-0" />
                    <span className="text-xs font-bold text-brand-black tracking-wide">
                      {heroBanner.badgeText || 'Basavilbaso, Entre Ríos'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods & Financing Section */}
      <PaymentMethods />
    </div>
  );
}

