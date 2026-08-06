'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';
import { fetchApi } from '../lib/api';

export default function Header() {
  const { totalItems, load } = useCartStore();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAuthenticated && !pathname.startsWith('/admin')) {
      fetchApi('/api/auth/logout', { method: 'POST' });
      clearAuth();
    }
  }, [pathname, isAuthenticated, clearAuth]);

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
            className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-display text-sm sm:text-lg font-extrabold tracking-wider text-brand-black group-hover:text-brand-red transition-colors duration-200 whitespace-nowrap">
              PAPES CONFORT
            </span>
            <span className="hidden sm:block text-[10px] tracking-widest text-slate-500 uppercase font-light -mt-0.5 whitespace-nowrap">
              Servicio y calidad asegurados
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/" className="text-slate-600 hover:text-brand-red hover-underline-reveal transition-colors duration-200">
            Inicio
          </Link>
          <Link href="/catalogo" className="text-slate-600 hover:text-brand-red hover-underline-reveal transition-colors duration-200">
            Catálogo
          </Link>
        </nav>

        {/* Action icons (Cart & Auth) */}
        <div className="flex items-center gap-3">
          <div className="relative">
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
                <div className="absolute right-0 mt-2.5 w-60 origin-top-right rounded-3xl border border-slate-100 bg-white p-2.5 shadow-xl ring-1 ring-black/5 z-20 flex flex-col gap-1">
                  {/* Navegación móvil */}
                  <div className="md:hidden border-b border-slate-50 pb-2 mb-2 flex flex-col gap-1">
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all"
                    >
                      <span>Inicio</span>
                    </Link>
                    <Link
                      href="/catalogo"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-red hover:bg-slate-50 transition-all"
                    >
                      <span>Catálogo</span>
                    </Link>
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

