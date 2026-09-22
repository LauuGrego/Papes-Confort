'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth';
import { useFavoritesStore } from '../../../stores/favorites';
import ProductCard from '../../../components/products/ProductCard';

export default function MisFavoritosPage() {
  const { user, customer } = useAuthStore();
  const currentCustomerId = customer?.id || user?.id || '';

  const { getItems, clearFavorites } = useFavoritesStore();
  const items = getItems(currentCustomerId);

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = () => {
    if (confirmClear) {
      clearFavorites(currentCustomerId);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center">
              <Heart className="h-5 w-5 fill-brand-red/20" />
            </div>
            <h2 className="text-xl font-bold text-brand-black">Mis Favoritos</h2>
            {items.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold">
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tus productos guardados para consultar disponibilidad, precios o comprar cuando quieras.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                confirmClear
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{confirmClear ? '¿Confirmar vaciar?' : 'Vaciar lista'}</span>
            </button>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Ver Catálogo</span>
            </Link>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      {items.length === 0 ? (
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="h-20 w-20 rounded-full bg-brand-red/5 border border-brand-red/15 flex items-center justify-center text-brand-red mb-4 shadow-inner">
            <Heart className="h-9 w-9 text-brand-red stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-brand-black mb-1.5">
            Aún no tenés productos en favoritos
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Guardá los artículos que más te gusten haciendo clic en el corazón de cualquier producto para encontrarlos acá en un solo lugar.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-brand-red/20 active:scale-95"
          >
            <span>Explorar Productos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
