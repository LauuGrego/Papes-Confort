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
} from 'lucide-react';
import { HomeCategoryCardDto, DEFAULT_CATEGORY_CARDS } from '@papes-confort/shared';
import { fetchApi } from '../../lib/api';

interface AdminCategoriesConfigProps {
  initialCards?: HomeCategoryCardDto[];
  onSaved?: (cards: HomeCategoryCardDto[]) => void;
}

export default function AdminCategoriesConfig({
  initialCards,
  onSaved,
}: AdminCategoriesConfigProps) {
  const [cards, setCards] = useState<HomeCategoryCardDto[]>(
    initialCards && initialCards.length > 0 ? initialCards : DEFAULT_CATEGORY_CARDS
  );

  useEffect(() => {
    if (initialCards && initialCards.length > 0) {
      setCards(initialCards);
    }
  }, [initialCards]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCardChange = (index: number, field: keyof HomeCategoryCardDto, value: any) => {
    setCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleImageUpload = (index: number, file: File) => {
    setUploadingIdx(index);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await fetchApi<{ url: string }>('/api/admin/settings/upload-image', {
          method: 'POST',
          body: JSON.stringify({ image: base64Data, folder: 'papes-confort/landing/categories' }),
        });

        if (res.success && res.data?.url) {
          handleCardChange(index, 'image', res.data.url);
        } else {
          alert(res.error || 'Error al subir la imagen a Cloudinary.');
        }
        setUploadingIdx(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error al subir imagen a Cloudinary:', err);
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        home_category_cards: JSON.stringify(cards),
      }),
    });

    if (res.success) {
      setSuccessMsg('Tarjetas de categorías guardadas exitosamente en la base de datos.');
      if (onSaved) onSaved(cards);
    } else {
      setErrorMsg(res.error || 'Error al guardar tarjetas de categorías.');
    }
    setSaveLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">
            Cards de Categorías de la Portada
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Personalizá los 8 rubros destacados que se muestran en la landing con sus fotos en Cloudinary, títulos, descripciones y enlaces al catálogo.
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
              <span>Guardar Categorías</span>
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

      {/* Grilla de 8 tarjetas editables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div
            key={card.id || idx}
            className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
              card.isActive !== false
                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                : 'bg-slate-100/50 border-slate-200 opacity-60'
            }`}
          >
            {/* Cabecera de la card: Switch Activo */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Rubro #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleCardChange(idx, 'isActive', card.isActive === false ? true : false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                  card.isActive !== false
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                {card.isActive !== false ? (
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

            {/* Imagen Preview con botón de subida a Cloudinary */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 border border-slate-200/80 mb-3 group">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/hero_home_ambience.jpg';
                }}
              />
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer p-2 text-center">
                {uploadingIdx === idx ? (
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
                  disabled={uploadingIdx === idx}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(idx, file);
                  }}
                />
              </label>
            </div>

            {/* Campos de texto */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Nombre del Rubro
                </label>
                <input
                  type="text"
                  value={card.name}
                  onChange={(e) => handleCardChange(idx, 'name', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={card.description}
                  onChange={(e) => handleCardChange(idx, 'description', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
