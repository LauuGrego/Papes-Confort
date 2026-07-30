'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Loader2, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { ProductDto } from '@papes-confort/shared';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const res = await fetchApi<ProductDto>(`/api/products/${slug}`);
      if (res.success && res.data) {
        setProduct(res.data);
      }
      setLoading(false);
    }
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetchApi<{ whatsapp_number: string }>('/api/settings/public');
      if (res.success && res.data?.whatsapp_number) {
        setWhatsappNumber(res.data.whatsapp_number);
      }
    }
    loadSettings();
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando producto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center space-y-6">
        <h2 className="font-display text-2xl font-bold">Producto no encontrado</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          El artículo que buscas no existe o ha sido dado de baja de nuestro catálogo.
        </p>
        <button
          onClick={() => router.push('/catalogo')}
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white hover:bg-brand-red-dark transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </button>
      </div>
    );
  }

  const primaryImage = product.images[activeImageIdx] || product.images[0];
  const imageUrl = primaryImage ? primaryImage.url : '/images/logo/isotipo.svg';
  const hasDiscount = product.discountPercent > 0;

  // Build WhatsApp link
  const whatsappMsg = `¡Hola! Estoy interesado en el producto *${product.name}* (SKU: ${product.sku}) con un precio de ${formatPrice(product.finalPrice)} que vi en su sitio web. ¿Tienen stock disponible?`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-600">Inicio</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/catalogo" className="hover:text-slate-600">Catálogo</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-600 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left column: Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 p-8 flex">
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
            {/* Badges overlay */}
            <div className="absolute left-6 top-6 flex flex-col gap-2">
              {hasDiscount && (
                <span className="inline-flex items-center rounded-full bg-brand-red px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider shadow-md">
                  {product.discountPercent}% OFF
                </span>
              )}
              {product.isOutlet && (
                <span className="inline-flex items-center rounded-full bg-brand-navy px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider shadow-md">
                  Outlet
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-50 border p-2 flex transition-all ${
                    activeImageIdx === idx
                      ? 'border-brand-red ring-2 ring-brand-red/10'
                      : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} vista ${idx + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Purchase Info */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <span className="text-xs font-bold text-brand-red uppercase tracking-widest mb-1.5 block">
              {product.brand.name}
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-brand-black leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">SKU: {product.sku}</p>
          </div>

          {/* Price Box */}
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-brand-black">
                {formatPrice(product.finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-brand-red font-semibold">
                ¡Ahorras {formatPrice(product.basePrice - product.finalPrice)} en esta compra!
              </p>
            )}

            {/* CTA Buttons */}
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-emerald-500 hover:bg-emerald-600 px-8 py-4 text-sm font-bold text-white transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] transform hover:-translate-y-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 shrink-0"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.48 2.016 14.01 1 11.397 1 5.966 1 1.54 5.372 1.537 10.8c-.001 1.777.469 3.511 1.361 5.048l-.91 3.325 3.42-.897c1.517.828 3.086 1.258 4.649 1.258zm9.324-7.098c-.28-.14-1.657-.818-1.914-.911-.257-.093-.443-.14-.63.14-.186.28-.72.911-.883 1.097-.163.186-.327.21-.607.07-.28-.14-1.182-.436-2.25-1.39-.831-.742-1.391-1.658-1.554-1.938-.163-.28-.017-.431.123-.57.126-.125.28-.327.42-.49.14-.163.187-.28.28-.467.094-.187.047-.35-.023-.49-.07-.14-.63-1.517-.863-2.078-.228-.549-.46-.474-.63-.482-.163-.008-.35-.01-.537-.01-.186 0-.49.07-.747.35-.257.28-.98 0.958-.98 2.336 0 1.378 1.003 2.707 1.143 2.894.14.187 1.975 3.017 4.785 4.225.668.288 1.19.46 1.597.59.67.213 1.28.183 1.761.11.537-.08 1.657-.677 1.89-1.332.233-.655.233-1.216.163-1.332-.07-.116-.257-.186-.537-.327z" />
                </svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>

          {/* Key details checklist */}
          <div className="space-y-4 text-sm border-t border-b border-slate-100 py-6">
            <div className="flex gap-4">
              <ShieldCheck className="h-5 w-5 text-brand-red shrink-0" />
              <div>
                <h4 className="font-bold text-brand-black">Garantía Asegurada</h4>
                <p className="text-xs text-slate-400">{product.warrantyMonths} Meses de garantía oficial de fábrica.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Truck className="h-5 w-5 text-brand-red shrink-0" />
              <div>
                <h4 className="font-bold text-brand-black">Envíos Locales y Nacionales</h4>
                <p className="text-xs text-slate-400">Retiro gratis en nuestro local en Basavilbaso o envíos a coordinar.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <RotateCcw className="h-5 w-5 text-brand-red shrink-0" />
              <div>
                <h4 className="font-bold text-brand-black">Compra Segura y Transparente</h4>
                <p className="text-xs text-slate-400">Atención personalizada y asesoramiento en cada etapa de la compra.</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700">
                Descripción
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Specs Table */}
          {product.specs && Object.keys(product.specs).filter(k => !['ivaPercent', 'unit', 'rubro', 'subrubro'].includes(k)).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700">
                Especificaciones Técnicas
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {Object.entries(product.specs)
                      .filter(([key]) => !['ivaPercent', 'unit', 'rubro', 'subrubro'].includes(key))
                      .map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-500 w-1/3 border-b border-slate-100 capitalize">
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-3 text-brand-black border-b border-slate-100">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
