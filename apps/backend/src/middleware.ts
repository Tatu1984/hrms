import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cross-origin support so the frontend (on a different Vercel deployment)
// can call this API with credentials (the session cookie).
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
    'Vary': 'Origin',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (allowedOrigins.length === 0 && origin) {
    // No FRONTEND_ORIGIN configured — echo the request origin (dev only).
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const response = NextResponse.next();
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
