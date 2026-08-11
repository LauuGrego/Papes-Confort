'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Grid, Search, Loader2 } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { ProductDto, PaginatedResponse } from '@papes-confort/shared';
import ProductCard from '../../components/products/ProductCard';
import Pagination from '../../components/Pagination';

function CatalogoContent() {
  const searchParams = useSearchParams();
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
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 1. Read search/filter/page parameters from URL whenever searchParams change
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const searchParam = searchParams.get('search');
    const familyParam = searchParams.get('type');
    const categoryParam = searchParams.get('categoryId');
    const productTypeParam = searchParams.get('productType');
    const brandParam = searchParams.get('brandId');

    setPage(pageParam ? Number(pageParam) : 1);
    setSelectedFamily(familyParam || null);
    setSelectedCategory(categoryParam || null);
    setSelectedProductType(productTypeParam || null);
    setSelectedBrand(brandParam || null);
    setSearch(searchParam || '');
    setSearchInput(searchParam || '');
    
    setInitialLoaded(true);
  }, [searchParams]);

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
    params.set('limit', '20');

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

  const hasActiveFilters = Boolean(selectedFamily || selectedCategory || selectedProductType || selectedBrand || search);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="cursor-pointer hover:text-slate-600">Inicio</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-600 font-semibold">Catálogo</span>
      </nav>

      {/* Header & Integrated Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explorá nuestra gama de artículos de confort y tecnología para tu hogar.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="Buscar por marca, rubro, nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red/40 focus:bg-white transition-all"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 py-2.5 px-4 rounded-2xl whitespace-nowrap">
            {productsData ? `${productsData.total} Productos` : 'Cargando...'}
          </div>
        </div>
      </div>

      {/* Active filters bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-brand-red/5 p-3.5 rounded-2xl border border-brand-red/15">
          <span className="text-xs font-bold text-brand-red uppercase tracking-wider mr-1">
            Filtro activo:
          </span>
          {selectedFamily && (
            <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 font-semibold shadow-2xs">
              Rubro: {families.find((f) => f.slug === selectedFamily)?.name || selectedFamily}
            </span>
          )}
          {selectedCategory && (
            <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 font-semibold shadow-2xs">
              Subrubro seleccionado
            </span>
          )}
          {selectedBrand && (
            <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 font-semibold shadow-2xs">
              Marca: {brands.find((b) => b.id === selectedBrand)?.name || 'Seleccionada'}
            </span>
          )}
          {selectedProductType && (
            <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 font-semibold shadow-2xs">
              Tipo: {selectedProductType === 'OFFER' ? 'Oferta Especial' : selectedProductType === 'OUTLET' ? 'Outlet / Saldos' : 'Promo Bancaria'}
            </span>
          )}
          {search && (
            <span className="text-xs bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 font-semibold shadow-2xs">
              Búsqueda: "{search}"
            </span>
          )}
          <button
            onClick={() => {
              setSelectedFamily(null);
              setSelectedCategory(null);
              setSelectedProductType(null);
              setSelectedBrand(null);
              setSearch('');
              setSearchInput('');
              window.history.replaceState(null, '', '/catalogo');
            }}
            className="text-xs text-brand-red font-bold underline ml-auto hover:text-brand-red-dark cursor-pointer px-2 py-1"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Main Full-Width Products Grid */}
      <main className="space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
            <span className="text-sm font-semibold text-slate-400">Buscando productos...</span>
          </div>
        ) : productsData && productsData.items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando catálogo...</span>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}
