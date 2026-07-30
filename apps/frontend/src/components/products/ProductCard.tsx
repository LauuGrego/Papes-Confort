import Link from 'next/link';
import { ProductDto } from '@papes-confort/shared';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: ProductDto;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discountPercent > 0;
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage ? primaryImage.url : '/images/logo/isotipo.svg';

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
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

      <div className="relative mb-2 md:mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl md:rounded-2xl bg-slate-50 p-1 md:p-2">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logo/isotipo.svg';
          }}
        />
      </div>

      <div className="flex flex-col flex-grow">
        <span className="text-[8px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">
          {product.brand.name}
        </span>
        <h3 className="font-display text-xs md:text-base font-bold text-brand-black mb-1 md:mb-2 line-clamp-2 leading-tight group-hover:text-brand-red transition-colors duration-200">
          {product.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed hidden md:block">
          {product.description || 'Sin descripción adicional.'}
        </p>
      </div>

      <div className="border-t border-slate-50 pt-2 md:pt-4 mt-auto">
        <div className="flex flex-wrap items-baseline gap-1 md:gap-2 mb-1 md:mb-3">
          <span className="text-xs md:text-lg font-extrabold text-brand-black">
            {formatPrice(product.finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[9px] md:text-xs text-slate-400 line-through">
              {formatPrice(product.basePrice)}
            </span>
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
