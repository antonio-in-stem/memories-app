import test from 'node:test';
import assert from 'node:assert/strict';

import { formatPlatformName } from '../lib/display-name';
import { shouldUseRequestHostForAuthUrl } from '../lib/auth-host';
import { getForwardedOrigin } from '../lib/request-origin';
import { parseCommentInput, parseMemoryInput } from '../server/services/mutations';

test('formatPlatformName keeps first name plus first surname initial', () => {
  assert.equal(formatPlatformName('Antonio Morales García'), 'Antonio M.');
  assert.equal(formatPlatformName('Daniela Sofía Ramos'), 'Daniela S.');
  assert.equal(formatPlatformName('  Cleyri   Pérez  '), 'Cleyri P.');
});

test('formatPlatformName falls back cleanly for single or missing names', () => {
  assert.equal(formatPlatformName('Julio'), 'Julio');
  assert.equal(formatPlatformName(''), 'LinkedIn Member');
  assert.equal(formatPlatformName(null), 'LinkedIn Member');
});

test('parseMemoryInput validates recipient and message limits', () => {
  const parsed = parseMemoryInput({
    recipientUsername: 'anaid',
    shoutout: 'Huge save in the release.',
    body: 'You caught the detail that saved the release.',
    image: '/assets/memories/qa-notes.webp',
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.data.recipientUsername, 'anaid');
    assert.equal(parsed.data.shoutout, 'Huge save in the release.');
    assert.equal(parsed.data.body, 'You caught the detail that saved the release.');
  }

  assert.equal(parseMemoryInput({ recipientUsername: '', body: 'Hello' }).ok, false);
  assert.equal(parseMemoryInput({ recipientUsername: 'anaid', body: 'x'.repeat(1001) }).ok, false);
});

test('parseCommentInput supports root comments and replies', () => {
  const parsed = parseCommentInput({
    memoryId: 'memory-1',
    parentId: 'comment-1',
    body: 'This thread deserves more context.',
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.data.memoryId, 'memory-1');
    assert.equal(parsed.data.parentId, 'comment-1');
    assert.equal(parsed.data.body, 'This thread deserves more context.');
  }

  assert.equal(parseCommentInput({ memoryId: 'memory-1', body: '' }).ok, false);
});

test('shouldUseRequestHostForAuthUrl ignores localhost in development for tunnel-safe auth', () => {
  assert.equal(shouldUseRequestHostForAuthUrl('http://localhost:3000', 'development'), true);
  assert.equal(shouldUseRequestHostForAuthUrl('http://127.0.0.1:3000', 'test'), true);
  assert.equal(shouldUseRequestHostForAuthUrl('https://memories.example.com', 'development'), false);
  assert.equal(shouldUseRequestHostForAuthUrl('http://localhost:3000', 'production'), false);
});

test('getForwardedOrigin prefers proxy host and protocol for public auth URLs', () => {
  const headers = new Headers({
    host: 'localhost:3000',
    'x-forwarded-host': 'demo.ngrok-free.app',
    'x-forwarded-proto': 'https',
  });

  assert.equal(getForwardedOrigin(headers, 'http://localhost:3000/api/auth/providers'), 'https://demo.ngrok-free.app');
});
