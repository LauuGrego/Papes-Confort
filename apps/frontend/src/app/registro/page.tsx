'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { CustomerAuthResponseDto, isValidCuilCuit, formatCuilCuit } from '@papes-confort/shared';
import { useAuthStore } from '../../stores/auth';
import { useCartStore } from '../../stores/cart';
import GoogleAuthButton from '../../components/GoogleAuthButton';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/mi-cuenta';

  const { setAuth } = useAuthStore();
  const { load: loadCart } = useCartStore();

  // Step: 1 = Formulario de datos, 2 = Código de confirmación
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cuilCuit, setCuilCuit] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  // Step 2 state
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleCuilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCuilCuit(raw);
    setCuilCuit(formatted);
  };

  // Paso 1: Solicitar registro y enviar código
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Por favor completa los campos requeridos (Nombre, Email y Contraseña).');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (cuilCuit.trim()) {
      if (!isValidCuilCuit(cuilCuit)) {
        setError('El CUIL/CUIT ingresado no es válido (verificar 11 dígitos y dígito verificador).');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetchApi<{ message?: string }>('/api/customer/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          cuilCuit: cuilCuit.trim() || undefined,
          marketingOptIn,
        }),
      });

      if (res.success) {
        setStep(2);
        setCooldown(60);
        setSuccessInfo(`Hemos enviado un código de 6 dígitos a ${email.trim().toLowerCase()}`);
      } else {
        setError(res.error || 'No se pudo procesar el registro. Verifica los datos ingresados.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setSuccessInfo(null);
    setLoading(true);

    try {
      const res = await fetchApi<{ message?: string }>('/api/customer/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          cuilCuit: cuilCuit.trim() || undefined,
          marketingOptIn,
        }),
      });

      if (res.success) {
        setCooldown(60);
        setSuccessInfo(`Nuevo código enviado a ${email.trim().toLowerCase()}`);
      } else {
        setError(res.error || 'No se pudo reenviar el código.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Confirmar código y activar cuenta
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Por favor ingresa el código de 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi<CustomerAuthResponseDto>('/api/customer/auth/register-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token, res.data.customer);
        await loadCart().catch(() => {});
        router.push(redirectPath);
      } else {
        setError(res.error || 'Código incorrecto o expirado.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const isCuilValid = cuilCuit.trim() ? isValidCuilCuit(cuilCuit) : null;

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
      {/* Encabezado */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black tracking-tight text-brand-black">
          {step === 1 ? 'Crear Cuenta' : 'Verificá tu Correo'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {step === 1
            ? 'Registrate para agilizar tus compras y seguir tus pedidos'
            : 'Ingresá el código de 6 dígitos que te enviamos para activar tu cuenta'}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successInfo && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}

      {/* PASO 1: Formulario de datos */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Botón Registro con Google */}
          <div>
            <GoogleAuthButton mode="register" />
          </div>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">o completar con tus datos</span>
            </div>
          </div>

          <form onSubmit={handleRequestCode} className="space-y-4">
            {/* Nombre y Apellido */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre y Apellido *
              </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico *
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

          {/* Teléfono & CUIL/CUIT en 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3445 123456"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  CUIL / CUIT
                </label>
                {isCuilValid === true && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Válido
                  </span>
                )}
              </div>
              <input
                type="text"
                value={cuilCuit}
                onChange={handleCuilChange}
                placeholder="XX-XXXXXXXX-X"
                maxLength={13}
                className={`w-full px-4 py-3 rounded-2xl border text-sm text-brand-black placeholder-slate-400 outline-none focus:bg-white focus:ring-4 transition-all ${
                  isCuilValid === false
                    ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100'
                    : isCuilValid === true
                    ? 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-100'
                    : 'border-slate-200 bg-slate-50/50 focus:border-brand-red focus:ring-brand-red/10'
                }`}
              />
            </div>
          </div>

          {/* Contraseña & Confirmación en 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirmar Contraseña *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
              />
            </div>
          </div>

          {/* Marketing Opt-In Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-red focus:ring-brand-red/20 cursor-pointer accent-brand-red"
              />
              <span className="text-xs text-slate-600 leading-relaxed font-medium">
                Deseo recibir <strong>ofertas, promociones y nuevos ingresos</strong> por correo electrónico.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando código...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span>Continuar (Verificar Email)</span>
              </>
            )}
          </button>
        </form>
        </div>
      )}

      {/* PASO 2: Ingreso de código de 6 dígitos */}
      {step === 2 && (
        <form onSubmit={handleConfirmCode} className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-1">Código enviado a:</p>
            <p className="text-sm font-bold text-brand-black">{email}</p>
          </div>

          <div>
            <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Código de Confirmación (6 dígitos)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full h-14 text-center text-2xl font-mono font-black tracking-[0.5em] rounded-2xl border border-slate-200 bg-slate-50 text-brand-black placeholder-slate-300 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length < 6}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-brand-red text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Confirmar y Crear Cuenta</span>
              </>
            )}
          </button>

          {/* Reenviar código / Volver */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode('');
                setError(null);
              }}
              className="text-slate-500 hover:text-brand-black font-semibold underline"
            >
              Corregir mis datos o email
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={handleResendCode}
              className="inline-flex items-center gap-1.5 font-bold text-brand-red hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          ¿Ya tienes una cuenta?{' '}
          <Link
            href={`/ingresar${redirectPath !== '/mi-cuenta' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
            className="font-bold text-brand-red hover:underline"
          >
            Iniciá sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <main className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="w-full max-w-lg mb-6">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-red transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Volver a la tienda
        </Link>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-red" /></div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
