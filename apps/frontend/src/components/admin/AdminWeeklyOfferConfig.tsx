'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Tag,
} from 'lucide-react';
import { HomeWeeklyOfferDto, DEFAULT_WEEKLY_OFFER } from '@papes-confort/shared';
import { fetchApi } from '../../lib/api';

interface AdminWeeklyOfferConfigProps {
  initialConfig?: HomeWeeklyOfferDto;
  onSaved?: (config: HomeWeeklyOfferDto) => void;
}

export default function AdminWeeklyOfferConfig({
  initialConfig,
  onSaved,
}: AdminWeeklyOfferConfigProps) {
  const [config, setConfig] = useState<HomeWeeklyOfferDto>(
    initialConfig ? { ...DEFAULT_WEEKLY_OFFER, ...initialConfig } : DEFAULT_WEEKLY_OFFER
  );

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...DEFAULT_WEEKLY_OFFER, ...initialConfig });
    }
  }, [initialConfig]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof HomeWeeklyOfferDto, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file: File) => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await fetchApi<{ url: string }>('/api/admin/settings/upload-image', {
          method: 'POST',
          body: JSON.stringify({ image: base64Data, folder: 'papes-confort/landing/offers' }),
        });

        if (res.success && res.data?.url) {
          handleChange('imageUrl', res.data.url);
        } else {
          alert(res.error || 'Error al subir la imagen a Cloudinary.');
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error al subir imagen a Cloudinary:', err);
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        home_weekly_offer: JSON.stringify(config),
      }),
    });

    if (res.success) {
      setSuccessMsg('Oferta de la semana guardada exitosamente en la base de datos.');
      if (onSaved) onSaved(config);
    } else {
      setErrorMsg(res.error || 'Error al guardar la oferta de la semana.');
    }
    setSaveLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-brand-red" />
            <h2 className="text-lg font-extrabold text-slate-800">
              Bloque Comercial: Ofertas de la Semana
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalizá el bloque destacado en gradiente oscuro, la tarjeta spotlight con su foto en Cloudinary, cuotas y enlaces comerciales.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleChange('isActive', !config.isActive)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              config.isActive !== false
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {config.isActive !== false ? (
              <>
                <Eye className="h-4 w-4" />
                <span>Bloque Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Bloque Oculto</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-md shadow-brand-red/20 disabled:opacity-60 cursor-pointer"
          >
            {saveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Oferta</span>
              </>
            )}
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Textos y Promociones */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Badge Superior
              </label>
              <input
                type="text"
                value={config.badge}
                onChange={(e) => handleChange('badge', e.target.value)}
                placeholder="Oportunidad de la semana"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 outline-none focus:border-brand-red focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Título Principal
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="OFERTAS DE LA SEMANA"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-extrabold text-slate-800 outline-none focus:border-brand-red focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subtítulo / Bajada
            </label>
            <textarea
              rows={2}
              value={config.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 outline-none focus:border-brand-red focus:bg-white resize-none"
            />
          </div>

          {/* Micro-beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pill Cuotas
              </label>
              <input
                type="text"
                value={config.cuotasText}
                onChange={(e) => handleChange('cuotasText', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pill Contado
              </label>
              <input
                type="text"
                value={config.cashDiscountText}
                onChange={(e) => handleChange('cashDiscountText', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pill Garantía
              </label>
              <input
                type="text"
                value={config.warrantyText}
                onChange={(e) => handleChange('warrantyText', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Botón Principal de la Sección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Texto Botón Principal
              </label>
              <input
                type="text"
                value={config.mainCtaText}
                onChange={(e) => handleChange('mainCtaText', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Spotlight de Producto */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
            Tarjeta Spotlight de Producto
          </span>

          {/* Imagen y subida a Cloudinary */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group">
            <img
              src={config.imageUrl}
              alt={config.productHeadline}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/categories/climatizacion.jpg';
              }}
            />
            {/* Badge de descuento */}
            <div className="absolute top-2.5 right-2.5 z-10 bg-brand-red text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md pointer-events-none">
              Promoción Especial
            </div>
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer p-2 text-center">
              {uploadingImage ? (
                <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
              ) : (
                <>
                  <Upload className="h-5 w-5 mb-1" />
                  <span>Subir imagen a Cloudinary</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </label>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Categoría Spotlight
            </label>
            <input
              type="text"
              value={config.tagCategory}
              onChange={(e) => handleChange('tagCategory', e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Titular del Producto
            </label>
            <input
              type="text"
              value={config.productHeadline}
              onChange={(e) => handleChange('productHeadline', e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Texto Enlace
            </label>
            <input
              type="text"
              value={config.linkText}
              onChange={(e) => handleChange('linkText', e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white outline-none focus:border-brand-red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
