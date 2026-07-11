import Link from 'next/link';
import { ArrowRight, Tv, Wind, Refrigerator, Coffee } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Línea Blanca',
    slug: 'linea-blanca',
    description: 'Heladeras, lavarropas, cocinas y más para equipar tu cocina.',
    icon: Refrigerator,
    bgGradient: 'from-orange-500/10 to-brand-red/20',
  },
  {
    name: 'Pequeños Electrodomésticos',
    slug: 'pequenos-electrodomesticos',
    description: 'Cafeteras, tostadoras y licuadoras que facilitan tu día a día.',
    icon: Coffee,
    bgGradient: 'from-brand-red/10 to-brand-red-dark/20',
  },
  {
    name: 'Climatización',
    slug: 'climatizacion',
    description: 'Aires acondicionados y calefactores para el clima ideal de tu hogar.',
    icon: Wind,
    bgGradient: 'from-sky-500/10 to-brand-red/20',
  },
  {
    name: 'TV / Audio',
    slug: 'tv-audio',
    description: 'Smart TVs y sistemas de sonido para el mejor entretenimiento.',
    icon: Tv,
    bgGradient: 'from-purple-500/10 to-brand-red-dark/20',
  },
];

export default function HomePage() {
  return (
    <div className="w-full bg-[#f5f5f5]/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#131313] via-[#1a1a1a] to-[#131313] text-white py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(228,20,20,0.08),transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero left content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/30 bg-brand-red/10 px-4 py-1.5 text-xs font-semibold text-brand-red uppercase tracking-wider">
              Servicio y calidad de siempre
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Llevamos el <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-red-dark">confort</span> que tu hogar merece
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">
              Descubrí una amplia selección de electrodomésticos de última generación con la confianza y el asesoramiento personalizado que nos caracteriza en Basavilbaso.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-semibold hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.3)] hover:shadow-[0_6px_25px_rgba(228,20,20,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 group"
              >
                Explorar catálogo
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero right content (interactive visual cards) */}
          <div className="lg:col-span-5 hidden lg:grid grid-cols-2 gap-4 relative">
            <div className="space-y-4">
              <div className="h-48 rounded-3xl bg-gradient-to-br from-brand-red-dark to-brand-red p-6 flex flex-col justify-between shadow-[0_10px_30px_rgba(228,20,20,0.2)]">
                <Refrigerator className="h-8 w-8 text-white" />
                <span className="font-display font-bold text-lg leading-tight">Línea Blanca</span>
              </div>
              <div className="h-64 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between backdrop-blur-sm hover:border-brand-red/30 transition-colors duration-300">
                <Wind className="h-8 w-8 text-brand-red" />
                <span className="font-display font-bold text-lg leading-tight">Climatización</span>
              </div>
            </div>
            <div className="space-y-4 pt-10">
              <div className="h-64 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between backdrop-blur-sm hover:border-brand-red/30 transition-colors duration-300">
                <Coffee className="h-8 w-8 text-brand-red" />
                <span className="font-display font-bold text-lg leading-tight">Pequeños Electro</span>
              </div>
              <div className="h-48 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between backdrop-blur-sm hover:border-brand-red/30 transition-colors duration-300">
                <Tv className="h-8 w-8 text-brand-red" />
                <span className="font-display font-bold text-lg leading-tight">TV & Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Nuestras Categorías
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base">
            Seleccioná una categoría para explorar la variedad de productos de excelente calidad que tenemos para ofrecerte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href="/catalogo"
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-2 hover:border-brand-red/20 hover:shadow-[0_20px_40px_rgba(228,20,20,0.08)]"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.bgGradient} mb-8 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-6 w-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-black mb-2 group-hover:text-brand-red transition-colors duration-200">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {cat.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-red uppercase tracking-wider group-hover:gap-2 transition-all">
                    Ver productos
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
