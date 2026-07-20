'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md text-brand-black">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo and Text */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/images/logo/isotipo.svg"
            alt="Isotipo Papes Confort"
            className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-wider text-brand-black group-hover:text-brand-red transition-colors duration-200">
              PAPES CONFORT
            </span>
            <span className="text-[10px] tracking-widest text-slate-500 uppercase font-light -mt-1">
              Servicio y calidad asegurados
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/" className="text-slate-600 hover:text-brand-red hover-underline-reveal transition-colors duration-200">
            Inicio
          </Link>
          <Link href="/catalogo" className="text-slate-600 hover:text-brand-red hover-underline-reveal transition-colors duration-200">
            Catálogo
          </Link>
        </nav>

        {/* Action icons (Cart) */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 transition-all duration-200 group bg-slate-50 hover:bg-slate-100"
            aria-label="Carrito de compras"
          >
            <ShoppingBag className="h-5 w-5 text-slate-600 group-hover:text-brand-red transition-colors duration-200" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

