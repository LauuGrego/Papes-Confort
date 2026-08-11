'use client';

import React from 'react';
import Link from 'next/link';
import { ProductDto } from '@papes-confort/shared';
import { ArrowRight, Sparkles, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../stores/cart';

interface ProductCardProps {
  product: ProductDto;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discountPercent > 0;
  const images = product.images.length > 0 ? product.images : [{ url: '/images/logo/isotipo.svg', isPrimary: true }];
  const [currentImgIdx, setCurrentImgIdx] = React.useState(0);
  
  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = React.useState(false);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockVisible <= 0 || isAdding) return;

    setIsAdding(true);
    try {
      await addItem(product.id, 1);
    } catch (err) {
      console.error('Error al agregar rápido al carrito:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl md:rounded-3xl border border-slate-100 bg-white p-2.5 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-red/20 hover:shadow-[0_20px_40px_rgba(228,20,20,0.06)]"
    >
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {hasDiscount && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-red px-2 py-0.5 text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
            <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 animate-pulse" />
            {product.discountPercent}% <span className="hidden md:inline">OFF</span>
          </span>
        )}
        {product.isOutlet && (
          <span className="inline-flex items-center rounded-full bg-brand-navy px-2 py-0.5 text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
            Outlet
          </span>
        )}
      </div>

      <div className="relative mb-2 md:mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl md:rounded-2xl bg-slate-50 p-1 md:p-2 group/image">
        <img
          src={images[currentImgIdx]?.url}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logo/isotipo.svg';
          }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="absolute left-1.5 md:left-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white border border-slate-200/60 text-slate-600 shadow-sm opacity-100 md:opacity-0 md:group-hover/image:opacity-100 transition-opacity duration-200 cursor-pointer"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5 md:h-5 md:w-5 text-slate-600" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white border border-slate-200/60 text-slate-600 shadow-sm opacity-100 md:opacity-0 md:group-hover/image:opacity-100 transition-opacity duration-200 cursor-pointer"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-3.5 w-3.5 md:h-5 md:w-5 text-slate-600" />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/10 backdrop-blur-xs px-2 py-1 rounded-full opacity-100 md:opacity-0 md:group-hover/image:opacity-100 transition-opacity duration-200">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImgIdx ? 'bg-brand-red w-2.5 md:w-3' : 'bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">
          {product.brand.name}
        </span>
        <h3 className="font-display text-[11px] md:text-sm font-bold text-brand-black mb-1 md:mb-2 line-clamp-2 leading-tight group-hover:text-brand-red transition-colors duration-200">
          {product.name}
        </h3>
        
        {/* Stock Badge & Availability Note */}
        <div className="mb-2 flex items-center gap-1.5 flex-wrap">
          {product.stockVisible > 0 ? (
            <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] md:text-xs font-semibold text-emerald-700">
              {product.stockVisible} disponible{product.stockVisible > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[9px] md:text-xs font-semibold text-rose-700">
              Sin stock
            </span>
          )}
          <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[9px] md:text-xs font-semibold text-amber-700 border border-amber-100/50">
            Consultar disponibilidad
          </span>
        </div>

      </div>

      <div className="border-t border-slate-50 pt-2 md:pt-4 mt-auto">
        <div className="flex items-center justify-between gap-2 mb-1 md:mb-3">
          <div className="flex flex-wrap items-baseline gap-1 md:gap-2">
            <span className="text-xs md:text-lg font-extrabold text-brand-black">
              {formatPrice(product.finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[9px] md:text-xs text-slate-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>
          
          {/* Botón rápido Agregar al Carrito */}
          {product.stockVisible > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-brand-red hover:bg-brand-red-dark text-white flex items-center justify-center shadow-md hover:shadow-brand-red/20 active:scale-95 transition-all"
              aria-label="Agregar al carrito rápidamente"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Plus className="h-4 w-4 md:h-5 md:w-5 text-white" />
              )}
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center justify-between text-xs font-bold text-brand-red uppercase tracking-wider group-hover:text-brand-red-dark transition-colors">
          <span>Ver Detalles</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
