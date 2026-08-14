'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  User,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Tag,
  ChevronDown,
  ChevronRight,
  Layers,
  Award,
  Sparkles,
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
  const { isAuthenticated, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide store header on admin pages so admin layout renders its own single header & sidebar
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [families, setFamilies] = useState<Family[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [offers, setOffers] = useState<OfferDto[]>([]);

  // Mobile accordion state
  const [mobileExpandedSection, setMobileExpandedSection] = useState<'ofertas' | 'rubros' | 'marcas' | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAuthenticated && !pathname.startsWith('/admin')) {
      fetchApi('/api/auth/logout', { method: 'POST' });
      clearAuth();
    }
  }, [pathname, isAuthenticated, clearAuth]);

  useEffect(() => {
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

  const handleLogout = async () => {
    await fetchApi('/api/auth/logout', { method: 'POST' });
    clearAuth();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md text-brand-black">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo and Text */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/images/logo/isotipo.svg"
            alt="Isotipo Papes Confort"
            className="h-[45px] w-[45px] shrink-0 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-display text-base sm:text-xl font-extrabold tracking-wider text-brand-black group-hover:text-brand-red transition-colors duration-200 whitespace-nowrap">
              PAPES CONFORT
            </span>
            <span className="hidden sm:block text-xs tracking-widest text-slate-500 uppercase font-light -mt-0.5 whitespace-nowrap">
              Servicio y calidad asegurados
            </span>
          </div>
        </Link>

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium tracking-wide">
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
            <Link
              href="/catalogo"
              className="text-slate-600 hover:text-brand-red transition-colors duration-200 flex items-center gap-1.5 cursor-pointer py-1"
            >
              <span>Rubros y Subrubros</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-brand-red" />
            </Link>

            <div className="absolute -left-16 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="w-[620px] max-h-[480px] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-5 shadow-xl ring-1 ring-black/5 custom-scrollbar">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Layers className="h-4 w-4 text-brand-red" />
                    <span className="font-display font-extrabold text-xs tracking-wider uppercase">
                      Rubros y Categorías
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {families.length} Rubros disponibles
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {families.map((fam) => (
                    <div key={fam.id} className="space-y-2">
                      <Link
                        href={`/catalogo?type=${fam.slug}`}
                        className="inline-flex items-center justify-between w-full text-sm font-bold text-slate-800 hover:text-brand-red transition-colors group/fam"
                      >
                        <span>{fam.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold group-hover/fam:bg-brand-red/10 group-hover/fam:text-brand-red">
                          {fam.productCount}
                        </span>
                      </Link>

                      {fam.categories.length > 0 && (
                        <div className="flex flex-col gap-1 pl-2 border-l-2 border-slate-100 ml-1">
                          {fam.categories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/catalogo?type=${fam.slug}&categoryId=${cat.id}`}
                              className="text-xs text-slate-500 hover:text-brand-red hover:translate-x-0.5 transition-all py-0.5 flex items-center justify-between"
                            >
                              <span>{cat.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({cat.productCount})
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-5 pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Encontrá todo para tu hogar</span>
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-red hover:gap-2 transition-all"
                  >
                    Ver todo el catálogo
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* DESPLEGABLE: Marcas */}
          <div className="relative group py-6">
            <Link
              href="/catalogo"
              className="text-slate-600 hover:text-brand-red transition-colors duration-200 flex items-center gap-1.5 cursor-pointer py-1"
            >
              <span>Marcas</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 text-slate-400 group-hover:text-brand-red" />
            </Link>

            <div className="absolute -left-12 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="w-80 max-h-[420px] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-xl ring-1 ring-black/5 custom-scrollbar">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Award className="h-4 w-4 text-brand-red" />
                    <span className="font-display font-extrabold text-xs tracking-wider uppercase">
                      Nuestras Marcas
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {brands.length} Marcas
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/catalogo?brandId=${brand.id}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-brand-red hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                    >
                      <span className="truncate">{brand.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        ({brand.productCount})
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-4 pt-2.5 text-center">
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-red hover:underline"
                  >
                    Filtrar por marca en catálogo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Action icons (Cart & Auth) */}
        <div className="flex items-center gap-3">
          {/* VISTA ESCRITORIO: Botones individuales */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/carrito"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 group bg-slate-50 hover:bg-slate-100"
              aria-label="Carrito de compras"
            >
              <ShoppingBag className="h-5 w-5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white transition-all duration-200 scale-100">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                <Link
                  href="/admin"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 bg-slate-50 hover:bg-slate-100 group"
                  title="Panel de Administración"
                  aria-label="Panel de Administración"
                >
                  <LayoutDashboard className="h-4.5 w-4.5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 bg-slate-50 hover:bg-slate-100 group cursor-pointer"
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                >
                  <LogOut className="h-4.5 w-4.5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="flex h-10 px-4 items-center justify-center gap-2 rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red bg-slate-50 hover:bg-slate-100 group"
                aria-label="Ingresar al Panel de Control"
              >
                <User className="h-4.5 w-4.5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
                <span className="hidden sm:inline">Acceso Admin</span>
              </Link>
            )}
          </div>

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
                        <div className="pl-4 pr-2 py-1 flex flex-col gap-2 border-l-2 border-slate-100 ml-4 my-1 max-h-60 overflow-y-auto custom-scrollbar">
                          {families.map((fam) => (
                            <div key={fam.id} className="flex flex-col gap-1">
                              <Link
                                href={`/catalogo?type=${fam.slug}`}
                                onClick={() => setMenuOpen(false)}
                                className="text-xs font-bold text-slate-800 hover:text-brand-red py-1 flex items-center justify-between"
                              >
                                <span>{fam.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({fam.productCount})
                                </span>
                              </Link>
                              {fam.categories.map((cat) => (
                                <Link
                                  key={cat.id}
                                  href={`/catalogo?type=${fam.slug}&categoryId=${cat.id}`}
                                  onClick={() => setMenuOpen(false)}
                                  className="text-[11px] text-slate-500 hover:text-brand-red pl-3 py-0.5"
                                >
                                  • {cat.name}
                                </Link>
                              ))}
                            </div>
                          ))}
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
                        <div className="pl-4 pr-2 py-1 grid grid-cols-2 gap-1 border-l-2 border-slate-100 ml-4 my-1 max-h-48 overflow-y-auto custom-scrollbar">
                          {brands.map((brand) => (
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
                      <ShoppingBag className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                      <span>Mi Carrito</span>
                    </div>
                    {totalItems > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>

                  {/* Autenticación / Panel */}
                  {isAuthenticated ? (
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
                    <Link
                      href="/admin/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all group"
                    >
                      <User className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-red transition-colors" />
                      <span>Acceso Admin</span>
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
