import { getDirectory, type Directory } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { recordsToDirectory } from '@/server/directory-presenter';

const GENERATION_NAME = 'Generation CH65';

export async function getExperienceDirectory(): Promise<Directory> {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    return getDirectory();
  }

  try {
    return await getDirectoryFromDatabase();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn('Falling back to JSON data because the database is unavailable.');
    return getDirectory();
  }
}

export async function getCohorte65Directory(): Promise<Directory> {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    return {
      ...getDirectory(),
      profiles: [],
      feed: [],
    };
  }

  try {
    return await getDirectoryFromDatabase({ linkedOnly: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn('Falling back to an empty Cohorte 65 directory because the database is unavailable.');
    return {
      generation: GENERATION_NAME,
      profiles: [],
      feed: [],
      errors: [],
    };
  }
}

function isConfiguredDatabaseUrl(value?: string) {
  return Boolean(value && !value.includes('USER:PASSWORD') && !value.includes('replace-with'));
}

export async function getDirectoryFromDatabase(options: { linkedOnly?: boolean } = {}): Promise<Directory> {
  const linkedProfileWhere = options.linkedOnly ? { userId: { not: null } } : undefined;
  const linkedMemoryWhere = options.linkedOnly
    ? {
        author: { userId: { not: null } },
        recipient: { userId: { not: null } },
      }
    : undefined;
  const linkedProfileRelationWhere = options.linkedOnly ? { profile: { userId: { not: null } } } : undefined;

  const [profiles, memories] = await Promise.all([
    prisma.profile.findMany({
      where: linkedProfileWhere,
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        role: true,
      },
    }),
    prisma.memory.findMany({
      where: linkedMemoryWhere,
      orderBy: [{ createdAt: 'desc' }, { order: 'desc' }],
      include: {
        author: true,
        recipient: true,
        coAuthors: {
          where: linkedProfileRelationWhere,
          orderBy: { order: 'asc' },
          include: { profile: true },
        },
        galleryImages: {
          orderBy: { order: 'asc' },
          select: { url: true, order: true },
        },
        likedBy: {
          where: linkedProfileRelationWhere,
          include: { profile: true },
        },
        comments: {
          where: options.linkedOnly ? { profile: { userId: { not: null } } } : undefined,
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            profile: true,
            likedBy: {
              where: linkedProfileRelationWhere,
              include: { profile: true },
            },
          },
        },
      },
    }),
  ]);

  return recordsToDirectory({
    generation: GENERATION_NAME,
    profiles,
    memories,
  });
}
