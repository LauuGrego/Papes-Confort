'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, BadgePercent, QrCode, ShieldCheck, ArrowRight, Truck } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { PaymentFeatureCardDto } from '@papes-confort/shared';

const DEFAULT_CARDS: PaymentFeatureCardDto[] = [
  {
    id: 'card-1',
    title: 'Hasta 12 cuotas sin interés',
    description: 'Aboná con Visa, Mastercard, Naranja X, American Express o Cabal con promociones vigentes.',
    icon: 'credit-card',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'card-2',
    title: 'Descuento en Efectivo o Transferencia',
    description: 'Obtené el mejor precio de contado realizando transferencia bancaria inmediata o en local.',
    icon: 'percent',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'card-3',
    title: 'Pago con QR, MODO y Créditos',
    description: 'Escaneá y pagá en segundos con MODO o solicitá financiación con Crédito Argentino.',
    icon: 'qr-code',
    isActive: true,
    sortOrder: 3,
  },
];

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

export default function PaymentMethods() {
  const [whatsappNumber, setWhatsappNumber] = useState('5493445454261');
  const [cards, setCards] = useState<PaymentFeatureCardDto[]>(DEFAULT_CARDS);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetchApi<{ whatsapp_number?: string; home_payment_cards?: string }>('/api/settings/public');
        if (res.success && res.data) {
          if (res.data.whatsapp_number) {
            setWhatsappNumber(res.data.whatsapp_number);
          }
          if (res.data.home_payment_cards) {
            try {
              const parsed: PaymentFeatureCardDto[] = JSON.parse(res.data.home_payment_cards);
              const active = parsed.filter((c) => c.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
              if (active.length > 0) {
                setCards(active);
              }
            } catch (e) {
              console.error('Error al parsear home_payment_cards:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error al cargar ajustes de medios de pago:', e);
      }
    }
    loadSettings();
  }, []);

  const handleWhatsAppConsult = (subject: string) => {
    const text = encodeURIComponent(
      `¡Hola Papes Confort! Quisiera consultar sobre las opciones y planes de financiación para: ${subject}.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'percent':
        return <BadgePercent className="h-6 w-6 text-emerald-600" />;
      case 'qr-code':
        return <QrCode className="h-6 w-6 text-indigo-600" />;
      case 'truck':
        return <Truck className="h-6 w-6 text-brand-red" />;
      case 'shield':
        return <ShieldCheck className="h-6 w-6 text-brand-navy" />;
      case 'credit-card':
      default:
        return <CreditCard className="h-6 w-6 text-brand-red" />;
    }
  };

  return (
    <section id="medios-de-pago" className="w-full bg-white border-b border-slate-200/80 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Encabezado de sección */}
        <div className="text-center space-y-3 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <CreditCard className="h-3.5 w-3.5 text-brand-red" />
            <span>Financiación a tu medida</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-black tracking-tight">
            Elegí cómo pagar
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Te ofrecemos múltiples opciones de financiación y medios de pago para que equipes tu casa de la forma más conveniente y segura.
          </p>
        </div>

        {/* Pilares Principales de Financiación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs group-hover:scale-110 transition-transform">
                  {renderIcon(card.icon)}
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => handleWhatsAppConsult(card.title)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-brand-red text-slate-800 hover:text-white border border-slate-200 hover:border-transparent py-2.5 px-4 text-xs font-bold transition-all shadow-2xs cursor-pointer group-hover:bg-brand-red group-hover:text-white group-hover:border-transparent"
                >
                  <span>Consultar sobre este beneficio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Logos de medios de pago */}
        <div className="rounded-3xl bg-slate-50/60 border border-slate-200/80 p-6 sm:p-8">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <span>Medios de pago y billeteras aceptadas</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-center justify-center">
            {PAYMENT_LOGOS.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center justify-center p-3 rounded-2xl border border-slate-200/80 bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200 h-16 group"
                title={logo.name}
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 md:h-9 w-auto max-w-[85%] object-contain filter grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

