import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterProfiles,
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
          body: 'Anaid kept the release grounded with calm, useful testing notes.',
          image: 'assets/memories/demo.webp',
          heartCount: 30,
          comments: [
            {
              profile: 'antonio-m',
              body: 'A great teammate under pressure.',
              createdAt: '2026-05-10T12:00:00.000Z',
            },
          ],
        },
      ],
    },
  ],
};

test('normalizeDirectory derives a feed with author and recipient profiles', () => {
  const directory = normalizeDirectory(sampleDirectory);

  assert.equal(directory.generation, 'Generation CH65');
  assert.equal(directory.profiles.length, 2);
  assert.equal(directory.feed.length, 1);
  assert.equal(directory.feed[0].recipient.username, 'anaid');
  assert.equal(directory.feed[0].author.username, 'antonio-m');
  assert.equal(directory.feed[0].comments[0].profile.username, 'antonio-m');
  assert.equal(directory.feed[0].comments[0].createdAt, '2026-05-10T12:00:00.000Z');
  assert.equal(directory.feed[0].shoutout, 'Anaid kept the release grounded with calm, useful testing notes.');
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

  assert.equal(summary.profileCount, 2);
  assert.equal(summary.memoryCount, 1);
  assert.equal(summary.heartCount, 30);
  assert.equal(summary.commentCount, 1);
  assert.equal(summary.topProfiles[0].username, 'anaid');
});
