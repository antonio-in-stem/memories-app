export function shouldUseRequestHostForAuthUrl(authUrl: string | undefined, nodeEnv: string | undefined): boolean {
  if (!authUrl || nodeEnv === 'production') {
    return false;
  }

  try {
    const url = new URL(authUrl);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function useRequestHostWhenAuthUrlIsLocal() {
  if (!shouldUseRequestHostForAuthUrl(process.env.AUTH_URL, process.env.NODE_ENV)) {
    return;
  }

  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
  process.env.AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST || 'true';
}
