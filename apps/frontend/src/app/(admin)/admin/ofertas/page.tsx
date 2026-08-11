'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Loader2,
  Package,
  Percent,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { OfferDto, ProductDto, PaginatedResponse } from '@papes-confort/shared';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminOffersPage() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Offer modal state (No slug input, auto-generated)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferDto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercent: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Manage products modal state
  const [managingOffer, setManagingOffer] = useState<OfferDto | null>(null);
  const [offerDetails, setOfferDetails] = useState<OfferDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Multi-selection states
  const [selectedToAddIds, setSelectedToAddIds] = useState<string[]>([]);
  const [selectedToRemoveIds, setSelectedToRemoveIds] = useState<string[]>([]);
  const [addingBulk, setAddingBulk] = useState(false);
  const [removingBulk, setRemovingBulk] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    const res = await fetchApi<OfferDto[]>('/api/admin/offers', { cache: 'no-store' });
    if (res.success && res.data) {
      setOffers(res.data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('offers-updated'));
      }
    } else {
      setError(res.error || 'Error al cargar las ofertas');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormData({
      name: '',
      description: '',
      discountPercent: 0,
      isActive: true,
    });
    setShowOfferModal(true);
  };

  const openEditModal = (offer: OfferDto) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name,
      description: offer.description || '',
      discountPercent: offer.discountPercent || 0,
      isActive: offer.isActive,
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const url = editingOffer ? `/api/admin/offers/${editingOffer.id}` : '/api/admin/offers';
    const method = editingOffer ? 'PUT' : 'POST';

    const res = await fetchApi<OfferDto>(url, {
      method,
      body: JSON.stringify(formData),
    });

    if (res.success) {
      setSuccessMsg(editingOffer ? 'Oferta actualizada' : 'Oferta creada exitosamente');
      setTimeout(() => setSuccessMsg(null), 3000);
      setShowOfferModal(false);
      loadOffers();
    } else {
      setError(res.error || 'Error al guardar la oferta');
    }
    setSubmitting(false);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta oferta?')) return;

    const res = await fetchApi(`/api/admin/offers/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('Oferta eliminada');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadOffers();
    } else {
      setError(res.error || 'Error al eliminar oferta');
    }
  };

  // Managing products logic
  const openManageProducts = async (offer: OfferDto) => {
    setManagingOffer(offer);
    setLoadingDetails(true);
    setProductSearch('');
    setSearchResults([]);
    setSelectedToAddIds([]);
    setSelectedToRemoveIds([]);

    const res = await fetchApi<OfferDto>(`/api/admin/offers/${offer.id}`);
    if (res.success && res.data) {
      setOfferDetails(res.data);
    }
    setLoadingDetails(false);
  };

  const searchProducts = async (query: string) => {
    setProductSearch(query);
    setSelectedToAddIds([]);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    const res = await fetchApi<PaginatedResponse<ProductDto>>(`/api/admin/products?search=${encodeURIComponent(query)}&limit=15`);
    if (res.success && res.data) {
      setSearchResults(res.data.items);
    }
    setSearchingProducts(false);
  };

  const toggleSelectToAdd = (productId: string) => {
    setSelectedToAddIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAllSearch = () => {
    if (!offerDetails) return;
    const unassignedProducts = searchResults.filter(
      (prod) => !offerDetails.products?.some((p) => p.id === prod.id)
    );
    if (selectedToAddIds.length === unassignedProducts.length) {
      setSelectedToAddIds([]);
    } else {
      setSelectedToAddIds(unassignedProducts.map((p) => p.id));
    }
  };

  const handleAddBulkProducts = async () => {
    if (!managingOffer || selectedToAddIds.length === 0) return;
    setAddingBulk(true);
    const res = await fetchApi(`/api/admin/offers/${managingOffer.id}/products`, {
      method: 'POST',
      body: JSON.stringify({ productIds: selectedToAddIds }),
    });

    if (res.success) {
      setSelectedToAddIds([]);
      openManageProducts(managingOffer);
      loadOffers();
    } else {
      setError(res.error || 'Error al agregar productos');
    }
    setAddingBulk(false);
  };

  const toggleSelectToRemove = (productId: string) => {
    setSelectedToRemoveIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAllAssigned = () => {
    if (!offerDetails?.products) return;
    if (selectedToRemoveIds.length === offerDetails.products.length) {
      setSelectedToRemoveIds([]);
    } else {
      setSelectedToRemoveIds(offerDetails.products.map((p) => p.id));
    }
  };

  const handleRemoveBulkProducts = async () => {
    if (!managingOffer || selectedToRemoveIds.length === 0) return;
    if (!confirm(`¿Remover ${selectedToRemoveIds.length} productos seleccionados de la oferta?`)) return;

    setRemovingBulk(true);
    const res = await fetchApi(`/api/admin/offers/${managingOffer.id}/products/remove`, {
      method: 'POST',
      body: JSON.stringify({ productIds: selectedToRemoveIds }),
    });

    if (res.success) {
      setSelectedToRemoveIds([]);
      openManageProducts(managingOffer);
      loadOffers();
    } else {
      setError(res.error || 'Error al remover productos');
    }
    setRemovingBulk(false);
  };

  const handleApplyBulkDiscount = async () => {
    if (!managingOffer || !offerDetails) return;
    if (!confirm(`¿Aplicar un ${offerDetails.discountPercent}% de descuento a los productos de esta oferta que tengan 0% de descuento?`)) {
      return;
    }

    setApplyingDiscount(true);
    const res = await fetchApi<{ updatedCount: number }>(`/api/admin/offers/${managingOffer.id}/apply-discount`, {
      method: 'POST',
      body: JSON.stringify({ percent: offerDetails.discountPercent }),
    });

    if (res.success) {
      setSuccessMsg(res.message || 'Descuento aplicado');
      setTimeout(() => setSuccessMsg(null), 4000);
      openManageProducts(managingOffer);
    } else {
      setError(res.error || 'Error al aplicar el descuento');
    }
    setApplyingDiscount(false);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-brand-black tracking-tight flex items-center gap-3">
            <Tag className="h-7 w-7 text-brand-red" />
            Gestión de Ofertas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Crea categorías de oferta con nombre personalizado, porcentaje de descuento y gestiona productos en lote.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-brand-red-dark shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Crear Oferta
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Offers Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Cargando ofertas...</span>
        </div>
      ) : offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      offer.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        offer.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {offer.isActive ? 'Activa' : 'Inactiva'}
                  </span>

                  {offer.discountPercent > 0 && (
                    <span className="inline-flex items-center gap-1 bg-brand-red/10 text-brand-red px-3 py-1 rounded-full text-xs font-bold border border-brand-red/20">
                      <Percent className="h-3 w-3" />
                      {offer.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">
                    {offer.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">slug: /{offer.slug}</p>
                </div>

                {offer.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openManageProducts(offer)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200/60 cursor-pointer"
                >
                  <Package className="h-3.5 w-3.5 text-brand-red" />
                  <span>Productos ({offer.productCount})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(offer)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar Oferta"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="p-2 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar Oferta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-xs">
            <Tag className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base">No hay ofertas creadas</h3>
            <p className="text-xs text-slate-400">
              Haz clic en "Crear Oferta" para agregar promociones especiales y vincular productos.
            </p>
          </div>
        </div>
      )}

      {/* CREATE / EDIT OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Tag className="h-5 w-5 text-brand-red" />
                {editingOffer ? 'Editar Oferta' : 'Crear Nueva Oferta'}
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre de la Oferta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ofertas de Invierno"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:border-brand-red outline-none transition-colors"
                />
                {formData.name.trim() && (
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Slug automático: /{slugify(formData.name)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Descripción corta para los clientes..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:border-brand-red outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Porcentaje de Descuento Sugerido (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.discountPercent}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, discountPercent: Number(e.target.value) }))
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:border-brand-red outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded accent-brand-red cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Oferta activa en el sitio web
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingOffer ? 'Guardar Cambios' : 'Crear Oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PRODUCTS MODAL WITH BULK MULTI-SELECTION */}
      {managingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-brand-red" />
                  Productos en: {managingOffer.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona múltiples productos para agregarlos o removerlos de la oferta en lote.
                </p>
              </div>
              <button
                onClick={() => setManagingOffer(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bulk Apply Discount Section */}
            {offerDetails && offerDetails.discountPercent > 0 && (
              <div className="bg-brand-red/5 p-4 rounded-2xl border border-brand-red/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-brand-red uppercase tracking-wider">
                    Aplicación masiva de descuento ({offerDetails.discountPercent}%)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aplica {offerDetails.discountPercent}% a todos los productos pertenecientes a esta oferta que tengan 0%.
                  </p>
                </div>
                <button
                  onClick={handleApplyBulkDiscount}
                  disabled={applyingDiscount}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  {applyingDiscount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Aplicar {offerDetails.discountPercent}% a productos
                </button>
              </div>
            )}

            {/* Search products section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Buscar y seleccionar productos para agregar
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos por SKU o nombre..."
                  value={productSearch}
                  onChange={(e) => searchProducts(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:border-brand-red outline-none transition-colors"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>

              {/* Search results panel with checkboxes */}
              {productSearch.trim() && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg space-y-2">
                  {searchingProducts ? (
                    <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
                      Buscando productos...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                        <button
                          type="button"
                          onClick={toggleSelectAllSearch}
                          className="text-xs font-bold text-slate-600 hover:text-brand-red flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          Seleccionar todos los disponibles
                        </button>

                        <button
                          type="button"
                          onClick={handleAddBulkProducts}
                          disabled={selectedToAddIds.length === 0 || addingBulk}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark disabled:opacity-40 transition-all cursor-pointer"
                        >
                          {addingBulk && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          + Agregar {selectedToAddIds.length} seleccionados
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {searchResults.map((prod) => {
                          const isAssigned = offerDetails?.products?.some((p) => p.id === prod.id);
                          const isSelected = selectedToAddIds.includes(prod.id);

                          return (
                            <div
                              key={prod.id}
                              onClick={() => !isAssigned && toggleSelectToAdd(prod.id)}
                              className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors select-none ${
                                isAssigned
                                  ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-brand-red/5 border border-brand-red/20 cursor-pointer'
                                  : 'hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {!isAssigned && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectToAdd(prod.id)}
                                    className="h-4 w-4 rounded accent-brand-red cursor-pointer"
                                  />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-slate-800 truncate">{prod.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                                </div>
                              </div>

                              {isAssigned && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                                  Ya en oferta
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">No se encontraron productos</div>
                  )}
                </div>
              )}
            </div>

            {/* List of currently assigned products with bulk selection */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  Productos en la oferta ({offerDetails?.products?.length || 0})
                </h4>

                {offerDetails?.products && offerDetails.products.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAllAssigned}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {selectedToRemoveIds.length === offerDetails.products.length ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>

                    {selectedToRemoveIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRemoveBulkProducts}
                        disabled={removingBulk}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        {removingBulk ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Eliminar ({selectedToRemoveIds.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loadingDetails ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
                  Cargando productos asignados...
                </div>
              ) : offerDetails?.products && offerDetails.products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {offerDetails.products.map((prod) => {
                    const isSelectedToRemove = selectedToRemoveIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleSelectToRemove(prod.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelectedToRemove
                            ? 'border-rose-300 bg-rose-50/50'
                            : 'border-slate-100 bg-slate-50/60 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelectedToRemove}
                            onChange={() => toggleSelectToRemove(prod.id)}
                            className="h-4 w-4 rounded accent-rose-500 cursor-pointer shrink-0"
                          />
                          <img
                            src={prod.images[0]?.url || '/images/logo/isotipo.svg'}
                            alt={prod.name}
                            className="h-10 w-10 object-contain rounded-xl bg-white p-1 border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-800 truncate">{prod.name}</h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>SKU: {prod.sku}</span>
                              {prod.discountPercent > 0 && (
                                <span className="font-bold text-brand-red">({prod.discountPercent}% OFF)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No hay productos asignados a esta oferta todavía. Busca arriba para agregar productos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
