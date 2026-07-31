import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../api/v1/analyze-screen.js', import.meta.url), 'utf8');

test('backend continua aceitando apenas WebP e JPEG', () => {
  assert.match(api, /image\/webp/);
  assert.match(api, /image\/jpeg/);
});

test('prompt mantém leitura cautelosa', () => {
  assert.match(api, /não foi possível confirmar/i);
  assert.match(api, /Não invente/i);
});
