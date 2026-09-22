'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function FloatingWhatsApp() {
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);

  useEffect(() => {
    async function loadWhatsAppSettings() {
      try {
        const res = await fetchApi<{ whatsapp_number?: string }>('/api/settings/public');
        if (res.success && res.data?.whatsapp_number) {
          setWhatsappNumber(res.data.whatsapp_number);
        }
      } catch (e) {
        console.error('Error al cargar número de WhatsApp:', e);
      }
    }
    loadWhatsAppSettings();
  }, []);

  const handleClick = () => {
    const text = encodeURIComponent(
      '¡Hola Papes Confort! Quisiera hacer una consulta sobre los productos de la tienda.'
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <aside
      aria-label="Contacto directo por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"
    >
      {/* Tooltip / Mensaje de bienvenida flotante */}
      {isTooltipVisible && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto mb-3 max-w-[240px] rounded-2xl bg-white p-3.5 shadow-xl border border-slate-200/90 text-slate-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 relative group"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsTooltipVisible(false);
            }}
            className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            aria-label="Cerrar mensaje"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex items-start gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                ¿Tenés alguna duda?
              </p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Escribinos directo y te asesoramos al instante.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante principal de WhatsApp */}
      <div className="relative pointer-events-auto">
        {/* Anillo de pulso sutil */}
        <span
          className="absolute -inset-1.5 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none"
          style={{ animationDuration: '3s' }}
        />

        <button
          type="button"
          onClick={handleClick}
          className="relative flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_8px_25px_rgba(37,211,102,0.6)] hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group"
          aria-label="Contactar a Papes Confort por WhatsApp"
        >
          {/* WhatsApp SVG oficial nítido */}
          <svg
            className="h-7 w-7 sm:h-8 sm:w-8 fill-current transition-transform duration-200 group-hover:scale-110"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.51 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
