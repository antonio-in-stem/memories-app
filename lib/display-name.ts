const FALLBACK_NAME = 'LinkedIn Member';

export function formatPlatformName(value?: string | null): string {
  const parts = cleanName(value).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return FALLBACK_NAME;
  }

  const firstName = toTitleCase(parts[0]);
  const surnameInitial = parts.find((part, index) => index > 0 && /[\p{L}\p{N}]/u.test(part))?.[0];

  return surnameInitial ? `${firstName} ${surnameInitial.toUpperCase()}.` : firstName;
}

function cleanName(value?: string | null): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function toTitleCase(value: string): string {
  const lower = value.toLocaleLowerCase('es-MX');
  return lower.charAt(0).toLocaleUpperCase('es-MX') + lower.slice(1);
}
