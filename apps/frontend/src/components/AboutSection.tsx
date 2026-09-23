'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Truck, Store, ArrowRight, MessageSquare } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { HomeAboutDto, DEFAULT_ABOUT_SECTION } from '@papes-confort/shared';

interface AboutSectionProps {
  aboutConfig?: HomeAboutDto;
}

export default function AboutSection({ aboutConfig }: AboutSectionProps) {
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');
  const config = aboutConfig ? { ...DEFAULT_ABOUT_SECTION, ...aboutConfig } : DEFAULT_ABOUT_SECTION;

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetchApi<{ whatsapp_number?: string }>('/api/settings/public');
        if (res.success && res.data?.whatsapp_number) {
          setWhatsappNumber(res.data.whatsapp_number);
        }
      } catch (e) {
        console.error('Error al cargar ajustes de WhatsApp:', e);
      }
    }
    loadSettings();
  }, []);

  if (config.isActive === false) {
    return null;
  }

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      config.whatsappMessage || '¡Hola Papes Confort! Me gustaría hacerles una consulta sobre sus productos y envíos.'
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <section id="sobre-nosotros" className="w-full bg-white py-8 sm:py-10 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Columna Izquierda: Mensaje Institucional & Valores */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Store className="h-3.5 w-3.5 text-brand-red" />
              <span>{config.badge}</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-black tracking-tight leading-tight">
              {config.title}{' '}
              <span className="text-brand-red">{config.titleHighlight}</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
              {config.description}
            </p>

            {/* 4 Valores / Beneficios en mini tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Local a la calle</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Casa central en Basavilbaso, Entre Ríos. Atención física y personalizada.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Garantía oficial</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Respaldo directo de fábrica y soporte post-venta en cada artículo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Logística coordinada</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Envíos a todo el país y entregas cuidadas a domicilio en la zona.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Atención de persona a persona</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Respuestas rápidas y asesoramiento sincero sin intermediarios.</p>
                </div>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleContactWhatsApp}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-brand-red hover:bg-brand-red-dark px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(228,20,20,0.25)] hover:shadow-[0_6px_22px_rgba(228,20,20,0.35)] transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{config.primaryBtnText}</span>
              </button>

              <Link
                href={config.secondaryBtnUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 hover:text-brand-red transition-all cursor-pointer shadow-2xs"
              >
                <span>{config.secondaryBtnText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Imagen del edificio y badge de confianza */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Resplandor ambiental decorativo */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-brand-red/15 via-slate-200/50 to-transparent blur-2xl rounded-3xl opacity-70" />

              {/* Contenedor de la foto del local */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xl group">
                <img
                  src={config.imageUrl}
                  alt={config.title}
                  className="w-full h-80 sm:h-96 object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/edificio.webp';
                  }}
                />

                {/* Badge superpuesto */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white shadow-xs">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                        Papes Confort
                      </p>
                      <p className="text-xs text-slate-500 leading-snug">
                        {config.storeLocation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
