'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Grid, Search, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { ProductDto, PaginatedResponse } from '@papes-confort/shared';
import ProductCard from '../../components/products/ProductCard';
import ProductFilters from '../../components/products/ProductFilters';
import Pagination from '../../components/Pagination';

export default function CatalogoPage() {
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState<PaginatedResponse<ProductDto> | null>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 1. Read initial search/filter/page parameters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const pageParam = params.get('page');
    const searchParam = params.get('search');
    const familyParam = params.get('type');
    const categoryParam = params.get('categoryId');
    const productTypeParam = params.get('productType');
    const brandParam = params.get('brandId');

    if (pageParam) setPage(Number(pageParam));
    if (familyParam) setSelectedFamily(familyParam);
    if (categoryParam) setSelectedCategory(categoryParam);
    if (productTypeParam) setSelectedProductType(productTypeParam);
    if (brandParam) setSelectedBrand(brandParam);
    if (searchParam) {
      setSearch(searchParam);
      setSearchInput(searchParam);
    }
    
    setInitialLoaded(true);
  }, []);

  // 2. Load metadata (categories and brands)
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
    params.set('limit', '18');

    if (search) params.set('search', search);
    if (selectedFamily) params.set('type', selectedFamily);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedProductType) params.set('productType', selectedProductType);
    if (selectedBrand) params.set('brandId', selectedBrand);

    const res = await fetchApi<PaginatedResponse<ProductDto>>(`/api/products?${params.toString()}`);
    if (res.success && res.data) {
      setProductsData(res.data);
    }
    setLoading(false);
  }, [page, search, selectedFamily, selectedCategory, selectedProductType, selectedBrand]);

  // 4. Trigger fetch when parameters or loading ready state changes
  useEffect(() => {
    if (initialLoaded) {
      fetchProducts();
    }
  }, [fetchProducts, initialLoaded]);

  // 5. Update URL parameters when states change
  useEffect(() => {
    if (!initialLoaded) return;
    const params = new URLSearchParams();
    
    if (page > 1) params.set('page', String(page));
    if (search) params.set('search', search);
    if (selectedFamily) params.set('type', selectedFamily);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedProductType) params.set('productType', selectedProductType);
    if (selectedBrand) params.set('brandId', selectedBrand);

    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    
    window.history.replaceState(null, '', newUrl);
  }, [page, search, selectedFamily, selectedCategory, selectedProductType, selectedBrand, initialLoaded]);

  // 6. Debounce search input and reset page to 1 on actual search query changes
  useEffect(() => {
    if (!initialLoaded) return;
    
    // Only reset page & update search if searchInput actually changed
    if (searchInput === search) return;

    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, initialLoaded]);

  const handleFilterChange = (filters: {
    family?: string | null;
    category?: string | null;
    productType?: string | null;
    brand?: string | null;
  }) => {
    if (filters.family !== undefined) setSelectedFamily(filters.family);
    if (filters.category !== undefined) setSelectedCategory(filters.category);
    if (filters.productType !== undefined) setSelectedProductType(filters.productType);
    if (filters.brand !== undefined) setSelectedBrand(filters.brand);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
        <span className="cursor-pointer hover:text-slate-600">Inicio</span>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-600 font-semibold">Catálogo</span>
      </nav>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-10">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explorá nuestra gama de artículos de confort y tecnología para tu hogar.
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-100 py-1.5 px-4 rounded-xl">
          {productsData ? `${productsData.total} Productos` : 'Cargando...'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar (Desktop only) */}
        <aside className="hidden lg:block space-y-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por SKU, nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-[0_5px_15px_rgba(0,0,0,0.01)]"
            />
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          </div>

          <ProductFilters
            families={families}
            selectedFamily={selectedFamily}
            selectedCategory={selectedCategory}
            selectedProductType={selectedProductType}
            brands={brands}
            selectedBrand={selectedBrand}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Main Column */}
        <main className="lg:col-span-3 space-y-12">
          {/* Mobile search & filters bar */}
          <div className="flex gap-4 lg:hidden mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por SKU, nombre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red/30 focus:bg-white transition-all"
              />
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            </div>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3 text-sm font-semibold text-brand-black hover:bg-slate-100 transition-all active:scale-95 shadow-[0_5px_15px_rgba(0,0,0,0.01)]"
            >
              <SlidersHorizontal className="h-4.5 w-4.5 text-slate-500" />
              Filtros
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
              <span className="text-sm font-semibold text-slate-400">Buscando productos...</span>
            </div>
          ) : productsData && productsData.items.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-6">
              {productsData.items.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm">
                <Grid className="h-6 w-6" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="font-display font-bold text-lg">No encontramos productos</h3>
                <p className="text-sm text-slate-400">
                  Prueba cambiando los filtros o la búsqueda seleccionada.
                </p>
              </div>
            </div>
          )}

          {productsData && (
            <Pagination
              currentPage={page}
              totalPages={productsData.totalPages}
              onPageChange={setPage}
            />
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          />

          {/* Drawer sheet */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display font-bold text-lg text-brand-black flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-brand-red" />
                Filtros
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1">
              <ProductFilters
                families={families}
                selectedFamily={selectedFamily}
                selectedCategory={selectedCategory}
                selectedProductType={selectedProductType}
                brands={brands}
                selectedBrand={selectedBrand}
                onFilterChange={handleFilterChange}
              />
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-2xl text-sm font-semibold transition-all shadow-md active:scale-95 text-center mt-auto"
            >
              Aplicar y Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
