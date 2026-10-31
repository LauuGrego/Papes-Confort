'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Tag, Box, MessageCircle } from 'lucide-react';
import { HomeOutletDto, DEFAULT_OUTLET_SECTION } from '@papes-confort/shared';

interface OutletSectionProps {
  outletConfig?: HomeOutletDto;
  whatsappNumber?: string;
}

export default function OutletSection({ outletConfig, whatsappNumber }: OutletSectionProps) {
  const config = outletConfig ? { ...DEFAULT_OUTLET_SECTION, ...outletConfig } : DEFAULT_OUTLET_SECTION;
  const isContain = config.objectFit === 'contain';

  if (!config.isActive) {
    return null;
  }

  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/\D/g, '') : '5493447400000';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    config.whatsappMessage || '¡Hola Papes Confort! Quisiera consultar sobre los productos disponibles en la sección Outlet.'
  )}`;

  return (
    <section className="w-full py-8 sm:py-12 bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/60 p-6 sm:p-10 lg:p-12 text-white shadow-xl border border-amber-500/25">
          {/* Resplandores ambientales decorativos */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-brand-red/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna Izquierda: Mensaje principal y llamados a la acción */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Badge de rubro */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3.5 py-1 text-xs font-black text-amber-300 uppercase tracking-widest backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>{config.badge}</span>
              </div>

              {/* Título de gran impacto visual */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                {config.title}{' '}
                <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                  {config.titleHighlight}
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-light max-w-xl">
                {config.description}
              </p>

              {/* Micro-beneficios destacados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
                <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2.5 sm:p-3 backdrop-blur-xs">
                  <Tag className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] sm:text-xs font-bold text-white leading-tight">Precios Outlet</p>
                    <p className="text-[9px] text-slate-400 font-normal">Ahorro directo</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2.5 sm:p-3 backdrop-blur-xs">
                  <Box className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] sm:text-xs font-bold text-white leading-tight">Stock Real</p>
                    <p className="text-[9px] text-slate-400 font-normal">Entrega inmediata</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2.5 sm:p-3 backdrop-blur-xs">
                  <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] sm:text-xs font-bold text-white leading-tight">Respaldo</p>
                    <p className="text-[9px] text-slate-400 font-normal">{config.conditionText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2.5 sm:p-3 backdrop-blur-xs">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] sm:text-xs font-bold text-white leading-tight">Exclusivo</p>
                    <p className="text-[9px] text-slate-400 font-normal">Hasta agotar stock</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 flex flex-wrap items-center gap-3.5">
                <Link
                  href={config.primaryBtnUrl || '/catalogo?type=outlet'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-extrabold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.45)] transition-all duration-200 transform hover:-translate-y-0.5 group cursor-pointer"
                >
                  <span>{config.primaryBtnText || 'Ver Productos del Outlet'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-200 hover:text-white border border-white/15 hover:bg-white/15 hover:border-white/25 transition-all duration-200 backdrop-blur-xs cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>{config.whatsappText || 'Consultar por WhatsApp'}</span>
                </a>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta visual de presentación */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/15 p-5 sm:p-6 backdrop-blur-md shadow-2xl overflow-hidden group">
                <div className="relative aspect-[16/10] w-full rounded-2xl bg-slate-950/80 overflow-hidden mb-4 border border-white/10 flex items-center justify-center">
                  {isContain && (
                    <div
                      className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${config.imageUrl || 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184610/papes-confort/landing/cat_heladeras.jpg'})` }}
                    />
                  )}
                  <img
                    src={config.imageUrl || 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184610/papes-confort/landing/cat_heladeras.jpg'}
                    alt={config.cardTitle || 'Outlet Papes Confort'}
                    className={`w-full h-full opacity-75 transition-transform duration-700 group-hover:scale-105 relative z-10 ${
                      isContain ? 'object-contain mx-auto p-2 sm:p-3' : 'object-cover'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Badge flotante animado */}
                  <div className="absolute top-3 right-3 z-10 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-amber-300/40">
                    {config.cardBadge}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 z-10 text-left">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                      {config.cardSub}
                    </span>
                    <p className="text-white font-extrabold text-sm sm:text-base leading-tight mt-0.5">
                      {config.cardTitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Condición:</span>
                    <span className="font-medium text-slate-200">{config.conditionText}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Entrega:</span>
                    <span className="font-medium text-emerald-400">{config.deliveryText}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Stock sujeto a disponibilidad física</span>
                  <Link
                    href={config.primaryBtnUrl || '/catalogo?type=outlet'}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 group/link"
                  >
                    <span>Ingresar</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
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
