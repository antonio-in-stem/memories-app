import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { auth } from '@/auth';
import { BODY_LIMIT } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { getDirectoryFromDatabase } from '@/server/repositories/memories';
import { ensureProfileForUser } from '@/server/services/profiles';

const memoryInputSchema = z.object({
  recipientUsername: z.string().trim().min(1),
  shoutout: z.string().trim().max(180).optional().default(''),
  body: z.string().trim().min(1).max(BODY_LIMIT),
  image: z.string().trim().max(500).optional().default(''),
});

const commentInputSchema = z.object({
  memoryId: z.string().trim().min(1),
  parentId: z.string().trim().min(1).optional().nullable(),
  body: z.string().trim().min(1).max(700),
});

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type MemoryInput = z.infer<typeof memoryInputSchema>;
export type CommentInput = z.infer<typeof commentInputSchema>;

export function parseMemoryInput(input: unknown): MutationResult<MemoryInput> {
  const parsed = memoryInputSchema.safeParse(input);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: 'Invalid memory payload.' };
}

export function parseCommentInput(input: unknown): MutationResult<CommentInput> {
  const parsed = commentInputSchema.safeParse(input);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: 'Invalid comment payload.' };
}

export async function createMemory(input: unknown) {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    return { status: 503 as const, body: { error: 'Database is not configured.' } };
  }

  const parsed = parseMemoryInput(input);
  if (!parsed.ok) {
    return { status: 400 as const, body: { error: parsed.error } };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { status: 401 as const, body: { error: 'Authentication required.' } };
  }

  const [author, recipient] = await Promise.all([
    ensureProfileForUser(session.user),
    prisma.profile.findUnique({ where: { username: parsed.data.recipientUsername } }),
  ]);

  if (!recipient) {
    return { status: 404 as const, body: { error: 'Recipient profile not found.' } };
  }

  await prisma.memory.create({
    data: {
      id: `memory-${randomUUID()}`,
      authorId: author.id,
      recipientId: recipient.id,
      shoutout: parsed.data.shoutout || createShoutout(parsed.data.body),
      body: parsed.data.body,
      image: parsed.data.image,
      heartCount: 0,
      createdAt: new Date(),
      galleryImages: parsed.data.image
        ? {
            create: [
              {
                url: parsed.data.image,
                order: 0,
              },
            ],
          }
        : undefined,
    },
  });

  return { status: 201 as const, body: await getDirectoryFromDatabase({ linkedOnly: true }) };
}

export async function createComment(input: unknown) {
  if (!isConfiguredDatabaseUrl(process.env.DATABASE_URL)) {
    return { status: 503 as const, body: { error: 'Database is not configured.' } };
  }

  const parsed = parseCommentInput(input);
  if (!parsed.ok) {
    return { status: 400 as const, body: { error: parsed.error } };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { status: 401 as const, body: { error: 'Authentication required.' } };
  }

  const [profile, memory] = await Promise.all([
    ensureProfileForUser(session.user),
    prisma.memory.findUnique({ where: { id: parsed.data.memoryId }, select: { id: true } }),
  ]);

  if (!memory) {
    return { status: 404 as const, body: { error: 'Memory not found.' } };
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: parsed.data.parentId,
        memoryId: parsed.data.memoryId,
      },
      select: { id: true },
    });

    if (!parent) {
      return { status: 404 as const, body: { error: 'Parent comment not found.' } };
    }
  }

  await prisma.comment.create({
    data: {
      id: `comment-${randomUUID()}`,
      memoryId: parsed.data.memoryId,
      parentId: parsed.data.parentId || null,
      profileId: profile.id,
      body: parsed.data.body,
      createdAt: new Date(),
    },
  });

  return { status: 201 as const, body: await getDirectoryFromDatabase({ linkedOnly: true }) };
}

function createShoutout(body: string): string {
  const firstSentence = body.match(/[^.!?]+[.!?]/)?.[0]?.trim();
  const candidate = firstSentence && firstSentence.length <= 180 ? firstSentence : body;
  return candidate.length > 180 ? `${candidate.slice(0, 177).trim()}...` : candidate;
}

function isConfiguredDatabaseUrl(value?: string) {
  return Boolean(value && !value.includes('USER:PASSWORD') && !value.includes('replace-with'));
}
