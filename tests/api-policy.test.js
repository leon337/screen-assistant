import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const profiles = await readFile(new URL('src/server/expert-profiles.js', root), 'utf8');
const validation = await readFile(new URL('src/server/validation.js', root), 'utf8');

test('backend continua aceitando apenas WebP e JPEG', () => {
  assert.match(validation, /image\/webp/);
  assert.match(validation, /image\/jpeg/);
});

test('prompt mantém leitura cautelosa', () => {
  assert.match(profiles, /não foi possível confirmar/i);
  assert.match(profiles, /Não invente/i);
});
