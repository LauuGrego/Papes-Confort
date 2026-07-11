'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#131313]/95 backdrop-blur-md text-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo and Text */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white overflow-hidden shrink-0">
            <img
              src="/images/papes_confort.jpg"
              alt="Logo Papes Confort"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-wider text-white group-hover:text-brand-red transition-colors duration-200">
              PAPES CONFORT
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase font-light -mt-1">
              Servicio y calidad asegurados
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/" className="text-slate-300 hover:text-white hover-underline-reveal transition-colors duration-200">
            Inicio
          </Link>
          <Link href="/catalogo" className="text-slate-300 hover:text-white hover-underline-reveal transition-colors duration-200">
            Catálogo
          </Link>
        </nav>

        {/* Action icons (Cart) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-white/20 transition-all duration-200 group"
            aria-label="Carrito de compras"
          >
            <ShoppingBag className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors duration-200" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
