'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Building2, ArrowRight, ArrowLeft, AlertCircle, Clock, Info } from 'lucide-react';
import { CheckoutStep, PaymentMethod } from '@papes-confort/shared';
import { useCheckoutStore } from '../../stores/checkout';
import { fetchApi } from '../../lib/api';

interface PaymentStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function PaymentStep({ onComplete, onBack }: PaymentStepProps) {
  const { paymentMethod, setPaymentMethod, setStep } = useCheckoutStore();
  const [instructions, setInstructions] = useState<string>(
    'Aboná mediante transferencia y compartinos tu comprobante para procesar el pedido.'
  );
  const [error, setError] = useState<string | null>(null);

  // Asegurar que quede preseleccionada Transferencia Bancaria por defecto
  useEffect(() => {
    if (!paymentMethod || paymentMethod === PaymentMethod.CARD) {
      setPaymentMethod(PaymentMethod.TRANSFER);
    }
  }, [paymentMethod, setPaymentMethod]);

  useEffect(() => {
    fetchApi<Record<string, string>>('/api/settings/public').then((res) => {
      if (res.success && res.data?.bank_transfer_instructions) {
        setInstructions(res.data.bank_transfer_instructions);
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || paymentMethod === PaymentMethod.CARD) {
      setError('Actualmente solo está habilitado el pago por Transferencia Bancaria.');
      return;
    }
    setError(null);
    onComplete();
    setStep(CheckoutStep.REVIEW);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Elegí cómo abonar
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opción 1: Transferencia Bancaria (Activa y Preseleccionada) */}
          <div
            onClick={() => {
              setPaymentMethod(PaymentMethod.TRANSFER);
              setError(null);
            }}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
              paymentMethod === PaymentMethod.TRANSFER
                ? 'border-brand-red bg-red-50/20 shadow-md ring-2 ring-brand-red/10'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-red" />
                  <span>Transferencia Bancaria</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 uppercase tracking-wider">
                    Disponible
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === PaymentMethod.TRANSFER}
                    onChange={() => setPaymentMethod(PaymentMethod.TRANSFER)}
                    className="text-brand-red focus:ring-brand-red cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Te brindamos los datos de nuestra cuenta bancaria oficial para que transfieras desde tu banco o billetera virtual.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-amber-700 font-semibold">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Reserva de stock asegurada por 72 hs hábiles</span>
            </div>
          </div>

          {/* Opción 2: Tarjeta Mobbex (En Habilitación / Próximamente) */}
          <div
            className="p-5 rounded-2xl border-2 border-slate-200/80 bg-slate-50/70 opacity-80 cursor-not-allowed flex flex-col justify-between relative select-none"
            title="Pagos con tarjeta en proceso de habilitación comercial. Por favor utilizá Transferencia Bancaria."
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-slate-600 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  <span>Tarjeta de Débito / Crédito</span>
                </span>
                <span className="rounded-full bg-amber-100 border border-amber-200/80 text-amber-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  Próximamente
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pagos en cuotas y acreditación instantánea con Visa, Mastercard, Cabal y billeteras digitales.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-start gap-2 text-[11px] text-amber-800 font-medium">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span className="leading-tight">
                Pagos con tarjeta en proceso de habilitación comercial. Por favor utilizá <strong>Transferencia Bancaria</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {paymentMethod === PaymentMethod.TRANSFER && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4.5 text-xs text-amber-900 space-y-2.5">
          <p className="font-bold text-sm text-amber-950 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-red" />
            <span>Instrucciones y Horarios de Transferencia</span>
          </p>
          <p className="text-xs text-amber-900 leading-relaxed">{instructions}</p>
          
          <div className="pt-2 border-t border-amber-200/80 space-y-1.5 text-[11px] text-amber-800">
            <p className="flex items-start gap-1.5">
              <span className="font-bold text-amber-950">⏰ Transferí las 24 hs:</span>
              <span>
                Podés realizar tu compra y transferir en cualquier momento del día. La corroboración manual del pago por parte de administración se realiza en horario de atención comercial o en la próxima apertura del local al día hábil siguiente.
              </span>
            </p>
            <p className="flex items-center gap-1.5 font-bold text-amber-950">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              <span>Tu reserva de stock queda asegurada durante 72 horas hábiles.</span>
            </p>
            <p className="text-[10px] text-slate-500 italic pt-0.5">
              * Los datos bancarios completos (CBU, Alias y Titular) se mostrarán inmediatamente al confirmar el pedido.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botones de Navegación */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Envío</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all duration-200 hover:scale-[1.01]"
        >
          <span>Revisar Pedido</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
