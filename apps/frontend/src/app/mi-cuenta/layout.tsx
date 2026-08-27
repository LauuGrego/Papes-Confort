'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Lock, LogOut, Loader2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { fetchApi } from '../../lib/api';

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, customer, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.type !== 'customer')) {
      router.push(`/ingresar?redirect=${encodeURIComponent(pathname || '/mi-cuenta')}`);
    }
  }, [hasHydrated, isAuthenticated, user, pathname, router]);

  const handleLogout = async () => {
    try {
      await fetchApi('/api/customer/auth/logout', { method: 'POST' });
    } catch {}
    clearAuth();
    router.push('/');
  };

  if (!hasHydrated || !isAuthenticated || user?.type !== 'customer') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
        <p className="text-xs text-slate-500 font-medium">Verificando sesión...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/mi-cuenta', label: 'Mis Datos', icon: User, exact: true },
    { href: '/mi-cuenta/pedidos', label: 'Mis Pedidos', icon: Package },
    { href: '/mi-cuenta/contrasena', label: 'Contraseña y Seguridad', icon: Lock },
  ];

  return (
    <div className="min-h-[85vh] bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado del Perfil */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center font-black text-xl">
              {(customer?.name || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-black">{customer?.name || user?.name || 'Cliente'}</h1>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:border-red-200 hover:bg-red-50 text-xs font-bold text-slate-600 hover:text-red-600 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar Sesión
          </button>
        </div>

        {/* Layout de 2 columnas: Sidebar + Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-1 bg-white rounded-3xl p-3 border border-slate-100 shadow-sm space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-brand-red'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
                </Link>
              );
            })}
          </aside>

          {/* Contenido Principal */}
          <main className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
