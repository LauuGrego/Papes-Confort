'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Search, X } from 'lucide-react';
import PaymentMethods from '../components/PaymentMethods';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalogo');
    }
  };

  const handleQuickSearch = (term: string) => {
    router.push(`/catalogo?search=${encodeURIComponent(term)}`);
  };

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

            {/* Search Bar Form for Landing Page */}
            <form onSubmit={handleSearch} className="pt-2 max-w-xl space-y-3">
              <div className="relative flex items-center group">
                <input
                  type="text"
                  placeholder="Buscar por marca, rubro, nombre (ej. Heladera, Sommier)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm text-brand-black placeholder-slate-400 outline-none shadow-sm focus:border-brand-red/50 focus:ring-4 focus:ring-brand-red/10 transition-all duration-200"
                />
                <Search className="absolute left-4 h-5 w-5 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-24 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 px-5 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all duration-200 shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Buscar</span>
                </button>
              </div>

              {/* Suggestions / Tags */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Popular:</span>
                {['Colchones', 'Heladeras', 'Televisores', 'Lavarropas', 'Aires'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="bg-white/80 border border-slate-200/80 hover:border-brand-red/30 hover:bg-brand-red/5 hover:text-brand-red px-2.5 py-1 rounded-xl transition-all cursor-pointer text-slate-600 font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-semibold text-white hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.25)] hover:shadow-[0_6px_25px_rgba(228,20,20,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 group"
              >
                Explorar catálogo completo
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

