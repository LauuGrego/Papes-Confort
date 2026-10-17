'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchApi } from '../../../../lib/api';
import {
  OrderDetailDto,
  OrderStatus,
  PaymentMethod,
  ShippingType,
  PaginatedResponse,
  BankAccountDto,
} from '@papes-confort/shared';
import {
  Search,
  Loader2,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Landmark,
  CreditCard,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Printer,
  ExternalLink,
} from 'lucide-react';
import Pagination from '../../../../components/Pagination';

// Helper para formato moneda argentina
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper para formatear fechas
function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

// Configuración de visualización por estado
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType; badgeBg: string }
> = {
  [OrderStatus.PENDING_CONFIRMATION]: {
    label: 'Pendiente de Transferencia',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    badgeBg: 'bg-amber-500',
    icon: Clock,
  },
  [OrderStatus.PENDING_GATEWAY]: {
    label: 'Esperando Pasarela',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    badgeBg: 'bg-slate-400',
    icon: Clock,
  },
  [OrderStatus.PENDING_PAYMENT]: {
    label: 'Esperando Pago',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    badgeBg: 'bg-yellow-500',
    icon: Clock,
  },
  [OrderStatus.PAID]: {
    label: 'Pago Confirmado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    badgeBg: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  [OrderStatus.PACKED]: {
    label: 'En Preparación',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
    badgeBg: 'bg-blue-500',
    icon: Package,
  },
  [OrderStatus.SHIPPED]: {
    label: 'En Camino (Despachado)',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
    badgeBg: 'bg-purple-500',
    icon: Truck,
  },
  [OrderStatus.DELIVERED]: {
    label: 'Entregado',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    badgeBg: 'bg-slate-600',
    icon: CheckCircle2,
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    badgeBg: 'bg-rose-500',
    icon: XCircle,
  },
};

export default function AdminPedidosPage() {
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<PaginatedResponse<OrderDetailDto> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Listado de cuentas bancarias activas
  const [bankAccounts, setBankAccounts] = useState<BankAccountDto[]>([]);

  // Modales
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modal Confirmar Transferencia
  const [confirmTransferOrder, setConfirmTransferOrder] = useState<OrderDetailDto | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Modal Cambiar Estado
  const [statusChangeOrder, setStatusChangeOrder] = useState<OrderDetailDto | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Mensaje de éxito temporal
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carga de cuentas bancarias al montar
  useEffect(() => {
    async function loadBankAccounts() {
      try {
        const res = await fetchApi<BankAccountDto[]>('/api/admin/orders/meta/bank-accounts');
        if (res.success && Array.isArray(res.data)) {
          setBankAccounts(res.data);
          if (res.data.length > 0) {
            setSelectedBankId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error cargando cuentas bancarias:', err);
      }
    }
    loadBankAccounts();
  }, []);

  // Carga de pedidos
  const fetchOrders = async (
    p: number,
    query: string,
    statusVal: string,
    paymentVal: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', '12');

      if (query.trim()) params.set('search', query.trim());
      if (statusVal !== 'ALL') params.set('status', statusVal);
      if (paymentVal !== 'ALL') params.set('paymentMethod', paymentVal);

      const res = await fetchApi<PaginatedResponse<OrderDetailDto>>(
        `/api/admin/orders?${params.toString()}`
      );

      if (res.success && res.data) {
        setOrdersData(res.data);
      }
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, search, statusFilter, paymentFilter);
  }, [page, search, statusFilter, paymentFilter]);

  // Debounce buscador
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Manejo de Confirmar Transferencia
  const handleConfirmTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmTransferOrder || !selectedBankId) return;

    setConfirmLoading(true);
    setConfirmError(null);

    try {
      const res = await fetchApi<OrderDetailDto>(
        `/api/admin/orders/${confirmTransferOrder.id}/confirm-transfer`,
        {
          method: 'POST',
          body: JSON.stringify({ bankAccountId: selectedBankId }),
        }
      );

      if (res.success && res.data) {
        showToast(`¡Transferencia de la orden #${confirmTransferOrder.orderNumber} confirmada con éxito!`);
        setConfirmTransferOrder(null);
        if (selectedOrder?.id === confirmTransferOrder.id) {
          setSelectedOrder(res.data);
        }
        fetchOrders(page, search, statusFilter, paymentFilter);
      } else {
        setConfirmError(res.error || 'Error al confirmar la transferencia');
      }
    } catch (err: any) {
      setConfirmError(err.message || 'Error de red al confirmar la transferencia');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Manejo de Cambio de Estado
  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusChangeOrder || !newStatus) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      const res = await fetchApi<OrderDetailDto>(
        `/api/admin/orders/${statusChangeOrder.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.success && res.data) {
        showToast(`Orden #${statusChangeOrder.orderNumber} actualizada a estado ${STATUS_CONFIG[newStatus].label}.`);
        setStatusChangeOrder(null);
        if (selectedOrder?.id === statusChangeOrder.id) {
          setSelectedOrder(res.data);
        }
        fetchOrders(page, search, statusFilter, paymentFilter);
      } else {
        setStatusError(res.error || 'Error al actualizar estado');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Error de red al actualizar estado');
    } finally {
      setStatusLoading(false);
    }
  };

  // Contadores rápidos computados
  const stats = useMemo(() => {
    const items = ordersData?.items || [];
    const pendingTransfers = items.filter((o) => o.status === OrderStatus.PENDING_CONFIRMATION).length;
    const paidCount = items.filter((o) => o.status === OrderStatus.PAID || o.status === OrderStatus.PACKED).length;
    return {
      pendingTransfers,
      paidCount,
      totalLoaded: ordersData?.total || 0,
    };
  }, [ordersData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Gestión de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervisa las compras de la tienda, confirma transferencias bancarias y actualiza despachos.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(page, search, statusFilter, paymentFilter)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-red' : 'text-slate-400'}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas Resumen de Pedidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total de Pedidos
            </p>
            <h2 className="text-2xl font-black text-slate-800">{ordersData?.total ?? 0}</h2>
            <p className="text-[10px] text-slate-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white shadow-2xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                Por Confirmar Transferencia
              </p>
              {stats.pendingTransfers > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <h2 className="text-2xl font-black text-amber-900">{stats.pendingTransfers}</h2>
            <p className="text-[10px] text-amber-700/80">Requieren validar comprobante</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Pagados / En Curso
            </p>
            <h2 className="text-2xl font-black text-slate-800">{stats.paidCount}</h2>
            <p className="text-[10px] text-slate-400">Listos para empaquetar o enviar</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por orden (#PC-...), nombre, email, teléfono o referencia..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs text-brand-black placeholder:text-slate-400 outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/10 transition-all font-sans"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro Método de Pago */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
              Pago:
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 outline-none focus:border-brand-red/40 cursor-pointer"
            >
              <option value="ALL">Todos los medios</option>
              <option value={PaymentMethod.TRANSFER}>Transferencia Bancaria</option>
              <option value={PaymentMethod.CARD}>Tarjeta (Mobbex)</option>
            </select>
          </div>
        </div>

        {/* Píldoras de Filtro por Estado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Estado:
          </span>
          {[
            { key: 'ALL', label: 'Todos' },
            { key: OrderStatus.PENDING_CONFIRMATION, label: 'Pendiente Transferencia' },
            { key: OrderStatus.PAID, label: 'Pagados' },
            { key: OrderStatus.PACKED, label: 'En Preparación' },
            { key: OrderStatus.SHIPPED, label: 'En Camino' },
            { key: OrderStatus.DELIVERED, label: 'Entregados' },
            { key: OrderStatus.CANCELLED, label: 'Cancelados' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listado / Tabla de Pedidos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Cargando pedidos...</span>
          </div>
        ) : !ordersData || ordersData.items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No se encontraron pedidos</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay compras que coincidan con los filtros o el término de búsqueda ingresado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Orden</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Medio de Pago</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Total</th>
                  <th className="px-5 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersData.items.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-300',
                    icon: Clock,
                  };
                  const StatusIcon = statusInfo.icon;
                  const isTransferPending = order.status === OrderStatus.PENDING_CONFIRMATION;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isTransferPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Número de orden y fecha */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-extrabold text-slate-900 text-xs">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">{order.customerEmail}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{order.customerPhone}</span>
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Contactar por WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 ml-1"
                            >
                              <ExternalLink className="h-3 w-3 inline" />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Método de pago */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                          {order.paymentMethod === PaymentMethod.TRANSFER ? (
                            <>
                              <Landmark className="h-3.5 w-3.5 text-brand-navy" />
                              <span>Transferencia</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3.5 w-3.5 text-brand-red" />
                              <span>Tarjeta (Mobbex)</span>
                            </>
                          )}
                        </div>
                        {order.bankAccount && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[160px]">
                            {order.bankAccount.bankName} ({order.bankAccount.alias})
                          </p>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>{statusInfo.label}</span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right">
                        <div className="font-extrabold text-slate-900 text-sm font-sans">
                          {formatCurrency(Number(order.total))}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botón especial: Confirmar Transferencia */}
                          {isTransferPending && (
                            <button
                              onClick={() => {
                                setConfirmTransferOrder(order);
                                if (order.bankAccount?.id) {
                                  setSelectedBankId(order.bankAccount.id);
                                } else if (bankAccounts.length > 0) {
                                  setSelectedBankId(bankAccounts[0].id);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Validar y confirmar transferencia bancaria"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Confirmar Pago</span>
                            </button>
                          )}

                          {/* Ver Detalle */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Ver detalle del pedido"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Cambiar Estado */}
                          <button
                            onClick={() => {
                              setStatusChangeOrder(order);
                              setNewStatus(order.status);
                            }}
                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-red hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Cambiar estado del pedido"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {ordersData && ordersData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={ordersData.totalPages}
              totalItems={ordersData.total}
              itemLabel="pedidos"
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: DETALLE DE ORDEN COMPLETO */}
      {/* ======================================================== */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-slate-900">
                    Orden #{selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      STATUS_CONFIG[selectedOrder.status]?.bg
                    } ${STATUS_CONFIG[selectedOrder.status]?.text} ${
                      STATUS_CONFIG[selectedOrder.status]?.border
                    }`}
                  >
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Emitida el {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow text-xs">
              {/* Bloque 1: Datos del Comprador y Envío */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Comprador
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</p>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedOrder.customerEmail}</span>
                  </p>
                  {selectedOrder.customerPhone && (
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedOrder.customerPhone}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dirección de Entrega
                  </span>
                  <p className="font-semibold text-slate-800 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-red shrink-0 mt-0.5" />
                    <span>
                      {selectedOrder.shippingAddress || 'Retiro en Sucursal / Local'}
                      {selectedOrder.shippingCity && `, ${selectedOrder.shippingCity}`}
                      {selectedOrder.shippingPostalCode && ` (CP: ${selectedOrder.shippingPostalCode})`}
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Tipo de envío:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedOrder.shippingType === ShippingType.LOCAL_FREE
                        ? 'Retiro en Sucursal / Gratis'
                        : selectedOrder.shippingType === ShippingType.LOCAL_PAID
                        ? 'Envío Local'
                        : 'Envío a Domicilio'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Bloque 2: Información de Pago */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Información de Pago
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selectedOrder.paymentMethod === PaymentMethod.TRANSFER ? (
                      <Landmark className="h-4 w-4 text-brand-navy" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-brand-red" />
                    )}
                    <span className="font-bold text-slate-800">
                      {selectedOrder.paymentMethod === PaymentMethod.TRANSFER
                        ? 'Transferencia Bancaria'
                        : 'Tarjeta de Crédito / Débito (Mobbex)'}
                    </span>
                  </div>

                  {selectedOrder.paymentStatus && (
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      Estado Gateway: {selectedOrder.paymentStatus}
                    </span>
                  )}
                </div>

                {selectedOrder.bankAccount && (
                  <div className="pt-2 text-[11px] text-slate-600 border-t border-slate-100 space-y-0.5">
                    <p>
                      <strong>Banco:</strong> {selectedOrder.bankAccount.bankName}
                    </p>
                    <p>
                      <strong>Alias:</strong> {selectedOrder.bankAccount.alias} |{' '}
                      <strong>CBU:</strong> {selectedOrder.bankAccount.cbu}
                    </p>
                    <p>
                      <strong>Titular:</strong> {selectedOrder.bankAccount.accountHolder}
                    </p>
                  </div>
                )}
              </div>

              {/* Bloque 3: Productos Solicitados */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Productos ({selectedOrder.items?.length || 0})
                </span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 bg-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <img
                            src={item.imageUrl || '/images/logo/isotipo.svg'}
                            alt={item.productName}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/logo/isotipo.svg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {item.productName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            SKU: {item.sku} | Cantidad: <strong className="text-slate-700">{item.quantity}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatCurrency(Number(item.total))}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatCurrency(Number(item.unitPrice))} c/u
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 4: Resumen de Totales */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span className="font-semibold">{formatCurrency(Number(selectedOrder.subtotal))}</span>
                </div>
                {Number(selectedOrder.bankDiscount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento bancario:</span>
                    <span className="font-semibold">
                      -{formatCurrency(Number(selectedOrder.bankDiscount))}
                    </span>
                  </div>
                )}
                {Number(selectedOrder.shippingCost) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Costo de envío:</span>
                    <span className="font-semibold">
                      +{formatCurrency(Number(selectedOrder.shippingCost))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Final:</span>
                  <span className="text-brand-red">{formatCurrency(Number(selectedOrder.total))}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3.5 bg-yellow-50/70 border border-yellow-200/80 rounded-2xl">
                  <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider block mb-1">
                    Nota del Cliente:
                  </span>
                  <p className="text-xs text-yellow-900">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Comprobante</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedOrder.status === OrderStatus.PENDING_CONFIRMATION && (
                  <button
                    onClick={() => {
                      setConfirmTransferOrder(selectedOrder);
                      if (selectedOrder.bankAccount?.id) {
                        setSelectedBankId(selectedOrder.bankAccount.id);
                      } else if (bankAccounts.length > 0) {
                        setSelectedBankId(bankAccounts[0].id);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmar Transferencia</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONFIRMAR TRANSFERENCIA BANCARIA */}
      {/* ======================================================== */}
      {confirmTransferOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-800">
                <Landmark className="h-5 w-5" />
                <h3 className="text-base font-extrabold">Confirmar Transferencia</h3>
              </div>
              <button
                onClick={() => setConfirmTransferOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransferSubmit} className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p>
                  Estás a punto de confirmar el pago de la orden{' '}
                  <strong className="font-mono">#{confirmTransferOrder.orderNumber}</strong>.
                </p>
                <p>
                  Monto a validar:{' '}
                  <strong className="text-sm font-black text-amber-950">
                    {formatCurrency(Number(confirmTransferOrder.total))}
                  </strong>
                </p>
                <p className="text-[11px] text-amber-700 pt-1">
                  Al confirmar, la orden pasará a estado <strong>PAGADO</strong> y se notificará automáticamente al comprador por correo.
                </p>
              </div>

              {confirmError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{confirmError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Cuenta bancaria donde ingresó el dinero:
                </label>
                {bankAccounts.length === 0 ? (
                  <p className="text-xs text-rose-500">
                    No hay cuentas bancarias activas registradas en la base de datos.
                  </p>
                ) : (
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold outline-none focus:border-brand-red cursor-pointer"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - Alias: {b.alias} (CBU: {b.cbu})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmTransferOrder(null)}
                  disabled={confirmLoading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirmLoading || !selectedBankId}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {confirmLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Aprobar Pago</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CAMBIAR ESTADO DE LA ORDEN */}
      {/* ======================================================== */}
      {statusChangeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800">
                Cambiar Estado del Pedido
              </h3>
              <button
                onClick={() => setStatusChangeOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStatusChangeSubmit} className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                Modificando el estado de la orden{' '}
                <strong className="font-mono text-slate-900">
                  #{statusChangeOrder.orderNumber}
                </strong>
                .
              </div>

              {statusError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Selecciona el nuevo estado:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold outline-none focus:border-brand-red cursor-pointer"
                >
                  <option value={OrderStatus.PENDING_CONFIRMATION}>Pendiente de Transferencia</option>
                  <option value={OrderStatus.PENDING_PAYMENT}>Esperando Pago</option>
                  <option value={OrderStatus.PAID}>Pago Confirmado</option>
                  <option value={OrderStatus.PACKED}>En Preparación (Empaquetado)</option>
                  <option value={OrderStatus.SHIPPED}>En Camino (Despachado)</option>
                  <option value={OrderStatus.DELIVERED}>Entregado al Cliente</option>
                  <option value={OrderStatus.CANCELLED}>Cancelado</option>
                </select>
              </div>

              {newStatus === OrderStatus.SHIPPED && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-[11px] rounded-xl leading-relaxed">
                  🚚 <strong>Aviso automático:</strong> Al guardar como <em>En Camino (Despachado)</em>, se enviará un email al cliente confirmándole el despacho del pedido con el detalle de entrega y recordatorio de contacto por WhatsApp para garantías o consultas.
                </div>
              )}

              {newStatus === OrderStatus.CANCELLED && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl leading-relaxed">
                  ⚠️ <strong>Atención:</strong> Al cancelar el pedido, los productos reservados serán devueltos automáticamente al stock disponible de la tienda.
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusChangeOrder(null)}
                  disabled={statusLoading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={statusLoading || !newStatus}
                  className="px-5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-xs shadow-md shadow-brand-navy/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span>Guardar Estado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
