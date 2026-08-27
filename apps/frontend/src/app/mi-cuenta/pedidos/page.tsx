'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Loader2, ArrowRight, AlertCircle, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { fetchApi } from '../../../lib/api';
import { OrderDto, OrderStatus, PaginatedResponse } from '@papes-confort/shared';

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

export default function MisPedidosPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetchApi<PaginatedResponse<OrderDto>>('/api/customer/account/orders?limit=30');
        if (res.success && res.data) {
          setOrders(res.data.items || []);
          setTotal(res.data.total || 0);
        } else {
          setError(res.error || 'Error al cargar tus pedidos');
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
        <p className="text-xs text-slate-500 font-medium">Cargando tus pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-xs flex items-center gap-3">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-black">Historial de Pedidos</h2>
          <p className="text-xs text-slate-500 mt-1">Revisá el estado y detalle de tus compras realizadas.</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
          {total} {total === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-3xl p-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Aún no has realizado pedidos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Cuando realices una compra en nuestra tienda online, podrás seguir su estado desde aquí.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex h-10 items-center justify-center rounded-full bg-brand-red px-6 text-xs font-bold text-white shadow-md shadow-brand-red/20 hover:bg-brand-red-dark transition-all"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;
            const formattedTotal = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(order.total);

            const formattedDate = new Date(order.createdAt).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const totalItemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-brand-black">#{order.orderNumber}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                    >
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>
                      {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-base font-extrabold text-brand-red">{formattedTotal}</p>
                  </div>

                  <Link
                    href={`/mi-cuenta/pedidos/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors group"
                  >
                    <span>Ver Detalle</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
