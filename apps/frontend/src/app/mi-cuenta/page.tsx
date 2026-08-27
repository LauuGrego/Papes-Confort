'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, AlertCircle, CheckCircle2, User, MapPin } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import {
  CustomerDto,
  UpdateCustomerPayload,
  isValidCuilCuit,
  formatCuilCuit,
  PROVINCE_NAMES,
  getCitiesForProvince,
  isValidPostalCode,
  cleanPostalCode,
} from '@papes-confort/shared';
import { useAuthStore } from '../../stores/auth';

export default function MisDatosPage() {
  const { setCustomer } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cuilCuit, setCuilCuit] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('Entre Ríos');
  const [city, setCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityText, setCustomCityText] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetchApi<CustomerDto>('/api/customer/account');
        if (res.success && res.data) {
          const c = res.data;
          setName(c.name || '');
          setEmail(c.email || '');
          setPhone(c.phone || '');
          setCuilCuit(c.cuilCuit ? formatCuilCuit(c.cuilCuit) : '');
          setAddress(c.address || '');

          const prov = c.province || 'Entre Ríos';
          setProvince(prov);

          const availableCities = getCitiesForProvince(prov);
          const currentCity = c.city || '';

          if (currentCity && !availableCities.includes(currentCity)) {
            setIsCustomCity(true);
            setCustomCityText(currentCity);
            setCity('Otra localidad...');
          } else {
            setIsCustomCity(false);
            setCity(currentCity || availableCities[0] || '');
          }

          setPostalCode(c.postalCode || '');
          setMarketingOptIn(Boolean(c.marketingOptIn));
          setCustomer(c);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al cargar los datos del perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [setCustomer]);

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    const newCities = getCitiesForProvince(newProvince);
    if (newCities.length > 0) {
      setCity(newCities[0]);
      setIsCustomCity(false);
    } else {
      setCity('Otra localidad...');
      setIsCustomCity(true);
    }
  };

  const handleCitySelectChange = (val: string) => {
    setCity(val);
    if (val === 'Otra localidad...' || val === 'Otra...') {
      setIsCustomCity(true);
    } else {
      setIsCustomCity(false);
    }
  };

  const handleCuilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCuilCuit(raw);
    setCuilCuit(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('El nombre y apellido no pueden estar vacíos.');
      return;
    }

    if (cuilCuit.trim() && !isValidCuilCuit(cuilCuit)) {
      setErrorMessage('El CUIL/CUIT ingresado no es válido (verificar 11 dígitos y dígito verificador).');
      return;
    }

    if (postalCode.trim() && !isValidPostalCode(postalCode)) {
      setErrorMessage('El Código Postal debe contener exactamente 4 dígitos numéricos (ej: 3170).');
      return;
    }

    const finalCity = isCustomCity ? customCityText.trim() : city.trim();

    setSaving(true);

    try {
      const payload: UpdateCustomerPayload = {
        name: name.trim(),
        phone: phone.trim() || null,
        cuilCuit: cuilCuit.trim() || null,
        address: address.trim() || null,
        city: finalCity || null,
        province: province.trim() || null,
        postalCode: postalCode.trim() || null,
        marketingOptIn,
      };

      const res = await fetchApi<CustomerDto>('/api/customer/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setCustomer(res.data);
        setSuccessMessage('Tus datos fueron actualizados correctamente.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.error || 'No se pudieron actualizar los datos.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red mb-3" />
        <p className="text-xs text-slate-500 font-medium">Cargando tus datos...</p>
      </div>
    );
  }

  const isCuilValid = cuilCuit.trim() ? isValidCuilCuit(cuilCuit) : null;
  const currentCities = getCitiesForProvince(province);

  return (
    <div>
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-lg font-bold text-brand-black">Mis Datos Personales y de Facturación</h2>
        <p className="text-xs text-slate-500 mt-1">
          Mantené actualizados tus datos para agilizar tus envíos y la emisión de facturas.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección: Datos Personales */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            Datos Básicos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100/70 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                  No editable aquí
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3445 123456"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  CUIL / CUIT (Facturación)
                </label>
                {isCuilValid === true && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> AFIP Válido
                  </span>
                )}
              </div>
              <input
                type="text"
                value={cuilCuit}
                onChange={handleCuilChange}
                placeholder="XX-XXXXXXXX-X"
                maxLength={13}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-medium text-brand-black outline-none focus:bg-white focus:ring-4 transition-all ${
                  isCuilValid === false
                    ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-100'
                    : isCuilValid === true
                    ? 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-100'
                    : 'border-slate-200 bg-slate-50/50 focus:border-brand-red focus:ring-brand-red/10'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Sección: Dirección de Envío */}
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            Domicilio y Ubicación de Entrega
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dirección (Calle y Número, Depto)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: San Martín 1234, Piso 2 A"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all"
              />
            </div>

            {/* Selector de Provincia */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Provincia
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all cursor-pointer"
              >
                {PROVINCE_NAMES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Ciudad / Localidad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Localidad / Ciudad
              </label>
              <select
                value={isCustomCity ? 'Otra localidad...' : city}
                onChange={(e) => handleCitySelectChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all cursor-pointer"
              >
                {currentCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Input adicional si seleccionó otra localidad */}
              {isCustomCity && (
                <div className="mt-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={customCityText}
                    onChange={(e) => setCustomCityText(e.target.value)}
                    placeholder="Escribe el nombre de tu localidad"
                    className="w-full px-4 py-2 rounded-xl border border-brand-red/40 bg-white text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Código Postal
                </label>
                {postalCode.length === 4 && isValidPostalCode(postalCode) && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Válido
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={postalCode}
                onChange={(e) => setPostalCode(cleanPostalCode(e.target.value))}
                placeholder="Ej: 3170 (4 dígitos)"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-brand-black outline-none focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10 transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sección: Preferencias de Marketing */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-red focus:ring-brand-red/20 cursor-pointer accent-brand-red"
            />
            <span className="text-xs text-slate-600 leading-relaxed font-medium">
              Deseo recibir <strong>ofertas, promociones y nuevos ingresos</strong> por correo electrónico.
            </span>
          </label>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-full bg-brand-red text-xs font-bold text-white shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
