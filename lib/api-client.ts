/**
 * API Client for GrowBro CRM
 * Handles routing between Next.js API routes (dev) and backend API (production/Android)
 */

// Check if running in Capacitor (Android/iOS)
const isCapacitor = typeof window !== 'undefined' && 
  (window as any).Capacitor !== undefined;

// Check if we're in production build
const isProduction = process.env.NODE_ENV === 'production';

// Get backend API URL from environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

/**
 * Determines the base URL for API calls
 * - In Capacitor (Android/iOS): Always use backend URL
 * - In production web: Use backend URL if configured, otherwise relative paths
 * - In development: Use relative paths (Next.js API routes)
 */
function getApiBaseUrl(): string {
  if (isCapacitor) {
    // Always use backend URL in mobile apps
    if (!BACKEND_API_URL) {
      console.warn('⚠️ NEXT_PUBLIC_BACKEND_API_URL not configured for mobile app');
      return '';
    }
    return BACKEND_API_URL;
  }

  // In production web build, use backend URL if available
  if (isProduction && BACKEND_API_URL) {
    return BACKEND_API_URL;
  }

  // In development, use relative paths (Next.js API routes)
  return '';
}

/**
 * Makes an API call with automatic URL routing
 */
export async function apiCall(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

  console.log(`[API Client] Calling: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': options?.headers?.['Content-Type'] || 'application/json',
      },
    });

    return response;
  } catch (error) {
    console.error(`[API Client] Error calling ${url}:`, error);
    throw error;
  }
}

/**
 * Helper for GET requests
 */
export async function apiGet(endpoint: string): Promise<Response> {
  return apiCall(endpoint, { method: 'GET' });
}

/**
 * Helper for POST requests
 */
export async function apiPost(
  endpoint: string,
  body?: any
): Promise<Response> {
  return apiCall(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests
 */
export async function apiPut(
  endpoint: string,
  body?: any
): Promise<Response> {
  return apiCall(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(endpoint: string): Promise<Response> {
  return apiCall(endpoint, { method: 'DELETE' });
}

/**
 * Helper for FormData uploads (e.g., file uploads)
 */
export async function apiUpload(
  endpoint: string,
  formData: FormData
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

  return fetch(url, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary
  });
}

/**
 * Platform detection utilities
 */
export const Platform = {
  isCapacitor,
  isAndroid: isCapacitor && (window as any).Capacitor?.getPlatform?.() === 'android',
  isIOS: isCapacitor && (window as any).Capacitor?.getPlatform?.() === 'ios',
  isWeb: !isCapacitor,
  isDevelopment: !isProduction,
  isProduction,
};

/**
 * Get the current API mode for debugging
 */
export function getApiMode(): string {
  if (Platform.isCapacitor) {
    return `Capacitor (${(window as any).Capacitor?.getPlatform?.()}) -> ${BACKEND_API_URL || 'NO BACKEND URL'}`;
  }
  if (Platform.isProduction) {
    return `Production Web -> ${BACKEND_API_URL || 'Relative Paths'}`;
  }
  return 'Development -> Next.js API Routes';
}

// Log API mode on initialization
if (typeof window !== 'undefined') {
  console.log(`[API Client] Mode: ${getApiMode()}`);
}
