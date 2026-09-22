import { ApiResponse } from '@papes-confort/shared';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    let response = await fetch(url, config);
    let data = await response.json();

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

