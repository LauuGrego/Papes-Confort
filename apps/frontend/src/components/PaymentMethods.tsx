import { CreditCard, Percent, QrCode } from 'lucide-react';

const PAYMENT_LOGOS = [
  { name: 'Tarjeta Naranja X', src: '/images/payments/naranja.svg' },
  { name: 'Visa', src: '/images/payments/visa.svg' },
  { name: 'Mastercard', src: '/images/payments/mastercard.svg' },
  { name: 'American Express', src: '/images/payments/amex.svg' },
  { name: 'Pago con QR', src: '/images/payments/qr.svg' },
  { name: 'Transferencia Bancaria', src: '/images/payments/transferencia.svg' },
];

const FEATURES = [
  {
    icon: CreditCard,
    title: 'Hasta 12 cuotas sin interés',
    description: 'Con tarjetas bancarias seleccionadas en toda la tienda.',
  },
  {
    icon: Percent,
    title: '10% de descuento',
    description: 'Abonando mediante transferencia bancaria inmediata.',
  },
  {
    icon: QrCode,
    title: 'Pago con QR',
    description: 'Escaneá de forma rápida y segura desde la app de tu banco.',
  },
];

export default function PaymentMethods() {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center justify-center mb-12">
          {PAYMENT_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center justify-center p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all duration-300 h-20"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-10 w-auto max-w-full object-contain filter drop-shadow-sm transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Financing benefits bullet points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-100"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-brand-black mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
