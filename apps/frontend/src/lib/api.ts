import { ApiResponse } from '@papes-confort/shared';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Flag para habilitar/deshabilitar el flujo de compra online, checkout, pasarela Mobbex y seguimiento de pedidos.
 * Mientras se aguardan las credenciales productivas de Mobbex, se mantiene en `false` para operar
 * exclusivamente con armado de carrito y envío del pedido por WhatsApp.
 */
export const ONLINE_PURCHASES_ENABLED =
  process.env.NEXT_PUBLIC_ONLINE_PURCHASES_ENABLED === 'true';

const CART_SESSION_COOKIE_NAME = 'papes_cart_sid';
let memoryCartSessionId: string | null = null;

function generateSessionUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrInitCartSessionId(): string | null {
  if (typeof document === 'undefined') {
    return memoryCartSessionId;
  }

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CART_SESSION_COOKIE_NAME}=`));

  if (match) {
    const val = decodeURIComponent(match.split('=')[1] || '').trim();
    if (val) {
      memoryCartSessionId = val;
      return val;
    }
  }

  const newId = memoryCartSessionId || generateSessionUuid();
  setCartSessionId(newId);
  return newId;
}

function setCartSessionId(sessionId: string): void {
  if (!sessionId) return;
  memoryCartSessionId = sessionId;
  if (typeof document !== 'undefined') {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${CART_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.data?.token) {
        const newToken = data.data.token;
        const user = data.data.user;
        const customer = data.data.customer || useAuthStore.getState().customer;
        useAuthStore.getState().setAuth(user, newToken, customer);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let token = useAuthStore.getState().accessToken;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cartSessionId = getOrInitCartSessionId();
  if (cartSessionId && !headers.has('X-Cart-Session')) {
    headers.set('X-Cart-Session', cartSessionId);
  }

  const config: RequestInit = {
    ...(cleanEndpoint.startsWith('/api/cart') ? { cache: 'no-store' as RequestCache } : {}),
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    let response = await fetch(url, config);
    let data = await response.json();

    const responseCartSession = response.headers.get('X-Cart-Session');
    if (responseCartSession) {
      setCartSessionId(responseCartSession);
    } else if (
      cleanEndpoint.startsWith('/api/cart') &&
      data?.success &&
      typeof data?.data?.sessionId === 'string'
    ) {
      setCartSessionId(data.data.sessionId);
    }

    if (!response.ok) {
      const isAuthEndpoint =
        cleanEndpoint === '/api/auth/login' ||
        cleanEndpoint === '/api/auth/refresh' ||
        cleanEndpoint === '/api/auth/logout';

      if (response.status === 401 && !isAuthEndpoint) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          config.headers = headers;
          response = await fetch(url, config);
          data = await response.json();
        } else {
          useAuthStore.getState().clearAuth();
        }
      } else if (response.status === 401 && isAuthEndpoint) {
        useAuthStore.getState().clearAuth();
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          message: data.message,
        };
      }
    }

    return data as ApiResponse<T>;
  } catch (error: any) {
    console.error(`API Fetch Error [${url}]:`, error);
    return {
      success: false,
      error: error.message || 'Network connection error',
    };
  }
}

