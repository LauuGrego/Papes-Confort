'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  User,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Layers,
  Award,
  Sparkles,
  Search,
  Package,
} from 'lucide-react';
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';
import { fetchApi } from '../lib/api';
import { OfferDto } from '@papes-confort/shared';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface Family {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  categories: Category[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export default function Header() {
  const { totalItems, load } = useCartStore();
  const { user, customer, isAuthenticated, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [families, setFamilies] = useState<Family[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown expansion states (in-place expand instead of navigating to catalog)
  const [showAllFamilies, setShowAllFamilies] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const [showAllFamiliesMobile, setShowAllFamiliesMobile] = useState(false);
  const [showAllBrandsMobile, setShowAllBrandsMobile] = useState(false);

  const toggleFamilyExpand = (familyId: string) => {
    setExpandedFamilies((prev) => ({
      ...prev,
      [familyId]: !prev[familyId],
    }));
  };

  // Mobile accordion state
  const [mobileExpandedSection, setMobileExpandedSection] = useState<'ofertas' | 'rubros' | 'marcas' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/catalogo') {
      const params = new URLSearchParams(window.location.search);
      const searchVal = params.get('search');
      if (searchVal !== null) {
        setSearchQuery(searchVal);
      }
    }
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalogo');
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.type === 'customer') {
        await fetchApi('/api/customer/auth/logout', { method: 'POST' });
      } else {
        await fetchApi('/api/auth/logout', { method: 'POST' });
      }
    } catch {}
    clearAuth();
    if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/mi-cuenta'))) {
      router.push('/');
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin')) return;

    async function loadNavigationData() {
      const [categoriesRes, brandsRes, offersRes] = await Promise.all([
        fetchApi<Family[]>('/api/categories', { cache: 'no-store' }),
        fetchApi<Brand[]>('/api/brands', { cache: 'no-store' }),
        fetchApi<OfferDto[]>('/api/offers', { cache: 'no-store' }),
      ]);
      if (categoriesRes.success && categoriesRes.data) {
        setFamilies(categoriesRes.data);
      }
      if (brandsRes.success && brandsRes.data) {
        setBrands(brandsRes.data);
      }
      if (offersRes.success && offersRes.data) {
        setOffers(offersRes.data);
      }
    }
    loadNavigationData();

    const handleOffersUpdated = () => {
      loadNavigationData();
    };

    window.addEventListener('offers-updated', handleOffersUpdated);
    return () => {
      window.removeEventListener('offers-updated', handleOffersUpdated);
    };
  }, [pathname]);

  // Hide store header on admin pages so admin layout renders its own single header & sidebar
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md text-brand-black">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo and Text */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <img
            src="/images/logo/isotipo.svg"
            alt="Isotipo Papes Confort"
            className="h-9 w-9 sm:h-[45px] sm:w-[45px] shrink-0 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-display text-sm sm:text-xl font-extrabold tracking-wider text-brand-black group-hover:text-brand-red transition-colors duration-200 whitespace-nowrap">
              PAPES CONFORT
            </span>
            <span className="hidden sm:block text-xs tracking-widest text-slate-500 uppercase font-light -mt-0.5 whitespace-nowrap">
              Servicio y calidad asegurados
            </span>
          </div>
        </Link>

        {/* Barra de búsqueda (Escritorio) - Ubicada entre el logo y los links de acceso */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs lg:max-w-sm xl:max-w-md mx-4 lg:mx-6 relative items-center group">
          <input
            type="text"
            placeholder="Buscar marcas, rubros, productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-2xl border border-slate-200 bg-slate-50/80 text-xs sm:text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red/50 focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all duration-200 shadow-2xs"
          />
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-focus-within:text-brand-red transition-colors" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Navigation links & Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium tracking-wide shrink-0">
          <Link
            href="/"
            className="text-slate-600 hover:text-brand-red hover-underline-reveal transition-colors duration-200"
          >
            Inicio
          </Link>

          {/* DESPLEGABLE: Ofertas (Solo ofertas dinámicas existentes) */}
          {offers.length > 0 && (
            <div className="relative group py-6">
              <Link
                href={`/catalogo?offer=${offers[0].slug}`}
                className="text-brand-red font-semibold hover:text-brand-red-dark transition-colors duration-200 flex items-center gap-1.5 bg-brand-red/5 px-3 py-1.5 rounded-full border border-brand-red/15 hover:bg-brand-red/10 cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Ofertas</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
              </Link>

              <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="w-64 rounded-3xl border border-slate-100 bg-white p-3 shadow-xl ring-1 ring-black/5 flex flex-col gap-1">
                  {offers.map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/catalogo?offer=${offer.slug}`}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-brand-red/5 text-slate-700 hover:text-brand-red transition-colors group/item"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Sparkles className="h-4 w-4 text-brand-red shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{offer.name}</span>
                          {offer.discountPercent > 0 && (
                            <span className="text-[10px] text-brand-red font-semibold">
                              {offer.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover/item:translate-x-1 transition-transform shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DESPLEGABLE: Rubros y Subrubros */}
          <div className="relative group py-6">
            <button
              type="button"
              className="text-slate-600 hover:text-brand-red transition-colors duration-200 flex items-center gap-1.5 cursor-pointer py-1 select-none"
            >
              <span>Rubros y Subrubros</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-brand-red" />
            </button>

            <div className="absolute right-[-40px] lg:right-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="w-[430px] max-h-[440px] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-xl ring-1 ring-black/5 custom-scrollbar">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Layers className="h-4 w-4 text-brand-red" />
                    <span className="font-display font-extrabold text-[11px] tracking-wider uppercase">
                      Rubros y Categorías
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {families.length} Rubros
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(showAllFamilies ? families : families.slice(0, 4)).map((fam) => {
                    const isExpanded = !!expandedFamilies[fam.id];
                    const displayedCats = isExpanded ? fam.categories : fam.categories.slice(0, 3);
                    const remainingCats = fam.categories.length - 3;

                    return (
                      <div key={fam.id} className="space-y-1.5">
                        {fam.categories.length > 3 ? (
                          <button
                            type="button"
                            onClick={() => toggleFamilyExpand(fam.id)}
                            className="inline-flex items-center justify-between w-full text-xs font-bold text-slate-800 hover:text-brand-red transition-colors cursor-pointer text-left group/fam"
                          >
                            <span className="truncate pr-1">{fam.name}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold group-hover/fam:bg-brand-red/10 group-hover/fam:text-brand-red shrink-0">
                              {fam.productCount}
                            </span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center justify-between w-full text-xs font-bold text-slate-800 select-none">
                            <span className="truncate pr-1">{fam.name}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                              {fam.productCount}
                            </span>
                          </div>
                        )}

                        {fam.categories.length > 0 && (
                          <div className="flex flex-col gap-0.5 pl-2 border-l-2 border-slate-100 ml-0.5">
                            {displayedCats.map((cat) => (
                              <Link
                                key={cat.id}
                                href={`/catalogo?type=${fam.slug}&categoryId=${cat.id}`}
                                className="text-[11px] text-slate-500 hover:text-brand-red hover:translate-x-0.5 transition-all py-0.5 flex items-center justify-between"
                              >
                                <span className="truncate pr-1">{cat.name}</span>
                                <span className="text-[9px] text-slate-400 font-normal shrink-0">
                                  ({cat.productCount})
                                </span>
                              </Link>
                            ))}
                            {fam.categories.length > 3 && (
                              <button
                                type="button"
                                onClick={() => toggleFamilyExpand(fam.id)}
                                className="text-[10px] font-semibold text-brand-red hover:text-brand-red-dark transition-colors py-0.5 flex items-center gap-0.5 cursor-pointer text-left"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Ver menos</span>
                                    <ChevronUp className="h-2.5 w-2.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Ver más ({remainingCats})</span>
                                    <ChevronDown className="h-2.5 w-2.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {families.length > 4 && (
                  <div className="border-t border-slate-100 mt-3 pt-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllFamilies(!showAllFamilies)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-red hover:text-brand-red-dark transition-colors cursor-pointer"
                    >
                      <span>
                        {showAllFamilies
                          ? 'Mostrar menos rubros'
                          : `Ver todos los rubros (+${families.length - 4})`}
                      </span>
                      {showAllFamilies ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DESPLEGABLE: Marcas */}
          <div className="relative group py-6">
            <button
              type="button"
              className="text-slate-600 hover:text-brand-red transition-colors duration-200 flex items-center gap-1.5 cursor-pointer py-1 select-none"
            >
              <span>Marcas</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-brand-red" />
            </button>

            <div className="absolute right-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="w-72 max-h-[380px] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-3.5 shadow-xl ring-1 ring-black/5 custom-scrollbar">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Award className="h-4 w-4 text-brand-red" />
                    <span className="font-display font-extrabold text-[11px] tracking-wider uppercase">
                      Nuestras Marcas
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {brands.length} Marcas
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  {(showAllBrands ? brands : brands.slice(0, 6)).map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/catalogo?brandId=${brand.id}`}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-brand-red hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                    >
                      <span className="truncate text-[11px]">{brand.name}</span>
                      <span className="text-[9px] text-slate-400 font-normal ml-1">
                        ({brand.productCount})
                      </span>
                    </Link>
                  ))}
                </div>

                {brands.length > 6 && (
                  <div className="border-t border-slate-100 mt-3 pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllBrands(!showAllBrands)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-red hover:text-brand-red-dark transition-colors cursor-pointer"
                    >
                      <span>
                        {showAllBrands
                          ? 'Mostrar menos marcas'
                          : `Ver todas las marcas (+${brands.length - 6})`}
                      </span>
                      {showAllBrands ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carrito */}
          <Link
            href="/carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 group bg-slate-50 hover:bg-slate-100 shrink-0"
            aria-label="Carrito de compras"
          >
            <ShoppingCart className="h-5 w-5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white transition-all duration-200 scale-100">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Autenticación / Cuenta / Panel Admin */}
          {isAuthenticated ? (
            user?.type === 'admin' ? (
              <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                <Link
                  href="/admin"
                  className="flex h-10 px-3.5 items-center gap-2 rounded-full border border-brand-red/20 hover:border-brand-red bg-brand-red/5 hover:bg-brand-red text-brand-red hover:text-white transition-all duration-200 text-xs font-bold shadow-sm"
                  title="Panel de Administración"
                  aria-label="Panel de Administración"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Panel Admin</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all duration-200 cursor-pointer"
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative border-l border-slate-100 pl-3">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex h-10 items-center gap-2 px-3.5 rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer group"
                  aria-expanded={userDropdownOpen}
                  aria-label="Menú de usuario"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-[100px] truncate">
                    {customer?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Mi Cuenta'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-brand-black truncate">
                          {customer?.name || user?.name || 'Cliente'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/mi-cuenta"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Mis Datos
                      </Link>
                      <Link
                        href="/mi-cuenta/pedidos"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        Mis Pedidos
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-red-400" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          ) : (
            <Link
              href="/ingresar"
              className="flex h-10 px-4 items-center justify-center gap-2 rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red bg-slate-50 hover:bg-slate-100 group shrink-0"
              aria-label="Ingresar a mi cuenta"
            >
              <User className="h-4.5 w-4.5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
              <span>Ingresar</span>
            </Link>
          )}
        </div>

        {/* Action icons (Mobile menu toggle button) */}
        <div className="flex items-center md:hidden">

          {/* VISTA MÓVIL: Botón de menú desplegable único */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 px-4 items-center justify-center gap-2 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red cursor-pointer group"
              aria-expanded={menuOpen}
              aria-label="Menú del sitio"
            >
              {menuOpen ? (
                <X className="h-4.5 w-4.5 text-slate-600 group-hover:text-brand-red transition-colors" />
              ) : (
                <Menu className="h-4.5 w-4.5 text-slate-600 group-hover:text-brand-red transition-colors" />
              )}
              <span className="hidden sm:inline">Menú</span>
              {totalItems > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            {menuOpen && (
              <>
                {/* Backdrop for closing */}
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />

                {/* Dropdown Menu Box */}
                <div className="absolute right-0 mt-2.5 w-72 origin-top-right rounded-3xl border border-slate-100 bg-white p-3 shadow-xl ring-1 ring-black/5 z-20 flex flex-col gap-1 max-h-[85vh] overflow-y-auto custom-scrollbar">
                  {/* Navegación móvil */}
                  <div className="border-b border-slate-100 pb-2 mb-2 flex flex-col gap-1">
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all"
                    >
                      <span>Inicio</span>
                    </Link>

                    {/* Acordeón Móvil: Ofertas (Solo si hay ofertas activas) */}
                    {offers.length > 0 && (
                      <div className="flex flex-col">
                        <button
                          onClick={() =>
                            setMobileExpandedSection(
                              mobileExpandedSection === 'ofertas' ? null : 'ofertas'
                            )
                          }
                          className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-brand-red bg-brand-red/5 hover:bg-brand-red/10 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>Ofertas</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              mobileExpandedSection === 'ofertas' ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {mobileExpandedSection === 'ofertas' && (
                          <div className="pl-6 pr-2 py-1 flex flex-col gap-1 border-l-2 border-brand-red/20 ml-4 my-1">
                            {offers.map((offer) => (
                              <Link
                                key={offer.id}
                                href={`/catalogo?offer=${offer.slug}`}
                                onClick={() => setMenuOpen(false)}
                                className="text-xs text-slate-700 hover:text-brand-red py-1.5 font-medium flex items-center justify-between"
                              >
                                <span>{offer.name}</span>
                                {offer.discountPercent > 0 && (
                                  <span className="text-[10px] text-brand-red font-bold">
                                    {offer.discountPercent}%
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Acordeón Móvil: Rubros */}
                    <div className="flex flex-col">
                      <button
                        onClick={() =>
                          setMobileExpandedSection(
                            mobileExpandedSection === 'rubros' ? null : 'rubros'
                          )
                        }
                        className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all"
                      >
                        <span>Rubros y Subrubros</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            mobileExpandedSection === 'rubros' ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {mobileExpandedSection === 'rubros' && (
                        <div className="pl-4 pr-2 py-1 flex flex-col gap-2 border-l-2 border-slate-100 ml-4 my-1 max-h-72 overflow-y-auto custom-scrollbar">
                          {(showAllFamiliesMobile ? families : families.slice(0, 5)).map((fam) => {
                            const isExpanded = !!expandedFamilies[fam.id];
                            const displayedCats = isExpanded ? fam.categories : fam.categories.slice(0, 4);
                            const remainingCats = fam.categories.length - 4;

                            return (
                              <div key={fam.id} className="flex flex-col gap-1">
                                {fam.categories.length > 4 ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleFamilyExpand(fam.id)}
                                    className="text-xs font-bold text-slate-800 hover:text-brand-red py-1 flex items-center justify-between text-left cursor-pointer"
                                  >
                                    <span>{fam.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({fam.productCount})
                                    </span>
                                  </button>
                                ) : (
                                  <div className="text-xs font-bold text-slate-800 py-1 flex items-center justify-between select-none">
                                    <span>{fam.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({fam.productCount})
                                    </span>
                                  </div>
                                )}
                                {displayedCats.map((cat) => (
                                  <Link
                                    key={cat.id}
                                    href={`/catalogo?type=${fam.slug}&categoryId=${cat.id}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="text-[11px] text-slate-500 hover:text-brand-red pl-3 py-0.5"
                                  >
                                    • {cat.name}
                                  </Link>
                                ))}
                                {fam.categories.length > 4 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleFamilyExpand(fam.id)}
                                    className="text-[10px] font-semibold text-brand-red pl-3 py-0.5 flex items-center gap-1 cursor-pointer text-left"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <span>Ver menos</span>
                                        <ChevronUp className="h-2.5 w-2.5" />
                                      </>
                                    ) : (
                                      <>
                                        <span>+ Ver más ({remainingCats})</span>
                                        <ChevronDown className="h-2.5 w-2.5" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {families.length > 5 && (
                            <button
                              type="button"
                              onClick={() => setShowAllFamiliesMobile(!showAllFamiliesMobile)}
                              className="inline-flex items-center justify-between mt-1 px-3 py-2 rounded-xl bg-brand-red/5 text-brand-red text-xs font-bold border border-brand-red/15 hover:bg-brand-red/10 transition-all cursor-pointer"
                            >
                              <span>
                                {showAllFamiliesMobile
                                  ? 'Mostrar menos rubros'
                                  : `Ver todos los rubros (+${families.length - 5})`}
                              </span>
                              {showAllFamiliesMobile ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acordeón Móvil: Marcas */}
                    <div className="flex flex-col">
                      <button
                        onClick={() =>
                          setMobileExpandedSection(
                            mobileExpandedSection === 'marcas' ? null : 'marcas'
                          )
                        }
                        className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all"
                      >
                        <span>Marcas</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            mobileExpandedSection === 'marcas' ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {mobileExpandedSection === 'marcas' && (
                        <div className="pl-4 pr-2 py-1 flex flex-col gap-1 border-l-2 border-slate-100 ml-4 my-1 max-h-60 overflow-y-auto custom-scrollbar">
                          <div className="grid grid-cols-2 gap-1">
                            {(showAllBrandsMobile ? brands : brands.slice(0, 6)).map((brand) => (
                              <Link
                                key={brand.id}
                                href={`/catalogo?brandId=${brand.id}`}
                                onClick={() => setMenuOpen(false)}
                                className="text-xs text-slate-600 hover:text-brand-red py-1 truncate"
                              >
                                {brand.name}
                              </Link>
                            ))}
                          </div>
                          {brands.length > 6 && (
                            <button
                              type="button"
                              onClick={() => setShowAllBrandsMobile(!showAllBrandsMobile)}
                              className="inline-flex items-center justify-between mt-1 px-3 py-2 rounded-xl bg-brand-red/5 text-brand-red text-xs font-bold border border-brand-red/15 hover:bg-brand-red/10 transition-all cursor-pointer"
                            >
                              <span>
                                {showAllBrandsMobile
                                  ? 'Mostrar menos marcas'
                                  : `Ver todas las marcas (+${brands.length - 6})`}
                              </span>
                              {showAllBrandsMobile ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carrito */}
                  <Link
                    href="/carrito"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                      <span>Mi Carrito</span>
                    </div>
                    {totalItems > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>

                  {/* Autenticación / Cuenta / Panel */}
                  {isAuthenticated ? (
                    user?.type === 'admin' ? (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all group"
                        >
                          <LayoutDashboard className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                          <span>Panel Admin</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition-all text-left w-full cursor-pointer group"
                        >
                          <LogOut className="h-4.5 w-4.5 text-red-400 group-hover:text-red-500 transition-colors" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/mi-cuenta"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all group"
                        >
                          <User className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                          <span>Mi Cuenta ({customer?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Perfil'})</span>
                        </Link>
                        <Link
                          href="/mi-cuenta/pedidos"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all group"
                        >
                          <Package className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                          <span>Mis Pedidos</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition-all text-left w-full cursor-pointer group"
                        >
                          <LogOut className="h-4.5 w-4.5 text-red-400 group-hover:text-red-500 transition-colors" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <Link
                        href="/ingresar"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all group"
                      >
                        <User className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                        <span>Ingresar / Crear Cuenta</span>
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de búsqueda Móvil (Visible siempre en pantalla en dispositivos móviles) */}
      <div className="md:hidden px-4 pb-3 pt-0.5">
        <form onSubmit={handleSearch} className="relative flex items-center group w-full">
          <input
            type="text"
            placeholder="Buscar marcas, rubros, productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 bg-slate-50/90 text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red/50 focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all duration-200 shadow-2xs"
          />
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 group-focus-within:text-brand-red transition-colors" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>
    </header>
  );
}
