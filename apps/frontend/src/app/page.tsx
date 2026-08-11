'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import PaymentMethods from '../components/PaymentMethods';

export default function HomePage() {
  return (
    <div className="w-full bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 text-brand-black py-16 md:py-24 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero left content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-4 py-1.5 text-xs font-semibold text-brand-red uppercase tracking-wider">
              Servicio y calidad asegurados
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-brand-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-red-dark">Llevamos el confort</span> que tu hogar merece
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              El asesoramiento personalizado y el servicio posventa que nos caracteriza
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-semibold text-white hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.25)] hover:shadow-[0_6px_25px_rgba(228,20,20,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 group"
              >
                Explorar catálogo
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero right content (Edificio integrated into background) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Soft ambient glow behind building image */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-red/10 via-slate-200/50 to-transparent blur-2xl rounded-full opacity-70" />

              {/* Integrated building image with smooth blend */}
              <div className="relative overflow-hidden rounded-3xl shadow-lg border border-slate-200/60 bg-gradient-to-b from-slate-100 to-white">
                <img
                  src="/images/edificio.webp"
                  alt="Edificio Papes Confort en Basavilbaso"
                  className="w-full h-auto max-h-[460px] object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.02]"
                />
                
                {/* Soft bottom gradient overlay for seamless background transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 via-transparent to-transparent pointer-events-none" />

                {/* Floating subtle location pill */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-red shrink-0" />
                  <span className="text-xs font-bold text-brand-black tracking-wide">
                    Basavilbaso, Entre Ríos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods & Financing Section */}
      <PaymentMethods />
    </div>
  );
}
