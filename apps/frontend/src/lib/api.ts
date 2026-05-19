// Tiny fetch wrapper for talking to the backend Vercel project.
//
// Server-side calls (Server Components, Route Handlers, server actions) forward
// the incoming request's `cookie` header so the backend can identify the user.
// Browser-side calls rely on the cookie being SameSite=None;Secure so the
// browser attaches it automatically when `credentials: 'include'` is set.

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!BASE_URL) return path;
  if (path.startsWith('/')) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}

async function serverCookieHeader(): Promise<string | undefined> {
  if (typeof window !== 'undefined') return undefined;
  // Dynamic import so this file stays usable in client components — Next will
  // tree-shake the server branch out for client bundles.
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const all = store.getAll();
  if (all.length === 0) return undefined;
  return all.map((c) => `${c.name}=${c.value}`).join('; ');
}

export interface ApiFetchOptions extends RequestInit {
  /** Body to JSON-encode. If set, also sets Content-Type: application/json. */
  json?: unknown;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { json, headers, body, ...rest } = options;

  const finalHeaders = new Headers(headers);
  let finalBody = body;
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(json);
  }

  const serverCookies = await serverCookieHeader();
  if (serverCookies && !finalHeaders.has('cookie')) {
    finalHeaders.set('cookie', serverCookies);
  }

  return fetch(resolveUrl(path), {
    ...rest,
    body: finalBody,
    headers: finalHeaders,
    credentials: 'include',
  });
}

export async function apiJson<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    let detail: string;
    try {
      detail = await res.text();
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body || '(no body)'}`);
    this.name = 'ApiError';
  }
}
