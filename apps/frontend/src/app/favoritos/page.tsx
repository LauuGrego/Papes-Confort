'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';

export default function FavoritosRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated) {
      router.replace('/mi-cuenta/favoritos');
    } else {
      router.replace(`/ingresar?redirect=${encodeURIComponent('/mi-cuenta/favoritos')}`);
    }
  }, [hasHydrated, isAuthenticated, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
      <p className="text-xs text-slate-500 font-medium">Cargando tus favoritos...</p>
    </div>
  );
}
