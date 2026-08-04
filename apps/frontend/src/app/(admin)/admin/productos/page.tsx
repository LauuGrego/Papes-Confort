'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { ProductDto, PaginatedResponse } from '@papes-confort/shared';
import { Loader2, Search, Edit2, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import Pagination from '../../../../components/Pagination';

export default function AdminProductosPage() {
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState<PaginatedResponse<ProductDto> | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [dimensions, setDimensions] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>([]);

  // Metadata
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const fetchProducts = async (pNum: number, searchVal: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(pNum));
    params.set('limit', '10');
    if (searchVal) params.set('search', searchVal);

    const res = await fetchApi<PaginatedResponse<ProductDto>>(`/api/admin/products?${params.toString()}`);
    if (res.success && res.data) {
      setProductsData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(page, search);
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function loadMetadata() {
      const res = await fetchApi<any[]>('/api/categories');
      if (res.success && res.data) {
        setFamilies(res.data);
      }
    }
    loadMetadata();
  }, []);

  const openEditModal = (product: ProductDto) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setDiscountPercent(product.discountPercent);
    setWarrantyMonths(product.warrantyMonths || 12);
    setWeightKg(product.weightKg !== null ? product.weightKg : '');
    setDimensions(product.dimensions || '');
    setIsActive(product.isActive);
    setSelectedCategoryId(product.productCategory?.id || '');

    // Map specs Record to array
    const mappedSpecs = Object.entries(product.specs || {}).map(([k, v]) => ({
      key: k,
      val: String(v),
    }));
    setSpecs(mappedSpecs);

    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', val: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'key' | 'val', value: string) => {
    const newSpecs = [...specs];
    newSpecs[idx][field] = value;
    setSpecs(newSpecs);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaveLoading(true);
    setSaveError(null);

    // Reconstruct specs Record
    const specsRecord: Record<string, any> = {};
    specs.forEach((s) => {
      if (s.key.trim()) {
        specsRecord[s.key.trim()] = s.val.trim();
      }
    });

    const body = {
      name,
      description,
      discountPercent: Number(discountPercent),
      warrantyMonths: Number(warrantyMonths),
      weightKg: weightKg === '' ? null : Number(weightKg),
      dimensions: dimensions.trim() || null,
      isActive,
      productCategoryId: selectedCategoryId || null,
      specs: specsRecord,
    };

    const res = await fetchApi<ProductDto>(`/api/admin/products/${editingProduct.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (res.success) {
      setIsModalOpen(false);
      // Reload products list
      fetchProducts(page, search);
    } else {
      setSaveError(res.error || 'Error al guardar los cambios.');
    }
    setSaveLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-black">
            Catálogo de Productos
          </h1>
          <p className="text-sm text-slate-400">
            Enriquece y gestiona la visualización de tus artículos sincronizados.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar por SKU, nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-100 bg-white text-sm text-brand-black outline-none focus:border-brand-red/30 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.01)]"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Cargando catálogo...</span>
        </div>
      ) : productsData && productsData.items.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Nombre original (GesCom)</th>
                  <th className="px-6 py-4">Nombre visible</th>
                  <th className="px-6 py-4">Precio final</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productsData.items.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/30 text-slate-600 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{prod.sku}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{prod.gescomName}</td>
                    <td className="px-6 py-4 max-w-xs truncate font-semibold text-slate-800">{prod.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(prod.finalPrice)}
                    </td>
                    <td className="px-6 py-4 font-semibold">{prod.stock}</td>
                    <td className="px-6 py-4">
                      {prod.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                          <Eye className="h-3.5 w-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase">
                          <EyeOff className="h-3.5 w-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-brand-red hover:bg-brand-red/10 transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={productsData.totalPages}
            onPageChange={setPage}
            totalItems={productsData.total}
            itemLabel="Productos"
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 shadow-[0_5px_20px_rgba(0,0,0,0.01)]">
          <p>No se encontraron productos en el catálogo.</p>
        </div>
      )}

      {/* Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="font-display text-lg font-extrabold text-brand-black">
                  Enriquecer Producto
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">SKU: {editingProduct.sku}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-grow">
              {saveError && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-xs font-semibold">
                  {saveError}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre Visible</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría Web</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                  >
                    <option value="">Seleccionar Categoría</option>
                    {families.map((fam) => (
                      <optgroup key={fam.id} label={fam.name}>
                        {fam.categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción Larga</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Discount, Warranty, Weight, Dimensions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Garantía (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(parseInt(e.target.value, 10) || 12)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peso (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dimensiones (AlxAnxPr)</label>
                  <input
                    type="text"
                    placeholder="120x60x60"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Status and visibility */}
              <div className="flex gap-6 border-t border-slate-50 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-brand-red focus:ring-brand-red h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-slate-700">Producto Activo en Web</span>
                </label>
              </div>

              {/* Key-Value Specifications */}
              <div className="space-y-3 border-t border-slate-50 pt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
                    Especificaciones Técnicas
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-xs font-bold text-brand-red hover:text-brand-red-dark flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Agregar Atributo
                  </button>
                </div>

                <div className="space-y-2">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Capacidad"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        className="w-1/2 px-4 py-2 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                      />
                      <input
                        type="text"
                        placeholder="350 L"
                        value={spec.val}
                        onChange={(e) => handleSpecChange(idx, 'val', e.target.value)}
                        className="w-1/2 px-4 py-2 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold uppercase border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-6 py-2 rounded-xl text-xs font-bold uppercase bg-brand-red text-white hover:bg-brand-red-dark transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {saveLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
