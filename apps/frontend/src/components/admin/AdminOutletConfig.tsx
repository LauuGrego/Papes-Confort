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
  Sparkles,
  MessageSquare,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { HomeOutletDto, DEFAULT_OUTLET_SECTION } from '@papes-confort/shared';
import { fetchApi } from '../../lib/api';

interface AdminOutletConfigProps {
  initialConfig?: HomeOutletDto;
  onSaved?: (config: HomeOutletDto) => void;
}

export default function AdminOutletConfig({
  initialConfig,
  onSaved,
}: AdminOutletConfigProps) {
  const [config, setConfig] = useState<HomeOutletDto>(
    initialConfig ? { ...DEFAULT_OUTLET_SECTION, ...initialConfig } : DEFAULT_OUTLET_SECTION
  );

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...DEFAULT_OUTLET_SECTION, ...initialConfig });
    }
  }, [initialConfig]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof HomeOutletDto, value: any) => {
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
          body: JSON.stringify({ image: base64Data, folder: 'papes-confort/landing/outlet' }),
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
        home_outlet_section: JSON.stringify(config),
      }),
    });

    if (res.success) {
      setSuccessMsg('Sección Outlet de la landing guardada exitosamente.');
      if (onSaved) onSaved(config);
    } else {
      setErrorMsg(res.error || 'Error al guardar la sección Outlet.');
    }
    setSaveLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-extrabold text-slate-800">
              Sección Destacada: Rubro Outlet
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalizá los textos, enlaces, imagen de portada y mensajes de WhatsApp del acceso directo a los productos de Outlet en la portada.
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
                <span>Guardar Sección Outlet</span>
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
        {/* Columna Izquierda: Formulario de edición */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Badge Superior
              </label>
              <input
                type="text"
                value={config.badge}
                onChange={(e) => handleChange('badge', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Título Parte 1
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-extrabold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Título Resaltado (Dorado)
              </label>
              <input
                type="text"
                value={config.titleHighlight}
                onChange={(e) => handleChange('titleHighlight', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-extrabold text-amber-600 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción del Bloque
            </label>
            <textarea
              rows={3}
              value={config.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 outline-none focus:border-amber-500 focus:bg-white leading-relaxed resize-none"
            />
          </div>

          {/* Botones y acciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Texto Botón Catálogo Outlet
              </label>
              <input
                type="text"
                value={config.primaryBtnText}
                onChange={(e) => handleChange('primaryBtnText', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Enlace Botón Catálogo
              </label>
              <input
                type="text"
                value={config.primaryBtnUrl}
                onChange={(e) => handleChange('primaryBtnUrl', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Texto Botón WhatsApp
              </label>
              <input
                type="text"
                value={config.whatsappText}
                onChange={(e) => handleChange('whatsappText', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Código o Nombre de Rubro en GesCom (Ej: 09)
              </label>
              <input
                type="text"
                value={config.rubroGescom}
                onChange={(e) => handleChange('rubroGescom', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-amber-700 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mensaje Preconfigurado de WhatsApp
            </label>
            <div className="relative">
              <MessageSquare className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={config.whatsappMessage}
                onChange={(e) => handleChange('whatsappMessage', e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Configuración de la tarjeta lateral */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-500" />
              <span>Detalles de la Tarjeta Lateral</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cartelito Dorado (Ej: Liquidación)
                </label>
                <input
                  type="text"
                  value={config.cardBadge}
                  onChange={(e) => handleChange('cardBadge', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Subtítulo en la Foto (Ej: Últimas unidades)
                </label>
                <input
                  type="text"
                  value={config.cardSub}
                  onChange={(e) => handleChange('cardSub', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Título en la Foto (Ej: Productos en Liquidación)
                </label>
                <input
                  type="text"
                  value={config.cardTitle}
                  onChange={(e) => handleChange('cardTitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Condición (Ej: Nuevos de exhibición)
                </label>
                <input
                  type="text"
                  value={config.conditionText}
                  onChange={(e) => handleChange('conditionText', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Modalidad de Entrega (Ej: Retiro o envío a coordinar)
                </label>
                <input
                  type="text"
                  value={config.deliveryText}
                  onChange={(e) => handleChange('deliveryText', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Imagen y Previsualización */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Fotografía de Portada del Outlet
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Recomendado: 1200 x 750 px (16:10)
              </span>
            </div>

            {/* Selector de modo de ajuste */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleChange('objectFit', 'contain')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  config.objectFit === 'contain'
                    ? 'border-amber-500 bg-amber-50/70 text-slate-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">Ver completa</span>
                <span className="text-[10px] text-slate-500">Con margen y fondo difuminado</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('objectFit', 'cover')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  config.objectFit !== 'contain'
                    ? 'border-amber-500 bg-amber-50/70 text-slate-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">Llenar tarjeta</span>
                <span className="text-[10px] text-slate-500">Ocupa todo el espacio de portada</span>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer">
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{uploadingImage ? 'Subiendo a Cloudinary...' : 'Subir Imagen'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                placeholder="O pegar URL directa de Cloudinary"
                value={config.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Vista previa en vivo */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Previsualización de Tarjeta:
            </span>
            <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 p-4 text-white shadow-lg overflow-hidden">
              <div className="relative aspect-[16/10] w-full rounded-xl bg-slate-950 overflow-hidden mb-3 border border-white/10 flex items-center justify-center">
                {config.objectFit === 'contain' && (
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-35 scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${config.imageUrl || 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184610/papes-confort/landing/cat_heladeras.jpg'})` }}
                  />
                )}
                <img
                  src={config.imageUrl || 'https://res.cloudinary.com/dotxvd5dc/image/upload/v1789184610/papes-confort/landing/cat_heladeras.jpg'}
                  alt="Outlet"
                  className={`w-full h-full relative z-10 ${
                    config.objectFit === 'contain' ? 'object-contain mx-auto p-2 opacity-85' : 'object-cover opacity-60'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute top-2 right-2 z-10 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {config.cardBadge}
                </div>

                <div className="absolute bottom-2 left-2 right-2 z-10 text-left">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-300">
                    {config.cardSub}
                  </span>
                  <p className="text-white font-extrabold text-xs leading-tight">
                    {config.cardTitle}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-left text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Rubro GesCom:</span>
                  <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {config.rubroGescom}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Condición:</span>
                  <span className="font-medium text-slate-200">{config.conditionText}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Entrega:</span>
                  <span className="font-medium text-emerald-400">{config.deliveryText}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Stock físico limitado</span>
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <span>{config.primaryBtnText}</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
