import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ANALYSIS_STAGES } from '../public/analysis.js';

const source = await readFile(new URL('../public/analysis.js', import.meta.url), 'utf8');

test('define todas as etapas de progresso', () => {
  assert.deepEqual(ANALYSIS_STAGES, ['prepare', 'send', 'analyze', 'fallback', 'format']);
});

test('usa sinal de cancelamento na requisição', () => {
  assert.match(source, /signal,/);
  assert.match(source, /setTimeout\(\(\) => onStage\('fallback'\)/);
});
