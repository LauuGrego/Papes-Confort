'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Package, Truck, CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import { OrderDto, OrderStatus } from '@papes-confort/shared';

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

export default function DetallePedidoPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetchApi<OrderDto>(`/api/customer/account/orders/${id}`);
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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-brand-black">Pedido #{order.orderNumber}</h2>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
            >
              <BadgeIcon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Realizado el {formattedDate}</p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-400">Total del Pedido</p>
          <p className="text-2xl font-black text-brand-red">{formatPrice(order.total)}</p>
        </div>
      </div>

      {/* Grid de Datos de Envío y Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <CreditCard className="h-4 w-4 text-brand-red" />
            <span>Método de Pago</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              <strong>Forma de Pago:</strong>{' '}
              {order.paymentMethod === 'CARD' ? 'Tarjeta de Débito / Crédito' : 'Transferencia Bancaria'}
            </p>
            <p>
              <strong>Estado de Pago:</strong>{' '}
              {order.status === 'PAID' ? 'Acreditado y Confirmado' : 'Pendiente de acreditación'}
            </p>
          </div>
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
