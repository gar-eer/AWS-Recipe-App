import { fetchAuthSession } from 'aws-amplify/auth';

// Use the current origin by default. In development Vite proxies /api to Express;
// in production Nginx proxies the same path, avoiding a broken localhost URL.
const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export async function api(path, options = {}, authenticated = false) {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (authenticated) {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    if (!token) throw new Error('Please sign in first');
    headers.set('Authorization', `Bearer ${token}`);
    const email = session.tokens?.idToken?.payload?.email;
    if (email) headers.set('X-User-Email', String(email));
  }
  let response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the API. Make sure the backend is running and /api is proxied to it.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
