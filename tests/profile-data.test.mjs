import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { normalizeDirectory } from '../js/data.js';

test('data/profiles.json follows the public data contract', async () => {
  const raw = JSON.parse(await readFile(new URL('../data/profiles.json', import.meta.url), 'utf8'));
  const directory = normalizeDirectory(raw);

  assert.equal(directory.errors.length, 0, directory.errors.join('\n'));
  assert.equal(directory.profiles.length, 18);
  assert.ok(directory.feed.length >= 1);
  assert.ok(directory.byUsername.has('antonio-m'));
  assert.ok(directory.byUsername.has('daniela-s'));
  assert.ok(directory.byUsername.has('julio-c'));
  assert.ok(directory.byUsername.has('cleyri-v'));
  assert.ok(directory.profiles.every((profile) => profile.profilePicture));
  assert.ok(directory.feed.every((memory) => memory.comments.every((comment) => comment.createdAt)));
});
