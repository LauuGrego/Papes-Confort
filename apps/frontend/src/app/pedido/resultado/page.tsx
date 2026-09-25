'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Building2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { OrderDetailDto, PaymentResult } from '@papes-confort/shared';
import { fetchApi } from '../../../lib/api';

function ResultadoPedidoContent() {
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get('order') || searchParams.get('orderNumber');
  const method = searchParams.get('method') || 'CARD';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [paymentStatusResult, setPaymentStatusResult] = useState<PaymentResult | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expirationHours, setExpirationHours] = useState<number>(72);

  // Cargar settings públicos (ej: expiration hours)
  useEffect(() => {
    fetchApi<Record<string, string>>('/api/settings/public').then((res) => {
      if (res.success && res.data?.transfer_expiration_hours) {
        setExpirationHours(Number(res.data.transfer_expiration_hours) || 72);
      }
    });
  }, []);

  // Cargar detalles de la orden
  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    async function loadInitial() {
      try {
        const res = await fetchApi<OrderDetailDto>(`/api/orders/${orderNumber}`);
        if (res.success && res.data) {
          setOrder(res.data);
          if (res.data.status === 'PAID') {
            setPaymentStatusResult(PaymentResult.APPROVED);
          } else if (res.data.status === 'CANCELLED') {
            setPaymentStatusResult(PaymentResult.REJECTED);
          }
        }
      } catch (err) {
        console.warn('Error al cargar datos del pedido:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, [orderNumber]);

  // Polling para pagos con TARJETA (Mobbex)
  useEffect(() => {
    if (!orderNumber || method !== 'CARD') return;
    if (paymentStatusResult === PaymentResult.APPROVED || paymentStatusResult === PaymentResult.REJECTED) return;

    const interval = setInterval(async () => {
      try {
        setPollCount((prev) => prev + 1);
        const res = await fetchApi<{
          status: string;
          paymentStatus: string | null;
          paymentResult: PaymentResult;
        }>(`/api/orders/${orderNumber}/status`);

        if (res.success && res.data) {
          if (res.data.paymentResult === PaymentResult.APPROVED) {
            setPaymentStatusResult(PaymentResult.APPROVED);
            clearInterval(interval);
          } else if (res.data.paymentResult === PaymentResult.REJECTED) {
            setPaymentStatusResult(PaymentResult.REJECTED);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 5000);

    // Timeout de polling tras 12 intentos (60s)
    if (pollCount >= 12) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [orderNumber, method, paymentStatusResult, pollCount]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  if (!orderNumber) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Pedido no especificado</h1>
        <p className="text-sm text-slate-500 mb-6">
          No se encontró el número de referencia del pedido solicitado.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-bold text-white hover:bg-brand-red-dark transition-colors"
        >
          Volver a la Tienda
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-red mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Cargando estado de tu pedido...</h2>
        <p className="text-xs text-slate-500">Por favor aguardá unos instantes.</p>
      </div>
    );
  }

  return (
    <main className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-slate-900">
      {/* 1. FLUJO TARJETA (MOBBEX) */}
      {method === 'CARD' && (
        <div className="space-y-6">
          {paymentStatusResult === PaymentResult.APPROVED ? (
            <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                ¡Tu pago fue acreditado con éxito!
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Muchas gracias por tu compra. Ya registramos el pago de tu pedido{' '}
                <strong className="text-slate-900 font-mono">#{orderNumber}</strong> y estamos
                preparando el empaque de tus productos.
              </p>

              {order && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 max-w-md mx-auto text-xs space-y-1.5 text-left">
                  <div className="flex justify-between text-slate-600">
                    <span>Destinatario:</span>
                    <strong className="text-slate-900">{order.customerName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total pagado:</span>
                    <strong className="text-brand-red font-bold text-sm">{formatPrice(order.total)}</strong>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/mi-cuenta/pedidos/${orderNumber}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all"
                >
                  <span>Ver Estado del Pedido</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/catalogo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Seguir Comprando
                </Link>
              </div>
            </div>
          ) : paymentStatusResult === PaymentResult.REJECTED ? (
            <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <XCircle className="h-10 w-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                El pago no pudo procesarse
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                La pasarela de pagos rechazó la transacción para el pedido{' '}
                <strong className="text-slate-900 font-mono">#{orderNumber}</strong>. No se ha realizado
                ningún cargo a tu tarjeta.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/checkout"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all"
                >
                  Reintentar Pago
                </Link>
                <Link
                  href="/carrito"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Volver al Carrito
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Verificando pago...
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Estamos aguardando la confirmación automática desde la pasarela Mobbex para el pedido{' '}
                <strong className="text-slate-900 font-mono">#{orderNumber}</strong>. Esta pantalla se
                actualizará sola en unos segundos.
              </p>

              <div className="pt-4">
                <Link
                  href={`/mi-cuenta/pedidos/${orderNumber}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>Continuar hacia Mi Cuenta</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. FLUJO TRANSFERENCIA BANCARIA */}
      {method === 'TRANSFER' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                ¡Pedido registrado con éxito!
              </h1>
              <p className="text-sm text-slate-600">
                Número de Pedido: <strong className="text-brand-red font-mono text-base">#{orderNumber}</strong>
              </p>
            </div>

            {/* Aviso de Reserva */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-xs text-amber-900">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Reserva de Stock Activa ({expirationHours} horas)</p>
                <p className="mt-0.5 leading-relaxed">
                  Tus productos permanecerán reservados durante las próximas {expirationHours} horas. Por favor realizá
                  la transferencia y compartinos tu comprobante para iniciar la preparación.
                </p>
              </div>
            </div>

            {/* Datos Bancarios para Transferencia */}
            {order?.bankAccount && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-red" />
                  Datos para Transferir
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-100">
                    <p className="text-slate-400 text-[11px]">Banco:</p>
                    <p className="font-bold text-slate-900">{order.bankAccount.bankName}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-100">
                    <p className="text-slate-400 text-[11px]">Titular de la Cuenta:</p>
                    <p className="font-bold text-slate-900">{order.bankAccount.accountHolder}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px]">CBU:</p>
                      <p className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                        {order.bankAccount.cbu}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.bankAccount!.cbu, 'cbu')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      {copiedField === 'cbu' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[11px]">Alias:</p>
                      <p className="font-mono font-bold text-brand-red text-base">
                        {order.bankAccount.alias}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.bankAccount!.alias, 'alias')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      {copiedField === 'alias' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-slate-200">
                  <span className="text-slate-600">Monto total a transferir:</span>
                  <span className="text-brand-red text-lg font-black">{formatPrice(order.total)}</span>
                </div>
              </div>
            )}

            {/* Siguientes Pasos */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-900">📌 Siguientes pasos:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Realizá la transferencia por el total exacto indicado.</li>
                <li>
                  Ingresá a la sección <strong>Mis Pedidos</strong> para ver el seguimiento y subir tu comprobante.
                </li>
                <li>Una vez que nuestro equipo corrobore el ingreso, el pedido pasará a empaquetado.</li>
              </ol>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/mi-cuenta/pedidos/${orderNumber}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all"
              >
                <span>Ir a Mis Pedidos</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/catalogo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Volver a la Tienda
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ResultadoPedidoPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-red mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando resultado del pedido...</p>
        </div>
      }
    >
      <ResultadoPedidoContent />
    </Suspense>
  );
}
