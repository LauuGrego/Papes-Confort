'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { HomeWeeklyOfferDto, DEFAULT_WEEKLY_OFFER } from '@papes-confort/shared';

interface WeeklyOfferProps {
  offerConfig?: HomeWeeklyOfferDto;
}

export default function WeeklyOffer({ offerConfig }: WeeklyOfferProps) {
  const config = offerConfig ? { ...DEFAULT_WEEKLY_OFFER, ...offerConfig } : DEFAULT_WEEKLY_OFFER;

  if (config.isActive === false) {
    return null;
  }

  return (
    <section id="oferta-semanal" className="w-full bg-slate-900 text-white py-8 sm:py-10 overflow-hidden relative border-b border-slate-800">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-red/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-80 h-80 bg-slate-700/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna Izquierda: Mensaje comercial */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/30 bg-brand-red/10 px-3.5 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5" />
              <span>{config.badge}</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {config.title}
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl font-light">
              {config.subtitle}
            </p>

            {/* Micro beneficios en pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <CreditCard className="h-4 w-4 text-brand-red shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{config.cuotasText}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <Tag className="h-4 w-4 text-brand-red shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{config.cashDiscountText}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <ShieldCheck className="h-4 w-4 text-brand-red shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{config.warrantyText}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Link
                href={config.mainCtaUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-bold text-white hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.35)] hover:shadow-[0_6px_25px_rgba(228,20,20,0.45)] transition-all duration-200 transform hover:-translate-y-0.5 group cursor-pointer"
              >
                <span>{config.mainCtaText}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Spotlight Card de Producto Destacado */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 p-5 sm:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-white/10 overflow-hidden mb-5 flex items-center justify-center">
                <img
                  src={config.imageUrl}
                  alt={config.productHeadline}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/categories/climatizacion.jpg';
                  }}
                />
                {/* Badge de descuento */}
                <div className="absolute top-3 right-3 z-10 bg-brand-red text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-white/20">
                  Promoción Especial
                </div>
              </div>

              <div className="space-y-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {config.tagCategory}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                  {config.productHeadline}
                </h3>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium">Financiación disponible</span>
                    <span className="text-base sm:text-lg font-extrabold text-white">
                      {config.cuotasText}
                    </span>
                  </div>

                  <Link
                    href={config.linkUrl}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white text-brand-black text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span>{config.linkText}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
