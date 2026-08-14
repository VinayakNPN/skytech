const isLocal = typeof window !== 'undefined' 
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : process.env.NODE_ENV !== 'production';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || (isLocal ? 'http://localhost:5000' : 'https://skytech.onrender.com')
).replace(/\/$/, '');

export function getAuthHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const value = `; ${document.cookie}`;
  const parts = value.split(`; token=`);
  if (parts.length === 2) {
    const token = parts.pop()?.split(';').shift();
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Automatically injects the Authorization header into all fetch requests
 * aimed at the API_BASE_URL.
 */
export function setupFetchInterceptor() {
  if (typeof window !== 'undefined' && !(window as any)._fetchIntercepted) {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      const url = typeof resource === 'string' 
        ? resource 
        : (resource instanceof Request ? resource.url : '');
      
      if (url.startsWith(API_BASE_URL)) {
        const authHeaders = getAuthHeaders();
        if (authHeaders.Authorization) {
          config = config || {};
          config.headers = {
            ...config.headers,
            ...authHeaders
          };
        }
      }
      return originalFetch(resource, config);
    };
    (window as any)._fetchIntercepted = true;
  }
}
