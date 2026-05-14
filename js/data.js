export const BODY_LIMIT = 1000;
const DEMO_GALLERY_ASSETS = [
  '/assets/memories/team-handoff.webp',
  '/assets/memories/design-flow.webp',
  '/assets/memories/api-contract.webp',
  '/assets/memories/accessibility.webp',
  '/assets/memories/analytics.webp',
  '/assets/memories/integration.webp',
  '/assets/memories/qa-notes.webp',
  '/assets/memories/retro.webp',
];

export function normalizeDirectory(rawDirectory = {}) {
  const generation = cleanText(rawDirectory.generation) || 'Memories';
  const rawProfiles = Array.isArray(rawDirectory.profiles) ? rawDirectory.profiles : [];
  const errors = [];

  const profiles = rawProfiles.map((profile, index) => ({
    username: normalizeUsername(profile?.username) || `profile-${index + 1}`,
    name: cleanText(profile?.name) || `Profile ${index + 1}`,
    profilePicture: cleanText(profile?.profilePicture),
    role: cleanText(profile?.role) || 'Professional',
    memories: Array.isArray(profile?.memories) ? profile.memories : [],
    memoryCount: 0,
  }));

  const byUsername = new Map();
  profiles.forEach((profile) => {
    if (byUsername.has(profile.username)) {
      errors.push(`Duplicate profile username "${profile.username}".`);
      return;
    }

    byUsername.set(profile.username, profile);
  });

  const feed = [];
  profiles.forEach((recipient) => {
    recipient.memories.forEach((memory, memoryIndex) => {
      const location = `${recipient.username}.memories[${memoryIndex}]`;
      const memoryErrors = [];
      const body = cleanText(memory?.body);

      if (!body) {
        memoryErrors.push(`${location}: Memory body is required.`);
      }

      if (body.length > BODY_LIMIT) {
        memoryErrors.push(`${location}: Memory body cannot exceed ${BODY_LIMIT} characters.`);
      }

      const authorUsername = normalizeUsername(
        memory?.author || memory?.profile || memory?.fromProfile,
      );
      const author = byUsername.get(authorUsername);

      if (!author) {
        memoryErrors.push(`${location}: Unknown author profile "${authorUsername || '(empty)'}".`);
      }

      const baseMemoryId = cleanText(memory?.id) || `${recipient.username}-${memoryIndex}`;
      const comments = normalizeComments(memory?.comments, byUsername, location, memoryErrors, `${baseMemoryId}-comment`);
      const likedBy = normalizeProfileList(memory?.likedBy, byUsername, `${location}.likedBy`, memoryErrors);
      const coAuthors = normalizeCoAuthors(memory, byUsername, `${location}.coAuthors`, memoryErrors, authorUsername);
      errors.push(...memoryErrors);

      if (memoryErrors.length > 0) {
        return;
      }

      feed.push({
        id: baseMemoryId,
        author,
        coAuthors,
        recipient,
        shoutout: cleanText(memory?.shoutout) || createShoutout(body),
        body,
        image: cleanText(memory?.image),
        galleryImages: normalizeGalleryImages(memory, memoryIndex),
        heartCount: normalizeCount(memory?.heartCount),
        likedBy: likedBy.length > 0 ? likedBy : deriveLikeProfiles(profiles, recipient.username, author.username, memoryIndex),
        comments,
        createdAt: cleanText(memory?.createdAt),
        order: feed.length,
      });
    });
  });

  feed.sort((left, right) => {
    const dateDelta = toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
    return dateDelta || right.order - left.order;
  });

  profiles.forEach((profile) => {
    profile.memoryCount = feed.filter((memory) => memory.recipient.username === profile.username).length;
  });

  return { generation, profiles, byUsername, feed, errors };
}

export function filterProfiles(directory, query) {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return directory.profiles;
  }

  return directory.profiles.filter((profile) => {
    const memoryText = profile.memories
      .flatMap((memory) => [
        memory?.body,
        ...(Array.isArray(memory?.comments) ? flattenRawComments(memory.comments).map((comment) => comment?.body) : []),
      ])
      .join(' ');
    const haystack = normalizeSearch(
      `${profile.name} ${profile.username} ${profile.role} ${memoryText}`,
    );

    return normalizedQuery
      .split(' ')
      .filter(Boolean)
      .every((term) => haystack.includes(term));
  });
}

export function memoryMatches(memory, query) {
  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return true;
  }

  const haystack = normalizeSearch(
    [
      memory.body,
      memory.author.name,
      memory.author.username,
      memory.author.role,
      ...memory.coAuthors.flatMap((profile) => [profile.name, profile.username, profile.role]),
      memory.recipient.name,
      memory.recipient.username,
      memory.recipient.role,
      ...flattenComments(memory.comments).flatMap((comment) => [comment.body, comment.profile.name, comment.profile.username]),
    ].join(' '),
  );

  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function normalizeCoAuthors(memory, byUsername, location, memoryErrors, authorUsername) {
  const rawAuthors = Array.isArray(memory?.authors) ? memory.authors : [];
  const rawCoAuthors = Array.isArray(memory?.coAuthors) ? memory.coAuthors : [];
  const candidates = [...rawAuthors, ...rawCoAuthors].filter((username) => normalizeUsername(username) !== authorUsername);

  return normalizeProfileList(candidates, byUsername, location, memoryErrors).slice(0, 3);
}

function normalizeGalleryImages(memory, seed) {
  if (Array.isArray(memory?.galleryImages)) {
    const explicitImages = memory.galleryImages
      .map((image) => cleanText(image))
      .filter(Boolean);

    if (explicitImages.length > 0) {
      return [...new Set(explicitImages)].slice(0, 8);
    }
  }

  return deriveGalleryImages(cleanText(memory?.image), seed);
}

function deriveGalleryImages(primaryImage, seed) {
  const pool = DEMO_GALLERY_ASSETS.filter((image) => image !== primaryImage && image.replace(/^\//, '') !== primaryImage);
  const offset = pool.length > 0 ? seed % pool.length : 0;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

  return rotated.slice(0, 4);
}

export function summarizeDirectory(directory) {
  const heartCount = directory.feed.reduce((total, memory) => total + memory.heartCount, 0);
  const commentCount = directory.feed.reduce((total, memory) => total + countComments(memory.comments), 0);
  const topProfiles = [...directory.profiles]
    .sort((left, right) => {
      const memoryDelta = right.memoryCount - left.memoryCount;
      return memoryDelta || left.name.localeCompare(right.name);
    })
    .slice(0, 4);

  return {
    profileCount: directory.profiles.length,
    memoryCount: directory.feed.length,
    heartCount,
    commentCount,
    topProfiles,
  };
}

export function getInitials(name) {
  return cleanText(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function normalizeComments(rawComments, byUsername, location, memoryErrors, parentId = 'comment') {
  if (!Array.isArray(rawComments)) {
    return [];
  }

  const comments = [];

  rawComments.forEach((comment, commentIndex) => {
    const commentId = cleanText(comment?.id) || `${parentId}-${commentIndex + 1}`;
    const profileUsername = normalizeUsername(comment?.profile);
    const profile = byUsername.get(profileUsername);
    const body = cleanText(comment?.body);
    const likedBy = normalizeProfileList(
      comment?.likedBy,
      byUsername,
      `${location}.comments[${commentIndex}].likedBy`,
      memoryErrors,
    );
    const replies = normalizeComments(
      comment?.replies,
      byUsername,
      `${location}.comments[${commentIndex}]`,
      memoryErrors,
      commentId,
    );

    if (!profile) {
      memoryErrors.push(
        `${location}.comments[${commentIndex}]: Unknown comment profile "${profileUsername || '(empty)'}".`,
      );
    }

    if (!body) {
      memoryErrors.push(`${location}.comments[${commentIndex}]: Comment body is required.`);
    }

    if (profile && body) {
      comments.push({
        id: commentId,
        profile,
        body,
        createdAt: cleanText(comment?.createdAt),
        favCount: Math.max(normalizeCount(comment?.favCount), likedBy.length),
        likedBy,
        replies,
      });
    }
  });

  return comments;
}

export function flattenComments(comments) {
  return comments.flatMap((comment) => [comment, ...flattenComments(comment.replies)]);
}

export function countComments(comments) {
  return flattenComments(comments).length;
}

export function sortComments(comments, mode) {
  return [...comments].sort((left, right) => {
    if (mode === 'recent') {
      return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
    }

    const relevanceDelta = commentScore(right) - commentScore(left);
    return relevanceDelta || toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
  });
}

function commentScore(comment) {
  return comment.favCount + comment.likedBy.length + comment.replies.length * 3;
}

function flattenRawComments(comments) {
  return comments.flatMap((comment) => [
    comment,
    ...(Array.isArray(comment?.replies) ? flattenRawComments(comment.replies) : []),
  ]);
}

function normalizeProfileList(usernames, byUsername, location, memoryErrors) {
  if (!Array.isArray(usernames)) {
    return [];
  }

  const profiles = [];
  const seen = new Set();

  usernames.forEach((username, index) => {
    const normalized = normalizeUsername(username);
    const profile = byUsername.get(normalized);

    if (!profile) {
      memoryErrors.push(`${location}[${index}]: Unknown profile "${normalized || '(empty)'}".`);
      return;
    }

    if (!seen.has(profile.username)) {
      seen.add(profile.username);
      profiles.push(profile);
    }
  });

  return profiles;
}

function deriveLikeProfiles(profiles, recipientUsername, authorUsername, seed) {
  return profiles
    .filter((profile) => profile.username !== recipientUsername && profile.username !== authorUsername)
    .slice(seed % 3, seed % 3 + 8);
}

function createShoutout(body) {
  const firstSentence = body.match(/[^.!?]+[.!?]/)?.[0]?.trim();

  if (firstSentence && firstSentence.length <= 180) {
    return firstSentence;
  }

  return body.length > 180 ? `${body.slice(0, 177).trim()}...` : body;
}

function normalizeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
}

function normalizeUsername(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSearch(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toTimestamp(value) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
