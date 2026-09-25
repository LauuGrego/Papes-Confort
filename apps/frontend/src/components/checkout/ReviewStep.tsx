'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, CreditCard, Building2, AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CreateOrderPayload, CreateOrderResponseDto, PaymentMethod, ShippingType } from '@papes-confort/shared';
import { useCheckoutStore } from '../../stores/checkout';
import { useCartStore } from '../../stores/cart';
import { fetchApi } from '../../lib/api';

interface ReviewStepProps {
  onBack: () => void;
}

export default function ReviewStep({ onBack }: ReviewStepProps) {
  const router = useRouter();
  const { shipping, paymentMethod, reset } = useCheckoutStore();
  const { items, subtotal, totalItems, clear: clearCart } = useCartStore();

  const [shippingCost, setShippingCost] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipping.shippingType === ShippingType.LOCAL_PAID) {
      fetchApi<Record<string, string>>('/api/settings/public').then((res) => {
        if (res.success && res.data?.local_shipping_cost) {
          setShippingCost(Number(res.data.local_shipping_cost) || 0);
        }
      });
    } else {
      setShippingCost(0);
    }
  }, [shipping.shippingType]);

  const total = subtotal + shippingCost;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const handleConfirmOrder = async () => {
    if (!paymentMethod) {
      setError('Medio de pago no seleccionado.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateOrderPayload = {
        paymentMethod,
        shippingType: shipping.shippingType,
        customerPhone: shipping.phone,
        shippingAddress:
          shipping.shippingType === ShippingType.LOCAL_FREE
            ? 'Retiro en Sucursal'
            : shipping.address,
        shippingCity:
          shipping.shippingType === ShippingType.LOCAL_FREE
            ? 'Basavilbaso'
            : shipping.city,
        shippingPostalCode:
          shipping.shippingType === ShippingType.LOCAL_FREE
            ? '3170'
            : shipping.postalCode,
        notes: shipping.notes || undefined,
      };

      const res = await fetchApi<CreateOrderResponseDto>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'No se pudo crear el pedido');
      }

      const orderData = res.data;

      // Limpiar carrito local
      await clearCart().catch(() => {});
      reset();

      // Redirigir según el método de pago
      if (orderData.paymentUrl) {
        // Mobbex checkout redirection
        window.location.href = orderData.paymentUrl;
      } else {
        // Transferencia bancaria -> resultado de pedido
        router.push(
          `/pedido/resultado?order=${encodeURIComponent(orderData.order.orderNumber)}&method=TRANSFER`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar tu pedido. Por favor intentalo nuevamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Entrega y Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloque Entrega */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-brand-red" />
              Modalidad de Entrega
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">
            {shipping.shippingType === ShippingType.LOCAL_FREE
              ? 'Retiro en Sucursal (Gratis)'
              : shipping.shippingType === ShippingType.LOCAL_PAID
              ? 'Envío Local (Basavilbaso)'
              : 'Envío a Convenir / Encomienda'}
          </p>
          {shipping.shippingType !== ShippingType.LOCAL_FREE ? (
            <p className="text-xs text-slate-600">
              {shipping.address}, {shipping.city} (CP {shipping.postalCode})
            </p>
          ) : (
            <p className="text-xs text-slate-600">Basavilbaso, Entre Ríos</p>
          )}
          <p className="text-xs text-slate-600">
            <strong>Teléfono:</strong> {shipping.phone}
          </p>
          {shipping.notes && (
            <p className="text-[11px] text-slate-500 italic mt-1">
              <strong>Nota:</strong> {shipping.notes}
            </p>
          )}
        </div>

        {/* Bloque Medio de Pago */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              {paymentMethod === PaymentMethod.CARD ? (
                <CreditCard className="h-4 w-4 text-brand-red" />
              ) : (
                <Building2 className="h-4 w-4 text-brand-red" />
              )}
              Método de Pago
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">
            {paymentMethod === PaymentMethod.CARD
              ? 'Tarjeta de Débito / Crédito (Mobbex)'
              : 'Transferencia Bancaria'}
          </p>
          <p className="text-xs text-slate-600">
            {paymentMethod === PaymentMethod.CARD
              ? 'Serás redirigido a la plataforma segura de Mobbex para ingresar tu tarjeta.'
              : 'Recibirás los datos bancarios y tendrás 72 hs para transferir.'}
          </p>
        </div>
      </div>

      {/* Lista de Productos */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Package className="h-4 w-4" />
          Productos ({totalItems})
        </h4>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white overflow-hidden">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between p-3.5 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1">
                  <img
                    src={item.imageUrl || '/images/logo/isotipo.svg'}
                    alt={item.productName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    SKU: {item.sku} • Cant: {item.quantity}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-slate-900">
                  {formatPrice(item.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desglose de Totales */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal productos:</span>
          <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Costo de envío:</span>
          <span className="font-semibold text-slate-900">
            {shippingCost > 0 ? formatPrice(shippingCost) : 'Sin cargo adicional'}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
          <span>Total a abonar:</span>
          <span className="text-brand-red text-lg">{formatPrice(total)}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Pago</span>
        </button>

        <button
          type="button"
          onClick={handleConfirmOrder}
          disabled={submitting}
          className="inline-flex items-center gap-2.5 rounded-full bg-brand-red px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/25 hover:bg-brand-red-dark disabled:opacity-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generando Pedido...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmar Pedido</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
