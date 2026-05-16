export function getForwardedOrigin(headers: Headers, fallbackUrl: string): string {
  const fallback = new URL(fallbackUrl);
  const host = headers.get('x-forwarded-host') || headers.get('host') || fallback.host;
  const proto = headers.get('x-forwarded-proto') || fallback.protocol.replace(':', '') || 'http';

  return `${proto}://${host}`;
}
