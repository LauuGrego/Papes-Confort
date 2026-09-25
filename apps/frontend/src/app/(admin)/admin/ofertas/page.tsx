'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Package,
  Percent,
  Loader2,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { OfferDto } from '@papes-confort/shared';

export default function AdminOffersPage() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal para ver productos de la oferta seleccionada
  const [viewingOffer, setViewingOffer] = useState<OfferDto | null>(null);
  const [offerDetails, setOfferDetails] = useState<OfferDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchApi<OfferDto[]>('/api/admin/offers', { cache: 'no-store' });
    if (res.success && res.data) {
      setOffers(res.data);
    } else {
      setError(res.error || 'Error al cargar las ofertas');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openViewProducts = async (offer: OfferDto) => {
    setViewingOffer(offer);
    setLoadingDetails(true);
    setOfferDetails(null);

    const res = await fetchApi<OfferDto>(`/api/admin/offers/${offer.id}`);
    if (res.success && res.data) {
      setOfferDetails(res.data);
    }
    setLoadingDetails(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ofertas y Listas de Precios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervisa las ofertas y listas de precios sincronizadas automáticamente desde el sistema de stock Gescom ERP.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOffers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Errores */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Listado de Ofertas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
          <span className="text-xs font-bold text-slate-400">Consultando ofertas sincronizadas...</span>
        </div>
      ) : offers.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white space-y-3">
          <Tag className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No hay ofertas sincronizadas actualmente</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cuando el middleware de Gescom sincronice productos con una lista de oferta (LDes) o envíe listas de precios, se listarán automáticamente en esta sección.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-50 text-brand-red shrink-0">
                    <Tag className="h-5 w-5" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      offer.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {offer.isActive ? 'Activa en Tienda' : 'Inactiva'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {offer.name}
                  </h3>
                  {offer.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {offer.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {offer.discountPercent > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-red/10 text-brand-red text-xs font-black">
                      <Percent className="h-3 w-3" />
                      <span>{offer.discountPercent}% OFF</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                    <Package className="h-3 w-3" />
                    <span>{offer.productCount} {offer.productCount === 1 ? 'producto' : 'productos'}</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openViewProducts(offer)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <span>Ver Productos Vinculados</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Lectura: Productos Vinculados */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-red">
                  Productos en Oferta (Gescom ERP)
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {viewingOffer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingOffer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingDetails ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 text-brand-red animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Cargando productos asociados...</span>
                </div>
              ) : !offerDetails?.products || offerDetails.products.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <Package className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">Esta oferta aún no tiene productos vinculados.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Total: {offerDetails.products.length} productos
                  </p>
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                    {offerDetails.products.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {prod.images && prod.images.length > 0 ? (
                              <img
                                src={prod.images[0].url}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              SKU: {prod.sku}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 truncate">
                              {prod.name}
                            </h4>
                            {prod.brand && (
                              <span className="text-[10px] font-semibold text-slate-400 block">
                                {prod.brand.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-xs font-black text-brand-black">
                            ${Number(prod.basePrice).toLocaleString('es-AR')}
                          </div>
                          {prod.listPrice && Number(prod.listPrice) > Number(prod.basePrice) && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ${Number(prod.listPrice).toLocaleString('es-AR')}
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-emerald-600 block">
                            Stock: {prod.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingOffer(null)}
                className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
