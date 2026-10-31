'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Mail,
  Users,
  Send,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone,
  MapPin,
  ShoppingBag,
  Bell,
  X,
} from 'lucide-react';
import { fetchApi } from '../../../../lib/api';
import {
  SubscriberDto,
  SubscriberListResponse,
  NewsletterCampaignDto,
  NewsletterSendLogDto,
  SendNewsletterPayload,
} from '@papes-confort/shared';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun', full: 'Lunes' },
  { value: 2, label: 'Mar', full: 'Martes' },
  { value: 3, label: 'Mié', full: 'Miércoles' },
  { value: 4, label: 'Jue', full: 'Jueves' },
  { value: 5, label: 'Vie', full: 'Viernes' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
  { value: 0, label: 'Dom', full: 'Domingo' },
];

export default function AdminSuscriptoresPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns' | 'logs'>('subscribers');

  // Subscriptores State
  const [subscribers, setSubscribers] = useState<SubscriberDto[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'subscribed' | 'unsubscribed'>('subscribed');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscribed, setTotalSubscribed] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Campañas State
  const [campaigns, setCampaigns] = useState<NewsletterCampaignDto[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Logs State
  const [logs, setLogs] = useState<NewsletterSendLogDto[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modales State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<NewsletterCampaignDto> | null>(null);
  const [campaignModalTab, setCampaignModalTab] = useState<'edit' | 'preview'>('edit');
  const [savingCampaign, setSavingCampaign] = useState(false);

  const [previewModalCampaign, setPreviewModalCampaign] = useState<NewsletterCampaignDto | null>(null);

  const [sendModalCampaign, setSendModalCampaign] = useState<NewsletterCampaignDto | null>(null);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Cargar Suscriptores
  const loadSubscribers = useCallback(async () => {
    setLoadingSubscribers(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', '20');
    params.set('status', filterStatus);
    if (search.trim()) params.set('search', search.trim());

    const res = await fetchApi<SubscriberListResponse>(`/api/admin/newsletter/subscribers?${params.toString()}`);
    if (res.success && res.data) {
      setSubscribers(res.data.subscribers);
      setTotalPages(res.data.totalPages);
      setTotalSubscribed(res.data.totalSubscribed);
      setTotalCustomers(res.data.totalCustomers);
    } else {
      showToast('Error cargando la lista de suscriptores', 'error');
    }
    setLoadingSubscribers(false);
  }, [page, filterStatus, search]);

  // 2. Cargar Campañas
  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    const res = await fetchApi<NewsletterCampaignDto[]>('/api/admin/newsletter/campaigns');
    if (res.success && res.data) {
      setCampaigns(res.data);
    }
    setLoadingCampaigns(false);
  }, []);

  // 3. Cargar Historial
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    const res = await fetchApi<NewsletterSendLogDto[]>('/api/admin/newsletter/logs');
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadCampaigns, loadLogs]);

  // Modificar estado de suscripción de un cliente
  const handleToggleOptIn = async (customer: SubscriberDto) => {
    setTogglingId(customer.id);
    const nextState = !customer.marketingOptIn;
    const res = await fetchApi<SubscriberDto>(`/api/admin/newsletter/subscribers/${customer.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ marketingOptIn: nextState }),
    });

    if (res.success && res.data) {
      setSubscribers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, marketingOptIn: nextState } : c))
      );
      setTotalSubscribed((prev) => (nextState ? prev + 1 : prev - 1));
      showToast(
        nextState
          ? `${customer.name} fue suscrito/a exitosamente.`
          : `${customer.name} fue desuscrito/a de las novedades.`
      );
    } else {
      showToast('No se pudo actualizar el estado de suscripción', 'error');
    }
    setTogglingId(null);
  };

  // Exportar a CSV
  const handleExportCsv = () => {
    if (subscribers.length === 0) {
      showToast('No hay datos disponibles para exportar', 'error');
      return;
    }

    const headers = ['Nombre', 'Email', 'Teléfono', 'Ciudad', 'Provincia', 'Suscrito a Novedades', 'Fecha Registro'];
    const rows = subscribers.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.city || ''}"`,
      `"${s.province || ''}"`,
      s.marketingOptIn ? 'SI' : 'NO',
      `"${new Date(s.createdAt).toLocaleDateString('es-AR')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `suscriptores_papes_confort_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Base de datos exportada en formato CSV.');
  };

  // Abrir modal de creación
  const handleOpenCreateCampaign = () => {
    setEditingCampaign({
      title: '',
      subject: '',
      previewText: '',
      content: '¡Hola {{nombre}}!\n\nTe presentamos nuestras novedades y ofertas exclusivas de esta semana en Papes Confort. Aprovechá hasta 12 cuotas sin interés y envíos bonificados en productos seleccionados.\n\nNo te quedes sin renovar tu hogar.',
      ctaText: 'Ver Catálogo y Ofertas',
      ctaUrl: 'https://papesconfort.com.ar/catalogo',
      frequency: 'WEEKLY',
      daysOfWeek: [1, 5], // Lunes y Viernes
      time: '10:00',
      status: 'ACTIVE',
    });
    setCampaignModalTab('edit');
    setIsCampaignModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditCampaign = (camp: NewsletterCampaignDto) => {
    setEditingCampaign({ ...camp });
    setCampaignModalTab('edit');
    setIsCampaignModalOpen(true);
  };

  // Guardar Campaña
  const handleSaveCampaign = async () => {
    if (!editingCampaign?.title?.trim()) {
      showToast('Ingresá un título interno para identificar la campaña', 'error');
      return;
    }
    if (!editingCampaign?.subject?.trim()) {
      showToast('El asunto del correo no puede estar vacío', 'error');
      return;
    }
    if (!editingCampaign?.content?.trim()) {
      showToast('El contenido del mensaje no puede estar vacío', 'error');
      return;
    }

    setSavingCampaign(true);
    const res = await fetchApi<NewsletterCampaignDto>('/api/admin/newsletter/campaigns', {
      method: 'POST',
      body: JSON.stringify(editingCampaign),
    });

    if (res.success && res.data) {
      showToast('Campaña guardada exitosamente.');
      setIsCampaignModalOpen(false);
      setEditingCampaign(null);
      loadCampaigns();
    } else {
      showToast(res.error || 'Error al guardar la campaña', 'error');
    }
    setSavingCampaign(false);
  };

  // Eliminar Campaña
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;

    const res = await fetchApi(`/api/admin/newsletter/campaigns/${campaignId}`, {
      method: 'DELETE',
    });

    if (res.success) {
      showToast('Campaña eliminada.');
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } else {
      showToast('No se pudo eliminar la campaña', 'error');
    }
  };

  // Enviar Campaña (Prueba o Real)
  const handleExecuteSend = async (isTest: boolean) => {
    if (!sendModalCampaign) return;

    if (isTest && !testEmailInput.trim()) {
      showToast('Ingresá una dirección de correo válida para el envío de prueba', 'error');
      return;
    }

    setSendingEmail(true);

    const payload: SendNewsletterPayload = {
      campaignId: sendModalCampaign.id,
      subject: sendModalCampaign.subject,
      content: sendModalCampaign.content,
      previewText: sendModalCampaign.previewText,
      ctaText: sendModalCampaign.ctaText,
      ctaUrl: sendModalCampaign.ctaUrl,
      testEmail: isTest ? testEmailInput.trim() : undefined,
    };

    const res = await fetchApi<any>('/api/admin/newsletter/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      showToast(
        isTest
          ? `Correo de prueba enviado a ${testEmailInput}`
          : `¡Notificación enviada a los suscriptores!`
      );
      if (!isTest) {
        setSendModalCampaign(null);
        loadCampaigns();
        loadLogs();
      }
    } else {
      showToast(res.error || 'Error durante el envío del correo', 'error');
    }

    setSendingEmail(false);
  };

  // Formateador de días para visualización
  const formatDays = (days: number[]) => {
    if (!days || days.length === 0) return 'Ningún día';
    if (days.length === 7) return 'Todos los días';
    return days
      .map((d) => DAYS_OF_WEEK.find((item) => item.value === d)?.label || '')
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-white shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Suscriptores & Novedades
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Gestioná los clientes que aceptaron novedades de ofertas y configurá mensajes automáticos por email.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'subscribers') loadSubscribers();
              else if (activeTab === 'campaigns') loadCampaigns();
              else loadLogs();
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-2xs"
            title="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleOpenCreateCampaign}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red/90 transition shadow-sm shadow-brand-red/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Campaña</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Estadísticas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Suscriptores Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Suscriptores Activos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {totalSubscribed}
              </span>
              {totalCustomers > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {Math.round((totalSubscribed / totalCustomers) * 100)}% del total
                </span>
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Mail className="h-6 w-6" />
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clientes Registrados
            </span>
            <div className="mt-1">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {totalCustomers}
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Campañas Activas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Campañas Activas
            </span>
            <div className="mt-1">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {campaigns.filter((c) => c.status === 'ACTIVE').length}
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Frecuencia Automática */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Automatización Cron
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-700">Cada 15 min</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center">
            <Bell className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Navegación por Pestañas */}
      <div className="border-b border-slate-200 flex items-center gap-8">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`pb-3 text-sm font-bold transition relative flex items-center gap-2 ${
            activeTab === 'subscribers'
              ? 'text-brand-red border-b-2 border-brand-red'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Suscriptores Inscritos ({totalSubscribed})</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-bold transition relative flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'text-brand-red border-b-2 border-brand-red'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Mensajes & Campañas ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold transition relative flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'text-brand-red border-b-2 border-brand-red'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Historial de Envíos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LISTA DE SUSCRIPTORES */}
      {/* ========================================================= */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono, ciudad..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition"
                />
              </div>

              {/* Filtro por estado de suscripción */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => {
                    setFilterStatus('subscribed');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === 'subscribed'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Solo Suscriptos
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('unsubscribed');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === 'unsubscribed'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  No Suscriptos
                </button>
              </div>
            </div>

            <div>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition shadow-2xs"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Tabla de Suscriptores */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {loadingSubscribers ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 text-brand-red animate-spin" />
                <span className="text-xs font-semibold text-slate-400">Cargando base de usuarios...</span>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No se encontraron clientes</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Intentá con otros términos de búsqueda o cambiando el filtro.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Cliente</th>
                      <th className="py-3.5 px-6">Contacto & Ubicación</th>
                      <th className="py-3.5 px-6">Compras</th>
                      <th className="py-3.5 px-6">Fecha Registro</th>
                      <th className="py-3.5 px-6">Suscripción a Novedades</th>
                      <th className="py-3.5 px-6 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscribers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/60 transition">
                        {/* Cliente */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                              {customer.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{customer.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{customer.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contacto & Ubicación */}
                        <td className="py-4 px-6">
                          <div className="space-y-0.5 text-xs">
                            {customer.phone ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                                <span>{customer.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Sin teléfono</span>
                            )}
                            {(customer.city || customer.province) && (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>
                                  {[customer.city, customer.province].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Pedidos */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            <ShoppingBag className="h-3 w-3 text-slate-400" />
                            <span>{customer.ordersCount} pedidos</span>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {new Date(customer.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Estado Opt-In */}
                        <td className="py-4 px-6">
                          {customer.marketingOptIn ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              Suscrito a Novedades
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <XCircle className="h-3.5 w-3.5 text-slate-400" />
                              No suscrito
                            </span>
                          )}
                        </td>

                        {/* Toggle */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleOptIn(customer)}
                            disabled={togglingId === customer.id}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                              customer.marketingOptIn
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {togglingId === customer.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : customer.marketingOptIn ? (
                              'Desuscribir'
                            ) : (
                              'Suscribir'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CAMPAÑAS Y MENSAJES PERSONALIZADOS */}
      {/* ========================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mensajes Personalizados & Automatización</h2>
              <p className="text-xs text-slate-500">
                Configurá el asunto, mensaje y frecuencia de envío para los clientes suscritos.
              </p>
            </div>
            <button
              onClick={handleOpenCreateCampaign}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-brand-red/90 transition shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Crear Mensaje</span>
            </button>
          </div>

          {loadingCampaigns ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 text-brand-red animate-spin" />
              <span className="text-xs font-semibold text-slate-400">Cargando campañas...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="h-16 w-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No hay campañas configuradas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Creá tu primer mensaje personalizado para enviar ofertas semanales, novedades de outlet o lanzamientos a tus suscriptores.
              </p>
              <button
                onClick={handleOpenCreateCampaign}
                className="px-5 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red/90 transition shadow-sm"
              >
                Crear Mi Primera Campaña
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-4">
                    {/* Encabezado de la Tarjeta */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{camp.title}</h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : camp.status === 'PAUSED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {camp.status === 'ACTIVE' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {camp.status === 'ACTIVE'
                              ? 'Activa'
                              : camp.status === 'PAUSED'
                              ? 'Pausada'
                              : 'Borrador'}
                          </span>
                        </div>
                        <p className="text-xs text-brand-red font-semibold mt-1">
                          Asunto: &ldquo;{camp.subject}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditCampaign(camp)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition"
                          title="Editar Campaña"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar Campaña"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Frecuencia y Días */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {camp.frequency === 'MANUAL'
                            ? 'Manual (A demanda)'
                            : camp.frequency === 'DAILY'
                            ? `Diaria a las ${camp.time || '10:00'} hs`
                            : camp.frequency === 'MONTHLY'
                            ? `Mensual (Día 1 a las ${camp.time || '10:00'} hs)`
                            : `Semanal (${formatDays(camp.daysOfWeek)} a las ${camp.time || '10:00'} hs)`}
                        </span>
                      </div>
                    </div>

                    {/* Previa del Mensaje */}
                    <div className="text-xs text-slate-600 line-clamp-3 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                      {camp.content}
                    </div>

                    {/* CTA si existe */}
                    {camp.ctaText && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="font-bold text-slate-700">Botón de acción:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-800">
                          {camp.ctaText}
                        </span>
                      </div>
                    )}

                    {/* Último Envío */}
                    <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span>
                        Último envío:{' '}
                        {camp.lastSentAt
                          ? new Date(camp.lastSentAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'}
                      </span>
                      {camp.lastSentCount ? (
                        <span className="text-emerald-600 font-semibold">
                          {camp.lastSentCount} suscriptores alcanzados
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewModalCampaign(camp)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Vista Previa</span>
                    </button>

                    <button
                      onClick={() => {
                        setSendModalCampaign(camp);
                        setTestEmailInput('');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition active:scale-95 shadow-2xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Enviar / Probar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: HISTORIAL DE ENVÍOS */}
      {/* ========================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Historial de Notificaciones Enviadas</h2>
              <p className="text-xs text-slate-500">
                Registro de todas las notificaciones despachadas por el sistema o por administradores.
              </p>
            </div>
            <button
              onClick={loadLogs}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {loadingLogs ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 text-brand-red animate-spin" />
                <span className="text-xs font-semibold text-slate-400">Cargando historial...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center">
                <Send className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Aún no se han enviado notificaciones</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cuando se ejecuten campañas automáticas o envíos manuales, quedarán registrados aquí.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Fecha & Hora</th>
                      <th className="py-3.5 px-6">Asunto</th>
                      <th className="py-3.5 px-6">Destinatarios</th>
                      <th className="py-3.5 px-6">Resultado</th>
                      <th className="py-3.5 px-6">Emisor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {new Date(log.sentAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{log.subject}</div>
                          {log.campaignTitle && (
                            <div className="text-xs text-slate-400">{log.campaignTitle}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          {log.recipientCount} suscriptores
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-emerald-600">
                              ✓ {log.successCount} exitosos
                            </span>
                            {log.errorCount > 0 && (
                              <span className="font-bold text-rose-600">
                                ✗ {log.errorCount} errores
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                          {log.sentBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR CAMPAÑA */}
      {/* ========================================================= */}
      {isCampaignModalOpen && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingCampaign.id ? 'Editar Mensaje / Campaña' : 'Nuevo Mensaje para Suscriptores'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Establecé el contenido, asunto y frecuencia de los correos.
                  </p>
                </div>
              </div>

              {/* Tabs internas del modal */}
              <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCampaignModalTab('edit')}
                  className={`px-3 py-1 rounded-lg transition ${
                    campaignModalTab === 'edit'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignModalTab('preview')}
                  className={`px-3 py-1 rounded-lg transition ${
                    campaignModalTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vista Previa
                </button>
              </div>
            </div>

            {/* Contenido del Modal con Scroll */}
            <div className="p-6 overflow-y-auto space-y-5">
              {campaignModalTab === 'edit' ? (
                <>
                  {/* Título Interno */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Título Interno de la Campaña *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Ofertas Semanales de Colchones"
                      value={editingCampaign.title || ''}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                    />
                  </div>

                  {/* Asunto & Preheader */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Asunto del Email *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: ¡Hasta 30% OFF y 12 cuotas sin interés!"
                        value={editingCampaign.subject || ''}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, subject: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Texto de Vista Previa (Preheader)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Renová tu descanso este fin de semana..."
                        value={editingCampaign.previewText || ''}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, previewText: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                      />
                    </div>
                  </div>

                  {/* Contenido del Mensaje */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Contenido del Mensaje *
                      </label>
                      {/* Botones de variables dinámicas */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Insertar variable:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCampaign({
                              ...editingCampaign,
                              content: (editingCampaign.content || '') + ' {{nombre}} ',
                            })
                          }
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded font-bold transition"
                        >
                          {'{{nombre}}'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCampaign({
                              ...editingCampaign,
                              content: (editingCampaign.content || '') + ' {{email}} ',
                            })
                          }
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded font-bold transition"
                        >
                          {'{{email}}'}
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      placeholder="Escribí el mensaje para los clientes..."
                      value={editingCampaign.content || ''}
                      onChange={(e) =>
                        setEditingCampaign({ ...editingCampaign, content: e.target.value })
                      }
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-sans leading-relaxed"
                    />
                  </div>

                  {/* Botón de Acción CTA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Texto del Botón CTA (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Ver Ofertas Especiales"
                        value={editingCampaign.ctaText || ''}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, ctaText: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        URL de Destino
                      </label>
                      <input
                        type="text"
                        placeholder="https://papesconfort.com.ar/catalogo"
                        value={editingCampaign.ctaUrl || ''}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, ctaUrl: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-mono"
                      />
                    </div>
                  </div>

                  {/* Configuración de Frecuencia y Días */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-red" />
                      <span>Frecuencia y Días de Envío</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Frecuencia</label>
                        <select
                          value={editingCampaign.frequency || 'WEEKLY'}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              frequency: e.target.value as any,
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        >
                          <option value="MANUAL">Manual (A demanda)</option>
                          <option value="DAILY">Diaria (Todos los días)</option>
                          <option value="WEEKLY">Semanal (Días específicos)</option>
                          <option value="MONTHLY">Mensual (1ro de cada mes)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Hora Programada (HH:mm)
                        </label>
                        <input
                          type="time"
                          value={editingCampaign.time || '10:00'}
                          onChange={(e) =>
                            setEditingCampaign({ ...editingCampaign, time: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                        <select
                          value={editingCampaign.status || 'ACTIVE'}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 font-semibold"
                        >
                          <option value="ACTIVE">Activa (Programada)</option>
                          <option value="PAUSED">Pausada</option>
                          <option value="DRAFT">Borrador</option>
                        </select>
                      </div>
                    </div>

                    {/* Días de la semana si es WEEKLY */}
                    {editingCampaign.frequency === 'WEEKLY' && (
                      <div className="pt-2">
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Días de la semana en que se enviará:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = (editingCampaign.daysOfWeek || []).includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => {
                                  const current = editingCampaign.daysOfWeek || [];
                                  const next = isSelected
                                    ? current.filter((d) => d !== day.value)
                                    : [...current, day.value];
                                  setEditingCampaign({ ...editingCampaign, daysOfWeek: next });
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                  isSelected
                                    ? 'bg-brand-red text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {day.full}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Vista Previa Renderizada */
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                  <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-white to-red-50 border-b-2 border-red-100 text-center">
                      <h2 className="text-xl font-extrabold text-brand-red">PAPES CONFORT</h2>
                      <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest">
                        Hogar & Confort
                      </span>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">¡Hola Juan!</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tenemos novedades y promociones preparadas para vos:
                        </p>
                      </div>

                      <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {(editingCampaign.content || '').replace(/\{\{nombre\}\}/gi, 'Juan')}
                      </div>

                      {editingCampaign.ctaText && (
                        <div className="text-center pt-4">
                          <span className="inline-block px-6 py-2.5 bg-brand-red text-white text-xs font-bold rounded-full shadow-md shadow-brand-red/25">
                            {editingCampaign.ctaText}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 text-center text-2xs text-slate-400 border-t border-slate-100">
                      Recibís este correo porque te suscribiste a novedades de Papes Confort.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingCampaign}
                onClick={handleSaveCampaign}
                className="px-5 py-2 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-brand-red/90 transition shadow-2xs disabled:opacity-50 flex items-center gap-2"
              >
                {savingCampaign && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Guardar Campaña</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VISTA PREVIA COMPLETA */}
      {/* ========================================================= */}
      {previewModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Vista Previa del Email</h3>
                <p className="text-xs text-slate-500">{previewModalCampaign.subject}</p>
              </div>
              <button
                onClick={() => setPreviewModalCampaign(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-white to-red-50 border-b-2 border-red-100 text-center">
                  <h2 className="text-2xl font-black text-brand-red tracking-tight">PAPES CONFORT</h2>
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest">
                    Hogar & Confort
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">¡Hola Lautaro!</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tenemos novedades y promociones preparadas para vos:
                    </p>
                  </div>

                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {previewModalCampaign.content.replace(/\{\{nombre\}\}/gi, 'Lautaro')}
                  </div>

                  {previewModalCampaign.ctaText && (
                    <div className="text-center pt-4">
                      <a
                        href={previewModalCampaign.ctaUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-7 py-3 bg-brand-red text-white text-xs font-bold rounded-full shadow-md shadow-brand-red/25"
                      >
                        {previewModalCampaign.ctaText}
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100 space-y-1">
                  <p>Recibís este correo porque te suscribiste a novedades de Papes Confort.</p>
                  <p className="font-semibold text-slate-500">Papes Confort — Basavilbaso, Entre Ríos</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setPreviewModalCampaign(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ENVIAR A SUSCRIPTORES / ENVIAR PRUEBA */}
      {/* ========================================================= */}
      {sendModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Send className="h-5 w-5 text-brand-red" />
                <h3 className="font-bold text-slate-900">Enviar Notificación por Email</h3>
              </div>
              <button
                onClick={() => setSendModalCampaign(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500">Campaña seleccionada:</div>
                <div className="font-bold text-slate-900 text-sm">{sendModalCampaign.title}</div>
                <div className="text-brand-red font-semibold">&ldquo;{sendModalCampaign.subject}&rdquo;</div>
              </div>

              {/* Opción 1: Enviar correo de prueba */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Enviar Correo de Prueba (Recomendado)
                </span>
                <p className="text-xs text-slate-500">
                  Enviate una vista previa real a tu casilla antes de despachar a toda la base.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                  <button
                    disabled={sendingEmail || !testEmailInput.trim()}
                    onClick={() => handleExecuteSend(true)}
                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 transition shadow-2xs"
                  >
                    Probar
                  </button>
                </div>
              </div>

              {/* Opción 2: Enviar a todos los suscriptores */}
              <div className="border-2 border-brand-red/20 bg-red-50/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-red uppercase tracking-wider block">
                    2. Despachar a Todos los Suscriptores
                  </span>
                  <span className="text-xs font-extrabold text-brand-red bg-red-100/80 px-2.5 py-0.5 rounded-full">
                    {totalSubscribed} destinatarios
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Esta acción enviará el correo personalizado a los {totalSubscribed} clientes que tienen tildada la suscripción a novedades.
                </p>
                <button
                  disabled={sendingEmail || totalSubscribed === 0}
                  onClick={() => {
                    if (
                      confirm(
                        `¿Confirmás el envío masivo a los ${totalSubscribed} suscriptores inscritos?`
                      )
                    ) {
                      handleExecuteSend(false);
                    }
                  }}
                  className="w-full py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl hover:bg-brand-red/90 disabled:opacity-50 transition shadow-sm shadow-brand-red/25 flex items-center justify-center gap-2"
                >
                  {sendingEmail && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>Enviar Ahora a los {totalSubscribed} Suscriptores</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
