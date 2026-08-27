'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ingresar?redirect=/admin');
  }, [router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
      <p className="text-xs text-slate-500 font-medium">Redirigiendo a inicio de sesión unificado...</p>
    </div>
  );
}
