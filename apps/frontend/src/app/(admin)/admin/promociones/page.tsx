'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  Tag,
} from 'lucide-react';
import {
  BankPromotionDto,
  CreatePromotionPayload,
  DAY_OF_WEEK_NAMES,
} from '@papes-confort/shared';
import { fetchApi } from '../../../../lib/api';

export default function AdminPromocionesPage() {
  const [promotions, setPromotions] = useState<BankPromotionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<BankPromotionDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreatePromotionPayload>({
    name: '',
    description: '',
    bankName: '',
    cardType: 'Visa y Mastercard',
    dayOfWeek: null,
    discountPercent: 15,
    maxReimbursement: 15000,
    installmentsTotal: 3,
    installmentsPaid: 3,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<BankPromotionDto[]>('/api/admin/bank-promotions');
      if (res.success && res.data) {
        setPromotions(res.data);
      } else {
        setError(res.error || 'Error al cargar las promociones bancarias');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      name: '',
      description: '',
      bankName: '',
      cardType: 'Visa y Mastercard',
      dayOfWeek: null,
      discountPercent: 15,
      maxReimbursement: 15000,
      installmentsTotal: 3,
      installmentsPaid: 3,
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: BankPromotionDto) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      bankName: promo.bankName,
      cardType: promo.cardType,
      dayOfWeek: promo.dayOfWeek,
      discountPercent: promo.discountPercent,
      maxReimbursement: promo.maxReimbursement,
      installmentsTotal: promo.installmentsTotal,
      installmentsPaid: promo.installmentsPaid,
      isActive: promo.isActive,
      validFrom: promo.validFrom.split('T')[0],
      validUntil: promo.validUntil.split('T')[0],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetchApi<BankPromotionDto>(`/api/admin/bank-promotions/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res.success && res.data) {
        setPromotions((prev) => prev.map((p) => (p.id === id ? res.data! : p)));
        setSuccessMessage('Estado de la promoción actualizado con éxito.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al alternar estado');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la promoción "${name}"?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/api/admin/bank-promotions/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
        setSuccessMessage('Promoción eliminada con éxito.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bankName.trim()) {
      setError('Por favor completá el nombre de la promoción y el banco.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreatePromotionPayload = {
        ...formData,
        discountPercent: Number(formData.discountPercent),
        maxReimbursement: Number(formData.maxReimbursement),
        installmentsTotal: Number(formData.installmentsTotal),
        installmentsPaid: Number(formData.installmentsPaid),
        dayOfWeek: formData.dayOfWeek !== null && formData.dayOfWeek !== undefined ? Number(formData.dayOfWeek) : null,
      };

      if (editingPromo) {
        const res = await fetchApi<BankPromotionDto>(`/api/admin/bank-promotions/${editingPromo.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success && res.data) {
          setPromotions((prev) => prev.map((p) => (p.id === editingPromo.id ? res.data! : p)));
          setIsModalOpen(false);
          setSuccessMessage('Promoción bancaria actualizada exitosamente.');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(res.error || 'Error al actualizar');
        }
      } else {
        const res = await fetchApi<BankPromotionDto>('/api/admin/bank-promotions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success && res.data) {
          setPromotions((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
          setSuccessMessage('Promoción bancaria creada exitosamente.');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(res.error || 'Error al crear');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error en el guardado');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de promociones
  const filteredPromotions = promotions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.bankName.toLowerCase().includes(search.toLowerCase()) ||
      p.cardType.toLowerCase().includes(search.toLowerCase());

    const matchesDay =
      selectedDayFilter === 'all'
        ? true
        : selectedDayFilter === 'everyday'
        ? p.dayOfWeek === null
        : p.dayOfWeek === Number(selectedDayFilter);

    return matchesSearch && matchesDay;
  });

  const activeCount = promotions.filter((p) => p.isActive).length;
  const uniqueBanks = Array.from(new Set(promotions.map((p) => p.bankName))).length;

  return (
    <div className="space-y-6">
      {/* 1. Header con métricas y botón de creación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 bg-brand-navy/5 px-3 py-0.5 text-xs font-bold text-brand-navy mb-1.5">
            <CreditCard className="h-3.5 w-3.5 text-brand-navy" />
            <span>Sprint 3.1 · Financiación & Beneficios</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Promociones Bancarias
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Gestioná los convenios comerciales con bancos, tarjetas, días de reintegro y planes de cuotas que se anuncian en la web.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-red px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-brand-red-dark shadow-[0_4px_16px_rgba(228,20,20,0.25)] transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Promoción</span>
        </button>
      </div>

      {/* Alertas globales */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-rose-900 shadow-2xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Tarjetas de métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promociones Activas</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeCount}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bancos con Convenio</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{uniqueBanks}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registradas</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{promotions.length}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <Tag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Filtros y búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, banco o tarjeta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 shrink-0">Filtrar día:</span>
          <select
            value={selectedDayFilter}
            onChange={(e) => setSelectedDayFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer"
          >
            <option value="all">Todos los días</option>
            <option value="everyday">Todos los días (Vigencia continua)</option>
            <option value="1">Lunes</option>
            <option value="2">Martes</option>
            <option value="3">Miércoles</option>
            <option value="4">Jueves</option>
            <option value="5">Viernes</option>
            <option value="6">Sábado</option>
            <option value="0">Domingo</option>
          </select>
        </div>
      </div>

      {/* 4. Tabla de Promociones */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
            <span className="text-xs font-bold text-slate-400">Cargando promociones bancarias...</span>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">No se encontraron promociones</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || selectedDayFilter !== 'all'
                ? 'Probá ajustando los filtros de búsqueda.'
                : 'Todavía no hay promociones bancarias registradas. Hacé clic en "Nueva Promoción" para comenzar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Promoción & Banco</th>
                  <th className="py-3.5 px-4">Día Activo</th>
                  <th className="py-3.5 px-4">Descuento & Tope</th>
                  <th className="py-3.5 px-4">Financiación</th>
                  <th className="py-3.5 px-4">Vigencia</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPromotions.map((p) => {
                  const dayLabel = p.dayOfWeek !== null ? DAY_OF_WEEK_NAMES[p.dayOfWeek] : 'Todos los días';
                  const isSpecialInstallment = p.installmentsTotal !== p.installmentsPaid;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span className="font-semibold text-slate-700">{p.bankName}</span>
                            <span>·</span>
                            <span>{p.cardType}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {dayLabel}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-brand-red text-sm">
                            {p.discountPercent}% OFF
                          </span>
                          {p.maxReimbursement > 0 && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              Tope: ${p.maxReimbursement.toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isSpecialInstallment ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px]">
                            <Sparkles className="h-3 w-3 text-amber-600" />
                            <span>{p.installmentsTotal} cuotas (pagás {p.installmentsPaid})</span>
                          </span>
                        ) : p.installmentsTotal > 1 ? (
                          <span className="font-bold text-slate-800">
                            Hasta {p.installmentsTotal} cuotas sin interés
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">1 pago</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        <div className="space-y-0.5">
                          <span>Del {new Date(p.validFrom).toLocaleDateString('es-AR')}</span>
                          <p className="text-slate-400">al {new Date(p.validUntil).toLocaleDateString('es-AR')}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{p.isActive ? 'Activa' : 'Inactiva'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Editar promoción"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar promoción"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal Crear / Editar Promoción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingPromo ? 'Editar Promoción Bancaria' : 'Nueva Promoción Bancaria'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Completá los datos del acuerdo comercial con el banco.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre de la promo */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Título de la Promoción *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Galicia Élite Miércoles"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Banco */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Banco Emisor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Banco Galicia, Santander, Macro..."
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Tipo de tarjeta */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tarjetas Aplicables *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Visa y Mastercard, Crédito..."
                    value={formData.cardType}
                    onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Día de la semana */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Día de la Semana</label>
                  <select
                    value={formData.dayOfWeek === null || formData.dayOfWeek === undefined ? 'null' : String(formData.dayOfWeek)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dayOfWeek: e.target.value === 'null' ? null : Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  >
                    <option value="null">Todos los días (Vigente toda la semana)</option>
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="0">Domingo</option>
                  </select>
                </div>

                {/* Descuento % */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Porcentaje de Descuento / Reintegro (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Tope de reintegro */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tope de Reintegro ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ej: 15000 (0 = Sin tope)"
                    value={formData.maxReimbursement || 0}
                    onChange={(e) => setFormData({ ...formData, maxReimbursement: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Financiación: Total cuotas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Total de Cuotas Ofrecidas *</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    required
                    value={formData.installmentsTotal}
                    onChange={(e) => setFormData({ ...formData, installmentsTotal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Cuotas pagadas (soporte para 'X cuotas pagás Y') */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cuotas que abona el cliente *</label>
                  <input
                    type="number"
                    min="1"
                    max={formData.installmentsTotal || 48}
                    required
                    value={formData.installmentsPaid}
                    onChange={(e) => setFormData({ ...formData, installmentsPaid: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                  <p className="text-[10px] text-slate-400">
                    Ej: Para 3 cuotas sin interés poné 3. Para &ldquo;15 pagás 12&rdquo;, poné 15 total y 12 pagadas.
                  </p>
                </div>

                {/* Fecha Desde */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Válido Desde *</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Fecha Hasta */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Válido Hasta *</label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                {/* Estado Activo */}
                <div className="sm:col-span-2 pt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-brand-red focus:ring-brand-red h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Promoción Activa en la Tienda
                    </span>
                  </label>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-red text-xs font-bold text-white hover:bg-brand-red-dark shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingPromo ? 'Guardar Cambios' : 'Crear Promoción'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
