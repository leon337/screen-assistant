import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync(new URL('../public/design.js', import.meta.url), 'utf8');

test('controles de voz expõem loading antes da importação e ready depois', () => {
  const loading = loader.indexOf("document.body.dataset.voiceControls = 'loading'");
  const moduleImport = loader.indexOf("await import('./voice-v23.js')");
  const ready = loader.indexOf("document.body.dataset.voiceControls = 'ready'");

  assert.ok(loading >= 0);
  assert.ok(moduleImport > loading);
  assert.ok(ready > moduleImport);
});
