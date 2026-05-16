import { getDirectory } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { ensureProfileForUser, type AuthenticatedUser } from '@/server/services/profiles';

export type CircleSummary = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  memoryCount: number;
  href: string;
  locked: boolean;
  accent: 'cohort' | 'sandbox';
  profiles: Array<{
    name: string;
    image: string;
    role: string;
  }>;
};

export async function getCircleHub(user: AuthenticatedUser): Promise<CircleSummary[]> {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    const directory = getDirectory();

    return [
      {
        id: 'cohorte-65',
        name: 'Generation CH65',
        description: 'Your active circle for publishing and receiving professional memories.',
        memberCount: 1,
        memoryCount: 0,
        href: '/circles/cohorte-65',
        locked: false,
        accent: 'cohort',
        profiles: [{ name: user.name || 'LinkedIn Member', image: user.image || '', role: 'LinkedIn Member' }],
      },
      {
        id: 'sandbox',
        name: 'Product Sandbox',
        description: 'A demo-data circle reserved for product maintenance.',
        memberCount: directory.profiles.length,
        memoryCount: directory.feed.length,
        href: '#',
        locked: true,
        accent: 'sandbox',
        profiles: directory.profiles.slice(0, 4).map((profile) => ({
          name: profile.name,
          image: profile.profilePicture,
          role: profile.role,
        })),
      },
    ];
  }

  await ensureProfileForUser(user);

  const [linkedProfiles, sandboxProfiles, activeMemoryCount, sandboxMemoryCount] = await Promise.all([
    prisma.profile.findMany({
      where: { userId: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: { name: true, image: true, role: true },
    }),
    prisma.profile.findMany({
      where: { userId: null },
      orderBy: { name: 'asc' },
      take: 8,
      select: { id: true, name: true, image: true, role: true },
    }),
    prisma.memory.count(),
    prisma.memory.count({ where: { recipient: { userId: null } } }),
  ]);

  return [
    {
      id: 'cohorte-65',
      name: 'Generation CH65',
      description: 'The live generation circle: real people signed in with LinkedIn, memories, threads, and team recognition.',
      memberCount: linkedProfiles.length,
      memoryCount: activeMemoryCount,
      href: '/circles/cohorte-65',
      locked: false,
      accent: 'cohort',
      profiles: linkedProfiles,
    },
    {
      id: 'sandbox',
      name: 'Product Sandbox',
      description: 'Dummy product data for experiments. Visible as a concept and isolated from real users.',
      memberCount: sandboxProfiles.length,
      memoryCount: sandboxMemoryCount,
      href: '#',
      locked: true,
      accent: 'sandbox',
      profiles: sandboxProfiles,
    },
  ];
}

function isConfiguredDatabaseUrl(value?: string) {
  return Boolean(value && !value.includes('USER:PASSWORD') && !value.includes('replace-with'));
}
