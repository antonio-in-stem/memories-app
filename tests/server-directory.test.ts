import test from 'node:test';
import assert from 'node:assert/strict';

import { recordsToDirectory } from '../server/directory-presenter';

test('recordsToDirectory maps relational records into the frontend Directory contract', () => {
  const directory = recordsToDirectory({
    generation: 'Generation CH65',
    profiles: [
      {
        id: 'profile-antonio',
        username: 'antonio-m',
        name: 'Antonio M.',
        image: '/assets/avatars/antonio.png',
        role: 'Applied Scientist',
      },
      {
        id: 'profile-anaid',
        username: 'anaid',
        name: 'Anaid',
        image: '/assets/avatars/anaid.png',
        role: 'QA Engineer',
      },
      {
        id: 'profile-julio',
        username: 'julio-c',
        name: 'Julio C.',
        image: '/assets/avatars/julio.png',
        role: 'Backend Developer',
      },
    ],
    memories: [
      {
        id: 'memory-1',
        authorId: 'profile-antonio',
        recipientId: 'profile-anaid',
        shoutout: 'Anaid made the release feel calm.',
        body: 'Anaid made the release feel calm with patient testing notes and sharp risk calls.',
        image: '/assets/memories/qa-notes.webp',
        heartCount: 9,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
        order: 0,
        author: { id: 'profile-antonio', username: 'antonio-m', name: 'Antonio M.', image: '/assets/avatars/antonio.png', role: 'Applied Scientist' },
        recipient: { id: 'profile-anaid', username: 'anaid', name: 'Anaid', image: '/assets/avatars/anaid.png', role: 'QA Engineer' },
        coAuthors: [
          {
            order: 0,
            profile: { id: 'profile-julio', username: 'julio-c', name: 'Julio C.', image: '/assets/avatars/julio.png', role: 'Backend Developer' },
          },
        ],
        galleryImages: [{ url: '/assets/memories/design-flow.webp', order: 0 }],
        likedBy: [
          {
            profile: { id: 'profile-julio', username: 'julio-c', name: 'Julio C.', image: '/assets/avatars/julio.png', role: 'Backend Developer' },
          },
        ],
        comments: [
          {
            id: 'comment-1',
            profileId: 'profile-julio',
            parentId: null,
            body: 'This helped the API team too.',
            favCount: 2,
            createdAt: new Date('2026-05-10T13:00:00.000Z'),
            order: 0,
            profile: { id: 'profile-julio', username: 'julio-c', name: 'Julio C.', image: '/assets/avatars/julio.png', role: 'Backend Developer' },
            likedBy: [
              {
                profile: { id: 'profile-antonio', username: 'antonio-m', name: 'Antonio M.', image: '/assets/avatars/antonio.png', role: 'Applied Scientist' },
              },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(directory.generation, 'Generation CH65');
  assert.equal(directory.profiles.length, 3);
  assert.equal(directory.feed.length, 1);
  assert.equal(directory.feed[0].author.username, 'antonio-m');
  assert.equal(directory.feed[0].recipient.username, 'anaid');
  assert.deepEqual(directory.feed[0].coAuthors.map((profile) => profile.username), ['julio-c']);
  assert.deepEqual(directory.feed[0].galleryImages, ['/assets/memories/design-flow.webp']);
  assert.deepEqual(directory.feed[0].likedBy.map((profile) => profile.username), ['julio-c']);
  assert.equal(directory.feed[0].comments[0].profile.username, 'julio-c');
  assert.equal(directory.feed[0].comments[0].likedBy[0].username, 'antonio-m');
});
