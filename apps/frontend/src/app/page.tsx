import Link from 'next/link';
import { ArrowRight, MapPin, Refrigerator, Coffee, Wind, Tv } from 'lucide-react';
import PaymentMethods from '../components/PaymentMethods';

const CATEGORIES = [
  {
    name: 'Línea Blanca',
    slug: 'linea-blanca',
    description: 'Heladeras, lavarropas, cocinas y equipamiento para tu hogar.',
    icon: Refrigerator,
    image: '/images/cat_linea_blanca_v2.png',
  },
  {
    name: 'Pequeños Electrodomésticos',
    slug: 'pequenos-electrodomesticos',
    description: 'Cafeteras, licuadoras y productos para tu día a día.',
    icon: Coffee,
    image: '/images/cat_pequenos_electro_v2.png',
  },
  {
    name: 'Climatización',
    slug: 'climatizacion',
    description: 'Aires acondicionados Split y calefacción frío/calor.',
    icon: Wind,
    image: '/images/cat_climatizacion.png',
  },
  {
    name: 'TV / Audio',
    slug: 'tv-audio',
    description: 'Smart TVs 4K y sistemas de sonido de última generación.',
    icon: Tv,
    image: '/images/cat_tv_audio.png',
  },
];

export default function HomePage() {
  return (
    <div className="w-full bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 text-brand-black py-16 md:py-24 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero left content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-4 py-1.5 text-xs font-semibold text-brand-red uppercase tracking-wider">
              Servicio y calidad asegurados
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-brand-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-red-dark">Llevamos el confort</span> que tu hogar merece
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
              El asesoramiento personalizado y el servicio posventa que nos caracteriza
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-semibold text-white hover:bg-brand-red-dark shadow-[0_4px_20px_rgba(228,20,20,0.25)] hover:shadow-[0_6px_25px_rgba(228,20,20,0.35)] transition-all duration-300 transform hover:-translate-y-0.5 group"
              >
                Explorar catálogo
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero right content (Edificio integrated into background) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Soft ambient glow behind building image */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-red/10 via-slate-200/50 to-transparent blur-2xl rounded-full opacity-70" />

              {/* Integrated building image with smooth blend */}
              <div className="relative overflow-hidden rounded-3xl shadow-lg border border-slate-200/60 bg-gradient-to-b from-slate-100 to-white">
                <img
                  src="/images/edificio.webp"
                  alt="Edificio Papes Confort en Basavilbaso"
                  className="w-full h-auto max-h-[460px] object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.02]"
                />
                
                {/* Soft bottom gradient overlay for seamless background transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/90 via-transparent to-transparent pointer-events-none" />

                {/* Floating subtle location pill */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-red shrink-0" />
                  <span className="text-xs font-bold text-brand-black tracking-wide">
                    Basavilbaso, Entre Ríos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section (Smaller compact cards with product collages) */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="text-center space-y-3 mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-black tracking-tight">
            Nuestras Categorías
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm md:text-base">
            Explorá nuestra variedad de productos de alta calidad para cada rincón de tu hogar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href="/catalogo"
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/30 hover:shadow-lg"
              >
                {/* Product Collage Thumbnail */}
                <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 backdrop-blur-md text-brand-red shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="font-display text-base font-bold text-brand-black mb-1 group-hover:text-brand-red transition-colors duration-200">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
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

      {/* Payment Methods & Financing Section */}
      <PaymentMethods />
    </div>
  );
}
