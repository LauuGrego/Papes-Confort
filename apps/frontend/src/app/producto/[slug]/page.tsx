'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Loader2, ArrowLeft, Truck, RotateCcw, AlertCircle, Search, X, ShoppingCart, Heart } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { ProductDto } from '@papes-confort/shared';
import Link from 'next/link';
import { useCartStore } from '../../../stores/cart';
import { useAuthStore } from '../../../stores/auth';
import { useFavoritesStore } from '../../../stores/favorites';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');

  const { user, customer, isAuthenticated } = useAuthStore();
  const currentCustomerId = customer?.id || user?.id || '';
  const isFav = useFavoritesStore((state) =>
    isAuthenticated && product && currentCustomerId ? state.isFavorite(product.id, currentCustomerId) : false
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const handleToggleFavorite = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/ingresar?redirect=${encodeURIComponent(`/producto/${slug}`)}`);
      return;
    }
    toggleFavorite(product, currentCustomerId);
  };

  // Zoom states
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Mobile Touch Swipe / Drag states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const changeImage = (newIdx: number) => {
    setIsZoomed(false);
    setActiveImageIdx(newIdx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    // Pan zoom dynamically with finger movement on touch
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.targetTouches[0].clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.targetTouches[0].clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance && product && product.images.length > 1) {
      // Swiped left -> next image
      changeImage(activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1);
    } else if (distance < -minSwipeDistance && product && product.images.length > 1) {
      // Swiped right -> prev image
      changeImage(activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const { addItem } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    setAddError(null);
    setAddSuccess(false);
    try {
      await addItem(product.id, 1);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err: any) {
      setAddError(err.message || 'No se pudo agregar al carrito');
      setTimeout(() => setAddError(null), 4000);
    } finally {
      setIsAdding(false);
    }
  };

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
        <div className="lg:col-span-5 space-y-4 w-full">
          {/* Main Image Viewport */}
          <div
            className="relative aspect-square w-full max-w-md mx-auto items-center justify-center overflow-hidden rounded-3xl bg-slate-50/50 border border-slate-100 p-6 md:p-8 flex cursor-zoom-in group select-none touch-pan-y"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsLightboxOpen(true)}
          >
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-150 ease-out pointer-events-none mix-blend-multiply"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
              }}
            />
            {/* Badges overlay */}
            <div className="absolute left-6 top-6 flex flex-col gap-2 pointer-events-none z-10">
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

            {/* Mobile swipe image counter */}
            {product.images.length > 1 && (
              <div className="absolute top-6 right-6 bg-black/60 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold z-10 pointer-events-none md:hidden">
                {activeImageIdx + 1} / {product.images.length}
              </div>
            )}

            {/* Image navigation arrows over main viewport (with isolated hover/touch to prevent zoom) */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onMouseEnter={() => setIsZoomed(false)}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsZoomed(false);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeImage(activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg border border-slate-200 text-slate-700 hover:bg-white hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onMouseEnter={() => setIsZoomed(false)}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsZoomed(false);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeImage(activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg border border-slate-200 text-slate-700 hover:bg-white hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Hint pill */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium tracking-wide pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity flex items-center gap-1 z-10">
              <Search className="h-3 w-3" />
              Pasá el cursor o tocá para ampliar
            </div>
          </div>

          {/* Thumbnails list below image */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onMouseEnter={() => setIsZoomed(false)}
                  onClick={() => changeImage(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-slate-50 transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-2 border-brand-red ring-2 ring-brand-red/20 shadow-md scale-105'
                      : 'border border-slate-100 hover:border-slate-300 opacity-70 hover:opacity-100'
                  } p-2 flex`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} vista ${idx + 1}`}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </button>
              ))}
            </div>
          )}
        </div>


        {/* Right column: Purchase Info */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-[17px] font-bold text-brand-red uppercase tracking-widest mb-1.5 block">
              {product.brand.name}
            </span>
            <h1 className="font-display text-[21px] md:text-[27px] font-extrabold text-brand-black leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">SKU: {product.sku}</p>
          </div>

          {/* Price Box */}
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 space-y-2">
            {/* Precio de Lista */}
            <div className="text-xl md:text-2xl font-bold text-slate-800">
              {formatPrice(product.listPrice && product.listPrice > 0 ? product.listPrice : product.basePrice)}
            </div>

            {/* Etiqueta Transferencia */}
            <div className="text-sm md:text-base font-black text-brand-red uppercase tracking-wider">
              TRANSFERENCIA {product.discountPercent > 0 ? product.discountPercent : (product.listPrice && product.listPrice > product.basePrice ? Math.round(((product.listPrice - product.basePrice) / product.listPrice) * 100) : 20)}% OFF
            </div>

            {/* Precio Transferencia */}
            <div className="text-3xl md:text-4xl font-black text-brand-red">
              {formatPrice(product.finalPrice)}
            </div>
          </div>

            {/* Stock Availability Indicator */}
            <div className="space-y-3 pt-1 border-t border-slate-100/50">
              <div className="flex items-center gap-2">
                {product.stockVisible > 3 ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-700">Stock disponible ({product.stockVisible} unidades)</span>
                  </>
                ) : product.stockVisible > 0 ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-700">Últimas {product.stockVisible} unidades disponibles</span>
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-semibold text-rose-700">Sin stock disponible</span>
                  </>
                )}
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/70 border border-amber-100 p-3.5 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Consultar Disponibilidad</p>
                  <p className="text-amber-700/90 leading-relaxed">Recomendamos confirmar la disponibilidad de stock y las opciones de financiación con nuestros asesores antes de realizar tu compra.</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 space-y-3">
              {addError && (
                <p className="text-xs font-semibold text-rose-600 animate-pulse text-center">
                  {addError}
                </p>
              )}
              {addSuccess && (
                <p className="text-xs font-semibold text-emerald-600 text-center">
                  ¡Producto agregado al carrito con éxito!
                </p>
              )}

              <button
                disabled={product.stockVisible <= 0 || isAdding}
                onClick={handleAddToCart}
                className={`w-full inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 active:scale-[0.98] ${
                  product.stockVisible <= 0
                    ? 'bg-slate-300 cursor-not-allowed transform-none'
                    : 'bg-brand-red hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.3)]'
                }`}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    Agregando...
                  </>
                ) : product.stockVisible <= 0 ? (
                  'Sin stock disponible'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 shrink-0" />
                    Agregar al Carrito
                  </>
                )}
              </button>

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

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`w-full inline-flex items-center justify-center gap-2.5 rounded-full py-3.5 px-6 text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  isFav
                    ? 'bg-brand-red/5 border-brand-red/20 text-brand-red hover:bg-brand-red/10'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand-red/30 hover:text-brand-red hover:bg-slate-50'
                }`}
              >
                <Heart className={`h-4.5 w-4.5 transition-colors ${isFav ? 'text-brand-red fill-brand-red' : 'text-slate-400'}`} />
                <span>{isFav ? 'En tus Favoritos' : 'Guardar en Favoritos'}</span>
              </button>
            </div>

          {/* Key details checklist */}
          <div className="space-y-4 text-sm border-t border-b border-slate-100 py-6">
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
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700">
              Descripción
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
              {product.description || product.name}
            </p>
          </div>

          {/* Specs Table */}
          {product.specs && Object.keys(product.specs).filter(k => k !== 'ivaPercent').length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700">
                Especificaciones Técnicas
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {Object.entries(product.specs)
                      .filter(([key]) => key !== 'ivaPercent')
                      .map(([key, val], idx) => {
                        const specLabels: Record<string, string> = {
                          unit: 'Unidad de Medida',
                          rubro: 'Rubro',
                          subrubro: 'Subrubro',
                        };
                        const label = specLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        const displayValue = String(val);

                        return (
                          <tr
                            key={key}
                            className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-500 w-1/3 border-b border-slate-100">
                              {label}
                            </td>
                            <td className="px-4 py-3 text-brand-black border-b border-slate-100 font-medium">
                              {displayValue}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-50 cursor-pointer"
            aria-label="Cerrar vista previa"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal image content */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Navigation buttons inside Lightbox */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => changeImage(activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  onClick={() => changeImage(activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>

                <div className="absolute -bottom-10 bg-black/50 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
                  {activeImageIdx + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


