export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://skytech.onrender.com').replace(/\/$/, '');

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
