'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Building2, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
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

  useEffect(() => {
    fetchApi<Record<string, string>>('/api/settings/public').then((res) => {
      if (res.success && res.data?.bank_transfer_instructions) {
        setInstructions(res.data.bank_transfer_instructions);
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      setError('Por favor seleccioná un medio de pago para continuar.');
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
          {/* Opción 1: Tarjeta Mobbex */}
          <div
            onClick={() => {
              setPaymentMethod(PaymentMethod.CARD);
              setError(null);
            }}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              paymentMethod === PaymentMethod.CARD
                ? 'border-brand-red bg-red-50/20 shadow-md ring-2 ring-brand-red/10'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-red" />
                  Tarjeta de Débito / Crédito
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === PaymentMethod.CARD}
                  onChange={() => setPaymentMethod(PaymentMethod.CARD)}
                  className="text-brand-red focus:ring-brand-red"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pagá de forma 100% segura a través de <strong>Mobbex</strong> con tarjetas Visa, Mastercard, Cabal y billeteras digitales.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Acreditación inmediata y cuotas disponibles</span>
            </div>
          </div>

          {/* Opción 2: Transferencia Bancaria */}
          <div
            onClick={() => {
              setPaymentMethod(PaymentMethod.TRANSFER);
              setError(null);
            }}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              paymentMethod === PaymentMethod.TRANSFER
                ? 'border-brand-red bg-red-50/20 shadow-md ring-2 ring-brand-red/10'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-red" />
                  Transferencia Bancaria
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === PaymentMethod.TRANSFER}
                  onChange={() => setPaymentMethod(PaymentMethod.TRANSFER)}
                  className="text-brand-red focus:ring-brand-red"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Te brindamos los datos de nuestra cuenta bancaria oficial para que transfieras desde tu banco o billetera virtual.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-amber-700 font-medium">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Reserva de stock activa por 72 horas</span>
            </div>
          </div>
        </div>
      </div>

      {paymentMethod === PaymentMethod.TRANSFER && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-amber-700" />
            Instrucciones para la Transferencia:
          </p>
          <p className="text-xs text-amber-800 leading-relaxed">{instructions}</p>
          <p className="text-[11px] text-amber-700 font-semibold">
            * Los datos bancarios (CBU, Alias y Titular) se mostrarán inmediatamente al confirmar tu pedido.
          </p>
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
