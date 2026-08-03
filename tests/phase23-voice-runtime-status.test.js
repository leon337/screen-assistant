import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync(new URL('../public/design.js', import.meta.url), 'utf8');
const marker = readFileSync(new URL('../public/voice-v23-build.js', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');

test('controles de voz expõem loading antes da importação e ready depois', () => {
  const loading = loader.indexOf("document.body.dataset.voiceControls = 'loading'");
  const moduleImport = loader.indexOf("await import('./voice-v23.js')");
  const markerImport = loader.indexOf("await import('./voice-v23-build.js')");
  const ready = loader.indexOf("document.body.dataset.voiceControls = 'ready'");

  assert.ok(loading >= 0);
  assert.ok(moduleImport > loading);
  assert.ok(markerImport > moduleImport);
  assert.ok(ready > markerImport);
});

test('marcador da fase 23 é verificável no DOM e publicado pela PWA', () => {
  assert.match(marker, /phase-23-voice-controls-1/);
  assert.match(marker, /document\.body\.dataset\.voiceBuild/);
  assert.match(serviceWorker, /screen-assistant-v23-voice-controls-hotfix-1/);
  assert.match(serviceWorker, /voice-v23-build\.js/);
});
