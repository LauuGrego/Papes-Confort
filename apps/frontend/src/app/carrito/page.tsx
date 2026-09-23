'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, MessageSquare, AlertCircle, Truck } from 'lucide-react';
import { useCartStore } from '../../stores/cart';
import { fetchApi } from '../../lib/api';

export default function CarritoPage() {
  const { items, subtotal, totalItems, isLoading, error, load, updateQuantity, removeItem } = useCartStore();
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261'); // Fallback por defecto
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    load();
    
    // Cargar número de WhatsApp público
    fetchApi<{ whatsapp_number: string }>('/api/settings/public').then((res) => {
      if (res.success && res.data?.whatsapp_number) {
        setWhatsappNumber(res.data.whatsapp_number);
      }
    });
  }, [load]);

  const handleUpdateQty = async (productId: string, currentQty: number, delta: number) => {
    setActionError(null);
    try {
      await updateQuantity(productId, currentQty + delta);
    } catch (err: any) {
      setActionError(err.message || 'Error al actualizar cantidad');
      // Quitar el error después de 4 segundos
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleRemove = async (productId: string) => {
    setActionError(null);
    try {
      await removeItem(productId);
    } catch (err: any) {
      setActionError(err.message || 'Error al eliminar producto');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleSendWhatsApp = () => {
    if (items.length === 0) return;

    let mensaje = 'Hola Papes Confort, quiero realizar el siguiente pedido:\n\n';
    mensaje += '*Detalle de Productos:*\n';
    
    items.forEach((item) => {
      const formattedPrice = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(item.unitPrice);
      
      const formattedTotal = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(item.total);

      mensaje += `- ${item.quantity}x ${item.productName} (${item.brand}) [SKU: ${item.sku}] - ${formattedPrice} c/u (Total: ${formattedTotal})\n`;
    });

    const formattedSubtotal = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(subtotal);

    mensaje += `\n*Total estimado:* ${formattedSubtotal}\n`;
    mensaje += 'Quedo a la espera de su confirmación para coordinar el pago y el envío.';

    const encodedText = encodeURIComponent(mensaje);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isLoading && items.length === 0) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-16 flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-red"></div>
        <p className="mt-4 text-slate-500 font-medium">Cargando tu carrito...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[80vh] max-w-7xl px-6 py-12 text-brand-black">
      {/* Volver al Catálogo */}
      <Link
        href="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-red transition-colors duration-200 mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Volver al catálogo
      </Link>

      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-8">
        Tu Carrito
      </h1>

      {actionError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 animate-pulse">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {error && !actionError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl py-20 px-6 text-center">
          <img
            src="/images/logo/isotipo.svg"
            alt="Carrito vacío"
            className="h-20 w-20 opacity-30 mb-6"
          />
          <h2 className="text-xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-500 max-w-sm mb-8">
            Parece que aún no has agregado productos. Explora nuestro catálogo y encuentra lo que necesitas.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-8 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all duration-300 hover:scale-[1.02]"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Listado de Productos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const formattedPrice = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(item.unitPrice * (1 - item.discount / 100));

              return (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-100 rounded-2xl p-4 bg-white hover:shadow-md transition-shadow duration-300 gap-4"
                >
                  {/* Foto y Detalles del Producto */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2 relative">
                      <img
                        src={item.imageUrl || '/images/logo/isotipo.svg'}
                        alt={item.productName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-snug line-clamp-2">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Marca: <span className="font-semibold">{item.brand}</span> | SKU: <span className="font-mono">{item.sku}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-extrabold text-brand-red">{formattedPrice}</span>
                        {item.discount > 0 && (
                          <>
                            <span className="text-xs text-slate-400 line-through">
                              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.unitPrice)}
                            </span>
                            <span className="text-[10px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded">
                              {item.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cantidades y Eliminar */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    {/* Controladores de cantidad */}
                    <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 p-1">
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity, -1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity, 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Eliminar item */}
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-brand-red hover:bg-red-50 transition-all duration-200"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen del pedido */}
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 sticky top-28">
            <h2 className="font-display text-lg font-bold mb-6">Resumen del Pedido</h2>
            
            <div className="space-y-3 pb-6 border-b border-slate-200 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalItems} productos)</span>
                <span>
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  }).format(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío</span>
                <span className="text-green-600 font-semibold">Coordinar con vendedor</span>
              </div>
            </div>

            <div className="flex justify-between font-extrabold text-lg py-6">
              <span>Total Estimado</span>
              <span className="text-brand-red">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                }).format(subtotal)}
              </span>
            </div>

            <button
              onClick={handleSendWhatsApp}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-full bg-brand-red text-base font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare className="h-5 w-5" />
              Enviar pedido por WhatsApp
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
              Al hacer clic serás redirigido a WhatsApp para finalizar la cotización y envío de tus productos de forma directa.
            </p>

            {/* Opciones de Entrega y Envíos */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Truck className="h-4 w-4 text-brand-red" />
                <span>Opciones de Entrega y Envíos</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-slate-800">•</span>
                  <span><strong className="text-slate-900 uppercase">Retiro del local</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-slate-800">•</span>
                  <span><strong className="text-slate-900 uppercase">Envíos sin cargo dentro del radio urbano</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-slate-800">•</span>
                  <span className="leading-relaxed"><strong className="text-slate-900 uppercase">Envíos a otras localidades a coordinar</strong>, por Correo Argentino - Andreani - Mostto o transporte a designar de acuerdo al tamaño y servicios de logísticas disponibles para la zona del domicilio de entrega.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
