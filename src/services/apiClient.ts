/**
 * Centralized API Client for EduPulse MERN School ERP
 * Sends credentials (HttpOnly cookies) with all requests and handles auth status codes.
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  code?: string;
  status: number;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onUnauthorizedCallback: (() => void) | null = null;
let onForbiddenCallback: ((errorInfo: { url: string; error: string }) => void) | null = null;

export function registerAuthErrorHandlers(
  onUnauthorized: () => void,
  onForbidden: (errorInfo: { url: string; error: string }) => void
) {
  onUnauthorizedCallback = onUnauthorized;
  onForbiddenCallback = onForbidden;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiPath = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  let url = apiPath;
  if (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || window.location.origin === 'null' || !window.location.origin)
  ) {
    url = `http://127.0.0.1:3000${apiPath}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Optional Bearer token from localStorage for hybrid client-server support
  const storedToken = localStorage.getItem('edupulse_jwt_token');
  if (storedToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly cookies are attached
  };

  try {
    const res = await fetch(url, fetchOptions);
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${res.status}`;
      const errorCode = data?.code;

      if (res.status === 401) {
        if (onUnauthorizedCallback && !url.includes('/auth/login') && !url.includes('/auth/me')) {
          onUnauthorizedCallback();
        }
      }

      if (res.status === 403) {
        if (onForbiddenCallback) {
          onForbiddenCallback({ url, error: errorMessage });
        }
      }

      throw new ApiError(errorMessage, res.status, errorCode, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network request failed', 0, 'NETWORK_ERROR');
  }
}

export const api = {
  get: <T = any>(url: string, headers?: Record<string, string>) =>
    apiRequest<T>(url, { method: 'GET', headers }),

  post: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),

  put: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),

  patch: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T = any>(url: string, headers?: Record<string, string>) =>
    apiRequest<T>(url, { method: 'DELETE', headers }),
};
