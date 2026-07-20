'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [safetyStock, setSafetyStock] = useState('1');
  const [whatsappNumber, setWhatsappNumber] = useState('');

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
            <h3 className="text-sm font-bold text-slate-700">Stock de Seguridad (Colchón)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cantidad de unidades que se restarán preventivamente del stock real del local al mostrar en la web.
              Evita que se vendan artículos que acaban de ser facturados físicamente.
            </p>
            <input
              type="number"
              min="0"
              required
              value={safetyStock}
              onChange={(e) => setSafetyStock(e.target.value)}
              className="w-32 px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all mt-1"
            />
          </div>

          <div className="space-y-2 border-t border-slate-50 pt-6">
            <h3 className="text-sm font-bold text-slate-700">WhatsApp de Consultas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Número de teléfono celular para recibir consultas de compras y financiación.
              Usa el formato internacional sin símbolos (ej: 5493445431872).
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
      </div>
    </div>
  );
}
