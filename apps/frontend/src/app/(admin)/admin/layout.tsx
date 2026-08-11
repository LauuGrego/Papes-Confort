'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth';
import { fetchApi } from '../../../lib/api';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Settings, RefreshCw, LogOut, Loader2, Menu, X, Tag } from 'lucide-react';

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

  const menuItems = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/productos', label: 'Productos', icon: ShoppingBag },
    { href: '/admin/ofertas', label: 'Ofertas', icon: Tag },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    { href: '/admin/sync-logs', label: 'Logs de Sincronización', icon: RefreshCw },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50">
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-100 bg-white flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo container */}
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <Link href="/admin" onClick={() => setIsSidebarOpen(false)}>
              <img
                src="/images/logo/logo-slogan-negro.svg"
                alt="Logo Papes Confort"
                className="h-10 w-auto"
              />
            </Link>
            <button
              className="md:hidden p-1.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
 
          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-brand-red/10 text-brand-red'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
 
        {/* Footer info (User & Logout) */}
        <div className="p-4 border-t border-slate-50 space-y-4">
          {user && (
            <div className="px-4 py-2">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Usuario</p>
              <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all text-left cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
 
      {/* Main Content Container with Mobile Header */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Mobile Admin Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 md:hidden sticky top-0 z-30">
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
