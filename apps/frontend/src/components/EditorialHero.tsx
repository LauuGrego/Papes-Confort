'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { HomeHeroBannerDto, DEFAULT_HERO_BANNER } from '@papes-confort/shared';

interface EditorialHeroProps {
  bannerConfig?: HomeHeroBannerDto;
}

export default function EditorialHero({ bannerConfig }: EditorialHeroProps) {
  const router = useRouter();

  const handleQuickSearch = (term: string) => {
    router.push(`/catalogo?search=${encodeURIComponent(term)}`);
  };

  const config = bannerConfig ? { ...DEFAULT_HERO_BANNER, ...bannerConfig } : DEFAULT_HERO_BANNER;

  const title = config.title || DEFAULT_HERO_BANNER.title;
  const subtitle = config.subtitle || DEFAULT_HERO_BANNER.subtitle;
  const badgeText = config.badgeText || DEFAULT_HERO_BANNER.badgeText;
  const searchTags = config.searchTags && config.searchTags.length > 0 ? config.searchTags : DEFAULT_HERO_BANNER.searchTags || [];
  const primaryBtnText = config.primaryBtnText || 'Ver Catálogo';
  const primaryBtnUrl = config.primaryBtnUrl || '/catalogo';
  const secondaryBtnText = config.secondaryBtnText || 'Ver Ofertas';
  const secondaryBtnUrl =
    !config.secondaryBtnUrl || config.secondaryBtnUrl === '#oferta-semanal'
      ? '/catalogo?offer=all'
      : config.secondaryBtnUrl;

  const objectFit = config.objectFit || 'cover';
  const objectPosition = `${config.objectPositionX ?? 50}% ${config.objectPositionY ?? 50}%`;

  const imageList = (config.images && config.images.length > 0
    ? config.images
    : [config.imageUrl || DEFAULT_HERO_BANNER.imageUrl]
  ).filter((img) => img && img.trim() !== '');

  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    if (imageList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [imageList.length]);

  const activeImageUrl = imageList[currentImgIndex] || DEFAULT_HERO_BANNER.imageUrl;

  const handlePrev = () => {
    setCurrentImgIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImgIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white text-brand-black py-4 sm:py-5 lg:py-6 border-b border-slate-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
          {/* Columna Izquierda: Mensaje y llamadas a la acción */}
          <div className="lg:col-span-6 space-y-3.5 sm:space-y-4 text-left">
            {badgeText && (
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-3 py-0.5 text-[11px] font-bold text-brand-red uppercase tracking-wider">
                <span>{badgeText}</span>
              </div>
            )}

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-brand-black">
              {title}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-snug max-w-xl font-normal">
              {subtitle}
            </p>

            {/* Accesos directos / Búsquedas populares */}
            {searchTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                <span className="font-semibold text-slate-400 text-[11px]">Tendencias:</span>
                {searchTags.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="bg-white border border-slate-200 hover:border-brand-red/40 hover:bg-brand-red/5 hover:text-brand-red px-2.5 py-0.5 rounded-xl transition-all cursor-pointer text-slate-600 font-medium text-[11px] shadow-2xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* Botones de acción principales */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <Link
                href={primaryBtnUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-red-dark shadow-[0_4px_16px_rgba(228,20,20,0.25)] hover:shadow-[0_6px_22px_rgba(228,20,20,0.35)] transition-all duration-200 transform hover:-translate-y-0.5 group"
              >
                <span>{primaryBtnText}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={secondaryBtnUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-brand-red border border-slate-200 hover:border-brand-red/30 hover:bg-slate-50 transition-all duration-200 shadow-2xs cursor-pointer"
              >
                <Tag className="h-4 w-4 text-brand-red" />
                <span>{secondaryBtnText}</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Imagen editorial o carrusel de ambiente */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-xl lg:max-w-none">
              {/* Resplandor ambiental suave */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-brand-red/10 via-slate-200/40 to-transparent blur-2xl rounded-3xl opacity-70" />

              {/* Contenedor de imagen */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100 shadow-lg group aspect-[16/10] max-h-[340px] sm:max-h-[380px]">
                <img
                  key={activeImageUrl}
                  src={activeImageUrl}
                  alt={title || 'Equipamiento y confort para el hogar en Papes Confort'}
                  style={{ objectFit, objectPosition }}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-103 animate-in fade-in duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_HERO_BANNER.imageUrl;
                  }}
                />

                {/* Controles de carrusel multi-imagen */}
                {imageList.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-800 shadow-md border border-slate-200/80 hover:bg-white transition-all z-20"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-700" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-800 shadow-md border border-slate-200/80 hover:bg-white transition-all z-20"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-700" />
                    </button>

                    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 z-20">
                      {imageList.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImgIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentImgIndex ? 'bg-brand-red w-4' : 'bg-white/70 w-1.5'
                          }`}
                          aria-label={`Ver imagen ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Badge superpuesto sutil */}
                {config.showBadge && (
                  <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2 border border-slate-200/60 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-brand-red animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">
                        {badgeText}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
