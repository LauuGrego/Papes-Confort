'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductDto } from '@papes-confort/shared';
import { ArrowRight, CreditCard, Heart } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { useFavoritesStore } from '../../stores/favorites';
import { useInstallmentsStore } from '../../stores/installments';

interface ProductCardProps {
  product: ProductDto;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { user, customer, isAuthenticated } = useAuthStore();
  const currentCustomerId = customer?.id || user?.id || '';
  const isFav = useFavoritesStore((state) =>
    isAuthenticated && currentCustomerId ? state.isFavorite(product.id, currentCustomerId) : false
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const images = product.images.length > 0 ? product.images : [{ url: '/images/logo/isotipo.svg', isPrimary: true }];
  const mainImage = images[0]?.url || '/images/logo/isotipo.svg';

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const redirectPath = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/catalogo';
      router.push(`/ingresar?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    toggleFavorite(product, currentCustomerId);
  };

  const { config: installmentsConfig, load: loadInstallments } = useInstallmentsStore();

  React.useEffect(() => {
    loadInstallments();
  }, [loadInstallments]);

  const listPrice = product.listPrice && product.listPrice > 0 ? product.listPrice : product.basePrice;
  const showListPrice = listPrice > product.finalPrice;

  const defaultInstallments = installmentsConfig.defaultInstallments || 5;
  const installmentAmount = Math.round(listPrice / defaultInstallments);

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      {/* Zona de Imagen 1:1 con Botón de Favorito y Badge Único */}
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50/70 p-3 sm:p-4">
        {/* Badge discreto único (máximo 1) */}
        {product.discountPercent > 0 ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-brand-red px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
            {product.discountPercent}% OFF
          </span>
        ) : product.isOutlet ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-brand-navy px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
            Outlet
          </span>
        ) : null}

        {/* Botón Favorito Flotante */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 hover:bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer group/fav"
          title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${
              isFav
                ? 'text-brand-red fill-brand-red'
                : 'text-slate-400 group-hover/fav:text-brand-red'
            }`}
          />
        </button>

        <img
          src={mainImage}
          alt={product.name}
          className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logo/isotipo.svg';
          }}
        />
      </div>

      {/* Información del Producto */}
      <div className="flex flex-col flex-grow">
        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 leading-tight">
          {product.brand?.name || 'Papes Confort'}
        </span>

        <h3 className="text-xs sm:text-sm font-bold text-brand-black leading-snug group-hover:text-brand-red transition-colors mb-2">
          {product.name}
        </h3>

        {/* Bloque de Precios y Financiación */}
        <div className="mt-auto pt-2 border-t border-slate-50 space-y-1">
          {showListPrice && (
            <span className="block text-[11px] sm:text-xs text-slate-400 line-through">
              {formatPrice(listPrice)}
            </span>
          )}

          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-brand-black group-hover:text-brand-red transition-colors">
              {formatPrice(product.finalPrice)}
            </span>
          </div>

          <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 leading-tight">
            Precio promocional por transferencia
          </p>

          {/* Financiación en Cuotas al Precio de Lista */}
          {defaultInstallments > 1 && (
            <div className="pt-1.5 border-t border-slate-100/90 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-800 leading-tight">
                <CreditCard className="h-3.5 w-3.5 text-brand-red shrink-0" />
                <span>
                  <strong className="font-bold text-slate-900">{defaultInstallments} cuotas</strong> de{' '}
                  <strong className="font-extrabold text-brand-black">{formatPrice(installmentAmount)}</strong>
                </span>
              </div>

              {installmentsConfig.bankPromoActive && installmentsConfig.bankPromoInstallments > 0 && (
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                    O hasta {installmentsConfig.bankPromoInstallments} cuotas s/int con {installmentsConfig.bankPromoName}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Limpio */}
      <div className="mt-3 pt-2">
        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 group-hover:bg-brand-red text-slate-700 group-hover:text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5">
          <span>Ver producto</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
