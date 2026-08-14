'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { PaymentFeatureCardDto } from '@papes-confort/shared';

const PAYMENT_LOGOS = [
  { name: 'Naranja X', src: '/images/payments/logo_naranja.png' },
  { name: 'Visa', src: '/images/payments/logo_visa.png' },
  { name: 'Mastercard', src: '/images/payments/logo_mastercard.png' },
  { name: 'American Express', src: '/images/payments/logo_amex.png' },
  { name: 'MODO', src: '/images/payments/logo_modo.webp' },
  { name: 'Cabal', src: '/images/payments/logo_cabal.png' },
  { name: 'Crédito Argentino', src: '/images/payments/logo_creditoargentino.webp' },
  { name: 'Tarjeta Cencosud', src: '/images/payments/logo_cencosud.webp' },
];

const DEFAULT_CARDS: PaymentFeatureCardDto[] = [
  {
    id: 'card-1',
    title: 'Hasta 12 cuotas sin interés',
    description: 'Con tarjetas bancarias seleccionadas en toda la tienda.',
    icon: 'credit-card',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'card-2',
    title: '10% de descuento',
    description: 'Abonando mediante transferencia bancaria inmediata.',
    icon: 'percent',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'card-3',
    title: 'Pago con QR y MODO',
    description: 'Escaneá de forma rápida y segura desde la app de tu banco.',
    icon: 'qr-code',
    isActive: true,
    sortOrder: 3,
  },
];

export default function PaymentMethods() {
  const [cards, setCards] = useState<PaymentFeatureCardDto[]>(DEFAULT_CARDS);

  useEffect(() => {
    async function loadPaymentCards() {
      const res = await fetchApi<Record<string, string>>('/api/settings/public');
      if (res.success && res.data && res.data.home_payment_cards) {
        try {
          const parsed = JSON.parse(res.data.home_payment_cards);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const activeOnly = parsed
              .filter((c: PaymentFeatureCardDto) => c.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            setCards(activeOnly);
          }
        } catch {
          // Si falla el parseo, mantiene las tarjetas por defecto
        }
      }
    }
    loadPaymentCards();
  }, []);

  return (
    <section className="w-full bg-white border-y border-slate-200 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-black tracking-tight">
            Pagá como quieras
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto">
            Te ofrecemos múltiples opciones de financiación y medios de pago para que te lleves lo que necesitas.
          </p>
        </div>

        {/* Logos container */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5 items-center justify-center mb-12">
          {PAYMENT_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all duration-300 h-20 group"
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-10 md:h-12 w-auto max-w-full object-contain filter drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Dynamic financing benefit cards with sequential numbers */}
        {cards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all duration-200"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/60 font-black text-brand-red text-base">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-sm font-bold text-slate-900 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
