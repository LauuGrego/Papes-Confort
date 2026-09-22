'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { HomeTrustBarItemDto, DEFAULT_TRUST_BAR } from '@papes-confort/shared';
import { fetchApi } from '../../lib/api';

interface AdminTrustBarConfigProps {
  initialItems?: HomeTrustBarItemDto[];
  onSaved?: (items: HomeTrustBarItemDto[]) => void;
}

export default function AdminTrustBarConfig({
  initialItems,
  onSaved,
}: AdminTrustBarConfigProps) {
  const [items, setItems] = useState<HomeTrustBarItemDto[]>(
    initialItems && initialItems.length > 0 ? initialItems : DEFAULT_TRUST_BAR
  );

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleItemChange = (index: number, field: keyof HomeTrustBarItemDto, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        home_trust_bar: JSON.stringify(items),
      }),
    });

    if (res.success) {
      setSuccessMsg('Barra de beneficios guardada exitosamente en la base de datos.');
      if (onSaved) onSaved(items);
    } else {
      setErrorMsg(res.error || 'Error al guardar la barra de beneficios.');
    }
    setSaveLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-red" />
            <h2 className="text-lg font-extrabold text-slate-800">
              Barra de Beneficios (TrustBar)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalizá los 4 pilares de confianza que aparecen debajo de la cabecera (Envíos, Financiación, Ofertas y Garantía).
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-md shadow-brand-red/20 disabled:opacity-60 cursor-pointer shrink-0"
        >
          {saveLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar Beneficios</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3.5 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grilla de los 4 beneficios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
              item.isActive !== false
                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                : 'bg-slate-100/50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Beneficio #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleItemChange(idx, 'isActive', item.isActive === false ? true : false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                  item.isActive !== false
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                {item.isActive !== false ? (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>Oculto</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Ícono
                </label>
                <select
                  value={item.icon}
                  onChange={(e) => handleItemChange(idx, 'icon', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-brand-red"
                >
                  <option value="truck">Camión (Envíos)</option>
                  <option value="credit-card">Tarjeta (Financiación)</option>
                  <option value="percent">Porcentaje (Ofertas)</option>
                  <option value="shield">Escudo (Garantía)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Enlace / Anclaje
                </label>
                <input
                  type="text"
                  value={item.href}
                  onChange={(e) => handleItemChange(idx, 'href', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-mono text-slate-600 outline-none focus:border-brand-red"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
