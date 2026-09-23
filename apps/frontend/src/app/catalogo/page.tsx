'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { ProductDto, PaginatedResponse } from '@papes-confort/shared';
import ProductCard from '../../components/products/ProductCard';
import Pagination from '../../components/Pagination';
import ProductFiltersSidebar, { FilterState } from '../../components/products/ProductFiltersSidebar';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'offers', label: 'Ofertas destacadas' },
];

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState<PaginatedResponse<ProductDto> | null>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Search & Sorting
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Mobile drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    selectedFamily: null,
    selectedCategory: null,
    selectedBrand: null,
    selectedProductType: null,
    minPrice: '',
    maxPrice: '',
    inStock: false,
  });

  // 1. Read URL params
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort');
    const familyParam = searchParams.get('type');
    const categoryParam = searchParams.get('categoryId');
    const productTypeParam = searchParams.get('productType');
    const brandParam = searchParams.get('brandId');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const inStockParam = searchParams.get('inStock') === 'true';

    setPage(pageParam ? Number(pageParam) : 1);
    setSearch(searchParam || '');
    setSearchInput(searchParam || '');
    setSort(sortParam || 'relevance');

    setFilters({
      selectedFamily: familyParam || null,
      selectedCategory: categoryParam || null,
      selectedBrand: brandParam || null,
      selectedProductType: productTypeParam || null,
      minPrice: minPriceParam || '',
      maxPrice: maxPriceParam || '',
      inStock: inStockParam,
    });

    setInitialLoaded(true);
  }, [searchParams]);

  // 2. Load metadata (families & brands)
  useEffect(() => {
    async function loadMetadata() {
      const [categoriesRes, brandsRes] = await Promise.all([
        fetchApi<any[]>('/api/categories'),
        fetchApi<any[]>('/api/brands'),
      ]);
      if (categoriesRes.success && categoriesRes.data) {
        setFamilies(categoriesRes.data);
      }
      if (brandsRes.success && brandsRes.data) {
        setBrands(brandsRes.data);
      }
    }
    loadMetadata();
  }, []);

  // 3. Fetch products function
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');

    if (search) params.set('search', search);
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (filters.selectedFamily) params.set('type', filters.selectedFamily);
    if (filters.selectedCategory) params.set('categoryId', filters.selectedCategory);
    if (filters.selectedBrand) params.set('brandId', filters.selectedBrand);
    if (filters.selectedProductType) params.set('productType', filters.selectedProductType);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.inStock) params.set('inStock', 'true');

    const res = await fetchApi<PaginatedResponse<ProductDto>>(`/api/products?${params.toString()}`);
    if (res.success && res.data) {
      setProductsData(res.data);
    }
    setLoading(false);
  }, [page, search, sort, filters]);

  // 4. Trigger fetch
  useEffect(() => {
    if (initialLoaded) {
      fetchProducts();
    }
  }, [fetchProducts, initialLoaded]);

  // 5. Sync to URL
  useEffect(() => {
    if (!initialLoaded) return;
    const params = new URLSearchParams();

    if (page > 1) params.set('page', String(page));
    if (search) params.set('search', search);
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (filters.selectedFamily) params.set('type', filters.selectedFamily);
    if (filters.selectedCategory) params.set('categoryId', filters.selectedCategory);
    if (filters.selectedBrand) params.set('brandId', filters.selectedBrand);
    if (filters.selectedProductType) params.set('productType', filters.selectedProductType);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.inStock) params.set('inStock', 'true');

    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [page, search, sort, filters, initialLoaded]);

  // Search input debounce
  useEffect(() => {
    if (!initialLoaded) return;
    if (searchInput === search) return;

    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, initialLoaded]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleClearAll = () => {
    setFilters({
      selectedFamily: null,
      selectedCategory: null,
      selectedBrand: null,
      selectedProductType: null,
      minPrice: '',
      maxPrice: '',
      inStock: false,
    });
    setSearch('');
    setSearchInput('');
    setSort('relevance');
    setPage(1);
  };

  // Resolution helpers
  const selectedFamilyObj = families.find(
    (f) => f.slug === filters.selectedFamily || f.id === filters.selectedFamily
  );

  const selectedCategoryObj = families
    .flatMap((f) => f.categories || [])
    .find((c) => c.id === filters.selectedCategory || c.slug === filters.selectedCategory);

  const selectedBrandObj = brands.find((b) => b.id === filters.selectedBrand);

  const hasActiveFilters = Boolean(
    filters.selectedFamily ||
    filters.selectedCategory ||
    filters.selectedBrand ||
    filters.selectedProductType ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStock ||
    search
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* A. Encabezado del catálogo con Breadcrumb contextual */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-700 transition-colors">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/catalogo" className="hover:text-slate-700 transition-colors">
          Catálogo
        </Link>
        {selectedFamilyObj && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-slate-700 font-semibold">{selectedFamilyObj.name}</span>
          </>
        )}
        {selectedCategoryObj && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-brand-red font-semibold">{selectedCategoryObj.name}</span>
          </>
        )}
      </nav>

      <div className="mb-6 space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black tracking-tight">
          {selectedCategoryObj
            ? selectedCategoryObj.name
            : selectedFamilyObj
            ? selectedFamilyObj.name
            : 'Encontrá lo que necesitás para tu hogar'}
        </h1>

        {/* Buscador Integrado en el Encabezado */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar productos, marcas o categorías..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm text-brand-black outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/10 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Contador de resultados */}
        <p className="text-xs text-slate-500 font-medium">
          {productsData ? `${productsData.total} productos encontrados` : 'Buscando productos...'}
        </p>
      </div>

      {/* Barra de Controles (Mobile: Filtrar + Ordenar / Desktop: Ordenar) */}
      <div className="flex items-center justify-between gap-4 py-3 border-y border-slate-100 mb-6">
        {/* Botón Mobile Filtrar */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtrar</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-brand-red" />
            )}
          </button>
        </div>

        {/* Selector de Ordenamiento */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">Ordenar por:</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-brand-red/40"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chips de Filtros Activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Filtros:
          </span>

          {filters.selectedFamily && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>Rubro: {selectedFamilyObj?.name || filters.selectedFamily}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ selectedFamily: null, selectedCategory: null })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>Categoría: {selectedCategoryObj?.name || filters.selectedCategory}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ selectedCategory: null })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.selectedBrand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>Marca: {selectedBrandObj?.name || 'Seleccionada'}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ selectedBrand: null })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.selectedProductType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>{filters.selectedProductType === 'OFFER' ? 'Ofertas' : 'Outlet'}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ selectedProductType: null })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>
                Precio: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
              </span>
              <button
                type="button"
                onClick={() => handleFilterChange({ minPrice: '', maxPrice: '' })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.inStock && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>Solo en stock</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ inStock: false })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>Búsqueda: &quot;{search}&quot;</span>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold text-brand-red hover:underline ml-2"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* B. Layout Principal: 25% Sidebar Filtros + 75% Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Desktop (25%) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
          <ProductFiltersSidebar
            families={families}
            brands={brands}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Grilla de Productos (75%) */}
        <main className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
              <span className="text-xs font-semibold text-slate-400">Cargando productos...</span>
            </div>
          ) : productsData && productsData.items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {productsData.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-2xs">
                <PackageOpen className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">No encontramos productos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba cambiando los filtros seleccionados o ingresando otro término de búsqueda.
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}

          {productsData && productsData.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={productsData.totalPages}
              onPageChange={setPage}
            />
          )}
        </main>
      </div>

      {/* Drawer Modal de Filtros en Mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xs bg-white h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Filtros
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ProductFiltersSidebar
                families={families}
                brands={brands}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAll}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-brand-red-dark transition-colors cursor-pointer"
              >
                Ver resultados ({productsData?.total || 0})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Cargando catálogo...</span>
        </div>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}
