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
  Tag,
  Image as ImageIcon,
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
    router.push('/admin/login');
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4">
        <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Verificando sesión...</span>
      </div>
    );
  }

  // If path is login, render children directly without sidebar
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
    { href: '/admin/configuracion?tab=general', label: 'Configuración General', icon: Settings },
    { href: '/admin/sync-logs', label: 'Logs de Sincronización', icon: RefreshCw },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] bg-slate-50/50 relative">
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 top-20 z-30 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Positioned cleanly under the sticky header (top-20 / 80px) */}
      <aside
        className={`fixed top-20 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:sticky md:top-20 md:h-[calc(100vh-5rem)] md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-grow p-4 space-y-6">
          {/* Section 1: Gestión Comercial */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Gestión Comercial
            </p>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-brand-red text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Section 2: Portada y Sistema */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Portada & Sistema
            </p>
            {systemNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split('?')[0] && (
                !item.href.includes('tab=') || pathname.includes(item.href)
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info (User & Logout) */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50 shrink-0">
          {user && (
            <div className="px-2">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Usuario Sesión</p>
              <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all text-left cursor-pointer border border-rose-100/60"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container with Mobile Header */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Mobile Admin Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-100 md:hidden sticky top-0 z-30">
          <Link href="/admin">
            <img
              src="/images/logo/logo-slogan-negro.svg"
              alt="Logo Papes Confort"
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Main Scrollable Area */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
