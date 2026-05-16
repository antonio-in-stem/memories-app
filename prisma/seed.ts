import { readFileSync } from 'node:fs';
import { normalizeDirectory, type Comment, type Directory, type RawDirectory } from '../lib/data';
import { prisma } from '../lib/prisma';

async function main() {
  const rawDirectory = JSON.parse(readFileSync('data/profiles.json', 'utf8')) as RawDirectory;
  const directory = normalizeDirectory(rawDirectory);

  if (directory.errors.length > 0) {
    throw new Error(`Cannot seed invalid directory data: ${directory.errors.join(' ')}`);
  }

  await resetRecognitionData();
  await seedProfiles(directory);
  await seedMemories(directory);
}

async function resetRecognitionData() {
  await prisma.commentLike.deleteMany();
  await prisma.memoryLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.memoryCoAuthor.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.profile.deleteMany();
}

async function seedProfiles(directory: Directory) {
  await prisma.profile.createMany({
    data: directory.profiles.map((profile) => ({
      id: profile.username,
      username: profile.username,
      name: profile.name,
      image: profile.profilePicture,
      role: profile.role,
    })),
    skipDuplicates: true,
  });
}

async function seedMemories(directory: Directory) {
  for (const [memoryIndex, memory] of directory.feed.entries()) {
    await prisma.memory.create({
      data: {
        id: memory.id,
        authorId: memory.author.username,
        recipientId: memory.recipient.username,
        shoutout: memory.shoutout,
        body: memory.body,
        image: memory.image,
        heartCount: memory.heartCount,
        createdAt: toDate(memory.createdAt, memoryIndex),
        order: memory.order,
        coAuthors: {
          create: memory.coAuthors.slice(0, 3).map((profile, order) => ({
            profileId: profile.username,
            order,
          })),
        },
        galleryImages: {
          create: memory.galleryImages.map((url, order) => ({
            url,
            order,
          })),
        },
        likedBy: {
          create: uniqueProfiles(memory.likedBy).map((profile) => ({
            profileId: profile.username,
          })),
        },
      },
    });

    await seedComments(memory.id, memory.comments);
  }
}

async function seedComments(memoryId: string, comments: Comment[], parentId: string | null = null) {
  for (const [order, comment] of comments.entries()) {
    await prisma.comment.create({
      data: {
        id: comment.id,
        memoryId,
        profileId: comment.profile.username,
        parentId,
        body: comment.body,
        favCount: comment.favCount,
        createdAt: toDate(comment.createdAt, order),
        order,
        likedBy: {
          create: uniqueProfiles(comment.likedBy).map((profile) => ({
            profileId: profile.username,
          })),
        },
      },
    });

    await seedComments(memoryId, comment.replies, comment.id);
  }
}

function uniqueProfiles<T extends { username: string }>(profiles: T[]): T[] {
  const seen = new Set<string>();
  return profiles.filter((profile) => {
    if (seen.has(profile.username)) {
      return false;
    }

    seen.add(profile.username);
    return true;
  });
}

function toDate(value: string, fallbackOffset: number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(Date.now() - fallbackOffset * 60_000) : date;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
