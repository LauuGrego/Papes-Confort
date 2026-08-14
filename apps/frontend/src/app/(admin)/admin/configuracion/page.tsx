'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { Loader2, AlertCircle, CheckCircle, Plus, Trash2, Edit2, Eye, EyeOff, X, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../../../../stores/auth';
import { HomeFlyerDto } from '@papes-confort/shared';

const DEFAULT_INITIAL_FLYERS: HomeFlyerDto[] = [
  {
    id: 'flyer-1',
    title: 'Banner Promocional Inicial',
    imageUrl: '',
    linkUrl: '/catalogo',
    isActive: true,
    sortOrder: 1,
  },
];

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [safetyStock, setSafetyStock] = useState('1');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [flyers, setFlyers] = useState<HomeFlyerDto[]>(DEFAULT_INITIAL_FLYERS);

  // Modal State para Flyers
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<HomeFlyerDto | null>(null);

  // Flyer Form State
  const [flyerTitle, setFlyerTitle] = useState('');
  const [flyerSubtitle, setFlyerSubtitle] = useState('');
  const [flyerBadge, setFlyerBadge] = useState('');
  const [flyerImageUrl, setFlyerImageUrl] = useState('');
  const [flyerButtonText, setFlyerButtonText] = useState('Ver Promoción');
  const [flyerIsActive, setFlyerIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await fetchApi<{ url: string }>('/api/admin/settings/upload-flyer', {
          method: 'POST',
          body: JSON.stringify({ image: base64Data }),
        });

        if (res.success && res.data?.url) {
          setFlyerImageUrl(res.data.url);
        } else {
          alert(res.error || 'Error al subir la imagen.');
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error al procesar la imagen:', err);
      setUploadingImage(false);
    }
  };

  const { user, accessToken, setAuth } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [confirmPasswordForEmail, setConfirmPasswordForEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  const handleRequestPasswordChange = async () => {
    if (!newPassword) return;
    setRequestLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/change-password-request', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });

    if (res.success) {
      setSuccessMsg(`Código de confirmación enviado a ${user?.email || 'tu correo'}.`);
      setShowCodeInput(true);
    } else {
      setErrorMsg(res.error || 'Error al solicitar el cambio de contraseña.');
    }
    setRequestLoading(false);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !confirmPasswordForEmail) return;
    setEmailChangeLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/change-email', {
      method: 'POST',
      body: JSON.stringify({
        newEmail,
        currentPassword: confirmPasswordForEmail,
      }),
    });

    if (res.success && res.data) {
      setSuccessMsg('Correo electrónico de administrador actualizado con éxito.');
      if (user) {
        setAuth({ ...user, email: res.data.email }, accessToken);
      }
      setNewEmail('');
      setConfirmPasswordForEmail('');
    } else {
      setErrorMsg(res.error || 'Error al cambiar el correo electrónico.');
    }
    setEmailChangeLoading(false);
  };

  const handleConfirmPasswordChange = async () => {
    if (!verificationCode) return;
    setConfirmLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/confirm-password-change', {
      method: 'POST',
      body: JSON.stringify({ code: verificationCode }),
    });

    if (res.success) {
      setSuccessMsg('Contraseña de administrador actualizada con éxito.');
      setNewPassword('');
      setVerificationCode('');
      setShowCodeInput(false);
    } else {
      setErrorMsg(res.error || 'Código incorrecto o expirado.');
    }
    setConfirmLoading(false);
  };

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const res = await fetchApi<Record<string, string>>('/api/admin/settings');
      if (res.success && res.data) {
        setSafetyStock(res.data.safety_stock || '1');
        setWhatsappNumber(res.data.whatsapp_number || '');
        if (res.data.home_flyers) {
          try {
            const parsed = JSON.parse(res.data.home_flyers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFlyers(parsed);
            }
          } catch (e) {
            console.error('Error al parsear home_flyers de DB:', e);
          }
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const saveSettings = async (updatedFlyers?: HomeFlyerDto[]) => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const flyersToSave = updatedFlyers || flyers;

    const body = {
      safety_stock: safetyStock,
      whatsapp_number: whatsappNumber,
      home_flyers: JSON.stringify(flyersToSave),
    };

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (res.success) {
      setSuccessMsg('Configuraciones y flyers guardados exitosamente.');
    } else {
      setErrorMsg(res.error || 'Error al guardar las configuraciones.');
    }
    setSaveLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
  };

  // Flyer CRUD operations
  const openNewFlyerModal = () => {
    setEditingFlyer(null);
    setFlyerTitle('');
    setFlyerSubtitle('');
    setFlyerBadge('');
    setFlyerImageUrl('');
    setFlyerButtonText('Ver Promoción');
    setFlyerIsActive(true);
    setIsFlyerModalOpen(true);
  };

  const openEditFlyerModal = (flyer: HomeFlyerDto) => {
    setEditingFlyer(flyer);
    setFlyerTitle(flyer.title || '');
    setFlyerSubtitle(flyer.subtitle || '');
    setFlyerBadge(flyer.badge || '');
    setFlyerImageUrl(flyer.imageUrl || '');
    setFlyerButtonText(flyer.buttonText || 'Ver Promoción');
    setFlyerIsActive(flyer.isActive);
    setIsFlyerModalOpen(true);
  };

  const handleSaveFlyerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    let newFlyersList: HomeFlyerDto[] = [];

    if (editingFlyer) {
      newFlyersList = flyers.map((f) =>
        f.id === editingFlyer.id
          ? {
              ...f,
              title: flyerTitle,
              subtitle: flyerSubtitle,
              badge: flyerBadge,
              imageUrl: flyerImageUrl,
              linkUrl: '/catalogo',
              buttonText: flyerButtonText,
              isActive: flyerIsActive,
            }
          : f
      );
    } else {
      const newFlyer: HomeFlyerDto = {
        id: `flyer-${Date.now()}`,
        title: flyerTitle,
        subtitle: flyerSubtitle,
        badge: flyerBadge,
        imageUrl: flyerImageUrl,
        linkUrl: '/catalogo',
        buttonText: flyerButtonText,
        isActive: flyerIsActive,
        sortOrder: flyers.length + 1,
      };
      newFlyersList = [...flyers, newFlyer];
    }

    setFlyers(newFlyersList);
    setIsFlyerModalOpen(false);
    await saveSettings(newFlyersList);
  };

  const handleToggleFlyerActive = async (id: string) => {
    const newFlyersList = flyers.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    setFlyers(newFlyersList);
    await saveSettings(newFlyersList);
  };

  const handleDeleteFlyer = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este flyer promocional?')) return;
    const newFlyersList = flyers.filter((f) => f.id !== id);
    setFlyers(newFlyersList);
    await saveSettings(newFlyersList);
  };

  const handleMoveFlyer = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === flyers.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newFlyersList = [...flyers];
    const temp = newFlyersList[index];
    newFlyersList[index] = newFlyersList[targetIdx];
    newFlyersList[targetIdx] = temp;

    // Recalculate sortOrders
    newFlyersList.forEach((f, idx) => {
      f.sortOrder = idx + 1;
    });

    setFlyers(newFlyersList);
    await saveSettings(newFlyersList);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-black">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-slate-400">
          Ajusta las variables de control comercial del e-commerce.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_5px_20px_rgba(0,0,0,0.01)] max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {successMsg && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-600">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">WhatsApp de Consultas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Número de teléfono celular para recibir consultas de compras y financiación.
              Usa el formato internacional sin símbolos (ej: 5493445454261).
            </p>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="549XXXXXXXXXX"
              className="w-64 px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all mt-1"
            />
          </div>

          <div className="border-t border-slate-50 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center gap-2 rounded-full bg-brand-red hover:bg-brand-red-dark px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Configuración
            </button>
          </div>
        </form>

        {/* Sección de Gestión de Flyers Promocionales del Home */}
        <div className="space-y-6 border-t border-slate-50 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-brand-black flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-brand-red" />
                Flyers Promocionales de Portada (Carrusel)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                Carga banners promocionales rotativos por foto o texto para destacar ofertas (ej. Día del Niño, Descuentos).
              </p>
            </div>
            <button
              type="button"
              onClick={openNewFlyerModal}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-red hover:bg-brand-red-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm hover:shadow shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nuevo Flyer
            </button>
          </div>

          {/* Listado de Flyers */}
          <div className="space-y-3">
            {flyers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-slate-400 text-xs">
                No hay flyers promocionales cargados. Haz clic en "Nuevo Flyer" para agregar el primero.
              </div>
            ) : (
              flyers.map((flyer, idx) => (
                <div
                  key={flyer.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    flyer.isActive
                      ? 'bg-white border-slate-100 shadow-xs'
                      : 'bg-slate-50/70 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Miniatura / Icono */}
                    <div className="h-12 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      {flyer.imageUrl ? (
                        <img src={flyer.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {flyer.badge && (
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {flyer.badge}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${flyer.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {flyer.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-sm">
                        {flyer.title || 'Flyer de Imagen Exclusiva'}
                      </h4>
                      {flyer.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate max-w-sm">
                          {flyer.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveFlyer(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 cursor-pointer"
                      title="Mover arriba"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveFlyer(idx, 'down')}
                      disabled={idx === flyers.length - 1}
                      className="p-1.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 cursor-pointer"
                      title="Mover abajo"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFlyerActive(flyer.id)}
                      className={`p-1.5 rounded-xl border border-slate-100 transition-colors cursor-pointer ${
                        flyer.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                      title={flyer.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {flyer.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditFlyerModal(flyer)}
                      className="p-1.5 rounded-xl border border-slate-100 text-slate-500 hover:text-brand-red hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlyer(flyer.id)}
                      className="p-1.5 rounded-xl border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección de Cambio de Correo */}
        <div className="space-y-6 border-t border-slate-50 pt-6 mt-8">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Correo Electrónico de Administrador</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modifica la dirección de correo a la cual se envían las confirmaciones de seguridad del panel.
            </p>
          </div>

          <form onSubmit={handleEmailChange} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nuevo Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@papesconfort.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Confirmar con Contraseña Actual
              </label>
              <input
                type="password"
                required
                placeholder="Contraseña actual"
                value={confirmPasswordForEmail}
                onChange={(e) => setConfirmPasswordForEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={emailChangeLoading || !newEmail || !confirmPasswordForEmail}
              className="px-6 py-2.5 h-10 rounded-full bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {emailChangeLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Actualizar Correo
            </button>
          </form>
        </div>

        {/* Sección de Cambio de Contraseña */}
        <div className="space-y-6 border-t border-slate-50 pt-6 mt-8">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Contraseña de Administrador</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cambia la contraseña de acceso al panel de administración. Requiere confirmación por correo electrónico.
            </p>
          </div>

          {!showCodeInput ? (
            <div className="flex gap-3 max-w-md items-end">
              <div className="flex-grow space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleRequestPasswordChange}
                disabled={!newPassword || requestLoading}
                className="px-6 py-2.5 h-10 rounded-full bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {requestLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Solicitar Código'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md bg-slate-50/50 border border-slate-100 p-5 rounded-3xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Código de Confirmación (enviado a {user?.email || 'tu correo'})
                </label>
                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all text-center font-mono text-lg tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPasswordChange}
                  disabled={!verificationCode || confirmLoading}
                  className="flex-grow px-6 py-2.5 h-10 rounded-full bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {confirmLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar Cambio'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeInput(false);
                    setVerificationCode('');
                  }}
                  className="px-4 py-2.5 h-10 rounded-full border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear / Editar Flyer Promocional */}
      {isFlyerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="font-display text-lg font-extrabold text-brand-black">
                  {editingFlyer ? 'Editar Flyer Promocional' : 'Nuevo Flyer Promocional'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Completa los datos del banner para la portada del e-commerce.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFlyerModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlyerModal} className="overflow-y-auto p-6 space-y-4 flex-grow">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nombre / Referencia Interna del Banner
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Promoción Día del Niño, Ofertas en Colchones"
                  value={flyerTitle}
                  onChange={(e) => setFlyerTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                />
              </div>

              {/* Adjuntar Imagen del Flyer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Imagen del Banner (Adjuntar archivo)
                </label>
                
                {/* Nota de tamaño ideal recomendado */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                  <ImageIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Tamaño ideal recomendado para el Banner</p>
                    <p className="text-amber-800 leading-relaxed text-[11px]">
                      <strong>1200 x 400 píxeles</strong> (Proporción horizontal 3:1). Formatos soportados: JPG, PNG o WebP (Máx. 5 MB).
                    </p>
                  </div>
                </div>

                {/* Input de archivo y Preview */}
                <div className="space-y-3">
                  {flyerImageUrl ? (
                    <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={flyerImageUrl} alt="Preview" className="h-16 w-28 object-cover rounded-xl border border-slate-200" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Imagen adjunta lista para la portada
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFlyerImageUrl('')}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-brand-red/40 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors group">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <Loader2 className="h-6 w-6 text-brand-red animate-spin" />
                          <span className="text-xs font-bold text-slate-600">Subiendo imagen...</span>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                          <ImageIcon className="h-8 w-8 text-slate-400 group-hover:text-brand-red transition-colors" />
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-brand-red hover:underline block">
                              Haz clic aquí para seleccionar y adjuntar la imagen del banner
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="flyerIsActive"
                  checked={flyerIsActive}
                  onChange={(e) => setFlyerIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-red focus:ring-brand-red cursor-pointer"
                />
                <label htmlFor="flyerIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Activar este banner inmediatamente en la portada
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFlyerModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase bg-brand-red text-white hover:bg-brand-red-dark transition-all shadow-md"
                >
                  Guardar Flyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

