'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AdminLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '/admin';
    router.replace(`/ingresar?redirect=${encodeURIComponent(redirect)}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
      <p className="text-xs text-slate-500 font-medium">Redirigiendo a inicio de sesión</p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
        </div>
      }
    >
      <AdminLoginRedirect />
    </Suspense>
  );
}

