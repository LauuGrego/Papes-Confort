'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HomeCategoryCardDto, DEFAULT_CATEGORY_CARDS } from '@papes-confort/shared';

interface CategoryGridProps {
  cards?: HomeCategoryCardDto[];
}

export default function CategoryGrid({ cards }: CategoryGridProps) {
  const activeCards = (cards && cards.length > 0 ? cards : DEFAULT_CATEGORY_CARDS)
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <section className="w-full bg-white py-8 sm:py-10 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Encabezado editorial */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
              Explorá por rubro
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-black tracking-tight mt-1">
              Comprá por categoría
            </h2>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-brand-red transition-colors group cursor-pointer"
          >
            <span>Ver todas las categorías</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grilla visual de 8 tarjetas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
          {activeCards.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative flex flex-col justify-end overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 bg-slate-900 aspect-[4/5] sm:aspect-[3/4] shadow-sm hover:shadow-xl hover:border-brand-red/30 transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Fotografía de producto real desde Cloudinary */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/hero_home_ambience.jpg';
                }}
              />

              {/* Degradado oscuro inferior para contraste impecable */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              {/* Contenido textual */}
              <div className="relative z-10 p-3.5 sm:p-5 flex flex-col justify-end">
                <span className="font-display text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-red-200 transition-colors">
                  {cat.name}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 mt-0.5 opacity-90 font-light">
                  {cat.description}
                </span>

                <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-white/90 group-hover:text-white transition-colors">
                  <span>Ver productos</span>
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-brand-red" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
