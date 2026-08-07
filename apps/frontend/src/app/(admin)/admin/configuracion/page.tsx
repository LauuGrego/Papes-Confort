'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../../../stores/auth';

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [safetyStock, setSafetyStock] = useState('1');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  const { user, accessToken, setAuth } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [confirmPasswordForEmail, setConfirmPasswordForEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  const handleRequestPasswordChange = async () => {
    if (!newPassword) return;
    setRequestLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/change-password-request', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });

    if (res.success) {
      setSuccessMsg(`Código de confirmación enviado a ${user?.email || 'tu correo'}.`);
      setShowCodeInput(true);
    } else {
      setErrorMsg(res.error || 'Error al solicitar el cambio de contraseña.');
    }
    setRequestLoading(false);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !confirmPasswordForEmail) return;
    setEmailChangeLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail,
        currentPassword: confirmPasswordForEmail,
      }),
    });

    if (res.success && res.data) {
      setSuccessMsg('Correo electrónico de administrador actualizado con éxito.');
      if (user) {
        setAuth({ ...user, email: res.data.email }, accessToken);
      }
      setNewEmail('');
      setConfirmPasswordForEmail('');
    } else {
      setErrorMsg(res.error || 'Error al cambiar el correo electrónico.');
    }
    setEmailChangeLoading(false);
  };

  const handleConfirmPasswordChange = async () => {
    if (!verificationCode) return;
    setConfirmLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/confirm-password-change', {
      method: 'POST',
      body: JSON.stringify({ code: verificationCode }),
    });

    if (res.success) {
      setSuccessMsg('Contraseña de administrador actualizada con éxito.');
      setNewPassword('');
      setVerificationCode('');
      setShowCodeInput(false);
    } else {
      setErrorMsg(res.error || 'Código incorrecto o expirado.');
    }
    setConfirmLoading(false);
  };

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const res = await fetchApi<Record<string, string>>('/api/admin/settings');
      if (res.success && res.data) {
        setSafetyStock(res.data.safety_stock || '1');
        setWhatsappNumber(res.data.whatsapp_number || '');
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const body = {
      safety_stock: safetyStock,
      whatsapp_number: whatsappNumber,
    };

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (res.success) {
      setSuccessMsg('Configuraciones guardadas exitosamente.');
    } else {
      setErrorMsg(res.error || 'Error al guardar las configuraciones.');
    }
    setSaveLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-black">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-slate-400">
          Ajusta las variables de control comercial del e-commerce.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {successMsg && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-600">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">WhatsApp de Consultas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Número de teléfono celular para recibir consultas de compras y financiación.
              Usa el formato internacional sin símbolos (ej: 5493445454261).
            </p>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="549XXXXXXXXXX"
              className="w-64 px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all mt-1"
            />
          </div>

          <div className="border-t border-slate-50 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center gap-2 rounded-full bg-brand-red hover:bg-brand-red-dark px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Configuración
            </button>
          </div>
        </form>

        {/* Sección de Cambio de Correo */}
        <div className="space-y-6 border-t border-slate-50 pt-6 mt-8">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Correo Electrónico de Administrador</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modifica la dirección de correo a la cual se envían las confirmaciones de seguridad del panel.
            </p>
          </div>

          <form onSubmit={handleEmailChange} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nuevo Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@papesconfort.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Confirmar con Contraseña Actual
              </label>
              <input
                type="password"
                required
                placeholder="Contraseña actual"
                value={confirmPasswordForEmail}
                onChange={(e) => setConfirmPasswordForEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={emailChangeLoading || !newEmail || !confirmPasswordForEmail}
              className="px-6 py-2.5 h-10 rounded-full bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {emailChangeLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Actualizar Correo
            </button>
          </form>
        </div>

        {/* Sección de Cambio de Contraseña */}
        <div className="space-y-6 border-t border-slate-50 pt-6 mt-8">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Contraseña de Administrador</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cambia la contraseña de acceso al panel de administración. Requiere confirmación por correo electrónico.
            </p>
          </div>

          {!showCodeInput ? (
            <div className="flex gap-3 max-w-md items-end">
              <div className="flex-grow space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleRequestPasswordChange}
                disabled={!newPassword || requestLoading}
                className="px-6 py-2.5 h-10 rounded-full bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {requestLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Solicitar Código'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md bg-slate-50/50 border border-slate-100 p-5 rounded-3xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Código de Confirmación (enviado a {user?.email || 'tu correo'})
                </label>
                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all text-center font-mono text-lg tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPasswordChange}
                  disabled={!verificationCode || confirmLoading}
                  className="flex-grow px-6 py-2.5 h-10 rounded-full bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {confirmLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar Cambio'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeInput(false);
                    setVerificationCode('');
                  }}
                  className="px-4 py-2.5 h-10 rounded-full border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
