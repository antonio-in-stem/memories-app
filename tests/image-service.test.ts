import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

import { compressImage, MAX_IMAGE_EDGE, validateImageFile } from '../server/services/images';

test('validateImageFile rejects unsupported image types', async () => {
  const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
  const result = await validateImageFile(file);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 415);
  }
});

test('compressImage converts to bounded webp and strips oversized dimensions', async () => {
  const input = await sharp({
    create: {
      width: 2600,
      height: 1400,
      channels: 3,
      background: '#9a54ff',
    },
  })
    .png()
    .toBuffer();

  const output = await compressImage(input);

  assert.equal(output.mimeType, 'image/webp');
  assert.equal(output.originalByteSize, input.byteLength);
  assert.ok(output.width <= MAX_IMAGE_EDGE);
  assert.ok(output.height <= MAX_IMAGE_EDGE);
  assert.ok(output.byteSize > 0);
  assert.ok(output.data.byteLength === output.byteSize);
});
