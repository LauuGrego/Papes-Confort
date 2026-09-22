'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, CreditCard, BadgePercent, ShieldCheck } from 'lucide-react';
import { HomeTrustBarItemDto, DEFAULT_TRUST_BAR } from '@papes-confort/shared';

interface TrustBarProps {
  items?: HomeTrustBarItemDto[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  'credit-card': CreditCard,
  percent: BadgePercent,
  shield: ShieldCheck,
};

export default function TrustBar({ items }: TrustBarProps) {
  const activeItems = (items && items.length > 0 ? items : DEFAULT_TRUST_BAR).filter(
    (item) => item.isActive !== false
  );

  return (
    <section aria-label="Beneficios de comprar en Papes Confort" className="w-full bg-white border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {activeItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || ShieldCheck;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50/80 border border-transparent hover:border-slate-200/60 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-red/5 border border-brand-red/10 text-brand-red group-hover:scale-105 group-hover:bg-brand-red/10 transition-all">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-brand-black group-hover:text-brand-red truncate transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 truncate">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
