import type { Comment, Directory, Memory, Profile } from '@/lib/data';

export type DatabaseProfileRecord = {
  id: string;
  username: string;
  name: string;
  image: string;
  role: string;
};

export type DatabaseCommentRecord = {
  id: string;
  profileId: string;
  parentId: string | null;
  body: string;
  favCount: number;
  createdAt: Date;
  order: number;
  profile: DatabaseProfileRecord;
  likedBy: Array<{ profile: DatabaseProfileRecord }>;
};

export type DatabaseMemoryRecord = {
  id: string;
  authorId: string;
  recipientId: string;
  shoutout: string;
  body: string;
  image: string;
  heartCount: number;
  createdAt: Date;
  order: number;
  author: DatabaseProfileRecord;
  recipient: DatabaseProfileRecord;
  coAuthors: Array<{ order: number; profile: DatabaseProfileRecord }>;
  galleryImages: Array<{ url: string; order: number }>;
  likedBy: Array<{ profile: DatabaseProfileRecord }>;
  comments: DatabaseCommentRecord[];
};

export type DirectoryRecordSet = {
  generation: string;
  profiles: DatabaseProfileRecord[];
  memories: DatabaseMemoryRecord[];
};

export function recordsToDirectory(records: DirectoryRecordSet): Directory {
  const profiles = records.profiles.map(toProfile);
  const profilesById = new Map(records.profiles.map((profile, index) => [profile.id, profiles[index]]));
  const feed = records.memories.map((memory, index) => toMemory(memory, profilesById, index));

  profiles.forEach((profile) => {
    profile.memoryCount = feed.filter((memory) => memory.recipient.username === profile.username).length;
  });

  feed.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.order - left.order);

  return {
    generation: records.generation,
    profiles,
    feed,
    errors: [],
  };
}

function toMemory(record: DatabaseMemoryRecord, profilesById: Map<string, Profile>, fallbackOrder: number): Memory {
  return {
    id: record.id,
    author: resolveProfile(record.authorId, record.author, profilesById),
    coAuthors: record.coAuthors
      .slice()
      .sort((left, right) => left.order - right.order)
      .slice(0, 3)
      .map((coAuthor) => resolveProfile(coAuthor.profile.id, coAuthor.profile, profilesById)),
    recipient: resolveProfile(record.recipientId, record.recipient, profilesById),
    shoutout: record.shoutout,
    body: record.body,
    image: record.image,
    galleryImages: record.galleryImages
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((image) => image.url),
    heartCount: record.heartCount,
    likedBy: record.likedBy.map((like) => resolveProfile(like.profile.id, like.profile, profilesById)),
    comments: buildCommentTree(record.comments, profilesById),
    createdAt: record.createdAt.toISOString(),
    order: record.order ?? fallbackOrder,
  };
}

function buildCommentTree(records: DatabaseCommentRecord[], profilesById: Map<string, Profile>): Comment[] {
  const commentsById = new Map<string, Comment>();
  const roots: Comment[] = [];

  records
    .slice()
    .sort((left, right) => left.order - right.order || left.createdAt.getTime() - right.createdAt.getTime())
    .forEach((record) => {
      commentsById.set(record.id, {
        id: record.id,
        profile: resolveProfile(record.profileId, record.profile, profilesById),
        body: record.body,
        createdAt: record.createdAt.toISOString(),
        favCount: record.favCount,
        likedBy: record.likedBy.map((like) => resolveProfile(like.profile.id, like.profile, profilesById)),
        replies: [],
      });
    });

  records.forEach((record) => {
    const comment = commentsById.get(record.id);
    if (!comment) {
      return;
    }

    if (record.parentId) {
      commentsById.get(record.parentId)?.replies.push(comment);
      return;
    }

    roots.push(comment);
  });

  return roots;
}

function resolveProfile(id: string, fallback: DatabaseProfileRecord, profilesById: Map<string, Profile>): Profile {
  return profilesById.get(id) || toProfile(fallback);
}

function toProfile(record: DatabaseProfileRecord): Profile {
  return {
    username: record.username,
    name: record.name,
    profilePicture: record.image,
    role: record.role,
    memories: [],
    memoryCount: 0,
  };
}
