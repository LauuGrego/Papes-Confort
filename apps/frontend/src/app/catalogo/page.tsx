import { ChevronRight, Grid, Filter } from 'lucide-react';

export default function CatalogoPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
        <span>Inicio</span>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-600 font-semibold">Catálogo</span>
      </nav>

      {/* Main catalog title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-10">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explorá nuestra gama de artículos de confort y tecnología para tu hogar.
          </p>
        </div>
        {/* Skeleton counter */}
        <div className="h-8 w-28 rounded-lg bg-slate-100 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Filters Skeleton */}
        <aside className="hidden lg:block space-y-8">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-sm tracking-wider uppercase text-slate-700 flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-red" />
              Filtros
            </span>
          </div>

          <div className="space-y-6">
            {/* Filter section skeleton */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-3 border-b border-slate-100 pb-6">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border border-slate-200" />
                      <div className="h-3.5 w-32 rounded bg-slate-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Product Catalog Grid Skeletons */}
        <main className="lg:col-span-3 space-y-12">
          {/* Main loader notice */}
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-100 text-brand-red shadow-sm">
              <Grid className="h-6 w-6" />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="font-display font-bold text-lg">Catálogo en Sincronización</h3>
            </div>
          </div>

          {/* Skeletons block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-3xl border border-slate-100 p-5 space-y-4 shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
                {/* Image placeholder */}
                <div className="h-40 rounded-2xl bg-slate-100 animate-pulse w-full" />
                <div className="space-y-2">
                  {/* Category placeholder */}
                  <div className="h-3 w-16 rounded bg-slate-200 animate-pulse" />
                  {/* Title placeholder */}
                  <div className="h-4 w-4/5 rounded bg-slate-100 animate-pulse" />
                  {/* Rating placeholder */}
                  <div className="h-3 w-12 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  {/* Price placeholder */}
                  <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
                  {/* Button placeholder */}
                  <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
