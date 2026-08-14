'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api';
import {
  Loader2,
  ShoppingBag,
  RefreshCw,
  Image as ImageIcon,
  Tag,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [offerCount, setOfferCount] = useState<number | null>(null);
  const [bannerCount, setBannerCount] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<any>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [productsRes, offersRes, settingsRes, syncRes] = await Promise.all([
        fetchApi<any>('/api/admin/products?limit=1'),
        fetchApi<any>('/api/offers'),
        fetchApi<any>('/api/admin/settings'),
        fetchApi<any>('/api/admin/sync-logs?limit=1'),
      ]);

      if (productsRes.success && productsRes.data) {
        setProductCount(productsRes.data.total);
      }
      if (offersRes.success && offersRes.data) {
        setOfferCount(Array.isArray(offersRes.data) ? offersRes.data.length : 0);
      }
      if (settingsRes.success && settingsRes.data) {
        setWhatsappNumber(settingsRes.data.whatsapp_number || '');
        if (settingsRes.data.home_flyers) {
          try {
            const parsed = JSON.parse(settingsRes.data.home_flyers);
            if (Array.isArray(parsed)) {
              setBannerCount(parsed.length);
            }
          } catch (e) {
            setBannerCount(0);
          }
        }
      }
      if (syncRes.success && syncRes.data && syncRes.data.items?.length > 0) {
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
        <span className="text-sm font-semibold text-slate-400">Cargando métricas comerciales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Saludo y Encabezado */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-red-dark p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Panel de Administración Comercial</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            ¡Hola de nuevo!
          </h1>
        </div>
      </div>

      {/* Tarjetas Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Productos</p>
            <h2 className="text-xl font-black text-slate-800">{productCount ?? 0}</h2>
            <p className="text-[10px] text-slate-400 truncate">En catálogo activo</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shrink-0">
            <Tag className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ofertas</p>
            <h2 className="text-xl font-black text-slate-800">{offerCount ?? 0}</h2>
            <p className="text-[10px] text-slate-400 truncate">Campañas destacadas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shrink-0">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Banners Portada</p>
            <h2 className="text-xl font-black text-slate-800">{bannerCount ?? 0}</h2>
            <p className="text-[10px] text-slate-400 truncate">En carrusel comercial</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
            lastSync?.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
          }`}>
            <RefreshCw className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">GesCom Sync</p>
            <h2 className="text-sm font-bold text-slate-800 truncate">
              {lastSync?.status === 'SUCCESS' ? 'Sincronizado' : 'Pendiente'}
            </h2>
            <p className="text-[10px] text-slate-400 truncate">
              {lastSync ? `Cre: ${lastSync.productsCreated} | Act: ${lastSync.productsUpdated}` : 'Sin registros'}
            </p>
          </div>
        </div>

      </div>

      {/* Accesos Directos de Administración */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800">Acceso Rápido a Secciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <Link
            href="/admin/configuracion?tab=banners"
            className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-red/40 hover:shadow-md transition-all group flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-brand-red transition-colors">
                Banners de Portada (Flyers)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cargá y administrá los banners promocionales rotativos cargados a Cloudinary que se muestran en el sitio.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-red group-hover:translate-x-1 transition-all shrink-0 mt-2" />
          </Link>

          <Link
            href="/admin/productos"
            className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-red/40 hover:shadow-md transition-all group flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-brand-navy transition-colors">
                Catálogo de Productos
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Revisá el listado completo de productos sincronizados desde GesCom, precios de lista y características.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-navy group-hover:translate-x-1 transition-all shrink-0 mt-2" />
          </Link>

          <Link
            href="/admin/ofertas"
            className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-red/40 hover:shadow-md transition-all group flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Tag className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-amber-600 transition-colors">
                Ofertas y Descuentos
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Creá campañas de ofertas porcentuales o bonificaciones especiales para categorías y marcas específicas.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
          </Link>

          <Link
            href="/admin/configuracion?tab=general"
            className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-brand-red/40 hover:shadow-md transition-all group flex items-start justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors">
                WhatsApp y Contacto
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurá el número de celular de WhatsApp comercial ({whatsappNumber ? `+${whatsappNumber}` : 'Sin configurar'}) para recibir pedidos.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
          </Link>

        </div>
      </div>
    </div>
  );
}
