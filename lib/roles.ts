import type { CSSProperties } from 'react';

export type RolePalette = {
  a: string;
  b: string;
  c: string;
  glow: string;
};

export function getRolePalette(role = ''): RolePalette {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole.includes('lead') || normalizedRole.includes('master')) {
    return { a: '#f8d44c', b: '#a855f7', c: '#12d6df', glow: 'rgba(168, 85, 247, 0.34)' };
  }

  if (normalizedRole.includes('frontend') || normalizedRole.includes('mobile') || normalizedRole.includes('full stack')) {
    return { a: '#42d9ff', b: '#7068ff', c: '#ff65b8', glow: 'rgba(66, 217, 255, 0.28)' };
  }

  if (normalizedRole.includes('backend') || normalizedRole.includes('platform') || normalizedRole.includes('devops')) {
    return { a: '#39f598', b: '#00d2ff', c: '#3569ff', glow: 'rgba(57, 245, 152, 0.26)' };
  }

  if (normalizedRole.includes('design') || normalizedRole.includes('research') || normalizedRole.includes('content')) {
    return { a: '#ff6b95', b: '#ffba42', c: '#b061ff', glow: 'rgba(255, 107, 149, 0.28)' };
  }

  if (normalizedRole.includes('qa') || normalizedRole.includes('security') || normalizedRole.includes('analyst')) {
    return { a: '#1ae2cb', b: '#a9e83f', c: '#ffd34d', glow: 'rgba(26, 226, 203, 0.28)' };
  }

  return { a: '#b061ff', b: '#ff4da6', c: '#ff8a2f', glow: 'rgba(255, 77, 166, 0.28)' };
}

export function roleStyle(role: string) {
  const palette = getRolePalette(role);
  return {
    '--role-a': palette.a,
    '--role-b': palette.b,
    '--role-c': palette.c,
    '--role-glow': palette.glow,
  } as CSSProperties;
}
