'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CreditCard,
  Truck,
  ExternalLink,
  X,
  Instagram,
  Facebook,
} from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function Footer() {
  const pathname = usePathname();
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');
  const [activeModal, setActiveModal] = useState<'terminos' | 'privacidad' | 'garantias' | null>(null);

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

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent('¡Hola Papes Confort! Quisiera hacer una consulta.');
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <>
      <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
            {/* Columna 1: Papes Confort & Identidad (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <Link href="/" className="inline-block group">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/logo/logo-slogan-blanco.svg"
                    onError={(e) => {
                      // Fallback en caso de que solo exista el logo negro
                      (e.target as HTMLImageElement).src = '/images/logo/logo-slogan-negro.svg';
                      (e.target as HTMLImageElement).className = 'h-12 w-auto brightness-0 invert';
                    }}
                    alt="Logo Papes Confort"
                    className="h-12 w-auto transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
              </Link>

              <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-normal">
                Todo para equipar tu hogar. Electrodomésticos, climatización y confort para todos los días con la calidez y el respaldo de siempre.
              </p>

              {/* Redes sociales */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                  Conectá con nosotros
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram de Papes Confort"
                    className="h-10 w-10 rounded-full bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.facebook.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook de Papes Confort"
                    className="h-10 w-10 rounded-full bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    aria-label="WhatsApp directo de Papes Confort"
                    className="h-10 w-10 rounded-full bg-slate-800 hover:bg-[#25D366] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.51 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Columna 2: Comprá (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-white text-xs font-extrabold tracking-wider uppercase">
                Comprá
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/catalogo" className="hover:text-white transition-colors duration-150">
                    Catálogo Completo
                  </Link>
                </li>
                <li>
                  <Link href="/#marcas" className="hover:text-white transition-colors duration-150">
                    Marcas Oficiales
                  </Link>
                </li>
                <li>
                  <Link href="/#oferta-semanal" className="hover:text-white transition-colors duration-150 text-red-400 font-semibold">
                    Ofertas de la Semana
                  </Link>
                </li>
                <li>
                  <Link href="/catalogo?search=aire" className="hover:text-white transition-colors duration-150">
                    Climatización
                  </Link>
                </li>
                <li>
                  <Link href="/catalogo?search=heladera" className="hover:text-white transition-colors duration-150">
                    Heladeras y Freezers
                  </Link>
                </li>
                <li>
                  <Link href="/catalogo?search=lavarropas" className="hover:text-white transition-colors duration-150">
                    Lavarropas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Ayuda & Confianza (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-white text-xs font-extrabold tracking-wider uppercase">
                Ayuda & Confianza
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/catalogo" className="hover:text-white transition-colors duration-150 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-brand-red shrink-0" />
                    <span>Envíos y Entregas</span>
                  </Link>
                </li>
                <li>
                  <Link href="/#medios-de-pago" className="hover:text-white transition-colors duration-150 flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-brand-red shrink-0" />
                    <span>Medios de Pago y Cuotas</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('garantias')}
                    className="hover:text-white transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-red shrink-0" />
                    <span>Garantías Oficiales</span>
                  </button>
                </li>
                <li>
                  <Link href="/#sobre-nosotros" className="hover:text-white transition-colors duration-150">
                    Sobre Papes Confort
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="hover:text-white transition-colors duration-150 text-left text-slate-400 hover:underline cursor-pointer"
                  >
                    Asesoramiento Personalizado
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contacto & Casa Central (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-white text-xs font-extrabold tracking-wider uppercase">
                Casa Central & Contacto
              </h4>
              <ul className="flex flex-col gap-3 text-xs sm:text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-brand-red shrink-0 mt-0.5" />
                  <span>Basavilbaso, Entre Ríos, Argentina</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-brand-red shrink-0 mt-0.5" />
                  <a
                    href={`tel:+${whatsappNumber}`}
                    className="hover:text-white transition-colors"
                  >
                    +54 9 3445 454261
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-brand-red shrink-0 mt-0.5" />
                  <a
                    href="mailto:contacto@papesconfort.com.ar"
                    className="hover:text-white transition-colors"
                  >
                    contacto@papesconfort.com.ar
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-brand-red shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-400 leading-snug">
                    Lunes a Sábados: 8:00 a 12:00 y 16:00 a 20:00
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fila Inferior: Legales y Créditos */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Papes Confort. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveModal('terminos')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Términos y Condiciones
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => setActiveModal('privacidad')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Políticas de Privacidad
              </button>
            </div>

            <p>
              Diseño y desarrollo por{' '}
              <a
                href="https://laugregoportfolio.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-400 hover:text-white underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Lautaro Gregoraschuk Schmidt</span>
                <ExternalLink className="h-3 w-3 inline" />
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Informativo / Políticas / Términos */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 text-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>

            {activeModal === 'terminos' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-brand-black">
                  Términos y Condiciones
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    Bienvenido a <strong>Papes Confort</strong>. Los presentes términos y condiciones regulan el uso de nuestra plataforma online y los servicios de venta minorista prestados desde Basavilbaso, Entre Ríos.
                  </p>
                  <p>
                    Los precios, promociones y disponibilidad de stock informados en la tienda están sujetos a confirmación y disponibilidad de fábrica. Las compras coordinadas vía WhatsApp se formalizan bajo facturación legal correspondiente.
                  </p>
                  <p>
                    Para cualquier consulta sobre condiciones particulares de envío o facturación, te invitamos a comunicarte directamente con nuestro equipo de atención.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'privacidad' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-brand-black">
                  Políticas de Privacidad
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    En <strong>Papes Confort</strong> valoramos y protegemos la privacidad de nuestros clientes. Los datos solicitados para cotizaciones y pedidos (nombre, teléfono, dirección de entrega) son utilizados exclusivamente para la gestión y seguimiento de tu compra.
                  </p>
                  <p>
                    No compartimos tu información con terceros no autorizados ni con fines comerciales ajenos a nuestra actividad.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'garantias' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-brand-black flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-red" />
                  <span>Garantías Oficiales y Soporte</span>
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    Todos los productos comercializados por <strong>Papes Confort</strong> cuentan con garantía oficial otorgada directamente por sus fabricantes (Samsung, Drean, LG, Whirlpool, Philco, etc.).
                  </p>
                  <p>
                    El plazo de garantía varía según la marca y tipo de producto (generalmente entre 6 y 12 meses). Ante cualquier inconveniente o consulta de servicio técnico, nuestro equipo te acompaña y asesora en la gestión con la red de servicios oficiales.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full bg-slate-900 hover:bg-brand-red text-white text-xs font-bold px-6 py-2.5 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
