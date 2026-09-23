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
  Save,
  Lock,
  Mail,
  CreditCard,
  MapPin,
  RotateCcw,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/auth';
import AdminCategoriesConfig from '../../../../components/admin/AdminCategoriesConfig';
import AdminWeeklyOfferConfig from '../../../../components/admin/AdminWeeklyOfferConfig';
import AdminTrustBarConfig from '../../../../components/admin/AdminTrustBarConfig';
import AdminAboutConfig from '../../../../components/admin/AdminAboutConfig';
import {
  HomeFlyerDto,
  PaymentFeatureCardDto,
  FlyerAspectRatio,
  FlyerObjectFit,
  HomeHeroBannerDto,
  DEFAULT_HERO_BANNER,
  HomeCategoryCardDto,
  DEFAULT_CATEGORY_CARDS,
  HomeWeeklyOfferDto,
  DEFAULT_WEEKLY_OFFER,
  HomeTrustBarItemDto,
  DEFAULT_TRUST_BAR,
  HomeAboutDto,
  DEFAULT_ABOUT_SECTION,
  InstallmentsConfigDto,
  DEFAULT_INSTALLMENTS_CONFIG,
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
  type TabType =
    | 'landing'
    | 'hero'
    | 'banners'
    | 'flyers'
    | 'categories'
    | 'weekly_offer'
    | 'trust_bar'
    | 'about'
    | 'payment_cards'
    | 'general'
    | 'security';
  const paramTab = searchParams.get('tab') as TabType;
  const initialTab = paramTab || 'landing';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const rawTab = searchParams.get('tab') as TabType;
    if (rawTab) {
      setActiveTab(rawTab);
    }
  }, [searchParams]);
 


  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [heroSaveLoading, setHeroSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [safetyStock, setSafetyStock] = useState('1');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [flyers, setFlyers] = useState<HomeFlyerDto[]>(DEFAULT_INITIAL_FLYERS);
  const [paymentCards, setPaymentCards] = useState<PaymentFeatureCardDto[]>(DEFAULT_PAYMENT_CARDS);
  const [installmentsConfig, setInstallmentsConfig] = useState<InstallmentsConfigDto>(DEFAULT_INSTALLMENTS_CONFIG);
  const [installmentsSaveLoading, setInstallmentsSaveLoading] = useState(false);

  // Landing Components States
  const [categoryCards, setCategoryCards] = useState<HomeCategoryCardDto[]>(DEFAULT_CATEGORY_CARDS);
  const [weeklyOffer, setWeeklyOffer] = useState<HomeWeeklyOfferDto>(DEFAULT_WEEKLY_OFFER);
  const [trustBarItems, setTrustBarItems] = useState<HomeTrustBarItemDto[]>(DEFAULT_TRUST_BAR);
  const [aboutConfig, setAboutConfig] = useState<HomeAboutDto>(DEFAULT_ABOUT_SECTION);

  // Hero Main Banner State (Foto principal de la portada)
  const [heroBanner, setHeroBanner] = useState<HomeHeroBannerDto>(DEFAULT_HERO_BANNER);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);

  // Modal State para Banners Flyers
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<HomeFlyerDto | null>(null);
  const [flyerTitle, setFlyerTitle] = useState('');
  const [flyerImageUrl, setFlyerImageUrl] = useState('');
  const [flyerImages, setFlyerImages] = useState<string[]>([]);
  const [flyerIsActive, setFlyerIsActive] = useState(true);
  const [flyerAspectRatio, setFlyerAspectRatio] = useState<FlyerAspectRatio>('ultrawide');
  const [flyerObjectFit, setFlyerObjectFit] = useState<FlyerObjectFit>('cover');
  const [flyerObjectPositionX, setFlyerObjectPositionX] = useState<number>(50);
  const [flyerObjectPositionY, setFlyerObjectPositionY] = useState<number>(50);
  const [uploadingImage, setUploadingImage] = useState(false);

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
        if (res.data.home_category_cards) {
          try {
            const parsed = JSON.parse(res.data.home_category_cards);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCategoryCards(parsed);
            }
          } catch (e) {
            console.error('Error al parsear home_category_cards de DB:', e);
          }
        }
        if (res.data.home_weekly_offer) {
          try {
            const parsed = JSON.parse(res.data.home_weekly_offer);
            if (parsed && typeof parsed === 'object') {
              setWeeklyOffer({ ...DEFAULT_WEEKLY_OFFER, ...parsed });
            }
          } catch (e) {
            console.error('Error al parsear home_weekly_offer de DB:', e);
          }
        }
        if (res.data.home_trust_bar) {
          try {
            const parsed = JSON.parse(res.data.home_trust_bar);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTrustBarItems(parsed);
            }
          } catch (e) {
            console.error('Error al parsear home_trust_bar de DB:', e);
          }
        }
        if (res.data.home_about) {
          try {
            const parsed = JSON.parse(res.data.home_about);
            if (parsed && typeof parsed === 'object') {
              setAboutConfig({ ...DEFAULT_ABOUT_SECTION, ...parsed });
            }
          } catch (e) {
            console.error('Error al parsear home_about de DB:', e);
          }
        }
        if (res.data.installments_config) {
          try {
            const parsed = JSON.parse(res.data.installments_config);
            if (parsed && typeof parsed === 'object') {
              setInstallmentsConfig({ ...DEFAULT_INSTALLMENTS_CONFIG, ...parsed });
            }
          } catch (e) {
            console.error('Error al parsear installments_config de DB:', e);
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
    updatedHeroBanner?: HomeHeroBannerDto,
    updatedCategories?: HomeCategoryCardDto[],
    updatedWeeklyOffer?: HomeWeeklyOfferDto,
    updatedTrustBar?: HomeTrustBarItemDto[],
    updatedAbout?: HomeAboutDto,
    updatedInstallments?: InstallmentsConfigDto
  ) => {
    setSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const flyersToSave = updatedFlyers || flyers;
    const cardsToSave = updatedCards || paymentCards;
    const heroToSave = updatedHeroBanner || heroBanner;
    const categoriesToSave = updatedCategories || categoryCards;
    const weeklyOfferToSave = updatedWeeklyOffer || weeklyOffer;
    const trustBarToSave = updatedTrustBar || trustBarItems;
    const aboutToSave = updatedAbout || aboutConfig;
    const installmentsToSave = updatedInstallments || installmentsConfig;

    const body = {
      safety_stock: safetyStock,
      whatsapp_number: whatsappNumber,
      home_flyers: JSON.stringify(flyersToSave),
      home_payment_cards: JSON.stringify(cardsToSave),
      home_hero_banner: JSON.stringify(heroToSave),
      home_category_cards: JSON.stringify(categoriesToSave),
      home_weekly_offer: JSON.stringify(weeklyOfferToSave),
      home_trust_bar: JSON.stringify(trustBarToSave),
      home_about: JSON.stringify(aboutToSave),
      installments_config: JSON.stringify(installmentsToSave),
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
          setHeroBanner((prev: HomeHeroBannerDto) => {
            const currentImgs = prev.images && prev.images.length > 0 ? prev.images : (prev.imageUrl ? [prev.imageUrl] : []);
            const updatedImgs = [...currentImgs, newUrl];
            return {
              ...prev,
              imageUrl: prev.imageUrl || newUrl,
              images: updatedImgs,
            };
          });
        } else {
          if (res.error === 'Unauthorized' || res.error?.includes('Unauthorized')) {
            alert('Tu sesión de administrador ha expirado. Por favor, vuelve a iniciar sesión.');
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/ingresar?redirect=${returnUrl}`;
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

  const handleRemoveHeroImage = (indexToRemove: number) => {
    setHeroBanner((prev: HomeHeroBannerDto) => {
      const currentImgs = prev.images && prev.images.length > 0 ? prev.images : (prev.imageUrl ? [prev.imageUrl] : []);
      const updatedImgs = currentImgs.filter((_, idx) => idx !== indexToRemove);
      const newMain = updatedImgs[0] || DEFAULT_HERO_BANNER.imageUrl;
      return {
        ...prev,
        imageUrl: newMain,
        images: updatedImgs,
      };
    });
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
          const newUrl = res.data.url;
          setFlyerImages((prev) => [...prev, newUrl]);
          if (!flyerImageUrl) {
            setFlyerImageUrl(newUrl);
          }
        } else {
          if (res.error === 'Unauthorized' || res.error?.includes('Unauthorized')) {
            alert('Tu sesión de administrador ha expirado. Por favor, vuelve a iniciar sesión.');
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/ingresar?redirect=${returnUrl}`;
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

  const handleRemoveFlyerImage = (indexToRemove: number) => {
    setFlyerImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0) {
        setFlyerImageUrl(updated[0]);
      } else {
        setFlyerImageUrl('');
      }
      return updated;
    });
  };

  // Flyer CRUD operations
  const openNewFlyerModal = () => {
    setEditingFlyer(null);
    setFlyerTitle('');
    setFlyerImageUrl('');
    setFlyerImages([]);
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
    const imgs = flyer.images && flyer.images.length > 0
      ? flyer.images
      : (flyer.imageUrl ? [flyer.imageUrl] : []);
    setFlyerImages(imgs);
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
    const finalImages = flyerImages.filter((img) => img && img.trim() !== '');
    const mainImageUrl = finalImages[0] || flyerImageUrl;

    if (editingFlyer) {
      newFlyersList = flyers.map((f) =>
        f.id === editingFlyer.id
          ? {
              ...f,
              title: flyerTitle,
              imageUrl: mainImageUrl,
              images: finalImages,
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
        imageUrl: mainImageUrl,
        images: finalImages,
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

  const handleSaveInstallmentsConfig = async (customConfig?: InstallmentsConfigDto) => {
    setInstallmentsSaveLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    const target = customConfig || installmentsConfig;
    await saveSettings(undefined, undefined, undefined, undefined, undefined, undefined, undefined, target);
    setInstallmentsSaveLoading(false);
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
      {/* Encabezado Dinámico de Sección */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-brand-black tracking-tight">
          {activeTab === 'general'
            ? 'WhatsApp y Atención Comercial'
            : activeTab === 'security'
            ? 'Seguridad y Accesos Admin'
            : activeTab === 'flyers' || activeTab === 'banners'
            ? 'Carrusel de Banners Promocionales'
            : activeTab === 'categories'
            ? 'Categorías Destacadas'
            : activeTab === 'weekly_offer'
            ? 'Oferta de la Semana'
            : activeTab === 'trust_bar'
            ? 'Barra de Beneficios'
            : activeTab === 'payment_cards'
            ? 'Tarjetas Informativas y Medios de Pago'
            : activeTab === 'about'
            ? 'Sección Sobre Nosotros'
            : 'Hero Principal de Portada'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {activeTab === 'general'
            ? 'Configura el número oficial de atención al cliente por WhatsApp y el stock de seguridad.'
            : activeTab === 'security'
            ? 'Administra la contraseña y el correo de notificaciones del administrador.'
            : activeTab === 'flyers' || activeTab === 'banners'
            ? 'Administra los banners publicitarios y afiches promocionales rotativos de la portada.'
            : activeTab === 'categories'
            ? 'Personaliza las categorías principales con accesos rápidos e imágenes de portada.'
            : activeTab === 'weekly_offer'
            ? 'Configura la oferta destacada semanal con cuenta regresiva y banner promocional.'
            : activeTab === 'trust_bar'
            ? 'Administra los beneficios de confianza (envíos, garantía, cuotas) de la barra superior.'
            : activeTab === 'payment_cards'
            ? 'Personaliza las tarjetas de beneficios de pagos (bancos, transferencias, QR).'
            : activeTab === 'about'
            ? 'Edita la reseña histórica, valores y fotos de la sucursal del bloque Sobre Nosotros.'
            : 'Personaliza la foto principal del encabezado, titular H1, subtítulo, botones y etiquetas.'}
        </p>
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

      {/* TAB: Hero Banner Principal */}
      {(activeTab === 'landing' || activeTab === 'hero') && (
        <div className="space-y-10">
          {/* FOTO / BANNER PRINCIPAL DEL HERO */}
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
                {/* Image Upload File */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Imagen del Banner *
                  </label>
                  <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold transition-all shadow-xs cursor-pointer">
                    {uploadingHeroImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploadingHeroImage ? 'Subiendo foto a Cloudinary...' : 'Subir Foto de Banner (Archivo)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      disabled={uploadingHeroImage}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Las fotos se suben únicamente como archivo desde tu dispositivo (.webp, .jpg, .png).
                  </p>
                </div>

                {/* Galería / Carrusel Multi-Imagen del Hero Banner */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      Imágenes del Carrusel Hero (Multi-Imagen)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {(heroBanner.images || []).length} foto(s) configurada(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(heroBanner.images && heroBanner.images.length > 0
                      ? heroBanner.images
                      : [heroBanner.imageUrl || DEFAULT_HERO_BANNER.imageUrl]
                    ).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                          heroBanner.imageUrl === imgUrl
                            ? 'border-brand-red ring-2 ring-brand-red/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Hero foto ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() => setHeroBanner({ ...heroBanner, imageUrl: imgUrl })}
                            className="px-2 py-0.5 bg-white text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-100 shadow-xs cursor-pointer"
                          >
                            Principal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveHeroImage(idx)}
                            className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs cursor-pointer"
                            title="Eliminar del carrusel"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {heroBanner.imageUrl === imgUrl && (
                          <span className="absolute top-1 left-1 bg-brand-red text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Botón para subir nueva foto al Hero */}
                    <label className="border-2 border-dashed border-slate-200 hover:border-brand-red/60 rounded-2xl h-20 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all text-slate-400 hover:text-brand-red">
                      {uploadingHeroImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-red" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span className="text-[10px] font-bold">+ Agregar foto</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        disabled={uploadingHeroImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Título y Subtítulo */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Titular Principal (H1)
                    </label>
                    <input
                      type="text"
                      value={heroBanner.title || ''}
                      onChange={(e) => setHeroBanner({ ...heroBanner, title: e.target.value })}
                      placeholder="TODO PARA EQUIPAR TU HOGAR"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subtítulo / Bajada Editorial
                    </label>
                    <textarea
                      rows={2}
                      value={heroBanner.subtitle || ''}
                      onChange={(e) => setHeroBanner({ ...heroBanner, subtitle: e.target.value })}
                      placeholder="Electrodomésticos, climatización y confort para todos los días con la calidez y el respaldo de siempre."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Texto Botón Principal (Rojo)
                    </span>
                    <input
                      type="text"
                      value={heroBanner.primaryBtnText || ''}
                      onChange={(e) => setHeroBanner({ ...heroBanner, primaryBtnText: e.target.value })}
                      placeholder="Ver Catálogo"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-brand-red"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Texto Botón Secundario (Blanco)
                    </span>
                    <input
                      type="text"
                      value={heroBanner.secondaryBtnText || ''}
                      onChange={(e) => setHeroBanner({ ...heroBanner, secondaryBtnText: e.target.value })}
                      placeholder="Ver Ofertas"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                {/* Tendencias / Tags de Búsqueda Popular */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tendencias / Búsquedas Rápidas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={heroBanner.searchTags ? heroBanner.searchTags.join(', ') : ''}
                    onChange={(e) =>
                      setHeroBanner({
                        ...heroBanner,
                        searchTags: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Heladeras, Lavarropas, Smart TV, Colchones, Aires"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-brand-black placeholder-slate-400 outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cada palabra o frase generará un botón de búsqueda directa en la portada.
                  </p>
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
              </div>

              {/* Live Preview Box */}
              <div className="lg:col-span-5 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-brand-red" />
                  <span>Vista Previa del Banner</span>
                </span>

                <div className="relative overflow-hidden rounded-3xl shadow-lg border border-slate-200/80 bg-slate-100 aspect-[16/10] max-h-[380px] flex items-center justify-center">
                  {heroBanner.imageUrl ? (
                    <img
                      src={heroBanner.imageUrl}
                      alt={heroBanner.title || 'Banner Principal'}
                      className="w-full h-full object-cover"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Carrusel de Banners Promocionales (Flyers) */}
      {(activeTab === 'banners' || activeTab === 'flyers') && (
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
      )}

      {/* TAB: Categorías Principales */}
      {activeTab === 'categories' && (
        <AdminCategoriesConfig
          initialCards={categoryCards}
          onSaved={(newCards) => setCategoryCards(newCards)}
        />
      )}

      {/* TAB: Oferta de la Semana */}
      {activeTab === 'weekly_offer' && (
        <AdminWeeklyOfferConfig
          initialConfig={weeklyOffer}
          onSaved={(newOffer) => setWeeklyOffer(newOffer)}
        />
      )}

      {/* TAB: Barra de Beneficios */}
      {activeTab === 'trust_bar' && (
        <AdminTrustBarConfig
          initialItems={trustBarItems}
          onSaved={(newItems) => setTrustBarItems(newItems)}
        />
      )}

      {/* TAB: Sobre Nosotros */}
      {activeTab === 'about' && (
        <AdminAboutConfig
          initialConfig={aboutConfig}
          onSaved={(newAbout) => setAboutConfig(newAbout)}
        />
      )}

      {/* TAB: Tarjetas Informativas de Beneficios y Financiación */}
      {activeTab === 'payment_cards' && (
        <div className="space-y-8">
          {/* SECCIÓN 1: Configuración de Cuotas y Financiación para Productos */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-rose-50 border border-rose-100 text-brand-red flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-800">
                    Financiación y Cuotas en Productos
                  </h2>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Configura la cantidad de cuotas sin interés y promociones bancarias (como Banco Nación) que se calculan automáticamente sobre el <strong>precio de lista</strong> en todas las cards del catálogo y en la ficha de producto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveInstallmentsConfig()}
                disabled={installmentsSaveLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-bold hover:bg-brand-red-dark transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-center"
              >
                {installmentsSaveLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Guardar Financiación</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cuotas estándar al precio de lista */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Cuotas Sin Interés Estándar (Todas las tarjetas)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Cantidad habitual de cuotas sin interés calculadas sobre el precio de lista.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={installmentsConfig.defaultInstallments}
                    onChange={(e) =>
                      setInstallmentsConfig((prev) => ({
                        ...prev,
                        defaultInstallments: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-28 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 text-center outline-none focus:border-brand-red/40 transition-all"
                  />
                  <span className="text-xs font-bold text-slate-600">
                    cuotas sin interés con tarjetas bancarias
                  </span>
                </div>
              </div>

              {/* Promoción Bancaria Especial (ej. Banco Nación) */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                      Promoción Bancaria Destacada
                    </label>
                    <p className="text-[11px] text-indigo-700">
                      Convenio bancario especial (ej. 9 cuotas con Banco Nación).
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={installmentsConfig.bankPromoActive}
                      onChange={(e) =>
                        setInstallmentsConfig((prev) => ({
                          ...prev,
                          bankPromoActive: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {installmentsConfig.bankPromoActive && (
                  <div className="space-y-3 pt-2 border-t border-indigo-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-indigo-900 uppercase">
                          Banco o Tarjeta
                        </label>
                        <input
                          type="text"
                          value={installmentsConfig.bankPromoName}
                          onChange={(e) =>
                            setInstallmentsConfig((prev) => ({
                              ...prev,
                              bankPromoName: e.target.value,
                            }))
                          }
                          placeholder="ej. Banco Nación"
                          className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-indigo-900 uppercase">
                          Cantidad de Cuotas
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={installmentsConfig.bankPromoInstallments}
                          onChange={(e) =>
                            setInstallmentsConfig((prev) => ({
                              ...prev,
                              bankPromoInstallments: Math.max(1, parseInt(e.target.value) || 1),
                            }))
                          }
                          className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400 text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-indigo-900 uppercase">
                        Aclaración / Texto Promocional
                      </label>
                      <input
                        type="text"
                        value={installmentsConfig.bankPromoText || ''}
                        onChange={(e) =>
                          setInstallmentsConfig((prev) => ({
                            ...prev,
                            bankPromoText: e.target.value,
                          }))
                        }
                        placeholder="ej. Hasta 9 cuotas sin interés con Banco Nación"
                        className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulador en Vivo */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Simulador en tiempo real (Ejemplo: Producto con Precio de Lista de $100.000)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs space-y-0.5">
                  <span className="text-slate-400 text-[11px] block">Tarjetas estándar:</span>
                  <span className="font-bold text-slate-900">
                    {installmentsConfig.defaultInstallments} cuotas de{' '}
                    <strong className="text-brand-red font-black">
                      ${Math.round(100000 / installmentsConfig.defaultInstallments).toLocaleString('es-AR')}
                    </strong>
                  </span>
                </div>

                {installmentsConfig.bankPromoActive && installmentsConfig.bankPromoInstallments > 0 ? (
                  <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-0.5">
                    <span className="text-indigo-600 text-[11px] block font-semibold">
                      {installmentsConfig.bankPromoName}:
                    </span>
                    <span className="font-bold text-indigo-950">
                      {installmentsConfig.bankPromoInstallments} cuotas de{' '}
                      <strong className="text-indigo-600 font-black">
                        ${Math.round(100000 / installmentsConfig.bankPromoInstallments).toLocaleString('es-AR')}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs flex items-center text-slate-400 italic">
                    Sin promoción bancaria especial activa
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Tarjetas Informativas de Portada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
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

              {/* Galería / Carrusel Multi-Imagen del Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Imágenes del Banner (Carrusel Multi-Imagen) *
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {flyerImages.length} foto(s) agregada(s)
                  </span>
                </div>

                {flyerImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {flyerImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                          flyerImageUrl === imgUrl
                            ? 'border-brand-red ring-2 ring-brand-red/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Flyer foto ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          <button
                            type="button"
                            onClick={() => setFlyerImageUrl(imgUrl)}
                            className="px-2 py-0.5 bg-white text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-100 shadow-xs cursor-pointer"
                          >
                            Principal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFlyerImage(idx)}
                            className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs cursor-pointer"
                            title="Quitar foto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {flyerImageUrl === imgUrl && (
                          <span className="absolute top-1 left-1 bg-brand-red text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative border-2 border-dashed border-slate-200 hover:border-brand-red/40 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <Loader2 className="h-6 w-6 text-brand-red animate-spin" />
                      <span className="text-xs font-bold text-slate-600">Subiendo imagen a Cloudinary...</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="h-7 w-7 text-slate-400 group-hover:text-brand-red transition-colors" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-brand-red hover:underline block">
                          + Adjuntar foto a este carrusel (Subida instantánea a Cloudinary)
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Podés subir múltiples imágenes para que roten automáticamente en el carrusel de este banner
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
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
