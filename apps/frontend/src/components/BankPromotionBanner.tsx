'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, X } from 'lucide-react';
import { BankPromotionDto, DAY_OF_WEEK_NAMES } from '@papes-confort/shared';
import { fetchApi } from '../lib/api';

export default function BankPromotionBanner() {
  const [promo, setPromo] = useState<BankPromotionDto | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodayPromo() {
      try {
        const res = await fetchApi<{ promotion: BankPromotionDto | null; todayDayOfWeek: number }>(
          '/api/bank-promotions/today'
        );
        if (res.success && res.data) {
          setPromo(res.data.promotion);
          setDayOfWeek(res.data.todayDayOfWeek);
        }
      } catch (err) {
        console.error('Error al cargar la promoción bancaria del día:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTodayPromo();
  }, []);

  if (loading || dismissed || !promo) {
    return null;
  }

  const dayName = DAY_OF_WEEK_NAMES[dayOfWeek] || 'Hoy';
  const isSpecialInstallment = promo.installmentsTotal !== promo.installmentsPaid;

  return (
    <div className="relative z-30 w-full bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white border-b border-white/10 shadow-sm py-2 px-4 transition-all animate-in fade-in duration-300">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs">
        {/* Lado izquierdo: Badge y descripción de la promo */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Promo de {dayName}</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-extrabold text-white text-[13px]">{promo.bankName}</span>
            <span className="text-slate-400 text-[11px]">({promo.cardType})</span>
            <span className="text-slate-400">·</span>
            <span className="font-extrabold text-brand-red bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
              {promo.discountPercent}% REINTEGRO
            </span>
            {promo.maxReimbursement > 0 && (
              <span className="text-slate-300 text-[11px]">
                (Tope ${promo.maxReimbursement.toLocaleString('es-AR')})
              </span>
            )}
            <span className="text-slate-400">·</span>
            {isSpecialInstallment ? (
              <span className="text-amber-300 font-bold">
                {promo.installmentsTotal} cuotas (pagás {promo.installmentsPaid})
              </span>
            ) : promo.installmentsTotal > 1 ? (
              <span className="text-emerald-300 font-bold">
                Hasta {promo.installmentsTotal} cuotas sin interés
              </span>
            ) : null}
          </div>
        </div>

        {/* Lado derecho: Enlace a medios de pago y botón de cerrar */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/#medios-de-pago"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
          >
            <span>Ver bases y bancos</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Cerrar aviso de promoción bancaria"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
