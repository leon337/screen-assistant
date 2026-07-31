import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScaledSize, formatBytes, MAX_IMAGE_BYTES } from '../public/image.js';

test('reduz imagem horizontal respeitando dimensão máxima', () => {
  assert.deepEqual(calculateScaledSize(4000, 2000, 1600), { width: 1600, height: 800 });
});

test('reduz imagem vertical respeitando proporção', () => {
  assert.deepEqual(calculateScaledSize(1200, 2400, 1600), { width: 800, height: 1600 });
});

test('não amplia imagem pequena', () => {
  assert.deepEqual(calculateScaledSize(640, 480, 1600), { width: 640, height: 480 });
});

test('formata bytes para interface', () => {
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(2 * 1024 * 1024), '2.00 MB');
  assert.equal(MAX_IMAGE_BYTES, 2097152);
});
