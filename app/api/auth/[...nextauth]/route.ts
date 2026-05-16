import { NextRequest } from 'next/server';
import { handlers } from '@/auth';
import { getForwardedOrigin } from '@/lib/request-origin';

export function GET(request: NextRequest) {
  return handlers.GET(withForwardedOrigin(request));
}

export function POST(request: NextRequest) {
  return handlers.POST(withForwardedOrigin(request));
}

function withForwardedOrigin(request: NextRequest): NextRequest {
  const origin = getForwardedOrigin(request.headers, request.url);
  const url = new URL(request.url);
  const publicUrl = new URL(`${url.pathname}${url.search}`, origin);

  return new NextRequest(publicUrl, request);
}
