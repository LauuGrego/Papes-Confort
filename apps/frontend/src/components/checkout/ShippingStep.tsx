'use client';

import { useState, useEffect } from 'react';
import { Truck, Store, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { CheckoutStep, ShippingType } from '@papes-confort/shared';
import { useCheckoutStore } from '../../stores/checkout';
import { useAuthStore } from '../../stores/auth';
import { fetchApi } from '../../lib/api';

interface ShippingStepProps {
  onComplete: () => void;
}

export default function ShippingStep({ onComplete }: ShippingStepProps) {
  const { shipping, setShipping, setStep } = useCheckoutStore();
  const { customer } = useAuthStore();

  const [localCost, setLocalCost] = useState<number>(0);
  const [remoteNote, setRemoteNote] = useState<string>('A coordinar transporte luego de la compra.');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar settings públicos de envíos
    fetchApi<Record<string, string>>('/api/settings/public').then((res) => {
      if (res.success && res.data) {
        if (res.data.local_shipping_cost !== undefined) {
          setLocalCost(Number(res.data.local_shipping_cost) || 0);
        }
        if (res.data.remote_shipping_note) {
          setRemoteNote(res.data.remote_shipping_note);
        }
      }
    });

    // Precargar datos del cliente si el store está en blanco
    if (customer) {
      setShipping({
        address: shipping.address || customer.address || '',
        city: shipping.city || customer.city || 'Basavilbaso',
        postalCode: shipping.postalCode || customer.postalCode || '3170',
        phone: shipping.phone || customer.phone || '',
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shipping.phone.trim()) {
      setError('Por favor ingresá un teléfono de contacto.');
      return;
    }

    if (shipping.shippingType !== ShippingType.LOCAL_FREE) {
      if (!shipping.address.trim()) {
        setError('Por favor ingresá tu calle y número para la entrega.');
        return;
      }
      if (!shipping.city.trim()) {
        setError('Por favor ingresá tu localidad / ciudad.');
        return;
      }
      if (!shipping.postalCode.trim()) {
        setError('Por favor ingresá el código postal.');
        return;
      }
    }

    onComplete();
    setStep(CheckoutStep.PAYMENT);
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Opciones de Modalidad de Envío */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Seleccioná la forma de entrega
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Envío Local */}
          <label
            className={`flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              shipping.shippingType === ShippingType.LOCAL_PAID
                ? 'border-brand-red bg-red-50/30 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="shippingType"
                value={ShippingType.LOCAL_PAID}
                checked={shipping.shippingType === ShippingType.LOCAL_PAID}
                onChange={() => setShipping({ shippingType: ShippingType.LOCAL_PAID })}
                className="mt-0.5 text-brand-red focus:ring-brand-red"
              />
              <div>
                <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-brand-red" />
                  Envío Local
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Basavilbaso y zona urbana</p>
              </div>
            </div>
            <div className="mt-3 text-right">
              <span className="text-xs font-extrabold text-slate-900">
                {localCost > 0 ? formatPrice(localCost) : 'Sin cargo'}
              </span>
            </div>
          </label>

          {/* 2. Retiro en Local (LOCAL_FREE) */}
          <label
            className={`flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              shipping.shippingType === ShippingType.LOCAL_FREE
                ? 'border-brand-red bg-red-50/30 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="shippingType"
                value={ShippingType.LOCAL_FREE}
                checked={shipping.shippingType === ShippingType.LOCAL_FREE}
                onChange={() => setShipping({ shippingType: ShippingType.LOCAL_FREE })}
                className="mt-0.5 text-brand-red focus:ring-brand-red"
              />
              <div>
                <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-brand-red" />
                  Retiro en Sucursal
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Basavilbaso, Entre Ríos</p>
              </div>
            </div>
            <div className="mt-3 text-right">
              <span className="text-xs font-extrabold text-emerald-600">Gratis</span>
            </div>
          </label>

          {/* 3. Envío Remoto / A convenir */}
          <label
            className={`flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              shipping.shippingType === ShippingType.REMOTE
                ? 'border-brand-red bg-red-50/30 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="shippingType"
                value={ShippingType.REMOTE}
                checked={shipping.shippingType === ShippingType.REMOTE}
                onChange={() => setShipping({ shippingType: ShippingType.REMOTE })}
                className="mt-0.5 text-brand-red focus:ring-brand-red"
              />
              <div>
                <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-red" />
                  Envío a Convenir
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Otras localidades / Expreso</p>
              </div>
            </div>
            <div className="mt-3 text-right">
              <span className="text-xs font-bold text-slate-500">A coordinar</span>
            </div>
          </label>
        </div>
      </div>

      {/* Nota para Envío Remoto */}
      {shipping.shippingType === ShippingType.REMOTE && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1">Información de Envíos a Convenir:</p>
          <p>{remoteNote}</p>
        </div>
      )}

      {/* Datos de Contacto y Dirección */}
      <div className="border-t border-slate-100 pt-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Datos de Contacto y Entrega
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teléfono de Contacto <span className="text-brand-red">*</span>
            </label>
            <input
              type="tel"
              value={shipping.phone}
              onChange={(e) => setShipping({ phone: e.target.value })}
              placeholder="Ej: 3445 123456"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10"
            />
          </div>

          {shipping.shippingType !== ShippingType.LOCAL_FREE && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Calle y Altura / Piso / Depto <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) => setShipping({ address: e.target.value })}
                  placeholder="Ej: Av. San Martín 456, Piso 2 B"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Localidad / Ciudad <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) => setShipping({ city: e.target.value })}
                  placeholder="Ej: Basavilbaso"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Código Postal <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping({ postalCode: e.target.value })}
                  placeholder="Ej: 3170"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Observaciones para la entrega o retiro (opcional)
        </label>
        <textarea
          rows={2}
          value={shipping.notes}
          onChange={(e) => setShipping({ notes: e.target.value })}
          placeholder="Ej: Tocar timbre 2B o dejar con encargado."
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/10"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botón Continuar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all duration-200 hover:scale-[1.01]"
        >
          <span>Continuar al Pago</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
