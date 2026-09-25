'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, RotateCcw, Check, Tag } from 'lucide-react';
import { OfferDto } from '@papes-confort/shared';

export interface FilterState {
  selectedFamily: string | null;
  selectedCategory: string | null;
  selectedBrand: string | null;
  selectedProductType: string | null;
  selectedOffer?: string | null;
  minPrice: string;
  maxPrice: string;
  inStock?: boolean;
}

interface ProductFiltersSidebarProps {
  families: any[];
  brands: any[];
  offers?: OfferDto[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearAll: () => void;
}

export default function ProductFiltersSidebar({
  families,
  brands,
  offers = [],
  filters,
  onFilterChange,
  onClearAll,
}: ProductFiltersSidebarProps) {
  const [brandSearch, setBrandSearch] = useState('');
  const [priceMinInput, setPriceMinInput] = useState(filters.minPrice);
  const [priceMaxInput, setPriceMaxInput] = useState(filters.maxPrice);

  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    types: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Filtered brands by user typing
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ minPrice: priceMinInput, maxPrice: priceMaxInput });
  };

  const hasActiveFilters = Boolean(
    filters.selectedFamily ||
    filters.selectedCategory ||
    filters.selectedBrand ||
    filters.selectedProductType ||
    filters.minPrice ||
    filters.maxPrice
  );

  return (
    <aside className="w-full space-y-6 text-sm">
      {/* Encabezado de Filtros */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
          Filtrar productos
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setPriceMinInput('');
              setPriceMaxInput('');
              setBrandSearch('');
              onClearAll();
            }}
            className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* 1. Categorías / Rubros */}
      <div className="border-b border-slate-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider py-1 cursor-pointer"
        >
          <span>Categoría</span>
          {openSections.categories ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.categories && (
          <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {families.map((fam) => {
              const isSelected = filters.selectedFamily === fam.slug || filters.selectedFamily === fam.id;

              return (
                <div key={fam.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onFilterChange({ selectedFamily: null, selectedCategory: null });
                      } else {
                        onFilterChange({ selectedFamily: fam.slug, selectedCategory: null });
                      }
                    }}
                    className={`w-full text-left text-xs py-1 px-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-brand-red/10 text-brand-red font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-red'
                    }`}
                  >
                    <span className="truncate">{fam.name}</span>
                    <span className="text-[10px] text-slate-400">({fam.productCount || 0})</span>
                  </button>

                  {/* Subcategorías si el rubro está seleccionado */}
                  {isSelected && fam.categories && fam.categories.length > 0 && (
                    <div className="pl-3 py-1 space-y-1 border-l-2 border-brand-red/20 ml-2">
                      {fam.categories.map((cat: any) => {
                        const isCatSelected = filters.selectedCategory === cat.id || filters.selectedCategory === cat.slug;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              onFilterChange({
                                selectedCategory: isCatSelected ? null : cat.id,
                              });
                            }}
                            className={`w-full text-left text-[11px] py-0.5 px-2 rounded transition-colors flex items-center justify-between cursor-pointer ${
                              isCatSelected
                                ? 'text-brand-red font-bold bg-brand-red/5'
                                : 'text-slate-500 hover:text-brand-red'
                            }`}
                          >
                            <span className="truncate">• {cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Marcas con Buscador */}
      <div className="border-b border-slate-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('brands')}
          className="w-full flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider py-1 cursor-pointer"
        >
          <span>Marca</span>
          {openSections.brands ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.brands && (
          <div className="mt-3 space-y-2">
            {/* Buscador de Marca */}
            {brands.length > 6 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar marca..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-red/40"
                />
              </div>
            )}

            {/* Lista de Marcas con Checkbox */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredBrands.map((brand) => {
                const isChecked = filters.selectedBrand === brand.id;

                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      onFilterChange({ selectedBrand: isChecked ? null : brand.id });
                    }}
                    className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors text-left cursor-pointer ${
                      isChecked
                        ? 'bg-slate-100 font-bold text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-red'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                          isChecked
                            ? 'bg-brand-red border-brand-red text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span className="truncate">{brand.name}</span>
                    </div>
                    {brand.productCount !== undefined && (
                      <span className="text-[10px] text-slate-400">({brand.productCount})</span>
                    )}
                  </button>
                );
              })}

              {filteredBrands.length === 0 && (
                <p className="text-[11px] text-slate-400 py-1 text-center">
                  No se encontraron marcas
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Rango de Precios */}
      <div className="border-b border-slate-100 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider py-1 cursor-pointer"
        >
          <span>Precio</span>
          {openSections.price ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.price && (
          <form onSubmit={handleApplyPrice} className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Desde $</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={priceMinInput}
                  onChange={(e) => setPriceMinInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-red/40"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Hasta $</label>
                <input
                  type="number"
                  placeholder="Sin límite"
                  min="0"
                  value={priceMaxInput}
                  onChange={(e) => setPriceMaxInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-red/40"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Aplicar precio
            </button>
          </form>
        )}
      </div>


      {/* 5. Promociones y Ofertas */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('types')}
          className="w-full flex items-center justify-between font-bold text-slate-800 text-xs uppercase tracking-wider py-1 cursor-pointer"
        >
          <span>Promociones y Ofertas</span>
          {openSections.types ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.types && (
          <div className="mt-3 space-y-1.5">
            {/* Listado de Ofertas / Campañas de GesCom o Admin */}
            {offers && offers.length > 0 && (
              <div className="space-y-1 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
                  Campañas activas
                </span>
                {offers.map((offer) => {
                  const isSelected = filters.selectedOffer === offer.slug;
                  return (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => {
                        onFilterChange({
                          selectedOffer: isSelected ? null : offer.slug,
                        });
                      }}
                      className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-brand-red/10 text-brand-red font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-1">
                        <div
                          className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'bg-brand-red border-brand-red text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <Tag className="h-3 w-3 text-brand-red shrink-0" />
                        <span className="truncate">{offer.name}</span>
                      </div>
                      {offer.discountPercent > 0 && (
                        <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded shrink-0">
                          {offer.discountPercent}% OFF
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onFilterChange({
                  selectedOffer: filters.selectedOffer === 'all' ? null : 'all',
                });
              }}
              className={`w-full flex items-center gap-2.5 text-xs py-1.5 px-2 rounded-lg transition-colors text-left cursor-pointer ${
                filters.selectedOffer === 'all'
                  ? 'bg-brand-red/10 text-brand-red font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                  filters.selectedOffer === 'all'
                    ? 'bg-brand-red border-brand-red text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {filters.selectedOffer === 'all' && <Check className="h-2.5 w-2.5" />}
              </div>
              <span>Todos los productos en oferta</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
