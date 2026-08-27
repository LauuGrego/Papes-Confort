'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, LogIn, AlertCircle } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { LoginResponseDto } from '@papes-confort/shared';
import { useAuthStore } from '../../stores/auth';
import { useCartStore } from '../../stores/cart';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { user, isAuthenticated, hasHydrated, setAuth } = useAuthStore();
  const { load: loadCart } = useCartStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya está autenticado, redirigir automáticamente al dashboard o a mi-cuenta
  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated) {
      if (user?.type === 'admin') {
        const dest = redirectParam && redirectParam !== '/mi-cuenta' ? redirectParam : '/admin';
        window.location.replace(dest);
      } else {
        const dest = redirectParam || '/mi-cuenta';
        window.location.replace(dest);
      }
    }
  }, [hasHydrated, isAuthenticated, user, redirectParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      // Unified login endpoint
      const res = await fetchApi<LoginResponseDto>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token, res.data.customer);

        if (res.data.user.type === 'admin') {
          const destination = redirectParam && redirectParam !== '/mi-cuenta' ? redirectParam : '/admin';
          window.location.replace(destination);
        } else {
          await loadCart().catch(() => {});
          const destination = redirectParam || '/mi-cuenta';
          window.location.replace(destination);
        }
      } else {
        setError(res.error || 'Correo electrónico o contraseña incorrectos.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Inténtalo nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black tracking-tight text-brand-black">Iniciar Sesión</h1>
        <p className="text-xs text-slate-500 mt-1">Ingresá tus credenciales para acceder a tu cuenta</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Correo Electrónico
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Ingresando...</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Ingresar</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          ¿Aún no tienes una cuenta de cliente?{' '}
          <Link
            href={`/registro${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
            className="font-bold text-brand-red hover:underline"
          >
            Registrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function IngresarPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="w-full max-w-md mb-6">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-red transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Volver a la tienda
        </Link>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-red" /></div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
