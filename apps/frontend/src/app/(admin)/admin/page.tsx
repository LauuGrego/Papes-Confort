'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { Loader2, ShoppingBag, Settings, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<any>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [productsRes, settingsRes, syncRes] = await Promise.all([
        fetchApi<any>('/api/admin/products?limit=1'),
        fetchApi<any>('/api/admin/settings'),
        fetchApi<any>('/api/admin/sync-logs?limit=1'),
      ]);

      if (productsRes.success && productsRes.data) {
        setProductCount(productsRes.data.total);
      }
      if (settingsRes.success && settingsRes.data) {
        setWhatsappNumber(settingsRes.data.whatsapp_number || '');
      }
      if (syncRes.success && syncRes.data && syncRes.data.items.length > 0) {
        setLastSync(syncRes.data.items[0]);
      }
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando métricas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-brand-black">
          ¡Hola de nuevo!
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Bienvenido al panel comercial de Papes Confort.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] flex items-start gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-grow">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos</p>
            <h2 className="text-2xl font-black text-brand-black">{productCount ?? 0}</h2>
            <Link href="/admin/productos" className="text-xs font-semibold text-brand-red hover:underline block pt-1">
              Gestionar catálogo &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] flex items-start gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy shrink-0">
            <Settings className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-grow min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp de Consultas</p>
            <h2 className="text-lg font-black text-brand-black truncate mt-1">
              {whatsappNumber ? `+${whatsappNumber}` : 'No configurado'}
            </h2>
            <Link href="/admin/configuracion" className="text-xs font-semibold text-brand-red hover:underline block pt-1">
              Editar configuración &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] flex items-start gap-5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
            lastSync?.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          }`}>
            <RefreshCw className="h-6 w-6" />
          </div>
          <div className="space-y-1 flex-grow">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Último Sync GesCom</p>
            {lastSync ? (
              <>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {lastSync.status === 'SUCCESS' ? (
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  )}
                  <span className="text-sm font-bold text-slate-700">
                    {lastSync.status === 'SUCCESS' ? 'Exitoso' : 'Error'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Nuevos: {lastSync.productsCreated} | Act: {lastSync.productsUpdated}
                </p>
              </>
            ) : (
              <h2 className="text-sm font-bold text-slate-400 pt-1">Sin registros</h2>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
