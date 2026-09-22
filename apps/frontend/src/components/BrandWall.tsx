'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface Brand {
  id: string;
  name: string;
  slug?: string;
  productCount?: number;
}

const FALLBACK_BRANDS: Brand[] = [
  { id: 'b-samsung', name: 'Samsung', productCount: 14 },
  { id: 'b-drean', name: 'Drean', productCount: 12 },
  { id: 'b-whirlpool', name: 'Whirlpool', productCount: 10 },
  { id: 'b-philco', name: 'Philco', productCount: 9 },
  { id: 'b-lg', name: 'LG', productCount: 8 },
  { id: 'b-patrick', name: 'Patrick', productCount: 7 },
  { id: 'b-philips', name: 'Philips', productCount: 6 },
  { id: 'b-longvie', name: 'Longvie', productCount: 5 },
  { id: 'b-liliana', name: 'Liliana', productCount: 8 },
  { id: 'b-peabody', name: 'Peabody', productCount: 6 },
  { id: 'b-gafa', name: 'Gafa', productCount: 5 },
  { id: 'b-midea', name: 'Midea', productCount: 4 },
];

export default function BrandWall() {
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);

  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await fetchApi<Brand[]>('/api/brands', { cache: 'no-store' });
        if (res.success && res.data && res.data.length > 0) {
          // Sort brands with most products first or alphabetically
          const sorted = [...res.data].sort(
            (a, b) => (b.productCount || 0) - (a.productCount || 0)
          );
          setBrands(sorted);
        }
      } catch (err) {
        console.error('Error al cargar marcas:', err);
      }
    }
    loadBrands();
  }, []);

  // Display top 12 brands
  const displayedBrands = brands.slice(0, 12);

  return (
    <section id="marcas" className="w-full bg-slate-50/60 py-8 sm:py-10 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Encabezado editorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 sm:mb-6 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-red" />
              <span>Garantía y Respaldo Oficial</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-black tracking-tight">
              Las marcas que elegís
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl">
              Trabajamos con los fabricantes y distribuidores líderes del país para garantizarte calidad, repuestos originales y soporte post-venta.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:text-brand-red-dark transition-colors group self-start md:self-auto cursor-pointer"
          >
            <span>Ver todas en el catálogo</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grilla de Marcas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayedBrands.map((brand) => {
            // If real ID from DB (UUID), link by brandId; else search by name
            const isDbId = brand.id && !brand.id.startsWith('b-');
            const targetUrl = isDbId
              ? `/catalogo?brandId=${brand.id}`
              : `/catalogo?search=${encodeURIComponent(brand.name)}`;

            return (
              <Link
                key={brand.id || brand.name}
                href={targetUrl}
                className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-red/40 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center min-h-[96px]"
              >
                {/* Brand Name Typography Emblem */}
                <span className="font-display font-extrabold text-base sm:text-lg text-slate-700 group-hover:text-brand-red transition-colors tracking-tight">
                  {brand.name}
                </span>

                {/* Subtitle / Product count */}
                {brand.productCount !== undefined && brand.productCount > 0 ? (
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 mt-1 transition-colors">
                    {brand.productCount} {brand.productCount === 1 ? 'producto' : 'productos'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 mt-1 transition-colors">
                    Línea oficial
                  </span>
                )}

                {/* Subtle hover indicator dot */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

        {/* Banner micro-promocional inferior */}
        <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/5 border border-brand-red/10 text-brand-red">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">¿Buscás una marca o modelo específico?</h3>
              <p className="text-xs text-slate-500">Filtrá fácilmente en nuestro catálogo o consultanos por disponibilidad inmediata.</p>
            </div>
          </div>
          <Link
            href="/catalogo"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-brand-red text-white text-xs font-bold px-5 py-2.5 transition-colors duration-200 cursor-pointer"
          >
            <span>Explorar catálogo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
