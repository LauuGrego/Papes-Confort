'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Lock,
  ShoppingCart,
  Heart,
  Search,
  X,
  CreditCard,
  BadgePercent,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { ProductDto, PaginatedResponse, sanitizeCorruptedSpanishText } from '@papes-confort/shared';
import { useCartStore } from '../../../stores/cart';
import { useAuthStore } from '../../../stores/auth';
import { useFavoritesStore } from '../../../stores/favorites';
import { useInstallmentsStore } from '../../../stores/installments';
import ProductCard from '../../../components/products/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDto[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');

  // Auth and Favorites
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Cuotas y Financiación
  const { config: installmentsConfig, load: loadInstallments } = useInstallmentsStore();

  useEffect(() => {
    loadInstallments();
  }, [loadInstallments]);

  // Mobile Touch Swipe states
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
      changeImage(activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1);
    } else if (distance < -minSwipeDistance && product && product.images.length > 1) {
      changeImage(activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Cart
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

  // Load product
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const res = await fetchApi<ProductDto>(`/api/products/${slug}`);
      if (res.success && res.data) {
        setProduct(res.data);
        setActiveImageIdx(0);

        // Fetch related products from same family or category
        const familySlug = res.data.productType?.slug;
        if (familySlug) {
          const relRes = await fetchApi<PaginatedResponse<ProductDto>>(`/api/products?type=${familySlug}&limit=5`);
          if (relRes.success && relRes.data?.items) {
            setRelatedProducts(relRes.data.items.filter((p) => p.id !== res.data?.id).slice(0, 4));
          }
        }
      }
      setLoading(false);
    }
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // Load settings (WhatsApp)
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Cargando producto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Producto no encontrado</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          El artículo que buscas no existe o ha sido dado de baja de nuestro catálogo.
        </p>
        <button
          onClick={() => router.push('/catalogo')}
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-brand-red-dark transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al catálogo</span>
        </button>
      </div>
    );
  }

  const primaryImage = product.images[activeImageIdx] || product.images[0];
  const imageUrl = primaryImage ? primaryImage.url : '/images/logo/isotipo.svg';
  const listPrice = product.listPrice && product.listPrice > 0 ? product.listPrice : product.basePrice;
  const showListPrice = listPrice > product.finalPrice;

  const defaultInstallments = installmentsConfig.defaultInstallments || 5;
  const standardInstallmentAmount = Math.round(listPrice / defaultInstallments);

  const bankPromoInstallments = installmentsConfig.bankPromoInstallments || 9;
  const bankPromoInstallmentAmount = Math.round(listPrice / bankPromoInstallments);

  // WhatsApp message
  const whatsappMsg = `Hola, estoy interesado en el producto ${product.name} (SKU: ${product.sku}) que vi en la tienda online. ¿Podrían confirmarme disponibilidad y opciones de entrega?`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* 1. Breadcrumbs contextuales navegables */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-700 transition-colors">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/catalogo" className="hover:text-slate-700 transition-colors">
          Catálogo
        </Link>
        {product.productType && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/catalogo?type=${product.productType.slug}`}
              className="hover:text-slate-700 transition-colors"
            >
              {product.productType.name}
            </Link>
          </>
        )}
        {product.productCategory && product.productCategory.name !== 'Sin Categoría' && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/catalogo?type=${product.productType?.slug}&categoryId=${product.productCategory.id}`}
              className="hover:text-slate-700 transition-colors"
            >
              {product.productCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-700 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Layout Principal: Galería Izquierda + Ficha Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-16">
        {/* Columna Izquierda: Galería con Miniaturas Verticales en Desktop */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 items-start w-full">
          {/* Miniaturas verticales a la izquierda en Desktop */}
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[500px] w-full md:w-20 shrink-0 pb-2 md:pb-0 pr-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => changeImage(idx)}
                  className={`relative aspect-square w-16 md:w-full shrink-0 rounded-xl overflow-hidden bg-slate-50 p-1.5 transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'border-2 border-brand-red ring-2 ring-brand-red/20 scale-102'
                      : 'border border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} miniatura ${idx + 1}`}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Visor Grande Principal 1:1 */}
          <div
            className="relative aspect-square w-full rounded-3xl bg-slate-50/70 border border-slate-100 p-6 md:p-10 flex items-center justify-center cursor-zoom-in group select-none touch-pan-y overflow-hidden"
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
              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-150 ease-out pointer-events-none"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isZoomed ? 'scale(2.4)' : 'scale(1)',
              }}
            />

            {/* Badge de Oferta discreto */}
            {product.discountPercent > 0 && (
              <div className="absolute left-5 top-5 z-10">
                <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-xs">
                  {product.discountPercent}% OFF
                </span>
              </div>
            )}

            {/* Hint para ampliar */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity flex items-center gap-1 z-10">
              <Search className="h-3 w-3" />
              <span>Toca o pasa el cursor para ampliar</span>
            </div>

            {/* Flechas de navegación rápida */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    changeImage(activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-200 text-slate-700 hover:bg-white transition-all z-20 cursor-pointer"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    changeImage(activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-200 text-slate-700 hover:bg-white transition-all z-20 cursor-pointer"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Columna Derecha: Información, Precios, Stock y Acciones */}
        <div className="lg:col-span-5 space-y-6">
          {/* Marca, Nombre y Modelo */}
          <div className="space-y-1.5 border-b border-slate-100 pb-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              {product.brand?.name || 'Papes Confort'}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-black leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Código / SKU: {product.sku}
            </p>
          </div>

          {/* Bloque de Precios y Financiación */}
          <div className="bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-100 space-y-4">
            {/* Opción 1: Contado / Transferencia */}
            <div className="space-y-1">
              {showListPrice && (
                <span className="text-sm text-slate-400 line-through block">
                  {formatPrice(listPrice)}
                </span>
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-black text-brand-black">
                  {formatPrice(product.finalPrice)}
                </span>
                {product.discountPercent > 0 && (
                  <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2.5 py-0.5 rounded-full">
                    Ahorras {product.discountPercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 pt-0.5">
                <BadgePercent className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Precio especial abonando por transferencia o efectivo</span>
              </div>
            </div>

            {/* Opción 2: Tarjeta de Crédito y Financiación en Cuotas al Precio de Lista */}
            {defaultInstallments > 1 && (
              <div className="pt-3 border-t border-slate-200/70 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-brand-black">
                    <CreditCard className="h-4 w-4 text-brand-red shrink-0" />
                    <span>
                      Hasta <strong className="text-slate-900 font-extrabold">{defaultInstallments} cuotas sin interés</strong> de{' '}
                      <strong className="text-brand-black font-black">{formatPrice(standardInstallmentAmount)}</strong>
                    </span>
                  </div>
                </div>

                {/* Promo bancaria destacada (ej. Banco Nación) */}
                {installmentsConfig.bankPromoActive && installmentsConfig.bankPromoInstallments > 0 && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/80 border border-indigo-100 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-xs space-y-0.5 min-w-0">
                      <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <span>Promoción Especial {installmentsConfig.bankPromoName}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-200/60 text-indigo-800 text-[10px] font-bold">Vigente</span>
                      </div>
                      <div className="font-bold text-indigo-900 text-sm">
                        {installmentsConfig.bankPromoInstallments} cuotas sin interés de {formatPrice(bankPromoInstallmentAmount)}
                      </div>
                      <div className="text-[11px] text-indigo-700/90 font-medium">
                        {installmentsConfig.bankPromoText || `Exclusivo al precio de lista con tarjetas de crédito emitidas por ${installmentsConfig.bankPromoName}.`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón para ver tabla completa de cuotas */}
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red hover:text-brand-red-dark transition-colors cursor-pointer group"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Ver medios de pago y tabla detallada de cuotas</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </div>

          {/* Disponibilidad de Stock Limpia */}
          <div className="flex items-center gap-2 text-xs font-medium">
            {product.stockVisible > 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Disponible para entrega ({product.stockVisible} en stock)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Sin stock inmediato - Consultar reposición</span>
              </div>
            )}
          </div>

          {/* CTAs Principales */}
          <div className="space-y-2.5 pt-2">
            {addError && (
              <p className="text-xs font-semibold text-rose-600 text-center">{addError}</p>
            )}
            {addSuccess && (
              <p className="text-xs font-semibold text-emerald-600 text-center">
                Producto agregado al carrito con éxito
              </p>
            )}

            {/* Botón Principal: Comprar / Agregar al Carrito */}
            <button
              disabled={product.stockVisible <= 0 || isAdding}
              onClick={handleAddToCart}
              className={`w-full py-4 px-6 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                product.stockVisible <= 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-brand-red hover:bg-brand-red-dark active:scale-98 shadow-brand-red/20'
              }`}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Agregando al carrito...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Comprar ahora</span>
                </>
              )}
            </button>

            {/* Botón Secundario: Consultar por WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 shrink-0"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.48 2.016 14.01 1 11.397 1 5.966 1 1.54 5.372 1.537 10.8c-.001 1.777.469 3.511 1.361 5.048l-.91 3.325 3.42-.897c1.517.828 3.086 1.258 4.649 1.258zm9.324-7.098c-.28-.14-1.657-.818-1.914-.911-.257-.093-.443-.14-.63.14-.186.28-.72.911-.883 1.097-.163.186-.327.21-.607.07-.28-.14-1.182-.436-2.25-1.39-.831-.742-1.391-1.658-1.554-1.938-.163-.28-.017-.431.123-.57.126-.125.28-.327.42-.49.14-.163.187-.28.28-.467.094-.187.047-.35-.023-.49-.07-.14-.63-1.517-.863-2.078-.228-.549-.46-.474-.63-.482-.163-.008-.35-.01-.537-.01-.186 0-.49.07-.747.35-.257.28-.98 0.958-.98 2.336 0 1.378 1.003 2.707 1.143 2.894.14.187 1.975 3.017 4.785 4.225.668.288 1.19.46 1.597.59.67.213 1.28.183 1.761.11.537-.08 1.657-.677 1.89-1.332.233-.655.233-1.216.163-1.332-.07-.116-.257-.186-.537-.327z" />
              </svg>
              <span>Consultar por WhatsApp</span>
            </a>

            {/* Botón Guardar en Favoritos */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`w-full py-3 px-6 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                isFav
                  ? 'bg-brand-red/5 border-brand-red/20 text-brand-red'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-brand-red hover:bg-slate-50'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${isFav ? 'text-brand-red fill-brand-red' : 'text-slate-400'}`}
              />
              <span>{isFav ? 'En tus favoritos' : 'Guardar en favoritos'}</span>
            </button>
          </div>

          {/* 3. Bloque de Entrega y Envíos */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <Truck className="h-4 w-4 text-brand-red" />
              <span>Formas de Entrega y Envíos</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="font-bold text-slate-900 uppercase">Retiro del local</strong>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="font-bold text-slate-900 uppercase">Envíos sin cargo dentro del radio urbano</strong>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="leading-relaxed">
                  <strong className="font-bold text-slate-900 uppercase">Envíos a otras localidades a coordinar</strong>, por Correo Argentino - Andreani - Mostto o transporte a designar de acuerdo al tamaño y servicios de logísticas disponibles para la zona del domicilio de entrega.
                </div>
              </li>
            </ul>
          </div>

          {/* Garantía y Seguridad */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white border border-slate-100 text-center space-y-0.5">
              <ShieldCheck className="h-4 w-4 text-brand-red mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">Garantía</h4>
              <p className="text-[11px] text-slate-500">
                {product.warrantyMonths && product.warrantyMonths > 0
                  ? `Oficial de ${product.warrantyMonths} meses`
                  : 'Respaldo directo de fábrica'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-100 text-center space-y-0.5">
              <Lock className="h-4 w-4 text-brand-red mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">Compra segura</h4>
              <p className="text-[11px] text-slate-500">Facturación y datos protegidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Descripción y Características del Producto */}
      <div className="border-t border-slate-200/80 pt-14 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Descripción */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Descripción del producto
          </h2>
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/70 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {sanitizeCorruptedSpanishText(product.description) || product.name}
          </div>
        </div>

        {/* Tabla de Características Clave */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Características principales
          </h3>
          <div className="rounded-2xl border border-slate-200/70 overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left text-xs">
              <tbody>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <td className="px-4 py-3.5 font-semibold text-slate-500 w-1/3">Marca</td>
                  <td className="px-4 py-3.5 text-brand-black font-bold">{product.brand.name}</td>
                </tr>
                <tr className="bg-white border-b border-slate-100">
                  <td className="px-4 py-3.5 font-semibold text-slate-500">Rubro</td>
                  <td className="px-4 py-3.5 text-brand-black font-medium">{product.productType.name}</td>
                </tr>
                {product.productCategory && product.productCategory.name !== 'Sin Categoría' && (
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <td className="px-4 py-3.5 font-semibold text-slate-500">Categoría</td>
                    <td className="px-4 py-3.5 text-brand-black font-medium">{product.productCategory.name}</td>
                  </tr>
                )}
                {product.dimensions && (
                  <tr className="bg-white border-b border-slate-100">
                    <td className="px-4 py-3.5 font-semibold text-slate-500">Dimensiones (cm)</td>
                    <td className="px-4 py-3.5 text-brand-black font-medium">{product.dimensions}</td>
                  </tr>
                )}
                {product.weightKg && (
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <td className="px-4 py-3.5 font-semibold text-slate-500">Peso aproximado</td>
                    <td className="px-4 py-3.5 text-brand-black font-medium">{product.weightKg} kg</td>
                  </tr>
                )}
                <tr className="bg-white">
                  <td className="px-4 py-3.5 font-semibold text-slate-500">Garantía oficial</td>
                  <td className="px-4 py-3.5 text-brand-black font-medium">
                    {product.warrantyMonths && product.warrantyMonths > 0
                      ? `${product.warrantyMonths} meses`
                      : 'No especificada'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Productos Relacionados ("También te puede interesar") */}
      {relatedProducts.length > 0 && (
        <section className="pt-14 border-t border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-brand-black">
              También te puede interesar
            </h2>
            <Link
              href={`/catalogo?type=${product.productType?.slug}`}
              className="text-xs sm:text-sm font-bold text-brand-red hover:underline inline-flex items-center gap-1 group self-start sm:self-auto"
            >
              <span>Ver más de {product.productType?.name}</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Modal Lightbox de Pantalla Completa */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-50 cursor-pointer"
            aria-label="Cerrar vista previa"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl"
            />

            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => changeImage(activeImageIdx === 0 ? product.images.length - 1 : activeImageIdx - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => changeImage(activeImageIdx === product.images.length - 1 ? 0 : activeImageIdx + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal de Medios de Pago y Financiación */}
      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-red" />
                  <h3 className="text-base font-extrabold text-brand-black">Medios de Pago y Cuotas</h3>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xs">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Opción Efectivo / Transferencia */}
            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100/80 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Transferencia o Efectivo
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Precio Especial
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {formatPrice(product.finalPrice)}
              </div>
              <p className="text-[11px] text-emerald-700">
                Abonando mediante transferencia bancaria inmediata o en efectivo en nuestro local.
              </p>
            </div>

            {/* Promoción Bancaria Destacada */}
            {installmentsConfig.bankPromoActive && installmentsConfig.bankPromoInstallments > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Promo Destacada: {installmentsConfig.bankPromoName}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    {installmentsConfig.bankPromoInstallments} cuotas sin interés de:
                  </span>
                  <span className="text-lg font-black text-indigo-950">
                    {formatPrice(bankPromoInstallmentAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Total financiado: {formatPrice(listPrice)} al precio de lista oficial con tarjetas emitidas por {installmentsConfig.bankPromoName}.
                </p>
              </div>
            )}

            {/* Tarjetas Bancarias en Cuotas Sin Interés */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tarjetas de Crédito Bancarias
                </h4>
                <span className="text-[11px] text-slate-400">Precio de lista: {formatPrice(listPrice)}</span>
              </div>

              <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50/50">
                  <span className="font-medium text-slate-700">1 pago sin interés</span>
                  <span className="font-bold text-slate-900">{formatPrice(listPrice)}</span>
                </div>
                {defaultInstallments >= 3 && (
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="font-medium text-slate-700">3 cuotas sin interés</span>
                    <span className="font-bold text-slate-900">{formatPrice(Math.round(listPrice / 3))} c/u</span>
                  </div>
                )}
                {defaultInstallments > 3 && (
                  <div className="flex items-center justify-between p-3 bg-slate-50/50">
                    <span className="font-bold text-slate-900">{defaultInstallments} cuotas sin interés</span>
                    <span className="font-black text-brand-red">{formatPrice(standardInstallmentAmount)} c/u</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Válido para tarjetas Visa, Mastercard, American Express y Cabal emitidas por entidades bancarias.
              </p>
            </div>

            {/* Botón de consulta vía WhatsApp */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Consultar financiación por WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

