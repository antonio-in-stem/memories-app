export const BODY_LIMIT = 1000;

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

      const comments = normalizeComments(memory?.comments, byUsername, location, memoryErrors);
      errors.push(...memoryErrors);

      if (memoryErrors.length > 0) {
        return;
      }

      feed.push({
        id: cleanText(memory?.id) || `${recipient.username}-${memoryIndex}`,
        author,
        recipient,
        shoutout: cleanText(memory?.shoutout) || createShoutout(body),
        body,
        image: cleanText(memory?.image),
        heartCount: normalizeCount(memory?.heartCount),
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
        ...(Array.isArray(memory?.comments) ? memory.comments.map((comment) => comment?.body) : []),
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
      memory.recipient.name,
      memory.recipient.username,
      memory.recipient.role,
      ...memory.comments.flatMap((comment) => [comment.body, comment.profile.name, comment.profile.username]),
    ].join(' '),
  );

  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function summarizeDirectory(directory) {
  const heartCount = directory.feed.reduce((total, memory) => total + memory.heartCount, 0);
  const commentCount = directory.feed.reduce((total, memory) => total + memory.comments.length, 0);
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

function normalizeComments(rawComments, byUsername, location, memoryErrors) {
  if (!Array.isArray(rawComments)) {
    return [];
  }

  const comments = [];

  rawComments.forEach((comment, commentIndex) => {
    const profileUsername = normalizeUsername(comment?.profile);
    const profile = byUsername.get(profileUsername);
    const body = cleanText(comment?.body);

    if (!profile) {
      memoryErrors.push(
        `${location}.comments[${commentIndex}]: Unknown comment profile "${profileUsername || '(empty)'}".`,
      );
    }

    if (!body) {
      memoryErrors.push(`${location}.comments[${commentIndex}]: Comment body is required.`);
    }

    if (profile && body) {
      comments.push({ profile, body, createdAt: cleanText(comment?.createdAt) });
    }
  });

  return comments;
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
