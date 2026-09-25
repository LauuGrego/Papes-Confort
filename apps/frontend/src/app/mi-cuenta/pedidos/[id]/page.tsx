'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Truck,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  Building2,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { OrderDetailDto, OrderStatus } from '@papes-confort/shared';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'PAID':
      return { label: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
    case 'PACKED':
      return { label: 'Empaquetado', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package };
    case 'SHIPPED':
      return { label: 'En camino', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck };
    case 'DELIVERED':
      return { label: 'Entregado', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle2 };
    case 'CANCELLED':
      return { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
    case 'PENDING_PAYMENT':
    case 'PENDING_CONFIRMATION':
    case 'PENDING_GATEWAY':
    default:
      return { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
  }
}

function getPaymentBadge(order: OrderDetailDto) {
  if (order.status === 'PAID' || order.paymentStatus === '200') {
    return {
      label: 'Pago Acreditado',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    };
  }
  if (order.status === 'CANCELLED' || (order.paymentStatus && ['400', '401', '500'].includes(order.paymentStatus))) {
    return {
      label: 'Pago Cancelado / Rechazado',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    };
  }
  return {
    label: order.paymentMethod === 'CARD' ? 'Esperando confirmación' : 'Esperando transferencia',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  };
}

const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Pendiente', icon: Clock },
  { key: 'PAID', label: 'Pagado', icon: CreditCard },
  { key: 'PACKED', label: 'Empaquetado', icon: Package },
  { key: 'SHIPPED', label: 'Enviado', icon: Truck },
  { key: 'DELIVERED', label: 'Entregado', icon: CheckCircle2 },
];

function getTimelineStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'PENDING_GATEWAY':
    case 'PENDING_CONFIRMATION':
    case 'PENDING_PAYMENT':
      return 1;
    case 'PAID':
      return 2;
    case 'PACKED':
      return 3;
    case 'SHIPPED':
      return 4;
    case 'DELIVERED':
      return 5;
    default:
      return 1;
  }
}

export default function DetallePedidoPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetchApi<OrderDetailDto>(`/api/customer/account/orders/${id}`);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.error || 'Pedido no encontrado');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos del pedido');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
        <p className="text-xs text-slate-500 font-medium">Cargando pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/mi-cuenta/pedidos"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-red transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Mis Pedidos
        </Link>
        <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'El pedido no fue encontrado o no tienes permisos para verlo.'}</span>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(order.status);
  const BadgeIcon = badge.icon;

  const paymentBadge = getPaymentBadge(order);
  const PaymentBadgeIcon = paymentBadge.icon;

  const currentStep = getTimelineStepIndex(order.status);

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <Link
        href="/mi-cuenta/pedidos"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-red transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
        Volver a Mis Pedidos
      </Link>

      {/* Encabezado Pedido */}
      <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-black text-brand-black">Pedido #{order.orderNumber}</h2>
            {/* Badge de Estado del Pedido */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
            >
              <BadgeIcon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
            {/* Badge de Estado del Pago */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${paymentBadge.color}`}
            >
              <PaymentBadgeIcon className="h-3.5 w-3.5" />
              {paymentBadge.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Realizado el {formattedDate}</p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-400">Total del Pedido</p>
          <p className="text-2xl font-black text-brand-red">{formatPrice(order.total)}</p>
        </div>
      </div>

      {/* Timeline visual de 5 pasos */}
      {order.status === 'CANCELLED' ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="font-bold">Este pedido ha sido cancelado</p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Si tuviste algún inconveniente con el pago o necesitás asistencia, podés contactarnos por WhatsApp.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-6 px-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Seguimiento del Estado
          </h3>

          <div className="relative flex items-center justify-between max-w-2xl mx-auto px-2 sm:px-6">
            {/* Barra conectora de fondo */}
            <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-100 -translate-y-1/2 z-0" />

            {/* Barra conectora activa */}
            <div
              className="absolute top-1/2 left-6 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (TIMELINE_STEPS.length - 1)) * 100))}%`,
              }}
            />

            {TIMELINE_STEPS.map((step, idx) => {
              const stepNumber = idx + 1;
              const isPast = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-brand-red text-white ring-4 ring-brand-red/20 shadow-md shadow-brand-red/25'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-2 whitespace-nowrap ${
                      isCurrent ? 'text-brand-red' : isPast ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de Datos de Envío y Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Datos de Entrega */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Truck className="h-4 w-4 text-brand-red" />
            <span>Datos de Entrega</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p><strong>Destinatario:</strong> {order.customerName}</p>
            {order.customerPhone && <p><strong>Teléfono:</strong> {order.customerPhone}</p>}
            <p><strong>Dirección:</strong> {order.shippingAddress}</p>
            <p><strong>Ciudad:</strong> {order.shippingCity} (CP: {order.shippingPostalCode})</p>
          </div>

          {/* Nota REMOTE */}
          {order.shippingType === 'REMOTE' && (
            <div className="mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 leading-relaxed">
              <strong>📦 Envío a Convenir:</strong> Los envíos a otras localidades son a coordinar con la empresa de transporte designada una vez preparado el paquete.
            </div>
          )}
        </div>

        {/* Método de Pago */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <CreditCard className="h-4 w-4 text-brand-red" />
              <span>Método de Pago</span>
            </div>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${paymentBadge.color}`}>
              {paymentBadge.label}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>
              <strong>Forma de Pago:</strong>{' '}
              {order.paymentMethod === 'CARD'
                ? `Tarjeta (Mobbex)${order.installmentsCount ? ` - ${order.installmentsCount} cuotas` : ''}`
                : 'Transferencia Bancaria'}
            </p>
            {order.gatewayCheckoutId && (
              <p className="font-mono text-[11px] text-slate-500">
                ID Checkout: {order.gatewayCheckoutId}
              </p>
            )}
          </div>

          {/* Si es transferencia y aún no está pagado, mostrar datos bancarios */}
          {order.paymentMethod === 'TRANSFER' && order.status !== 'PAID' && order.bankAccount && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand-red" />
                Datos para Transferir:
              </p>
              <p><strong>CBU:</strong> <code className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-bold">{order.bankAccount.cbu}</code></p>
              <p><strong>Alias:</strong> <strong className="text-brand-red font-mono text-xs">{order.bankAccount.alias}</strong></p>
              <p><strong>Titular:</strong> {order.bankAccount.accountHolder} ({order.bankAccount.bankName})</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Productos Comprados */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Package className="h-3.5 w-3.5" />
          Productos en el Pedido
        </h3>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right">Precio Unit.</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-black">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatPrice(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-black">{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Costos */}
      <div className="flex justify-end">
        <div className="w-full sm:w-72 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatPrice(order.subtotal)}</span>
          </div>
          {order.shippingCost > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Envío:</span>
              <span className="font-semibold">{formatPrice(order.shippingCost)}</span>
            </div>
          )}
          {order.bankDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Descuento bancario:</span>
              <span>-{formatPrice(order.bankDiscount)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-brand-black">
            <span>Total:</span>
            <span className="text-brand-red">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
