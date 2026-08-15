'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth';
import { fetchApi } from '../../../lib/api';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Settings,
  RefreshCw,
  LogOut,
  Loader2,
  Menu,
  X,
  Tag,
  Image as ImageIcon,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setCheckingAuth(false);
      return;
    }

    if (!isAuthenticated) {
      clearAuth();
      router.push('/admin/login');
    } else {
      setCheckingAuth(false);
    }
  }, [isAuthenticated, pathname, router, clearAuth]);

  const handleLogout = async () => {
    await fetchApi('/api/auth/logout', { method: 'POST' });
    clearAuth();
    router.push('/');
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4">
        <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Verificando sesión...</span>
      </div>
    );
  }

  // If path is login, render children directly without admin header/sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const mainNav = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/productos', label: 'Productos', icon: ShoppingBag },
    { href: '/admin/ofertas', label: 'Ofertas Destacadas', icon: Tag },
  ];

  const systemNav = [
    { href: '/admin/configuracion?tab=banners', label: 'Banners de Portada', icon: ImageIcon },
    { href: '/admin/configuracion?tab=payment_cards', label: 'Tarjetas Informativas', icon: CreditCard },
    { href: '/admin/configuracion?tab=general', label: 'Configuración General', icon: Settings },
    { href: '/admin/sync-logs', label: 'Logs de Sincronización', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* 1. Header Único del Panel de Administración */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <img
              src="/images/logo/logo-slogan-negro.svg"
              alt="Logo Papes Confort"
              className="h-8 md:h-9 w-auto"
            />
          </Link>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-brand-navy/10 text-brand-navy font-extrabold text-[11px] uppercase tracking-wider">
            Panel Admin
          </span>
        </div>

        {/* Desktop User Info & Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            title="Abrir tienda en nueva pestaña"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver Tienda</span>
          </Link>

          {user && (
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
              {user.email}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Mobile Single Hamburger Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer md:hidden"
          aria-label="Menú del panel de administración"
        >
          {isSidebarOpen ? <X className="h-5 w-5 text-brand-red" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* 2. Layout Body (Sidebar + Content / Mobile Menu Drawer) */}
      <div className="flex-grow flex flex-col md:flex-row min-w-0">
        {/* Mobile Fullscreen Admin Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-white p-6 flex flex-col justify-between overflow-y-auto md:hidden border-t border-slate-100">
            <div className="space-y-6">
              {/* Sección 1: Gestión Comercial */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Gestión Comercial
                </p>
                <div className="space-y-1">
                  {mainNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-brand-red text-white shadow-xs'
                            : 'text-slate-700 bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Sección 2: Portada y Sistema */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Portada & Sistema
                </p>
                <div className="space-y-1">
                  {systemNav.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href.split('?')[0] &&
                      (!item.href.includes('tab=') || pathname.includes(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-brand-navy text-white shadow-xs'
                            : 'text-slate-700 bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile Admin Footer: User Email + Ver Tienda + Cerrar Sesión */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              {user && (
                <div className="px-1">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    Sesión Administrador
                  </p>
                  <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver Tienda</span>
                </Link>
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Permanent Sidebar */}
        <aside
          className={`hidden md:flex flex-col ${
            isCollapsed ? 'w-20' : 'w-64'
          } border-r border-slate-200/80 bg-white justify-between shrink-0 sticky top-16 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out`}
        >
          <div className="p-3 space-y-6 overflow-y-auto flex-grow overflow-x-hidden">
            {/* Sección 1: Gestión Comercial */}
            <div className="space-y-1.5">
              {!isCollapsed ? (
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                  Gestión Comercial
                </p>
              ) : (
                <div className="my-2 border-t border-slate-100" title="Gestión Comercial" />
              )}
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-2.5'
                    } rounded-2xl text-xs font-bold tracking-wide transition-all ${
                      isActive
                        ? 'bg-brand-red text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Sección 2: Portada y Sistema */}
            <div className="space-y-1.5">
              {!isCollapsed ? (
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                  Portada & Sistema
                </p>
              ) : (
                <div className="my-2 border-t border-slate-100" title="Portada & Sistema" />
              )}
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href.split('?')[0] &&
                  (!item.href.includes('tab=') || pathname.includes(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-2.5'
                    } rounded-2xl text-xs font-bold tracking-wide transition-all ${
                      isActive
                        ? 'bg-brand-navy text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Collapse Toggle Button */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => {
                const nextState = !isCollapsed;
                setIsCollapsed(nextState);
                localStorage.setItem('admin_sidebar_collapsed', String(nextState));
              }}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
              } rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer`}
              title={isCollapsed ? 'Expandir panel lateral' : 'Contraer panel lateral'}
            >
              {!isCollapsed && <span>Contraer menú</span>}
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronLeft className="h-4 w-4 shrink-0" />
              )}
            </button>
          </div>
        </aside>


        {/* Main Content Area */}
        <main className="flex-grow p-4 sm:p-6 md:p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
