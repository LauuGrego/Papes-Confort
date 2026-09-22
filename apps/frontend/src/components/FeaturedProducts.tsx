'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductDto, PaginatedResponse } from '@papes-confort/shared';
import { fetchApi } from '../lib/api';
import ProductCard from './products/ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        setLoading(true);
        // Fetch up to 8 products for the featured section
        const res = await fetchApi<PaginatedResponse<ProductDto>>('/api/products?limit=8');
        if (res.success && res.data?.items) {
          setProducts(res.data.items);
        }
      } catch (err) {
        console.error('Error al cargar productos destacados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeaturedProducts();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-slate-50/50 py-8 sm:py-10 border-b border-slate-200/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Encabezado de sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-red mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Selección recomendada</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-black tracking-tight">
              Productos destacados
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/catalogo"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-brand-red transition-colors mr-2 cursor-pointer"
            >
              Ver todos
            </Link>

            {/* Controles de navegación de carrusel */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-all shadow-2xs cursor-pointer"
                aria-label="Ver productos anteriores"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-all shadow-2xs cursor-pointer"
                aria-label="Ver productos siguientes"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grilla / Carrusel responsive */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl md:rounded-3xl bg-white border border-slate-200/60 p-4 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-xl mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-4/5" />
                  <div className="h-5 bg-slate-100 rounded w-1/2 pt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            {products.map((prod) => (
              <div
                key={prod.id}
                className="min-w-[240px] sm:min-w-[270px] lg:min-w-[285px] max-w-[290px] snap-start shrink-0"
              >
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
