import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-50 text-slate-500 border-t border-slate-200 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand details */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4 group">
              <img
                src="/images/logo/logo-slogan-negro.svg"
                alt="Logo Papes Confort"
                className="h-16 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
              Equipando tu hogar con la calidez y calidad de siempre. Encuentra los mejores electrodomésticos, sistemas de climatización y productos de confort.
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-brand-red shrink-0" />
                <span>Basavilbaso, Entre Ríos, Argentina</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-brand-red shrink-0" />
                <span>Servicio y asesoramiento personalizado</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-brand-black text-sm font-semibold tracking-wider uppercase mb-4">
              Navegación
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link href="/" className="hover:text-brand-red transition-colors duration-200">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-brand-red transition-colors duration-200">
                  Catálogo
                </Link>
              </li>
            </ul>
          </div>

          {/* Informational columns */}
          <div>
            <h4 className="font-display text-brand-black text-sm font-semibold tracking-wider uppercase mb-4">
              Políticas y Ayuda
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="text-slate-400">Garantías Oficiales</li>
              <li className="text-slate-400">Términos y Condiciones</li>
              <li className="text-slate-400">Políticas de Privacidad</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400">&copy; {new Date().getFullYear()} Papes Confort. Todos los derechos reservados.</p>
          <p className="text-slate-400">Servicio y calidad asegurados.</p>
        </div>
      </div>
    </footer>
  );
}

