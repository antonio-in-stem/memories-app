import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureProfileForUser } from '@/server/services/profiles';

export async function favoriteMemory(memoryId: string) {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    return { status: 503 as const, body: { error: 'Database is not configured.' } };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return { status: 401 as const, body: { error: 'Authentication required.' } };
  }

  const profile = await ensureProfileForUser(session.user);
  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    select: { id: true, heartCount: true },
  });

  if (!memory) {
    return { status: 404 as const, body: { error: 'Memory not found.' } };
  }

  await prisma.memoryLike.upsert({
    where: {
      memoryId_profileId: {
        memoryId,
        profileId: profile.id,
      },
    },
    update: {},
    create: {
      memoryId,
      profileId: profile.id,
    },
  });

  const likedByCount = await prisma.memoryLike.count({ where: { memoryId } });

  return { status: 200 as const, body: { heartCount: memory.heartCount + likedByCount } };
}

export async function favoriteComment(commentId: string) {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    return { status: 503 as const, body: { error: 'Database is not configured.' } };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return { status: 401 as const, body: { error: 'Authentication required.' } };
  }

  const profile = await ensureProfileForUser(session.user);
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, favCount: true },
  });

  if (!comment) {
    return { status: 404 as const, body: { error: 'Comment not found.' } };
  }

  await prisma.commentLike.upsert({
    where: {
      commentId_profileId: {
        commentId,
        profileId: profile.id,
      },
    },
    update: {},
    create: {
      commentId,
      profileId: profile.id,
    },
  });

  const likedByCount = await prisma.commentLike.count({ where: { commentId } });

  return { status: 200 as const, body: { favCount: comment.favCount + likedByCount } };
}

function isConfiguredDatabaseUrl(value?: string) {
  return Boolean(value && !value.includes('USER:PASSWORD') && !value.includes('replace-with'));
}
