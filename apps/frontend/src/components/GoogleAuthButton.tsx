'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Eye, EyeOff, Loader2, AlertCircle, Lock, ShieldCheck, X } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { GoogleAuthResponseDto } from '@papes-confort/shared';
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
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const { setAuth } = useAuthStore();
  const { load: loadCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estado para solicitar contraseña a usuarios nuevos de Google
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savedCredential, setSavedCredential] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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
      const res = await fetchApi<GoogleAuthResponseDto>('/api/customer/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (res.success && res.data) {
        // Si el usuario es nuevo y necesita definir una contraseña
        if (res.data.requiresPassword && res.data.tempUser) {
          setSavedCredential(credentialResponse.credential);
          setTempUser(res.data.tempUser);
          setShowPasswordModal(true);
          setLoading(false);
          return;
        }

        // Si ya tenía contraseña o es admin
        if (res.data.user && res.data.token) {
          setAuth(res.data.user, res.data.token, res.data.customer);

          onSuccess?.();

          if (res.data.user.type === 'admin') {
            const destination = redirectParam && redirectParam !== '/mi-cuenta' ? redirectParam : '/admin';
            window.location.replace(destination);
          } else {
            await loadCart().catch(() => {});
            const destination = redirectParam || '/mi-cuenta';
            window.location.replace(destination);
          }
        }
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

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!savedCredential) {
      setModalError('Sesión de Google expirada. Por favor intenta nuevamente.');
      return;
    }

    if (!password || password.length < 6) {
      setModalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setModalError('Las contraseñas no coinciden.');
      return;
    }

    setModalLoading(true);

    try {
      const res = await fetchApi<GoogleAuthResponseDto>('/api/customer/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: savedCredential,
          password,
        }),
      });

      if (res.success && res.data && res.data.user && res.data.token) {
        setAuth(res.data.user, res.data.token, res.data.customer);
        setShowPasswordModal(false);

        onSuccess?.();

        if (res.data.user.type === 'admin') {
          const destination = redirectParam && redirectParam !== '/mi-cuenta' ? redirectParam : '/admin';
          window.location.replace(destination);
        } else {
          await loadCart().catch(() => {});
          const destination = redirectParam || '/mi-cuenta';
          window.location.replace(destination);
        }
      } else {
        setModalError(res.error || 'No se pudo registrar la contraseña. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error de conexión al guardar la contraseña.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleGoogleError = () => {
    const errorMsg = 'Error al conectar con Google. Por favor intenta nuevamente.';
    setAuthError(errorMsg);
    onError?.(errorMsg);
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="w-full flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            setAuthError('La autenticación con Google requiere configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
          }}
          className="w-full max-w-sm h-11 flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          <span>{mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}</span>
        </button>

        {authError && (
          <div className="mt-3 w-full max-w-sm flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{authError}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-full max-w-sm h-11 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold">
            <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
            <span>Conectando con Google...</span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center google-btn-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              shape="pill"
              text={mode === 'register' ? 'signup_with' : 'continue_with'}
              locale="es"
            />
          </div>
        )}

        {authError && (
          <div className="mt-3 w-full max-w-sm flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {/* Modal para crear contraseña al registrarse con Google */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setSavedCredential(null);
                setTempUser(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              {tempUser?.avatarUrl ? (
                <img
                  src={tempUser.avatarUrl}
                  alt={tempUser.name}
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-brand-red/20 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="h-7 w-7" />
                </div>
              )}
              <h2 className="text-xl font-black tracking-tight text-brand-black">
                ¡Hola, {tempUser?.name || 'Cliente'}!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Creá una contraseña para tu cuenta de Papes Confort ({tempUser?.email}). Podrás acceder tanto con Google como con esta clave.
              </p>
            </div>

            {modalError && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={modalLoading || password.length < 6 || password !== confirmPassword}
                className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando y accediendo...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Crear Contraseña y Acceder</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
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
