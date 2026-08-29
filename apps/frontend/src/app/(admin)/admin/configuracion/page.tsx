'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
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
  Move,
  MapPin,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/auth';
import {
  HomeFlyerDto,
  PaymentFeatureCardDto,
  FlyerAspectRatio,
  FlyerObjectFit,
  HomeHeroBannerDto,
  DEFAULT_HERO_BANNER,
} from '@papes-confort/shared';

const DEFAULT_INITIAL_FLYERS: HomeFlyerDto[] = [
  {
    id: 'flyer-1',
    title: 'Banner Promocional Inicial',
    imageUrl: '',
    linkUrl: '/catalogo',
    isActive: true,
    sortOrder: 1,
    aspectRatio: 'ultrawide',
    objectFit: 'cover',
    objectPosition: 'center',
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
  const [heroSaveLoading, setHeroSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [safetyStock, setSafetyStock] = useState('1');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [flyers, setFlyers] = useState<HomeFlyerDto[]>(DEFAULT_INITIAL_FLYERS);
  const [paymentCards, setPaymentCards] = useState<PaymentFeatureCardDto[]>(DEFAULT_PAYMENT_CARDS);

  // Hero Main Banner State (Foto principal de la portada)
  const [heroBanner, setHeroBanner] = useState<HomeHeroBannerDto>(DEFAULT_HERO_BANNER);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);

  // Drag State para Hero Banner
  const heroPreviewContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingHero, setIsDraggingHero] = useState(false);
  const [dragStartHeroPos, setDragStartHeroPos] = useState<{ x: number; y: number; startX: number; startY: number } | null>(null);

  const handleHeroDragStart = (clientX: number, clientY: number) => {
    if (!heroBanner.imageUrl) return;
    setIsDraggingHero(true);
    setDragStartHeroPos({
      x: clientX,
      y: clientY,
      startX: heroBanner.objectPositionX ?? 50,
      startY: heroBanner.objectPositionY ?? 50,
    });
  };

  const handleHeroDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingHero || !dragStartHeroPos || !heroPreviewContainerRef.current) return;
    const rect = heroPreviewContainerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = clientX - dragStartHeroPos.x;
    const deltaY = clientY - dragStartHeroPos.y;

    const percentDeltaX = -(deltaX / rect.width) * 100;
    const percentDeltaY = -(deltaY / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, Math.round(dragStartHeroPos.startX + percentDeltaX)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStartHeroPos.startY + percentDeltaY)));

    setHeroBanner((prev: HomeHeroBannerDto) => ({
      ...prev,
      objectPositionX: newX,
      objectPositionY: newY,
    }));
  };

  const handleHeroDragEnd = () => {
    setIsDraggingHero(false);
    setDragStartHeroPos(null);
  };

  // Modal State para Banners Flyers
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<HomeFlyerDto | null>(null);
  const [flyerTitle, setFlyerTitle] = useState('');
  const [flyerImageUrl, setFlyerImageUrl] = useState('');
  const [flyerIsActive, setFlyerIsActive] = useState(true);
  const [flyerAspectRatio, setFlyerAspectRatio] = useState<FlyerAspectRatio>('ultrawide');
  const [flyerObjectFit, setFlyerObjectFit] = useState<FlyerObjectFit>('cover');
  const [flyerObjectPositionX, setFlyerObjectPositionX] = useState<number>(50);
  const [flyerObjectPositionY, setFlyerObjectPositionY] = useState<number>(50);
  const [uploadingImage, setUploadingImage] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number; startX: number; startY: number } | null>(null);

  const handleBannerDragStart = (clientX: number, clientY: number) => {
    if (!flyerImageUrl) return;
    setIsDraggingBanner(true);
    setDragStartPos({
      x: clientX,
      y: clientY,
      startX: flyerObjectPositionX,
      startY: flyerObjectPositionY,
    });
  };

  const handleBannerDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingBanner || !dragStartPos || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = clientX - dragStartPos.x;
    const deltaY = clientY - dragStartPos.y;

    const percentDeltaX = -(deltaX / rect.width) * 100;
    const percentDeltaY = -(deltaY / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, Math.round(dragStartPos.startX + percentDeltaX)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStartPos.startY + percentDeltaY)));

    setFlyerObjectPositionX(newX);
    setFlyerObjectPositionY(newY);
  };

  const handleBannerDragEnd = () => {
    setIsDraggingBanner(false);
    setDragStartPos(null);
  };

  // Modal State para Tarjetas Informativas
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentFeatureCardDto | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardIcon, setCardIcon] = useState<'credit-card' | 'percent' | 'qr-code' | 'truck' | 'shield'>('credit-card');
  const [cardIsActive, setCardIsActive] = useState(true);

  const { user, clearAuth } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [confirmPasswordForEmail, setConfirmPasswordForEmail] = useState('');
  const [showConfirmPasswordForEmail, setShowConfirmPasswordForEmail] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [showEmailCodeInput, setShowEmailCodeInput] = useState(false);
  const [emailRequestLoading, setEmailRequestLoading] = useState(false);
  const [emailConfirmLoading, setEmailConfirmLoading] = useState(false);


  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const res = await fetchApi<Record<string, string>>('/api/admin/settings');
      if (res.success && res.data) {
        setSafetyStock(res.data.safety_stock || '1');
        setWhatsappNumber(res.data.whatsapp_number || '');
        if (res.data.home_hero_banner) {
          try {
            const parsed = JSON.parse(res.data.home_hero_banner);
            if (parsed && typeof parsed === 'object') {
              setHeroBanner({ ...DEFAULT_HERO_BANNER, ...parsed });
            }
          } catch (e) {
            console.error('Error al parsear home_hero_banner de DB:', e);
          }
        }
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

  const saveSettings = async (
    updatedFlyers?: HomeFlyerDto[],
    updatedCards?: PaymentFeatureCardDto[],
    updatedHeroBanner?: HomeHeroBannerDto
  ) => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const flyersToSave = updatedFlyers || flyers;
    const cardsToSave = updatedCards || paymentCards;
    const heroToSave = updatedHeroBanner || heroBanner;

    const body = {
      safety_stock: safetyStock,
      whatsapp_number: whatsappNumber,
      home_flyers: JSON.stringify(flyersToSave),
      home_payment_cards: JSON.stringify(cardsToSave),
      home_hero_banner: JSON.stringify(heroToSave),
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

  const handleSaveHeroBanner = async (customBanner?: HomeHeroBannerDto) => {
    setHeroSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const target = customBanner || heroBanner;

    const body = {
      safety_stock: safetyStock,
      whatsapp_number: whatsappNumber,
      home_flyers: JSON.stringify(flyers),
      home_payment_cards: JSON.stringify(paymentCards),
      home_hero_banner: JSON.stringify(target),
    };

    const res = await fetchApi<Record<string, string>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (res.success) {
      setSuccessMsg('Banner principal de portada actualizado con éxito.');
    } else {
      setErrorMsg(res.error || 'Error al guardar el banner principal.');
    }
    setHeroSaveLoading(false);
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeroImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await fetchApi<{ url: string }>('/api/admin/settings/upload-flyer', {
          method: 'POST',
          body: JSON.stringify({ image: base64Data }),
        });

        if (res.success && res.data?.url) {
          const newUrl = res.data.url;
          setHeroBanner((prev: HomeHeroBannerDto) => ({ ...prev, imageUrl: newUrl }));
        } else {
          if (res.error === 'Unauthorized' || res.error?.includes('Unauthorized')) {
            alert('Tu sesión de administrador ha expirado. Por favor, vuelve a iniciar sesión.');
            window.location.href = '/admin/login';
          } else {
            alert(res.error || 'Error al subir la imagen.');
          }
        }
        setUploadingHeroImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error al subir imagen del hero banner:', err);
      setUploadingHeroImage(false);
    }
  };

  const handleResetHeroBanner = async () => {
    if (!confirm('¿Deseas restaurar la foto y configuración original del edificio por defecto?')) return;
    setHeroBanner(DEFAULT_HERO_BANNER);
    await handleSaveHeroBanner(DEFAULT_HERO_BANNER);
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
    setFlyerAspectRatio('ultrawide');
    setFlyerObjectFit('cover');
    setFlyerObjectPositionX(50);
    setFlyerObjectPositionY(50);
    setIsFlyerModalOpen(true);
  };

  const openEditFlyerModal = (flyer: HomeFlyerDto) => {
    setEditingFlyer(flyer);
    setFlyerTitle(flyer.title || '');
    setFlyerImageUrl(flyer.imageUrl || '');
    setFlyerIsActive(flyer.isActive);
    setFlyerAspectRatio(flyer.aspectRatio || 'ultrawide');
    setFlyerObjectFit(flyer.objectFit || 'cover');

    if (flyer.objectPositionX !== undefined && flyer.objectPositionY !== undefined) {
      setFlyerObjectPositionX(flyer.objectPositionX);
      setFlyerObjectPositionY(flyer.objectPositionY);
    } else {
      // Map string presets if exist
      const pos = flyer.objectPosition || 'center';
      if (pos.includes('top')) setFlyerObjectPositionY(0);
      else if (pos.includes('bottom')) setFlyerObjectPositionY(100);
      else setFlyerObjectPositionY(50);

      if (pos.includes('left')) setFlyerObjectPositionX(0);
      else if (pos.includes('right')) setFlyerObjectPositionX(100);
      else setFlyerObjectPositionX(50);
    }

    setIsFlyerModalOpen(true);
  };

  const handleSaveFlyerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    let newFlyersList: HomeFlyerDto[] = [];
    const formattedPosition = `${flyerObjectPositionX}% ${flyerObjectPositionY}%`;

    if (editingFlyer) {
      newFlyersList = flyers.map((f) =>
        f.id === editingFlyer.id
          ? {
              ...f,
              title: flyerTitle,
              imageUrl: flyerImageUrl,
              linkUrl: '/catalogo',
              isActive: flyerIsActive,
              aspectRatio: flyerAspectRatio,
              objectFit: flyerObjectFit,
              objectPosition: formattedPosition,
              objectPositionX: flyerObjectPositionX,
              objectPositionY: flyerObjectPositionY,
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
        aspectRatio: flyerAspectRatio,
        objectFit: flyerObjectFit,
        objectPosition: formattedPosition,
        objectPositionX: flyerObjectPositionX,
        objectPositionY: flyerObjectPositionY,
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

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !confirmPasswordForEmail) return;
    setEmailRequestLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/change-email-request', {
      method: 'POST',
      body: JSON.stringify({
        newEmail,
        currentPassword: confirmPasswordForEmail,
      }),
    });

    if (res.success) {
      setSuccessMsg(res.message || `Código de confirmación enviado a tu correo actual (${user?.email || ''}).`);
      setShowEmailCodeInput(true);
    } else {
      setErrorMsg(res.error || 'Error al solicitar el cambio de correo.');
    }
    setEmailRequestLoading(false);
  };

  const handleConfirmEmailChange = async () => {
    if (!emailVerificationCode) return;
    setEmailConfirmLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await fetchApi<any>('/api/admin/settings/confirm-email-change', {
      method: 'POST',
      body: JSON.stringify({ code: emailVerificationCode }),
    });

    if (res.success) {
      setSuccessMsg('Correo electrónico de administrador actualizado con éxito. Redirigiendo para iniciar sesión...');
      setNewEmail('');
      setConfirmPasswordForEmail('');
      setEmailVerificationCode('');
      setShowEmailCodeInput(false);
      setTimeout(async () => {
        await fetchApi('/api/auth/logout', { method: 'POST' });
        clearAuth();
        window.location.href = '/admin/login';
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Código incorrecto o expirado.');
      setEmailConfirmLoading(false);
    }
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
      setSuccessMsg('Contraseña de administrador actualizada con éxito. Redirigiendo para iniciar sesión con tu nueva contraseña...');
      setNewPassword('');
      setVerificationCode('');
      setShowCodeInput(false);
      setTimeout(async () => {
        await fetchApi('/api/auth/logout', { method: 'POST' });
        clearAuth();
        window.location.href = '/admin/login';
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Código incorrecto o expirado.');
      setConfirmLoading(false);
    }
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
        <div className="space-y-10">
          {/* SECCIÓN 1: FOTO / BANNER PRINCIPAL DEL HERO */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-red" />
                  <h2 className="text-lg font-extrabold text-slate-800">Banner Principal de Portada (Hero)</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Personaliza la foto principal que se muestra en el encabezado de la tienda (junto al lema &quot;Llevamos el confort que tu hogar merece&quot;).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetHeroBanner}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                  title="Restaurar valores y foto original del edificio"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Foto por Defecto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveHeroBanner()}
                  disabled={heroSaveLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-md shadow-brand-red/20 disabled:opacity-60 cursor-pointer"
                >
                  {heroSaveLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Guardar Banner Principal</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-5">
                {/* Image Upload & URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Imagen del Banner *
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={heroBanner.imageUrl}
                        onChange={(e) => setHeroBanner({ ...heroBanner, imageUrl: e.target.value })}
                        placeholder="https://ejemplo.com/banner.jpg o /images/edificio.webp"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all font-mono"
                      />
                    </div>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0">
                      {uploadingHeroImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploadingHeroImage ? 'Subiendo...' : 'Subir Archivo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        disabled={uploadingHeroImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Recomendado: Imágenes horizontales o cuadradas en alta resolución (.webp, .jpg, .png).
                  </p>
                </div>

                {/* Título y Enlace de Destino */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Título / Texto Alternativo
                    </label>
                    <input
                      type="text"
                      value={heroBanner.title || ''}
                      onChange={(e) => setHeroBanner({ ...heroBanner, title: e.target.value })}
                      placeholder="Ej: Edificio Papes Confort"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Enlace al hacer clic (opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={heroBanner.linkUrl || ''}
                        onChange={(e) => setHeroBanner({ ...heroBanner, linkUrl: e.target.value })}
                        placeholder="Ej: /catalogo o /ofertas"
                        className="w-full px-4 py-2.5 pl-8 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                      />
                      <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Badge flotante de ubicación */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-red" />
                      <span className="text-xs font-bold text-slate-700">Etiqueta Flotante / Badge de Ubicación</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroBanner.showBadge !== false}
                        onChange={(e) => setHeroBanner({ ...heroBanner, showBadge: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>

                  {heroBanner.showBadge !== false && (
                    <div>
                      <input
                        type="text"
                        value={heroBanner.badgeText || ''}
                        onChange={(e) => setHeroBanner({ ...heroBanner, badgeText: e.target.value })}
                        placeholder="Ej: Basavilbaso, Entre Ríos"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Aparece en la esquina inferior izquierda de la imagen con diseño traslúcido y el ícono de ubicación.
                      </p>
                    </div>
                  )}
                </div>

                {/* Ajustes de Encuadre & Posición */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Modo de Ajuste
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Arrastra la foto en la vista previa a la derecha para encuadrarla.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setHeroBanner((prev: HomeHeroBannerDto) => ({ ...prev, objectFit: 'cover' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          heroBanner.objectFit !== 'contain'
                            ? 'bg-brand-red text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Cover (Llenar)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroBanner((prev: HomeHeroBannerDto) => ({ ...prev, objectFit: 'contain' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          heroBanner.objectFit === 'contain'
                            ? 'bg-brand-red text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Contain (Completa)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <div className="flex items-center gap-2">
                      <Move className="h-3.5 w-3.5 text-brand-red" />
                      <span className="text-xs text-slate-600 font-medium">
                        Posición actual: <strong className="font-mono text-slate-900">X: {heroBanner.objectPositionX ?? 50}% | Y: {heroBanner.objectPositionY ?? 50}%</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setHeroBanner((prev: HomeHeroBannerDto) => ({
                          ...prev,
                          objectPositionX: 50,
                          objectPositionY: 50,
                        }))
                      }
                      className="text-[11px] font-bold text-slate-500 hover:text-brand-red transition-colors cursor-pointer"
                    >
                      Centrar (50% / 50%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Box con Arrastre Interactivo */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Move className="h-3.5 w-3.5 text-brand-red" />
                    <span>Vista Previa & Encuadre</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Arrastrá para reubicar
                  </span>
                </div>

                <div
                  ref={heroPreviewContainerRef}
                  onMouseDown={(e) => handleHeroDragStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleHeroDragMove(e.clientX, e.clientY)}
                  onMouseUp={handleHeroDragEnd}
                  onMouseLeave={handleHeroDragEnd}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      handleHeroDragStart(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length > 0) {
                      handleHeroDragMove(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchEnd={handleHeroDragEnd}
                  onTouchCancel={handleHeroDragEnd}
                  className={`relative overflow-hidden rounded-3xl shadow-lg border-2 bg-gradient-to-b from-slate-100 to-white aspect-[4/3] max-h-[380px] flex items-center justify-center select-none touch-none transition-all group ${
                    isDraggingHero
                      ? 'cursor-grabbing border-brand-red ring-4 ring-brand-red/20'
                      : 'cursor-grab border-slate-200/80 hover:border-brand-red/60 shadow-md'
                  }`}
                >
                  {/* Floating drag indicator badge */}
                  {heroBanner.imageUrl && (
                    <div className="absolute top-3 left-3 z-30 bg-slate-900/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 pointer-events-none flex items-center gap-1.5 shadow-md">
                      <Move className="h-3 w-3 text-rose-400 animate-pulse" />
                      <span>{isDraggingHero ? 'Arrastrando foto...' : 'Arrastrá la foto para encuadrar'}</span>
                    </div>
                  )}

                  {heroBanner.imageUrl ? (
                    <img
                      src={heroBanner.imageUrl}
                      alt={heroBanner.title || 'Banner Principal'}
                      draggable={false}
                      style={{
                        objectFit: heroBanner.objectFit || 'cover',
                        objectPosition: `${heroBanner.objectPositionX ?? 50}% ${heroBanner.objectPositionY ?? 50}%`,
                      }}
                      className="w-full h-full select-none pointer-events-none transition-all duration-75"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                      <span className="text-xs font-bold">Sin imagen configurada</span>
                    </div>
                  )}

                  {/* Soft bottom gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

                  {/* Floating location pill preview */}
                  {heroBanner.showBadge !== false && (
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-2 pointer-events-none z-20">
                      <MapPin className="h-3.5 w-3.5 text-brand-red shrink-0" />
                      <span className="text-xs font-bold text-brand-black tracking-wide">
                        {heroBanner.badgeText || 'Basavilbaso, Entre Ríos'}
                      </span>
                    </div>
                  )}

                  {heroBanner.linkUrl && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 border border-white/20 pointer-events-none z-20">
                      <LinkIcon className="h-3 w-3" />
                      <span>{heroBanner.linkUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CARRUSEL DE BANNERS PROMOCIONALES */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Carrusel de Banners Promocionales</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Banners rotativos secundarios que se muestran encima de la sección principal.
                </p>
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

            {!showEmailCodeInput ? (
              <form onSubmit={handleRequestEmailChange} autoComplete="off" className="space-y-4">
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
                    disabled={emailRequestLoading || !newEmail || !confirmPasswordForEmail}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {emailRequestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Solicitar Código por Email</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 bg-slate-50/80 border border-slate-200 p-5 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Código de Confirmación (Enviado a {user?.email || 'tu correo actual'})
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="ej. 123456"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-brand-black outline-none focus:border-brand-red/40 transition-all font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailCodeInput(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEmailChange}
                    disabled={!emailVerificationCode || emailConfirmLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {emailConfirmLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Confirmar Cambio de Correo</span>
                  </button>
                </div>
              </div>
            )}
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

            <form onSubmit={handleSaveFlyerModal} className="overflow-y-auto p-6 space-y-5 flex-grow">
              {/* Referencia Interna */}
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
                
                <div className="space-y-3">
                  {flyerImageUrl ? (
                    <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={flyerImageUrl} alt="Preview" className="h-14 w-24 object-cover rounded-xl border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">Imagen adjunta cargada</p>
                          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle className="h-3 w-3 shrink-0" /> Lista para la portada
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

              {/* Selector de Proporciones Predefinidas con Previsualizaciones de Tamaño */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Proporción y Tamaño de Banner
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFlyerAspectRatio('ultrawide')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      flyerAspectRatio === 'ultrawide'
                        ? 'border-brand-red bg-rose-50/50 ring-2 ring-brand-red/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Ultrawide (4.5:1)</span>
                      {flyerAspectRatio === 'ultrawide' && <CheckCircle className="h-3.5 w-3.5 text-brand-red" />}
                    </div>
                    {/* Miniatura visual de proporción */}
                    <div className="h-7 w-full bg-slate-200/80 rounded-lg flex items-center justify-center p-1">
                      <div className="w-full h-2.5 bg-slate-400/80 rounded-xs" />
                    </div>
                    <span className="text-[10px] text-slate-400">Banner delgado horizontal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlyerAspectRatio('wide')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      flyerAspectRatio === 'wide'
                        ? 'border-brand-red bg-rose-50/50 ring-2 ring-brand-red/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Estándar (16:9)</span>
                      {flyerAspectRatio === 'wide' && <CheckCircle className="h-3.5 w-3.5 text-brand-red" />}
                    </div>
                    {/* Miniatura visual de proporción */}
                    <div className="h-7 w-full bg-slate-200/80 rounded-lg flex items-center justify-center p-1">
                      <div className="w-10 h-5 bg-slate-400/80 rounded-xs" />
                    </div>
                    <span className="text-[10px] text-slate-400">Hero clásico rectangular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlyerAspectRatio('compact')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      flyerAspectRatio === 'compact'
                        ? 'border-brand-red bg-rose-50/50 ring-2 ring-brand-red/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Compacto (2.5:1)</span>
                      {flyerAspectRatio === 'compact' && <CheckCircle className="h-3.5 w-3.5 text-brand-red" />}
                    </div>
                    {/* Miniatura visual de proporción */}
                    <div className="h-7 w-full bg-slate-200/80 rounded-lg flex items-center justify-center p-1">
                      <div className="w-12 h-4 bg-slate-400/80 rounded-xs" />
                    </div>
                    <span className="text-[10px] text-slate-400">Mediano balanceado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlyerAspectRatio('tall')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      flyerAspectRatio === 'tall'
                        ? 'border-brand-red bg-rose-50/50 ring-2 ring-brand-red/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Alto (3:2)</span>
                      {flyerAspectRatio === 'tall' && <CheckCircle className="h-3.5 w-3.5 text-brand-red" />}
                    </div>
                    {/* Miniatura visual de proporción */}
                    <div className="h-7 w-full bg-slate-200/80 rounded-lg flex items-center justify-center p-1">
                      <div className="w-8 h-6 bg-slate-400/80 rounded-xs" />
                    </div>
                    <span className="text-[10px] text-slate-400">Destacado de mayor altura</span>
                  </button>
                </div>
              </div>

              {/* Modo de Ajuste (object-fit) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Modo de Ajuste
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setFlyerObjectFit('cover')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      flyerObjectFit === 'cover'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Recortar y Llenar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlyerObjectFit('contain')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      flyerObjectFit === 'contain'
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Ajustar Entera sin Recorte
                  </button>
                </div>
              </div>

              {/* LIENZO DE ARRASTRE INTERACTIVO DIRECTO (MOUSE & TÁCTIL) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Move className="h-3.5 w-3.5 text-brand-red" />
                    <span>Ajuste de Posición (Haz clic/toca y arrastra la foto)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFlyerObjectPositionX(50);
                      setFlyerObjectPositionY(50);
                    }}
                    className="text-[11px] font-bold text-brand-red hover:underline cursor-pointer"
                  >
                    Centrar (50% / 50%)
                  </button>
                </div>

                {/* Contenedor Interactivo con Eventos de Arrastre */}
                <div className="w-full flex justify-center items-center bg-transparent p-1">
                  <div
                    ref={previewContainerRef}
                    onMouseDown={(e) => handleBannerDragStart(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleBannerDragMove(e.clientX, e.clientY)}
                    onMouseUp={handleBannerDragEnd}
                    onMouseLeave={handleBannerDragEnd}
                    onTouchStart={(e) => {
                      if (e.touches.length > 0) handleBannerDragStart(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length > 0) handleBannerDragMove(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchEnd={handleBannerDragEnd}
                    onTouchCancel={handleBannerDragEnd}
                    className={`w-full relative overflow-hidden flex justify-center items-center transition-all mx-auto select-none touch-none rounded-2xl border-2 border-slate-300 group ${
                      isDraggingBanner ? 'cursor-grabbing border-brand-red ring-2 ring-brand-red/20' : 'cursor-grab hover:border-brand-red/60'
                    } ${
                      flyerAspectRatio === 'wide'
                        ? 'aspect-[16/9]'
                        : flyerAspectRatio === 'compact'
                        ? 'aspect-[2.5/1]'
                        : flyerAspectRatio === 'tall'
                        ? 'aspect-[3/2]'
                        : 'aspect-[4.5/1]'
                    }`}
                  >
                    {/* Badge ayuda flotante */}
                    {flyerImageUrl && (
                      <div className="absolute top-2.5 right-2.5 z-20 bg-slate-900/80 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/20 pointer-events-none flex items-center gap-1.5 shadow-md">
                        <Move className="h-3 w-3 text-rose-400 animate-pulse" />
                        <span>{isDraggingBanner ? 'Arrastrando...' : 'Arrastra la foto para ubicarla'}</span>
                      </div>
                    )}

                    {flyerImageUrl ? (
                      <img
                        src={flyerImageUrl}
                        alt="Ajuste Interactivo"
                        draggable={false}
                        style={{
                          objectFit: flyerObjectFit,
                          objectPosition: `${flyerObjectPositionX}% ${flyerObjectPositionY}%`,
                        }}
                        className={`transition-all duration-75 select-none ${
                          flyerObjectFit === 'contain' ? 'w-auto h-full mx-auto' : 'w-full h-full'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center bg-slate-50">
                        <ImageIcon className="h-6 w-6 opacity-40 mb-1" />
                        <span className="text-[11px] font-bold">Adjunta una imagen arriba para arrastrar y encuadrar</span>
                      </div>
                    )}
                  </div>
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
