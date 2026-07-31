import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = await readFile(new URL('../vercel.json', import.meta.url), 'utf8');
test('permite câmera somente na própria aplicação', () => {
  assert.match(config, /camera=\(self\)/);
  assert.match(config, /microphone=\(\)/);
});
