import { ProductCategoryDto } from '@papes-confort/shared';

interface FamilyWithCategories {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  categories: (ProductCategoryDto & { productCount: number })[];
}

interface ProductFiltersProps {
  families: FamilyWithCategories[];
  selectedFamily: string | null;
  selectedCategory: string | null;
  selectedProductType: string | null;
  brands: { id: string; name: string; slug: string; productCount: number }[];
  selectedBrand: string | null;
  onFilterChange: (filters: {
    family?: string | null;
    category?: string | null;
    productType?: string | null;
    brand?: string | null;
  }) => void;
}

export default function ProductFilters({
  families,
  selectedFamily,
  selectedCategory,
  selectedProductType,
  brands = [],
  selectedBrand,
  onFilterChange,
}: ProductFiltersProps) {
  const hasActiveFilters = selectedFamily || selectedCategory || selectedProductType || selectedBrand;

  const handleReset = () => {
    onFilterChange({
      family: null,
      category: null,
      productType: null,
      brand: null,
    });
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="font-display font-extrabold text-sm tracking-wider uppercase text-slate-700">
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-brand-red hover:text-brand-red-dark transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Product Families (Rubros y Subrubros) */}
      <div className="space-y-4">
        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
          Rubros y Subrubros
        </h4>
        <div className="space-y-2">
          {families.map((fam) => {
            const isFamilyActive = selectedFamily === fam.slug;
            return (
              <div key={fam.id} className="space-y-1">
                <button
                  onClick={() =>
                    onFilterChange({
                      family: isFamilyActive ? null : fam.slug,
                      category: null,
                    })
                  }
                  className={`w-full flex items-center justify-between text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                    isFamilyActive
                      ? 'bg-brand-red/10 text-brand-red font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{fam.name}</span>
                  <span className="text-[10px] opacity-60">({fam.productCount})</span>
                </button>

                {isFamilyActive && fam.categories.length > 0 && (
                  <div className="pl-4 pr-2 py-1 space-y-1 border-l border-slate-100 ml-3">
                    {fam.categories.map((cat) => {
                      const isCategoryActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() =>
                            onFilterChange({
                              category: isCategoryActive ? null : cat.id,
                            })
                          }
                          className={`w-full flex items-center justify-between text-left text-xs py-1 px-2 rounded-md transition-colors ${
                            isCategoryActive
                              ? 'text-brand-red font-bold'
                              : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] opacity-60">({cat.productCount})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands (Marcas) */}
      {brands.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
            Marcas
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {brands.map((b) => {
              const isBrandActive = selectedBrand === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() =>
                    onFilterChange({
                      brand: isBrandActive ? null : b.id,
                    })
                  }
                  className={`w-full flex items-center justify-between text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                    isBrandActive
                      ? 'bg-brand-red/10 text-brand-red font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{b.name}</span>
                  <span className="text-[10px] opacity-60">({b.productCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing/Outlet Type */}
      <div className="space-y-4">
        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
          Tipo de Oferta
        </h4>
        <div className="space-y-1">
          {[
            { key: 'NORMAL', label: 'Estándar' },
            { key: 'OUTLET', label: 'Outlet / Saldo' },
            { key: 'OFFER', label: 'Oferta Especial' },
            { key: 'BANK_PROMO', label: 'Promo Bancaria' },
          ].map((type) => {
            const isTypeActive = selectedProductType === type.key;
            return (
              <button
                key={type.key}
                onClick={() =>
                  onFilterChange({
                    productType: isTypeActive ? null : type.key,
                  })
                }
                className={`w-full flex items-center justify-between text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                  isTypeActive
                    ? 'bg-brand-red/10 text-brand-red font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
