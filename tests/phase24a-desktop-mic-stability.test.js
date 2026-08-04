import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const stability = read('public/voice-desktop-stability-v24a.js');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('módulo de estabilidade desktop possui JavaScript válido', () => {
  const url = new URL('../public/voice-desktop-stability-v24a.js', import.meta.url);
  assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', url.pathname]));
});

test('botão visível é substituído para remover listeners e observador antigos', () => {
  assert.match(stability, /cloneNode\(true\)/);
  assert.match(stability, /currentButton\.replaceWith\(replacement\)/);
  assert.match(stability, /stableDesktopVoice/);
  assert.doesNotMatch(stability, /observe\(micButton/);
});

test('estado visual evita mutações repetidas no botão', () => {
  assert.match(stability, /micButton\.disabled !== disabled/);
  assert.match(stability, /getAttribute\('aria-pressed'\) !== desiredPressed/);
  assert.match(stability, /label\.textContent !== desiredLabel/);
  assert.match(stability, /setState\('idle'\)/);
});

test('gravação possui limite e watchdog de encerramento', () => {
  assert.match(stability, /MAX_RECORDING_MS = 5000/);
  assert.match(stability, /STOP_WATCHDOG_MS = 1500/);
  assert.match(stability, /window\.setTimeout\(stopRecording, MAX_RECORDING_MS\)/);
  assert.match(stability, /O microfone demorou para encerrar e foi reiniciado automaticamente/);
});

test('transcrição possui cancelamento e timeout controlado', () => {
  assert.match(stability, /TRANSCRIPTION_TIMEOUT_MS = 12000/);
  assert.match(stability, /new AbortController\(\)/);
  assert.match(stability, /signal: transcriptionController\.signal/);
  assert.match(stability, /A transcrição demorou demais e foi cancelada/);
});

test('desktop desarma o reconhecimento contínuo antigo', () => {
  assert.match(stability, /disarmLegacyRecognition/);
  assert.match(stability, /voice-command-toggle-v23/);
  assert.match(stability, /voice-command-panel-toggle-v23/);
  assert.match(stability, /toggle\.disabled = true/);
  assert.match(stability, /toggle\.hidden = true/);
});

test('execução do comando não mantém o botão preso em processamento', () => {
  assert.match(stability, /setState\('idle'\);\n    transcriptionController = null/);
  assert.match(stability, /queueMicrotask\(\(\) => dispatchCommand\(transcript\)\)/);
  assert.match(stability, /finally[\s\S]*state === 'processing'\) setState\('idle'\)/);
});

test('runtime e PWA publicam a camada de estabilidade após os hotfixes anteriores', () => {
  const desktopIndex = loader.indexOf("import('./voice-desktop-v24a.js')");
  const dockIndex = loader.indexOf("import('./voice-desktop-dock-hotfix-v24a.js')");
  const stabilityIndex = loader.indexOf("import('./voice-desktop-stability-v24a.js')");
  assert.ok(desktopIndex >= 0 && dockIndex > desktopIndex && stabilityIndex > dockIndex);
  assert.match(loader, /dataset\.voiceDesktopStability/);
  assert.match(serviceWorker, /screen-assistant-v24a-desktop-mic-stability-1/);
  assert.match(serviceWorker, /voice-desktop-stability-v24a\.js/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
});
