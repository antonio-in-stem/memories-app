import { prisma } from '@/lib/prisma';
import { formatPlatformName } from '@/lib/display-name';

export type AuthenticatedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function ensureProfileForUser(user: AuthenticatedUser) {
  const existingLinkedProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  const displayName = formatPlatformName(cleanDisplayName(user.name) || cleanDisplayName(user.email?.split('@')[0]));

  if (existingLinkedProfile) {
    return prisma.profile.update({
      where: { id: existingLinkedProfile.id },
      data: {
        name: displayName,
        image: user.image || existingLinkedProfile.image,
      },
    });
  }

  const candidateUsername = normalizeUsername(user.email?.split('@')[0] || displayName);
  const existingTeamProfile = await prisma.profile.findFirst({
    where: {
      OR: [
        { username: candidateUsername },
        { name: { equals: displayName, mode: 'insensitive' } },
      ],
      userId: null,
    },
  });

  if (existingTeamProfile) {
    return prisma.profile.update({
      where: { id: existingTeamProfile.id },
      data: {
        userId: user.id,
        image: user.image || existingTeamProfile.image,
      },
    });
  }

  try {
    return await prisma.profile.create({
      data: {
        userId: user.id,
        username: await createUniqueUsername(candidateUsername),
        name: displayName,
        image: user.image || '',
        role: 'LinkedIn Member',
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (profile) {
      return profile;
    }

    return prisma.profile.create({
      data: {
        userId: user.id,
        username: await createUniqueUsername(`${candidateUsername}-${Date.now().toString(36)}`),
        name: displayName,
        image: user.image || '',
        role: 'LinkedIn Member',
      },
    });
  }
}

async function createUniqueUsername(base: string) {
  const normalizedBase = base || 'linkedin-member';
  let candidate = normalizedBase;
  let suffix = 2;

  while (await prisma.profile.findUnique({ where: { username: candidate } })) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanDisplayName(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}
