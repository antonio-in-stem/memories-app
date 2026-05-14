import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countComments,
  filterProfiles,
  flattenComments,
  normalizeDirectory,
  summarizeDirectory,
} from '../js/data.js';

const sampleDirectory = {
  generation: 'Generation CH65',
  profiles: [
    {
      username: 'antonio-m',
      name: 'Antonio M.',
      profilePicture: 'assets/avatars/antonio.png',
      role: 'Frontend Developer',
      memories: [],
    },
    {
      username: 'anaid',
      name: 'Anaid',
      profilePicture: 'assets/avatars/anaid.png',
      role: 'QA Engineer',
      memories: [
        {
          id: 'memory-1',
          author: 'antonio-m',
          coAuthors: ['julio-c'],
          body: 'Anaid kept the release grounded with calm, useful testing notes.',
          image: 'assets/memories/demo.webp',
          galleryImages: ['assets/memories/design-flow.webp', 'assets/memories/api-contract.webp'],
          heartCount: 30,
          comments: [
            {
              profile: 'antonio-m',
              body: 'A great teammate under pressure.',
              createdAt: '2026-05-10T12:00:00.000Z',
              favCount: 3,
              likedBy: ['anaid'],
              replies: [
                {
                  profile: 'anaid',
                  body: 'That pressure made the support even more valuable.',
                  createdAt: '2026-05-10T12:30:00.000Z',
                  favCount: 2,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      username: 'julio-c',
      name: 'Julio C.',
      profilePicture: 'assets/avatars/julio.png',
      role: 'Backend Developer',
      memories: [],
    },
    {
      username: 'daniela-s',
      name: 'Daniela S.',
      profilePicture: 'assets/avatars/antonio.png',
      role: 'Product Designer',
      memories: [],
    },
    {
      username: 'cleyri-v',
      name: 'Cleyri V.',
      profilePicture: 'assets/avatars/antonio.png',
      role: 'Data Analyst',
      memories: [],
    },
    {
      username: 'jose-l',
      name: 'Jose L.',
      profilePicture: 'assets/avatars/antonio.png',
      role: 'Cloud Engineer',
      memories: [],
    },
  ],
};

test('normalizeDirectory derives a feed with author and recipient profiles', () => {
  const directory = normalizeDirectory(sampleDirectory);

  assert.equal(directory.generation, 'Generation CH65');
  assert.equal(directory.profiles.length, 6);
  assert.equal(directory.feed.length, 1);
  assert.equal(directory.feed[0].recipient.username, 'anaid');
  assert.equal(directory.feed[0].author.username, 'antonio-m');
  assert.equal(directory.feed[0].coAuthors.length, 1);
  assert.equal(directory.feed[0].coAuthors[0].username, 'julio-c');
  assert.deepEqual(directory.feed[0].galleryImages, ['assets/memories/design-flow.webp', 'assets/memories/api-contract.webp']);
  assert.equal(directory.feed[0].comments[0].profile.username, 'antonio-m');
  assert.equal(directory.feed[0].comments[0].createdAt, '2026-05-10T12:00:00.000Z');
  assert.equal(directory.feed[0].comments[0].favCount, 3);
  assert.equal(directory.feed[0].comments[0].likedBy[0].username, 'anaid');
  assert.equal(directory.feed[0].comments[0].replies[0].profile.username, 'anaid');
  assert.equal(directory.feed[0].shoutout, 'Anaid kept the release grounded with calm, useful testing notes.');
});

test('normalizeDirectory derives a demo gallery when memory JSON omits one', () => {
  const directoryWithoutGallery = structuredClone(sampleDirectory);
  delete directoryWithoutGallery.profiles[1].memories[0].galleryImages;

  const directory = normalizeDirectory(directoryWithoutGallery);

  assert.equal(directory.feed[0].galleryImages.length, 4);
  assert.ok(directory.feed[0].galleryImages.every((image) => image.startsWith('/assets/memories/')));
});

test('normalizeDirectory caps coauthors at three profiles per memory', () => {
  const directoryWithCoauthors = structuredClone(sampleDirectory);
  directoryWithCoauthors.profiles[1].memories[0].coAuthors = ['julio-c', 'daniela-s', 'cleyri-v', 'jose-l'];

  const directory = normalizeDirectory(directoryWithCoauthors);

  assert.deepEqual(
    directory.feed[0].coAuthors.map((profile) => profile.username),
    ['julio-c', 'daniela-s', 'cleyri-v'],
  );
});

test('normalizeDirectory reports invalid data instead of crashing the UI', () => {
  const invalidDirectory = structuredClone(sampleDirectory);
  invalidDirectory.profiles[1].memories[0].body = 'x'.repeat(1001);
  invalidDirectory.profiles[1].memories[0].comments[0].profile = 'missing-user';

  const directory = normalizeDirectory(invalidDirectory);

  assert.equal(directory.feed.length, 0);
  assert.equal(directory.errors.length, 2);
  assert.match(directory.errors[0], /1000 characters/);
  assert.match(directory.errors[1], /Unknown comment profile/);
});

test('filterProfiles matches names, usernames, roles, and memory text', () => {
  const directory = normalizeDirectory(sampleDirectory);

  assert.deepEqual(
    filterProfiles(directory, 'qa').map((profile) => profile.username),
    ['anaid'],
  );
  assert.deepEqual(
    filterProfiles(directory, 'release grounded').map((profile) => profile.username),
    ['anaid'],
  );
});

test('summarizeDirectory returns premium overview metrics for the static experience', () => {
  const directory = normalizeDirectory(sampleDirectory);
  const summary = summarizeDirectory(directory);

  assert.equal(summary.profileCount, 6);
  assert.equal(summary.memoryCount, 1);
  assert.equal(summary.heartCount, 30);
  assert.equal(summary.commentCount, 2);
  assert.equal(summary.topProfiles[0].username, 'anaid');
});

test('comment helpers flatten nested threads for counters and previews', () => {
  const directory = normalizeDirectory(sampleDirectory);
  const comments = directory.feed[0].comments;

  assert.equal(countComments(comments), 2);
  assert.deepEqual(
    flattenComments(comments).map((comment) => comment.profile.username),
    ['antonio-m', 'anaid'],
  );
});
