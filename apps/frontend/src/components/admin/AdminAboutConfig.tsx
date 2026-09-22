'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Store,
  Eye,
  EyeOff,
  MessageSquare,
} from 'lucide-react';
import { HomeAboutDto, DEFAULT_ABOUT_SECTION } from '@papes-confort/shared';
import { fetchApi } from '../../lib/api';

interface AdminAboutConfigProps {
  initialConfig?: HomeAboutDto;
  onSaved?: (config: HomeAboutDto) => void;
}

export default function AdminAboutConfig({
  initialConfig,
  onSaved,
}: AdminAboutConfigProps) {
  const [config, setConfig] = useState<HomeAboutDto>(
    initialConfig ? { ...DEFAULT_ABOUT_SECTION, ...initialConfig } : DEFAULT_ABOUT_SECTION
  );

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...DEFAULT_ABOUT_SECTION, ...initialConfig });
    }
  }, [initialConfig]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof HomeAboutDto, value: any) => {
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
          body: JSON.stringify({ image: base64Data, folder: 'papes-confort/landing/about' }),
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
        home_about: JSON.stringify(config),
      }),
    });

    if (res.success) {
      setSuccessMsg('Información institucional guardada exitosamente en la base de datos.');
      if (onSaved) onSaved(config);
    } else {
      setErrorMsg(res.error || 'Error al guardar la sección institucional.');
    }
    setSaveLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-brand-red" />
            <h2 className="text-lg font-extrabold text-slate-800">
              Bloque Institucional: Sobre Nosotros y Local
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalizá la historia de confianza, la fotografía del edificio de Basavilbaso en Cloudinary, los valores familiares y el mensaje de contacto.
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
                <span>Guardar Sección</span>
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
        {/* Textos institucionales */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Badge
              </label>
              <input
                type="text"
                value={config.badge}
                onChange={(e) => handleChange('badge', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 outline-none focus:border-brand-red focus:bg-white"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-extrabold text-slate-800 outline-none focus:border-brand-red focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Título Resaltado (Rojo)
              </label>
              <input
                type="text"
                value={config.titleHighlight}
                onChange={(e) => handleChange('titleHighlight', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-extrabold text-brand-red outline-none focus:border-brand-red focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción Institucional
            </label>
            <textarea
              rows={4}
              value={config.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 outline-none focus:border-brand-red focus:bg-white leading-relaxed resize-none"
            />
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
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-brand-red resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Texto Botón WhatsApp
              </label>
              <input
                type="text"
                value={config.primaryBtnText}
                onChange={(e) => handleChange('primaryBtnText', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Texto Botón Catálogo
              </label>
              <input
                type="text"
                value={config.secondaryBtnText}
                onChange={(e) => handleChange('secondaryBtnText', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
              />
            </div>
          </div>
        </div>

        {/* Foto del Edificio / Local */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Fotografía del Local / Casa Central
          </span>

          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 border border-slate-200/80 group">
            <img
              src={config.imageUrl}
              alt="Local Papes Confort"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/edificio.webp';
              }}
            />
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer p-2 text-center">
              {uploadingImage ? (
                <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
              ) : (
                <>
                  <Upload className="h-5 w-5 mb-1" />
                  <span>Subir foto a Cloudinary</span>
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Ubicación y Leyenda
            </label>
            <input
              type="text"
              value={config.storeLocation}
              onChange={(e) => handleChange('storeLocation', e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand-red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
