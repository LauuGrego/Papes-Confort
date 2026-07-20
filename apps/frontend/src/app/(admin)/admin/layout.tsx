'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth';
import { fetchApi } from '../../../lib/api';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Settings, RefreshCw, LogOut, Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (pathname === '/admin/login') {
        setCheckingAuth(false);
        return;
      }

      if (!isAuthenticated) {
        // Try silent refresh
        const res = await fetchApi<{ token: string; user: any }>('/api/auth/refresh', {
          method: 'POST',
        });

        if (res.success && res.data) {
          setAuth(res.data.user, res.data.token);
          setCheckingAuth(false);
        } else {
          clearAuth();
          router.push('/admin/login');
        }
      } else {
        setCheckingAuth(false);
      }
    }
    verifySession();
  }, [isAuthenticated, pathname, router, setAuth, clearAuth]);

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
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    { href: '/admin/sync-logs', label: 'Logs de Sincronización', icon: RefreshCw },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-100 bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo container */}
          <div className="p-6 border-b border-slate-50 flex justify-center">
            <Link href="/admin">
              <img
                src="/images/logo/logo-slogan-negro.svg"
                alt="Logo Papes Confort"
                className="h-12 w-auto"
              />
            </Link>
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all text-left"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
