'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Check,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { CheckoutStep } from '@papes-confort/shared';
import { useAuthStore } from '../../stores/auth';
import { useCartStore } from '../../stores/cart';
import { useCheckoutStore } from '../../stores/checkout';
import ShippingStep from '../../components/checkout/ShippingStep';
import PaymentStep from '../../components/checkout/PaymentStep';
import ReviewStep from '../../components/checkout/ReviewStep';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { items, subtotal, totalItems, isLoading: cartLoading, load: loadCart } = useCartStore();
  const { step, setStep } = useCheckoutStore();

  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set());

  // 1. Guard de Autenticación
  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/ingresar?redirect=/checkout');
    } else {
      loadCart();
    }
  }, [hasHydrated, isAuthenticated, router, loadCart]);

  // Si está hidratando o cargando auth
  if (!hasHydrated || (!isAuthenticated && hasHydrated)) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-red mb-4"></div>
        <p className="text-sm font-medium text-slate-500">Verificando sesión segura...</p>
      </main>
    );
  }

  // Carrito vacío
  if (!cartLoading && items.length === 0) {
    return (
      <main className="min-h-[70vh] max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-sm text-slate-500 mb-6">
          Para proceder con el checkout, primero agrega productos desde nuestro catálogo.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-8 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all"
        >
          Explorar Catálogo
        </Link>
      </main>
    );
  }

  const markStepCompleted = (s: CheckoutStep) => {
    setCompletedSteps((prev) => new Set([...prev, s]));
  };

  const stepsConfig = [
    {
      id: CheckoutStep.SHIPPING,
      title: '1. Opciones de Envío y Entrega',
      icon: Truck,
      component: <ShippingStep onComplete={() => markStepCompleted(CheckoutStep.SHIPPING)} />,
    },
    {
      id: CheckoutStep.PAYMENT,
      title: '2. Método de Pago',
      icon: CreditCard,
      component: (
        <PaymentStep
          onComplete={() => markStepCompleted(CheckoutStep.PAYMENT)}
          onBack={() => setStep(CheckoutStep.SHIPPING)}
        />
      ),
    },
    {
      id: CheckoutStep.REVIEW,
      title: '3. Revisión y Confirmación',
      icon: CheckCircle2,
      component: <ReviewStep onBack={() => setStep(CheckoutStep.PAYMENT)} />,
    },
  ];

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <main className="min-h-[85vh] bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        {/* Barra superior con volver y sello de seguridad */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/carrito"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-red transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            Volver al Carrito
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Checkout Seguro SSL</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 tracking-tight">
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Columna Izquierda: Acordeón de Pasos (2 columnas) */}
          <div className="lg:col-span-2 space-y-4">
            {stepsConfig.map((item, idx) => {
              const isActive = step === item.id;
              const isDone = completedSteps.has(item.id) && !isActive;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${
                    isActive
                      ? 'border-brand-red/30 shadow-md ring-1 ring-brand-red/10'
                      : isDone
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-slate-100 opacity-60'
                  }`}
                >
                  {/* Encabezado del Paso */}
                  <div
                    onClick={() => {
                      if (isDone) {
                        setStep(item.id);
                      }
                    }}
                    className={`flex items-center justify-between p-5 ${
                      isDone ? 'cursor-pointer hover:bg-slate-50/70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                          isActive
                            ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                      </div>

                      <div>
                        <h2 className="font-bold text-sm sm:text-base text-slate-900">
                          {item.title}
                        </h2>
                        {isDone && (
                          <p className="text-[11px] text-emerald-600 font-medium">
                            Completado — Haz clic para editar
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  </div>

                  {/* Contenido expandido del paso activo */}
                  {isActive && <div className="border-t border-slate-100 p-6">{item.component}</div>}
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Resumen Rápido Lateral (1 columna) */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sticky top-24 space-y-6">
            <h3 className="font-bold text-base text-slate-900 flex items-center justify-between border-b border-slate-100 pb-4">
              <span>Tu Pedido</span>
              <span className="text-xs font-normal text-slate-500">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </span>
            </h3>

            {/* Lista resumida de ítems */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-slate-400 text-[11px]">Cant: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {formatPrice(item.total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío:</span>
                <span className="text-slate-500">Calculado en el paso 1</span>
              </div>
              <div className="border-t border-slate-200/80 pt-3 flex justify-between text-base font-extrabold text-slate-900">
                <span>Total Estimado:</span>
                <span className="text-brand-red">{formatPrice(subtotal)}</span>
              </div>
            </div>

            {/* Badge de Confianza */}
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-start gap-2.5 text-slate-600 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <p className="font-bold text-slate-800">Compra 100% Protegida</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tus datos están resguardados bajo estándares bancarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
