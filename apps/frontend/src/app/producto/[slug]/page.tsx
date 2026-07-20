'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Loader2, ArrowLeft, MessageCircle, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
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
  const defaultWhatsAppNumber = '5493445431872'; // Fallback default
  const whatsappMsg = `¡Hola! Estoy interesado en el producto *${product.name}* (SKU: ${product.sku}) con un precio de ${formatPrice(product.finalPrice)} que vi en su sitio web. ¿Tienen stock disponible?`;
  const whatsappUrl = `https://wa.me/${defaultWhatsAppNumber}?text=${encodeURIComponent(whatsappMsg)}`;

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
                <MessageCircle className="h-5 w-5 fill-white text-emerald-500" />
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
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700">
                Especificaciones Técnicas
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {Object.entries(product.specs).map(([key, val], idx) => (
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
