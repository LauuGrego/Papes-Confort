'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { CustomerAuthResponseDto } from '@papes-confort/shared';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleAuthButton({
  mode = 'login',
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { setAuth } = useAuthStore();
  const { load: loadCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      const err = 'No se recibió el token de autenticación de Google.';
      setAuthError(err);
      onError?.(err);
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetchApi<CustomerAuthResponseDto>('/api/customer/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token, res.data.customer);
        await loadCart().catch(() => {});

        onSuccess?.();

        const destination = redirectParam || '/mi-cuenta';
        router.push(destination);
      } else {
        const errorMsg = res.error || 'No se pudo iniciar sesión con Google.';
        setAuthError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error de conexión con el servidor.';
      setAuthError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMsg = 'Error al conectar con Google. Por favor intenta nuevamente.';
    setAuthError(errorMsg);
    onError?.(errorMsg);
  };

  if (!GOOGLE_CLIENT_ID) {
    // Si no está configurada la variable en este entorno, mostramos un botón informativo
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => {
            setAuthError('La autenticación con Google requiere configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
          }}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <GoogleIcon className="h-5 w-5" />
          <span>{mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}</span>
        </button>

        {authError && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{authError}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {loading ? (
        <div className="w-full h-12 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-sm font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
          <span>Conectando con Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center google-btn-container [&>div]:w-full [&>div>iframe]:mx-auto">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            shape="pill"
            text={mode === 'register' ? 'signup_with' : 'continue_with'}
            locale="es"
            width="100%"
          />
        </div>
      )}

      {authError && (
        <div className="mt-3 w-full flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09C3.26 21.36 7.35 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.38l4.01-3.09z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.26 6.62l4.01 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
        fill="#EA4335"
      />
    </svg>
  );
}
