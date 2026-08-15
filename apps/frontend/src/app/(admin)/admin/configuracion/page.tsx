'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '../../../../lib/api';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Save,
  Lock,
  Mail,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/auth';
import { HomeFlyerDto, PaymentFeatureCardDto } from '@papes-confort/shared';

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

const DEFAULT_PAYMENT_CARDS: PaymentFeatureCardDto[] = [
  {
    id: 'card-1',
    title: 'Hasta 12 cuotas sin interés',
    description: 'Con tarjetas bancarias seleccionadas en toda la tienda.',
    icon: 'credit-card',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'card-2',
    title: '10% de descuento',
    description: 'Abonando mediante transferencia bancaria inmediata.',
    icon: 'percent',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'card-3',
    title: 'Pago con QR y MODO',
    description: 'Escaneá de forma rápida y segura desde la app de tu banco.',
    icon: 'qr-code',
    isActive: true,
    sortOrder: 3,
  },
];

function AdminConfiguracionContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'banners' | 'payment_cards' | 'general' | 'security') || 'banners';
  const [activeTab, setActiveTab] = useState<'banners' | 'payment_cards' | 'general' | 'security'>(initialTab);

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [safetyStock, setSafetyStock] = useState('1');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [flyers, setFlyers] = useState<HomeFlyerDto[]>(DEFAULT_INITIAL_FLYERS);
  const [paymentCards, setPaymentCards] = useState<PaymentFeatureCardDto[]>(DEFAULT_PAYMENT_CARDS);

  // Modal State para Banners Flyers
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<HomeFlyerDto | null>(null);
  const [flyerTitle, setFlyerTitle] = useState('');
  const [flyerImageUrl, setFlyerImageUrl] = useState('');
  const [flyerIsActive, setFlyerIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal State para Tarjetas Informativas
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentFeatureCardDto | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardIcon, setCardIcon] = useState<'credit-card' | 'percent' | 'qr-code' | 'truck' | 'shield'>('credit-card');
  const [cardIsActive, setCardIsActive] = useState(true);

  const { user, accessToken, setAuth } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [confirmPasswordForEmail, setConfirmPasswordForEmail] = useState('');
  const [showConfirmPasswordForEmail, setShowConfirmPasswordForEmail] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);


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
        if (res.data.home_payment_cards) {
          try {
            const parsed = JSON.parse(res.data.home_payment_cards);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPaymentCards(parsed);
            }
          } catch (e) {
            console.error('Error al parsear home_payment_cards de DB:', e);
          }
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const saveSettings = async (updatedFlyers?: HomeFlyerDto[], updatedCards?: PaymentFeatureCardDto[]) => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const flyersToSave = updatedFlyers || flyers;
    const cardsToSave = updatedCards || paymentCards;

    const body = {
      safety_stock: safetyStock,
      whatsapp_number: whatsappNumber,
      home_flyers: JSON.stringify(flyersToSave),
      home_payment_cards: JSON.stringify(cardsToSave),
    };

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (res.success) {
      setSuccessMsg('Configuraciones guardadas exitosamente.');
    } else {
      setErrorMsg(res.error || 'Error al guardar las configuraciones.');
    }
    setSaveLoading(false);
  };

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
          if (res.error === 'Unauthorized' || res.error?.includes('Unauthorized')) {
            alert('Tu sesión de administrador ha expirado. Por favor, vuelve a iniciar sesión.');
            window.location.href = '/admin/login';
          } else {
            alert(res.error || 'Error al subir la imagen.');
          }
        }

        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error al procesar la imagen:', err);
      setUploadingImage(false);
    }
  };

  // Flyer CRUD operations
  const openNewFlyerModal = () => {
    setEditingFlyer(null);
    setFlyerTitle('');
    setFlyerImageUrl('');
    setFlyerIsActive(true);
    setIsFlyerModalOpen(true);
  };

  const openEditFlyerModal = (flyer: HomeFlyerDto) => {
    setEditingFlyer(flyer);
    setFlyerTitle(flyer.title || '');
    setFlyerImageUrl(flyer.imageUrl || '');
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
              imageUrl: flyerImageUrl,
              linkUrl: '/catalogo',
              isActive: flyerIsActive,
            }
          : f
      );
    } else {
      const newFlyer: HomeFlyerDto = {
        id: `flyer-${Date.now()}`,
        title: flyerTitle,
        imageUrl: flyerImageUrl,
        linkUrl: '/catalogo',
        isActive: flyerIsActive,
        sortOrder: flyers.length + 1,
      };
      newFlyersList = [...flyers, newFlyer];
    }

    setFlyers(newFlyersList);
    setIsFlyerModalOpen(false);
    await saveSettings(newFlyersList, undefined);
  };

  const handleToggleFlyerActive = async (id: string) => {
    const newFlyersList = flyers.map((f) =>
      f.id === id ? { ...f, isActive: !f.isActive } : f
    );
    setFlyers(newFlyersList);
    await saveSettings(newFlyersList, undefined);
  };

  const handleDeleteFlyer = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este banner promocional?')) return;
    const newFlyersList = flyers.filter((f) => f.id !== id);
    setFlyers(newFlyersList);
    await saveSettings(newFlyersList, undefined);
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

    newFlyersList.forEach((f, idx) => {
      f.sortOrder = idx + 1;
    });

    setFlyers(newFlyersList);
    await saveSettings(newFlyersList, undefined);
  };

  // Payment Cards CRUD Operations
  const openNewCardModal = () => {
    setEditingCard(null);
    setCardTitle('');
    setCardDescription('');
    setCardIcon('credit-card');
    setCardIsActive(true);
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (card: PaymentFeatureCardDto) => {
    setEditingCard(card);
    setCardTitle(card.title);
    setCardDescription(card.description);
    setCardIcon(card.icon);
    setCardIsActive(card.isActive);
    setIsCardModalOpen(true);
  };

  const handleSaveCardModal = async (e: React.FormEvent) => {
    e.preventDefault();
    let newCardsList: PaymentFeatureCardDto[] = [];

    if (editingCard) {
      newCardsList = paymentCards.map((c) =>
        c.id === editingCard.id
          ? {
              ...c,
              title: cardTitle,
              description: cardDescription,
              icon: cardIcon,
              isActive: cardIsActive,
            }
          : c
      );
    } else {
      const newCard: PaymentFeatureCardDto = {
        id: `card-${Date.now()}`,
        title: cardTitle,
        description: cardDescription,
        icon: cardIcon,
        isActive: cardIsActive,
        sortOrder: paymentCards.length + 1,
      };
      newCardsList = [...paymentCards, newCard];
    }

    setPaymentCards(newCardsList);
    setIsCardModalOpen(false);
    await saveSettings(undefined, newCardsList);
  };

  const handleToggleCardActive = async (id: string) => {
    const newCardsList = paymentCards.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setPaymentCards(newCardsList);
    await saveSettings(undefined, newCardsList);
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarjeta informativa?')) return;
    const newCardsList = paymentCards.filter((c) => c.id !== id);
    setPaymentCards(newCardsList);
    await saveSettings(undefined, newCardsList);
  };

  const handleMoveCard = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === paymentCards.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newCardsList = [...paymentCards];
    const temp = newCardsList[index];
    newCardsList[index] = newCardsList[targetIdx];
    newCardsList[targetIdx] = temp;

    newCardsList.forEach((c, idx) => {
      c.sortOrder = idx + 1;
    });

    setPaymentCards(newCardsList);
    await saveSettings(undefined, newCardsList);
  };

  const handleLoadDefaultPresetCards = async () => {
    if (!confirm('¿Deseas restaurar las 3 tarjetas informativas sugeridas por defecto?')) return;
    setPaymentCards(DEFAULT_PAYMENT_CARDS);
    await saveSettings(undefined, DEFAULT_PAYMENT_CARDS);
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando panel de configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Encabezado Principal */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-brand-black tracking-tight">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestiona los banners promocionales, tarjetas informativas de la portada, vías de contacto comercial y credenciales de acceso.
        </p>
      </div>

      {/* Tabs de Navegación de Configuración */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'banners'
              ? 'bg-brand-red text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Banners de Portada</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'banners' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {flyers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payment_cards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'payment_cards'
              ? 'bg-brand-red text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Tarjetas Informativas</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'payment_cards' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {paymentCards.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-brand-red text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>WhatsApp y Atención</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-brand-red text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Seguridad de Cuenta</span>
        </button>
      </div>

      {/* Alertas de Respuesta */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-xs font-semibold text-emerald-700 shadow-xs">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 text-xs font-semibold text-rose-700 shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Banners de Portada */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Carrusel de Banners Promocionales</h2>
            </div>
            <button
              type="button"
              onClick={openNewFlyerModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Banner</span>
            </button>
          </div>

          {/* Grilla de Banners Configurados */}
          {flyers.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white space-y-3">
              <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No hay banners promocionales configurados</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Haz clic en &quot;Nuevo Banner&quot; para adjuntar la primera imagen promocional para la portada de la tienda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {flyers.map((flyer, index) => (
                <div
                  key={flyer.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    flyer.isActive
                      ? 'bg-white border-slate-200/80 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-16 w-28 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center relative">
                      {flyer.imageUrl ? (
                        <img
                          src={flyer.imageUrl}
                          alt={flyer.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 p-1 text-center">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-[9px] font-bold mt-0.5">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                        <h3 className="text-sm font-bold text-slate-800 truncate">{flyer.title || 'Sin Nombre'}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            flyer.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {flyer.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleMoveFlyer(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      title="Mover arriba"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveFlyer(index, 'down')}
                      disabled={index === flyers.length - 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      title="Mover abajo"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFlyerActive(flyer.id)}
                      className={`p-2 rounded-xl border cursor-pointer ${
                        flyer.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                      title={flyer.isActive ? 'Desactivar banner' : 'Activar banner'}
                    >
                      {flyer.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditFlyerModal(flyer)}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                      title="Editar banner"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlyer(flyer.id)}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      title="Eliminar banner"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Tarjetas Informativas de Beneficios */}
      {activeTab === 'payment_cards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Tarjetas Informativas de Portada</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Personaliza libremente el título, descripción e ícono de las tarjetas de beneficios que se ven en la portada.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDefaultPresetCards}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer shrink-0"
              >
                <span>Restaurar Sugerencias</span>
              </button>

              <button
                type="button"
                onClick={openNewCardModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Grilla de Tarjetas Informativas */}
          {paymentCards.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white space-y-3">
              <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No hay tarjetas informativas configuradas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Crea una nueva tarjeta o presiona &quot;Restaurar Sugerencias&quot; para cargar los 3 modelos por defecto.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentCards.map((card, index) => {
                return (
                  <div
                    key={card.id}
                    className={`p-4.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      card.isActive
                        ? 'bg-white border-slate-200/80 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      {/* Number Container */}
                      <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 text-brand-red font-black text-base shrink-0 flex items-center justify-center">
                        {index + 1}
                      </div>
                      

                      {/* Text details */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                          <h3 className="text-sm font-bold text-slate-900 truncate">{card.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              card.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {card.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{card.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleMoveCard(index, 'up')}
                        disabled={index === 0}
                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                        title="Mover arriba"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCard(index, 'down')}
                        disabled={index === paymentCards.length - 1}
                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                        title="Mover abajo"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCardActive(card.id)}
                        className={`p-2 rounded-xl border cursor-pointer ${
                          card.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                        }`}
                        title={card.isActive ? 'Desactivar tarjeta' : 'Activar tarjeta'}
                      >
                        {card.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditCardModal(card)}
                        className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                        title="Editar tarjeta"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WhatsApp y Atención Comercial */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-red" />
              <span>WhatsApp de Atención Comercial</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Configura el número oficial de atención al cliente para recibir mensajes del botón de WhatsApp y consultas de compra.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Número Telefónico (Formato Internacional sin +)
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="ej. 5493445454261"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/40 focus:bg-white transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Ejemplo para Argentina: <span className="font-semibold text-slate-600">5493445454261</span> (Código de país 54 + 9 + característica + número).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saveLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Seguridad de la Cuenta */}
      {activeTab === 'security' && (
        <div className="space-y-8 max-w-2xl">
          {/* Cambio de Correo */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-red" />
                <span>Correo de Administrador</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Correo actual del administrador: <span className="font-bold text-slate-700">{user?.email || 'N/A'}</span>
              </p>
            </div>

            <form onSubmit={handleEmailChange} autoComplete="off" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nuevo Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="nuevo-email@papesconfort.com.ar"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/40 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Confirmar con Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPasswordForEmail ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPasswordForEmail}
                    onChange={(e) => setConfirmPasswordForEmail(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/40 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPasswordForEmail(!showConfirmPasswordForEmail)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    title={showConfirmPasswordForEmail ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPasswordForEmail ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={emailChangeLoading || !newEmail || !confirmPasswordForEmail}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {emailChangeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Actualizar Correo</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cambio de Contraseña */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Lock className="h-5 w-5 text-brand-red" />
                <span>Contraseña de Acceso</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Modifica la contraseña de acceso al panel comercial. Por seguridad se enviará un código de validación a tu correo.
              </p>
            </div>

            {!showCodeInput ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/40 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                      title={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>


                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleRequestPasswordChange}
                    disabled={!newPassword || requestLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {requestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Solicitar Código por Email</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50/80 border border-slate-200 p-5 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Código de Confirmación (Enviado a {user?.email || 'tu correo'})
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="ej. 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-brand-black outline-none focus:border-brand-red/40 transition-all font-mono"
                  />

                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPasswordChange}
                    disabled={!verificationCode || confirmLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all disabled:opacity-50 shadow-sm"
                  >
                    {confirmLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Confirmar Cambio</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Flyer */}
      {isFlyerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-display text-lg font-extrabold text-brand-black">
                {editingFlyer ? 'Editar Banner Promocional' : 'Nuevo Banner Promocional'}
              </h3>
              <button
                onClick={() => setIsFlyerModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                />
              </div>

              {/* Adjuntar Imagen del Flyer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Imagen del Banner (Adjuntar archivo)
                </label>
                
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                  <ImageIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Tamaño ideal recomendado para el Banner</p>
                    <p className="text-amber-800 leading-relaxed text-[11px]">
                      <strong>1200 x 400 píxeles</strong> (Proporción horizontal 3:1). Formatos soportados: JPG, PNG o WebP (Máx. 5 MB).
                    </p>
                  </div>
                </div>

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
                  className="h-4 w-4 rounded-md border-slate-300 text-brand-red focus:ring-brand-red/20 cursor-pointer"
                />
                <label htmlFor="flyerIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Banner Activo (Visible en la portada)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFlyerModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!flyerTitle || saveLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Guardar Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Tarjeta Informativa */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-display text-lg font-extrabold text-brand-black">
                {editingCard ? 'Editar Tarjeta Informativa' : 'Nueva Tarjeta Informativa'}
              </h3>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCardModal} className="overflow-y-auto p-6 space-y-4 flex-grow">

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Título Principal de la Tarjeta
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Hasta 12 cuotas sin interés"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Descripción / Texto Informativo
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ej. Con tarjetas bancarias seleccionadas en toda la tienda."
                  value={cardDescription}
                  onChange={(e) => setCardDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-brand-black outline-none focus:border-brand-red/30 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cardIsActive"
                  checked={cardIsActive}
                  onChange={(e) => setCardIsActive(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-300 text-brand-red focus:ring-brand-red/20 cursor-pointer"
                />
                <label htmlFor="cardIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Tarjeta Activa (Visible en la portada)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!cardTitle || !cardDescription || saveLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Guardar Tarjeta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminConfiguracionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 text-brand-red animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Cargando panel de configuración...</span>
      </div>
    }>
      <AdminConfiguracionContent />
    </Suspense>
  );
}
