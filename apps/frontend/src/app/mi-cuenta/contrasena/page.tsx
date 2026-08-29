'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';

export default function SeguridadPage() {
  const router = useRouter();
  const { user, customer, clearAuth } = useAuthStore();

  const hasNoExistingPassword = customer?.hasPassword === false;

  const [activeTab, setActiveTab] = useState<'password' | 'email'>('password');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [passwordCode, setPasswordCode] = useState('');
  const [passwordCooldown, setPasswordCooldown] = useState(0);

  // Email change state
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [emailCode, setEmailCode] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEmailCurrent, setShowEmailCurrent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Timers
  useEffect(() => {
    if (passwordCooldown <= 0) return;
    const interval = setInterval(() => {
      setPasswordCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [passwordCooldown]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const interval = setInterval(() => {
      setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [emailCooldown]);

  // Tab switch reset
  const handleTabSwitch = (tab: 'password' | 'email') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // --- PASSWORD CHANGE FLOW ---
  const handleRequestPasswordCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if ((!hasNoExistingPassword && !currentPassword) || !newPassword) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las nuevas contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi<{ message?: string }>('/api/customer/account/change-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasNoExistingPassword ? undefined : currentPassword,
          newPassword,
        }),
      });

      if (res.success) {
        setPasswordStep(2);
        setPasswordCooldown(60);
        setSuccessMessage(`Hemos enviado un código de 6 dígitos a tu correo (${user?.email}).`);
      } else {
        setErrorMessage(res.error || 'No se pudo enviar el código de confirmación.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passwordCode.trim() || passwordCode.trim().length < 6) {
      setErrorMessage('Ingresa el código de 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi<{ message?: string }>('/api/customer/account/change-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passwordCode.trim() }),
      });

      if (res.success) {
        setSuccessMessage('Contraseña actualizada con éxito. Redirigiendo para volver a iniciar sesión...');
        setTimeout(() => {
          clearAuth();
          router.push('/ingresar');
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Código incorrecto o expirado.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // --- EMAIL CHANGE FLOW ---
  const handleRequestEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!emailCurrentPassword || !newEmail.trim()) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim().toLowerCase())) {
      setErrorMessage('El formato del nuevo correo es inválido.');
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      setErrorMessage('El nuevo correo no puede ser igual al correo actual.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi<{ message?: string }>('/api/customer/account/change-email-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: emailCurrentPassword,
          newEmail: newEmail.trim().toLowerCase(),
        }),
      });

      if (res.success) {
        setEmailStep(2);
        setEmailCooldown(60);
        setSuccessMessage(`Código enviado a tu correo actual (${user?.email}).`);
      } else {
        setErrorMessage(res.error || 'No se pudo enviar el código de confirmación.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailCode.trim() || emailCode.trim().length < 6) {
      setErrorMessage('Ingresa el código de 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi<{ message?: string }>('/api/customer/account/change-email-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode.trim() }),
      });

      if (res.success) {
        setSuccessMessage('Correo actualizado con éxito. Redirigiendo para volver a iniciar sesión...');
        setTimeout(() => {
          clearAuth();
          router.push('/ingresar');
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Código incorrecto o expirado.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-lg font-bold text-brand-black flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-red" />
          Seguridad y Credenciales
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Actualizá tu contraseña o correo electrónico con validación segura por código de email.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
        <button
          onClick={() => handleTabSwitch('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-slate-500 hover:text-brand-black'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>{hasNoExistingPassword ? 'Definir Contraseña' : 'Cambiar Contraseña'}</span>
        </button>

        <button
          onClick={() => handleTabSwitch('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'email'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-slate-500 hover:text-brand-black'
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Cambiar Correo</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: CAMBIAR / DEFINIR CONTRASEÑA */}
      {activeTab === 'password' && (
        <>
          {passwordStep === 1 ? (
            <form onSubmit={handleRequestPasswordCode} className="space-y-4">
              {!hasNoExistingPassword && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-full bg-brand-red text-xs font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Solicitar Código al Correo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-1">Código enviado a tu correo:</p>
                <p className="text-sm font-bold text-brand-black">{user?.email}</p>
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
                  value={passwordCode}
                  onChange={(e) => setPasswordCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full h-12 text-center text-xl font-mono font-black tracking-[0.5em] rounded-2xl border border-slate-200 bg-slate-50 text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || passwordCode.trim().length < 6}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-brand-red text-xs font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Confirmar Cambio de Contraseña</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordStep(1);
                    setPasswordCode('');
                    setErrorMessage(null);
                  }}
                  className="text-slate-500 hover:text-brand-black font-semibold underline cursor-pointer"
                >
                  Volver atrás
                </button>

                <button
                  type="button"
                  disabled={passwordCooldown > 0 || loading}
                  onClick={handleRequestPasswordCode}
                  className="inline-flex items-center gap-1.5 font-bold text-brand-red hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {passwordCooldown > 0 ? `Reenviar en ${passwordCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: CAMBIAR CORREO ELECTRÓNICO */}
      {activeTab === 'email' && (
        <>
          {emailStep === 1 ? (
            <form onSubmit={handleRequestEmailCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Actual
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100/70 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nuevo Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nuevo@correo.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña Actual (Para autorizar el cambio) *
                </label>
                <div className="relative">
                  <input
                    type={showEmailCurrent ? 'text' : 'password'}
                    required
                    value={emailCurrentPassword}
                    onChange={(e) => setEmailCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailCurrent(!showEmailCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    tabIndex={-1}
                  >
                    {showEmailCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-full bg-brand-red text-xs font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Solicitar Código al Correo Actual</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmEmailChange} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-1">Código enviado a tu correo actual:</p>
                <p className="text-sm font-bold text-brand-black">{user?.email}</p>
                <p className="text-xs text-brand-red mt-1">Nuevo correo a establecer: {newEmail}</p>
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
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full h-12 text-center text-xl font-mono font-black tracking-[0.5em] rounded-2xl border border-slate-200 bg-slate-50 text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || emailCode.trim().length < 6}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-full bg-brand-red text-xs font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Confirmar Cambio de Correo</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmailStep(1);
                    setEmailCode('');
                    setErrorMessage(null);
                  }}
                  className="text-slate-500 hover:text-brand-black font-semibold underline cursor-pointer"
                >
                  Volver atrás
                </button>

                <button
                  type="button"
                  disabled={emailCooldown > 0 || loading}
                  onClick={handleRequestEmailCode}
                  className="inline-flex items-center gap-1.5 font-bold text-brand-red hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {emailCooldown > 0 ? `Reenviar en ${emailCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
